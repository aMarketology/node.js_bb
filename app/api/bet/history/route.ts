/**
 * ═══════════════════════════════════════════════════════════════
 * API ROUTE: /api/bet/history
 * ═══════════════════════════════════════════════════════════════
 * 
 * DATA ARCHITECTURE: Casino Model
 * 
 * This endpoint queries SUPABASE for SETTLED bets only.
 * For active bets, use GET /api/bet (queries L2)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * GET /api/bet/history
 * Get user's settled bet history from Supabase
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const user_address = searchParams.get('user_address')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status') // 'won', 'lost', 'refunded', or null for all

  if (!user_address) {
    return NextResponse.json({ 
      error: 'user_address required' 
    }, { status: 400 })
  }

  try {
    // Query bet_history table (only settled bets)
    let query = supabase
      .from('bet_history')
      .select(`
        *,
        market_history (
          question,
          category,
          resolved_outcome,
          resolution_timestamp
        ),
        market_outcome_history (
          outcome_name
        )
      `)
      .eq('user_address', user_address)
      .order('settled_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status && ['won', 'lost', 'refunded', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Error fetching bet history:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch bet history',
        details: error.message
      }, { status: 500 })
    }

    // Calculate summary stats
    const stats = {
      total_bets: data?.length || 0,
      total_won: data?.filter(b => b.status === 'won').length || 0,
      total_lost: data?.filter(b => b.status === 'lost').length || 0,
      total_refunded: data?.filter(b => b.status === 'refunded').length || 0,
      total_wagered: data?.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0) || 0,
      total_payout: data?.reduce((sum, b) => sum + parseFloat(b.payout_amount || 0), 0) || 0
    }

    return NextResponse.json({
      success: true,
      bets: data || [],
      stats,
      pagination: {
        limit,
        offset,
        has_more: (data?.length || 0) === limit
      },
      source: 'Supabase',
      note: 'Historical settled bets only. For active bets, use GET /api/bet'
    })

  } catch (error) {
    console.error('❌ Error in bet history:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
