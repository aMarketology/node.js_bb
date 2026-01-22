'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMarkets } from '../contexts/MarketsContext'

interface MarketCardProps {
  market: {
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
    image_url?: string
    resolved_outcome?: number
  }
  compact?: boolean
  showPrices?: boolean
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  frozen: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const categoryIcons: Record<string, string> = {
  sports: '⚽',
  politics: '🏛️',
  crypto: '₿',
  entertainment: '🎬',
  science: '🔬',
  business: '📈',
  other: '🎯',
}

export function MarketCard({ market, compact = false, showPrices = true, onClick }: MarketCardProps) {
  const { getPrices, isReady } = useMarkets()
  const [prices, setPrices] = useState<number[]>(market.prices || [])
  const [loading, setLoading] = useState(false)

  // Fetch live prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (!isReady || !showPrices || market.status !== 'active') return
      
      try {
        setLoading(true)
        const livePrices = await getPrices(market.id)
        setPrices(livePrices)
      } catch (err) {
        // Use fallback prices from market data
        console.log('Using cached prices for', market.id)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
  }, [isReady, market.id, market.status, showPrices, getPrices])

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(0)}¢`
  }

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`
    return `$${vol.toFixed(0)}`
  }

  const getTimeRemaining = (closesAt: string) => {
    const now = new Date()
    const closes = new Date(closesAt)
    const diff = closes.getTime() - now.getTime()

    if (diff < 0) return 'Closed'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m`
  }

  const cardContent = (
    <div 
      className={`bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all duration-200 ${
        compact ? 'p-4' : 'p-6'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          {market.category && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mb-2">
              <span>{categoryIcons[market.category.toLowerCase()] || '🎯'}</span>
              <span className="capitalize">{market.category}</span>
            </span>
          )}
          
          {/* Title */}
          <h3 className={`font-semibold text-white line-clamp-2 ${compact ? 'text-base' : 'text-lg'}`}>
            {market.title}
          </h3>
          
          {/* Description */}
          {!compact && market.description && (
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              {market.description}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[market.status] || statusColors.other}`}>
          {market.status === 'resolved' && market.resolved_outcome !== undefined
            ? `✓ ${market.outcomes[market.resolved_outcome]}`
            : market.status.charAt(0).toUpperCase() + market.status.slice(1)}
        </span>
      </div>

      {/* Outcomes with Prices */}
      {showPrices && market.status !== 'resolved' && (
        <div className="space-y-2 mb-4">
          {market.outcomes.slice(0, compact ? 2 : 4).map((outcome, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-slate-300 truncate flex-1">{outcome}</span>
              <div className="flex items-center gap-2">
                {/* Price Bar */}
                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${idx === 0 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300`}
                    style={{ width: `${(prices[idx] || 0.5) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-medium min-w-[3rem] text-right ${
                  idx === 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {loading ? '...' : formatPrice(prices[idx] || 0.5)}
                </span>
              </div>
            </div>
          ))}
          {!compact && market.outcomes.length > 4 && (
            <p className="text-xs text-slate-500">+{market.outcomes.length - 4} more outcomes</p>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          {market.volume !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {formatVolume(market.volume)}
            </span>
          )}
          {market.liquidity !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {formatVolume(market.liquidity)}
            </span>
          )}
        </div>
        
        {market.closes_at && market.status === 'active' && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {getTimeRemaining(market.closes_at)}
          </span>
        )}
      </div>
    </div>
  )

  // Wrap with Link if no onClick handler
  if (!onClick) {
    return (
      <Link href={`/markets/${market.id}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default MarketCard
