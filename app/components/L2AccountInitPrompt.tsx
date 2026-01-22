'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCreditPrediction } from '../contexts/CreditPredictionContext'
import Link from 'next/link'

export default function L2AccountInitPrompt() {
  const { getL1Balance, bridge, refreshBalance } = useCreditPrediction()
  const [l1Balance, setL1Balance] = useState<{ available: number; locked: number } | null>(null)
  const [bridging, setBridging] = useState(false)
  const [bridgeAmount, setBridgeAmount] = useState('100')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadL1Balance()
  }, [])

  async function loadL1Balance() {
    try {
      const bal = await getL1Balance()
      setL1Balance(bal)
      // Suggest bridging 100 tokens or half of L1 balance, whichever is smaller
      if (bal.available > 0) {
        setBridgeAmount(Math.min(100, Math.floor(bal.available / 2)).toString())
      }
    } catch (err) {
      console.error('Failed to load L1 balance:', err)
      setError('L1 server unavailable. Make sure it\'s running on port 8080.')
    }
  }

  async function handleInitializeBridge() {
    const amount = parseFloat(bridgeAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (l1Balance && l1Balance.available < amount) {
      setError(`Not enough L1 balance (${l1Balance.available.toLocaleString()} $BC available)`)
      return
    }

    try {
      setBridging(true)
      setError('')
      const result = await bridge(amount)
      
      if (result.success) {
        setSuccess(true)
        await refreshBalance()
      }
    } catch (err: any) {
      setError(err.message || 'Bridge failed')
    } finally {
      setBridging(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-prism-teal/20 border border-green-500/50"
      >
        <div className="text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h3 className="text-2xl font-bold text-white mb-2">L2 Account Created!</h3>
          <p className="text-gray-300 mb-4">Your tokens have been bridged and your L2 account is now active.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-prism-teal hover:bg-prism-teal/80 text-white font-semibold transition-colors"
          >
            Continue Betting
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-prism-teal/10 to-prism-gold/10 border border-prism-teal/30"
    >
      <div className="text-center mb-6">
        <span className="text-5xl mb-4 block">🚀</span>
        <h3 className="text-2xl font-bold text-white mb-2">Initialize L2 Account</h3>
        <p className="text-gray-300 text-sm max-w-md mx-auto">
          You need to bridge tokens from Layer 1 to Layer 2 to create your L2 account and start betting.
        </p>
      </div>

      {l1Balance && (
        <div className="bg-dark-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Your L1 Balance</span>
            <span className="text-prism-teal font-bold text-lg">
              {l1Balance.available.toLocaleString()} $BC
            </span>
          </div>
          {l1Balance.locked > 0 && (
            <div className="text-xs text-gray-500">
              Locked: {l1Balance.locked.toLocaleString()} $BC
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Bridge Amount (Recommended: 100+ tokens)
          </label>
          <input
            type="number"
            value={bridgeAmount}
            onChange={(e) => setBridgeAmount(e.target.value)}
            placeholder="100"
            disabled={bridging}
            className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white text-lg focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors disabled:opacity-50"
          />
          {l1Balance && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">Available: {l1Balance.available.toLocaleString()} $BC</span>
              <button
                onClick={() => setBridgeAmount(l1Balance.available.toString())}
                className="text-prism-teal hover:text-prism-teal/80 font-semibold transition-colors"
              >
                Max
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleInitializeBridge}
          disabled={bridging || !bridgeAmount || !l1Balance || l1Balance.available < parseFloat(bridgeAmount)}
          className="w-full px-6 py-4 rounded-xl font-bold text-white text-lg prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bridging ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Bridging Tokens...
            </span>
          ) : (
            `Bridge ${bridgeAmount || '0'} $BC to L2 & Initialize`
          )}
        </button>

        <div className="pt-4 border-t border-dark-border">
          <h4 className="text-white font-semibold text-sm mb-2">How it works:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Step 1: Lock $BC tokens on Layer 1 blockchain</li>
            <li>• Step 2: Claim equivalent $BB tokens on Layer 2</li>
            <li>• This creates your L2 account automatically</li>
            <li>• Use $BB tokens for instant betting on L2</li>
          </ul>
        </div>

        <Link 
          href="/wallet?tab=bridge"
          className="block text-center text-xs text-prism-teal hover:text-prism-teal/80 underline"
        >
          Or go to Bridge page for more options →
        </Link>
      </div>
    </motion.div>
  )
}
