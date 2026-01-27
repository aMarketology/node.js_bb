/**
 * Dealer Pending Markets API Route
 * Returns Supabase markets that haven't been activated on L2 yet
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Fetch all markets from Supabase
    const { data: supabaseMarkets, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Fetch L2 markets to see which ones are already activated
    const l2ApiUrl = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
    const l2Response = await fetch(`${l2ApiUrl}/markets`, {
      headers: { 'Content-Type': 'application/json' }
    })
    const l2Markets = await l2Response.json()
    
    // Map L2 market IDs for quick lookup
    const l2MarketIds = new Set(l2Markets.map((m: any) => m.id || m.event_id))
    
    // Filter to only pending markets (not on L2 yet)
    const pendingMarkets = (supabaseMarkets || []).filter(
      market => !l2MarketIds.has(market.id)
    )
    
    console.log(`📊 Dealer: ${pendingMarkets.length} pending markets (${supabaseMarkets?.length || 0} total in Supabase, ${l2Markets.length} on L2)`)
    
    return NextResponse.json({
      pending: pendingMarkets,
      total: supabaseMarkets?.length || 0,
      activated: l2Markets.length
    })
  } catch (error: any) {
    console.error('❌ Pending markets error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending markets' },
      { status: 500 }
    )
  }
}
