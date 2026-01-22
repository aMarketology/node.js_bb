'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import MarketCard from '@/app/components/MarketCard'
import WalletBalance from '@/app/components/WalletBalance'
import { useMarkets, MarketStatus } from '@/app/contexts/MarketsContext'
import { useAuth } from '@/app/contexts/AuthContext'

interface Market {
  id: string
  title: string
  description?: string
  category?: string
  status: string
  outcomes: string[]
  prices?: number[]
  volume?: number
  liquidity?: number
  closes_at?: string
  created_at?: string
  resolved_outcome?: number
}

type StatusFilter = 'all' | 'active' | 'pending' | 'frozen' | 'resolved'

export default function MarketsIndexPage() {
  const { isReady, getActiveMarkets, getPendingMarkets, getFrozenMarkets, getResolvedMarkets } = useMarkets()
  const { isAuthenticated } = useAuth()
  
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique categories from markets
  const categories = ['all', ...new Set(markets.filter(m => m.category).map(m => m.category!))]

  const loadMarkets = useCallback(async () => {
    if (!isReady) {
      // Fallback to API when SDK not ready
      try {
        setLoading(true)
        const res = await fetch(`/api/markets?status=${statusFilter === 'all' ? 'active' : statusFilter}`)
        const data = await res.json()
        setMarkets(data.markets || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to load markets:', err)
        setError(err.message || 'Failed to load markets')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      setError(null)

      let loadedMarkets: Market[] = []

      if (statusFilter === 'all') {
        // Load all active markets by default
        loadedMarkets = await getActiveMarkets()
      } else {
        switch (statusFilter) {
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
        }
      }

      setMarkets(loadedMarkets)
      console.log(`✅ Loaded ${loadedMarkets.length} ${statusFilter} markets`)
    } catch (err: any) {
      console.error('❌ Failed to load markets:', err)
      setError(err.message || 'Failed to connect to L2 server')
    } finally {
      setLoading(false)
    }
  }, [isReady, statusFilter, getActiveMarkets, getPendingMarkets, getFrozenMarkets, getResolvedMarkets])

  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  // Filter markets by category and search
  const filteredMarkets = markets.filter(market => {
    // Category filter
    if (categoryFilter !== 'all' && market.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        market.title.toLowerCase().includes(query) ||
        market.description?.toLowerCase().includes(query) ||
        market.category?.toLowerCase().includes(query) ||
        market.outcomes.some(o => o.toLowerCase().includes(query))
      )
    }

    return true
  })

  // Group markets by category
  const groupedMarkets = filteredMarkets.reduce((acc, market) => {
    const cat = market.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(market)
    return acc
  }, {} as Record<string, Market[]>)

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Prediction <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Markets</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Trade on outcomes with real-time CPMM pricing powered by BlackBook L2
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto mb-8"
          >
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search markets, outcomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {(['all', 'active', 'pending', 'frozen', 'resolved'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      categoryFilter === category
                        ? 'bg-pink-600 text-white'
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Wallet */}
            {isAuthenticated && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-80 flex-shrink-0"
              >
                <div className="sticky top-24">
                  <WalletBalance 
                    onDepositClick={() => window.location.href = '/wallet'}
                    onWithdrawClick={() => window.location.href = '/wallet'}
                  />
                </div>
              </motion.aside>
            )}

            {/* Markets Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
                  <p className="text-slate-400">Loading markets...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-400 font-medium mb-2">Failed to load markets</p>
                  <p className="text-slate-500 text-sm mb-4">{error}</p>
                  <button
                    onClick={loadMarkets}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 mb-2">No markets found</p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery ? 'Try a different search term' : `No ${statusFilter} markets available`}
                  </p>
                </div>
              ) : categoryFilter === 'all' && !searchQuery ? (
                // Grouped view
                <div className="space-y-10">
                  {Object.entries(groupedMarkets).map(([category, categoryMarkets]) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="capitalize">{category}</span>
                        <span className="text-sm text-slate-500">({categoryMarkets.length})</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryMarkets.map((market) => (
                          <MarketCard key={market.id} market={market} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Flat grid view
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredMarkets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </motion.div>
              )}

              {/* Stats */}
              {!loading && !error && filteredMarkets.length > 0 && (
                <div className="mt-8 text-center text-sm text-slate-500">
                  Showing {filteredMarkets.length} of {markets.length} markets
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
