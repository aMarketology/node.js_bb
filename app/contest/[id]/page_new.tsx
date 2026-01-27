'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'

// Game Mode Components
import DuelSelector from '@/app/components/DuelSelector'
import RosterDraft from '@/app/components/RosterDraft'
import BingoCard from '@/app/components/BingoCard'
import FloatingBetSlip from '@/app/components/FloatingBetSlip'

// Types
interface ContestMetadata {
  id: string
  game_type: 'duel' | 'roster' | 'bingo'
  title: string
  description: string
  rules: string
  entry_fee: number
  prize_pool: number
  max_entries: number
  current_entries: number
  locks_at: string
  settles_at: string
  status: 'upcoming' | 'live' | 'settled'
  payout_structure: { place: number; percentage: number }[]
  oracle_source: string
  game_data: any
  category: string
  tags: string[]
  created_at: string
}

interface DuelEntity {
  name: string
  avatar_url?: string
  team?: string
  stats?: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[]
}

interface Creator {
  id: string
  name: string
  avatar_url?: string
  salary: number
  avg_score: number
  category: string
  position?: string
  team?: string
  stats?: { subscribers?: string; avg_views?: string; engagement?: string; survival_rate?: string }
}

interface BingoSquare {
  id: string
  text: string
  completed?: boolean
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  username?: string
  avatar_url?: string
  picks: any
  score: number
  payout?: number
}

export default function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [contest, setContest] = useState<ContestMetadata | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [userBalance, setUserBalance] = useState(100) // Default $BB balance
  
  // Game-specific state
  const [selectedPick, setSelectedPick] = useState<string | null>(null)
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([])
  const [selectedSquares, setSelectedSquares] = useState<string[]>([])
  
  // Parsed game data
  const [duelEntities, setDuelEntities] = useState<DuelEntity[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [bingoSquares, setBingoSquares] = useState<BingoSquare[]>([])
  const [liveScores, setLiveScores] = useState<Record<string, number>>({})

  // Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchContestDetails()
  }, [resolvedParams.id])

  // Poll for live scores
  useEffect(() => {
    if (contest?.status === 'live') {
      const interval = setInterval(fetchLiveScores, 10000)
      return () => clearInterval(interval)
    }
  }, [contest?.status])

  async function fetchContestDetails() {
    try {
      const { data: contestData, error } = await supabase
        .from('contests_metadata')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setContest(contestData)
      parseGameData(contestData)
      fetchLeaderboard(contestData.id)
      
    } catch (error) {
      console.error('Failed to fetch contest:', error)
    } finally {
      setLoading(false)
    }
  }

  function parseGameData(contestData: ContestMetadata) {
    const gameData = contestData.game_data || {}

    if (contestData.game_type === 'duel') {
      // Parse duel entities from game_data
      if (gameData.entities) {
        setDuelEntities(gameData.entities)
      }
      if (gameData.current_scores) {
        setLiveScores(gameData.current_scores)
      }
    } 
    else if (contestData.game_type === 'roster') {
      // Parse roster players/contestants from game_data
      const players = gameData.players || gameData.contestants || []
      setCreators(players.map((p: any) => ({
        id: p.id,
        name: p.name,
        salary: p.salary,
        avg_score: p.avg_score || p.avgScore || 50,
        category: p.position || p.category || 'general',
        position: p.position,
        team: p.team,
        stats: p.stats
      })))
    }
    else if (contestData.game_type === 'bingo') {
      // Parse bingo squares from game_data
      if (gameData.squares) {
        setBingoSquares(gameData.squares)
      }
    }
  }

  async function fetchLiveScores() {
    // In production, this would fetch from L2 or live API
    if (contest?.game_data?.current_scores) {
      setLiveScores(contest.game_data.current_scores)
    }
  }

  async function fetchLeaderboard(contestId: string) {
    try {
      const { data: entries } = await supabase
        .from('contest_entries')
        .select('*')
        .eq('contest_id', contestId)
        .order('score', { ascending: false })
        .limit(10)

      if (entries) {
        setLeaderboard(entries.map((e, i) => ({
          rank: i + 1,
          user_id: e.user_id,
          username: `Player ${i + 1}`,
          picks: e.picks,
          score: e.score || 0
        })))
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  async function handleEnterContest() {
    if (!user) {
      router.push('/login')
      return
    }

    setEntering(true)

    try {
      // Build picks object
      let picks: any = {}
      if (contest?.game_type === 'duel') {
        picks = { pick: selectedPick }
      } else if (contest?.game_type === 'roster') {
        picks = { creators: selectedCreators.map(c => c.id) }
      } else if (contest?.game_type === 'bingo') {
        picks = { squares: selectedSquares }
      }

      // Insert contest entry
      const { error: entryError } = await supabase
        .from('contest_entries')
        .insert({
          contest_id: contest!.id,
          user_id: (user as any).id || 'anonymous',
          picks: picks,
          entry_fee: contest!.entry_fee
        })

      if (entryError) throw entryError

      alert(`🎉 Successfully entered ${contest?.title}!`)
      router.push('/my-contests')
    } catch (error) {
      console.error('Failed to enter contest:', error)
      alert('Failed to enter contest. Please try again.')
    } finally {
      setEntering(false)
    }
  }

  // Check if entry is ready to submit
  function isEntryReady(): boolean {
    if (!contest) return false
    if (contest.game_type === 'duel') return !!selectedPick
    if (contest.game_type === 'roster') {
      const requiredSlots = contest.game_data?.roster_slots || 3
      return selectedCreators.length >= requiredSlots
    }
    if (contest.game_type === 'bingo') {
      const maxSelections = contest.game_data?.max_selections || 5
      return selectedSquares.length >= maxSelections
    }
    return false
  }

  // Get current picks for bet slip
  function getCurrentPicks(): any {
    if (contest?.game_type === 'duel') return { pick: selectedPick }
    if (contest?.game_type === 'roster') return { creators: selectedCreators.map(c => c.id) }
    if (contest?.game_type === 'bingo') return { squares: selectedSquares }
    return {}
  }

  function getTimeRemaining(locksAt: string) {
    const now = new Date()
    const lockTime = new Date(locksAt)
    const diff = lockTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Locked'
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h ${minutes}m`
  }

  function getCategoryEmoji(category: string) {
    const emojis: Record<string, string> = {
      sports: '⚽',
      youtube: '📹',
      gaming: '🎮',
      crypto: '₿',
      entertainment: '🎬'
    }
    return emojis[category] || '🎯'
  }

  function getGameTypeIcon(type: string) {
    const icons: Record<string, string> = {
      duel: '⚔️',
      roster: '👥',
      bingo: '🎯'
    }
    return icons[type] || '🎮'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading contest...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (!contest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Contest not found</p>
          <button 
            onClick={() => router.push('/lobby')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/lobby')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back to Lobby</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              contest.status === 'live' 
                ? 'bg-red-600 animate-pulse' 
                : contest.status === 'settled'
                ? 'bg-gray-600'
                : 'bg-green-600'
            }`}>
              {contest.status === 'live' ? '🔴 LIVE' : contest.status === 'settled' ? '✅ ENDED' : '⏰ UPCOMING'}
            </span>
            <span className="text-sm text-gray-400">
              {getTimeRemaining(contest.locks_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Contest Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{getCategoryEmoji(contest.category)}</span>
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm uppercase tracking-wider">
              {contest.category}
            </span>
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-1">
              {getGameTypeIcon(contest.game_type)} {contest.game_type}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{contest.title}</h1>
          <p className="text-gray-400 text-lg max-w-2xl">{contest.description}</p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            <div>
              <span className="text-gray-500">Entry Fee</span>
              <p className="text-xl font-bold">{contest.entry_fee} $BB</p>
            </div>
            <div>
              <span className="text-gray-500">Prize Pool</span>
              <p className="text-xl font-bold text-green-400">{contest.prize_pool} $BB</p>
            </div>
            <div>
              <span className="text-gray-500">Players</span>
              <p className="text-xl font-bold">{contest.current_entries}/{contest.max_entries}</p>
            </div>
            <div>
              <span className="text-gray-500">Locks In</span>
              <p className="text-xl font-bold text-cyan-400">{getTimeRemaining(contest.locks_at)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Interface (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Component */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {getGameTypeIcon(contest.game_type)}
                {contest.game_type === 'duel' && 'Pick Your Side'}
                {contest.game_type === 'roster' && 'Build Your Squad'}
                {contest.game_type === 'bingo' && 'Make Your Predictions'}
              </h2>

              {/* DUEL GAME */}
              {contest.game_type === 'duel' && duelEntities.length >= 2 && (
                <DuelSelector
                  entities={duelEntities}
                  selectedPick={selectedPick}
                  onSelect={setSelectedPick}
                  disabled={contest.status !== 'upcoming'}
                  currentScores={liveScores}
                  status={contest.status}
                />
              )}

              {/* ROSTER GAME */}
              {contest.game_type === 'roster' && creators.length > 0 && (
                <RosterDraft
                  creators={creators}
                  maxSlots={contest.game_data?.roster_slots || 5}
                  salaryCap={contest.game_data?.salary_cap || 50000}
                  selectedCreators={selectedCreators}
                  onSelect={(c) => setSelectedCreators([...selectedCreators, c])}
                  onRemove={(id) => setSelectedCreators(selectedCreators.filter(c => c.id !== id))}
                  disabled={contest.status !== 'upcoming'}
                  status={contest.status}
                />
              )}

              {/* BINGO GAME */}
              {contest.game_type === 'bingo' && bingoSquares.length > 0 && (
                <BingoCard
                  squares={bingoSquares}
                  selectedSquares={selectedSquares}
                  onToggle={(id) => {
                    if (selectedSquares.includes(id)) {
                      setSelectedSquares(selectedSquares.filter(s => s !== id))
                    } else if (selectedSquares.length < (contest.game_data?.max_selections || 5)) {
                      setSelectedSquares([...selectedSquares, id])
                    }
                  }}
                  maxSelections={contest.game_data?.max_selections || 5}
                  disabled={contest.status !== 'upcoming'}
                  status={contest.status}
                  winningLines={contest.game_data?.winning_lines || []}
                />
              )}
            </div>

            {/* Rules & Payout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payout Structure */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  🏆 Payout Structure
                </h3>
                <div className="space-y-2">
                  {contest.payout_structure?.map((p) => (
                    <div key={p.place} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                      <span className="flex items-center gap-2">
                        {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '🏅'}
                        Place {p.place}
                      </span>
                      <span className="font-bold text-green-400">
                        {Math.floor(contest.prize_pool * p.percentage / 100)} $BB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  📋 Rules & Oracle
                </h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>{contest.rules || 'Standard contest rules apply.'}</p>
                  <div className="pt-3 border-t border-gray-700">
                    <span className="text-gray-500">Data Source:</span>
                    <p className="font-semibold text-white">{contest.oracle_source || 'Official API'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Bet Slip + Leaderboard */}
          <div className="hidden lg:block space-y-6">
            {/* Floating Bet Slip (Desktop only) */}
            {contest.status !== 'settled' && (
              <FloatingBetSlip
                contest={contest}
                picks={getCurrentPicks()}
                isReady={isEntryReady()}
                userBalance={userBalance}
                onSubmit={handleEnterContest}
                isSubmitting={entering}
              />
            )}

            {/* Leaderboard */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                <span>📊 Leaderboard</span>
                <span className="text-sm font-normal text-gray-500">{leaderboard.length} entries</span>
              </h3>
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    No entries yet. Be the first!
                  </p>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 font-bold text-gray-500">#{entry.rank}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          {entry.username?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{entry.username || 'Anonymous'}</p>
                          {entry.picks?.pick && (
                            <p className="text-xs text-gray-500">{entry.picks.pick}</p>
                          )}
                        </div>
                      </div>
                      {contest.status !== 'upcoming' && (
                        <span className="font-bold text-cyan-400">{entry.score}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bet Slip */}
      <div className="lg:hidden">
        {contest.status !== 'settled' && (
          <FloatingBetSlip
            contest={contest}
            picks={getCurrentPicks()}
            isReady={isEntryReady()}
            userBalance={userBalance}
            onSubmit={handleEnterContest}
            isSubmitting={entering}
          />
        )}
      </div>

      {/* Bottom Padding for Mobile */}
      <div className="h-24 lg:hidden" />
    </div>
  )
}
