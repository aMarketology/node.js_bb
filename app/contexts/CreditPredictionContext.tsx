'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { CreditPredictionSDK } from '@/credit-prediction-actions-sdk.js'
import nacl from 'tweetnacl'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CreditSession {
  sessionId: string
  creditAmount: number
  virtualBalance: number
  openedAt: number
  currentPnl?: number
}

interface BetQuote {
  shares: number
  avgPrice: number
  priceImpact: number
  fee: number
  total: number
}

interface BetResult {
  success: boolean
  shares: number
  avgPrice: number
  newPrices: number[]
  txHash?: string
}

interface CreditPredictionContextType {
  // Connection state
  isConnected: boolean
  isLoading: boolean
  
  // Credit session
  activeSession: CreditSession | null
  hasActiveCredit: boolean
  openCredit: (amount: number) => Promise<{ success: boolean; message: string; creditAmount?: number; virtualBalance?: number }>
  settleCredit: () => Promise<{ success: boolean; pnl: number; message: string }>
  refreshCreditSession: () => Promise<void>
  
  // Balance
  balance: { available: number; locked: number }
  refreshBalance: () => Promise<void>
  
  // Betting
  getQuote: (marketId: string, outcomeIndex: number, amount: number) => Promise<BetQuote>
  placeBet: (marketId: string, outcomeIndex: number, amount: number) => Promise<BetResult>
  sellPosition: (marketId: string, outcomeIndex: number, shares: number) => Promise<BetResult>
  
  // Positions
  positions: any[]
  refreshPositions: () => Promise<void>
  getPosition: (marketId: string) => any
  
  // Markets
  getPrices: (marketId: string) => Promise<number[]>
  getPool: (marketId: string) => Promise<{ reserves: number[]; k: number; liquidity: number }>
  
  // Events
  events: any[]
}

const CreditPredictionContext = createContext<CreditPredictionContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CreditPredictionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeWallet, user, activeWalletData } = useAuth()
  
  const [sdk, setSdk] = useState<CreditPredictionSDK | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<CreditSession | null>(null)
  const [balance, setBalance] = useState({ available: 0, locked: 0 })
  const [positions, setPositions] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  // Initialize SDK when wallet changes
  useEffect(() => {
    if (!isAuthenticated || !activeWalletData) {
      setSdk(null)
      setIsConnected(false)
      setIsLoading(false)
      setActiveSession(null)
      setBalance({ available: 0, locked: 0 })
      setPositions([])
      return
    }

    console.log('🔌 Initializing CreditPredictionSDK for:', activeWallet)

    // Create signer function using wallet keys
    const signer = async (message: string): Promise<string> => {
      if (!activeWalletData?.privateKey || !activeWalletData?.publicKey) {
        throw new Error('No wallet keys available')
      }
      
      const secretKey = new Uint8Array(64)
      secretKey.set(Buffer.from(activeWalletData.privateKey, 'hex'), 0)
      secretKey.set(Buffer.from(activeWalletData.publicKey, 'hex'), 32)
      
      const messageBytes = new Uint8Array(Buffer.from(message, 'utf8'))
      const signature = nacl.sign.detached(messageBytes, secretKey)
      return Buffer.from(signature).toString('hex')
    }

    const newSdk = new CreditPredictionSDK({
      l2Url: L2_API,
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      address: activeWalletData.l2Address,
      signer
    })

    // Subscribe to SDK events
    const unsubscribe = newSdk.on((event: any) => {
      console.log('📡 SDK Event:', event)
      setEvents(prev => [...prev.slice(-49), event])
      
      if (event.type === 'credit_opened') {
        setActiveSession(event.session)
      } else if (event.type === 'credit_settled') {
        setActiveSession(null)
      } else if (event.type === 'bet_placed') {
        refreshPositions()
        refreshBalance()
      }
    })

    setSdk(newSdk)
    setIsConnected(true)
    setIsLoading(false)

    // Load initial data
    loadInitialData(newSdk)

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, activeWallet, activeWalletData])

  async function loadInitialData(sdkInstance: CreditPredictionSDK) {
    try {
      const [balanceData, positionsData] = await Promise.all([
        sdkInstance.getBalance().catch(() => ({ available: 0, locked: 0 })),
        sdkInstance.getPositions().catch(() => [])
      ])
      
      setBalance({ available: balanceData.available, locked: balanceData.locked })
      setPositions(positionsData)
      
      // Check for existing credit session
      const session = await sdkInstance.getCreditSession().catch(() => null)
      setActiveSession(session)
      
      console.log('✅ CreditPredictionSDK initialized:', {
        balance: balanceData,
        positions: positionsData.length,
        hasSession: !!session
      })
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREDIT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const openCredit = useCallback(async (amount: number) => {
    if (!sdk) return { success: false, message: 'SDK not initialized' }
    
    try {
      const result = await sdk.openCredit(amount)
      if (result.success) {
        setActiveSession({
          sessionId: result.sessionId!,
          creditAmount: result.creditAmount!,
          virtualBalance: result.virtualBalance!,
          openedAt: Date.now()
        })
      }
      return {
        success: result.success,
        message: result.message,
        creditAmount: result.creditAmount,
        virtualBalance: result.virtualBalance
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }, [sdk])

  const settleCredit = useCallback(async () => {
    if (!sdk) return { success: false, pnl: 0, message: 'SDK not initialized' }
    
    try {
      const result = await sdk.settleCredit()
      if (result.success) {
        setActiveSession(null)
        await refreshBalance()
      }
      return result
    } catch (error: any) {
      return { success: false, pnl: 0, message: error.message }
    }
  }, [sdk])

  const refreshCreditSession = useCallback(async () => {
    if (!sdk) return
    const session = await sdk.getCreditSession()
    setActiveSession(session)
  }, [sdk])

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const refreshBalance = useCallback(async () => {
    if (!sdk) return
    try {
      const data = await sdk.getBalance()
      setBalance({ available: data.available, locked: data.locked })
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }, [sdk])

  // ═══════════════════════════════════════════════════════════════════════════
  // BETTING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const getQuote = useCallback(async (marketId: string, outcomeIndex: number, amount: number) => {
    if (!sdk) throw new Error('SDK not initialized')
    return sdk.getQuote(marketId, outcomeIndex, amount)
  }, [sdk])

  const placeBet = useCallback(async (marketId: string, outcomeIndex: number, amount: number) => {
    if (!sdk) throw new Error('SDK not initialized')
    
    const result = await sdk.bet(marketId, outcomeIndex, amount)
    
    if (result.success) {
      await Promise.all([refreshBalance(), refreshPositions()])
    }
    
    return result
  }, [sdk])

  const sellPosition = useCallback(async (marketId: string, outcomeIndex: number, shares: number) => {
    if (!sdk) throw new Error('SDK not initialized')
    
    const result = await sdk.sell(marketId, outcomeIndex, shares)
    
    if (result.success) {
      await Promise.all([refreshBalance(), refreshPositions()])
    }
    
    return result
  }, [sdk])

  // ═══════════════════════════════════════════════════════════════════════════
  // POSITIONS FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const refreshPositions = useCallback(async () => {
    if (!sdk) return
    try {
      const data = await sdk.getPositions()
      setPositions(data)
    } catch (error) {
      console.error('Failed to refresh positions:', error)
    }
  }, [sdk])

  const getPosition = useCallback((marketId: string) => {
    return positions.find(p => p.market_id === marketId) || null
  }, [positions])

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const getPrices = useCallback(async (marketId: string) => {
    if (!sdk) return []
    return sdk.getPrices(marketId)
  }, [sdk])

  const getPool = useCallback(async (marketId: string) => {
    if (!sdk) return { reserves: [], k: 0, liquidity: 0 }
    return sdk.getPool(marketId)
  }, [sdk])

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value: CreditPredictionContextType = {
    isConnected,
    isLoading,
    activeSession,
    hasActiveCredit: !!activeSession,
    openCredit,
    settleCredit,
    refreshCreditSession,
    balance,
    refreshBalance,
    getQuote,
    placeBet,
    sellPosition,
    positions,
    refreshPositions,
    getPosition,
    getPrices,
    getPool,
    events
  }

  return (
    <CreditPredictionContext.Provider value={value}>
      {children}
    </CreditPredictionContext.Provider>
  )
}

export function useCreditPrediction() {
  const context = useContext(CreditPredictionContext)
  if (context === undefined) {
    throw new Error('useCreditPrediction must be used within a CreditPredictionProvider')
  }
  return context
}

export default CreditPredictionContext
