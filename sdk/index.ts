/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BlackBook SDK - Main Export File
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Unified export for all BlackBook prediction market SDKs.
 * 
 * Usage:
 *   import { 
 *     MarketsSDK, 
 *     CreditPredictionSDK, 
 *     UnifiedDealerSDK,
 *     MarketStatus,
 *     CHAIN_ID_L1,
 *     CHAIN_ID_L2 
 *   } from '@/sdk'
 */

// ═══════════════════════════════════════════════════════════════════════════
// SDK CLASSES
// ═══════════════════════════════════════════════════════════════════════════

export { 
  MarketsSDK, 
  createMarketsSDK, 
  MarketStatus, 
  MarketType, 
  TradingType 
} from './markets-sdk.js'

export { 
  CreditPredictionSDK 
} from './credit-prediction-actions-sdk.js'

export { 
  UnifiedDealerSDK, 
  DealerCrypto,
  CHAIN_ID_L1, 
  CHAIN_ID_L2 
} from './unified-dealer-sdk.js'

export {
  BlackBookSDK,
  EVENTS as BLACKBOOK_EVENTS,
  createReactHooks
} from './blackbook-frontend-sdk.js'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type {
  // Wallet Types
  WalletConfig,
  UnlockedWallet,
  SignerFunction,
  
  // Balance Types
  L1Balance,
  L2Balance,
  UnifiedBalance,
  
  // Market Types
  MarketStatusType,
  MarketTypeType,
  Market,
  PropBet,
  PoolState,
  
  // Trading Types
  BetQuote,
  BetResult,
  SellResult,
  Position,
  
  // Bridge Types
  BridgeLockResult,
  BridgeClaimResult,
  BridgeResult,
  
  // Withdrawal Types
  WithdrawalRequest,
  WithdrawalComplete,
  
  // Credit Types
  CreditSession,
  
  // Clearinghouse Types
  DepositConfirmParams,
  WithdrawalCompleteParams,
  ClearinghouseStats,
  
  // Config Types
  MarketSDKConfig,
  CreditPredictionSDKConfig,
  UnifiedDealerSDKConfig,
  BlackBookWalletConfig,
  
  // Dealer/Oracle Types
  ResolveMarketParams,
  ResolveMarketResult,
  
  // Event Types
  SDKEventType,
  SDKEvent,
  EventListener,
} from './types'
