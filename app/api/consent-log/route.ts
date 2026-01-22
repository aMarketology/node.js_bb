import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      userId,
      preferences,
      userAgent,
    } = body

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown'

    // Store consent record for compliance
    const { error } = await supabase
      .from('consent_logs')
      .insert({
        user_id: userId,
        preferences,
        user_agent: userAgent,
        ip_address: ip,
        timestamp: new Date().toISOString(),
      })

    if (error) {
      console.error('Error logging consent:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Consent log API error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
