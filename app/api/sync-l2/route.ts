/**
 * ═══════════════════════════════════════════════════════════════
 * API ROUTE: /api/sync-l2
 * ═══════════════════════════════════════════════════════════════
 * 
 * DATA ARCHITECTURE: Casino Model
 * 
 * This endpoint provides:
 * 1. GET: Indexer status for monitoring
 * 2. POST: Manual trigger to sync RESOLVED markets/contests only
 * 
 * IMPORTANT: We do NOT sync active/live state to Supabase.
 * Active markets, bets, and balances live on L2 only.
 * Supabase receives data AFTER settlement.
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const L2_API_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * GET /api/sync-l2
 * Return indexer status and historical data counts
 */
export async function GET() {
  try {
    // Get indexer state
    const { data: state, error } = await supabase
      .from('indexer_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch indexer state' }, { status: 500 })
    }

    // Get event counts
    const { count: totalEvents } = await supabase
      .from('l2_events')
      .select('*', { count: 'exact', head: true })

    const { count: processedEvents } = await supabase
      .from('l2_events')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)

    // Get HISTORICAL table counts (not live state)
    const { count: resolvedMarketsCount } = await supabase
      .from('market_history')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const { count: settledBetsCount } = await supabase
      .from('bet_history')
      .select('*', { count: 'exact', head: true })

    const { count: settledContestsCount } = await supabase
      .from('contest_history')
      .select('*', { count: 'exact', head: true })

    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      indexer: state,
      architecture: {
        note: 'Supabase stores HISTORICAL data only. Active state is on L2.',
        l2_source: L2_API_URL
      },
      stats: {
        total_events: totalEvents || 0,
        processed_events: processedEvents || 0,
        resolved_markets: resolvedMarketsCount || 0,
        settled_bets: settledBetsCount || 0,
        settled_contests: settledContestsCount || 0,
        profiles: profilesCount || 0
      }
    })

  } catch (error) {
    console.error('❌ Error fetching sync status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/sync-l2
 * Manual sync trigger - ONLY for resolved/settled data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { market_id, sync_resolved } = body

    console.log('🔄 Manual sync triggered:', { market_id, sync_resolved })

    // If market_id specified, check if it's resolved before syncing
    if (market_id) {
      return await syncResolvedMarket(market_id)
    }

    // Sync all resolved markets
    if (sync_resolved) {
      return await syncAllResolvedMarkets()
    }

    return NextResponse.json({
      error: 'Invalid request',
      message: 'Specify market_id for a specific resolved market, or sync_resolved=true for all',
      architecture_note: 'Only RESOLVED markets are synced to Supabase. Active state stays on L2.'
    }, { status: 400 })

  } catch (error: any) {
    console.error('❌ Error in manual sync:', error)
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * Sync a resolved market from L2 to Supabase history
 */
async function syncResolvedMarket(marketId: string) {
  try {
    // Fetch market from L2
    const response = await fetch(`${L2_API_URL}/market/${marketId}`)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Market not found on L2' 
      }, { status: 404 })
    }

    const market = await response.json()

    // ONLY sync if resolved
    if (market.status !== 'resolved') {
      return NextResponse.json({
        error: 'Market not resolved',
        message: 'Only resolved markets can be synced to Supabase. Active markets stay on L2.',
        current_status: market.status,
        architecture_note: 'Query L2 directly for active market state.'
      }, { status: 400 })
    }

    // Sync to market_history
    const { data: marketData, error: marketError } = await supabase
      .from('market_history')
      .upsert({
        market_id: market.id || marketId,
        l2_contract_address: market.contract_address || 'L2_DEFAULT',
        question: market.question || market.title,
        description: market.description,
        category: market.category,
        status: 'resolved',
        resolved_outcome: market.winning_outcome || market.resolved_outcome,
        resolution_timestamp: market.resolution_timestamp,
        resolution_source: market.oracle_source || 'L2_ORACLE',
        total_liquidity: parseFloat(market.liquidity || 0),
        total_volume: parseFloat(market.volume || 0),
        total_bets: parseInt(market.participants || 0),
        creator_address: market.creator || 'UNKNOWN',
        image_url: market.image,
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'market_id' })
      .select('id')
      .single()

    if (marketError) throw marketError

    // Sync outcomes
    if (marketData && market.outcomes) {
      for (const outcome of market.outcomes) {
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
    }

    // Sync settled bets for this market
    await syncSettledBetsForMarket(marketId, marketData.id, market.winning_outcome || market.resolved_outcome)

    return NextResponse.json({
      success: true,
      message: `Resolved market ${marketId} synced to history`,
      market: marketData
    })

  } catch (error: any) {
    console.error(`❌ Error syncing resolved market ${marketId}:`, error)
    return NextResponse.json({ 
      error: 'Failed to sync market', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * Sync all resolved markets from L2
 */
async function syncAllResolvedMarkets() {
  try {
    // Fetch only resolved markets from L2
    const response = await fetch(`${L2_API_URL}/markets?status=resolved`)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch resolved markets from L2' 
      }, { status: 502 })
    }

    const markets = await response.json()
    const resolvedMarkets = (markets || []).filter((m: any) => m.status === 'resolved')
    
    console.log(`📊 Found ${resolvedMarkets.length} resolved markets on L2`)

    let syncedCount = 0
    let errorCount = 0

    // Get already synced markets
    const { data: existingMarkets } = await supabase
      .from('market_history')
      .select('market_id')
      .eq('status', 'resolved')
    
    const existingIds = new Set(existingMarkets?.map(m => m.market_id) || [])

    for (const market of resolvedMarkets) {
      const marketId = market.id || market.market_id
      
      // Skip if already synced
      if (existingIds.has(marketId)) {
        continue
      }

      try {
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
            resolution_timestamp: market.resolution_timestamp,
            resolution_source: market.oracle_source || 'L2_ORACLE',
            total_liquidity: parseFloat(market.liquidity || 0),
            total_volume: parseFloat(market.volume || 0),
            total_bets: parseInt(market.participants || 0),
            creator_address: market.creator || 'UNKNOWN',
            image_url: market.image,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'market_id' })
          .select('id')
          .single()

        if (marketError) throw marketError

        // Sync outcomes
        if (marketData && market.outcomes) {
          for (const outcome of market.outcomes) {
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
        }

        // Sync bets
        await syncSettledBetsForMarket(marketId, marketData.id, market.winning_outcome || market.resolved_outcome)

        syncedCount++
        console.log(`✅ Synced resolved: ${market.question || market.title}`)

      } catch (error) {
        console.error(`❌ Error syncing market ${marketId}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} resolved markets (${errorCount} errors)`,
      stats: {
        total_resolved: resolvedMarkets.length,
        newly_synced: syncedCount,
        already_synced: resolvedMarkets.length - syncedCount - errorCount,
        errors: errorCount
      },
      architecture_note: 'Only resolved markets synced. Active markets remain on L2.'
    })

  } catch (error: any) {
    console.error('❌ Error in syncAllResolvedMarkets:', error)
    return NextResponse.json({ 
      error: 'Failed to sync markets', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * Sync settled bets for a resolved market
 */
async function syncSettledBetsForMarket(l2MarketId: string, supabaseMarketId: string, winningOutcome: string) {
  try {
    const response = await fetch(`${L2_API_URL}/bets?market_id=${l2MarketId}`)
    if (!response.ok) return

    const bets = await response.json()
    const betList = bets.bets || bets || []

    for (const bet of betList) {
      const betOutcome = bet.outcome_id || bet.outcome
      const isWinner = betOutcome === winningOutcome
      const status = isWinner ? 'won' : 'lost'

      const { data: outcomeData } = await supabase
        .from('market_outcome_history')
        .select('id')
        .eq('market_id', supabaseMarketId)
        .eq('outcome_id', betOutcome)
        .single()

      await supabase
        .from('bet_history')
        .upsert({
          bet_id: bet.id || bet.bet_id,
          user_address: bet.user_address || bet.user,
          market_id: supabaseMarketId,
          outcome_id: outcomeData?.id,
          amount: parseFloat(bet.amount),
          potential_payout: parseFloat(bet.potential_payout || 0),
          odds_at_bet: parseFloat(bet.odds || 0),
          status: status,
          payout_amount: isWinner ? parseFloat(bet.potential_payout || 0) : 0,
          l2_transaction_hash: bet.transaction_hash || bet.id,
          settled_at: new Date().toISOString()
        }, { onConflict: 'bet_id' })

      // Ensure profile exists
      await supabase
        .from('profiles')
        .upsert({ wallet_address: bet.user_address || bet.user }, { onConflict: 'wallet_address', ignoreDuplicates: true })
    }

  } catch (error) {
    console.error('❌ Error syncing bets:', error)
  }
}
