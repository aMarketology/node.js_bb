'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { L2MarketsSDK } from '@/sdk/l2-markets-sdk'
import { useAuth } from './AuthContext'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
const DEALER_ADDRESS = process.env.NEXT_PUBLIC_DEALER_ADDRESS || 'L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D'

interface Contest {
  contest_id: string
  name?: string
  status: string
  currency: string
  entry_fee: number
  max_participants: number
  participants?: any[]
  total_pool?: number
  start_time?: number
  end_time?: number
  spotsAvailable?: number
  isFull?: boolean
  totalPrizePool?: number
  currencySymbol?: string
  statusLabel?: string
}

interface ContestEntry {
  contestId: string
  userAddress: string
  roster: number[]
  signature?: string
}

interface L2MarketsContextType {
  sdk: L2MarketsSDK | null
  contests: Contest[]
  liveContests: Contest[]
  userContests: Contest[]
  loading: boolean
  error: string | null
  refreshContests: () => Promise<void>
  refreshLiveContests: () => Promise<void>
  refreshUserContests: () => Promise<void>
  getContest: (contestId: string) => Promise<Contest | null>
  enterContest: (params: ContestEntry) => Promise<boolean>
  canEnterContest: (contestId: string) => Promise<{ canEnter: boolean; reason?: string; entryFee?: number; currency?: string; spotsRemaining?: number }>
  formatAmount: (amount: number, currency: string) => string
}

const L2MarketsContext = createContext<L2MarketsContextType | undefined>(undefined)

export function L2MarketsProvider({ children }: { children: ReactNode }) {
  const { activeWalletData, isAuthenticated } = useAuth()
  const [sdk, setSdk] = useState<L2MarketsSDK | null>(null)
  const [contests, setContests] = useState<Contest[]>([])
  const [liveContests, setLiveContests] = useState<Contest[]>([])
  const [userContests, setUserContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    const marketsSDK = new L2MarketsSDK({
      l2Url: L2_API,
      dealerAddress: DEALER_ADDRESS
    })
    setSdk(marketsSDK)
  }, [])

  // Refresh all contests
  const refreshContests = useCallback(async () => {
    if (!sdk) return

    setLoading(true)
    setError(null)
    
    try {
      const allContests = await sdk.getContests()
      setContests(allContests)
    } catch (err) {
      console.error('Failed to load contests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load contests')
    } finally {
      setLoading(false)
    }
  }, [sdk])

  // Refresh live contests only
  const refreshLiveContests = useCallback(async () => {
    if (!sdk) return

    try {
      const live = await sdk.getLiveContests()
      setLiveContests(live)
    } catch (err) {
      console.error('Failed to load live contests:', err)
    }
  }, [sdk])

  // Refresh user's contests
  const refreshUserContests = useCallback(async () => {
    if (!sdk || !activeWalletData?.l2Address || !isAuthenticated) {
      setUserContests([])
      return
    }

    try {
      const userContestsData = await sdk.getUserContests(activeWalletData.l2Address)
      setUserContests(userContestsData)
    } catch (err) {
      console.error('Failed to load user contests:', err)
      setUserContests([])
    }
  }, [sdk, activeWalletData, isAuthenticated])

  // Get single contest
  const getContest = useCallback(async (contestId: string): Promise<Contest | null> => {
    if (!sdk) return null

    try {
      const contest = await sdk.getContest(contestId)
      return contest
    } catch (err) {
      console.error(`Failed to load contest ${contestId}:`, err)
      return null
    }
  }, [sdk])

  // Enter a contest
  const enterContest = useCallback(async (params: ContestEntry): Promise<boolean> => {
    if (!sdk || !activeWalletData?.l2Address) {
      return false
    }

    try {
      const result = await sdk.enterContest({
        contestId: params.contestId,
        userAddress: params.userAddress || activeWalletData.l2Address,
        roster: params.roster,
        signature: params.signature
      })
      
      if (result.success) {
        // Refresh contests after entering
        await refreshLiveContests()
        await refreshUserContests()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to enter contest:', err)
      return false
    }
  }, [sdk, activeWalletData, refreshLiveContests, refreshUserContests])

  // Check if user can enter a contest
  const canEnterContest = useCallback(async (contestId: string) => {
    if (!sdk || !activeWalletData?.l2Address) {
      return { canEnter: false, reason: 'Wallet not connected' }
    }

    try {
      return await sdk.canEnterContest(contestId, activeWalletData.l2Address)
    } catch (err) {
      console.error('Failed to check contest eligibility:', err)
      return { canEnter: false, reason: 'Failed to check eligibility' }
    }
  }, [sdk, activeWalletData])

  // Format amount with currency
  const formatAmount = useCallback((amount: number, currency: string): string => {
    if (!sdk) return `${amount} ${currency}`
    return sdk.formatAmount(amount, currency)
  }, [sdk])

  // Auto-load contests on mount
  useEffect(() => {
    if (sdk) {
      refreshContests()
      refreshLiveContests()
      
      // Refresh live contests every 60 seconds
      const interval = setInterval(() => {
        refreshLiveContests()
      }, 60000)
      
      return () => clearInterval(interval)
    }
  }, [sdk, refreshContests, refreshLiveContests])

  // Load user contests when authenticated
  useEffect(() => {
    if (isAuthenticated && activeWalletData?.l2Address && sdk) {
      refreshUserContests()
    }
  }, [isAuthenticated, activeWalletData, sdk, refreshUserContests])

  const value = {
    sdk,
    contests,
    liveContests,
    userContests,
    loading,
    error,
    refreshContests,
    refreshLiveContests,
    refreshUserContests,
    getContest,
    enterContest,
    canEnterContest,
    formatAmount
  }

  return (
    <L2MarketsContext.Provider value={value}>
      {children}
    </L2MarketsContext.Provider>
  )
}

export function useL2Markets() {
  const context = useContext(L2MarketsContext)
  if (context === undefined) {
    throw new Error('useL2Markets must be used within a L2MarketsProvider')
  }
  return context
}
