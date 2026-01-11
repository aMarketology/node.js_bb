'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { useLayer2 } from './contexts/Layer2Context'

// Import L2 SDK
const { L2MarketsSDK } = require('@/l2-markets-sdk.js')

interface Market {
  id: string
  title: string
  description: string
  outcomes: string[]
  status: string
  totalVolume: number
  betCount: number
  category: string
  bettingClosesAt?: string
  prices?: number[]
  hasLiquidity?: boolean
  liquidity?: number
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([])
  const [statusCounts, setStatusCounts] = useState({ pending: 0, active: 0, frozen: 0, resolved: 0 })

  const categories = ['All', 'Sports', 'Politics', 'Crypto', 'Entertainment', 'Science']
  const statusFilters = ['All', 'Active', 'Pending', 'Frozen', 'Resolved']
  const sdk = new L2MarketsSDK('http://localhost:1234')

  useEffect(() => {
    loadMarkets()
  }, [activeCategory, statusFilter])

  async function loadMarkets() {
    setLoading(true)
    setError(null)
    try {
      // Use SDK to get markets organized by status
      const byStatus = await sdk.getEventsByStatus()
      
      // Update status counts
      setStatusCounts(byStatus.summary)
      
      // Combine all markets based on status filter
      let allMarkets: any[] = []
      if (statusFilter === 'All') {
        allMarkets = [...byStatus.pending, ...byStatus.active, ...byStatus.frozen, ...byStatus.resolved]
      } else if (statusFilter === 'Pending') {
        allMarkets = byStatus.pending
      } else if (statusFilter === 'Active') {
        allMarkets = byStatus.active
      } else if (statusFilter === 'Frozen') {
        allMarkets = byStatus.frozen
      } else if (statusFilter === 'Resolved') {
        allMarkets = byStatus.resolved
      }
      
      // Filter by category if needed
      if (activeCategory !== 'All') {
        allMarkets = allMarkets.filter(m => 
          m.category?.toLowerCase() === activeCategory.toLowerCase() ||
          m.marketCategory?.toLowerCase() === activeCategory.toLowerCase()
        )
      }
      
      // Format for display
      const formatted = allMarkets.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        outcomes: m.outcomes || [],
        status: m.status,
        totalVolume: m.totalVolume || 0,
        betCount: m.betCount || 0,
        category: m.category || m.marketCategory || activeCategory,
        bettingClosesAt: m.bettingClosesAt,
        prices: m.prices || [],
        hasLiquidity: m.hasLiquidity,
        liquidity: m.liquidity || 0
      }))
      
      setMarkets(formatted)
      
      // Set featured markets (top active by volume)
      setFeaturedMarkets(byStatus.active.slice(0, 3).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        outcomes: m.outcomes || [],
        status: m.status,
        totalVolume: m.totalVolume || 0,
        betCount: m.betCount || 0,
        category: m.category,
        bettingClosesAt: m.bettingClosesAt,
        prices: m.prices || [],
        hasLiquidity: m.hasLiquidity,
        liquidity: m.liquidity || 0
      })))
      
      console.log('✅ Loaded markets:', byStatus.summary)
    } catch (err: any) {
      console.error('Failed to load markets:', err)
      setError(`Cannot connect to Layer 2 server`)
      setMarkets([])
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter(m => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'All' || 
      m.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      {/* === HERO SECTION === */}
      <section className="relative py-16 overflow-hidden border-b border-dark-border">
        {/* Subtle Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="prism-orb prism-orb-teal w-[400px] h-[400px] -top-32 -right-32 opacity-20" />
          <div className="prism-orb prism-orb-purple w-[300px] h-[300px] -bottom-24 -left-24 opacity-20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-black">
              <span className="prism-gradient-text">Prism</span>
              <span className="text-white"> Markets</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Trade on real-world events with complete transparency and instant settlement
            </p>
            
            {/* Market Stats Overview */}
            <div className="flex justify-center gap-6 mt-8">
              <div className="prism-card px-6 py-3 rounded-lg">
                <div className="text-sm text-gray-400">Active Markets</div>
                <div className="text-2xl font-bold text-prism-teal">{statusCounts.active}</div>
              </div>
              <div className="prism-card px-6 py-3 rounded-lg">
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</div>
              </div>
              <div className="prism-card px-6 py-3 rounded-lg">
                <div className="text-sm text-gray-400">Frozen</div>
                <div className="text-2xl font-bold text-blue-400">{statusCounts.frozen}</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-prism-teal transition-colors"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CATEGORY FILTERS === */}
      <section className="relative py-8 border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Category</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                      activeCategory === category
                        ? 'bg-prism-teal text-dark border-2 border-prism-teal'
                        : 'bg-dark-200 text-gray-400 border-2 border-dark-border hover:border-prism-teal/50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Market Status</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {statusFilters.map((status) => {
                  const count = status === 'All' 
                    ? statusCounts.pending + statusCounts.active + statusCounts.frozen + statusCounts.resolved
                    : status === 'Pending' 
                    ? statusCounts.pending
                    : status === 'Active'
                    ? statusCounts.active
                    : status === 'Frozen'
                    ? statusCounts.frozen
                    : statusCounts.resolved
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                        statusFilter === status
                          ? 'bg-prism-purple text-white border-2 border-prism-purple'
                          : 'bg-dark-200 text-gray-400 border-2 border-dark-border hover:border-prism-purple/50'
                      }`}
                    >
                      {status === 'Pending' && '⏳ '}
                      {status === 'Active' && '🟢 '}
                      {status === 'Frozen' && '🔵 '}
                      {status === 'Resolved' && '✅ '}
                      {status} <span className="ml-1 text-xs opacity-70">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === MARKETS GRID === */}
      <section className="relative py-12 bg-dark-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          
          {error ? (
            <div className="text-center py-24">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-prism-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-prism-red font-bold text-xl mb-2">Cannot Connect to Layer 2</p>
              <p className="text-gray-400 text-sm mb-2">{error}</p>
              <p className="text-gray-500 text-xs mb-6">Make sure the L2 server is running on localhost:1234</p>
              <button
                onClick={loadMarkets}
                className="px-8 py-3 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
              >
                Retry Connection
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-24">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal mb-6"></div>
              <p className="text-gray-300 text-lg font-semibold">Loading markets...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching from Layer 2 blockchain</p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">🔍</div>
              <p className="text-gray-400 text-lg">No markets found</p>
              <p className="text-gray-500 text-sm mt-2">Try a different category or search term</p>
            </div>
          ) : (
            <>
              {/* Featured Markets */}
              {featuredMarkets.length > 0 && searchQuery === '' && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-prism-gold">⭐</span>
                    Featured Markets
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {featuredMarkets.map((market) => (
                      <MarketCard key={market.id} market={market} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* All Markets */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {searchQuery ? `Search Results (${filteredMarkets.length})` : `${activeCategory} Markets`}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMarkets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

// Market Card Component
function MarketCard({ market, featured = false }: { market: Market; featured?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'text-prism-teal'
      case 'active': return 'text-prism-teal'
      case 'pending': return 'text-yellow-500'
      case 'frozen': return 'text-blue-400'
      case 'closed': return 'text-gray-500'
      case 'resolved': return 'text-prism-gold'
      default: return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '🟢 Open'
      case 'active': return '🟢 Active'
      case 'pending': return '⏳ Pending'
      case 'frozen': return '🔵 Frozen'
      case 'closed': return '🔴 Closed'
      case 'resolved': return '✅ Resolved'
      default: return status
    }
  }

  const calculatePercentages = (market: Market) => {
    if (!market.prices || market.prices.length === 0) {
      return market.outcomes.map(() => `${(100 / market.outcomes.length).toFixed(0)}%`)
    }
    return market.prices.map(p => `${(p * 100).toFixed(0)}%`)
  }

  const percentages = calculatePercentages(market)
  const closesDate = market.bettingClosesAt 
    ? new Date(market.bettingClosesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })
    : 'TBD'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/markets/${market.id}`} className={`block prism-card rounded-xl overflow-hidden transition-all duration-300 ${
        featured ? 'border-2 border-prism-gold' : ''
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-dark-border">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg group-hover:text-prism-teal transition-colors line-clamp-2">
                {market.title}
              </h3>
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(market.status)}`}>
              {getStatusBadge(market.status)}
            </span>
          </div>
          
          {market.description && (
            <p className="text-gray-400 text-sm line-clamp-2">{market.description}</p>
          )}
          
          {/* Pending Market Notice with Liquidity Progress */}
          {market.status.toLowerCase() === 'pending' && (
            <div className="mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-500 text-xs font-semibold">⚠️ Needs liquidity to activate</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Current: {market.liquidity || 0} BB</span>
                  <span className="text-gray-400">Need: 100 BB</span>
                </div>
                <div className="h-1.5 bg-dark-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: `${Math.min(100, ((market.liquidity || 0) / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Frozen Market Notice */}
          {market.status.toLowerCase() === 'frozen' && (
            <div className="mt-3 px-3 py-2 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <p className="text-blue-400 text-xs font-semibold">🔵 Betting closed - awaiting resolution</p>
            </div>
          )}
        </div>

        {/* Outcomes */}
        <div className="p-5 bg-dark-200/50 space-y-2">
          {market.outcomes.map((outcome, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-300 text-sm font-medium">{outcome}</span>
              <span className="text-prism-teal font-bold">{percentages[idx]}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 flex items-center justify-between text-sm">
          <div className="space-y-1">
            <div className="text-gray-500">Volume</div>
            <div className="text-white font-bold">{market.totalVolume.toLocaleString()} BB</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-gray-500">Closes</div>
            <div className="text-white font-semibold">{closesDate}</div>
          </div>
        </div>

        {featured && (
          <div className="absolute top-3 right-3 text-prism-gold text-2xl">⭐</div>
        )}
      </Link>
    </motion.div>
  )
}