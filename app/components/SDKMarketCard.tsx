'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUnifiedSDK } from '@/app/contexts/UnifiedSDKContext'

interface Market {
  id: string
  slug?: string
  title: string
  description?: string
  outcomes: string[]
  prices?: number[]
  current_prices?: number[]
  liquidity?: number
  volume?: number
  status: string
  closes_at?: number
  winning_outcome?: number
  propsCount?: number
}

interface SDKMarketCardProps {
  market: Market
  showBetting?: boolean
  compact?: boolean
  onBetPlaced?: () => void
}

export default function SDKMarketCard({ 
  market, 
  showBetting = true, 
  compact = false,
  onBetPlaced 
}: SDKMarketCardProps) {
  const { isConnected, l2Balance, getQuote, placeBet } = useUnifiedSDK()
  
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expanded, setExpanded] = useState(false)

  // Get prices from market data
  const prices = market.prices || market.current_prices || [0.5, 0.5]

  // Format values
  const formatBB = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(2)
  }

  const formatPercent = (price: number) => {
    return (price * 100).toFixed(1)
  }

  // Get time until close
  const getTimeUntilClose = () => {
    if (!market.closes_at) return null
    const closeTime = new Date(market.closes_at * 1000)
    const now = new Date()
    const diff = closeTime.getTime() - now.getTime()
    
    if (diff < 0) return 'Closed'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return 'Soon'
  }

  // Get status badge
  const getStatusBadge = () => {
    switch (market.status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full">LIVE</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">PENDING</span>
      case 'frozen':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">FROZEN</span>
      case 'resolved':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-prism-purple/20 text-prism-purple rounded-full">RESOLVED</span>
      default:
        return null
    }
  }

  // Fetch quote when outcome/amount changes
  useEffect(() => {
    if (selectedOutcome !== null && amount && parseFloat(amount) > 0 && isConnected) {
      fetchQuote()
    } else {
      setQuote(null)
    }
  }, [selectedOutcome, amount, isConnected])

  const fetchQuote = async () => {
    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) return
      
      const q = await getQuote(market.id, selectedOutcome!, amountNum)
      setQuote(q)
    } catch (err) {
      console.error('Quote error:', err)
    }
  }

  const handleBet = async () => {
    if (selectedOutcome === null || !amount) {
      setError('Select outcome and enter amount')
      return
    }

    if (!isConnected) {
      setError('Connect wallet first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const amountNum = parseFloat(amount)
      if (amountNum > l2Balance.available) {
        throw new Error(`Insufficient balance: ${formatBB(l2Balance.available)} available`)
      }

      const result = await placeBet(market.id, selectedOutcome, amountNum)
      
      if (result.success) {
        setSuccess(`✅ Got ${result.shares.toFixed(2)} shares @ ${result.avgPrice.toFixed(3)}`)
        setAmount('')
        setQuote(null)
        setSelectedOutcome(null)
        setExpanded(false)
        onBetPlaced?.()
      }
    } catch (err: any) {
      setError(err.message || 'Bet failed')
    } finally {
      setLoading(false)
    }
  }

  const canBet = market.status === 'active' && showBetting

  if (compact) {
    return (
      <Link href={`/markets/${market.slug || market.id}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-dark-200 border border-dark-border rounded-xl hover:border-prism-teal/50 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-white text-sm line-clamp-2">{market.title}</h3>
            {getStatusBadge()}
          </div>
          
          <div className="flex gap-2 mb-2">
            {market.outcomes.slice(0, 2).map((outcome, idx) => (
              <div key={idx} className="flex-1 p-2 bg-dark-300 rounded-lg text-center">
                <div className="text-xs text-gray-400">{outcome}</div>
                <div className="text-sm font-bold text-prism-teal">{formatPercent(prices[idx] || 0.5)}%</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>💧 {formatBB(market.liquidity || 0)}</span>
            <span>{getTimeUntilClose()}</span>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-200 border border-dark-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/markets/${market.slug || market.id}`} className="flex-1">
            <h3 className="font-bold text-white hover:text-prism-teal transition-colors">{market.title}</h3>
          </Link>
          {getStatusBadge()}
        </div>
        
        {market.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{market.description}</p>
        )}
      </div>

      {/* Outcomes */}
      <div className="p-4 space-y-2">
        {market.outcomes.map((outcome, idx) => {
          const price = prices[idx] || 0.5
          const isSelected = selectedOutcome === idx

          return (
            <div
              key={idx}
              onClick={() => canBet && setSelectedOutcome(idx)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                canBet ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'bg-prism-teal/20 border-2 border-prism-teal'
                  : 'bg-dark-300 border-2 border-transparent hover:border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {market.status === 'resolved' && market.winning_outcome === idx && (
                  <span className="text-lg">🏆</span>
                )}
                <span className="font-semibold text-white">{outcome}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Price bar */}
                <div className="w-24 h-2 bg-dark-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-prism-teal rounded-full transition-all"
                    style={{ width: `${price * 100}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-prism-teal w-16 text-right">
                  {formatPercent(price)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Betting Section */}
      {canBet && expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 border-t border-dark-border space-y-3"
        >
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="Amount ($BB)"
              min="1"
              className="flex-1 px-3 py-2 bg-dark-300 border border-dark-border rounded-lg text-white focus:border-prism-teal focus:outline-none"
            />
            <button
              onClick={() => setAmount(Math.floor(l2Balance.available).toString())}
              className="px-3 py-2 bg-dark-300 border border-dark-border rounded-lg text-gray-400 hover:text-white hover:bg-dark-400 transition-colors"
            >
              MAX
            </button>
          </div>

          {quote && (
            <div className="p-3 bg-dark-300 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Shares:</span>
                <span className="text-white font-semibold">{quote.shares?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Price:</span>
                <span className="text-prism-teal">{quote.avgPrice?.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Payout:</span>
                <span className="text-green-400">{formatBB(quote.maxPayout || quote.shares || 0)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 bg-prism-red/20 border border-prism-red rounded-lg text-prism-red text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleBet}
            disabled={loading || selectedOutcome === null || !amount}
            className="w-full py-3 bg-prism-teal hover:bg-prism-teal/90 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Placing Bet...' : `Buy ${selectedOutcome !== null ? market.outcomes[selectedOutcome] : ''}`}
          </button>
        </motion.div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-dark-border flex justify-between items-center">
        <div className="flex gap-4 text-xs text-gray-400">
          <span>💧 {formatBB(market.liquidity || 0)}</span>
          <span>📊 {formatBB(market.volume || 0)}</span>
          {market.propsCount ? <span>🎯 {market.propsCount} props</span> : null}
        </div>

        <div className="flex items-center gap-2">
          {market.closes_at && (
            <span className="text-xs text-gray-400">⏰ {getTimeUntilClose()}</span>
          )}
          
          {canBet && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-1.5 bg-prism-teal hover:bg-prism-teal/90 rounded-lg font-semibold text-white text-sm transition-colors"
            >
              {expanded ? 'Close' : 'Bet'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
