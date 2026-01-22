'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCreditPrediction } from '../contexts/CreditPredictionContext'

export default function BridgeInterface() {
  const { balance, getL1Balance, bridge, refreshBalance } = useCreditPrediction()
  
  const [l1Balance, setL1Balance] = useState<{ available: number; locked: number } | null>(null)
  const [bridgeAmount, setBridgeAmount] = useState('')
  const [bridging, setBridging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'locking' | 'claiming' | 'complete'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    loadL1Balance()
  }, [])

  async function loadL1Balance() {
    try {
      const l1Bal = await getL1Balance()
      setL1Balance(l1Bal)
    } catch (error: any) {
      console.error('Failed to load L1 balance:', error)
      setError('L1 server unavailable. Make sure it\'s running on port 8080.')
    }
  }

  async function handleBridge() {
    const amount = parseFloat(bridgeAmount)
    if (!amount || amount <= 0) return

    if (l1Balance && l1Balance.available < amount) {
      setError(`Insufficient L1 balance: ${l1Balance.available} $BC available`)
      return
    }

    try {
      setBridging(true)
      setError('')
      setStatus('locking')

      const result = await bridge(amount)

      if (result.success) {
        setStatus('complete')
        setBridgeAmount('')
        await Promise.all([loadL1Balance(), refreshBalance()])
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch (error: any) {
      setError(error.message)
      setStatus('idle')
    } finally {
      setBridging(false)
    }
  }

  return (
    <div className="prism-card rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-prism-teal to-prism-gold flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bridge $BC → $BB</h2>
          <p className="text-gray-400 text-sm">Transfer from L1 to L2</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-dark-300 border border-dark-border">
          <div className="text-gray-500 text-sm mb-1">L1 Balance ($BC)</div>
          <div className="text-2xl font-bold text-prism-teal">
            {l1Balance ? l1Balance.available.toLocaleString() : '---'}
          </div>
          {l1Balance && l1Balance.locked > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Locked: {l1Balance.locked.toLocaleString()}
            </div>
          )}
        </div>
        <div className="p-4 rounded-lg bg-dark-300 border border-dark-border">
          <div className="text-gray-500 text-sm mb-1">L2 Balance ($BB)</div>
          <div className="text-2xl font-bold text-prism-gold">
            {balance.available.toLocaleString()}
          </div>
          {balance.locked > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Locked: {balance.locked.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Bridge Status */}
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-gradient-to-r from-prism-teal/20 to-prism-gold/20 border border-prism-teal/30"
        >
          <div className="flex items-center gap-3">
            {status === 'complete' ? (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-white font-bold">Bridge Complete!</div>
                  <div className="text-gray-400 text-sm">Funds are now available on L2</div>
                </div>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-prism-teal"></div>
                <div>
                  <div className="text-white font-bold">
                    {status === 'locking' ? 'Step 1: Locking on L1...' : 'Step 2: Claiming on L2...'}
                  </div>
                  <div className="text-gray-400 text-sm">Please wait...</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <div className="text-red-400 font-semibold">Bridge Failed</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bridge Form */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Amount to Bridge
        </label>
        <div className="relative">
          <input
            type="number"
            value={bridgeAmount}
            onChange={(e) => setBridgeAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={bridging || !l1Balance}
            className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white text-lg focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
            $BC
          </div>
        </div>
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

      {/* Info Box */}
      <div className="mb-6 p-4 rounded-lg bg-prism-teal/10 border border-prism-teal/30">
        <h3 className="text-white font-semibold text-sm mb-2">How it works:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Step 1: Lock $BC tokens on L1 blockchain</li>
          <li>• Step 2: Claim equivalent $BB tokens on L2</li>
          <li>• Process typically takes 2-3 seconds</li>
          <li>• 1:1 exchange rate (1 $BC = 1 $BB)</li>
        </ul>
      </div>

      {/* Bridge Button */}
      <button
        onClick={handleBridge}
        disabled={bridging || !bridgeAmount || parseFloat(bridgeAmount) <= 0 || !l1Balance}
        className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {bridging ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            Bridging...
          </span>
        ) : (
          `Bridge ${bridgeAmount || '0'} $BC to L2`
        )}
      </button>
    </div>
  )
}
