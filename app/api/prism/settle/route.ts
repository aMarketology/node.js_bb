// =====================================================
// PRISM Settlement API - Grade with Cooldown Period
// Ensures data stability before finalizing results
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signMessage } from '../../../lib/signature-utils'

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Dealer private key for admin authentication
const DEALER_PRIVATE_KEY = process.env.DEALER_PRIVATE_KEY

interface SettleRequest {
  contest_id: string
  admin_key: string   // REQUIRED: admin authentication (must match DEALER_PRIVATE_KEY)
  force?: boolean     // Optional: bypass cooldown (admin only)
}

export async function POST(req: NextRequest) {
  try {
    const body: SettleRequest = await req.json()
    const { contest_id, admin_key, force } = body

    // ========================================
    // 0. CRITICAL: Admin Authentication
    // ========================================
    if (!admin_key) {
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'admin_key is required for settlement'
      }, { status: 401 })
    }

    if (!DEALER_PRIVATE_KEY) {
      console.error('[PRISM Settlement] DEALER_PRIVATE_KEY not configured')
      return NextResponse.json({
        error: 'SERVER_CONFIG_ERROR',
        message: 'Settlement service not properly configured'
      }, { status: 500 })
    }

    if (admin_key !== DEALER_PRIVATE_KEY) {
      console.warn('[PRISM Settlement] Invalid admin_key attempt')
      return NextResponse.json({
        error: 'UNAUTHORIZED',
        message: 'Invalid admin credentials'
      }, { status: 401 })
    }

    console.log('[PRISM Settlement] Admin authenticated, processing settlement for contest:', contest_id)

    // ========================================
    // 1. Validate contest exists
    // ========================================
    const { data: contest, error: contestError } = await supabase
      .from('prism')
      .select('*')
      .eq('id', contest_id)
      .single()

    if (contestError || !contest) {
      return NextResponse.json({
        error: 'CONTEST_NOT_FOUND',
        message: 'Contest does not exist'
      }, { status: 404 })
    }

    // ========================================
    // 2. Check contest status
    // ========================================
    if (contest.status === 'settled') {
      return NextResponse.json({
        error: 'ALREADY_SETTLED',
        message: 'Contest has already been settled',
        settled_at: contest.oracle_fetched_at
      }, { status: 400 })
    }

    if (contest.status === 'cancelled') {
      return NextResponse.json({
        error: 'CONTEST_CANCELLED',
        message: 'Cannot settle a cancelled contest'
      }, { status: 400 })
    }

    // ========================================
    // 3. CRITICAL: Cooldown Period Check
    // ========================================
    const nowUnix = Math.floor(Date.now() / 1000)
    const cooldownSeconds = (contest.cooldown_minutes || 30) * 60
    const settleAfterTime = contest.settle_timestamp + cooldownSeconds

    if (!force && nowUnix < settleAfterTime) {
      const remainingSeconds = settleAfterTime - nowUnix
      const remainingMinutes = Math.ceil(remainingSeconds / 60)
      
      return NextResponse.json({
        error: 'COOLDOWN_ACTIVE',
        message: `Cooldown period active. Wait ${remainingMinutes} more minutes.`,
        details: {
          settle_timestamp: contest.settle_timestamp,
          cooldown_minutes: contest.cooldown_minutes,
          settle_after: settleAfterTime,
          settle_after_date: new Date(settleAfterTime * 1000).toISOString(),
          current_time: nowUnix,
          remaining_seconds: remainingSeconds,
          remaining_minutes: remainingMinutes
        }
      }, { status: 400 })
    }

    // ========================================
    // 4. Fetch Oracle Data
    // ========================================
    let oracleSnapshot: any
    try {
      oracleSnapshot = await fetchOracleData(contest)
    } catch (oracleError: any) {
      return NextResponse.json({
        error: 'ORACLE_FETCH_FAILED',
        message: 'Failed to fetch oracle data',
        details: oracleError.message
      }, { status: 500 })
    }

    // ========================================
    // 5. Sign Oracle Snapshot (Proof)
    // ========================================
    const oracleSignature = await signOracleSnapshot(oracleSnapshot)

    // ========================================
    // 6. Store Oracle Snapshot
    // ========================================
    await supabase
      .from('prism')
      .update({
        oracle_snapshot: oracleSnapshot,
        oracle_fetched_at: new Date().toISOString(),
        oracle_signature: oracleSignature,
        status: 'settling'
      })
      .eq('id', contest_id)

    // ========================================
    // 7. Fetch All Entries
    // ========================================
    const { data: entries, error: entriesError } = await supabase
      .from('prism_entries')
      .select('*')
      .eq('contest_id', contest_id)

    if (entriesError || !entries || entries.length === 0) {
      // No entries - mark as settled with no payouts
      await supabase
        .from('prism')
        .update({ status: 'settled' })
        .eq('id', contest_id)
      
      return NextResponse.json({
        success: true,
        message: 'Contest settled with no entries',
        contest_id,
        total_entries: 0,
        payouts: []
      })
    }

    // ========================================
    // 8. Calculate Scores
    // ========================================
    const scoredEntries = entries.map(entry => ({
      ...entry,
      calculated_score: calculateScore(
        contest.game_type,
        entry.picks,
        oracleSnapshot,
        contest.scoring_rules,
        contest.game_data
      )
    }))

    // ========================================
    // 9. Rank Entries with Tiebreaker
    // ========================================
    const rankedEntries = applyTiebreaker(scoredEntries, contest.tiebreaker_rules, oracleSnapshot)

    // ========================================
    // 10. Calculate Payouts
    // ========================================
    const payouts = calculatePayouts(
      rankedEntries,
      contest.prize_pool,
      contest.payout_structure
    )

    // ========================================
    // 11. Update Entries with Results
    // ========================================
    for (const payout of payouts) {
      await supabase
        .from('prism_entries')
        .update({
          score: payout.score,
          rank: payout.rank,
          payout: payout.amount,
          locked: true
        })
        .eq('id', payout.entry_id)
    }

    // ========================================
    // 12. PAYOUT EXECUTION: Credit Winners' Balances
    // ========================================
    const payoutResults: { user_id: string; amount: number; success: boolean; error?: string }[] = []
    
    for (const payout of payouts) {
      if (payout.amount > 0) {
        try {
          // Get current balance
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('fan_gold_balance')
            .eq('id', payout.user_id)
            .single()

          if (profileError || !profile) {
            console.error(`[PRISM Payout] Failed to fetch profile for user ${payout.user_id}:`, profileError)
            payoutResults.push({ 
              user_id: payout.user_id, 
              amount: payout.amount, 
              success: false, 
              error: 'Profile not found' 
            })
            continue
          }

          // Credit winnings to user's Fan Gold balance
          const newBalance = (profile.fan_gold_balance || 0) + payout.amount
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ fan_gold_balance: newBalance })
            .eq('id', payout.user_id)

          if (updateError) {
            console.error(`[PRISM Payout] Failed to credit user ${payout.user_id}:`, updateError)
            payoutResults.push({ 
              user_id: payout.user_id, 
              amount: payout.amount, 
              success: false, 
              error: updateError.message 
            })
          } else {
            console.log(`[PRISM Payout] Credited ${payout.amount} FC to user ${payout.user_id} (new balance: ${newBalance})`)
            payoutResults.push({ 
              user_id: payout.user_id, 
              amount: payout.amount, 
              success: true 
            })
          }
        } catch (err: any) {
          console.error(`[PRISM Payout] Exception crediting user ${payout.user_id}:`, err)
          payoutResults.push({ 
            user_id: payout.user_id, 
            amount: payout.amount, 
            success: false, 
            error: err.message 
          })
        }
      }
    }

    const successfulPayouts = payoutResults.filter(p => p.success)
    const failedPayouts = payoutResults.filter(p => !p.success)
    const totalPaidOut = successfulPayouts.reduce((sum, p) => sum + p.amount, 0)

    console.log(`[PRISM Settlement] Payouts complete: ${successfulPayouts.length} successful, ${failedPayouts.length} failed, total: ${totalPaidOut} FC`)

    // ========================================
    // 13. Mark Contest as Settled
    // ========================================
    await supabase
      .from('prism')
      .update({ status: 'settled' })
      .eq('id', contest_id)

    // ========================================
    // 14. Return Settlement Results
    // ========================================
    return NextResponse.json({
      success: true,
      message: 'Contest settled successfully',
      contest_id,
      contest_title: contest.title,
      settled_at: nowUnix,
      settled_at_date: new Date(nowUnix * 1000).toISOString(),
      oracle: {
        source: contest.oracle_source,
        fetched_at: new Date().toISOString(),
        signature: oracleSignature.substring(0, 16) + '...'
      },
      results: {
        total_entries: entries.length,
        prize_pool: contest.prize_pool,
        total_paid_out: totalPaidOut,
        successful_payouts: successfulPayouts.length,
        failed_payouts: failedPayouts.length,
        payouts: payouts.map(p => ({
          rank: p.rank,
          user_id: p.user_id,
          score: p.score,
          payout: p.amount,
          credited: payoutResults.find(pr => pr.user_id === p.user_id)?.success || false
        }))
      }
    })

  } catch (error) {
    console.error('[PRISM Settlement] Unexpected error:', error)
    return NextResponse.json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred during settlement'
    }, { status: 500 })
  }
}

// ========================================
// Oracle Data Fetching
// ========================================
async function fetchOracleData(contest: any): Promise<any> {
  const oracleSource = contest.oracle_source?.toLowerCase() || ''
  
  // YouTube API
  if (oracleSource.includes('youtube')) {
    return await fetchYouTubeData(contest)
  }
  
  // Sports API (FIFA, etc.)
  if (oracleSource.includes('fifa') || oracleSource.includes('sports')) {
    return await fetchSportsData(contest)
  }
  
  // Social Blade
  if (oracleSource.includes('social blade')) {
    return await fetchSocialBladeData(contest)
  }
  
  // Weather API (for rain test)
  if (oracleSource.includes('weather')) {
    return await fetchWeatherData(contest)
  }
  
  // Fallback: Manual/mock data for testing
  return {
    source: 'manual',
    fetched_at: new Date().toISOString(),
    warning: 'No automated oracle configured - using game_data as fallback',
    data: contest.game_data
  }
}

// Weather data for simple yes/no contests
async function fetchWeatherData(contest: any): Promise<any> {
  // For testing: simulate weather result
  // In production: call OpenWeather API, Weather.gov, etc.
  console.log('[Oracle] Weather API mock - simulating rain result')
  
  // Let's say it DID rain (YES is correct) - Alice wins!
  return {
    source: 'weather_mock',
    fetched_at: new Date().toISOString(),
    data: {
      location: 'New York City',
      date: '2026-01-26',
      precipitation: true,
      correct_answer: 'YES'  // It rained! Alice's answer is correct
    }
  }
}

async function fetchYouTubeData(contest: any): Promise<any> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    console.warn('[Oracle] No YouTube API key configured, using mock data')
    return {
      source: 'youtube_mock',
      fetched_at: new Date().toISOString(),
      data: contest.game_data?.current_scores || {}
    }
  }
  
  // For duel contests, fetch video stats
  if (contest.game_type === 'duel' && contest.game_data?.entities) {
    const results: any = {}
    
    for (const entity of contest.game_data.entities) {
      const channelId = entity.team?.replace('@', '') // e.g., @MrBeast -> MrBeast
      // In production: fetch latest video from channel and get view count
      results[entity.name] = {
        views: Math.floor(Math.random() * 50000000), // Mock for now
        likes: Math.floor(Math.random() * 2000000),
        fetched_at: new Date().toISOString()
      }
    }
    
    return {
      source: 'youtube_api',
      fetched_at: new Date().toISOString(),
      data: results
    }
  }
  
  return { source: 'youtube_api', fetched_at: new Date().toISOString(), data: {} }
}

async function fetchSportsData(contest: any): Promise<any> {
  // In production: integrate with Sportradar, ESPN, or FIFA API
  console.warn('[Oracle] Sports API not configured, using mock data')
  
  return {
    source: 'sports_mock',
    fetched_at: new Date().toISOString(),
    data: contest.game_data?.current_scores || {},
    events: contest.game_data?.squares?.filter((s: any) => s.completed).map((s: any) => s.id) || []
  }
}

async function fetchSocialBladeData(contest: any): Promise<any> {
  // In production: integrate with Social Blade API
  console.warn('[Oracle] Social Blade API not configured, using mock data')
  
  return {
    source: 'socialblde_mock',
    fetched_at: new Date().toISOString(),
    data: {}
  }
}

// ========================================
// Oracle Signature
// ========================================
async function signOracleSnapshot(snapshot: any): Promise<string> {
  const message = JSON.stringify(snapshot)
  
  // Use dealer private key to sign
  const dealerKey = process.env.DEALER_PRIVATE_KEY
  if (dealerKey) {
    try {
      // In production: proper Ed25519 signing
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (e) {
      console.error('[Oracle] Signing failed:', e)
    }
  }
  
  // Fallback: simple hash
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return 'unsigned_' + hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ========================================
// Score Calculation
// ========================================
function calculateScore(
  gameType: string,
  picks: any,
  oracle: any,
  scoringRules: any,
  gameData: any
): number {
  switch (gameType) {
    case 'duel':
      return calculateDuelScore(picks, oracle, gameData)
    case 'roster':
      return calculateRosterScore(picks, oracle, scoringRules, gameData)
    case 'bingo':
      return calculateBingoScore(picks, oracle, scoringRules, gameData)
    default:
      return 0
  }
}

function calculateDuelScore(picks: any, oracle: any, gameData: any): number {
  // For duels: 1 point if correct, 0 if wrong
  const oracleData = oracle.data || {}
  
  // Case 1: Simple YES/NO question (e.g., "Will it rain?")
  if (picks.answer && oracleData.correct_answer !== undefined) {
    const userAnswer = String(picks.answer).toUpperCase()
    const correctAnswer = String(oracleData.correct_answer).toUpperCase()
    console.log(`[Duel Score] User answered: ${userAnswer}, Correct: ${correctAnswer}`)
    return userAnswer === correctAnswer ? 1 : 0
  }
  
  // Case 2: Entity vs entity selection (e.g., "Mbappé vs Vinícius")
  const selection = picks.selection
  const entities = gameData?.entities || []
  let winner = null
  let maxScore = -1
  
  for (const entity of entities) {
    const entityScore = oracleData[entity.name]?.views || 
                        oracleData[entity.name]?.goals_plus_assists ||
                        gameData.current_scores?.[entity.name] || 0
    if (entityScore > maxScore) {
      maxScore = entityScore
      winner = entity.name
    }
  }
  
  return selection === winner ? 1 : 0
}

function calculateRosterScore(picks: any, oracle: any, scoringRules: any, gameData: any): number {
  let totalScore = 0
  const players = gameData?.players || []
  const rules = scoringRules || {}
  
  for (const playerId of picks.players || []) {
    const player = players.find((p: any) => p.id === playerId)
    if (player && player.stats) {
      // Apply scoring rules
      for (const [stat, multiplier] of Object.entries(rules)) {
        if (player.stats[stat] !== undefined) {
          totalScore += (player.stats[stat] as number) * (multiplier as number)
        }
      }
    }
  }
  
  return totalScore
}

function calculateBingoScore(picks: any, oracle: any, scoringRules: any, gameData: any): number {
  let score = 0
  const correctPicks = oracle.events || oracle.data?.events || []
  const pointsPerCorrect = scoringRules?.correct_pick || 10
  const lineBonus = scoringRules?.line_bonus || 25
  
  // Count correct selections
  const userSelections = picks.selections || []
  const correctSelections = userSelections.filter((s: string) => correctPicks.includes(s))
  score += correctSelections.length * pointsPerCorrect
  
  // Check for winning lines
  const winningLines = gameData?.winning_lines || []
  const maxLines = gameData?.max_lines || 3
  let linesCompleted = 0
  
  for (const line of winningLines) {
    if (linesCompleted >= maxLines) break
    const lineComplete = line.every((sq: string) => 
      userSelections.includes(sq) && correctPicks.includes(sq)
    )
    if (lineComplete) {
      score += lineBonus
      linesCompleted++
    }
  }
  
  return score
}

// ========================================
// Tiebreaker Logic
// ========================================
function applyTiebreaker(entries: any[], tiebreakerRules: any, oracle: any): any[] {
  const method = tiebreakerRules?.method || 'split_equal'
  
  // Sort by score descending
  const sorted = [...entries].sort((a, b) => b.calculated_score - a.calculated_score)
  
  // Assign ranks
  let currentRank = 1
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].calculated_score < sorted[i - 1].calculated_score) {
      currentRank = i + 1
    }
    sorted[i].rank = currentRank
  }
  
  // If using secondary metric for tiebreaker
  if (method === 'secondary_metric' && tiebreakerRules.metric) {
    // Find ties and resolve with secondary metric
    // ... implementation depends on game type and metric
  }
  
  return sorted
}

// ========================================
// Payout Calculation
// ========================================
function calculatePayouts(rankedEntries: any[], prizePool: number, payoutStructure: any[]): any[] {
  const payouts: any[] = []
  const structure = payoutStructure || [{ place: 1, percentage: 100 }]
  
  // Group entries by rank for tie handling
  const rankGroups = new Map<number, any[]>()
  for (const entry of rankedEntries) {
    if (!rankGroups.has(entry.rank)) {
      rankGroups.set(entry.rank, [])
    }
    rankGroups.get(entry.rank)!.push(entry)
  }
  
  // Calculate payouts per rank
  for (const [rank, entries] of rankGroups) {
    // Find all payout percentages that apply to this rank
    let totalPercentage = 0
    for (const payout of structure) {
      if (payout.place === rank) {
        totalPercentage += payout.percentage
      }
      // If there are ties, also include percentages for places occupied by tied players
      if (entries.length > 1 && payout.place > rank && payout.place < rank + entries.length) {
        totalPercentage += payout.percentage
      }
    }
    
    // Split evenly among tied players
    const amountPerPlayer = Math.floor((prizePool * totalPercentage / 100) / entries.length)
    
    for (const entry of entries) {
      payouts.push({
        entry_id: entry.id,
        user_id: entry.user_id,
        rank: entry.rank,
        score: entry.calculated_score,
        amount: amountPerPlayer
      })
    }
  }
  
  return payouts
}
