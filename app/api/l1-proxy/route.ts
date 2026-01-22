// L1 Blockchain API Proxy
// Bypasses CORS by making requests server-side

import { NextRequest, NextResponse } from 'next/server'

const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 })
  }

  try {
    const url = `${L1_API_URL}${endpoint}`
    console.log('🔄 Proxying L1 request:', url)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('L1 proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from L1', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, method = 'POST', data } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 })
    }

    const url = `${L1_API_URL}${endpoint}`
    console.log('🔄 Proxying L1 POST request:', url)
    console.log('📦 Request data:', JSON.stringify(data, null, 2))

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    console.log('📡 L1 response status:', response.status)
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ L1 API error:', errorText)
      return NextResponse.json(
        { error: 'L1 API returned error', status: response.status, details: errorText },
        { status: response.status }
      )
    }

    // Try to parse as JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json()
      console.log('✅ L1 response:', responseData)
      return NextResponse.json(responseData)
    } else {
      const responseText = await response.text()
      console.log('✅ L1 response (text):', responseText)
      return NextResponse.json({ success: true, message: responseText })
    }
  } catch (error: any) {
    console.error('❌ L1 proxy POST error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to post to L1', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
