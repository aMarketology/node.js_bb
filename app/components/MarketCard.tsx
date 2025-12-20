'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface MarketCardProps {
  market: {
    id: string
    slug: string
    question: string
    description?: string
    outcomes: string[]
    outcomePrices: string[]
    volume: string
    liquidity: string
    endDate?: string
    image?: string
    active: boolean
    category?: string
    tags?: string[]
    volume24hr?: string
    createdAt?: string
  }
  index: number
}

export default function MarketCard({ market, index }: MarketCardProps) {
  const yesPrice = market.outcomePrices?.[0] ? parseFloat(market.outcomePrices[0]) : 0
  const noPrice = market.outcomePrices?.[1] ? parseFloat(market.outcomePrices[1]) : 0

  // Format volume and liquidity
  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Closed'
    if (diffDays === 0) return 'Ends today'
    if (diffDays === 1) return 'Ends tomorrow'
    if (diffDays < 7) return `${diffDays} days left`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const daysLeft = formatDate(market.endDate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative h-full"
    >
      <Link href={`https://polymarket.com/event/${market.slug}`} target="_blank">
        <div className="relative bg-grey-900 border border-grey-700 rounded-xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col">
          
          {/* Header with badges */}
          <div className="p-4 pb-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              {/* Category Badge */}
              {market.category && (
                <span className="px-2.5 py-1 bg-grey-800 text-grey-300 rounded-md text-xs font-medium border border-grey-700">
                  {market.category}
                </span>
              )}
              
              {/* Status Badge */}
              <div className="flex gap-2">
                {market.active && (
                  <div className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-md">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      LIVE
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Question */}
            <h3 className="text-base font-bold text-grey-50 line-clamp-2 min-h-[48px] mb-3 group-hover:text-primary transition-colors leading-tight">
              {market.question}
            </h3>

            {/* Description */}
            {market.description && (
              <p className="text-sm text-grey-400 line-clamp-2 mb-4 leading-relaxed">
                {market.description}
              </p>
            )}
          </div>

          {/* Probability Display */}
          <div className="px-4 space-y-3 flex-grow">
            {/* Yes Outcome */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-grey-300 uppercase tracking-wider">Yes</span>
                <span className="text-xl font-bold text-primary">
                  {(yesPrice * 100).toFixed(1)}¢
                </span>
              </div>
              <div className="relative w-full bg-grey-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                />
                <div 
                  className="relative bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500 shadow-lg shadow-primary/30"
                  style={{ width: `${yesPrice * 100}%` }}
                />
              </div>
            </div>

            {/* No Outcome */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-grey-300 uppercase tracking-wider">No</span>
                <span className="text-xl font-bold text-grey-400">
                  {(noPrice * 100).toFixed(1)}¢
                </span>
              </div>
              <div className="relative w-full bg-grey-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-grey-600/20 to-transparent"
                />
                <div 
                  className="relative bg-gradient-to-r from-grey-500 to-grey-600 h-full rounded-full transition-all duration-500 shadow-lg shadow-grey-500/30"
                  style={{ width: `${noPrice * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="p-4 pt-4 mt-auto">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-grey-800/50 rounded-lg p-2.5 border border-grey-800">
                <p className="text-xs text-grey-400 mb-0.5">Volume</p>
                <p className="text-base font-bold text-grey-100">{formatCurrency(market.volume)}</p>
              </div>
              <div className="bg-grey-800/50 rounded-lg p-2.5 border border-grey-800">
                <p className="text-xs text-grey-400 mb-0.5">Liquidity</p>
                <p className="text-base font-bold text-grey-100">{formatCurrency(market.liquidity)}</p>
              </div>
            </div>

            {/* End Date */}
            {daysLeft && (
              <div className="flex items-center justify-between pt-3 border-t border-grey-800">
                <div className="flex items-center gap-1.5 text-grey-400">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">{daysLeft}</span>
                </div>
                
                {/* Tags */}
                {market.tags && market.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-grey-800 text-grey-400 rounded text-xs">
                      {market.tags[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </Link>
    </motion.div>
  )
}
