'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { BlackBookSDK, EVENTS } from '@/sdk/blackbook-frontend-sdk.js'

const L1_API = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VirtualBalance {
  l1Available: number
  l1Locked: number
  l2InPositions: number
  virtualAvailable: number
}

interface SoftLock {
  lockId: string
  userAddress: string
  amount: number
  reason: string
  referenceId: string
  createdAt: number
  expiresAt: number
}

interface CreditSession {
  sessionId: string
  creditLimit: number
  availableCredit: number
  usedCredit: number
  lockedInBets: number
  expiresAt: number
}

interface BetWithLockResult {
  success: boolean
  betId: string
  lockId: string
  shares: number
  avgPrice: number
  newPrices: number[]
  txHash?: string
  error?: string
}

interface SettlementResult {
  success: boolean
  txHash?: string
  userBalance?: number
  userPnl?: number
  error?: string
}

interface HealthStatus {
  l1Healthy: boolean
  l2Healthy: boolean
  l1Version: string
  l2Version: string
  l1BlockHeight: number
  l2BlockHeight: number
}

interface SettlementContextType {
  // Connection state
  isConnected: boolean
  isLoading: boolean
  healthStatus: HealthStatus
  
  // Virtual Balance (unified L1 + L2 view)
  virtualBalance: VirtualBalance
  refreshVirtualBalance: () => Promise<void>
  
  // Soft Locks
  activeLocks: SoftLock[]
  softLock: (amount: number, reason: string, referenceId: string) => Promise<{ success: boolean; lockId?: string; error?: string }>
  releaseLock: (lockId: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  
  // Credit Sessions
  creditSession: CreditSession | null
  openCreditSession: (creditLimit?: number, durationHours?: number) => Promise<{ success: boolean; sessionId?: string; error?: string }>
  closeCreditSession: () => Promise<{ success: boolean; netPnl?: number; error?: string }>
  getCreditStatus: () => Promise<CreditSession | null>
  
  // Betting with Settlement
  placeBetWithLock: (marketId: string, outcomeIndex: number, amount: number) => Promise<BetWithLockResult>
  sellPositionWithSettlement: (marketId: string, outcomeIndex: number, shares: number, lockId?: string) => Promise<{ success: boolean; received?: number; error?: string }>
  settleResolvedBet: (params: {
    marketId: string
    betId: string
    lockId: string
    stake: number
    shares: number
    winningOutcome: number
    userOutcome: number
  }) => Promise<SettlementResult>
  
  // Settlement Operations
  settleBet: (bet: {
    betId: string
    marketId: string
    lockId: string
    outcome: 'win' | 'lose' | 'void' | 'push'
    stake: number
    payout: number
  }) => Promise<SettlementResult>
  batchSettle: (bets: any[]) => Promise<{ success: boolean; settledCount: number; error?: string }>
  
  // Events
  events: any[]
  
  // SDK instance (for advanced usage)
  sdk: BlackBookSDK | null
}

const SettlementContext = createContext<SettlementContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SettlementProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeWallet, activeWalletData } = useAuth()
  
  const [sdk, setSdk] = useState<BlackBookSDK | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    l1Healthy: false,
    l2Healthy: false,
    l1Version: 'unknown',
    l2Version: 'unknown',
    l1BlockHeight: 0,
    l2BlockHeight: 0
  })
  
  const [virtualBalance, setVirtualBalance] = useState<VirtualBalance>({
    l1Available: 0,
    l1Locked: 0,
    l2InPositions: 0,
    virtualAvailable: 0
  })
  
  const [activeLocks, setActiveLocks] = useState<SoftLock[]>([])
  const [creditSession, setCreditSession] = useState<CreditSession | null>(null)
  const [events, setEvents] = useState<any[]>([])

  // Initialize SDK when wallet changes
  useEffect(() => {
    if (!isAuthenticated || !activeWalletData) {
      setSdk(null)
      setIsConnected(false)
      setIsLoading(false)
      setVirtualBalance({ l1Available: 0, l1Locked: 0, l2InPositions: 0, virtualAvailable: 0 })
      setActiveLocks([])
      setCreditSession(null)
      return
    }

    console.log('🔌 Initializing BlackBookSDK for:', activeWallet)

    // Create SDK instance
    const newSdk = new BlackBookSDK({
      url: L1_API,
      l2Url: L2_API,
    })

    // Import wallet from secret key if available
    if (activeWalletData.privateKey) {
      const secretKey = activeWalletData.privateKey + activeWalletData.publicKey
      newSdk.importFromSecretKey(secretKey)
    }

    // Subscribe to SDK events
    const unsubBalance = newSdk.on(EVENTS.BALANCE_UPDATED, (balance: any) => {
      console.log('📡 Balance updated:', balance)
      setEvents(prev => [...prev.slice(-49), { type: 'balance_updated', ...balance }])
      setVirtualBalance(prev => ({
        ...prev,
        l1Available: balance.balance || 0,
        virtualAvailable: balance.balance || 0
      }))
    })

    const unsubSession = newSdk.on(EVENTS.SESSION_OPENED, (session: any) => {
      console.log('📡 Session opened:', session)
      setEvents(prev => [...prev.slice(-49), { type: 'session_opened', ...session }])
      setCreditSession({
        sessionId: session.sessionId,
        creditLimit: session.lockedAmount,
        availableCredit: session.l2Credit,
        usedCredit: 0,
        lockedInBets: 0,
        expiresAt: session.expiresAt
      })
    })

    const unsubSettled = newSdk.on(EVENTS.SESSION_SETTLED, (result: any) => {
      console.log('📡 Session settled:', result)
      setEvents(prev => [...prev.slice(-49), { type: 'session_settled', ...result }])
      setCreditSession(null)
    })

    setSdk(newSdk)
    setIsConnected(true)
    setIsLoading(false)

    // Load initial data
    loadInitialData(newSdk)

    return () => {
      unsubBalance()
      unsubSession()
      unsubSettled()
      newSdk.disconnect()
    }
  }, [isAuthenticated, activeWallet, activeWalletData])

  async function loadInitialData(sdkInstance: BlackBookSDK) {
    try {
      // Check health of L1
      const l1Healthy = await sdkInstance.isHealthy()

      setHealthStatus({
        l1Healthy,
        l2Healthy: true, // Assume L2 is healthy for now
        l1Version: 'v3',
        l2Version: 'v3',
        l1BlockHeight: 0,
        l2BlockHeight: 0
      })

      // Load virtual balance
      await refreshVirtualBalanceInternal(sdkInstance)

      // Load credit status
      await loadCreditStatus(sdkInstance)

      console.log('✅ BlackBookSDK initialized:', {
        l1Healthy,
        hasSession: !!creditSession
      })
    } catch (error) {
      console.error('Failed to load settlement data:', error)
    }
  }

  async function refreshVirtualBalanceInternal(sdkInstance: BlackBookSDK) {
    try {
      const balance = await sdkInstance.getBalance() as { balance: number }
      setVirtualBalance({
        l1Available: balance.balance || 0,
        l1Locked: 0,
        l2InPositions: 0,
        virtualAvailable: balance.balance || 0
      })
    } catch (error) {
      console.error('Failed to refresh virtual balance:', error)
    }
  }

  async function refreshActiveLocks(_sdkInstance: BlackBookSDK) {
    // BlackBookSDK doesn't track locks, this is handled by L2
    setActiveLocks([])
  }

  async function loadCreditStatus(sdkInstance: BlackBookSDK) {
    try {
      const session = await sdkInstance.getL2Session() as {
        sessionId: string
        lockedAmount: number
        availableCredit: number
        usedCredit: number
        expiresAt: number
      } | null
      if (session) {
        setCreditSession({
          sessionId: session.sessionId,
          creditLimit: session.lockedAmount,
          availableCredit: session.availableCredit,
          usedCredit: session.usedCredit,
          lockedInBets: 0,
          expiresAt: session.expiresAt
        })
      } else {
        setCreditSession(null)
      }
    } catch (error) {
      console.error('Failed to load credit status:', error)
      setCreditSession(null)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const refreshVirtualBalance = useCallback(async () => {
    if (!sdk) return
    await refreshVirtualBalanceInternal(sdk)
  }, [sdk])

  const softLock = useCallback(async (_amount: number, _reason: string, _referenceId: string) => {
    // Soft locks are managed by L2, not directly through BlackBookSDK
    return { success: false, error: 'Soft locks are managed by L2 server' }
  }, [])

  const releaseLock = useCallback(async (_lockId: string, _reason: string = 'settled') => {
    // Locks are managed by L2, not directly through BlackBookSDK
    return { success: false, error: 'Locks are managed by L2 server' }
  }, [])

  const openCreditSession = useCallback(async (creditLimit?: number, _durationHours: number = 24) => {
    if (!sdk) return { success: false, error: 'SDK not initialized' }
    
    try {
      const result = await sdk.openL2Session(creditLimit || 100) as {
        success: boolean
        session_id?: string
        locked_amount?: number
        available_credit?: number
        expires_at?: number
        error?: string
      }
      if (result.success) {
        setCreditSession({
          sessionId: result.session_id || '',
          creditLimit: result.locked_amount || 0,
          availableCredit: result.available_credit || 0,
          usedCredit: 0,
          lockedInBets: 0,
          expiresAt: result.expires_at || 0
        })
        return { success: true, sessionId: result.session_id }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [sdk])

  const closeCreditSession = useCallback(async () => {
    if (!sdk || !creditSession) return { success: false, error: 'No active session' }
    
    try {
      const result = await sdk.settleL2Session(creditSession.sessionId, 0) as {
        success: boolean
        net_pnl?: number
      }
      if (result.success) {
        setCreditSession(null)
        await refreshVirtualBalance()
        return { success: true, netPnl: result.net_pnl }
      }
      return { success: false, error: 'Settlement failed' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [sdk, creditSession, refreshVirtualBalance])

  const getCreditStatus = useCallback(async (): Promise<CreditSession | null> => {
    if (!sdk) return null
    await loadCreditStatus(sdk)
    return creditSession
  }, [sdk, creditSession])

  const placeBetWithLock = useCallback(async (
    _marketId: string, 
    _outcomeIndex: number, 
    _amount: number
  ): Promise<BetWithLockResult> => {
    // This should be handled through CreditPredictionSDK or MarketsSDK
    return { 
      success: false, 
      betId: '', 
      lockId: '', 
      shares: 0, 
      avgPrice: 0, 
      newPrices: [],
      error: 'Use CreditPrediction or Markets context for betting'
    }
  }, [])

  const sellPositionWithSettlement = useCallback(async (
    _marketId: string,
    _outcomeIndex: number,
    _shares: number,
    _lockId?: string
  ) => {
    // This should be handled through CreditPredictionSDK or MarketsSDK
    return { success: false, error: 'Use CreditPrediction or Markets context for selling' }
  }, [])

  const settleResolvedBet = useCallback(async (_params: {
    marketId: string
    betId: string
    lockId: string
    stake: number
    shares: number
    winningOutcome: number
    userOutcome: number
  }): Promise<SettlementResult> => {
    // Settlement is handled by the L2 server
    return { success: false, error: 'Settlement is handled by L2 server' }
  }, [])

  const settleBet = useCallback(async (_bet: {
    betId: string
    marketId: string
    lockId: string
    outcome: 'win' | 'lose' | 'void' | 'push'
    stake: number
    payout: number
  }): Promise<SettlementResult> => {
    // Settlement is handled by the L2 server
    return { success: false, error: 'Settlement is handled by L2 server' }
  }, [])

  const batchSettle = useCallback(async (_bets: any[]) => {
    // Batch settlement is handled by the L2 server
    return { success: false, settledCount: 0, error: 'Batch settlement is handled by L2 server' }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value: SettlementContextType = {
    isConnected,
    isLoading,
    healthStatus,
    virtualBalance,
    refreshVirtualBalance,
    activeLocks,
    softLock,
    releaseLock,
    creditSession,
    openCreditSession,
    closeCreditSession,
    getCreditStatus,
    placeBetWithLock,
    sellPositionWithSettlement,
    settleResolvedBet,
    settleBet,
    batchSettle,
    events,
    sdk
  }

  return (
    <SettlementContext.Provider value={value}>
      {children}
    </SettlementContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useSettlement() {
  const context = useContext(SettlementContext)
  if (!context) {
    throw new Error('useSettlement must be used within a SettlementProvider')
  }
  return context
}
