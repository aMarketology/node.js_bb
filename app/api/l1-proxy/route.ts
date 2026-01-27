// L1 Blockchain API Proxy
// Bypasses CORS by making requests server-side

import { NextRequest, NextResponse } from 'next/server'

const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'

console.log('🔧 L1 Proxy configured with API URL:', L1_API_URL)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 })
  }

  try {
    const url = `${L1_API_URL}${endpoint}`
    console.log('🔄 Proxying L1 GET request to:', url)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 L1 response status:', response.status, 'for', url)

    // Check if response is ok
    if (!response.ok) {
      console.error('❌ L1 API returned non-OK status:', response.status, 'URL:', url)
      
      // Try to get error details from response
      let errorDetails = 'No details available'
      try {
        const errorText = await response.text()
        errorDetails = errorText.substring(0, 500)
      } catch (e) {
        // Ignore error reading body
      }
      
      return NextResponse.json(
        { 
          error: 'L1 API error', 
          status: response.status,
          url: url,
          details: errorDetails,
          suggestion: 'Check if L1 server is running at ' + L1_API_URL
        },
        { status: response.status }
      )
    }

    // Get the response text first to check if it's empty
    const responseText = await response.text()
    
    // If empty or whitespace only, return empty array/object depending on endpoint
    if (!responseText || responseText.trim() === '') {
      console.warn('⚠️ L1 API returned empty response for:', url)
      // Return appropriate empty response based on endpoint
      if (endpoint.includes('/history')) {
        return NextResponse.json({ success: true, transactions: [] })
      }
      return NextResponse.json({ success: false, error: 'Empty response from L1' })
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('❌ Failed to parse L1 response as JSON:', responseText.substring(0, 100))
      return NextResponse.json(
        { error: 'Invalid JSON response from L1', details: responseText.substring(0, 200) },
        { status: 500 }
      )
    }
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
