"use client"

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Navigation, Footer } from '../components'
import { supabase } from '@/lib/supabase'

/**
 * LEADERBOARD PAGE
 * 
 * DATA ARCHITECTURE:
 * - Reads from Supabase (historical data only)
 * - Uses leaderboard_weekly view for aggregated stats
 * - Shows Fan Gold + historical winnings
 */

interface LeaderboardEntry {
  rank: number
  wallet_address: string
  username: string
  avatar_url: string
  fan_gold_balance: number
  contests_entered: number
  contests_won: number
  total_winnings: number
  total_wagered: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'alltime'>('week')
  const [category, setCategory] = useState<'all' | 'roster' | 'duel' | 'bingo'>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe, category])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      // Query the leaderboard view (aggregates from historical data)
      // This view is computed from contest_entry_history (settled contests only)
      const { data, error } = await supabase
        .from('leaderboard_weekly')
        .select('*')
        .limit(100)
      
      if (error) {
        console.error('Leaderboard fetch error:', error)
        // Fall back to mock data if table doesn't exist yet
        setLeaderboard(getMockLeaderboard())
        return
      }
      
      if (data && data.length > 0) {
        const entries: LeaderboardEntry[] = data.map((row: any, i: number) => ({
          rank: i + 1,
          wallet_address: row.wallet_address,
          username: row.username || `Player_${row.wallet_address?.slice(-6)}`,
          avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.wallet_address}`,
          fan_gold_balance: row.fan_gold_balance || 0,
          contests_entered: row.contests_entered || 0,
          contests_won: row.contests_won || 0,
          total_winnings: parseFloat(row.total_winnings) || 0,
          total_wagered: parseFloat(row.total_wagered) || 0
        }))
        setLeaderboard(entries)
      } else {
        // No data yet - show mock
        setLeaderboard(getMockLeaderboard())
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard(getMockLeaderboard())
    } finally {
      setLoading(false)
    }
  }
  
  // Mock data for development before settlements occur
  const getMockLeaderboard = (): LeaderboardEntry[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      wallet_address: `0x${(i + 1).toString().padStart(40, '0')}`,
      username: `Player${i + 1}`,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      fan_gold_balance: Math.floor(Math.random() * 10000) + 500,
      contests_entered: Math.floor(Math.random() * 100) + 10,
      contests_won: Math.floor(Math.random() * 50) + 5,
      total_winnings: Math.floor(Math.random() * 10000) + 1000,
      total_wagered: Math.floor(Math.random() * 20000) + 2000
    }))
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-dark-100 via-dark-200 to-dark-300 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="prism-gradient-text">🏆 Leaderboard</span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Top fantasy players and their winnings
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            {/* Timeframe Filter */}
            <div className="flex items-center gap-2 bg-dark-200 rounded-xl p-2">
              <button
                onClick={() => setTimeframe('week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeframe === 'week'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeframe === 'month'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeframe('alltime')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeframe === 'alltime'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-dark-200 rounded-xl p-2">
              <button
                onClick={() => setCategory('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  category === 'all'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Contests
              </button>
              <button
                onClick={() => setCategory('roster')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  category === 'roster'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Roster
              </button>
              <button
                onClick={() => setCategory('duel')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  category === 'duel'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Duel
              </button>
              <button
                onClick={() => setCategory('bingo')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  category === 'bingo'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bingo
              </button>
            </div>
          </motion.div>

          {/* Top 3 Podium */}
          {!loading && leaderboard.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-end justify-center gap-6 mb-12"
            >
              {/* 2nd Place */}
              <PodiumCard
                entry={leaderboard[1]}
                place={2}
                color="from-gray-400 to-gray-500"
                height="h-64"
              />

              {/* 1st Place */}
              <PodiumCard
                entry={leaderboard[0]}
                place={1}
                color="from-yellow-400 to-orange-500"
                height="h-80"
                featured
              />

              {/* 3rd Place */}
              <PodiumCard
                entry={leaderboard[2]}
                place={3}
                color="from-orange-400 to-orange-600"
                height="h-56"
              />
            </motion.div>
          )}

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-200/50 border border-dark-border rounded-2xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 p-4 bg-dark-300 border-b border-dark-border text-sm font-semibold text-gray-400">
              <div>Rank</div>
              <div className="col-span-2">Player</div>
              <div className="text-right">Winnings</div>
              <div className="text-right">Contests Won</div>
              <div className="text-right">Fan Gold</div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.wallet_address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="grid grid-cols-6 gap-4 p-4 hover:bg-dark-300/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      <span className={`text-2xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Player */}
                    <div className="col-span-2 flex items-center gap-3">
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="w-12 h-12 rounded-full border-2 border-prism-teal"
                      />
                      <div>
                        <div className="font-bold text-white">{entry.username}</div>
                        <div className="text-xs text-gray-500">
                          {entry.contests_entered} contests entered
                        </div>
                      </div>
                    </div>

                    {/* Winnings */}
                    <div className="flex items-center justify-end">
                      <div className="text-right">
                        <div className="font-bold text-green-400 text-lg">
                          {entry.total_winnings.toLocaleString()} $BB
                        </div>
                        <div className="text-xs text-gray-500">
                          {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'All time'}
                        </div>
                      </div>
                    </div>

                    {/* Contests Won */}
                    <div className="flex items-center justify-end">
                      <div className="text-right">
                        <div className="font-bold text-purple-400 text-lg">
                          {entry.contests_won}
                        </div>
                        <div className="text-xs text-gray-500">Victories</div>
                      </div>
                    </div>

                    {/* Fan Gold (Social Currency) */}
                    <div className="flex items-center justify-end">
                      <div className="text-right">
                        <div className="font-bold text-yellow-400 text-lg">
                          {entry.fan_gold_balance.toLocaleString()} FG
                        </div>
                        <div className="text-xs text-gray-500">Fan Gold</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="font-bold text-blue-300 mb-2">About the Leaderboard</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Rankings based on <strong>$BB</strong> won in settled contests</li>
                  <li>• <strong>Fan Gold (FG)</strong> is a social currency with no monetary value</li>
                  <li>• Updated when contests settle</li>
                  <li>• Historical data only - active contests tracked on L2</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// Podium Card Component
function PodiumCard({ 
  entry, 
  place, 
  color, 
  height, 
  featured 
}: { 
  entry: LeaderboardEntry
  place: number
  color: string
  height: string
  featured?: boolean
}) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative ${height} w-48 flex flex-col items-center justify-end`}
    >
      {/* Player Card */}
      <div className={`relative z-10 mb-4 ${featured ? 'transform -translate-y-4' : ''}`}>
        <div className="relative">
          <img
            src={entry.avatar_url}
            alt={entry.username}
            className={`w-24 h-24 rounded-full border-4 ${
              place === 1 ? 'border-yellow-400' :
              place === 2 ? 'border-gray-400' :
              'border-orange-400'
            } shadow-xl`}
          />
          <div className="absolute -top-2 -right-2 text-4xl">
            {medals[place as keyof typeof medals]}
          </div>
        </div>
        <div className="text-center mt-2">
          <div className="font-bold text-white text-lg">{entry.username}</div>
          <div className="font-bold text-green-400 text-xl">
            {entry.total_winnings.toLocaleString()} $BB
          </div>
        </div>
      </div>

      {/* Podium Base */}
      <div className={`w-full bg-gradient-to-t ${color} rounded-t-xl flex items-center justify-center`}>
        <span className="text-6xl font-bold text-white/20">
          {place}
        </span>
      </div>
    </motion.div>
  )
}
