/**
 * Ledger API Route - Layer 1 Transaction History
 * Fetches all L1 transactions including deposits, withdrawals, and bridges
 */

import { NextRequest, NextResponse } from 'next/server';

const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/ledger - Get L1 transaction ledger
 * Query params:
 *   - address: Filter by user address
 *   - type: Filter by transaction type (deposit, withdraw, bridge_out, bridge_in, transfer)
 *   - limit: Number of transactions to return (default 100)
 *   - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const txType = searchParams.get('type');
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';

  try {
    // Build query params for L1 server
    const params = new URLSearchParams();
    if (address) params.append('address', address);
    if (txType) params.append('type', txType);
    params.append('limit', limit);
    params.append('offset', offset);

    const url = `${L1_API_URL}/ledger?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If endpoint doesn't exist, return mock structure
      if (response.status === 404) {
        return NextResponse.json(
          {
            transactions: [],
            total: 0,
            message: 'L1 ledger endpoint not available'
          },
          { headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: `L1 server error: ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Ledger API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ledger data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
