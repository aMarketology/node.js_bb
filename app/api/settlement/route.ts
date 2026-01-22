/**
 * Settlement API Routes
 * Proxies settlement requests from browser to L1/L2 servers
 * Handles CORS and authentication
 */

import { NextRequest, NextResponse } from 'next/server';

const L1_API_URL = process.env.L1_API_URL || process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080';
const L2_API_URL = process.env.L2_API_URL || process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/settlement?action=balance&address=L1_xxx
 * GET /api/settlement?action=health&layer=l1
 * GET /api/settlement?action=credit_status&address=L1_xxx
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const address = searchParams.get('address');
  const layer = searchParams.get('layer') || 'l1';

  try {
    let url: string;
    let response: Response;

    switch (action) {
      case 'balance':
        if (!address) {
          return NextResponse.json({ error: 'address required' }, { status: 400, headers: corsHeaders });
        }
        url = `${L1_API_URL}/balance/${address}`;
        response = await fetch(url);
        break;

      case 'virtual_balance':
        if (!address) {
          return NextResponse.json({ error: 'address required' }, { status: 400, headers: corsHeaders });
        }
        const l2Address = address.replace('L1_', 'L2_');
        // Fetch both L1 and L2 balances
        const [l1Res, l2Res] = await Promise.all([
          fetch(`${L1_API_URL}/balance/${address}`),
          fetch(`${L2_API_URL}/balance/${l2Address}`).catch(() => null)
        ]);
        
        const l1Data = await l1Res.json();
        const l2Data = l2Res ? await l2Res.json().catch(() => ({})) : {};
        
        return NextResponse.json({
          success: true,
          l1_available: l1Data.available ?? l1Data.balance ?? 0,
          l1_locked: l1Data.locked ?? 0,
          l2_balance: l2Data.balance ?? l2Data.available ?? 0,
          l2_in_positions: l2Data.in_positions ?? 0,
          virtual_available: l1Data.available ?? l1Data.balance ?? 0
        }, { headers: corsHeaders });

      case 'health':
        url = layer === 'l2' ? `${L2_API_URL}/health` : `${L1_API_URL}/health`;
        response = await fetch(url);
        break;

      case 'credit_status':
        if (!address) {
          return NextResponse.json({ error: 'address required' }, { status: 400, headers: corsHeaders });
        }
        url = `${L1_API_URL}/settlement/credit/status/${address}`;
        response = await fetch(url);
        break;

      case 'locks':
        if (!address) {
          return NextResponse.json({ error: 'address required' }, { status: 400, headers: corsHeaders });
        }
        url = `${L1_API_URL}/settlement/locks/${address}`;
        response = await fetch(url);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400, headers: corsHeaders });
    }

    if (!response.ok) {
      const text = await response.text();
      console.error(`Settlement GET ${action} failed:`, response.status, text);
      return NextResponse.json(
        { error: text || response.statusText, status: response.status },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Settlement API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/settlement
 * Body: { action: 'soft_lock' | 'release_lock' | 'settle_bet' | 'batch_settle' | 'open_credit' | 'close_credit' | 'verify', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    let url: string;
    let response: Response;

    switch (action) {
      case 'soft_lock':
        url = `${L1_API_URL}/settlement/lock`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'release_lock':
        url = `${L1_API_URL}/settlement/release`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'settle_bet':
        url = `${L1_API_URL}/settlement/settle`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'batch_settle':
        url = `${L1_API_URL}/settlement/batch`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'open_credit':
        url = `${L1_API_URL}/settlement/credit/open`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'close_credit':
        url = `${L1_API_URL}/settlement/credit/close`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'verify_signature':
        url = `${L1_API_URL}/settlement/verify`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      // L2 Operations
      case 'l2_bet':
        url = `${L2_API_URL}/cpmm/buy`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'l2_sell':
        url = `${L2_API_URL}/cpmm/sell`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;

      case 'l2_quote':
        const { market_id, outcome, amount } = payload;
        url = `${L2_API_URL}/quote/${market_id}/${outcome}/${amount}`;
        response = await fetch(url);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: corsHeaders }
        );
    }

    if (!response.ok) {
      const text = await response.text();
      console.error(`Settlement POST ${action} failed:`, response.status, text);
      
      // Try to parse as JSON for better error messages
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text || response.statusText };
      }
      
      return NextResponse.json(
        { ...errorData, status: response.status },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Settlement POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
