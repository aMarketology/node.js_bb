import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '12'
    const active = searchParams.get('active') || 'true'
    const tag = searchParams.get('tag') || ''
    
    // Build URL with optional tag filter
    let apiUrl = `https://gamma-api.polymarket.com/markets?limit=${limit}&active=${active}`
    if (tag) {
      apiUrl += `&tag=${encodeURIComponent(tag)}`
    }
    
    // Fetch from Polymarket API server-side (no CORS issues)
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 60 seconds to reduce API calls
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Error fetching from Polymarket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
