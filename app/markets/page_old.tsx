'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import { useMarkets } from '@/app/contexts/MarketsContext'

interface Market {
  id: string
  slug?: string
  title: string
  description?: string
  outcomes?: string[]
  prices?: number[]
  status: string
  liquidity: number
  totalVolume: number
  betCount?: number
  cpmmEnabled?: boolean
  bettingClosesAt?: number
  createdAt?: number
}

export default function MarketsPage() {
  const { getActiveEvents, isReady } = useMarkets()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isReady) {
      loadMarkets()
    }
  }, [isReady])

  async function loadMarkets() {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔗 Fetching active markets from L2 blockchain...')
      
      // Use new SDK method that already filters by MIN_ACTIVE_LIQUIDITY (100 BB)
      const activeEvents = await getActiveEvents()
      
      setMarkets(activeEvents)
      console.log(`✅ Loaded ${activeEvents.length} active markets with ≥100 BB liquidity`)
      
      if (activeEvents.length === 0) {
        console.log('⚠️ No active markets with sufficient liquidity')
      }
    } catch (err: any) {
      console.error('❌ Failed to load markets:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter(market => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return market.title.toLowerCase().includes(query) ||
             market.description?.toLowerCase().includes(query)
    }
    
    return true
  })

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 prism-gradient-bg opacity-5" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Active <span className="prism-gradient-text">Markets</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Trade on live prediction markets with ≥100 BB liquidity
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                />
                <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-24">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal mb-4"></div>
              <p className="text-gray-400">Loading markets from L2 blockchain...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-prism-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-prism-red font-bold text-lg mb-2">Connection Failed</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={loadMarkets}
                className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg mb-2">No markets found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market, index) => (
                <MarketCard key={market.id} market={market} index={index} />
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && !error && markets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <div className="inline-flex items-center gap-8 px-8 py-4 bg-dark-200 border border-dark-border rounded-2xl">
                <div>
                  <div className="text-3xl font-bold prism-gradient-text">{markets.length}</div>
                  <div className="text-sm text-gray-500">Active Markets</div>
                </div>
                <div className="w-px h-12 bg-dark-border" />
                <div>
                  <div className="text-3xl font-bold prism-gradient-text">{filteredMarkets.length}</div>
                  <div className="text-sm text-gray-500">Showing</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
        active
          ? 'bg-prism-teal text-white shadow-lg shadow-prism-teal/50'
          : 'bg-dark-200 text-gray-400 border border-dark-border hover:border-prism-teal hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function MarketCard({ market, index }: { market: Market; index: number }) {
  const formatBB = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`
    return amount.toFixed(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Link
        href={`/markets/${market.slug || market.id}`}
        className="block prism-card rounded-2xl overflow-hidden hover:border-prism-teal transition-all duration-500 shadow-xl hover:shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-border bg-dark-200/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
              🟢 Active
            </span>
            <span className="text-xs text-gray-400">
              {market.betCount || 0} bets
            </span>
          </div>
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
            {market.title}
          </h3>
        </div>

        {/* Outcomes/Prices */}
        <div className="p-4 space-y-2">
          {market.outcomes && market.prices && market.outcomes.map((outcome, i) => {
            const price = market.prices![i] || 0.5
            const probability = (price * 100).toFixed(1)
            
            return (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors">
                <span className="text-gray-300 text-sm font-medium">{outcome}</span>
                <div className="text-right">
                  <div className="text-prism-teal font-bold">{probability}%</div>
                  <div className="text-xs text-gray-500">{(1/price).toFixed(2)}x</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-dark-border bg-dark-200/30">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Volume:</span>
              <span className="text-white font-bold ml-2">{formatBB(market.totalVolume)} BB</span>
            </div>
            <div>
              <span className="text-gray-500">Liquidity:</span>
              <span className="text-prism-gold font-bold ml-2">{formatBB(market.liquidity)} BB</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
