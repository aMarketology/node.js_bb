/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SDK TypeScript Types
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shared types for BlackBook prediction market SDKs
 */

// ═══════════════════════════════════════════════════════════════════════════
// WALLET TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WalletConfig {
  l1Address: string
  l2Address: string
  publicKey: string
  privateKey: string
}

export interface UnlockedWallet {
  address: string
  l1Address: string
  l2Address: string
  publicKey: Uint8Array
  secretKey: Uint8Array
  mnemonic?: string
}

export type SignerFunction = (message: string) => Promise<string>

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface L1Balance {
  available: number
  locked: number
}

export interface L2Balance {
  available: number
  locked: number
  hasActiveCredit?: boolean
}

export interface UnifiedBalance {
  l1Available: number
  l1Locked: number
  l2Available: number
  l2Locked: number
  totalAvailable: number
  hasActiveCredit: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKET TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type MarketStatusType = 'pending' | 'active' | 'frozen' | 'resolved' | 'cancelled'
export type MarketTypeType = 'main' | 'user_prop' | 'prop'
export type TradingType = 'cpmm' | 'orderbook'

export interface Market {
  id: string
  slug?: string
  title: string
  description?: string
  status: MarketStatusType
  type?: MarketTypeType
  trading_type?: TradingType
  outcomes: string[]
  prices?: number[]
  current_prices?: number[]
  reserves?: number[]
  liquidity?: number
  volume?: number
  closes_at?: number
  created_at?: number
  resolution_criteria?: string
  winning_outcome?: number
  props?: PropBet[]
  propsCount?: number
  // Computed fields
  canTrade?: boolean
  isClosingSoon?: boolean
  isClosed?: boolean
  timeUntilClose?: number | null
  yesPrice?: number
  noPrice?: number
  yesProbability?: number
  noProbability?: number
}

export interface PropBet {
  id: string
  parent_market_id: string
  title: string
  description?: string
  outcomes: string[]
  prices?: number[]
  status: MarketStatusType
  liquidity?: number
  volume?: number
  closes_at?: number
  resolution_criteria?: string
  winning_outcome?: number
}

export interface PoolState {
  reserves: number[]
  k: number
  liquidity: number
  prices: number[]
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BetQuote {
  marketId: string
  outcomeIndex: number
  amount: number
  shares: number
  avgPrice: number
  priceImpact: number
  fee: number
  total: number
  effectivePrice: number
  maxPayout: number
  potentialProfit: number
}

export interface BetResult {
  success: boolean
  shares: number
  avgPrice: number
  newPrices: number[]
  txHash?: string
  spent?: number
  maxPayout?: number
  error?: string
}

export interface SellResult {
  success: boolean
  shares: number
  received: number
  avgPrice: number
  newPrices: number[]
  txHash?: string
  error?: string
}

export interface Position {
  marketId: string
  shares: number[]
  invested: number
  currentValue: number
  unrealizedPnl: number
}

// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BridgeLockResult {
  lockId: string
  l1TxHash: string
  amount: number
}

export interface BridgeClaimResult {
  success: boolean
  newBalance: number
}

export interface BridgeResult {
  success: boolean
  lockId: string
  newL2Balance: number
}

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAWAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WithdrawalRequest {
  success: boolean
  requestId?: string
  status?: string
  message?: string
}

export interface WithdrawalComplete {
  success: boolean
  message?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CREDIT SESSION TYPES (DEPRECATED in v3)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreditSession {
  sessionId: string
  creditAmount: number
  virtualBalance: number
  openedAt: number
  currentPnl?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEARINGHOUSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DepositConfirmParams {
  userAddress: string
  amount: number
  l1TxHash: string
  lockId: string
}

export interface WithdrawalCompleteParams {
  requestId: string
  userAddress: string
  amount: number
  l1TxHash: string
}

export interface ClearinghouseStats {
  totalDeposits: number
  totalWithdrawals: number
  pendingWithdrawals: number
  netBalance: number
  userCount: number
}

// ═══════════════════════════════════════════════════════════════════════════
// SDK CONFIG TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketSDKConfig {
  l2Url?: string
  address?: string
  signer?: SignerFunction
}

export interface CreditPredictionSDKConfig {
  l2Url?: string
  l1Url?: string
  supabaseUrl?: string
  supabaseKey?: string
  address?: string
  publicKey?: string
  signer?: SignerFunction
  isDealerMode?: boolean
}

export interface UnifiedDealerSDKConfig {
  l1Url?: string
  l2Url?: string
  privateKey?: string
  publicKey?: string
  address?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface BlackBookWalletConfig {
  password?: string
  mnemonic?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER/ORACLE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ResolveMarketParams {
  marketId: string
  winningOutcome: number
  evidence?: string
}

export interface ResolveMarketResult {
  success: boolean
  marketId: string
  winningOutcome: number
  payoutsProcessed: number
  totalPayout: number
  message?: string
  error?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SDKEventType =
  | 'bridge_started'
  | 'bridge_completed'
  | 'deposit_confirmed'
  | 'withdrawal_requested'
  | 'withdrawal_completed'
  | 'bet_placed'
  | 'position_sold'
  | 'credit_opened'
  | 'credit_settled'
  | 'market_resolved'

export interface SDKEvent {
  type: SDKEventType
  timestamp: number
  data?: any
}

export type EventListener = (event: SDKEvent) => void

// ═══════════════════════════════════════════════════════════════════════════
// CHAIN CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CHAIN_ID_L1 = 0x01
export const CHAIN_ID_L2 = 0x02

// ═══════════════════════════════════════════════════════════════════════════
// BLACKBOOK FRONTEND SDK TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BlackBookSDKConfig {
  url?: string
  l2Url?: string
  cacheMaxAge?: number
}

export interface BlackBookBalance {
  balance: number
  usdValue: number
  symbol: string
  address: string
  formatted: string
  formattedUsd: string
}

export interface BlackBookTransfer {
  success: boolean
  tx_id?: string
  from_balance?: number
  to_balance?: number
  error?: string
}

export interface BlackBookL2Session {
  sessionId: string
  lockedAmount: number
  availableCredit: number
  usedCredit: number
  expiresAt: number
  l1Balance: number
}

export interface BlackBookTransaction {
  id: string
  type: string
  from: string
  to: string
  amount: number
  usdValue: number
  timestamp: string
  status: string
  signature: string
  isIncoming: boolean
  isOutgoing: boolean
  displayAmount: string
}

export const BLACKBOOK_EVENTS = {
  WALLET_CONNECTED: 'wallet:connected',
  WALLET_DISCONNECTED: 'wallet:disconnected',
  BALANCE_UPDATED: 'balance:updated',
  TRANSFER_SENT: 'transfer:sent',
  TRANSFER_CONFIRMED: 'transfer:confirmed',
  SESSION_OPENED: 'session:opened',
  SESSION_SETTLED: 'session:settled',
  ERROR: 'error',
} as const
