/**
 * BlackBook L2 Markets Client
 * Prediction market integration using BlackBook L1 wallet authentication
 */

import { signMessage, bytesToHex, type UnlockedWallet } from './blackbook-wallet'

// L2 Markets API URL
const L2_API_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

// Session token storage
let sessionToken: string | null = null
let tokenExpiry: number = 0

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Authenticate with L2 Markets using L1 wallet
 */
export async function authenticateL2(wallet: UnlockedWallet): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const message = `blackbook-auth:${wallet.address}:${timestamp}`
  
  // Sign with wallet's private key
  const messageBytes = new TextEncoder().encode(message)
  const signature = signMessage(messageBytes, wallet.secretKey)
  
  console.log('🔐 Authenticating with L2 Markets...')
  
  const response = await fetch(`${L2_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_address: wallet.address,
      timestamp: timestamp,
      signature: bytesToHex(signature),
      public_key: bytesToHex(wallet.publicKey)
    })
  })
  
  if (!response.ok) {
    throw new Error(`L2 authentication failed: ${response.statusText}`)
  }
  
  const data = await response.json()
  if (!data.session_token) {
    throw new Error('L2 authentication response missing session_token')
  }
  
  sessionToken = data.session_token
  tokenExpiry = Date.now() + (2.5 * 60 * 1000) // 2.5 minutes
  
  console.log('✅ L2 session established')
  return data.session_token
}

/**
 * Get current session token (re-authenticate if expired)
 */
export async function getSessionToken(wallet: UnlockedWallet): Promise<string> {
  if (!sessionToken || Date.now() >= tokenExpiry) {
    return await authenticateL2(wallet)
  }
  return sessionToken
}

/**
 * Clear session token
 */
export function clearSession(): void {
  sessionToken = null
  tokenExpiry = 0
}

// ═══════════════════════════════════════════════════════════════
// MARKETS & PROP BETS
// ═══════════════════════════════════════════════════════════════

export interface PropBet {
  id: string
  match_id: string
  type: 'player' | 'game' | 'special'
  question: string
  outcomes: string[]
  outcome_prices: string[]
  player?: string
  team?: string
  liquidity: number
  volume: number
  status: 'active' | 'closed' | 'resolved'
  winning_outcome?: string
}

export interface Quote {
  tokens: number
  price_per_token: number
  fee: number
  price_impact: number
  new_price: number
}

export interface BetResult {
  bet_id: string
  tokens_received: number
  avg_price: number
  fee: number
  new_odds: Record<string, number>
}

export interface Position {
  prop_bet_id: string
  user: string
  positions: Record<string, number> // outcome -> tokens
  total_invested: number
  current_value: number
  unrealized_pnl: number
}

/**
 * Get quote for a bet (read-only, no authentication required)
 */
export async function getQuote(
  propBetId: string,
  outcome: string,
  amount: number
): Promise<Quote> {
  const response = await fetch(`${L2_API_URL}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: amount
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to get quote: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Place a bet on a prop bet
 */
export async function placeBet(
  wallet: UnlockedWallet,
  propBetId: string,
  outcome: string,
  amount: number
): Promise<BetResult> {
  const token = await getSessionToken(wallet)
  
  console.log(`📊 Placing bet: ${amount} BB on "${outcome}"`)
  
  const response = await fetch(`${L2_API_URL}/predict/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: amount
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Bet failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  console.log(`✅ Bet placed: ${result.tokens_received} tokens @ ${result.avg_price}`)
  return result
}

/**
 * Sell position (exit bet early)
 */
export async function sellPosition(
  wallet: UnlockedWallet,
  propBetId: string,
  outcome: string,
  tokens: number
): Promise<{ bb_received: number; avg_price: number }> {
  const token = await getSessionToken(wallet)
  
  console.log(`💰 Selling ${tokens} tokens of "${outcome}"`)
  
  const response = await fetch(`${L2_API_URL}/sell/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: tokens
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Sell failed: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Get user's position on a prop bet
 */
export async function getPosition(
  userAddress: string,
  propBetId: string
): Promise<Position> {
  const response = await fetch(
    `${L2_API_URL}/position/${userAddress}/${propBetId}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to get position: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Get all positions for a user
 */
export async function getUserPositions(
  userAddress: string
): Promise<Position[]> {
  const response = await fetch(
    `${L2_API_URL}/predictions/${userAddress}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to get user positions: ${response.statusText}`)
  }
  
  return await response.json()
}

// ═══════════════════════════════════════════════════════════════
// LIQUIDITY PROVISION
// ═══════════════════════════════════════════════════════════════

export interface LPInfo {
  total_liquidity: number
  reserves: Record<string, number>
  lp_count: number
  fee_rate: number
  fees_collected: number
  lp_shares: Record<string, number>
}

/**
 * Add liquidity to a prop bet market
 */
export async function addLiquidity(
  wallet: UnlockedWallet,
  propBetId: string,
  amount: number
): Promise<{ success: boolean; lp_share: number }> {
  const token = await getSessionToken(wallet)
  
  console.log(`💧 Adding ${amount} BB liquidity`)
  
  const response = await fetch(`${L2_API_URL}/lp/add/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      amount: amount
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Add liquidity failed: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Remove liquidity from a prop bet market
 */
export async function removeLiquidity(
  wallet: UnlockedWallet,
  propBetId: string,
  fraction: number
): Promise<{ success: boolean; bb_received: number }> {
  const token = await getSessionToken(wallet)
  
  console.log(`💧 Removing ${fraction * 100}% liquidity`)
  
  const response = await fetch(`${L2_API_URL}/lp/remove/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': token
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      fraction: fraction
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Remove liquidity failed: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Get LP info for a market
 */
export async function getLPInfo(propBetId: string): Promise<LPInfo> {
  const response = await fetch(`${L2_API_URL}/lp/${propBetId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get LP info: ${response.statusText}`)
  }
  
  return await response.json()
}

// ═══════════════════════════════════════════════════════════════
// MARKET RESOLUTION (Admin only)
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve a prop bet (requires resolver permissions)
 */
export async function resolvePropBet(
  wallet: UnlockedWallet,
  propBetId: string,
  winningOutcome: string
): Promise<{ success: boolean }> {
  const token = await getSessionToken(wallet)
  
  console.log(`⚖️ Resolving prop bet: winner = "${winningOutcome}"`)
  
  const response = await fetch(
    `${L2_API_URL}/prop-bets/${propBetId}/resolve/session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token
      },
      body: JSON.stringify({
        winning_outcome: winningOutcome
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Resolution failed: ${response.statusText}`)
  }
  
  return await response.json()
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if L2 API is available
 */
export async function checkL2Status(): Promise<boolean> {
  try {
    const response = await fetch(`${L2_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Calculate implied probability from odds
 */
export function oddsToProb(odds: number): number {
  return 1 / odds
}

/**
 * Calculate odds from probability
 */
export function probToOdds(prob: number): number {
  return 1 / prob
}

/**
 * Format BB amount for display
 */
export function formatBB(amount: number): string {
  return `${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })} BB`
}
