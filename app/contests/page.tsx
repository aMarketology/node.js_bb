'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useMarkets } from '@/app/contexts/MarketsContext'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFanCredit } from '@/app/contexts/FanCreditContext'

type FilterMode = 'all' | 'active' | 'pending' | 'resolved'

export default function ContestsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { activeMarkets, pendingMarkets, resolvedMarkets, loading, refreshMarkets } = useMarkets()
  const { balance, loading: fcLoading } = useFanCredit()
  
  const [filter, setFilter] = useState<FilterMode>('active')
  const [search, setSearch] = useState('')

  useEffect(() => {
    refreshMarkets()
  }, [])

  // Combine and filter markets based on current filter
  const getFilteredMarkets = () => {
    let markets = []
    
    switch (filter) {
      case 'active':
        markets = activeMarkets
        break
      case 'pending':
        markets = pendingMarkets
        break
      case 'resolved':
        markets = resolvedMarkets
        break
      case 'all':
      default:
        markets = [...activeMarkets, ...pendingMarkets, ...resolvedMarkets]
        break
    }

    // Apply search filter
    if (search.trim()) {
      markets = markets.filter(market => 
        market.title?.toLowerCase().includes(search.toLowerCase()) ||
        market.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return markets
  }

  const filteredMarkets = getFilteredMarkets()

  const formatTimeRemaining = (closesAt?: string) => {
    if (!closesAt) return 'TBD'
    
    const now = new Date()
    const closeTime = new Date(closesAt)
    const diff = closeTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Closed'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    
    return `${minutes}m`
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', label: '🟢 Live' },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⏳ Upcoming' },
      frozen: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '🔒 Locked' },
      resolved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '✅ Settled' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: '❌ Cancelled' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Prediction Markets
          </h1>
          <p className="text-gray-300 text-lg">
            Bet on outcomes using FanCredit - Entertainment currency with NO cash value
          </p>
          
          {/* Balance Display */}
          {isAuthenticated && !fcLoading && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg">
              <span className="text-gray-300">Your Balance:</span>
              <span className="text-2xl font-bold text-purple-400">
                {balance.available.toLocaleString()} FC
              </span>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap gap-4"
        >
          {/* Search */}
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />

          {/* Status Filters */}
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'resolved'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Active Markets</div>
            <div className="text-3xl font-bold text-green-400">{activeMarkets.length}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Upcoming</div>
            <div className="text-3xl font-bold text-yellow-400">{pendingMarkets.length}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Settled</div>
            <div className="text-3xl font-bold text-blue-400">{resolvedMarkets.length}</div>
          </div>
        </motion.div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-400 mt-4">Loading markets...</p>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-2xl text-gray-400 mb-2">No markets found</div>
            <p className="text-gray-500">
              {search ? 'Try adjusting your search' : 'Check back soon for new markets!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market, index) => (
              <MarketCard
                key={market.id}
                market={market}
                index={index}
                formatTimeRemaining={formatTimeRemaining}
                getStatusBadge={getStatusBadge}
                isAuthenticated={isAuthenticated}
                userBalance={balance.available}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

// Market Card Component
interface MarketCardProps {
  market: any
  index: number
  formatTimeRemaining: (closesAt?: string) => string
  getStatusBadge: (status: string) => JSX.Element
  isAuthenticated: boolean
  userBalance: number
}

function MarketCard({ 
  market, 
  index, 
  formatTimeRemaining, 
  getStatusBadge,
  isAuthenticated,
  userBalance
}: MarketCardProps) {
  const router = useRouter()
  const canAfford = userBalance >= (market.entry_fee || 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer group"
      onClick={() => router.push(`/contest/${market.id}`)}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        {getStatusBadge(market.status)}
        {market.closes_at && market.status === 'active' && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Closes in</div>
            <div className="text-sm font-semibold text-purple-400">
              {formatTimeRemaining(market.closes_at)}
            </div>
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
        {market.title || 'Untitled Market'}
      </h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {market.description || 'No description available'}
      </p>

      {/* Game Type */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
          {market.game_type ? market.game_type.toUpperCase() : 'PREDICTION'}
        </span>
      </div>

      {/* Entry Fee */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div>
          <div className="text-xs text-gray-400">Entry Fee</div>
          <div className="text-lg font-bold text-white">
            {market.entry_fee ? `${market.entry_fee.toLocaleString()} FC` : 'Free'}
          </div>
        </div>

        {/* Action Button */}
        {market.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isAuthenticated) {
                router.push('/login')
              } else if (!canAfford) {
                alert('Insufficient FanCredit balance')
              } else {
                router.push(`/contest/${market.id}`)
              }
            }}
            disabled={!canAfford && isAuthenticated}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isAuthenticated && canAfford
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!isAuthenticated ? 'Login' : !canAfford ? 'Low Balance' : 'Enter'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
