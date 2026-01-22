'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMarkets } from '../contexts/MarketsContext'

interface WalletBalanceProps {
  showUnified?: boolean
  compact?: boolean
  onDepositClick?: () => void
  onWithdrawClick?: () => void
}

interface BalanceData {
  l1Balance: number
  l2Balance: number
  l2Available: number
  l2Locked: number
  total: number
}

export function WalletBalance({ 
  showUnified = true, 
  compact = false,
  onDepositClick,
  onWithdrawClick 
}: WalletBalanceProps) {
  const { isAuthenticated, activeWalletData } = useAuth()
  const { isReady, getBalance } = useMarkets()
  
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalances = useCallback(async () => {
    if (!isAuthenticated || !activeWalletData) {
      setBalance(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch L2 balance from markets SDK
      if (isReady) {
        const l2BalanceData = await getBalance()
        
        // Fetch unified balance via API
        const address = activeWalletData.l2Address || activeWalletData.l1Address
        const unifiedRes = await fetch(`/api/trading?action=unified_balance&address=${address}`)
        const unifiedData = await unifiedRes.json()

        setBalance({
          l1Balance: parseFloat(unifiedData.l1_balance || '0'),
          l2Balance: parseFloat(l2BalanceData.balance || unifiedData.l2_balance || '0'),
          l2Available: parseFloat(l2BalanceData.available || '0'),
          l2Locked: parseFloat(l2BalanceData.locked || '0'),
          total: parseFloat(unifiedData.total || '0')
        })
      } else {
        // Fallback when SDK not ready
        const address = activeWalletData.l2Address || activeWalletData.l1Address
        const res = await fetch(`/api/trading?action=unified_balance&address=${address}`)
        const data = await res.json()

        setBalance({
          l1Balance: parseFloat(data.l1_balance || '0'),
          l2Balance: parseFloat(data.l2_balance || '0'),
          l2Available: parseFloat(data.l2_balance || '0'),
          l2Locked: 0,
          total: parseFloat(data.total || '0')
        })
      }
    } catch (err: any) {
      console.error('Failed to fetch balances:', err)
      setError(err.message || 'Failed to load balances')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, activeWalletData, isReady, getBalance])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchBalances()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [fetchBalances])

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(2)
  }

  if (!isAuthenticated) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700">
        {loading ? (
          <span className="text-sm text-slate-400">Loading...</span>
        ) : balance ? (
          <>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-white">
              {formatBalance(showUnified ? balance.total : balance.l2Available)}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-400">--</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Wallet Balance</h3>
        <button 
          onClick={fetchBalances}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          disabled={loading}
        >
          <svg 
            className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading && !balance ? (
        <div className="space-y-4">
          <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse" />
          <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            onClick={fetchBalances}
            className="mt-2 text-sm text-purple-400 hover:text-purple-300"
          >
            Try again
          </button>
        </div>
      ) : balance ? (
        <>
          {/* Total Balance */}
          {showUnified && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4 border border-purple-500/30">
              <div className="text-sm text-slate-400 mb-1">Total Balance</div>
              <div className="text-3xl font-bold text-white">
                {formatBalance(balance.total)}
                <span className="text-lg text-slate-400 ml-1">credits</span>
              </div>
            </div>
          )}

          {/* L1 & L2 Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* L1 Balance */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-slate-400">L1 (Bank)</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {formatBalance(balance.l1Balance)}
              </div>
            </div>

            {/* L2 Balance */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-slate-400">L2 (Trading)</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {formatBalance(balance.l2Balance)}
              </div>
              {balance.l2Locked > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  {formatBalance(balance.l2Locked)} locked
                </div>
              )}
            </div>
          </div>

          {/* Available for Trading */}
          <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg mb-6">
            <span className="text-sm text-slate-400">Available for Trading</span>
            <span className="text-lg font-semibold text-green-400">
              {formatBalance(balance.l2Available)} credits
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDepositClick}
              className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Deposit
            </button>
            <button
              onClick={onWithdrawClick}
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Withdraw
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default WalletBalance
