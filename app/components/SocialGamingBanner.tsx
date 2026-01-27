'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function SocialGamingBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 via-green-500/20 to-blue-500/20 border-b-2 border-yellow-500/50"
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">🎮</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">Social Gaming Platform</span>
                    <span className="text-gray-400 text-sm hidden md:inline">•</span>
                    <span className="text-gray-300 text-sm">
                      <strong className="text-yellow-400">NOT A SPORTSBOOK</strong> 
                      <span className="hidden md:inline"> — We sell virtual currency & give FREE sweepstakes entries</span>
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                      100% Legal
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  href="/get-started" 
                  className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Learn More
                </Link>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close banner"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
