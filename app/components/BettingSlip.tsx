"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMode } from './ModeToggle'

interface BettingSlipProps {
  contest?: {
    id: string
    title: string
    mode: 'roster' | 'duel' | 'bingo'
    entryFee: number
    prizePool: number
    isRisky?: boolean
  }
  onClose?: () => void
}

export default function BettingSlip({ contest, onClose }: BettingSlipProps) {
  const { mode } = useMode()
  const [entryAmount, setEntryAmount] = useState(contest?.entryFee || 100)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mock balances (replace with real context data)
  const fcBalance = 15000
  const bbBalance = 250

  // Calculate potential payout (simplified)
  const potentialPayout = Math.floor(entryAmount * 2.5)
  const canAfford = mode === 'fun' ? entryAmount <= fcBalance : entryAmount <= bbBalance

  const handleSubmitEntry = async () => {
    setLoading(true)
    try {
      // Placeholder for entry submission
      console.log('Submitting entry:', {
        contest: contest?.id,
        mode,
        amount: entryAmount
      })
      
      // TODO: Integrate with backend
      // 1. Deduct FC/BB from balance
      // 2. Submit entry to contest
      // 3. Generate entry receipt
      
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      alert(`Entry submitted successfully! ${mode === 'fun' ? 'FC' : '$BB'} deducted.`)
      onClose?.()
    } catch (error) {
      console.error('Entry submission failed:', error)
      alert('Failed to submit entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!contest) {
    return (
      <div className="p-6 bg-dark-200/50 border border-dark-border rounded-xl">
        <p className="text-gray-400 text-center">Select a contest to enter</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 z-40">
      <motion.div
        initial={{ x: 500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 500, opacity: 0 }}
        className="bg-dark-200 border-2 border-prism-teal rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={`p-4 ${
          mode === 'fun'
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30'
            : 'bg-gradient-to-r from-yellow-500/20 to-green-500/20 border-b border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-lg">Entry Slip</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
            mode === 'fun'
              ? 'bg-purple-500/20 text-purple-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            {mode === 'fun' ? '🎮 ENTERTAINMENT MODE' : '🏆 PRIZE MODE'}
          </div>
        </div>

        {/* Contest Info */}
        <div className="p-4 border-b border-dark-border">
          <h4 className="font-bold text-white mb-1">{contest.title}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="capitalize">{contest.mode}</span>
            <span>•</span>
            <span>Prize Pool: {contest.prizePool.toLocaleString()}</span>
          </div>
        </div>

        {/* Entry Amount */}
        <div className="p-4 border-b border-dark-border">
          <label className="block text-sm text-gray-400 mb-2">
            Entry Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={entryAmount}
              onChange={(e) => setEntryAmount(Number(e.target.value))}
              min={10}
              max={mode === 'fun' ? fcBalance : bbBalance}
              className="w-full px-4 py-3 bg-dark-300 border border-dark-border rounded-lg text-white font-bold text-xl focus:outline-none focus:border-prism-teal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              {mode === 'fun' ? 'FC' : '$BB'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Available: {mode === 'fun' ? fcBalance.toLocaleString() : bbBalance} {mode === 'fun' ? 'FC' : '$BB'}
            </span>
            {!canAfford && (
              <span className="text-red-400 font-semibold">
                Insufficient balance
              </span>
            )}
          </div>
        </div>

        {/* Payout Calculation */}
        <div className="p-4 bg-dark-300/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Entry Fee:</span>
              <span className="text-white font-semibold">
                {entryAmount} {mode === 'fun' ? 'FC' : '$BB'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Potential Win:</span>
              <span className="text-green-400 font-bold text-lg">
                {potentialPayout} {mode === 'fun' ? 'FC' : 'USDC'}
              </span>
            </div>
            
            {mode === 'prize' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-yellow-400 font-semibold">
                  {(potentialPayout / entryAmount).toFixed(2)}x
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Real Money Warning (Prize Mode + Risky Market) */}
        {mode === 'prize' && contest.isRisky && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-4 bg-red-500/10 border-t border-red-500/30"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-red-400 mb-1 text-sm">
                  REAL MONEY WARNING
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  You're entering with <strong className="text-yellow-400">BlackBook tokens ($BB)</strong> which can win <strong className="text-green-400">real USDC prizes</strong>. 
                  This contest is classified as <strong className="text-red-400">high-risk</strong>. Play responsibly.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="p-4">
          {!showConfirm ? (
            <motion.button
              whileHover={{ scale: canAfford ? 1.02 : 1 }}
              whileTap={{ scale: canAfford ? 0.98 : 1 }}
              onClick={() => canAfford && setShowConfirm(true)}
              disabled={!canAfford}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                canAfford
                  ? mode === 'fun'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg'
                    : 'bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 shadow-lg'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {canAfford ? 'Submit Entry' : 'Insufficient Balance'}
            </motion.button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-gray-300 text-center mb-3">
                {mode === 'fun' ? (
                  <p>Confirm entertainment entry with <strong>{entryAmount} FC</strong></p>
                ) : (
                  <p>Confirm contest entry with <strong>{entryAmount} $BB</strong> for real prizes</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitEntry}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${
                    mode === 'fun'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-yellow-500 to-green-500'
                  } disabled:opacity-50`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">Submitting...</span>
                    </div>
                  ) : (
                    'Confirm'
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-dark-300 hover:bg-dark-400 text-gray-300 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Legal Footer (Prize Mode Only) */}
        {mode === 'prize' && (
          <div className="p-3 bg-dark-300 border-t border-dark-border">
            <p className="text-[10px] text-gray-500 leading-relaxed text-center">
              Skill-based contest. No purchase necessary to obtain $BB. See rules.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Simplified Entry Card Component (for use in contest pages)
export function QuickEntryCard({ contest }: { contest: any }) {
  const { mode } = useMode()
  const [showFullSlip, setShowFullSlip] = useState(false)

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowFullSlip(true)}
        className={`w-full p-4 rounded-xl border-2 transition-all ${
          mode === 'fun'
            ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
            : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="font-bold text-white mb-1">{contest.title}</div>
            <div className="text-sm text-gray-400">
              Entry: {contest.entryFee} {mode === 'fun' ? 'FC' : '$BB'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {Math.floor(contest.entryFee * 2.5)}
            </div>
            <div className="text-xs text-gray-500">
              {mode === 'fun' ? 'FC Prize' : 'USDC'}
            </div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {showFullSlip && (
          <BettingSlip
            contest={contest}
            onClose={() => setShowFullSlip(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
