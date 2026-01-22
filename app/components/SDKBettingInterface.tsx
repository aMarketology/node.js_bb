// Market Betting Component - SDK Version
// Polymarket/Kalshi-style betting interface using BlackBook SDKs

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { useUnifiedSDK } from '@/app/contexts/UnifiedSDKContext'

// Format $BB balance
const formatBB = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M $BB`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K $BB`
  return `${amount.toFixed(2)} $BB`
}

interface Market {
  id: string
  title?: string
  question?: string
  outcomes: string[]
  outcome_prices: string[] | number[]
  liquidity: number
  volume: number
  status: string
  winning_outcome?: string
}

interface SDKBettingInterfaceProps {
  market: Market
  onBetPlaced?: () => void
}

export default function SDKBettingInterface({ market, onBetPlaced }: SDKBettingInterfaceProps) {
  const { isAuthenticated, activeWalletData } = useAuth()
  const { 
    isConnected, 
    isL2Available, 
    l2Balance,
    getQuote, 
    placeBet, 
    getPosition,
    refreshBalance 
  } = useUnifiedSDK()
  
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [quote, setQuote] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Load user position
  useEffect(() => {
    if (isConnected && market.id) {
      loadPosition()
    }
  }, [isConnected, market.id])

  // Refresh balance on mount
  useEffect(() => {
    if (isConnected) {
      refreshBalance().catch(console.error)
    }
  }, [isConnected])

  const loadPosition = async () => {
    try {
      const pos = await getPosition(market.id)
      setPosition(pos)
    } catch (err) {
      // No position yet - that's ok
      console.log('No position found')
    }
  }

  // Get quote when amount or outcome changes
  useEffect(() => {
    if (selectedOutcome !== null && amount && parseFloat(amount) > 0) {
      fetchQuote()
    } else {
      setQuote(null)
    }
  }, [selectedOutcome, amount])

  const fetchQuote = async () => {
    if (selectedOutcome === null || !amount) return

    try {
      setQuoteLoading(true)
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) return

      const q = await getQuote(market.id, selectedOutcome, amountNum)
      setQuote(q)
    } catch (err: any) {
      console.error('Quote error:', err)
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleBet = async () => {
    if (selectedOutcome === null || !amount) {
      setError('Please select outcome and enter amount')
      return
    }

    if (!isConnected) {
      setError('Please connect wallet first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount')
      }

      // Check balance
      if (amountNum > l2Balance.available) {
        throw new Error(`Insufficient balance: ${formatBB(l2Balance.available)} available`)
      }

      const result = await placeBet(market.id, selectedOutcome, amountNum)
      
      if (result.success) {
        const outcomeName = market.outcomes[selectedOutcome]
        setSuccess(`✅ Bought ${result.shares.toFixed(2)} "${outcomeName}" shares @ ${result.avgPrice.toFixed(3)}!`)
        setAmount('')
        setQuote(null)
        
        // Reload position and balance
        await loadPosition()
        await refreshBalance()
        
        if (onBetPlaced) {
          onBetPlaced()
        }
      } else {
        throw new Error(result.error || 'Bet failed')
      }
    } catch (err: any) {
      setError(err.message || 'Bet failed')
    } finally {
      setLoading(false)
    }
  }

  const getOutcomePrice = (index: number): number => {
    const price = market.outcome_prices[index]
    return typeof price === 'string' ? parseFloat(price) : price
  }

  const getOutcomePercentage = (index: number): string => {
    return (getOutcomePrice(index) * 100).toFixed(1)
  }

  if (!isL2Available) {
    return (
      <div className="p-6 bg-dark-200 border border-dark-border rounded-xl">
        <div className="text-center text-yellow-500">
          ⚠️ L2 Markets API not available
          <p className="text-sm text-gray-400 mt-2">Start the L2 server to enable live betting</p>
        </div>
      </div>
    )
  }

  if (market.status === 'resolved') {
    return (
      <div className="p-6 bg-dark-200 border border-prism-teal rounded-xl">
        <div className="text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-white font-bold">Market Resolved</div>
          <div className="text-prism-teal text-lg mt-1">
            Winner: {market.winning_outcome !== undefined ? market.outcomes[market.winning_outcome] : 'Unknown'}
          </div>
        </div>
      </div>
    )
  }

  if (market.status === 'closed' || market.status === 'frozen') {
    return (
      <div className="p-6 bg-dark-200 border border-yellow-500 rounded-xl">
        <div className="text-center text-yellow-500">
          ⏸️ Market Closed - Awaiting Resolution
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      {isConnected && (
        <div className="p-3 bg-dark-200 border border-dark-border rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Available Balance:</span>
            <span className="text-prism-gold font-bold">{formatBB(l2Balance.available)}</span>
          </div>
        </div>
      )}

      {/* Current Position */}
      {position && position.shares && position.shares.some((s: number) => s > 0) && (
        <div className="p-4 bg-dark-200 border border-prism-purple rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-300">Your Position</span>
            <span className={`text-sm font-bold ${(position.unrealizedPnl || 0) >= 0 ? 'text-green-400' : 'text-prism-red'}`}>
              {(position.unrealizedPnl || 0) >= 0 ? '+' : ''}{formatBB(position.unrealizedPnl || 0)}
            </span>
          </div>
          <div className="space-y-1">
            {position.shares.map((shares: number, index: number) => (
              shares > 0 && (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-400">{market.outcomes[index]}:</span>
                  <span className="text-white">{shares.toFixed(2)} shares</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Outcome Selection */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-2">Select Outcome</div>
        {market.outcomes.map((outcome, index) => {
          const price = getOutcomePrice(index)
          const percentage = getOutcomePercentage(index)
          const isSelected = selectedOutcome === index

          return (
            <motion.button
              key={outcome}
              onClick={() => setSelectedOutcome(index)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-prism-teal bg-prism-teal/10'
                  : 'border-dark-border bg-dark-200 hover:border-prism-teal/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-white">{outcome}</div>
                  <div className="text-xs text-gray-400">{percentage}% chance</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-prism-teal">{price.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">per share</div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Amount Input */}
      {selectedOutcome !== null && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-300">Bet Amount ($BB)</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white text-lg font-mono focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
          />

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[10, 25, 50, 100].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="flex-1 py-2 text-sm bg-dark-300 hover:bg-dark-400 border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                {quickAmount}
              </button>
            ))}
            <button
              onClick={() => setAmount(Math.floor(l2Balance.available).toString())}
              className="flex-1 py-2 text-sm bg-prism-purple/20 hover:bg-prism-purple/30 border border-prism-purple rounded-lg text-prism-purple hover:text-white transition-colors"
            >
              MAX
            </button>
          </div>

          {/* Quote Display */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-dark-200 border border-prism-purple rounded-xl space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shares:</span>
                <span className="text-white font-bold">{quote.shares?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Price:</span>
                <span className="text-prism-teal font-bold">{quote.avgPrice?.toFixed(3) || '0.000'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee:</span>
                <span className="text-gray-400">{formatBB(quote.fee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Impact:</span>
                <span className={(quote.priceImpact || 0) > 5 ? 'text-yellow-500' : 'text-gray-400'}>
                  {(quote.priceImpact || 0).toFixed(2)}%
                </span>
              </div>
              <div className="border-t border-dark-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 font-semibold">Max Payout:</span>
                  <span className="text-green-400 font-bold">
                    {formatBB(quote.maxPayout || quote.shares || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Potential Profit:</span>
                  <span className="text-green-400">
                    +{formatBB(quote.potentialProfit || ((quote.shares || 0) - parseFloat(amount || '0')))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {quoteLoading && (
            <div className="p-4 bg-dark-200 border border-dark-border rounded-xl text-center text-gray-400">
              Loading quote...
            </div>
          )}

          {/* Errors & Success */}
          {error && (
            <div className="p-3 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Place Bet Button */}
          <button
            onClick={handleBet}
            disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0}
            className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Placing Bet...
              </span>
            ) : !isAuthenticated ? (
              'Connect Wallet'
            ) : !isConnected ? (
              'Initializing...'
            ) : (
              `Buy ${market.outcomes[selectedOutcome]}`
            )}
          </button>
        </div>
      )}

      {/* Market Stats */}
      <div className="p-4 bg-dark-200 border border-dark-border rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Liquidity</div>
            <div className="text-lg font-bold text-prism-gold">{formatBB(market.liquidity || 0)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Volume</div>
            <div className="text-lg font-bold text-prism-purple">{formatBB(market.volume || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
