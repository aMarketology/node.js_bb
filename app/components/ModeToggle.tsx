"use client"

import { motion } from 'framer-motion'
import { useState, createContext, useContext, ReactNode } from 'react'

// Context for global mode state
interface ModeContextType {
  mode: 'fun' | 'prize'
  setMode: (mode: 'fun' | 'prize') => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<'fun' | 'prize'>('fun')

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export const useMode = () => {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}

// Toggle Switch Component
export default function ModeToggle() {
  const { mode, setMode } = useMode()

  return (
    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
      {/* Fun Mode Button */}
      <button
        onClick={() => setMode('fun')}
        className={`relative px-6 py-2 rounded-full transition-all duration-300 ${
          mode === 'fun' 
            ? 'text-white font-bold' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {mode === 'fun' && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-xl">🎮</span>
          <span>Fun Mode</span>
          <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded">FC</span>
        </span>
      </button>

      {/* Prize Mode Button */}
      <button
        onClick={() => setMode('prize')}
        className={`relative px-6 py-2 rounded-full transition-all duration-300 ${
          mode === 'prize' 
            ? 'text-white font-bold' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {mode === 'prize' && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span>Prize Mode</span>
          <span className="text-xs bg-yellow-500/20 px-2 py-0.5 rounded">$BB</span>
        </span>
      </button>
    </div>
  )
}

// Balance Display Component (shows/hides based on mode)
export function BalanceDisplay() {
  const { mode } = useMode()

  // Mock balances (replace with real data from context/API)
  const fcBalance = 15000
  const bbBalance = 250

  return (
    <div className="flex items-center gap-4">
      {/* Fan Coins Balance - Always Visible */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
        mode === 'fun' 
          ? 'bg-purple-500/10 border-purple-500/30' 
          : 'bg-gray-800/30 border-gray-700/30 opacity-50'
      }`}>
        <span className="text-2xl">🪙</span>
        <div>
          <div className="text-xs text-gray-400">Fan Coins</div>
          <div className={`font-bold ${mode === 'fun' ? 'text-purple-300' : 'text-gray-500'}`}>
            {fcBalance.toLocaleString()} FC
          </div>
        </div>
      </div>

      {/* BlackBook Balance - Hidden/Dimmed in Fun Mode */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
        mode === 'prize' 
          ? 'bg-yellow-500/10 border-yellow-500/30' 
          : 'bg-gray-800/20 border-gray-700/20 opacity-30 blur-[2px]'
      }`}>
        <span className="text-2xl">💰</span>
        <div>
          <div className="text-xs text-gray-400">BlackBook</div>
          <div className={`font-bold ${mode === 'prize' ? 'text-yellow-300' : 'text-gray-600'}`}>
            {mode === 'prize' ? `${bbBalance} $BB` : '• • •'}
          </div>
        </div>
      </div>

      {/* Mode Indicator Badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        mode === 'fun'
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
      }`}>
        {mode === 'fun' ? 'ENTERTAINMENT' : 'REAL PRIZES'}
      </div>
    </div>
  )
}

// Info Banner Component (explains current mode)
export function ModeInfoBanner() {
  const { mode } = useMode()

  if (mode === 'fun') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <h3 className="font-bold text-purple-300 mb-1">Fun Mode (Entertainment Only)</h3>
            <p className="text-sm text-gray-300">
              You're using <strong>Fan Coins (FC)</strong> for entertainment. No real money prizes. 
              Perfect for practice and social competitions!
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <h3 className="font-bold text-yellow-300 mb-1">Prize Mode (Real USDC Winnings)</h3>
          <p className="text-sm text-gray-300">
            You're using <strong>BlackBook Tokens ($BB)</strong> - FREE sweepstakes entries. 
            Win real USDC prizes! No purchase necessary.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
