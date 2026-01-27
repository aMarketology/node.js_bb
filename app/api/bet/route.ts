/**
 * ═══════════════════════════════════════════════════════════════
 * API ROUTE: /api/bet
 * ═══════════════════════════════════════════════════════════════
 * 
 * DATA ARCHITECTURE: Casino Model
 * 
 * Layer 2 (Redb) = The Table (fast, where chips move)
 *   → Active $BB balances
 *   → Live bets/entries  
 *   → Playthrough tracking
 * 
 * Supabase = The Front Desk (history, profiles, Fan Gold)
 *   → ONLY receives bets AFTER settlement
 *   → User profiles (username, avatar, bio)
 *   → Fan Gold (social currency, $0 value)
 * 
 * THIS ENDPOINT:
 *   1. Places bet on L2 (ONLY source of truth for active bets)
 *   2. Returns L2 response directly
 *   3. Does NOT write to Supabase (indexer syncs after settlement)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server'

const L2_API_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

/**
 * POST /api/bet
 * Place a bet on L2 - Active state lives ONLY on L2
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      user_address, 
      market_id, 
      outcome_id, 
      amount,
      signature,
      public_key
    } = body

    // Validate required fields
    if (!user_address || !market_id || !outcome_id || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['user_address', 'market_id', 'outcome_id', 'amount']
      }, { status: 400 })
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be positive'
      }, { status: 400 })
    }

    console.log(`💰 [L2] Placing bet: ${amount} $BB on "${outcome_id}" for market ${market_id}`)

    // ═══════════════════════════════════════════════════════════════
    // PLACE BET ON L2 - This is the ONLY write operation
    // L2 handles: balance check, playthrough tracking, bet storage
    // ═══════════════════════════════════════════════════════════════
    
    const l2Response = await fetch(`${L2_API_URL}/bet/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_address,
        market_id,
        outcome_id,
        amount: parseFloat(amount),
        signature,
        public_key
      })
    })

    if (!l2Response.ok) {
      const errorText = await l2Response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      console.error('❌ [L2] Bet placement failed:', errorData)
      
      return NextResponse.json({ 
        error: 'Bet placement failed',
        details: errorData.error || errorData.message || 'L2 rejected the bet',
        code: errorData.code
      }, { status: l2Response.status })
    }

    const l2Result = await l2Response.json()
    
    console.log('✅ [L2] Bet placed successfully:', {
      bet_id: l2Result.bet_id,
      tokens: l2Result.tokens_received,
      price: l2Result.avg_price
    })

    // ═══════════════════════════════════════════════════════════════
    // NO SUPABASE WRITE - Active bets live ONLY on L2
    // 
    // Supabase receives this bet ONLY when:
    //   1. Market resolves (MarketResolved event)
    //   2. Indexer processes settlement
    //   3. Bet status is 'won', 'lost', or 'refunded'
    // 
    // This follows the Casino Architecture:
    //   L2 = The Table (fast, active chips)
    //   Supabase = The Front Desk (history after the game ends)
    // ═══════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: 'Bet placed on L2',
      bet: {
        bet_id: l2Result.bet_id || l2Result.id,
        market_id,
        outcome_id,
        amount: parseFloat(amount),
        tokens_received: l2Result.tokens_received,
        avg_price: l2Result.avg_price,
        potential_payout: l2Result.potential_payout,
        new_odds: l2Result.new_odds,
        timestamp: new Date().toISOString()
      },
      // Inform frontend where to query for live state
      live_state_source: 'L2',
      note: 'Active bet stored on L2. Will sync to history after settlement.'
    })

  } catch (error) {
    console.error('❌ Error in bet placement:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/bet
 * Get user's active bets - ALWAYS from L2
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const user_address = searchParams.get('user_address')
  const market_id = searchParams.get('market_id')

  if (!user_address) {
    return NextResponse.json({ 
      error: 'user_address required' 
    }, { status: 400 })
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // FETCH FROM L2 - L2 is source of truth for active bets
    // ═══════════════════════════════════════════════════════════════
    
    let l2Url = `${L2_API_URL}/positions/${user_address}`
    if (market_id) {
      l2Url += `?market_id=${market_id}`
    }

    const l2Response = await fetch(l2Url)
    
    if (!l2Response.ok) {
      // L2 might return 404 if no positions - that's OK
      if (l2Response.status === 404) {
        return NextResponse.json({
          success: true,
          positions: [],
          source: 'L2'
        })
      }
      throw new Error(`L2 positions fetch failed: ${l2Response.statusText}`)
    }

    const positions = await l2Response.json()

    return NextResponse.json({
      success: true,
      positions: positions.positions || positions,
      source: 'L2',
      note: 'Active positions from L2. For settled bets, query /api/bet/history'
    })

  } catch (error) {
    console.error('❌ Error fetching positions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch positions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
