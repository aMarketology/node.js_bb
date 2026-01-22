// Market Betting Component
// Polymarket/Kalshi-style betting interface for BlackBook L2 Markets

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { getStoredWalletKey } from '@/lib/wallet-session'
import { unlockWallet, type UnlockedWallet } from '@/lib/blackbook-wallet'
import { getWalletVault } from '@/lib/supabase'
import { 
  getQuote, 
  placeBet, 
  getPosition, 
  checkL2Status,
  formatBB,
  type PropBet,
  type Quote,
  type Position 
} from '@/lib/l2-markets'

interface BettingInterfaceProps {
  propBet: PropBet
  onBetPlaced?: () => void
}

export default function BettingInterface({ propBet, onBetPlaced }: BettingInterfaceProps) {
  const { user, isAuthenticated } = useAuth()
  
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [l2Available, setL2Available] = useState<boolean>(false)
  const [unlockedWallet, setUnlockedWallet] = useState<UnlockedWallet | null>(null)

  // Check L2 status on mount
  useEffect(() => {
    checkL2Status().then(setL2Available)
  }, [])

  // Load user position
  useEffect(() => {
    if (user?.blackbook_address) {
      loadPosition()
    }
  }, [user, propBet.id])

  // Auto-unlock wallet
  useEffect(() => {
    if (user?.user_id && isAuthenticated) {
      unlockUserWallet()
    }
  }, [user, isAuthenticated])

  const unlockUserWallet = async () => {
    if (!user?.user_id) return

    try {
      const storedKey = getStoredWalletKey()
      if (!storedKey) return

      const vaultData = await getWalletVault(user.user_id)
      if (!vaultData || !vaultData.encrypted_blob) return

      const wallet = await unlockWallet(
        '',
        vaultData.encrypted_blob,
        vaultData.nonce,
        vaultData.vault_salt,
        storedKey
      )

      setUnlockedWallet(wallet)
      console.log('✅ Wallet unlocked for L2 betting')
    } catch (err) {
      console.error('Failed to unlock wallet:', err)
    }
  }

  const loadPosition = async () => {
    if (!user?.blackbook_address) return

    try {
      const pos = await getPosition(user.blackbook_address, propBet.id)
      setPosition(pos)
    } catch (err) {
      // No position yet - that's ok
      console.log('No position found')
    }
  }

  // Get quote when amount or outcome changes
  useEffect(() => {
    if (selectedOutcome && amount && parseFloat(amount) > 0) {
      fetchQuote()
    } else {
      setQuote(null)
    }
  }, [selectedOutcome, amount])

  const fetchQuote = async () => {
    if (!selectedOutcome || !amount) return

    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) return

      const q = await getQuote(propBet.id, selectedOutcome, amountNum)
      setQuote(q)
    } catch (err: any) {
      console.error('Quote error:', err)
    }
  }

  const handleBet = async () => {
    if (!selectedOutcome || !amount || !unlockedWallet) {
      setError('Please connect wallet and select outcome')
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

      const result = await placeBet(unlockedWallet, propBet.id, selectedOutcome, amountNum)
      
      setSuccess(`✅ Bought ${result.tokens_received.toFixed(2)} "${selectedOutcome}" tokens @ ${result.avg_price.toFixed(3)}!`)
      setAmount('')
      setQuote(null)
      
      // Reload position
      await loadPosition()
      
      if (onBetPlaced) {
        onBetPlaced()
      }
    } catch (err: any) {
      setError(err.message || 'Bet failed')
    } finally {
      setLoading(false)
    }
  }

  const getOutcomePrice = (outcome: string): number => {
    const index = propBet.outcomes.indexOf(outcome)
    return index >= 0 ? parseFloat(propBet.outcome_prices[index]) : 0.5
  }

  const getOutcomePercentage = (outcome: string): string => {
    return (getOutcomePrice(outcome) * 100).toFixed(1)
  }

  if (!l2Available) {
    return (
      <div className="p-6 bg-dark-200 border border-dark-border rounded-xl">
        <div className="text-center text-yellow-500">
          ⚠️ L2 Markets API not available (http://localhost:1234)
          <p className="text-sm text-gray-400 mt-2">Start the L2 server to enable live betting</p>
        </div>
      </div>
    )
  }

  if (propBet.status === 'resolved') {
    return (
      <div className="p-6 bg-dark-200 border border-prism-teal rounded-xl">
        <div className="text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-white font-bold">Market Resolved</div>
          <div className="text-prism-teal text-lg mt-1">Winner: {propBet.winning_outcome}</div>
        </div>
      </div>
    )
  }

  if (propBet.status === 'closed') {
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
      {/* Current Position */}
      {position && Object.keys(position.positions).length > 0 && (
        <div className="p-4 bg-dark-200 border border-prism-purple rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-300">Your Position</span>
            <span className={`text-sm font-bold ${position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-prism-red'}`}>
              {position.unrealized_pnl >= 0 ? '+' : ''}{formatBB(position.unrealized_pnl)}
            </span>
          </div>
          <div className="space-y-1">
            {Object.entries(position.positions).map(([outcome, tokens]) => (
              tokens > 0 && (
                <div key={outcome} className="flex justify-between text-xs">
                  <span className="text-gray-400">{outcome}:</span>
                  <span className="text-white">{tokens.toFixed(2)} tokens</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Outcome Selection */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-300 mb-2">Select Outcome</div>
        {propBet.outcomes.map((outcome, index) => {
          const price = parseFloat(propBet.outcome_prices[index])
          const percentage = getOutcomePercentage(outcome)
          const isSelected = selectedOutcome === outcome

          return (
            <motion.button
              key={outcome}
              onClick={() => setSelectedOutcome(outcome)}
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
                  <div className="text-xs text-gray-400">per token</div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Amount Input */}
      {selectedOutcome && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-300">Bet Amount (BB)</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white text-lg font-mono focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
          />

          {/* Quote Display */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-dark-200 border border-prism-purple rounded-xl space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tokens:</span>
                <span className="text-white font-bold">{quote.tokens.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Price:</span>
                <span className="text-prism-teal font-bold">{quote.price_per_token.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee (2%):</span>
                <span className="text-gray-400">{formatBB(quote.fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Impact:</span>
                <span className={quote.price_impact > 5 ? 'text-yellow-500' : 'text-gray-400'}>
                  {quote.price_impact.toFixed(2)}%
                </span>
              </div>
              <div className="border-t border-dark-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 font-semibold">Max Payout:</span>
                  <span className="text-green-400 font-bold">
                    {formatBB(quote.tokens * (1 / getOutcomePrice(selectedOutcome)))}
                  </span>
                </div>
              </div>
            </motion.div>
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
            disabled={loading || !unlockedWallet || !amount || parseFloat(amount) <= 0}
            className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Placing Bet...' : unlockedWallet ? `Buy ${selectedOutcome}` : 'Connect Wallet'}
          </button>
        </div>
      )}

      {/* Market Stats */}
      <div className="p-4 bg-dark-200 border border-dark-border rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Liquidity</div>
            <div className="text-lg font-bold text-prism-gold">{formatBB(propBet.liquidity)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Volume</div>
            <div className="text-lg font-bold text-prism-purple">{formatBB(propBet.volume)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
