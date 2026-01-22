'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUnifiedSDK } from '../contexts/UnifiedSDKContext'
import { motion } from 'framer-motion'

interface SDKWalletBalanceProps {
  showUnified?: boolean
  compact?: boolean
  showBridge?: boolean
  onDepositClick?: () => void
  onWithdrawClick?: () => void
}

export function SDKWalletBalance({ 
  showUnified = true, 
  compact = false,
  showBridge = true,
  onDepositClick,
  onWithdrawClick 
}: SDKWalletBalanceProps) {
  const { isAuthenticated } = useAuth()
  const { 
    isConnected, 
    isLoading,
    l1Balance,
    l2Balance,
    unifiedBalance,
    refreshBalance,
    isL2Available
  } = useUnifiedSDK()
  
  const [refreshing, setRefreshing] = useState(false)

  // Refresh balances periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        refreshBalance().catch(console.error)
      }, 30000) // Every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isConnected, refreshBalance])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshBalance()
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(2)
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-dark-200 border border-dark-border rounded-xl animate-pulse`}>
        <div className="h-6 bg-dark-300 rounded w-24 mb-2" />
        <div className="h-8 bg-dark-300 rounded w-32" />
      </div>
    )
  }

  if (!isL2Available) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-dark-200 border border-yellow-500/50 rounded-xl`}>
        <div className="flex items-center gap-2 text-yellow-500 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          L2 Offline
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">L2:</span>
          <span className="font-bold text-prism-gold">{formatBalance(l2Balance.available)} $BB</span>
        </div>
        {showUnified && l1Balance.available > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">L1:</span>
            <span className="font-bold text-prism-teal">{formatBalance(l1Balance.available)} $BC</span>
          </div>
        )}
        <button 
          onClick={handleRefresh}
          className="p-1 hover:bg-dark-300 rounded transition-colors"
          disabled={refreshing}
        >
          <svg 
            className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-dark-200 border border-dark-border rounded-xl space-y-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-300">Wallet Balance</h3>
        <button 
          onClick={handleRefresh}
          className="p-1.5 hover:bg-dark-300 rounded-lg transition-colors"
          disabled={refreshing}
        >
          <svg 
            className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* L2 Balance (Primary) */}
      <div className="p-3 bg-dark-300 rounded-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">L2 Trading Balance</span>
          <span className="text-xs text-prism-purple">$BB</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-prism-gold">{formatBalance(l2Balance.available)}</span>
          <span className="text-sm text-gray-400">$BB</span>
        </div>
        {l2Balance.locked > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            + {formatBalance(l2Balance.locked)} locked in bets
          </div>
        )}
      </div>

      {/* L1 Balance (if unified view) */}
      {showUnified && (
        <div className="p-3 bg-dark-300/50 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">L1 Vault Balance</span>
            <span className="text-xs text-prism-teal">$BC</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-prism-teal">{formatBalance(l1Balance.available)}</span>
            <span className="text-sm text-gray-400">$BC</span>
          </div>
          {l1Balance.locked > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              + {formatBalance(l1Balance.locked)} locked
            </div>
          )}
        </div>
      )}

      {/* Total (Unified) */}
      {showUnified && (
        <div className="pt-3 border-t border-dark-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total Available</span>
            <span className="text-lg font-bold text-white">
              {formatBalance(unifiedBalance.totalAvailable)}
            </span>
          </div>
        </div>
      )}

      {/* Bridge Actions */}
      {showBridge && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onDepositClick}
            className="px-4 py-2 text-sm font-semibold bg-prism-teal/20 hover:bg-prism-teal/30 border border-prism-teal text-prism-teal rounded-lg transition-colors"
          >
            Bridge L1→L2
          </button>
          <button
            onClick={onWithdrawClick}
            className="px-4 py-2 text-sm font-semibold bg-prism-purple/20 hover:bg-prism-purple/30 border border-prism-purple text-prism-purple rounded-lg transition-colors"
          >
            Withdraw L2→L1
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default SDKWalletBalance
