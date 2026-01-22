/**
 * Settlement-Integrated Betting Interface
 * Uses L1 soft-locks for secure betting with proper settlement
 * 
 * Flow:
 * 1. User selects outcome and amount
 * 2. SDK soft-locks funds on L1
 * 3. Bet placed on L2 (shares purchased)
 * 4. When market resolves: settlement transfers funds on L1
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { useSettlement } from '@/app/contexts/SettlementContext'
import { useCreditPrediction } from '@/app/contexts/CreditPredictionContext'

interface Market {
  id: string
  title: string
  description?: string
  outcomes: string[]
  prices: number[]
  status: 'active' | 'pending' | 'frozen' | 'resolved'
  winning_outcome?: number
  liquidity?: number
  volume?: number
  closes_at?: string
}

interface SettlementBettingProps {
  market: Market
  onBetPlaced?: (result: any) => void
}

export default function SettlementBettingInterface({ market, onBetPlaced }: SettlementBettingProps) {
  const { isAuthenticated, activeWallet } = useAuth()
  const { 
    isConnected: settlementConnected,
    virtualBalance,
    refreshVirtualBalance,
    placeBetWithLock,
    sellPositionWithSettlement,
    activeLocks,
    healthStatus
  } = useSettlement()
  
  const {
    isConnected: creditConnected,
    getQuote,
    getPosition
  } = useCreditPrediction()
  
  // State
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Trade mode: 'buy' or 'sell'
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')
  
  // Derived state
  const isConnected = settlementConnected && creditConnected
  const canBet = isConnected && market.status === 'active'

  // Load position when market changes
  useEffect(() => {
    if (isAuthenticated && market?.id) {
      loadPosition()
    }
  }, [isAuthenticated, market?.id])

  // Get quote when selection changes
  useEffect(() => {
    if (selectedOutcome !== null && amount && parseFloat(amount) > 0) {
      fetchQuote()
    } else {
      setQuote(null)
    }
  }, [selectedOutcome, amount, tradeMode])

  async function loadPosition() {
    try {
      const pos = getPosition(market.id)
      setPosition(pos)
    } catch (e) {
      // No position
    }
  }

  async function fetchQuote() {
    if (selectedOutcome === null || !amount) return
    
    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) return
      
      const q = await getQuote(market.id, selectedOutcome, amountNum)
      setQuote(q)
    } catch (e) {
      console.error('Quote error:', e)
    }
  }

  async function handleBet() {
    if (selectedOutcome === null || !amount) {
      setError('Select an outcome and enter amount')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount')
      return
    }

    // Check virtual balance
    if (amountNum > virtualBalance.virtualAvailable) {
      setError(`Insufficient balance. Available: ${virtualBalance.virtualAvailable.toFixed(2)} $BC`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (tradeMode === 'buy') {
        // Place bet with L1 soft-lock
        const result = await placeBetWithLock(market.id, selectedOutcome, amountNum)
        
        if (result.success) {
          setSuccess(`✅ Bought ${result.shares.toFixed(2)} "${market.outcomes[selectedOutcome]}" shares @ ${result.avgPrice.toFixed(3)}!`)
          setAmount('')
          setQuote(null)
          await loadPosition()
          await refreshVirtualBalance()
          onBetPlaced?.(result)
        } else {
          throw new Error(result.error || 'Bet failed')
        }
      } else {
        // Sell position
        const pos = position?.shares?.[selectedOutcome] || 0
        if (pos < amountNum) {
          throw new Error(`Only have ${pos.toFixed(2)} shares to sell`)
        }
        
        // Find the lock ID for this position (if we have it)
        const relatedLock = activeLocks.find(l => 
          l.referenceId.includes(market.id) && 
          l.reason === 'bet'
        )
        
        const result = await sellPositionWithSettlement(
          market.id, 
          selectedOutcome, 
          amountNum,
          relatedLock?.lockId
        )
        
        if (result.success) {
          setSuccess(`✅ Sold ${amountNum.toFixed(2)} shares for ${result.received?.toFixed(2)} $BB!`)
          setAmount('')
          setQuote(null)
          await loadPosition()
          await refreshVirtualBalance()
          onBetPlaced?.(result)
        } else {
          throw new Error(result.error || 'Sell failed')
        }
      }
    } catch (e: any) {
      setError(e.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100]

  if (market.status === 'resolved') {
    return (
      <div className="p-6 bg-dark-200 border border-prism-teal rounded-xl">
        <div className="text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-white font-bold">Market Resolved</div>
          <div className="text-prism-teal text-lg mt-1">
            Winner: {market.outcomes[market.winning_outcome || 0]}
          </div>
        </div>
      </div>
    )
  }

  if (market.status !== 'active') {
    return (
      <div className="p-6 bg-dark-200 border border-yellow-500 rounded-xl">
        <div className="text-center text-yellow-500">
          ⏸️ Market {market.status === 'frozen' ? 'Frozen' : 'Not Active'}
        </div>
      </div>
    )
  }

  if (!healthStatus.l1Healthy || !healthStatus.l2Healthy) {
    return (
      <div className="p-6 bg-dark-200 border border-dark-border rounded-xl">
        <div className="text-center text-yellow-500">
          ⚠️ Blockchain Connection Issue
          <div className="text-xs text-gray-400 mt-2">
            L1: {healthStatus.l1Healthy ? '✅' : '❌'} | L2: {healthStatus.l2Healthy ? '✅' : '❌'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Virtual Balance Display */}
      <div className="p-4 bg-gradient-to-r from-prism-purple/20 to-prism-teal/20 border border-prism-purple rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400">Virtual Balance (L1)</div>
            <div className="text-xl font-bold text-white">
              {virtualBalance.virtualAvailable.toFixed(2)} <span className="text-prism-gold">$BC</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">
              Locked: {virtualBalance.l1Locked.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              In Positions: {virtualBalance.l2InPositions.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Current Position */}
      {position && position.totalShares > 0 && (
        <div className="p-4 bg-dark-200 border border-prism-purple rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-300">Your Position</span>
            <span className={`text-sm font-bold ${(position.unrealizedPnl || 0) >= 0 ? 'text-green-400' : 'text-prism-red'}`}>
              {(position.unrealizedPnl || 0) >= 0 ? '+' : ''}{(position.unrealizedPnl || 0).toFixed(2)} $BB
            </span>
          </div>
          <div className="space-y-1">
            {market.outcomes.map((outcome, idx) => {
              const shares = position.shares?.[idx] || 0
              if (shares <= 0) return null
              return (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-400">{outcome}:</span>
                  <span className="text-white">{shares.toFixed(2)} shares</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Buy/Sell Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-dark-border">
        <button
          onClick={() => setTradeMode('buy')}
          className={`flex-1 py-3 font-bold transition-colors ${
            tradeMode === 'buy' 
              ? 'bg-green-500/20 text-green-400 border-r border-dark-border' 
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeMode('sell')}
          className={`flex-1 py-3 font-bold transition-colors ${
            tradeMode === 'sell' 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Outcome Selection */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-2">
          {tradeMode === 'buy' ? 'Select Outcome to Buy' : 'Select Position to Sell'}
        </div>
        {market.outcomes.map((outcome, index) => {
          const price = market.prices?.[index] || 0.5
          const percentage = (price * 100).toFixed(1)
          const isSelected = selectedOutcome === index
          const positionShares = position?.shares?.[index] || 0

          // In sell mode, only show outcomes with position
          if (tradeMode === 'sell' && positionShares <= 0) return null

          return (
            <motion.button
              key={index}
              onClick={() => setSelectedOutcome(index)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? tradeMode === 'buy' 
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-red-400 bg-red-400/10'
                  : 'border-dark-border bg-dark-200 hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-white">{outcome}</div>
                  <div className="text-xs text-gray-400">{percentage}% implied</div>
                  {tradeMode === 'sell' && (
                    <div className="text-xs text-prism-purple mt-1">
                      {positionShares.toFixed(2)} shares owned
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    tradeMode === 'buy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {price.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tradeMode === 'buy' ? 'buy price' : 'sell price'}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Amount Input */}
      {selectedOutcome !== null && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="text-sm font-semibold text-gray-300">
              {tradeMode === 'buy' ? 'Amount ($BC)' : 'Shares to Sell'}
            </div>
            
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
              {quickAmounts.map(qa => (
                <button
                  key={qa}
                  onClick={() => setAmount(String(qa))}
                  className="flex-1 py-2 text-sm bg-dark-300 hover:bg-dark-200 border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  {qa}
                </button>
              ))}
              {tradeMode === 'buy' && (
                <button
                  onClick={() => setAmount(String(Math.floor(virtualBalance.virtualAvailable)))}
                  className="flex-1 py-2 text-sm bg-prism-purple/20 hover:bg-prism-purple/30 border border-prism-purple rounded-lg text-prism-purple hover:text-white transition-colors"
                >
                  MAX
                </button>
              )}
              {tradeMode === 'sell' && selectedOutcome !== null && (
                <button
                  onClick={() => setAmount(String(position?.shares?.[selectedOutcome] || 0))}
                  className="flex-1 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg text-red-400 hover:text-white transition-colors"
                >
                  ALL
                </button>
              )}
            </div>

            {/* Quote Display */}
            {quote && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-dark-200 border border-prism-purple rounded-xl space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {tradeMode === 'buy' ? 'Shares:' : 'Receive:'}
                  </span>
                  <span className="text-white font-bold">
                    {tradeMode === 'buy' ? quote.shares?.toFixed(2) : quote.received?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Price:</span>
                  <span className="text-prism-teal font-bold">{quote.avgPrice?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-gray-400">{(quote.fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className={quote.priceImpact > 5 ? 'text-yellow-500' : 'text-gray-400'}>
                    {(quote.priceImpact || 0).toFixed(2)}%
                  </span>
                </div>
                {tradeMode === 'buy' && (
                  <div className="border-t border-dark-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-semibold">Max Payout:</span>
                      <span className="text-green-400 font-bold">
                        {(quote.shares || 0).toFixed(2)} $BB
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Lock Info */}
            {tradeMode === 'buy' && amount && parseFloat(amount) > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
                🔒 {parseFloat(amount).toFixed(2)} $BC will be soft-locked on L1 while position is open
              </div>
            )}

            {/* Error/Success Messages */}
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

            {/* Action Button */}
            <button
              onClick={handleBet}
              disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0}
              className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                tradeMode === 'buy'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : !isConnected ? (
                'Connect Wallet'
              ) : tradeMode === 'buy' ? (
                `Buy ${market.outcomes[selectedOutcome]}`
              ) : (
                `Sell ${market.outcomes[selectedOutcome]}`
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Market Stats */}
      <div className="p-4 bg-dark-200 border border-dark-border rounded-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Liquidity</div>
            <div className="text-lg font-bold text-prism-gold">
              {(market.liquidity || 0).toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Volume</div>
            <div className="text-lg font-bold text-prism-purple">
              {(market.volume || 0).toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Active Locks</div>
            <div className="text-lg font-bold text-blue-400">
              {activeLocks.filter(l => l.referenceId.includes(market.id)).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
