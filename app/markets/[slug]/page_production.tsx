'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import TradingInterface from '@/app/components/TradingInterface'
import WalletBalance from '@/app/components/WalletBalance'
import { useMarkets } from '@/app/contexts/MarketsContext'
import { useAuth } from '@/app/contexts/AuthContext'

interface Market {
  id: string
  title: string
  description?: string
  category?: string
  status: string
  outcomes: string[]
  prices: number[]
  volume?: number
  liquidity?: number
  created_at?: string
  closes_at?: string
  resolved_outcome?: number
  resolution_details?: string
  pool_state?: {
    reserves: number[]
    k: number
    total_shares: number
  }
}

interface Position {
  market_id: string
  shares: number[]
  cost_basis: number[]
  avg_price: number[]
}

export default function MarketDetailPage() {
  const params = useParams()
  const marketId = params?.slug as string

  const { isReady, getMarket, getPrices, getPoolState, getPosition, getAllPositions } = useMarkets()
  const { isAuthenticated, activeWalletData } = useAuth()

  const [market, setMarket] = useState<Market | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load market data
  const loadMarket = useCallback(async () => {
    if (!marketId) return

    try {
      setLoading(true)
      setError(null)

      if (isReady) {
        // Use SDK
        const marketData = await getMarket(marketId)
        
        // Get live prices
        try {
          const prices = await getPrices(marketId)
          marketData.prices = prices
        } catch {
          // Use existing prices if live fetch fails
        }

        // Get pool state
        try {
          const poolState = await getPoolState(marketId)
          marketData.pool_state = poolState
        } catch {
          // Pool state optional
        }

        setMarket(marketData)
      } else {
        // Fallback to API
        const res = await fetch(`/api/markets?id=${marketId}`)
        if (!res.ok) throw new Error('Market not found')
        const data = await res.json()
        setMarket(data.market || data)
      }
    } catch (err: any) {
      console.error('Failed to load market:', err)
      setError(err.message || 'Failed to load market')
    } finally {
      setLoading(false)
    }
  }, [marketId, isReady, getMarket, getPrices, getPoolState])

  // Load user position
  const loadPosition = useCallback(async () => {
    if (!isReady || !isAuthenticated || !marketId) return

    try {
      const pos = await getPosition(marketId)
      setPosition(pos)
    } catch {
      setPosition(null)
    }
  }, [isReady, isAuthenticated, marketId, getPosition])

  useEffect(() => {
    loadMarket()
  }, [loadMarket])

  useEffect(() => {
    loadPosition()
  }, [loadPosition, refreshKey])

  // Handle trade completion - refresh data
  const handleTradeComplete = useCallback(() => {
    setRefreshKey(k => k + 1)
    loadMarket()
  }, [loadMarket])

  // Format helpers
  const formatPrice = (price: number) => `${(price * 100).toFixed(1)}¢`
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
    return num.toFixed(2)
  }
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading market...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-40">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 font-medium mb-2">Market Not Found</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <a
              href="/markets"
              className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Markets
            </a>
          </div>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    frozen: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    resolved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Back Link */}
        <a
          href="/markets"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/60 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  {market.category && (
                    <span className="text-sm text-slate-500 capitalize mb-1 block">
                      {market.category}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-white">{market.title}</h1>
                </div>
                <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${statusColors[market.status] || 'bg-slate-700 text-slate-300'}`}>
                  {market.status === 'resolved' && market.resolved_outcome !== undefined
                    ? `✓ ${market.outcomes[market.resolved_outcome]}`
                    : market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                </span>
              </div>

              {market.description && (
                <p className="text-slate-400 mb-6">{market.description}</p>
              )}

              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {market.volume !== undefined && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Volume</div>
                    <div className="text-lg font-semibold text-white">${formatNumber(market.volume)}</div>
                  </div>
                )}
                {market.liquidity !== undefined && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Liquidity</div>
                    <div className="text-lg font-semibold text-white">${formatNumber(market.liquidity)}</div>
                  </div>
                )}
                {market.closes_at && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Closes</div>
                    <div className="text-sm font-medium text-white">{formatDate(market.closes_at)}</div>
                  </div>
                )}
                {market.created_at && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Created</div>
                    <div className="text-sm font-medium text-white">{formatDate(market.created_at)}</div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Outcomes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/60 rounded-xl border border-slate-700 p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Outcomes</h2>
              <div className="space-y-4">
                {market.outcomes.map((outcome, idx) => {
                  const price = market.prices?.[idx] || 0.5
                  const isWinner = market.resolved_outcome === idx
                  
                  return (
                    <div
                      key={idx}
                      className={`bg-slate-900/50 rounded-lg p-4 border ${
                        isWinner ? 'border-green-500/50 bg-green-500/10' : 'border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white flex items-center gap-2">
                          {isWinner && (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {outcome}
                        </span>
                        <span className={`text-lg font-bold ${idx === 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPrice(price)}
                        </span>
                      </div>
                      
                      {/* Price Bar */}
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${idx === 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${price * 100}%` }}
                        />
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-500">
                        Implied probability: {formatPercent(price)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* User Position */}
            {position && position.shares && position.shares.some(s => s > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/60 rounded-xl border border-purple-500/30 p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Your Position</h2>
                <div className="space-y-3">
                  {market.outcomes.map((outcome, idx) => {
                    const shares = position.shares?.[idx] || 0
                    if (shares <= 0) return null

                    const costBasis = position.cost_basis?.[idx] || 0
                    const currentValue = shares * (market.prices?.[idx] || 0.5)
                    const pnl = currentValue - costBasis

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div>
                          <div className="font-medium text-white">{outcome}</div>
                          <div className="text-sm text-slate-400">
                            {shares.toFixed(2)} shares @ {formatPrice(position.avg_price?.[idx] || 0.5)} avg
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">${currentValue.toFixed(2)}</div>
                          <div className={`text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({((pnl / costBasis) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Pool State (for advanced users) */}
            {market.pool_state && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/60 rounded-xl border border-slate-700 p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Pool State</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-slate-500 mb-1">Reserves</div>
                    <div className="text-white font-mono">
                      {market.pool_state.reserves?.map(r => formatNumber(r)).join(' / ') || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-slate-500 mb-1">Constant K</div>
                    <div className="text-white font-mono">{formatNumber(market.pool_state.k || 0)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trading Interface */}
            {market.status === 'active' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <TradingInterface
                  marketId={market.id}
                  outcomes={market.outcomes}
                  onTradeComplete={handleTradeComplete}
                />
              </motion.div>
            )}

            {/* Resolved Market Message */}
            {market.status === 'resolved' && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Market Resolved</h3>
                <p className="text-slate-400">
                  Winner: <span className="text-purple-400 font-medium">
                    {market.outcomes[market.resolved_outcome!]}
                  </span>
                </p>
                {market.resolution_details && (
                  <p className="text-sm text-slate-500 mt-2">{market.resolution_details}</p>
                )}
              </div>
            )}

            {/* Frozen Market Message */}
            {market.status === 'frozen' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Trading Paused</h3>
                <p className="text-slate-400">This market is awaiting resolution</p>
              </div>
            )}

            {/* Wallet Balance */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <WalletBalance
                  compact={false}
                  onDepositClick={() => window.location.href = '/wallet'}
                  onWithdrawClick={() => window.location.href = '/wallet'}
                />
              </motion.div>
            )}

            {/* Market ID for reference */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
              <div className="text-xs text-slate-500 mb-1">Market ID</div>
              <div className="font-mono text-sm text-slate-400 break-all">{market.id}</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
