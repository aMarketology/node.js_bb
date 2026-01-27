'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface BetSlipProps {
  contest: {
    id: string
    title: string
    entry_fee: number
    prize_pool: number
    game_type: 'duel' | 'roster' | 'bingo'
    status: 'upcoming' | 'live' | 'settled'
    current_entries: number
    max_entries: number
  }
  picks: any
  isReady: boolean
  userBalance: number
  onSubmit: () => void
  isSubmitting: boolean
}

export default function FloatingBetSlip({
  contest,
  picks,
  isReady,
  userBalance,
  onSubmit,
  isSubmitting
}: BetSlipProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const canAfford = userBalance >= contest.entry_fee
  const canSubmit = isReady && canAfford && contest.status === 'upcoming'

  // Get pick summary based on game type
  const getPickSummary = () => {
    if (!picks) return 'No selection'
    
    if (contest.game_type === 'duel') {
      return picks.pick || 'Select your pick'
    }
    if (contest.game_type === 'roster') {
      const count = picks.creators?.length || 0
      return `${count}/3 creators selected`
    }
    if (contest.game_type === 'bingo') {
      const count = picks.squares?.length || 0
      return `${count}/5 squares selected`
    }
    return 'Make your selection'
  }

  // Desktop: Sticky Sidebar
  if (!isMobile) {
    return (
      <div className="sticky top-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-gray-700">
            <h3 className="font-bold text-lg">Your Entry</h3>
            <p className="text-sm text-gray-400">{contest.title}</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Pick Summary */}
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Pick</p>
              <p className={`font-semibold ${isReady ? 'text-cyan-400' : 'text-gray-400'}`}>
                {getPickSummary()}
              </p>
            </div>

            {/* Contest Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entry Fee</span>
                <span className="font-bold">{contest.entry_fee} $BB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prize Pool</span>
                <span className="font-bold text-green-400">{contest.prize_pool} $BB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entries</span>
                <span>{contest.current_entries}/{contest.max_entries}</span>
              </div>
            </div>

            {/* Balance Warning */}
            {!canAfford && (
              <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-sm text-red-400">
                  ⚠️ Insufficient balance ({userBalance} $BB)
                </p>
                <button 
                  onClick={() => router.push('/wallet')}
                  className="text-xs text-cyan-400 hover:underline mt-1"
                >
                  Add funds →
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canSubmit
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </span>
              ) : contest.status === 'live' ? (
                '⚡ JOIN LIVE'
              ) : (
                `🚀 ENTER CONTEST (${contest.entry_fee} $BB)`
              )}
            </button>

            {/* Your Balance */}
            <div className="text-center pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500">Your Balance</p>
              <p className="font-bold text-yellow-400">⚡ {userBalance} $BB</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile: Floating Bottom Bar
  return (
    <>
      {/* Collapsed Bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 p-4 safe-area-bottom"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1" onClick={() => setIsExpanded(true)}>
                <p className="text-sm text-gray-400">{getPickSummary()}</p>
                <p className="font-bold">{contest.entry_fee} $BB Entry</p>
              </div>
              <button
                onClick={canSubmit ? onSubmit : () => setIsExpanded(true)}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  canSubmit
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isSubmitting ? '⏳' : contest.status === 'live' ? '⚡ JOIN' : '🚀 ENTER'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Sheet */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl max-h-[80vh] overflow-y-auto safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
              </div>

              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl">Confirm Entry</h3>
                <p className="text-gray-400">{contest.title}</p>

                {/* Pick Summary */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Selection</p>
                  <p className={`font-semibold text-lg ${isReady ? 'text-cyan-400' : 'text-gray-400'}`}>
                    {getPickSummary()}
                  </p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Entry Fee</p>
                    <p className="text-xl font-bold">{contest.entry_fee} $BB</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Prize Pool</p>
                    <p className="text-xl font-bold text-green-400">{contest.prize_pool} $BB</p>
                  </div>
                </div>

                {/* Your Balance */}
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <span className="text-gray-400">Your Balance</span>
                  <span className={`font-bold text-lg ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                    ⚡ {userBalance} $BB
                  </span>
                </div>

                {!canAfford && (
                  <div className="p-4 bg-red-900/20 border border-red-600 rounded-xl text-center">
                    <p className="text-red-400 mb-2">⚠️ Insufficient balance</p>
                    <button 
                      onClick={() => router.push('/wallet')}
                      className="text-cyan-400 font-semibold"
                    >
                      Add Funds →
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 py-4 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onSubmit()
                      setIsExpanded(false)
                    }}
                    disabled={!canSubmit || isSubmitting}
                    className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                      canSubmit
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? '⏳ Submitting...' : `🚀 ENTER (${contest.entry_fee} $BB)`}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
