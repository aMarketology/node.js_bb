'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { BlackBookMarkets, MarketStatus } from '@/sdk/blackbook-markets'
import { useAuth } from './AuthContext'
import { useFanCredit } from './FanCreditContext'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface Market {
  id: string
  title: string
  description: string
  status: string
  game_type: string
  entry_fee: number
  closes_at?: string
  created_at: string
}

interface MarketsContextType {
  sdk: BlackBookMarkets | null
  activeMarkets: Market[]
  pendingMarkets: Market[]
  resolvedMarkets: Market[]
  loading: boolean
  error: string | null
  refreshMarkets: () => Promise<void>
  getMarket: (marketId: string) => Promise<Market | null>
  placeBet: (marketId: string, outcomeIndex: number, amount: number) => Promise<any>
}

const MarketsContext = createContext<MarketsContextType | undefined>(undefined)

export function MarketsProvider({ children }: { children: ReactNode }) {
  const { activeWalletData, isAuthenticated } = useAuth()
  const { sdk: fcSDK, refreshBalance } = useFanCredit()
  const [sdk, setSdk] = useState<BlackBookMarkets | null>(null)
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([])
  const [pendingMarkets, setPendingMarkets] = useState<Market[]>([])
  const [resolvedMarkets, setResolvedMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    const marketsSDK = new BlackBookMarkets({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      l2Url: L2_API
    })
    setSdk(marketsSDK)
  }, [])

  // Refresh all markets
  const refreshMarkets = useCallback(async () => {
    if (!sdk) return

    setLoading(true)
    setError(null)

    try {
      // Fetch markets by status
      const [active, pending, resolved] = await Promise.all([
        sdk.getActiveMarkets(),
        sdk.getPendingMarkets(),
        sdk.getResolvedMarkets(20)
      ])

      setActiveMarkets(active)
      setPendingMarkets(pending)
      setResolvedMarkets(resolved)
    } catch (err) {
      console.error('Failed to load markets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }, [sdk])

  // Get single market
  const getMarket = useCallback(async (marketId: string): Promise<Market | null> => {
    if (!sdk) return null

    try {
      const market = await sdk.getMarket(marketId)
      return market
    } catch (err) {
      console.error('Failed to load market:', err)
      return null
    }
  }, [sdk])

  // Place bet on a market
  const placeBet = useCallback(async (marketId: string, outcomeIndex: number, amount: number) => {
    if (!fcSDK || !activeWalletData || !isAuthenticated) {
      throw new Error('Not authenticated or SDK not initialized')
    }

    // Get username for betting
    let username = null
    if ('username' in activeWalletData) {
      username = activeWalletData.username
    } else if (activeWalletData.l2Address) {
      username = activeWalletData.l2Address
    }

    if (!username) {
      throw new Error('No username available')
    }

    // Get private key for signing
    let privateKey = null
    let publicKey = null
    
    if ('privateKey' in activeWalletData && activeWalletData.privateKey) {
      privateKey = activeWalletData.privateKey
    }
    
    if ('publicKey' in activeWalletData) {
      publicKey = activeWalletData.publicKey
    }

    if (!privateKey || !publicKey) {
      throw new Error('Cannot sign transaction - missing credentials')
    }

    // Create temporary SDK instance with user credentials for signing
    const { FanCreditSDK } = await import('@/sdk/fancredit-sdk')
    const userSDK = new FanCreditSDK({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      l2Url: L2_API,
      username,
      publicKey,
      privateKey
    })

    try {
      // Place the bet
      const result = await userSDK.placeBet(marketId, outcomeIndex, amount)
      
      // Refresh balance after bet
      await refreshBalance()
      
      return result
    } catch (err) {
      console.error('Bet failed:', err)
      throw err
    }
  }, [fcSDK, activeWalletData, isAuthenticated, refreshBalance])

  // Auto-load markets on mount
  useEffect(() => {
    if (sdk) {
      refreshMarkets()
      
      // Refresh markets every 60 seconds
      const interval = setInterval(refreshMarkets, 60000)
      return () => clearInterval(interval)
    }
  }, [sdk, refreshMarkets])

  const value = {
    sdk,
    activeMarkets,
    pendingMarkets,
    resolvedMarkets,
    loading,
    error,
    refreshMarkets,
    getMarket,
    placeBet
  }

  return (
    <MarketsContext.Provider value={value}>
      {children}
    </MarketsContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketsContext)
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketsProvider')
  }
  return context
}
