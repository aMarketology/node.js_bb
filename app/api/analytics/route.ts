import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      event_name,
      event_data,
      session_id,
      user_id,
      timestamp,
      user_agent,
      screen_resolution,
      viewport_size,
      referrer,
      url,
    } = body

    // Get client IP from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown'

    // Store in Supabase analytics table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name,
        event_data,
        session_id,
        user_id,
        timestamp,
        user_agent,
        screen_resolution,
        viewport_size,
        referrer,
        url,
        ip_address: ip,
      })

    if (error) {
      console.error('Error storing analytics:', error)
      // Don't return error to client - fail silently
      return NextResponse.json({ success: false }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
