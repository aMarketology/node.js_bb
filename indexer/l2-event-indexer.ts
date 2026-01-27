/**
 * ═══════════════════════════════════════════════════════════════
 * L2 EVENT INDEXER - MAIN SERVICE
 * ═══════════════════════════════════════════════════════════════
 * 
 * DATA ARCHITECTURE: Casino Model
 * 
 * Layer 2 (Redb) = The Table
 *   → Active $BB balances
 *   → Live contests/bets
 *   → Active entries
 *   → Playthrough tracking
 * 
 * Supabase = The Front Desk
 *   → Profiles (username, avatar, bio)
 *   → Fan Gold (social currency, $0 value)
 *   → SETTLED bet history (won/lost/refunded only)
 *   → RESOLVED market history
 *   → Contest results with oracle proof
 * 
 * WHAT THIS INDEXER DOES:
 *   1. Listen to L2 for SETTLEMENT events (not BetPlaced!)
 *   2. On MarketResolved: Sync market + bets to Supabase history
 *   3. Store oracle proof data for fairness verification
 *   4. Update profiles with historical stats (not live)
 * 
 * WHAT THIS INDEXER DOES NOT DO:
 *   ❌ Sync active bets (stay on L2)
 *   ❌ Sync live market state (stay on L2)
 *   ❌ Track live balances (stay on L2)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// ───────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────

const L2_API_URL = process.env.L2_API_URL || 'http://localhost:1234'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const POLL_INTERVAL_MS = parseInt(process.env.INDEXER_POLL_INTERVAL || '5000')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// ───────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ───────────────────────────────────────────────────────────────

interface L2Event {
  event_type: 'MarketResolved' | 'ContestSettled' | 'BetSettled' | 'Withdrawal'
  timestamp: string
  block_number: number
  transaction_hash: string
  data: any
}

interface IndexerState {
  last_synced_block: number
  last_synced_at: string
  total_events_processed: number
  status: 'running' | 'paused' | 'error'
  error_message?: string
}

// ───────────────────────────────────────────────────────────────
// STATE MANAGEMENT
// ───────────────────────────────────────────────────────────────

let isRunning = false
let lastSyncedBlock = 0

async function loadIndexerState(): Promise<IndexerState> {
  const { data, error } = await supabase
    .from('indexer_state')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('❌ Failed to load indexer state:', error)
    return {
      last_synced_block: 0,
      last_synced_at: new Date().toISOString(),
      total_events_processed: 0,
      status: 'running'
    }
  }

  return data
}

async function updateIndexerState(updates: Partial<IndexerState>) {
  const { error } = await supabase
    .from('indexer_state')
    .update(updates)
    .eq('id', 1)

  if (error) {
    console.error('❌ Failed to update indexer state:', error)
  }
}

// ───────────────────────────────────────────────────────────────
// L2 EVENT FETCHING
// ───────────────────────────────────────────────────────────────

/**
 * Fetch SETTLEMENT events from L2
 * We only care about: MarketResolved, ContestSettled, BetSettled
 * NOT: BetPlaced, MarketCreated (those stay on L2 until settled)
 */
async function fetchL2SettlementEvents(fromBlock: number): Promise<L2Event[]> {
  try {
    // Query L2 for settlement events only
    const response = await fetch(`${L2_API_URL}/events/settlements?from_block=${fromBlock}`)
    
    if (!response.ok) {
      // Fallback: poll resolved markets endpoint
      return await fetchResolvedMarkets(fromBlock)
    }

    const data = await response.json() as { events?: L2Event[] }
    return data.events || []
    
  } catch (error) {
    console.error('❌ Error fetching L2 settlement events:', error)
    return await fetchResolvedMarkets(fromBlock)
  }
}

/**
 * Fallback: Poll for resolved markets
 */
async function fetchResolvedMarkets(fromBlock: number): Promise<L2Event[]> {
  const events: L2Event[] = []
  
  try {
    const response = await fetch(`${L2_API_URL}/markets?status=resolved`)
    if (!response.ok) return events

    const markets = await response.json() as any[]
    
    // Check which markets we haven't indexed yet
    const { data: existingMarkets } = await supabase
      .from('market_history')
      .select('market_id')
      .eq('status', 'resolved')

    const existingIds = new Set(existingMarkets?.map(m => m.market_id) || [])

    for (const market of markets) {
      const marketId = market.id || market.market_id
      if (!existingIds.has(marketId) && market.status === 'resolved') {
        events.push({
          event_type: 'MarketResolved',
          timestamp: market.resolution_timestamp || new Date().toISOString(),
          block_number: fromBlock + 1,
          transaction_hash: `resolve_${marketId}_${Date.now()}`,
          data: market
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching resolved markets:', error)
  }
  
  return events
}

// ───────────────────────────────────────────────────────────────
// EVENT PROCESSORS - SETTLEMENT ONLY
// ───────────────────────────────────────────────────────────────

/**
 * Process MarketResolved event
 * This syncs the FINAL market state + all bets to history tables
 */
async function processMarketResolved(event: L2Event) {
  const market = event.data
  const marketId = market.id || market.market_id
  
  console.log(`🏁 [Settlement] Market resolved: ${market.question || marketId}`)
  console.log(`   Winner: ${market.winning_outcome || market.resolved_outcome}`)

  // 1. Sync market to market_history
  const { data: marketData, error: marketError } = await supabase
    .from('market_history')
    .upsert({
      market_id: marketId,
      l2_contract_address: market.contract_address || 'L2_DEFAULT',
      question: market.question || market.title,
      description: market.description,
      category: market.category,
      status: 'resolved',
      resolved_outcome: market.winning_outcome || market.resolved_outcome,
      resolution_timestamp: event.timestamp,
      resolution_source: market.oracle_source || 'L2_ORACLE',
      total_liquidity: parseFloat(market.final_liquidity || market.liquidity || 0),
      total_volume: parseFloat(market.total_volume || market.volume || 0),
      total_bets: parseInt(market.total_bets || market.participants || 0),
      creator_address: market.creator || 'UNKNOWN',
      image_url: market.image,
      last_synced_at: new Date().toISOString(),
      last_synced_block: event.block_number
    }, { onConflict: 'market_id' })
    .select('id')
    .single()

  if (marketError) {
    console.error('❌ Failed to sync market to history:', marketError)
    throw marketError
  }

  // 2. Sync outcomes to market_outcome_history
  const outcomes = market.outcomes || []
  for (const outcome of outcomes) {
    await supabase
      .from('market_outcome_history')
      .upsert({
        market_id: marketData.id,
        outcome_id: outcome.id || outcome.name,
        outcome_name: outcome.name,
        current_odds: parseFloat(outcome.final_odds || outcome.odds || 0),
        total_liquidity: parseFloat(outcome.liquidity || 0),
        total_bets: parseInt(outcome.bets || 0),
        total_volume: parseFloat(outcome.volume || 0)
      }, { onConflict: 'market_id,outcome_id' })
  }

  // 3. Fetch all bets for this market from L2 and sync to history
  await syncSettledBets(marketId, marketData.id, market.winning_outcome || market.resolved_outcome)

  console.log(`✅ [Settlement] Market synced to history: ${marketId}`)
}

/**
 * Sync settled bets from L2 to bet_history
 * Only called AFTER market resolution
 */
async function syncSettledBets(l2MarketId: string, supabaseMarketId: string, winningOutcome: string) {
  try {
    // Fetch all bets for this market from L2
    const response = await fetch(`${L2_API_URL}/bets?market_id=${l2MarketId}`)
    if (!response.ok) {
      console.warn(`⚠️ Could not fetch bets for market ${l2MarketId}`)
      return
    }

    const bets = await response.json() as any
    const betList = (bets.bets || bets || []) as any[]

    console.log(`   Syncing ${betList.length} settled bets...`)

    for (const bet of betList) {
      // Determine if this bet won
      const betOutcome = bet.outcome_id || bet.outcome
      const isWinner = betOutcome === winningOutcome
      const status = isWinner ? 'won' : 'lost'
      const payoutAmount = isWinner ? parseFloat(bet.potential_payout || bet.payout || 0) : 0

      // Get outcome UUID
      const { data: outcomeData } = await supabase
        .from('market_outcome_history')
        .select('id')
        .eq('market_id', supabaseMarketId)
        .eq('outcome_id', betOutcome)
        .single()

      // Insert into bet_history (settled only)
      const { error: betError } = await supabase
        .from('bet_history')
        .upsert({
          bet_id: bet.id || bet.bet_id,
          user_address: bet.user_address || bet.user,
          market_id: supabaseMarketId,
          outcome_id: outcomeData?.id,
          amount: parseFloat(bet.amount),
          potential_payout: parseFloat(bet.potential_payout || 0),
          odds_at_bet: parseFloat(bet.odds || 0),
          status: status,  // 'won' or 'lost' - NEVER 'active'
          payout_amount: payoutAmount,
          l2_transaction_hash: bet.transaction_hash || bet.id,
          l2_block_number: bet.block_number,
          l2_timestamp: bet.timestamp,
          settled_at: new Date().toISOString()
        }, { onConflict: 'bet_id' })

      if (betError) {
        console.error(`❌ Failed to sync bet ${bet.id}:`, betError)
      }

      // Ensure profile exists (minimal data - no live stats)
      await supabase
        .from('profiles')
        .upsert({
          wallet_address: bet.user_address || bet.user,
          updated_at: new Date().toISOString()
        }, { onConflict: 'wallet_address', ignoreDuplicates: true })
    }

    console.log(`   ✅ ${betList.length} bets synced to history`)

  } catch (error) {
    console.error('❌ Error syncing settled bets:', error)
  }
}

/**
 * Process ContestSettled event
 * Syncs contest results + entries to history tables
 */
async function processContestSettled(event: L2Event) {
  const contest = event.data
  const contestId = contest.id || contest.contest_id
  
  console.log(`🏆 [Settlement] Contest settled: ${contest.title || contestId}`)

  // 1. Sync to contest_history
  const { data: contestData, error: contestError } = await supabase
    .from('contest_history')
    .upsert({
      contest_id: contestId,
      title: contest.title,
      contest_type: contest.type || 'duel',
      category: contest.category,
      entry_fee: parseFloat(contest.entry_fee),
      prize_pool: parseFloat(contest.prize_pool),
      rake_amount: parseFloat(contest.rake || 0),
      participants_count: contest.participants?.length || 0,
      status: 'settled',
      winner_addresses: contest.winners || [],
      payout_distribution: contest.payout_structure,
      oracle_source: contest.oracle_source,
      oracle_data: contest.oracle_proof,  // Store fairness proof!
      oracle_signature: contest.oracle_signature,
      started_at: contest.started_at,
      ended_at: contest.ended_at,
      settled_at: new Date().toISOString()
    }, { onConflict: 'contest_id' })
    .select('id')
    .single()

  if (contestError) {
    console.error('❌ Failed to sync contest to history:', contestError)
    throw contestError
  }

  // 2. Sync all entries to contest_entry_history
  const entries = contest.entries || []
  for (const entry of entries) {
    const isWinner = (contest.winners || []).includes(entry.user_address)
    
    await supabase
      .from('contest_entry_history')
      .upsert({
        entry_id: entry.id || `${contestId}_${entry.user_address}`,
        contest_id: contestData.id,
        user_address: entry.user_address,
        selection: entry.picks || entry.selection,
        final_score: parseFloat(entry.final_score || 0),
        final_rank: entry.rank,
        entry_fee_paid: parseFloat(contest.entry_fee),
        payout_received: parseFloat(entry.payout || 0),
        result: isWinner ? 'win' : 'loss',
        entered_at: entry.entered_at,
        settled_at: new Date().toISOString()
      }, { onConflict: 'entry_id' })
  }

  console.log(`✅ [Settlement] Contest synced: ${contestId} with ${entries.length} entries`)
}

/**
 * Main event processor - SETTLEMENT EVENTS ONLY
 */
async function processEvent(event: L2Event) {
  try {
    // Store raw event
    await supabase.from('l2_events').insert({
      event_type: event.event_type,
      l2_transaction_hash: event.transaction_hash,
      l2_block_number: event.block_number,
      l2_timestamp: event.timestamp,
      event_data: event.data,
      processed: false
    })
    
    // Process settlement events only
    switch (event.event_type) {
      case 'MarketResolved':
        await processMarketResolved(event)
        break
      case 'ContestSettled':
        await processContestSettled(event)
        break
      case 'BetSettled':
        // Individual bet settlement (refunds, etc.)
        console.log('💰 BetSettled event - individual settlement')
        break
      case 'Withdrawal':
        // L1 withdrawal completed - for audit trail
        console.log('🏦 Withdrawal event recorded')
        break
      default:
        // IGNORE: BetPlaced, MarketCreated, ContestCreated
        // These are ACTIVE state - they stay on L2 until settlement
        console.log(`⏭️ Ignoring active-state event: ${event.event_type}`)
    }
    
    // Mark as processed
    await supabase
      .from('l2_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('l2_transaction_hash', event.transaction_hash)
    
  } catch (error: any) {
    console.error(`❌ Error processing event ${event.event_type}:`, error)
    
    await supabase
      .from('l2_events')
      .update({ processed: false, error_message: error.message })
      .eq('l2_transaction_hash', event.transaction_hash)
    
    throw error
  }
}

// ───────────────────────────────────────────────────────────────
// MAIN SYNC LOOP
// ───────────────────────────────────────────────────────────────

async function syncL2Events() {
  if (isRunning) {
    console.log('⏭️ Sync already running, skipping...')
    return
  }
  
  isRunning = true
  console.log('🔄 Checking for settlement events...')
  
  try {
    const state = await loadIndexerState()
    lastSyncedBlock = state.last_synced_block
    
    // Fetch SETTLEMENT events only
    const events = await fetchL2SettlementEvents(lastSyncedBlock)
    
    if (events.length === 0) {
      console.log('✅ No new settlements')
      return
    }
    
    console.log(`📥 Found ${events.length} settlement events`)
    
    for (const event of events) {
      await processEvent(event)
      if (event.block_number > lastSyncedBlock) {
        lastSyncedBlock = event.block_number
      }
    }
    
    await updateIndexerState({
      last_synced_block: lastSyncedBlock,
      last_synced_at: new Date().toISOString(),
      total_events_processed: state.total_events_processed + events.length,
      status: 'running'
    })
    
    console.log(`✅ Processed ${events.length} settlements`)
    
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    await updateIndexerState({ status: 'error', error_message: error.message })
  } finally {
    isRunning = false
  }
}

// ───────────────────────────────────────────────────────────────
// SERVER LIFECYCLE
// ───────────────────────────────────────────────────────────────

export async function startIndexer() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  L2 SETTLEMENT INDEXER - STARTING')
  console.log('  (Only syncs RESOLVED markets & SETTLED bets to Supabase)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`L2 API: ${L2_API_URL}`)
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Poll Interval: ${POLL_INTERVAL_MS}ms`)
  console.log('───────────────────────────────────────────────────────────────')
  
  await syncL2Events()
  
  setInterval(syncL2Events, POLL_INTERVAL_MS)
  
  console.log('✅ Settlement indexer started')
}

export async function stopIndexer() {
  console.log('🛑 Stopping indexer...')
  await updateIndexerState({ status: 'paused' })
  process.exit(0)
}

process.on('SIGINT', stopIndexer)
process.on('SIGTERM', stopIndexer)

if (require.main === module) {
  startIndexer().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}
