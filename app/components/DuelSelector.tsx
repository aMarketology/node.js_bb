'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Entity {
  name: string
  avatar_url?: string
  stats?: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'neutral'
  }[]
}

interface DuelSelectorProps {
  entities: Entity[]
  selectedPick: string | null
  onSelect: (pick: string) => void
  disabled?: boolean
  currentScores?: Record<string, number>
  status: 'upcoming' | 'live' | 'settled'
  winner?: string
}

export default function DuelSelector({
  entities,
  selectedPick,
  onSelect,
  disabled = false,
  currentScores,
  status,
  winner
}: DuelSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Default to 2 entities for a duel
  const leftEntity = entities[0]
  const rightEntity = entities[1]

  if (!leftEntity || !rightEntity) {
    return (
      <div className="text-center text-gray-400 py-8">
        Invalid duel configuration
      </div>
    )
  }

  const getCardStyle = (entityName: string) => {
    const isSelected = selectedPick === entityName
    const isHovered = hovered === entityName
    const isWinner = winner === entityName
    const isLoser = winner && winner !== entityName

    if (isWinner) return 'border-green-500 bg-green-900/30'
    if (isLoser) return 'border-red-500/50 bg-red-900/10 opacity-60'
    if (isSelected) return 'border-cyan-400 bg-cyan-400/10 ring-2 ring-cyan-400'
    if (isHovered && !disabled) return 'border-gray-500 bg-gray-700/50'
    return 'border-gray-700 bg-gray-800'
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <span className="text-green-400">↗</span>
    if (trend === 'down') return <span className="text-red-400">↘</span>
    return null
  }

  return (
    <div className="relative">
      {/* VS Badge */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ 
            scale: status === 'live' ? [1, 1.1, 1] : 1,
            rotate: status === 'live' ? [0, 5, -5, 0] : 0
          }}
          transition={{ 
            repeat: status === 'live' ? Infinity : 0, 
            duration: 2 
          }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-2xl">⚔️</span>
            </div>
          </div>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl font-black text-white tracking-wider">
            VS
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Entity (Blue Team) */}
        <motion.div
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <div
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${getCardStyle(leftEntity.name)} ${disabled ? 'cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onSelect(leftEntity.name)}
            onMouseEnter={() => setHovered(leftEntity.name)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Blue Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-lg" />
            
            <div className="text-center">
              <div className="h-24 w-24 mx-auto mb-4 rounded-full ring-4 ring-blue-500/50 bg-blue-900 flex items-center justify-center overflow-hidden">
                {leftEntity.avatar_url ? (
                  <img src={leftEntity.avatar_url} alt={leftEntity.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-blue-300">{leftEntity.name[0]}</span>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{leftEntity.name}</h3>
              
              {selectedPick === leftEntity.name && (
                <span className="inline-block mb-3 px-3 py-1 bg-cyan-400 text-black text-xs font-bold rounded-full">YOUR PICK</span>
              )}
              
              {winner === leftEntity.name && (
                <span className="inline-block mb-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">🏆 WINNER</span>
              )}

              {/* Stats */}
              {leftEntity.stats && (
                <div className="space-y-2 mt-4">
                  {leftEntity.stats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded">
                      <span className="text-gray-400">{stat.label}</span>
                      <span className="font-semibold flex items-center gap-1">
                        {stat.value}
                        {getTrendIcon(stat.trend)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Score */}
              {status === 'live' && currentScores?.[leftEntity.name] !== undefined && (
                <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/50">
                  <p className="text-xs text-blue-400 uppercase tracking-wider">Live Score</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {currentScores[leftEntity.name].toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Entity (Red Team) */}
        <motion.div
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <div
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${getCardStyle(rightEntity.name)} ${disabled ? 'cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onSelect(rightEntity.name)}
            onMouseEnter={() => setHovered(rightEntity.name)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Red Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-lg" />
            
            <div className="text-center">
              <div className="h-24 w-24 mx-auto mb-4 rounded-full ring-4 ring-red-500/50 bg-red-900 flex items-center justify-center overflow-hidden">
                {rightEntity.avatar_url ? (
                  <img src={rightEntity.avatar_url} alt={rightEntity.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-red-300">{rightEntity.name[0]}</span>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{rightEntity.name}</h3>
              
              {selectedPick === rightEntity.name && (
                <span className="inline-block mb-3 px-3 py-1 bg-cyan-400 text-black text-xs font-bold rounded-full">YOUR PICK</span>
              )}
              
              {winner === rightEntity.name && (
                <span className="inline-block mb-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">🏆 WINNER</span>
              )}

              {/* Stats */}
              {rightEntity.stats && (
                <div className="space-y-2 mt-4">
                  {rightEntity.stats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-900/50 p-2 rounded">
                      <span className="text-gray-400">{stat.label}</span>
                      <span className="font-semibold flex items-center gap-1">
                        {stat.value}
                        {getTrendIcon(stat.trend)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Score */}
              {status === 'live' && currentScores?.[rightEntity.name] !== undefined && (
                <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50">
                  <p className="text-xs text-red-400 uppercase tracking-wider">Live Score</p>
                  <p className="text-3xl font-bold text-red-400">
                    {currentScores[rightEntity.name].toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selection Instructions */}
      {status === 'upcoming' && !selectedPick && !disabled && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-400 mt-8"
        >
          👆 Click on a side to make your pick
        </motion.p>
      )}

      {status === 'settled' && (
        <div className="text-center mt-6 p-4 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-400">Contest has been settled</p>
          {winner && (
            <p className="text-lg font-bold text-green-400 mt-1">
              🏆 {winner} wins!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
