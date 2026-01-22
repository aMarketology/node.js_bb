'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useAuth } from '@/app/contexts/AuthContext'
import { useUnifiedSDK, MarketStatus } from '@/app/contexts/UnifiedSDKContext'
import SDKMarketCard from '@/app/components/SDKMarketCard'
import SDKWalletBalance from '@/app/components/SDKWalletBalance'
import SDKBridgeInterface from '@/app/components/SDKBridgeInterface'

type FilterStatus = 'all' | 'active' | 'pending' | 'frozen' | 'resolved'

export default function SDKMarketsPage() {
  const { isAuthenticated } = useAuth()
  const { 
    isConnected, 
    isL2Available, 
    isLoading,
    getActiveMarkets,
    getPendingMarkets,
    getFrozenMarkets,
    getResolvedMarkets,
    refreshBalance
  } = useUnifiedSDK()

  const [markets, setMarkets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBridge, setShowBridge] = useState(false)

  // Load markets based on filter
  const loadMarkets = async () => {
    if (!isL2Available) {
      setError('L2 server not available')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let loadedMarkets: any[] = []

      switch (filter) {
        case 'active':
          loadedMarkets = await getActiveMarkets()
          break
        case 'pending':
          loadedMarkets = await getPendingMarkets()
          break
        case 'frozen':
          loadedMarkets = await getFrozenMarkets()
          break
        case 'resolved':
          loadedMarkets = await getResolvedMarkets()
          break
        default:
          // Load all (active by default)
          loadedMarkets = await getActiveMarkets()
      }

      setMarkets(loadedMarkets)
      console.log(`✅ Loaded ${loadedMarkets.length} ${filter} markets`)
    } catch (err: any) {
      console.error('Failed to load markets:', err)
      setError(err.message || 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }

  // Reload markets when filter changes
  useEffect(() => {
    if (isL2Available) {
      loadMarkets()
    }
  }, [filter, isL2Available])

  // Filter markets by search query
  const filteredMarkets = markets.filter(market => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      market.title?.toLowerCase().includes(query) ||
      market.description?.toLowerCase().includes(query) ||
      market.outcomes?.some((o: string) => o.toLowerCase().includes(query))
    )
  })

  const handleBetPlaced = () => {
    loadMarkets()
    refreshBalance()
  }

  return (
    <div className="min-h-screen bg-dark-100">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎯 Prediction Markets</h1>
          <p className="text-gray-400">Trade on the outcomes of real-world events using BlackBook L2</p>
        </div>

        {/* Top Row: Wallet + Bridge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Balance */}
          <div className="lg:col-span-2">
            <SDKWalletBalance
              showUnified={true}
              showBridge={true}
              onDepositClick={() => setShowBridge(true)}
              onWithdrawClick={() => setShowBridge(true)}
            />
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-dark-200 border border-dark-border rounded-xl">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Market Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Markets:</span>
                <span className="text-white font-semibold">{markets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SDK Status:</span>
                <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                  {isConnected ? '✅ Connected' : '⏳ Connecting...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">L2 Server:</span>
                <span className={isL2Available ? 'text-green-400' : 'text-red-400'}>
                  {isL2Available ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Status Filter */}
          <div className="flex bg-dark-200 rounded-xl p-1 overflow-x-auto">
            {(['all', 'active', 'pending', 'frozen', 'resolved'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-prism-teal text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets..."
                className="w-full px-4 py-2.5 pl-10 bg-dark-200 border border-dark-border rounded-xl text-white focus:border-prism-teal focus:outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadMarkets}
            disabled={loading}
            className="px-4 py-2.5 bg-dark-200 border border-dark-border rounded-xl text-gray-400 hover:text-white hover:bg-dark-300 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-6 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 bg-dark-200 border border-dark-border rounded-xl animate-pulse">
                <div className="h-6 bg-dark-300 rounded w-3/4 mb-4" />
                <div className="h-4 bg-dark-300 rounded w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-12 bg-dark-300 rounded" />
                  <div className="h-12 bg-dark-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Markets Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMarkets.map((market) => (
                <motion.div
                  key={market.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <SDKMarketCard
                    market={market}
                    showBetting={isAuthenticated && market.status === 'active'}
                    onBetPlaced={handleBetPlaced}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMarkets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No Markets Found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery 
                ? `No markets match "${searchQuery}"`
                : `No ${filter === 'all' ? '' : filter} markets available`}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilter('all'); }}
              className="px-4 py-2 bg-prism-teal hover:bg-prism-teal/90 rounded-xl font-semibold text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Bridge Modal */}
        <AnimatePresence>
          {showBridge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowBridge(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md"
              >
                <SDKBridgeInterface onClose={() => setShowBridge(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
