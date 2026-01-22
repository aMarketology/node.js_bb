'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useAuth } from '@/app/contexts/AuthContext'
import { LedgerSDK, TxType } from './ledger-sdk.js'

interface Transaction {
  id: string
  layer: 'l1' | 'l2'
  type: string
  from_address?: string
  to_address?: string
  amount: number
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  tx_hash?: string
  l2_tx_id?: string
  lock_id?: string
  market_id?: string
  outcome?: number
  shares?: number
  description?: string
}

type FilterType = 'all' | 'l1' | 'l2' | 'deposit' | 'withdraw' | 'bridge_out' | 'bridge_in' | 'transfer' | 'settlement' | 'trade_buy' | 'trade_sell' | 'clearinghouse_deposit' | 'clearinghouse_withdraw'

export default function LedgerPage() {
  const { isAuthenticated, activeWalletData } = useAuth()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layerFilter, setLayerFilter] = useState<'all' | 'l1' | 'l2'>('all')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [showMyTxOnly, setShowMyTxOnly] = useState(false)
  const [sdk] = useState(() => new LedgerSDK({
    l1Url: process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080',
    l2Url: process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
  }))

  const loadLedger = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let txs: Transaction[] = []

      if (showMyTxOnly && activeWalletData) {
        // Get user-specific transactions
        const address = activeWalletData.l1Address || activeWalletData.l2Address
        txs = await sdk.getUserTransactions(address, {
          layer: layerFilter === 'all' ? undefined : layerFilter,
          limit: 100
        })
      } else {
        // Get all transactions
        if (layerFilter === 'l1') {
          txs = await sdk.fetchL1Transactions({ limit: 100 })
        } else if (layerFilter === 'l2') {
          txs = await sdk.fetchL2Transactions({ limit: 100 })
        } else {
          txs = await sdk.getAll({ limit: 100 })
        }
      }

      // Apply type filter
      if (typeFilter !== 'all' && typeFilter !== 'l1' && typeFilter !== 'l2') {
        txs = txs.filter(tx => tx.type === typeFilter)
      }

      setTransactions(txs)
    } catch (err: any) {
      console.error('Failed to load ledger:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [layerFilter, typeFilter, showMyTxOnly, activeWalletData, sdk])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  const formatAddress = (address?: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 10)}...${address.slice(-8)}`
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'bg-green-500/20 text-green-400 border-green-500/30',
      withdraw: 'bg-red-500/20 text-red-400 border-red-500/30',
      bridge_out: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      bridge_in: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      transfer: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      settlement: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      trade_buy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      trade_sell: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      market_create: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      market_resolve: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      clearinghouse_deposit: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      clearinghouse_withdraw: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      liquidity_add: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
      liquidity_remove: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    }
    return colors[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  const getLayerBadge = (layer: 'l1' | 'l2') => {
    return layer === 'l1' 
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'clearinghouse_deposit':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'withdraw':
      case 'clearinghouse_withdraw':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        )
      case 'bridge_out':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'bridge_in':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
        )
      case 'transfer':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      case 'trade_buy':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'trade_sell':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return styles[status] || styles.pending
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Transaction <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Ledger</span>
          </h1>
          <p className="text-slate-400">
            Complete transaction history across Layer 1 (Bank) and Layer 2 (CPMM)
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 rounded-xl border border-slate-700 p-6 mb-6 space-y-4"
        >
          {/* Layer Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Layer</label>
            <div className="flex gap-2">
              {(['all', 'l1', 'l2'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setLayerFilter(layer)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    layerFilter === layer
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {layer === 'all' ? 'All Layers' : layer === 'l1' ? 'Layer 1 (Bank)' : 'Layer 2 (CPMM)'}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Transaction Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                All Types
              </button>
              
              {/* L1 Types */}
              {(layerFilter === 'all' || layerFilter === 'l1') && (
                <>
                  <button
                    onClick={() => setTypeFilter(TxType.DEPOSIT)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.DEPOSIT
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.WITHDRAW)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.WITHDRAW
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.BRIDGE_OUT)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.BRIDGE_OUT
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Bridge Out
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.BRIDGE_IN)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.BRIDGE_IN
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Bridge In
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.TRANSFER)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.TRANSFER
                        ? 'bg-yellow-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.SETTLEMENT)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.SETTLEMENT
                        ? 'bg-pink-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Settlement
                  </button>
                </>
              )}

              {/* L2 Types */}
              {(layerFilter === 'all' || layerFilter === 'l2') && (
                <>
                  <button
                    onClick={() => setTypeFilter(TxType.TRADE_BUY)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.TRADE_BUY
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Buy Trade
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.TRADE_SELL)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.TRADE_SELL
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Sell Trade
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.CLEARINGHOUSE_DEPOSIT)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.CLEARINGHOUSE_DEPOSIT
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    CH Deposit
                  </button>
                  <button
                    onClick={() => setTypeFilter(TxType.CLEARINGHOUSE_WITHDRAW)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === TxType.CLEARINGHOUSE_WITHDRAW
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    CH Withdraw
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            {/* My Transactions Toggle */}
            {isAuthenticated && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyTxOnly}
                  onChange={(e) => setShowMyTxOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                />
                <span className="text-sm text-slate-300">My transactions only</span>
              </label>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadLedger}
              disabled={loading}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg
                className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 font-medium mb-2">Failed to load ledger</p>
              <p className="text-slate-500 text-sm mb-4">{error}</p>
              <button
                onClick={loadLedger}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400">No transactions found</p>
              <p className="text-slate-500 text-sm mt-2">
                {showMyTxOnly ? 'You have no transactions yet' : 'The ledger is empty'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700 p-4 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getLayerBadge(tx.layer)}`}>
                              {tx.layer.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(tx.type)}`}>
                              {tx.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(tx.status)}`}>
                              {tx.status.toUpperCase()}
                            </span>
                          </div>
                          {tx.description && (
                            <p className="text-sm text-slate-400">{tx.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold ${
                            tx.type === 'deposit' || tx.type === 'bridge_in' || tx.type === 'trade_sell' || tx.type === 'clearinghouse_deposit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'bridge_in' || tx.type === 'trade_sell' || tx.type === 'clearinghouse_deposit' ? '+' : '-'}
                            {formatAmount(tx.amount)}
                          </div>
                          <div className="text-xs text-slate-500">{formatDate(tx.timestamp)}</div>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {tx.from_address && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">From:</span>
                            <span className="font-mono text-slate-300">{formatAddress(tx.from_address)}</span>
                          </div>
                        )}
                        {tx.to_address && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">To:</span>
                            <span className="font-mono text-slate-300">{formatAddress(tx.to_address)}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {tx.tx_hash && (
                          <div className="flex items-center gap-1">
                            <span>TX:</span>
                            <span className="font-mono">{tx.tx_hash.slice(0, 16)}...</span>
                          </div>
                        )}
                        {tx.lock_id && (
                          <div className="flex items-center gap-1">
                            <span>Lock ID:</span>
                            <span className="font-mono">{tx.lock_id}</span>
                          </div>
                        )}
                        {tx.l2_tx_id && (
                          <div className="flex items-center gap-1">
                            <span>L2 TX:</span>
                            <span className="font-mono">{tx.l2_tx_id.slice(0, 16)}...</span>
                          </div>
                        )}
                        {tx.market_id && (
                          <div className="flex items-center gap-1">
                            <span>Market:</span>
                            <span className="font-mono">{tx.market_id.slice(0, 16)}...</span>
                          </div>
                        )}
                        {tx.shares !== undefined && (
                          <div className="flex items-center gap-1">
                            <span>Shares:</span>
                            <span className="font-mono">{tx.shares.toFixed(2)}</span>
                          </div>
                        )}
                        {tx.outcome !== undefined && (
                          <div className="flex items-center gap-1">
                            <span>Outcome:</span>
                            <span className="font-mono">{tx.outcome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && !error && transactions.length > 0 && (
            <div className="mt-6 text-center text-sm text-slate-500">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
