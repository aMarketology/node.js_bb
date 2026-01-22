'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMarkets } from '../contexts/MarketsContext'
import { useAuth } from '../contexts/AuthContext'

interface TradingInterfaceProps {
  marketId: string
  outcomes: string[]
  onTradeComplete?: (result: any) => void
}

interface Quote {
  cost: number
  shares: number
  avgPrice: number
  priceImpact: number
  newPrices: number[]
}

export function TradingInterface({ marketId, outcomes, onTradeComplete }: TradingInterfaceProps) {
  const { isReady, getQuote, placeBet, sellShares, getPosition, getBalance } = useMarkets()
  const { isAuthenticated, activeWalletData } = useAuth()
  
  const [selectedOutcome, setSelectedOutcome] = useState(0)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [position, setPosition] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load position and balance
  useEffect(() => {
    const loadData = async () => {
      if (!isReady || !isAuthenticated) return
      
      try {
        const [pos, bal] = await Promise.all([
          getPosition(marketId).catch(() => null),
          getBalance().catch(() => ({ available: 0 }))
        ])
        setPosition(pos)
        setBalance(bal)
      } catch (err) {
        console.error('Failed to load trading data:', err)
      }
    }
    
    loadData()
  }, [isReady, isAuthenticated, marketId, getPosition, getBalance])

  // Get quote when amount changes
  const fetchQuote = useCallback(async () => {
    if (!isReady || !amount || parseFloat(amount) <= 0) {
      setQuote(null)
      return
    }

    try {
      const parsedAmount = parseFloat(amount)
      const quoteData = await getQuote(marketId, selectedOutcome, parsedAmount)
      setQuote(quoteData)
      setError(null)
    } catch (err: any) {
      console.error('Quote error:', err)
      setError(err.message || 'Failed to get quote')
      setQuote(null)
    }
  }, [isReady, amount, marketId, selectedOutcome, getQuote])

  // Debounced quote fetch
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 300)
    return () => clearTimeout(timer)
  }, [fetchQuote])

  // Handle trade
  const handleTrade = async () => {
    if (!isReady || !amount || parseFloat(amount) <= 0) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const parsedAmount = parseFloat(amount)
      let result

      if (mode === 'buy') {
        result = await placeBet(marketId, selectedOutcome, parsedAmount)
        setSuccess(`Successfully bought ${result.shares?.toFixed(2) || parsedAmount} shares of "${outcomes[selectedOutcome]}"`)
      } else {
        result = await sellShares(marketId, selectedOutcome, parsedAmount)
        setSuccess(`Successfully sold ${parsedAmount} shares of "${outcomes[selectedOutcome]}"`)
      }

      // Refresh position and balance
      const [newPos, newBal] = await Promise.all([
        getPosition(marketId).catch(() => null),
        getBalance().catch(() => ({ available: 0 }))
      ])
      setPosition(newPos)
      setBalance(newBal)
      
      // Clear form
      setAmount('')
      setQuote(null)
      
      if (onTradeComplete) {
        onTradeComplete(result)
      }
    } catch (err: any) {
      console.error('Trade error:', err)
      setError(err.message || 'Trade failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <p className="text-center text-slate-400">
          Connect your wallet to trade
        </p>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <p className="text-center text-slate-400">
          Initializing trading...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      {/* Balance Display */}
      {balance && (
        <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Available Balance</span>
            <span className="text-white font-medium">
              {parseFloat(balance.available || 0).toFixed(2)} credits
            </span>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('buy')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Outcome Selection */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">Outcome</label>
        <div className="grid grid-cols-2 gap-2">
          {outcomes.map((outcome, index) => (
            <button
              key={index}
              onClick={() => setSelectedOutcome(index)}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedOutcome === index
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          {mode === 'buy' ? 'Amount (credits)' : 'Shares to sell'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={mode === 'buy' ? 'Enter amount' : 'Enter shares'}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            min="0"
            step="0.01"
          />
          {mode === 'buy' && balance && (
            <button
              onClick={() => setAmount(balance.available?.toString() || '0')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Position Display (for sell mode) */}
      {mode === 'sell' && position && position.shares?.[selectedOutcome] > 0 && (
        <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Your shares</span>
            <span className="text-white font-medium">
              {position.shares[selectedOutcome].toFixed(2)} shares
            </span>
          </div>
          <button
            onClick={() => setAmount(position.shares[selectedOutcome].toString())}
            className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300"
          >
            Sell all shares
          </button>
        </div>
      )}

      {/* Quote Display */}
      {quote && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">
              {mode === 'buy' ? 'You receive' : 'You get'}
            </span>
            <span className="text-white font-medium">
              {mode === 'buy'
                ? `${quote.shares?.toFixed(2) || '0'} shares`
                : `${quote.cost?.toFixed(2) || '0'} credits`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Avg price</span>
            <span className="text-white">
              {((quote.avgPrice || 0) * 100).toFixed(1)}¢
            </span>
          </div>
          {quote.priceImpact > 0.01 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Price impact</span>
              <span className={quote.priceImpact > 0.05 ? 'text-yellow-400' : 'text-slate-300'}>
                {(quote.priceImpact * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          loading || !amount || parseFloat(amount) <= 0
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : mode === 'buy'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : mode === 'buy' ? (
          `Buy ${outcomes[selectedOutcome]}`
        ) : (
          `Sell ${outcomes[selectedOutcome]}`
        )}
      </button>
    </div>
  )
}

export default TradingInterface
