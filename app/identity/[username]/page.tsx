'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, TrendingUp, Target, Award, Calendar, ExternalLink } from 'lucide-react'

interface UserProfile {
  username: string
  blackbook_id: string
  avatar_url?: string
  bio?: string
  joined_at: string
  stats: {
    total_contests: number
    contests_won: number
    win_rate: number
    total_wagered: number
    total_won: number
    profit: number
    fan_gold_balance: number
    bb_balance: number
  }
  badges: {
    id: string
    name: string
    description: string
    icon: string
    earned_at: string
  }[]
  recent_contests: {
    contest_id: string
    contest_title: string
    result: 'won' | 'lost'
    rank: number
    payout: number
    ended_at: string
  }[]
}

export default function IdentityPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [resolvedParams.username])

  async function fetchProfile() {
    try {
      // TODO: Replace with actual Supabase + L2 API calls
      // const res = await fetch(`/api/profile/${resolvedParams.username}`)
      // const data = await res.json()

      // Mock data
      const mockProfile: UserProfile = {
        username: resolvedParams.username,
        blackbook_id: 'BB_0xABC123',
        avatar_url: undefined,
        bio: 'Professional fantasy sports player. MrBeast superfan. Top 100 leaderboard.',
        joined_at: '2026-01-15T00:00:00Z',
        stats: {
          total_contests: 47,
          contests_won: 12,
          win_rate: 25.5,
          total_wagered: 940,
          total_won: 1280,
          profit: 340,
          fan_gold_balance: 12500,
          bb_balance: 450
        },
        badges: [
          {
            id: 'first_win',
            name: 'First Victory',
            description: 'Won your first contest',
            icon: '🏆',
            earned_at: '2026-01-16T12:00:00Z'
          },
          {
            id: 'ten_contests',
            name: 'Contest Veteran',
            description: 'Entered 10 contests',
            icon: '🎯',
            earned_at: '2026-01-20T08:00:00Z'
          },
          {
            id: 'duel_master',
            name: 'Duel Master',
            description: 'Won 5 Creator Duels',
            icon: '⚔️',
            earned_at: '2026-01-22T15:30:00Z'
          }
        ],
        recent_contests: [
          {
            contest_id: 'duel-kai-xqc-999',
            contest_title: 'Kai Cenat vs xQc',
            result: 'won',
            rank: 1,
            payout: 100,
            ended_at: '2026-01-25T12:00:00Z'
          },
          {
            contest_id: 'roster-epl-20',
            contest_title: 'EPL Gameweek 20',
            result: 'lost',
            rank: 45,
            payout: 0,
            ended_at: '2026-01-24T18:00:00Z'
          },
          {
            contest_id: 'bingo-beast-005',
            contest_title: 'Beast Games Bingo',
            result: 'won',
            rank: 3,
            payout: 40,
            ended_at: '2026-01-23T20:00:00Z'
          }
        ]
      }

      setProfile(mockProfile)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prism-cyan"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Profile not found</p>
          <Button onClick={() => router.push('/leaderboard')}>
            View Leaderboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{profile.username}</h1>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="font-mono">{profile.blackbook_id}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {formatDate(profile.joined_at)}
                  </Badge>
                </div>

                {profile.bio && (
                  <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-prism-cyan">{profile.stats.total_contests}</p>
                    <p className="text-xs text-gray-400">Total Contests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{profile.stats.contests_won}</p>
                    <p className="text-xs text-gray-400">Contests Won</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{profile.stats.win_rate}%</p>
                    <p className="text-xs text-gray-400">Win Rate</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${profile.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profile.stats.profit >= 0 ? '+' : ''}{profile.stats.profit} $BB
                    </p>
                    <p className="text-xs text-gray-400">All-Time Profit</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Detailed Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-prism-cyan" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
                    <span className="text-gray-400">Total Wagered</span>
                    <span className="text-xl font-bold">{profile.stats.total_wagered} $BB</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
                    <span className="text-gray-400">Total Won</span>
                    <span className="text-xl font-bold text-green-400">{profile.stats.total_won} $BB</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
                    <span className="text-gray-400">Net Profit</span>
                    <span className={`text-xl font-bold ${profile.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profile.stats.profit >= 0 ? '+' : ''}{profile.stats.profit} $BB
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded">
                    <span className="text-gray-400">ROI</span>
                    <span className={`text-xl font-bold ${profile.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((profile.stats.profit / profile.stats.total_wagered) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Contests */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-prism-cyan" />
                  Recent Contests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recent_contests.map((contest) => (
                    <div
                      key={contest.contest_id}
                      className="flex items-center justify-between p-4 bg-gray-900 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/contest/${contest.contest_id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={contest.result === 'won' ? 'default' : 'secondary'}
                            className={contest.result === 'won' ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {contest.result === 'won' ? '✅ WON' : '❌ LOST'}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            Rank #{contest.rank}
                          </span>
                        </div>
                        <h4 className="font-semibold">{contest.contest_title}</h4>
                        <p className="text-xs text-gray-400">{formatDate(contest.ended_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${contest.payout > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {contest.payout > 0 ? `+${contest.payout}` : '0'} $BB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Badges & Achievements */}
          <div className="space-y-6">
            {/* Balances */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Current Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400 mb-1">$BB Balance</p>
                  <p className="text-2xl font-bold text-green-400">{profile.stats.bb_balance} $BB</p>
                </div>
                <div className="p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400 mb-1">Fan Gold</p>
                  <p className="text-2xl font-bold text-yellow-400">⚡ {profile.stats.fan_gold_balance.toLocaleString()} FG</p>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Badges ({profile.badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 p-3 bg-gray-900 rounded hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{badge.name}</h4>
                        <p className="text-xs text-gray-400 mb-1">{badge.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(badge.earned_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
