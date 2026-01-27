/**
 * Markets API Route - Production L2 Proxy
 * Proxies market requests to the real L2 backend
 */

import { NextRequest, NextResponse } from 'next/server';

const L2_API_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/markets - List markets
 * GET /api/markets?status=active|pending|drafts|frozen|resolved
 * GET /api/markets?id=market-123 - Single market
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';
  const marketId = searchParams.get('id');
  const category = searchParams.get('category');

  try {
    let url: string;
    
    // Single market request
    if (marketId) {
      url = `${L2_API_URL}/market/${marketId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Market not found: ${marketId}` },
          { status: response.status, headers: corsHeaders }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data, { headers: corsHeaders });
    }
    
    // List markets by status
    switch (status) {
      case 'active':
        url = `${L2_API_URL}/markets`;
        break;
      case 'pending':
        url = `${L2_API_URL}/markets/pending`;
        break;
      case 'drafts':
        url = `${L2_API_URL}/markets/drafts`;
        break;
      case 'frozen':
        url = `${L2_API_URL}/markets/frozen`;
        break;
      case 'resolved':
        url = `${L2_API_URL}/markets/resolved`;
        break;
      default:
        url = `${L2_API_URL}/markets`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch markets: ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    let markets = data.markets || data || [];

    // ✅ LAYER 1: API Proxy Filtering
    // Filter active markets to only include those with liquidity >= 100 BB
    if (status === 'active' && Array.isArray(markets)) {
      const beforeCount = markets.length;
      markets = markets.filter((m: any) => {
        const liquidity = parseFloat(m.cpmm_pool?.total_liquidity || m.liquidity || 0);
        const isResolved = m.resolved === true;
        return !isResolved && liquidity >= 100;
      });
      console.log(`🔍 API Proxy: Filtered ${beforeCount} → ${markets.length} active markets (≥100 BB liquidity)`);
    }

    // Filter by category if specified
    if (category && Array.isArray(markets)) {
      markets = markets.filter((m: any) => 
        m.category?.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({ markets, status }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to L2 server' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/markets - Create market or perform market actions
 * Body: { action: 'create' | 'create_draft' | 'approve' | 'reject' | 'resolve', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    let url: string;
    let response: Response;

    switch (action) {
      case 'create':
        url = `${L2_API_URL}/market`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'create_draft':
        url = `${L2_API_URL}/market/draft`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'approve':
        url = `${L2_API_URL}/market/approve`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'reject':
        url = `${L2_API_URL}/market/reject`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'resolve':
        url = `${L2_API_URL}/resolve`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'create_prop':
        const { market_id, ...propPayload } = payload;
        url = `${L2_API_URL}/market/${market_id}/prop/create`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propPayload)
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: corsHeaders }
        );
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Markets POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
