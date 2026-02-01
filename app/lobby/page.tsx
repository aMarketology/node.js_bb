'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Users, Clock, DollarSign, Zap, Youtube, Gamepad2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { Database } from '@/lib/database.types'

type Contest = Database['public']['Tables']['contests_metadata']['Row']

export default function LobbyPage() {
  const router = useRouter()
  const supabase = createClient()
  const { liveContests, loading: l2Loading, formatAmount } = useL2Markets()
  const { balance: fcBalance, canEnterContest } = useFanCredit()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'fan_gold' | 'bb'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'youtube' | 'sports' | 'gaming'>('all')

  useEffect(() => {
    fetchContests()
  }, [])

  async function fetchContests() {
    try {
      // Fetch from Supabase contests_metadata table
      const { data, error } = await supabase
        .from('contests_metadata')
        .select('*')
        .in('status', ['upcoming', 'live'])
        .order('locks_at', { ascending: true })
      
      if (error) {
        console.error('Supabase error:', error)
        return
      }
      
      setContests(data || [])
    } catch (error) {
      console.error('Failed to fetch contests:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTimeRemaining(locksAt: string) {
    const now = new Date()
    const lockTime = new Date(locksAt)
    const diff = lockTime.getTime() - now.getTime()
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  function getContestIcon(category: string) {
    switch (category) {
      case 'youtube':
        return <Youtube className="h-5 w-5" />
      case 'sports':
        return <Trophy className="h-5 w-5" />
      case 'gaming':
        return <Gamepad2 className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'duel':
        return 'Creator Duel'
      case 'roster':
        return 'Viral Portfolio'
      case 'bingo':
        return 'Bingo'
      default:
        return type
    }
  }

  const filteredContests = contests.filter(contest => {
    if (filter !== 'all' && contest.currency !== filter) return false
    if (categoryFilter !== 'all' && contest.category !== categoryFilter) return false
    return true
  })

  // Parse entities from JSON
  function getEntities(contest: Contest): string[] {
    if (!contest.entities) return []
    return contest.entities as string[]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-prism-cyan to-prism-magenta bg-clip-text text-transparent">
          Contest Lobby
        </h1>
        <p className="text-gray-400">
          The Terminal - Pick your battle and join the competition
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="all">All Contests</TabsTrigger>
            <TabsTrigger value="bb">
              <DollarSign className="h-4 w-4 mr-1" />
              $BB Only
            </TabsTrigger>
            <TabsTrigger value="fan_gold">
              <Zap className="h-4 w-4 mr-1 text-yellow-400" />
              Fan Gold (Free)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Filters */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('all')}
            size="sm"
          >
            All Categories
          </Button>
          <Button
            variant={categoryFilter === 'youtube' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('youtube')}
            size="sm"
          >
            <Youtube className="h-4 w-4 mr-1" />
            YouTube
          </Button>
          <Button
            variant={categoryFilter === 'sports' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('sports')}
            size="sm"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Sports
          </Button>
          <Button
            variant={categoryFilter === 'gaming' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('gaming')}
            size="sm"
          >
            <Gamepad2 className="h-4 w-4 mr-1" />
            Gaming
          </Button>
        </div>
      </div>

      {/* Contest Grid */}
      <div className="max-w-7xl mx-auto">
        {/* L2 Live Contests Section */}
        {liveContests && liveContests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-prism-cyan">🔥 Live L2 Contests</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {liveContests.map((contest) => (
                <Card
                  key={contest.contest_id}
                  className="bg-gray-800 border-prism-cyan hover:border-prism-cyan/70 transition-all cursor-pointer"
                  onClick={() => router.push(`/contest/${contest.contest_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-prism-cyan" />
                        <Badge variant="default" className="bg-red-600">
                          🔴 LIVE
                        </Badge>
                      </div>
                      <Badge variant="outline" className={contest.currency === 'FanCoin' ? 'text-purple-400' : 'text-green-400'}>
                        {contest.currency === 'FanCoin' ? 'FC' : 'BB'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{contest.name || `Contest ${contest.contest_id.slice(0, 8)}`}</CardTitle>
                    <CardDescription>
                      {contest.currency === 'FanCoin' ? 'Entertainment Only - No Purchase Necessary' : 'Real Money Contest'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Entry Fee */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Entry Fee</span>
                        <span className={`font-semibold ${contest.currency === 'FanCoin' ? 'text-purple-400' : 'text-green-400'}`}>
                          {formatAmount(contest.entry_fee, contest.currency === 'FanCoin' ? 'FC' : 'BB')}
                        </span>
                      </div>

                      {/* Participants */}
                      {contest.participants && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Entries
                          </span>
                          <span className="text-sm">
                            {contest.participants.length}/{contest.max_participants}
                          </span>
                        </div>
                      )}

                      {/* Prize Pool */}
                      {contest.totalPrizePool && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                          <span className="text-sm text-gray-400">Prize Pool</span>
                          <span className={`text-lg font-bold ${contest.currency === 'FanCoin' ? 'text-purple-400' : 'text-green-400'}`}>
                            {formatAmount(contest.totalPrizePool, contest.currency === 'FanCoin' ? 'FC' : 'BB')}
                          </span>
                        </div>
                      )}

                      {/* Enter Button */}
                      <Button
                        className={`w-full mt-4 ${contest.currency === 'FanCoin' ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-gradient-to-r from-prism-cyan to-prism-magenta'} hover:opacity-90`}
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/contest/${contest.contest_id}`)
                        }}
                        disabled={contest.isFull}
                      >
                        {contest.isFull ? 'Contest Full' : 'Enter Contest'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Supabase Contests Section */}
        <h2 className="text-2xl font-bold mb-4">📋 All Contests</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prism-cyan"></div>
            <p className="mt-4 text-gray-400">Loading contests...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest) => (
              <Card
                key={contest.contest_id}
                className="bg-gray-800 border-gray-700 hover:border-prism-cyan transition-all cursor-pointer"
                onClick={() => router.push(`/contest/${contest.contest_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getContestIcon(contest.category)}
                      <Badge variant={contest.status === 'live' ? 'default' : 'secondary'}>
                        {contest.status === 'live' ? '🔴 LIVE' : '⏰ UPCOMING'}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {getTypeLabel(contest.contest_type)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{contest.title}</CardTitle>
                  <CardDescription>{contest.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Prize Pool */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Prize Pool</span>
                      <span className="text-lg font-bold text-green-400">
                        {contest.currency === 'fan_gold' ? (
                          <span className="text-yellow-400">⚡ {contest.prize_pool} FG</span>
                        ) : (
                          `${contest.prize_pool} $BB`
                        )}
                      </span>
                    </div>

                    {/* Entry Fee */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Entry Fee</span>
                      <span className="font-semibold">
                        {contest.currency === 'fan_gold' ? (
                          <span className="text-yellow-400">⚡ {contest.entry_fee} FG</span>
                        ) : (
                          `${contest.entry_fee} $BB`
                        )}
                      </span>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Entries
                      </span>
                      <span className="text-sm">
                        {contest.participants}/{contest.max_participants}
                      </span>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Locks in
                      </span>
                      <span className="text-sm font-semibold text-prism-cyan">
                        {getTimeRemaining(contest.locks_at)}
                      </span>
                    </div>

                    {/* Enter Button */}
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-prism-cyan to-prism-magenta hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/contest/${contest.contest_id}`)
                      }}
                    >
                      Enter Contest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredContests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No contests match your filters</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setFilter('all')
                setCategoryFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Free Entry Notice */}
      {filter === 'fan_gold' && (
        <div className="max-w-7xl mx-auto mt-8 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <p className="text-sm text-yellow-400">
            <strong>⚡ Fan Gold Contests:</strong> These are FREE to enter! Fan Gold has $0 value and is for entertainment only. 
            Win Fan Gold to unlock badges and cosmetics. No Purchase Necessary.
          </p>
        </div>
      )}
    </div>
  )
}
