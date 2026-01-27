/**
 * Dealer Credentials API Route
 * Returns dealer private key from environment variable (server-side only)
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get dealer credentials from environment
    const privateKey = process.env.DEALER_PRIVATE_KEY
    const address = process.env.DEALER_L2_ADDRESS || 'L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D'

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Dealer private key not configured' },
        { status: 500 }
      )
    }

    // Return credentials (only accessible server-side)
    return NextResponse.json({
      privateKey,
      address
    })
  } catch (error: any) {
    console.error('❌ Dealer credentials error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get dealer credentials' },
      { status: 500 }
    )
  }
}
