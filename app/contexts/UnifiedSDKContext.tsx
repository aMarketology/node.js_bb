'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { useAuth } from './AuthContext'
import nacl from 'tweetnacl'

// SDK Imports
import { MarketsSDK, MarketStatus } from '@/sdk/markets-sdk.js'
import { CreditPredictionSDK } from '@/sdk/credit-prediction-actions-sdk.js'

// Types
import type {
  Market,
  PropBet,
  PoolState,
  BetQuote,
  BetResult,
  SellResult,
  Position,
  L1Balance,
  L2Balance,
  UnifiedBalance,
  BridgeResult,
  WithdrawalRequest,
  SignerFunction,
  SDKEvent
} from '@/sdk/types'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const L1_API = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedSDKContextType {
  // Connection State
  isConnected: boolean
  isLoading: boolean
  isL2Available: boolean
  
  // SDK Instances (for advanced usage)
  marketsSDK: MarketsSDK | null
  creditPredictionSDK: CreditPredictionSDK | null
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Market Loading
  getActiveMarkets: () => Promise<Market[]>
  getPendingMarkets: () => Promise<Market[]>
  getFrozenMarkets: () => Promise<Market[]>
  getResolvedMarkets: () => Promise<Market[]>
  getMarketsByStatus: (statuses: string[]) => Promise<Market[]>
  getMarket: (marketId: string) => Promise<Market | null>
  
  // Market Data
  getPrices: (marketId: string) => Promise<number[]>
  getPoolState: (marketId: string) => Promise<PoolState>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING
  // ═══════════════════════════════════════════════════════════════════════════
  
  getQuote: (marketId: string, outcomeIndex: number, amount: number) => Promise<BetQuote>
  placeBet: (marketId: string, outcomeIndex: number, amount: number) => Promise<BetResult>
  sellShares: (marketId: string, outcomeIndex: number, shares: number) => Promise<SellResult>
  
  // Props
  createProp: (parentMarketId: string, propData: {
    title: string
    description: string
    outcomes: string[]
    initialLiquidity: number
    closesAt: number
    resolutionCriteria: string
  }) => Promise<{ success: boolean; propId?: string; error?: string }>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // POSITIONS & HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  positions: Position[]
  getPosition: (marketId: string) => Promise<Position | null>
  getAllPositions: () => Promise<Position[]>
  getBetHistory: () => Promise<any[]>
  refreshPositions: () => Promise<void>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  l1Balance: L1Balance
  l2Balance: L2Balance
  unifiedBalance: UnifiedBalance
  getL1Balance: () => Promise<L1Balance>
  getL2Balance: () => Promise<L2Balance>
  getUnifiedBalance: () => Promise<UnifiedBalance>
  refreshBalance: () => Promise<void>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BRIDGE (L1 → L2)
  // ═══════════════════════════════════════════════════════════════════════════
  
  bridge: (amount: number) => Promise<BridgeResult>
  bridgeLockOnL1: (amount: number) => Promise<{ lockId: string; l1TxHash: string; amount: number }>
  bridgeClaimOnL2: (lockId: string, amount: number, l1TxHash: string) => Promise<{ success: boolean; newBalance: number }>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWALS (L2 → L1)
  // ═══════════════════════════════════════════════════════════════════════════
  
  requestWithdrawal: (amount: number) => Promise<WithdrawalRequest>
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  events: SDKEvent[]
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════

const defaultL1Balance: L1Balance = { available: 0, locked: 0 }
const defaultL2Balance: L2Balance = { available: 0, locked: 0, hasActiveCredit: false }
const defaultUnifiedBalance: UnifiedBalance = {
  l1Available: 0,
  l1Locked: 0,
  l2Available: 0,
  l2Locked: 0,
  totalAvailable: 0,
  hasActiveCredit: false
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const UnifiedSDKContext = createContext<UnifiedSDKContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedSDKProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeWallet, activeWalletData } = useAuth()
  
  // SDK Instances
  const [marketsSDK, setMarketsSDK] = useState<MarketsSDK | null>(null)
  const [creditPredictionSDK, setCreditPredictionSDK] = useState<CreditPredictionSDK | null>(null)
  
  // Connection State
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isL2Available, setIsL2Available] = useState(false)
  
  // Data State
  const [positions, setPositions] = useState<Position[]>([])
  const [l1Balance, setL1Balance] = useState<L1Balance>(defaultL1Balance)
  const [l2Balance, setL2Balance] = useState<L2Balance>(defaultL2Balance)
  const [unifiedBalance, setUnifiedBalance] = useState<UnifiedBalance>(defaultUnifiedBalance)
  const [events, setEvents] = useState<SDKEvent[]>([])
  
  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNER FACTORY
  // ═══════════════════════════════════════════════════════════════════════════

  const createSigner = useCallback((walletData: any): SignerFunction => {
    return async (message: string): Promise<string> => {
      if (!walletData?.privateKey || !walletData?.publicKey) {
        throw new Error('No wallet keys available')
      }
      
      // Build full 64-byte secret key (32 bytes private + 32 bytes public)
      const secretKey = new Uint8Array(64)
      secretKey.set(Buffer.from(walletData.privateKey, 'hex'), 0)
      secretKey.set(Buffer.from(walletData.publicKey, 'hex'), 32)
      
      const messageBytes = new Uint8Array(Buffer.from(message, 'utf8'))
      const signature = nacl.sign.detached(messageBytes, secretKey)
      return Buffer.from(signature).toString('hex')
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK L2 AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  const checkL2Status = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${L2_API}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // SDK INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const initializeSDKs = async () => {
      // Cleanup previous subscriptions
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      // Check L2 availability
      const l2Available = await checkL2Status()
      setIsL2Available(l2Available)

      if (!isAuthenticated || !activeWalletData) {
        setMarketsSDK(null)
        setCreditPredictionSDK(null)
        setIsConnected(false)
        setIsLoading(false)
        setPositions([])
        setL1Balance(defaultL1Balance)
        setL2Balance(defaultL2Balance)
        setUnifiedBalance(defaultUnifiedBalance)
        return
      }

      console.log('🔌 Initializing Unified SDK for:', activeWallet)

      const signer = createSigner(activeWalletData)
      const userAddress = activeWalletData.l2Address || activeWalletData.l1Address

      // Initialize Markets SDK
      const newMarketsSDK = new MarketsSDK({
        l2Url: L2_API,
        address: userAddress,
        signer
      })
      setMarketsSDK(newMarketsSDK)

      // Initialize Credit Prediction SDK
      const newCreditPredictionSDK = new CreditPredictionSDK({
        l2Url: L2_API,
        l1Url: L1_API,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
        address: userAddress,
        publicKey: activeWalletData.publicKey,
        signer
      })

      // Subscribe to Credit Prediction SDK events
      unsubscribeRef.current = newCreditPredictionSDK.on((event: any) => {
        console.log('📡 SDK Event:', event)
        const sdkEvent: SDKEvent = {
          type: event.type,
          timestamp: Date.now(),
          data: event
        }
        setEvents(prev => [...prev.slice(-49), sdkEvent])
        
        // Auto-refresh on certain events
        if (['bet_placed', 'position_sold', 'bridge_completed', 'withdrawal_completed'].includes(event.type)) {
          refreshBalanceInternal(newCreditPredictionSDK)
          refreshPositionsInternal(newCreditPredictionSDK)
        }
      })

      setCreditPredictionSDK(newCreditPredictionSDK)
      setIsConnected(true)
      setIsLoading(false)

      // Load initial data
      await loadInitialData(newMarketsSDK, newCreditPredictionSDK)

      console.log('✅ Unified SDK initialized for', userAddress)
    }

    initializeSDKs()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [isAuthenticated, activeWallet, activeWalletData, createSigner, checkL2Status])

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadInitialData = async (marketsSDK: MarketsSDK, creditSDK: CreditPredictionSDK) => {
    try {
      const [balanceData, positionsData] = await Promise.all([
        creditSDK.getBalance().catch(() => ({ available: 0, locked: 0 })),
        creditSDK.getPositions().catch(() => [])
      ])

      setL2Balance({
        available: balanceData.available,
        locked: balanceData.locked,
        hasActiveCredit: (balanceData as any).hasActiveCredit || false
      })
      setPositions(positionsData)

      // Try to get L1 balance
      try {
        const l1Data = await creditSDK.getL1Balance()
        setL1Balance({ available: l1Data.available, locked: l1Data.locked })
        setUnifiedBalance({
          l1Available: l1Data.available,
          l1Locked: l1Data.locked,
          l2Available: balanceData.available,
          l2Locked: balanceData.locked,
          totalAvailable: l1Data.available + balanceData.available,
          hasActiveCredit: (balanceData as any).hasActiveCredit || false
        })
      } catch (err) {
        console.warn('L1 not available:', err)
      }

      console.log('✅ Initial data loaded:', {
        l2Balance: balanceData,
        positions: positionsData.length
      })
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const refreshBalanceInternal = async (sdk: CreditPredictionSDK) => {
    try {
      const data = await sdk.getBalance()
      setL2Balance({
        available: data.available,
        locked: data.locked,
        hasActiveCredit: (data as any).hasActiveCredit || false
      })
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  const refreshPositionsInternal = async (sdk: CreditPredictionSDK) => {
    try {
      const data = await sdk.getPositions()
      setPositions(data)
    } catch (error) {
      console.error('Failed to refresh positions:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const getActiveMarkets = useCallback(async (): Promise<Market[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getActive()
  }, [marketsSDK])

  const getPendingMarkets = useCallback(async (): Promise<Market[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getPending()
  }, [marketsSDK])

  const getFrozenMarkets = useCallback(async (): Promise<Market[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getFrozen()
  }, [marketsSDK])

  const getResolvedMarkets = useCallback(async (): Promise<Market[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getResolved()
  }, [marketsSDK])

  const getMarketsByStatus = useCallback(async (statuses: string[]): Promise<Market[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getByStatuses(statuses)
  }, [marketsSDK])

  const getMarket = useCallback(async (marketId: string): Promise<Market | null> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getMarket(marketId)
  }, [marketsSDK])

  const getPrices = useCallback(async (marketId: string): Promise<number[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getPrices(marketId)
  }, [marketsSDK])

  const getPoolState = useCallback(async (marketId: string): Promise<PoolState> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getPoolState(marketId)
  }, [marketsSDK])

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const getQuote = useCallback(async (marketId: string, outcomeIndex: number, amount: number): Promise<BetQuote> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getQuote(marketId, outcomeIndex, amount)
  }, [marketsSDK])

  const placeBet = useCallback(async (marketId: string, outcomeIndex: number, amount: number): Promise<BetResult> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    const result = await marketsSDK.bet(marketId, outcomeIndex, amount)
    
    // Refresh data after bet
    if (result.success && creditPredictionSDK) {
      await Promise.all([
        refreshBalanceInternal(creditPredictionSDK),
        refreshPositionsInternal(creditPredictionSDK)
      ])
    }
    
    return result
  }, [marketsSDK, creditPredictionSDK])

  const sellShares = useCallback(async (marketId: string, outcomeIndex: number, shares: number): Promise<SellResult> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    const result = await marketsSDK.sell(marketId, outcomeIndex, shares)
    
    // Refresh data after sell
    if (result.success && creditPredictionSDK) {
      await Promise.all([
        refreshBalanceInternal(creditPredictionSDK),
        refreshPositionsInternal(creditPredictionSDK)
      ])
    }
    
    return result
  }, [marketsSDK, creditPredictionSDK])

  const createProp = useCallback(async (parentMarketId: string, propData: {
    title: string
    description: string
    outcomes: string[]
    initialLiquidity: number
    closesAt: number
    resolutionCriteria: string
  }) => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.createProp(parentMarketId, propData)
  }, [marketsSDK])

  // ═══════════════════════════════════════════════════════════════════════════
  // POSITION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const getPosition = useCallback(async (marketId: string): Promise<Position | null> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getPosition(marketId)
  }, [marketsSDK])

  const getAllPositions = useCallback(async (): Promise<Position[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getAllPositions()
  }, [marketsSDK])

  const getBetHistory = useCallback(async (): Promise<any[]> => {
    if (!marketsSDK) throw new Error('SDK not initialized')
    return marketsSDK.getBetHistory()
  }, [marketsSDK])

  const refreshPositions = useCallback(async (): Promise<void> => {
    if (!creditPredictionSDK) return
    await refreshPositionsInternal(creditPredictionSDK)
  }, [creditPredictionSDK])

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const getL1Balance = useCallback(async (): Promise<L1Balance> => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    return creditPredictionSDK.getL1Balance()
  }, [creditPredictionSDK])

  const getL2Balance = useCallback(async (): Promise<L2Balance> => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    const data = await creditPredictionSDK.getBalance()
    return {
      available: data.available,
      locked: data.locked,
      hasActiveCredit: (data as any).hasActiveCredit || false
    }
  }, [creditPredictionSDK])

  const getUnifiedBalance = useCallback(async (): Promise<UnifiedBalance> => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    const data = await creditPredictionSDK.getUnifiedBalance()
    return {
      l1Available: data.l1Available,
      l1Locked: data.l1Locked,
      l2Available: data.l2Available,
      l2Locked: data.l2Locked,
      totalAvailable: data.totalAvailable,
      hasActiveCredit: data.hasActiveCredit
    }
  }, [creditPredictionSDK])

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!creditPredictionSDK) return
    await refreshBalanceInternal(creditPredictionSDK)
    
    // Also try to refresh L1 balance
    try {
      const l1Data = await creditPredictionSDK.getL1Balance()
      setL1Balance({ available: l1Data.available, locked: l1Data.locked })
      setUnifiedBalance(prev => ({
        ...prev,
        l1Available: l1Data.available,
        l1Locked: l1Data.locked,
        totalAvailable: l1Data.available + prev.l2Available
      }))
    } catch (err) {
      // L1 not available
    }
  }, [creditPredictionSDK])

  // ═══════════════════════════════════════════════════════════════════════════
  // BRIDGE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const bridge = useCallback(async (amount: number): Promise<BridgeResult> => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    const result = await creditPredictionSDK.bridge(amount)
    if (result.success) {
      await refreshBalance()
    }
    return result
  }, [creditPredictionSDK, refreshBalance])

  const bridgeLockOnL1 = useCallback(async (amount: number) => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    return creditPredictionSDK.bridgeLockOnL1(amount)
  }, [creditPredictionSDK])

  const bridgeClaimOnL2 = useCallback(async (lockId: string, amount: number, l1TxHash: string) => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    const result = await creditPredictionSDK.bridgeClaimOnL2(lockId, amount, l1TxHash)
    if (result.success) {
      await refreshBalance()
    }
    return result
  }, [creditPredictionSDK, refreshBalance])

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWAL METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  const requestWithdrawal = useCallback(async (amount: number): Promise<WithdrawalRequest> => {
    if (!creditPredictionSDK) throw new Error('SDK not initialized')
    const result = await creditPredictionSDK.requestWithdrawal(amount)
    if (result.success) {
      await refreshBalance()
    }
    return result
  }, [creditPredictionSDK, refreshBalance])

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value: UnifiedSDKContextType = {
    // Connection State
    isConnected,
    isLoading,
    isL2Available,
    
    // SDK Instances
    marketsSDK,
    creditPredictionSDK,
    
    // Markets
    getActiveMarkets,
    getPendingMarkets,
    getFrozenMarkets,
    getResolvedMarkets,
    getMarketsByStatus,
    getMarket,
    getPrices,
    getPoolState,
    
    // Trading
    getQuote,
    placeBet,
    sellShares,
    createProp,
    
    // Positions
    positions,
    getPosition,
    getAllPositions,
    getBetHistory,
    refreshPositions,
    
    // Balance
    l1Balance,
    l2Balance,
    unifiedBalance,
    getL1Balance,
    getL2Balance,
    getUnifiedBalance,
    refreshBalance,
    
    // Bridge
    bridge,
    bridgeLockOnL1,
    bridgeClaimOnL2,
    
    // Withdrawals
    requestWithdrawal,
    
    // Events
    events
  }

  return (
    <UnifiedSDKContext.Provider value={value}>
      {children}
    </UnifiedSDKContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useUnifiedSDK() {
  const context = useContext(UnifiedSDKContext)
  if (context === undefined) {
    throw new Error('useUnifiedSDK must be used within a UnifiedSDKProvider')
  }
  return context
}

// Re-export MarketStatus for convenience
export { MarketStatus }

export default UnifiedSDKContext
