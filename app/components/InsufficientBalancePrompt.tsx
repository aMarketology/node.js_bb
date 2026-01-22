'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreditPrediction } from '../contexts/CreditPredictionContext'
import Link from 'next/link'

interface InsufficientBalancePromptProps {
  required: number
  available: number
  onBridge?: () => void
}

export default function InsufficientBalancePrompt({ 
  required, 
  available,
  onBridge
}: InsufficientBalancePromptProps) {
  const { getL1Balance, bridge } = useCreditPrediction()
  const [l1Balance, setL1Balance] = useState<{ available: number; locked: number } | null>(null)
  const [bridging, setBridging] = useState(false)
  const [showQuickBridge, setShowQuickBridge] = useState(false)
  const [bridgeAmount, setBridgeAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const shortage = required - available

  useEffect(() => {
    loadL1Balance()
  }, [])

  useEffect(() => {
    if (shortage > 0) {
      setBridgeAmount(Math.ceil(shortage).toString())
    }
  }, [shortage])

  async function loadL1Balance() {
    try {
      const bal = await getL1Balance()
      setL1Balance(bal)
    } catch (err) {
      console.error('Failed to load L1 balance:', err)
    }
  }

  async function handleQuickBridge() {
    const amount = parseFloat(bridgeAmount)
    if (!amount || amount <= 0) return

    if (l1Balance && l1Balance.available < amount) {
      setError(`Not enough L1 balance (${l1Balance.available} $BC available)`)
      return
    }

    try {
      setBridging(true)
      setError('')
      const result = await bridge(amount)
      
      if (result.success) {
        setSuccess(true)
        if (onBridge) onBridge()
        setTimeout(() => setShowQuickBridge(false), 2000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBridging(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">💸</span>
        <div className="flex-1">
          <div className="text-red-400 font-bold">Insufficient L2 Balance</div>
          <div className="text-gray-400 text-sm mt-1">
            Need <span className="text-white font-semibold">{required.toLocaleString()} $BB</span>, 
            but only have <span className="text-white font-semibold">{available.toLocaleString()} $BB</span>
          </div>
          <div className="text-red-300 text-sm mt-1">
            Short by: <span className="font-bold">{shortage.toLocaleString()} $BB</span>
          </div>
        </div>
      </div>

      {l1Balance && (
        <div className="pl-11 space-y-2">
          <div className="text-sm text-gray-400">
            Your L1 balance: <span className="text-prism-teal font-semibold">{l1Balance.available.toLocaleString()} $BC</span>
          </div>

          {l1Balance.available >= shortage ? (
            <div className="space-y-2">
              {!showQuickBridge ? (
                <button
                  onClick={() => setShowQuickBridge(true)}
                  className="px-4 py-2 rounded-lg bg-prism-teal hover:bg-prism-teal/80 text-white font-semibold text-sm transition-colors"
                >
                  Bridge {Math.ceil(shortage)} $BC from L1
                </button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {success ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <span className="text-xl">✅</span>
                        <span className="font-semibold">Bridge complete! Tokens available on L2.</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={bridgeAmount}
                            onChange={(e) => setBridgeAmount(e.target.value)}
                            placeholder="Amount"
                            disabled={bridging}
                            className="flex-1 px-3 py-2 rounded-lg bg-dark-300 border border-dark-border text-white text-sm focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors disabled:opacity-50"
                          />
                          <button
                            onClick={handleQuickBridge}
                            disabled={bridging || !bridgeAmount}
                            className="px-4 py-2 rounded-lg bg-prism-teal hover:bg-prism-teal/80 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {bridging ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Bridging...
                              </span>
                            ) : (
                              'Bridge'
                            )}
                          </button>
                        </div>
                        {error && (
                          <div className="text-red-400 text-xs">{error}</div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ) : (
            <div className="text-yellow-400 text-sm">
              ⚠️ Not enough L1 balance to bridge. You need {Math.ceil(shortage)} $BC on L1.
            </div>
          )}

          <Link 
            href="/wallet?tab=bridge"
            className="inline-block text-xs text-prism-teal hover:text-prism-teal/80 underline"
          >
            Go to Bridge page →
          </Link>
        </div>
      )}
    </motion.div>
  )
}
