'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
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
  status: 'upcoming' | 'live' | 'locked' | 'settling' | 'settled' | 'cancelled'
  payout_structure: { place: number; percentage: number }[]
  oracle_source: string
  game_data: any
  created_at: string
  // Legal Compliance Fields
  lock_timestamp?: number        // Unix epoch
  settle_timestamp?: number      // Unix epoch  
  lock_type?: 'scheduled' | 'event_start' | 'upload_window'
  buffer_minutes?: number
  cooldown_minutes?: number
  scoring_rules?: Record<string, number>
  tiebreaker_rules?: { method: string; metric?: string }
  oracle_snapshot?: any
  oracle_fetched_at?: string
  oracle_signature?: string
}

interface DuelEntity {
  name: string
  avatar_url?: string
  stats?: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[]
}

interface Creator {
  id: string
  name: string
  avatar_url?: string
  salary: number
  avg_score: number
  category: string
  stats?: { subscribers?: string; avg_views?: string; engagement?: string }
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

// Hybrid Fetch: Supabase for metadata + mock L2 for live data
interface L2LiveData {
  current_scores?: Record<string, number>
  live_pool?: number
  time_remaining?: number
  winner?: string
}

export default function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [contest, setContest] = useState<ContestMetadata | null>(null)
  const [liveData, setLiveData] = useState<L2LiveData>({})
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [userBalance, setUserBalance] = useState<{ fan_gold: number; bb: number }>({ fan_gold: 1000, bb: 0 })
  const [showOracleProof, setShowOracleProof] = useState(false)
  
  // Game-specific state
  const [selectedPick, setSelectedPick] = useState<string | null>(null) // Duels
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]) // Roster
  const [selectedSquares, setSelectedSquares] = useState<string[]>([]) // Bingo
  
  // Mock game data (in production, comes from L2)
  const [duelEntities, setDuelEntities] = useState<DuelEntity[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [bingoSquares, setBingoSquares] = useState<BingoSquare[]>([])

  // Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchContestDetails()
  }, [resolvedParams.id])

  // Poll for live data when contest is active
  useEffect(() => {
    if (contest?.status === 'live') {
      const interval = setInterval(fetchLiveData, 10000)
      return () => clearInterval(interval)
    }
  }, [contest?.status])

  async function fetchContestDetails() {
    try {
      // HYBRID FETCH: Supabase for metadata (prism table)
      const { data: contestData, error } = await supabase
        .from('prism')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setContest(contestData)

      // Mock game-specific data based on contest type
      // In production, this comes from L2 or contest-specific tables
      if (contestData.game_type === 'duel') {
        loadDuelData(contestData)
      } else if (contestData.game_type === 'roster') {
        loadRosterData(contestData)
      } else if (contestData.game_type === 'bingo') {
        loadBingoData(contestData)
      }

      // Fetch user balance if logged in
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('fan_gold_balance')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserBalance(prev => ({ ...prev, fan_gold: profile.fan_gold_balance || 1000 }))
        }
      }

      // Mock leaderboard (in production, from L2)
      fetchLeaderboard()
      
    } catch (error) {
      console.error('Failed to fetch contest:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadDuelData(contest: ContestMetadata) {
    // Load duel entities from game_data (stored in Supabase prism table)
    const gameData = contest.game_data || {}
    if (gameData.entities && Array.isArray(gameData.entities)) {
      setDuelEntities(gameData.entities)
    } else {
      // Fallback for older data format
      setDuelEntities([])
    }
  }

  function loadRosterData(contest: ContestMetadata) {
    // Load roster players/contestants from game_data (stored in Supabase prism table)
    const gameData = contest.game_data || {}
    const players = gameData.players || gameData.contestants || []
    const mappedCreators: Creator[] = players.map((p: any) => ({
      id: p.id,
      name: p.name,
      salary: p.salary,
      avg_score: p.avg_score || p.avgScore || 50,
      category: p.position || p.category || 'general',
      position: p.position,
      team: p.team,
      stats: p.stats
    }))
    setCreators(mappedCreators)
  }

  function loadBingoData(contest: ContestMetadata) {
    // Load bingo squares from game_data (stored in Supabase prism table)
    const gameData = contest.game_data || {}
    if (gameData.squares && Array.isArray(gameData.squares)) {
      setBingoSquares(gameData.squares)
    } else {
      // Fallback for older data format
      setBingoSquares([])
    }
  }

  async function fetchLeaderboard() {
    // Mock leaderboard - in production, from L2
    const mockLeaderboard: LeaderboardEntry[] = [
      { rank: 1, user_id: '1', username: 'ProGamer23', picks: { pick: 'MrBeast' }, score: 0 },
      { rank: 2, user_id: '2', username: 'YTExpert', picks: { pick: 'IShowSpeed' }, score: 0 },
      { rank: 3, user_id: '3', username: 'CryptoKing', picks: { pick: 'MrBeast' }, score: 0 },
    ]
    setLeaderboard(mockLeaderboard)
  }

  async function fetchLiveData() {
    // HYBRID FETCH: L2 for live scores
    // In production: const res = await fetch(`${L2_API}/contest/${contest.id}/live`)
    try {
      // Mock live data
      setLiveData({
        current_scores: {
          'MrBeast': Math.floor(Math.random() * 1000000),
          'IShowSpeed': Math.floor(Math.random() * 800000)
        },
        live_pool: (contest?.prize_pool || 500) + Math.floor(Math.random() * 100),
        time_remaining: 3600
      })
    } catch (error) {
      console.error('Failed to fetch live data:', error)
    }
  }

  async function handleEnterContest() {
    if (!user) {
      router.push('/login')
      return
    }

    // Validate picks based on game type
    if (contest?.game_type === 'duel' && !selectedPick) {
      alert('Please select your pick first!')
      return
    }
    if (contest?.game_type === 'roster' && selectedCreators.length < 3) {
      alert('Please complete your roster first!')
      return
    }
    if (contest?.game_type === 'bingo' && selectedSquares.length < 5) {
      alert('Please select at least 5 squares!')
      return
    }

    // Check balance
    if (contest && contest.entry_fee > userBalance.fan_gold) {
      alert('Insufficient Fan Gold balance!')
      return
    }

    setEntering(true)

    try {
      // Build picks object based on game type
      let picks: any = {}
      if (contest?.game_type === 'duel') {
        picks = { selection: selectedPick }
      } else if (contest?.game_type === 'roster') {
        picks = { players: selectedCreators.map(c => c.id) }
      } else if (contest?.game_type === 'bingo') {
        picks = { selections: selectedSquares }
      }

      // LEGAL COMPLIANCE: Use server-side API with lock enforcement
      const response = await fetch('/api/prism/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contest_id: contest!.id,
          user_id: user.id,
          picks: picks,
          entry_fee: contest!.entry_fee
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (result.error === 'ENTRY_LOCKED') {
          alert(`⚠️ Contest Locked!\n\nEntries closed at ${result.details?.effective_lock_date || 'lock time'}.\n\nYou were ${result.details?.seconds_late || 0} seconds late.`)
          return
        }
        if (result.error === 'DUPLICATE_ENTRY') {
          alert('You have already entered this contest!')
          return
        }
        throw new Error(result.message || 'Failed to enter contest')
      }

      // Deduct Fan Gold
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ fan_gold_balance: userBalance.fan_gold - (contest?.entry_fee || 0) })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      alert(`✅ Successfully entered contest!\n\nTime until lock: ${result.timing?.time_until_lock_human || 'N/A'}`)
      router.push('/my-contests')
    } catch (error: any) {
      console.error('Failed to enter contest:', error)
      alert(error.message || 'Failed to enter contest. Please try again.')
    } finally {
      setEntering(false)
    }
  }

  // Roster handlers
  function handleSelectCreator(creator: Creator) {
    if (selectedCreators.length < 3) {
      setSelectedCreators([...selectedCreators, creator])
    }
  }

  function handleRemoveCreator(creatorId: string) {
    setSelectedCreators(selectedCreators.filter(c => c.id !== creatorId))
  }

  // Bingo handlers
  function handleToggleSquare(squareId: string) {
    if (selectedSquares.includes(squareId)) {
      setSelectedSquares(selectedSquares.filter(id => id !== squareId))
    } else if (selectedSquares.length < 5) {
      setSelectedSquares([...selectedSquares, squareId])
    }
  }

  function getTimeRemaining(locksAt: string) {
    const now = new Date()
    const lockTime = new Date(locksAt)
    const diff = lockTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Locked'
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  function canEnterContest(): boolean {
    if (!contest || contest.status !== 'upcoming') return false
    if (contest.game_type === 'duel' && !selectedPick) return false
    if (contest.game_type === 'roster' && selectedCreators.length < 3) return false
    if (contest.game_type === 'bingo' && selectedSquares.length < 5) return false
    return true
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-prism-cyan mx-auto" />
          <p className="mt-4 text-gray-400">Loading contest...</p>
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
          <Button onClick={() => router.push('/lobby')}>
            Back to Lobby
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/lobby')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lobby
        </Button>

        {/* Contest Header */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge 
                    variant={contest.status === 'live' ? 'destructive' : contest.status === 'settled' ? 'secondary' : 'default'}
                    className={contest.status === 'live' ? 'animate-pulse' : ''}
                  >
                    {contest.status === 'live' ? '🔴 LIVE' : contest.status === 'settled' ? '✅ ENDED' : '⏰ UPCOMING'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {contest.game_type}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
                <p className="text-gray-400">{contest.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ⚡ {liveData.live_pool || contest.prize_pool} FG
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Entry Fee</p>
                <p className="text-xl font-semibold text-yellow-400">
                  ⚡ {contest.entry_fee} FG
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Entries
                </p>
                <p className="text-xl font-semibold">
                  {contest.current_entries}/{contest.max_entries}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {contest.status === 'upcoming' ? 'Locks in' : contest.status === 'live' ? 'Ends in' : 'Ended'}
                </p>
                <p className="text-xl font-semibold text-prism-cyan">
                  {contest.status !== 'settled' ? getTimeRemaining(contest.locks_at) : 'Complete'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Interface (Left/Main Column) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dynamic Game Component */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>
                  {contest.game_type === 'duel' && 'Pick Your Side'}
                  {contest.game_type === 'roster' && 'Build Your Squad'}
                  {contest.game_type === 'bingo' && 'Make Your Predictions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* DUEL GAME */}
                {contest.game_type === 'duel' && (
                  <DuelSelector
                    entities={duelEntities}
                    selectedPick={selectedPick}
                    onSelect={setSelectedPick}
                    disabled={contest.status !== 'upcoming'}
                    currentScores={liveData.current_scores}
                    status={contest.status}
                    winner={liveData.winner}
                  />
                )}

                {/* ROSTER GAME */}
                {contest.game_type === 'roster' && (
                  <RosterDraft
                    creators={creators}
                    maxSlots={3}
                    salaryCap={15000}
                    selectedCreators={selectedCreators}
                    onSelect={handleSelectCreator}
                    onRemove={handleRemoveCreator}
                    disabled={contest.status !== 'upcoming'}
                    status={contest.status}
                  />
                )}

                {/* BINGO GAME */}
                {contest.game_type === 'bingo' && (
                  <BingoCard
                    squares={bingoSquares}
                    selectedSquares={selectedSquares}
                    onToggle={handleToggleSquare}
                    maxSelections={5}
                    disabled={contest.status !== 'upcoming'}
                    status={contest.status}
                    winningLines={[
                      ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], // rows
                      ['1', '4', '7'], ['2', '5', '8'], ['3', '6', '9'], // cols
                      ['1', '5', '9'], ['3', '5', '7'] // diagonals
                    ]}
                  />
                )}

                {/* Enter Contest Button */}
                {contest.status === 'upcoming' && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Your Balance</p>
                        <p className="text-lg font-bold text-yellow-400">⚡ {userBalance.fan_gold} FG</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Entry Cost</p>
                        <p className="text-lg font-bold">⚡ {contest.entry_fee} FG</p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-prism-cyan to-prism-magenta hover:opacity-90"
                      size="lg"
                      disabled={!canEnterContest() || entering}
                      onClick={handleEnterContest}
                    >
                      {entering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Entering...
                        </>
                      ) : (
                        `Enter Contest (${contest.entry_fee} FG)`
                      )}
                    </Button>
                    {!user && (
                      <p className="text-center text-sm text-gray-400 mt-2">
                        <Button variant="link" onClick={() => router.push('/login')} className="p-0 h-auto">
                          Sign in
                        </Button>{' '}
                        to enter this contest
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payout Structure */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Payout Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contest.payout_structure?.map((payout: any) => (
                    <div key={payout.place} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                      <span className="font-semibold">
                        {payout.place === 1 ? '🥇' : payout.place === 2 ? '🥈' : payout.place === 3 ? '🥉' : '🏅'} Place {payout.place}
                      </span>
                      <span className="text-yellow-400 font-bold">
                        {payout.percentage}% ({Math.floor(contest.prize_pool * payout.percentage / 100)} FG)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* LEGAL COMPLIANCE: The "Contract" - Full Transparency */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Contest Rules & Terms
                </CardTitle>
                <p className="text-xs text-gray-500">All terms are final and visible before entry</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Entry & Prize Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <span className="text-xs text-gray-500">Entry Fee</span>
                    <p className="text-lg font-bold text-yellow-400">⚡ {contest.entry_fee} FG</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Prize Pool</span>
                    <p className="text-lg font-bold text-green-400">⚡ {contest.prize_pool} FG</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Lock Type</span>
                    <p className="font-semibold capitalize">{contest.lock_type || 'scheduled'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Buffer</span>
                    <p className="font-semibold">{contest.buffer_minutes || 5} min</p>
                  </div>
                </div>

                {/* Timing Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      🔒 Entries Lock At
                    </span>
                    <p className="font-semibold text-yellow-400">
                      {contest.lock_timestamp 
                        ? new Date(contest.lock_timestamp * 1000).toLocaleString()
                        : new Date(contest.locks_at).toLocaleString()}
                    </p>
                    {contest.buffer_minutes && contest.buffer_minutes > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Effective: {contest.lock_timestamp 
                          ? new Date((contest.lock_timestamp - contest.buffer_minutes * 60) * 1000).toLocaleString()
                          : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      ⏱️ Results Final After
                    </span>
                    <p className="font-semibold">
                      {contest.settle_timestamp 
                        ? new Date((contest.settle_timestamp + (contest.cooldown_minutes || 30) * 60) * 1000).toLocaleString()
                        : contest.settles_at 
                          ? new Date(contest.settles_at).toLocaleString()
                          : 'TBD'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cooldown: {contest.cooldown_minutes || 30} min
                    </p>
                  </div>
                </div>

                {/* Scoring Rules */}
                {contest.scoring_rules && Object.keys(contest.scoring_rules).length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      📊 Scoring Rules
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                      {Object.entries(contest.scoring_rules).map(([key, value]) => (
                        <div key={key} className="bg-gray-800 p-2 rounded">
                          <span className="text-gray-400">{key}:</span>{' '}
                          <span className="text-prism-cyan">{String(value)} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Oracle / Data Source */}
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    🔮 Oracle / Data Source
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {contest.oracle_source || 'Official data provider - specific source to be announced'}
                  </p>
                  {contest.status === 'settled' && contest.oracle_snapshot && (
                    <button 
                      onClick={() => setShowOracleProof(true)}
                      className="mt-2 text-prism-cyan hover:underline text-sm flex items-center gap-1"
                    >
                      View Oracle Proof →
                    </button>
                  )}
                </div>

                {/* Tiebreaker */}
                <div className="p-4 bg-gray-900/50 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    ⚖️ Tiebreaker Rules
                  </h4>
                  <p className="text-gray-400">
                    {contest.tiebreaker_rules?.method === 'split_equal' 
                      ? 'In case of tie, prizes are split equally among tied players.'
                      : contest.tiebreaker_rules?.method === 'secondary_metric'
                        ? `Ties broken by: ${contest.tiebreaker_rules.metric || 'secondary metric'}`
                        : 'Prizes split equally in case of tie.'}
                  </p>
                </div>

                {/* Rules */}
                {contest.rules && (
                  <div className="p-4 bg-gray-900/50 rounded-lg text-sm">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      📜 Contest Rules
                    </h4>
                    <p className="text-gray-400">{contest.rules}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Oracle Proof Modal */}
            {showOracleProof && contest.oracle_snapshot && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>🔮 Oracle Proof</span>
                      <button 
                        onClick={() => setShowOracleProof(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      Raw data snapshot used for settlement verification
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fetched At:</p>
                      <p className="font-mono text-sm">{contest.oracle_fetched_at}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Signature:</p>
                      <p className="font-mono text-sm text-prism-cyan break-all">
                        {contest.oracle_signature || 'Not signed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Raw Data:</p>
                      <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs font-mono max-h-64">
                        {JSON.stringify(contest.oracle_snapshot, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: Leaderboard */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leaderboard</span>
                  <Badge variant="outline">{leaderboard.length} entries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">
                      No entries yet. Be the first!
                    </p>
                  ) : (
                    leaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => entry.username && router.push(`/identity/${entry.username}`)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-500 w-6">
                            #{entry.rank}
                          </span>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.avatar_url} />
                            <AvatarFallback>
                              {entry.username?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {entry.username || 'Anonymous'}
                            </p>
                            {entry.picks?.pick && (
                              <p className="text-xs text-gray-400">{entry.picks.pick}</p>
                            )}
                          </div>
                        </div>
                        {contest.status !== 'upcoming' && (
                          <span className="text-sm font-bold text-green-400">
                            {entry.score.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Balance Card */}
            {user && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Your Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">
                      ⚡ {userBalance.fan_gold} FG
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Fan Gold (Free to Play)</p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => router.push('/wallet')}
                    >
                      Get More Fan Gold
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
