'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { FanCreditSDK } from '@/sdk/fancredit-sdk'
import { useAuth } from './AuthContext'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface FanCreditBalance {
  available: number
  locked: number
  total: number
  address: string
}

interface FanCreditTransaction {
  id: string
  type: string
  amount: number
  from: string
  to: string
  timestamp: number
  description: string
}

interface FanCreditContextType {
  sdk: FanCreditSDK | null
  balance: FanCreditBalance | null
  transactions: FanCreditTransaction[]
  loading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  refreshTransactions: () => Promise<void>
  canEnterContest: (entryFee: number) => Promise<boolean>
  formatFC: (amount: number) => string
}

const FanCreditContext = createContext<FanCreditContextType | undefined>(undefined)

export function FanCreditProvider({ children }: { children: ReactNode }) {
  const { activeWalletData, isAuthenticated } = useAuth()
  const [sdk, setSdk] = useState<FanCreditSDK | null>(null)
  const [balance, setBalance] = useState<FanCreditBalance | null>(null)
  const [transactions, setTransactions] = useState<FanCreditTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    const fanCreditSDK = new FanCreditSDK({
      l2Url: L2_API,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    setSdk(fanCreditSDK)
  }, [])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!sdk || !activeWalletData?.l2Address || !isAuthenticated) {
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const fcBalance = await sdk.getBalance(activeWalletData.l2Address)
      setBalance(fcBalance)
    } catch (err) {
      console.error('Failed to load FanCredit balance:', err)
      setError(err instanceof Error ? err.message : 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }, [sdk, activeWalletData, isAuthenticated])

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    if (!sdk || !activeWalletData?.l2Address || !isAuthenticated) {
      return
    }

    try {
      const txHistory = await sdk.getTransactionHistory(activeWalletData.l2Address)
      setTransactions(txHistory)
    } catch (err) {
      console.error('Failed to load FanCredit transactions:', err)
      // Don't set error for transactions, they're optional
    }
  }, [sdk, activeWalletData, isAuthenticated])

  // Check if user can enter contest
  const canEnterContest = useCallback(async (entryFee: number): Promise<boolean> => {
    if (!sdk || !activeWalletData?.l2Address) {
      return false
    }

    try {
      return await sdk.canEnterContest(activeWalletData.l2Address, entryFee)
    } catch (err) {
      console.error('Failed to check contest eligibility:', err)
      return false
    }
  }, [sdk, activeWalletData])

  // Format FC for display
  const formatFC = useCallback((amount: number): string => {
    if (!sdk) return `${amount} FC`
    return sdk.formatFC(amount)
  }, [sdk])

  // Auto-load balance and transactions when wallet is connected
  useEffect(() => {
    if (isAuthenticated && activeWalletData?.l2Address && sdk) {
      refreshBalance()
      refreshTransactions()
      
      // Refresh balance every 30 seconds
      const interval = setInterval(refreshBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, activeWalletData, sdk, refreshBalance, refreshTransactions])

  const value = {
    sdk,
    balance,
    transactions,
    loading,
    error,
    refreshBalance,
    refreshTransactions,
    canEnterContest,
    formatFC
  }

  return (
    <FanCreditContext.Provider value={value}>
      {children}
    </FanCreditContext.Provider>
  )
}

export function useFanCredit() {
  const context = useContext(FanCreditContext)
  if (context === undefined) {
    throw new Error('useFanCredit must be used within a FanCreditProvider')
  }
  return context
}
