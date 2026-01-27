'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface BingoSquare {
  id: string
  text: string
  completed?: boolean
  selected?: boolean
}

interface BingoCardProps {
  squares: BingoSquare[]
  selectedSquares: string[]
  onToggle: (squareId: string) => void
  maxSelections: number
  disabled?: boolean
  status: 'upcoming' | 'live' | 'settled'
  winningLines?: string[][]
}

export default function BingoCard({
  squares,
  selectedSquares,
  onToggle,
  maxSelections,
  disabled = false,
  status,
  winningLines = []
}: BingoCardProps) {
  // Check if a line is complete (all squares in line are completed)
  const checkLineComplete = (line: string[]) => {
    return line.every(id => squares.find(s => s.id === id)?.completed)
  }

  // Get winning line indices for highlighting
  const getWinningSquares = () => {
    const winning = new Set<string>()
    winningLines.forEach(line => {
      if (checkLineComplete(line)) {
        line.forEach(id => winning.add(id))
      }
    })
    return winning
  }

  const winningSquareIds = getWinningSquares()

  // Check if user has selected a winning line
  const hasWinningSelection = () => {
    return winningLines.some(line => 
      line.every(id => selectedSquares.includes(id)) && checkLineComplete(line)
    )
  }

  const getSquareStyle = (square: BingoSquare) => {
    const isSelected = selectedSquares.includes(square.id)
    const isCompleted = square.completed
    const isWinningSquare = winningSquareIds.has(square.id)

    if (status === 'settled') {
      if (isWinningSquare && isSelected) {
        return 'bg-green-600 border-green-400 text-white'
      }
      if (isCompleted) {
        return 'bg-green-900/30 border-green-600 text-green-400'
      }
      if (isSelected && !isCompleted) {
        return 'bg-red-900/30 border-red-600 text-red-400'
      }
      return 'bg-gray-900 border-gray-700 text-gray-500'
    }

    if (status === 'live') {
      if (isCompleted && isSelected) {
        return 'bg-green-600 border-green-400 text-white'
      }
      if (isCompleted) {
        return 'bg-green-900/30 border-green-600 text-green-400'
      }
      if (isSelected) {
        return 'bg-cyan-400/30 border-cyan-400 text-cyan-400'
      }
      return 'bg-gray-900 border-gray-700 text-gray-400'
    }

    // Upcoming
    if (isSelected) {
      return 'bg-cyan-400/30 border-cyan-400 text-cyan-400 ring-2 ring-cyan-400'
    }
    return 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Selection Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="font-semibold">Select your predictions</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          selectedSquares.length === maxSelections 
            ? 'bg-cyan-400 text-black font-bold' 
            : 'bg-gray-700 text-gray-300'
        }`}>
          {selectedSquares.length}/{maxSelections} selected
        </span>
      </div>

      {/* Bingo Grid */}
      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
        {squares.map((square, index) => {
          const isSelected = selectedSquares.includes(square.id)
          const canSelect = selectedSquares.length < maxSelections || isSelected

          return (
            <motion.button
              key={square.id}
              whileHover={!disabled && canSelect ? { scale: 1.05 } : {}}
              whileTap={!disabled && canSelect ? { scale: 0.95 } : {}}
              onClick={() => !disabled && canSelect && onToggle(square.id)}
              disabled={disabled || (!isSelected && selectedSquares.length >= maxSelections)}
              className={`
                relative aspect-square p-4 rounded-xl border-2 transition-all
                flex flex-col items-center justify-center text-center
                ${getSquareStyle(square)}
                ${disabled || (!canSelect && !isSelected) ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Completed indicator */}
              {status !== 'upcoming' && square.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 text-green-400"
                >
                  ✓
                </motion.div>
              )}

              {/* Square content */}
              <span className="text-sm font-medium leading-tight">
                {square.text}
              </span>

              {/* Selection indicator */}
              {isSelected && status === 'upcoming' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-black text-sm"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Win Condition */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400">🏆</span>
          <span className="text-sm font-semibold">How to Win</span>
        </div>
        <p className="text-sm text-gray-400">
          Select {maxSelections} squares you think will happen. 
          Complete a horizontal, vertical, or diagonal line to win!
        </p>
      </div>

      {/* Status Messages */}
      {status === 'live' && (
        <div className="text-center p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <p className="text-sm text-yellow-400">
            🔴 Contest is LIVE! Watch your predictions unfold.
          </p>
        </div>
      )}

      {status === 'settled' && hasWinningSelection() && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-4 bg-green-900/20 border border-green-600 rounded-lg"
        >
          <p className="text-lg font-bold text-green-400">
            🎉 BINGO! You completed a winning line!
          </p>
        </motion.div>
      )}

      {status === 'settled' && !hasWinningSelection() && (
        <div className="text-center p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <p className="text-sm text-red-400">
            ❌ No winning line completed. Better luck next time!
          </p>
        </div>
      )}

      {/* Selection Instructions */}
      {status === 'upcoming' && selectedSquares.length < maxSelections && !disabled && (
        <p className="text-center text-gray-400 text-sm">
          👆 Click squares to make your predictions
        </p>
      )}

      {status === 'upcoming' && selectedSquares.length === maxSelections && (
        <div className="text-center p-3 bg-cyan-400/10 border border-cyan-400 rounded-lg">
          <p className="text-sm text-cyan-400">
            ✅ {maxSelections} selections made. Ready to submit!
          </p>
        </div>
      )}
    </div>
  )
}
