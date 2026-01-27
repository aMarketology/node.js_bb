'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'

interface UserContest {
  contest_id: string
  contest_title: string
  type: 'duel' | 'roster' | 'bingo'
  entry_fee: number
  currency: 'fan_gold' | 'bb'
  pick?: string
  status: 'active' | 'live' | 'won' | 'lost' | 'pending'
  current_rank?: number
  total_entries?: number
  current_score?: number
  payout?: number
  ended_at?: string
  locks_at?: string
}

export default function MyContestsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contests, setContests] = useState<UserContest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    if (!user) {
      router.push('/get-started')
      return
    }
    fetchMyContests()

    // Poll for live updates every 10 seconds
    const interval = setInterval(() => {
      if (activeTab === 'active') {
        fetchMyContests()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [user, activeTab])

  async function fetchMyContests() {
    if (!user?.blackbook_address) return

    try {
      // TODO: Replace with actual L2 API call
      // const l2Address = user.blackbook_address.replace('L1_', 'L2_')
      // const res = await fetch(`${process.env.NEXT_PUBLIC_L2_API_URL}/user/${l2Address}/contests`)
      // const data = await res.json()

      // Mock data
      const mockContests: UserContest[] = [
        {
          contest_id: 'duel-mrbeast-speed-001',
          contest_title: 'MrBeast vs IShowSpeed: 24hr View Battle',
          type: 'duel',
          entry_fee: 10,
          currency: 'bb',
          pick: 'MrBeast',
          status: 'live',
          current_rank: 12,
          total_entries: 87,
          current_score: 145000,
          locks_at: new Date(Date.now() + 3600000 * 2).toISOString()
        },
        {
          contest_id: 'roster-epl-week1',
          contest_title: 'EPL Fantasy - Gameweek 22',
          type: 'roster',
          entry_fee: 20,
          currency: 'bb',
          status: 'active',
          total_entries: 143,
          locks_at: new Date(Date.now() + 3600000 * 6).toISOString()
        },
        {
          contest_id: 'duel-kai-xqc-999',
          contest_title: 'Kai Cenat vs xQc: Subscriber Battle',
          type: 'duel',
          entry_fee: 100,
          currency: 'fan_gold',
          pick: 'Kai Cenat',
          status: 'won',
          current_rank: 1,
          total_entries: 243,
          payout: 2430,
          ended_at: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          contest_id: 'bingo-beast-001',
          contest_title: 'Beast Games: Squid Bingo',
          type: 'bingo',
          entry_fee: 5,
          currency: 'bb',
          status: 'lost',
          current_rank: 34,
          total_entries: 50,
          payout: 0,
          ended_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ]

      setContests(mockContests)
    } catch (error) {
      console.error('Failed to fetch contests:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTimeRemaining(date: string) {
    const now = new Date()
    const target = new Date(date)
    const diff = target.getTime() - now.getTime()

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const activeContests = contests.filter(c => c.status === 'active' || c.status === 'live')
  const historyContests = contests.filter(c => c.status === 'won' || c.status === 'lost' || c.status === 'pending')

  // Calculate stats
  const totalWagered = historyContests.reduce((sum, c) => sum + c.entry_fee, 0)
  const totalWon = historyContests.filter(c => c.status === 'won').reduce((sum, c) => sum + (c.payout || 0), 0)
  const totalContests = historyContests.length
  const contestsWon = historyContests.filter(c => c.status === 'won').length

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-prism-cyan to-prism-magenta bg-clip-text text-transparent">
            My Contests
          </h1>
          <p className="text-gray-400">
            The Dashboard - Track your active contests and view your history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <p className="text-sm text-gray-400">Total Contests</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalContests}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <p className="text-sm text-gray-400">Contests Won</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{contestsWon}</p>
              <p className="text-xs text-gray-500">
                {totalContests > 0 ? ((contestsWon / totalContests) * 100).toFixed(0) : 0}% win rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <p className="text-sm text-gray-400">Total Wagered</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalWagered} $BB</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <p className="text-sm text-gray-400">Total Won</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{totalWon} $BB</p>
              <p className={`text-xs flex items-center gap-1 ${totalWon >= totalWagered ? 'text-green-400' : 'text-red-400'}`}>
                {totalWon >= totalWagered ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    +{((totalWon - totalWagered) / totalWagered * 100).toFixed(0)}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    {((totalWon - totalWagered) / totalWagered * 100).toFixed(0)}%
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="active">
              Active Contests ({activeContests.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({historyContests.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Contests */}
          <TabsContent value="active">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prism-cyan"></div>
                <p className="mt-4 text-gray-400">Loading contests...</p>
              </div>
            ) : activeContests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-4">You haven't entered any contests yet</p>
                <Button onClick={() => router.push('/lobby')}>
                  Browse Contests
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeContests.map((contest) => (
                  <Card
                    key={contest.contest_id}
                    className="bg-gray-800 border-gray-700 hover:border-prism-cyan transition-all cursor-pointer"
                    onClick={() => router.push(`/contest/${contest.contest_id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={contest.status === 'live' ? 'default' : 'secondary'}>
                              {contest.status === 'live' ? '🔴 LIVE' : '⏰ UPCOMING'}
                            </Badge>
                            <Badge variant="outline">{contest.type.toUpperCase()}</Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{contest.contest_title}</h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {contest.pick && (
                              <div>
                                <p className="text-xs text-gray-400">Your Pick</p>
                                <p className="font-semibold">{contest.pick}</p>
                              </div>
                            )}
                            {contest.current_rank && (
                              <div>
                                <p className="text-xs text-gray-400">Current Rank</p>
                                <p className="font-semibold text-prism-cyan">
                                  #{contest.current_rank} / {contest.total_entries}
                                </p>
                              </div>
                            )}
                            {contest.current_score && (
                              <div>
                                <p className="text-xs text-gray-400">Score</p>
                                <p className="font-semibold text-green-400">
                                  {contest.current_score.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {contest.locks_at && (
                              <div>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {contest.status === 'live' ? 'Ends in' : 'Locks in'}
                                </p>
                                <p className="font-semibold">{getTimeRemaining(contest.locks_at)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prism-cyan"></div>
                <p className="mt-4 text-gray-400">Loading history...</p>
              </div>
            ) : historyContests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No contest history yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyContests.map((contest) => (
                  <Card
                    key={contest.contest_id}
                    className="bg-gray-800 border-gray-700 hover:border-prism-cyan transition-all cursor-pointer"
                    onClick={() => router.push(`/contest/${contest.contest_id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant={contest.status === 'won' ? 'default' : 'secondary'}
                              className={contest.status === 'won' ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {contest.status === 'won' ? '✅ WON' : contest.status === 'lost' ? '❌ LOST' : '⏳ PENDING'}
                            </Badge>
                            <Badge variant="outline">{contest.type.toUpperCase()}</Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{contest.contest_title}</h3>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                            {contest.pick && (
                              <div>
                                <p className="text-xs text-gray-400">Your Pick</p>
                                <p className="font-semibold">{contest.pick}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-400">Final Rank</p>
                              <p className="font-semibold">
                                #{contest.current_rank} / {contest.total_entries}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Entry Fee</p>
                              <p className="font-semibold">
                                {contest.currency === 'fan_gold' ? '⚡' : ''} {contest.entry_fee} {contest.currency === 'fan_gold' ? 'FG' : '$BB'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Payout</p>
                              <p className={`font-semibold ${contest.payout && contest.payout > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                {contest.currency === 'fan_gold' ? '⚡' : ''} {contest.payout || 0} {contest.currency === 'fan_gold' ? 'FG' : '$BB'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Profit/Loss</p>
                              <p className={`font-semibold ${(contest.payout || 0) - contest.entry_fee >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(contest.payout || 0) - contest.entry_fee >= 0 ? '+' : ''}
                                {(contest.payout || 0) - contest.entry_fee} {contest.currency === 'fan_gold' ? 'FG' : '$BB'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
