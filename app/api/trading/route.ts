/**
 * Trading API Route - Production L2 CPMM Trading
 * Handles quotes, buy/sell operations via L2 backend
 */

import { NextRequest, NextResponse } from 'next/server';

const L2_API_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';

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
 * GET /api/trading?action=quote&market_id=...&outcome=...&amount=...
 * GET /api/trading?action=balance&address=...
 * GET /api/trading?action=unified_balance&address=...
 * GET /api/trading?action=positions&address=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'quote': {
        const marketId = searchParams.get('market_id');
        const outcome = searchParams.get('outcome');
        const amount = searchParams.get('amount');

        if (!marketId || !outcome || !amount) {
          return NextResponse.json(
            { error: 'Missing required parameters: market_id, outcome, amount' },
            { status: 400, headers: corsHeaders }
          );
        }

        const url = `${L2_API_URL}/quote/${marketId}/${outcome}/${amount}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const error = await response.text();
          return NextResponse.json(
            { error: error || 'Failed to get quote' },
            { status: response.status, headers: corsHeaders }
          );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
      }

      case 'balance': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter' },
            { status: 400, headers: corsHeaders }
          );
        }

        const url = `${L2_API_URL}/balance/${address}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return NextResponse.json(
            { balance: '0', available: '0', locked: '0' },
            { headers: corsHeaders }
          );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
      }

      case 'unified_balance': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter' },
            { status: 400, headers: corsHeaders }
          );
        }

        const url = `${L2_API_URL}/unified/balance/${address}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return NextResponse.json(
            { l1_balance: '0', l2_balance: '0', total: '0' },
            { headers: corsHeaders }
          );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
      }

      case 'positions': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter' },
            { status: 400, headers: corsHeaders }
          );
        }

        const url = `${L2_API_URL}/positions/${address}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return NextResponse.json(
            { positions: [] },
            { headers: corsHeaders }
          );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
      }

      case 'order_book': {
        const marketId = searchParams.get('market_id');
        if (!marketId) {
          return NextResponse.json(
            { error: 'Missing market_id parameter' },
            { status: 400, headers: corsHeaders }
          );
        }

        const url = `${L2_API_URL}/orderbook/${marketId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return NextResponse.json(
            { bids: [], asks: [] },
            { headers: corsHeaders }
          );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: quote, balance, unified_balance, positions, order_book` },
          { status: 400, headers: corsHeaders }
        );
    }

  } catch (error: any) {
    console.error('Trading GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to L2 server' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/trading
 * Body: { action: 'buy' | 'sell' | 'deposit' | 'withdraw', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    let url: string;
    let response: Response;

    switch (action) {
      case 'buy': {
        // CPMM Buy: { address, market_id, outcome, amount, signature, nonce }
        url = `${L2_API_URL}/cpmm/buy`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      case 'sell': {
        // CPMM Sell: { address, market_id, outcome, shares, signature, nonce }
        url = `${L2_API_URL}/cpmm/sell`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      case 'deposit': {
        // Clearinghouse Deposit: { address, amount, l1_tx_id, signature }
        url = `${L2_API_URL}/clearinghouse/deposit`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      case 'withdraw': {
        // Clearinghouse Withdraw: { address, amount, signature }
        url = `${L2_API_URL}/clearinghouse/withdraw`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      case 'limit_order': {
        // Place limit order: { address, market_id, side, price, amount, signature }
        url = `${L2_API_URL}/order`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      case 'cancel_order': {
        // Cancel order: { address, order_id, signature }
        url = `${L2_API_URL}/order/cancel`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: buy, sell, deposit, withdraw, limit_order, cancel_order` },
          { status: 400, headers: corsHeaders }
        );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || response.statusText };
      }
      return NextResponse.json(
        errorData,
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Trading POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
