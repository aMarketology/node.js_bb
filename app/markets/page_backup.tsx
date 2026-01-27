'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

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
  category?: string
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [syncStatus, setSyncStatus] = useState<string>('Loading...')
  const supabase = createClientComponentClient()

  const categories = ['all', 'Group Stage', 'Knockout', 'Finals', 'Player Awards', 'Team Stats']

  useEffect(() => {
    loadMarketsFromSupabase()
    setupRealtimeSubscription()
  }, [])

  /**
   * Load markets from Supabase (fast database query)
   * Fallback to L2 if Supabase is empty
   */
  async function loadMarketsFromSupabase() {
    try {
      setLoading(true)
      setError(null)
      setSyncStatus('Loading from database...')
      
      // Try Supabase first (much faster than L2)
      const { data: supabaseMarkets, error: supabaseError } = await supabase
        .from('markets')
        .select(`
          *,
          market_outcomes (*)
        `)
        .eq('status', 'active')
        .gte('total_liquidity', 100)
        .order('created_at', { ascending: false })

      if (!supabaseError && supabaseMarkets && supabaseMarkets.length > 0) {
        // Transform Supabase format to component format
        const formattedMarkets = supabaseMarkets.map((m: any) => ({
          id: m.market_id,
          slug: m.market_id.toLowerCase().replace(/\s+/g, '-'),
          title: m.question,
          description: m.description,
          outcomes: m.market_outcomes?.map((o: any) => o.outcome_name) || [],
          prices: m.market_outcomes?.map((o: any) => o.current_odds) || [],
          status: m.status,
          liquidity: parseFloat(m.total_liquidity || 0),
          totalVolume: parseFloat(m.total_volume || 0),
          betCount: parseInt(m.total_bets || 0),
          category: m.category,
          createdAt: new Date(m.created_at).getTime()
        }))
        
        setMarkets(formattedMarkets)
        setSyncStatus(`✅ ${formattedMarkets.length} markets loaded`)
        setLoading(false)
        return
      }

      // Fallback: Load from L2 and trigger sync
      setSyncStatus('Database empty, syncing from L2...')
      const response = await fetch(`${L2_API}/markets`)
      if (response.ok) {
        const data = await response.json()
        const activeMarkets = (data.markets || []).filter(
          (m: any) => m.liquidity >= 100 && m.status === 'active'
        )
        setMarkets(activeMarkets)
        
        // Trigger background sync to Supabase
        fetch('/api/sync-l2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force_resync: false })
        }).then(() => {
          setSyncStatus('✅ Markets synced to database')
        }).catch(err => {
          console.error('Sync failed:', err)
          setSyncStatus('⚠️ Sync failed (using L2 data)')
        })
      }
    } catch (err: any) {
      console.error('Failed to load markets:', err)
      setError(err.message)
      setSyncStatus('❌ Load failed')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Set up Supabase real-time subscription
   * Automatically updates UI when new bets/markets are created
   */
  function setupRealtimeSubscription() {
    // Subscribe to market changes
    const marketChannel = supabase
      .channel('markets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'markets'
        },
        (payload) => {
          console.log('🔴 LIVE: Market updated', payload)
          
          if (payload.eventType === 'INSERT') {
            // New market created
            const newMarket = payload.new
            const formattedMarket = {
              id: newMarket.market_id,
              slug: newMarket.market_id.toLowerCase().replace(/\s+/g, '-'),
              title: newMarket.question,
              description: newMarket.description,
              outcomes: [],
              prices: [],
              status: newMarket.status,
              liquidity: parseFloat(newMarket.total_liquidity || 0),
              totalVolume: parseFloat(newMarket.total_volume || 0),
              betCount: parseInt(newMarket.total_bets || 0),
              category: newMarket.category,
              createdAt: new Date(newMarket.created_at).getTime()
            }
            
            setMarkets(prev => [formattedMarket, ...prev])
            setSyncStatus(`🔴 LIVE: New market created`)
          } else if (payload.eventType === 'UPDATE') {
            // Market updated (volume, bets, etc.)
            const updatedMarket = payload.new
            setMarkets(prev => prev.map(m => 
              m.id === updatedMarket.market_id
                ? {
                    ...m,
                    liquidity: parseFloat(updatedMarket.total_liquidity || 0),
                    totalVolume: parseFloat(updatedMarket.total_volume || 0),
                    betCount: parseInt(updatedMarket.total_bets || 0),
                    status: updatedMarket.status
                  }
                : m
            ))
            setSyncStatus(`🔴 LIVE: Market updated`)
          }
        }
      )
      .subscribe()

    // Subscribe to bet changes (to update market stats)
    const betChannel = supabase
      .channel('bets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets'
        },
        (payload) => {
          console.log('🔴 LIVE: New bet placed', payload)
          setSyncStatus(`🔴 LIVE: Bet placed`)
          
          // Refresh markets to get updated stats
          loadMarketsFromSupabase()
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      marketChannel.unsubscribe()
      betChannel.unsubscribe()
    }
  }

  const filteredMarkets = markets.filter(market => {
    // Category filter
    if (selectedCategory !== 'all' && market.category !== selectedCategory) {
      return false
    }
    
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

      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-prism-purple/20 via-transparent to-prism-teal/20" />
        <motion.div
          animate={{ opacity: [0.2, 0.3, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-prism-teal/30 rounded-full blur-3xl"
        />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block mb-6"
            >
              <span className="px-6 py-2 bg-prism-teal/20 border border-prism-teal/30 rounded-full text-prism-teal font-semibold text-sm">
                FIFA WORLD CUP 2026 {syncStatus && `• ${syncStatus}`}
              </span>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
              PREDICTION
              <span className="block bg-gradient-to-r from-prism-teal via-prism-purple to-prism-teal bg-clip-text text-transparent">
                MARKETS
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Trade on the world's premier prediction markets for FIFA World Cup 2026
            </p>
            <p className="text-gray-500">
              {filteredMarkets.length} active markets • ${(markets.reduce((sum, m) => sum + m.totalVolume, 0) / 1000).toFixed(0)}K+ total volume
            </p>
          </motion.div>

          {/* Search and Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-lighter rounded-2xl p-6 border border-gray-800 mb-12"
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search markets..."
                    className="w-full bg-dark border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-prism-teal transition-colors"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-dark rounded-lg p-1 border border-gray-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-prism-teal/20 text-prism-teal' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-prism-teal/20 text-prism-teal' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-prism-teal to-prism-purple text-white shadow-lg'
                      : 'bg-dark border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Markets Grid/List */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal mx-auto mb-4"></div>
                <p className="text-gray-400">Loading markets...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-400 text-lg mb-4">⚠️ {error}</div>
              <button
                onClick={loadMarkets}
                className="px-6 py-3 bg-prism-teal/20 border border-prism-teal/30 rounded-xl text-prism-teal hover:bg-prism-teal/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚽</div>
              <div className="text-gray-400 text-lg mb-4">No markets found</div>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            >
              <AnimatePresence mode="popLayout">
                {filteredMarkets.map((market, index) => (
                  <motion.div
                    key={market.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/markets/${market.slug || market.id}`}>
                      <div className="group relative bg-dark-lighter rounded-2xl overflow-hidden border border-gray-800 hover:border-prism-teal transition-all cursor-pointer h-full">
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-prism-teal/10 to-prism-purple/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              market.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-gray-700/50 text-gray-400'
                            }`}>
                              {market.status.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {market.liquidity.toFixed(0)} BB
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-prism-teal transition-colors line-clamp-2">
                            {market.title}
                          </h3>

                          {/* Description */}
                          {market.description && (
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {market.description}
                            </p>
                          )}

                          {/* Outcomes Preview */}
                          {market.outcomes && market.outcomes.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {market.outcomes.slice(0, 2).map((outcome, i) => (
                                <div key={i} className="flex items-center justify-between bg-dark/50 rounded-lg px-3 py-2">
                                  <span className="text-sm text-gray-300">{outcome}</span>
                                  {market.prices && market.prices[i] !== undefined && (
                                    <span className="text-sm font-bold text-prism-teal">
                                      {(market.prices[i] * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              ))}
                              {market.outcomes.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{market.outcomes.length - 2} more outcomes
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                ${(market.totalVolume / 1000).toFixed(1)}K
                              </div>
                              {market.betCount !== undefined && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {market.betCount}
                                </div>
                              )}
                            </div>
                            <motion.div
                              whileHover={{ x: 5 }}
                              className="text-prism-teal"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
