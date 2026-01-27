'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Player positions
type Position = 'FWD' | 'MID' | 'DEF' | 'GK'

// Player data structure
interface Player {
  id: string
  name: string
  team: string
  position: Position
  salary: number
  avgPoints: number
  recentForm: number[] // Last 5 games
  photoUrl?: string
}

// Roster entry
interface RosterSlot {
  position: Position
  player: Player | null
}

interface RosterBuilderProps {
  contestId: string
  contestName: string
  entryFee: number
  potSize: number
  matchTeams: string // e.g., "USA vs England"
  onSubmit: (roster: Player[]) => Promise<void>
  onCancel: () => void
}

// Mock player data (in production, fetch from L2)
const MOCK_PLAYERS: Player[] = [
  // USA Players
  { id: 'p1', name: 'Christian Pulisic', team: 'USA', position: 'FWD', salary: 9500, avgPoints: 12.4, recentForm: [14, 11, 15, 10, 13] },
  { id: 'p2', name: 'Folarin Balogun', team: 'USA', position: 'FWD', salary: 8200, avgPoints: 10.8, recentForm: [12, 9, 11, 10, 12] },
  { id: 'p3', name: 'Timothy Weah', team: 'USA', position: 'FWD', salary: 7500, avgPoints: 9.2, recentForm: [8, 10, 11, 7, 9] },
  { id: 'p4', name: 'Weston McKennie', team: 'USA', position: 'MID', salary: 8800, avgPoints: 11.5, recentForm: [13, 10, 12, 11, 12] },
  { id: 'p5', name: 'Tyler Adams', team: 'USA', position: 'MID', salary: 8000, avgPoints: 10.1, recentForm: [11, 9, 10, 10, 11] },
  { id: 'p6', name: 'Gio Reyna', team: 'USA', position: 'MID', salary: 7200, avgPoints: 8.9, recentForm: [9, 8, 10, 8, 9] },
  { id: 'p7', name: 'Antonee Robinson', team: 'USA', position: 'DEF', salary: 6500, avgPoints: 7.8, recentForm: [8, 7, 9, 7, 8] },
  { id: 'p8', name: 'Sergiño Dest', team: 'USA', position: 'DEF', salary: 6000, avgPoints: 7.2, recentForm: [7, 6, 8, 7, 7] },
  { id: 'p9', name: 'Matt Turner', team: 'USA', position: 'GK', salary: 5500, avgPoints: 8.5, recentForm: [9, 8, 10, 7, 9] },
  
  // England Players
  { id: 'p10', name: 'Harry Kane', team: 'ENG', position: 'FWD', salary: 10000, avgPoints: 14.2, recentForm: [16, 13, 15, 14, 14] },
  { id: 'p11', name: 'Bukayo Saka', team: 'ENG', position: 'FWD', salary: 9000, avgPoints: 11.8, recentForm: [13, 11, 12, 10, 13] },
  { id: 'p12', name: 'Phil Foden', team: 'ENG', position: 'FWD', salary: 8500, avgPoints: 10.9, recentForm: [12, 10, 11, 9, 12] },
  { id: 'p13', name: 'Jude Bellingham', team: 'ENG', position: 'MID', salary: 9200, avgPoints: 12.1, recentForm: [14, 11, 13, 12, 12] },
  { id: 'p14', name: 'Declan Rice', team: 'ENG', position: 'MID', salary: 8300, avgPoints: 10.4, recentForm: [11, 10, 11, 9, 11] },
  { id: 'p15', name: 'James Maddison', team: 'ENG', position: 'MID', salary: 7800, avgPoints: 9.6, recentForm: [10, 9, 11, 8, 10] },
  { id: 'p16', name: 'Kyle Walker', team: 'ENG', position: 'DEF', salary: 6800, avgPoints: 8.1, recentForm: [9, 7, 8, 8, 8] },
  { id: 'p17', name: 'John Stones', team: 'ENG', position: 'DEF', salary: 6200, avgPoints: 7.5, recentForm: [8, 7, 8, 7, 7] },
  { id: 'p18', name: 'Jordan Pickford', team: 'ENG', position: 'GK', salary: 5800, avgPoints: 9.1, recentForm: [10, 9, 9, 8, 10] },
]

const SALARY_CAP = 25000
const ROSTER_SIZE = 3

export default function RosterBuilder({
  contestId,
  contestName,
  entryFee,
  potSize,
  matchTeams,
  onSubmit,
  onCancel
}: RosterBuilderProps) {
  const [roster, setRoster] = useState<RosterSlot[]>([
    { position: 'FWD', player: null },
    { position: 'MID', player: null },
    { position: 'GK', player: null }
  ])
  const [selectedPosition, setSelectedPosition] = useState<Position>('FWD')
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('ALL')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate remaining salary
  const usedSalary = roster.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0)
  const remainingSalary = SALARY_CAP - usedSalary

  // Check if roster is complete
  const isRosterComplete = roster.every(slot => slot.player !== null)

  // Filter players
  const filteredPlayers = players.filter(player => {
    const matchesPosition = player.position === selectedPosition
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = teamFilter === 'ALL' || player.team === teamFilter
    const notInRoster = !roster.some(slot => slot.player?.id === player.id)
    const affordable = player.salary <= remainingSalary || roster.some(slot => slot.position === selectedPosition && slot.player)
    
    return matchesPosition && matchesSearch && matchesTeam && notInRoster && affordable
  })

  // Add player to roster
  const addPlayer = (player: Player) => {
    setRoster(prev => prev.map(slot => 
      slot.position === player.position && !slot.player 
        ? { ...slot, player }
        : slot
    ))
  }

  // Remove player from roster
  const removePlayer = (position: Position) => {
    setRoster(prev => prev.map(slot =>
      slot.position === position ? { ...slot, player: null } : slot
    ))
  }

  // Submit roster
  const handleSubmit = async () => {
    if (!isRosterComplete) return
    
    setIsSubmitting(true)
    try {
      const selectedPlayers = roster.map(slot => slot.player!).filter(p => p)
      await onSubmit(selectedPlayers)
    } catch (error) {
      console.error('Failed to submit roster:', error)
      alert('Failed to enter contest. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 rounded-3xl shadow-2xl border border-purple-500/30"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">{contestName}</h2>
                <p className="text-xl text-gray-300">{matchTeams}</p>
              </div>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Contest Info */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Entry Fee</div>
                <div className="text-2xl font-bold text-yellow-400">{entryFee} $BB</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Prize Pool</div>
                <div className="text-2xl font-bold text-green-400">{potSize} $BB</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Salary Remaining</div>
                <div className={`text-2xl font-bold ${remainingSalary < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  ${remainingSalary.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 p-8">
            {/* Left: Your Roster */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Your Roster</h3>
              <div className="space-y-4">
                {roster.map((slot, index) => (
                  <motion.div
                    key={index}
                    className={`bg-white/5 rounded-xl p-6 border-2 transition-all cursor-pointer ${
                      selectedPosition === slot.position
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedPosition(slot.position)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                          slot.player
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gray-700'
                        }`}>
                          {slot.position === 'FWD' ? '⚽' : slot.position === 'MID' ? '🎯' : slot.position === 'DEF' ? '🛡️' : '🧤'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">{slot.position}</div>
                          {slot.player ? (
                            <>
                              <div className="font-bold text-white text-lg">{slot.player.name}</div>
                              <div className="text-sm text-gray-400">{slot.player.team} • ${slot.player.salary.toLocaleString()}</div>
                            </>
                          ) : (
                            <div className="text-gray-500 italic">Select a player</div>
                          )}
                        </div>
                      </div>
                      {slot.player && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removePlayer(slot.position)
                          }}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    {slot.player && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Avg Points:</span>
                          <span className="text-green-400 font-semibold">{slot.player.avgPoints}/game</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-gray-400 text-xs">Recent Form:</span>
                          {slot.player.recentForm.map((pts, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                                pts >= 12 ? 'bg-green-500/20 text-green-400' :
                                pts >= 8 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {pts}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: isRosterComplete ? 1.02 : 1 }}
                whileTap={{ scale: isRosterComplete ? 0.98 : 1 }}
                onClick={handleSubmit}
                disabled={!isRosterComplete || isSubmitting}
                className={`w-full mt-8 py-5 rounded-xl font-bold text-lg transition-all ${
                  isRosterComplete && !isSubmitting
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '⏳ Entering Contest...' : isRosterComplete ? `🚀 Enter Contest (${entryFee} $BB)` : '⚠️ Complete Your Roster First'}
              </motion.button>
            </div>

            {/* Right: Available Players */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Available Players</h3>
                <div className="text-sm text-gray-400">
                  Selecting: <span className="text-purple-400 font-semibold">{selectedPosition}</span>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  {['ALL', 'USA', 'ENG'].map(team => (
                    <button
                      key={team}
                      onClick={() => setTeamFilter(team)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        teamFilter === team
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredPlayers.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => addPlayer(player)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white">
                            {player.position}
                          </div>
                          <div>
                            <div className="font-bold text-white">{player.name}</div>
                            <div className="text-sm text-gray-400">{player.team}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400">${player.salary.toLocaleString()}</div>
                          <div className="text-sm text-gray-400">{player.avgPoints} pts/gm</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No players available for {selectedPosition}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scoring Guide */}
          <div className="p-8 border-t border-white/10 bg-black/20">
            <h4 className="text-lg font-bold text-white mb-4">Scoring Guide</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-2">Forwards (FWD)</div>
                <div className="space-y-1 text-gray-300">
                  <div>Goal: +6 pts</div>
                  <div>Assist: +4 pts</div>
                  <div>Shot on Target: +1 pt</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-2">Midfielders (MID)</div>
                <div className="space-y-1 text-gray-300">
                  <div>Goal: +8 pts</div>
                  <div>Assist: +5 pts</div>
                  <div>Key Pass: +2 pts</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-2">Defenders (DEF)</div>
                <div className="space-y-1 text-gray-300">
                  <div>Goal: +10 pts</div>
                  <div>Clean Sheet: +6 pts</div>
                  <div>Tackle Won: +1 pt</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-2">Goalkeepers (GK)</div>
                <div className="space-y-1 text-gray-300">
                  <div>Save: +2 pts</div>
                  <div>Clean Sheet: +10 pts</div>
                  <div>Goal Conceded: -2 pts</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  )
}
