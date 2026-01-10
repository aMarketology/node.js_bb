'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import Link from 'next/link'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface Market {
  id: string
  slug: string
  homeTeam: string
  homeTeamCode: string
  homeTeamFlag: string
  awayTeam: string
  awayTeamCode: string
  awayTeamFlag: string
  stage: string
  group?: string
  venue: string
  city: string
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  homeWinOdds: string
  drawOdds: string
  awayWinOdds: string
  volume: string
  liquidity: string
  propBets: any[]
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'group' | 'knockout'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMarkets()
  }, [])

  async function loadMarkets() {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔗 Fetching all markets from L2 blockchain...')
      const response = await fetch(`${L2_API}/markets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`L2 server returned ${response.status}`)
      }

      const data = await response.json()
      
      if (data.markets && data.markets.length > 0) {
        setMarkets(data.markets)
        console.log('✅ Loaded', data.markets.length, 'markets from L2')
      } else {
        throw new Error('No markets available')
      }
    } catch (err: any) {
      console.error('❌ Failed to load markets:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMarkets = markets.filter(market => {
    // Filter by stage
    if (filter === 'group' && market.stage !== 'group') return false
    if (filter === 'knockout' && market.stage === 'group') return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        market.homeTeam.toLowerCase().includes(query) ||
        market.awayTeam.toLowerCase().includes(query) ||
        market.venue.toLowerCase().includes(query) ||
        market.city.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  // Group by stage
  const groupedMarkets = filteredMarkets.reduce((acc, market) => {
    const stage = market.stage
    if (!acc[stage]) acc[stage] = []
    acc[stage].push(market)
    return acc
  }, {} as Record<string, Market[]>)

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
              All <span className="prism-gradient-text">Markets</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Browse all World Cup 2026 prediction markets powered by BlackBook L2 blockchain
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="max-w-4xl mx-auto">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search teams, venues, or cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                  <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <FilterButton
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                >
                  All Matches
                </FilterButton>
                <FilterButton
                  active={filter === 'group'}
                  onClick={() => setFilter('group')}
                >
                  Group Stage
                </FilterButton>
                <FilterButton
                  active={filter === 'knockout'}
                  onClick={() => setFilter('knockout')}
                >
                  Knockout Stage
                </FilterButton>
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
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedMarkets).map(([stage, stageMarkets]) => (
                <div key={stage}>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl font-bold text-white mb-6 capitalize"
                  >
                    {stage.replace('-', ' ')} <span className="text-gray-500">({stageMarkets.length})</span>
                  </motion.h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stageMarkets.map((market, index) => (
                      <MarketCard key={market.id} market={market} index={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <div className="inline-flex items-center gap-8 px-8 py-4 bg-dark-200 border border-dark-border rounded-2xl">
                <div>
                  <div className="text-3xl font-bold prism-gradient-text">{markets.length}</div>
                  <div className="text-sm text-gray-500">Total Markets</div>
                </div>
                <div className="w-px h-12 bg-dark-border" />
                <div>
                  <div className="text-3xl font-bold prism-gradient-text">{filteredMarkets.length}</div>
                  <div className="text-sm text-gray-500">Showing</div>
                </div>
                <div className="w-px h-12 bg-dark-border" />
                <div>
                  <div className="text-3xl font-bold prism-gradient-text">
                    {markets.reduce((sum, m) => sum + (m.propBets?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Prop Bets</div>
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
  const homeOdds = parseFloat(market.homeWinOdds) > 0 ? (1 / parseFloat(market.homeWinOdds)).toFixed(2) : '2.00'
  const drawOdds = parseFloat(market.drawOdds) > 0 ? (1 / parseFloat(market.drawOdds)).toFixed(2) : '3.00'
  const awayOdds = parseFloat(market.awayWinOdds) > 0 ? (1 / parseFloat(market.awayWinOdds)).toFixed(2) : '2.50'
  const totalBets = parseInt(market.volume) > 0 ? Math.floor(parseInt(market.volume) / 10) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Link
        href={`/markets/${market.slug}`}
        className="block prism-card rounded-2xl overflow-hidden hover:border-prism-teal transition-all duration-500 shadow-xl hover:shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-border bg-dark-200/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-prism-teal/20 text-prism-teal border border-prism-teal/50">
              {market.group || market.stage}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(market.kickoff).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Teams */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <div className="text-4xl mb-2">{market.homeTeamFlag}</div>
              <div className="text-white font-bold text-sm">{market.homeTeam}</div>
            </div>
            <div className="px-4">
              <span className="text-white font-black text-lg prism-gradient-text">VS</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-4xl mb-2">{market.awayTeamFlag}</div>
              <div className="text-white font-bold text-sm">{market.awayTeam}</div>
            </div>
          </div>

          {/* Odds */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-dark-200 rounded-lg border border-dark-border hover:border-prism-teal transition-colors">
              <div className="text-xs text-gray-500 mb-1">Home</div>
              <div className="text-sm font-bold text-prism-teal">{homeOdds}x</div>
            </div>
            <div className="text-center p-3 bg-dark-200 rounded-lg border border-dark-border hover:border-prism-purple transition-colors">
              <div className="text-xs text-gray-500 mb-1">Draw</div>
              <div className="text-sm font-bold text-prism-purple">{drawOdds}x</div>
            </div>
            <div className="text-center p-3 bg-dark-200 rounded-lg border border-dark-border hover:border-prism-pink transition-colors">
              <div className="text-xs text-gray-500 mb-1">Away</div>
              <div className="text-sm font-bold text-prism-pink">{awayOdds}x</div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-dark-border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">
                <span className="text-prism-teal font-bold">{market.propBets?.length || 0}</span> markets
              </span>
              <span className="text-gray-500">
                <span className="text-prism-gold font-bold">{totalBets.toLocaleString()}</span> bets
              </span>
            </div>
          </div>

          {/* Venue */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <span>📍</span>
            <span>{market.city}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
