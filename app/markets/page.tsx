'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'

// Contest Types
type GameMode = 'roster' | 'duel' | 'bingo'
type Category = 'sports' | 'youtube'

interface Contest {
  id: string
  mode: GameMode
  category: Category
  title: string
  description: string
  entryFee: number
  prizePool: number
  participants: number
  maxParticipants: number
  startsIn: string
  status: 'upcoming' | 'live' | 'ended'
  imageUrl?: string
  entities?: string[] // For duels: ["MrBeast", "IShowSpeed"]
  spotlightText?: string
}

// Mock contest data
const MOCK_CONTESTS: Contest[] = [
  // ROSTER DRAFTS
  {
    id: 'roster-worldcup-semifinals',
    mode: 'roster',
    category: 'sports',
    title: 'World Cup Semifinals - Dream Team',
    description: 'Draft 5 players (2 FWD, 2 MID, 1 DEF) for the semifinal matchday',
    entryFee: 20,
    prizePool: 1000,
    participants: 48,
    maxParticipants: 50,
    startsIn: '2 hours',
    status: 'upcoming',
    spotlightText: '🔥 Filling Fast'
  },
  {
    id: 'roster-beast-games-week3',
    mode: 'roster',
    category: 'youtube',
    title: 'Beast Games Week 3 - Creator League',
    description: 'Draft 5 contestants you think will survive longest or get most screen time',
    entryFee: 20,
    prizePool: 800,
    participants: 35,
    maxParticipants: 40,
    startsIn: '1 day',
    status: 'upcoming',
    spotlightText: '🎬 Episode Drops Sunday'
  },
  // DUELS
  {
    id: 'duel-mbappe-vini',
    mode: 'duel',
    category: 'sports',
    title: 'Striker Clash: Mbappé vs Vinícius Jr',
    description: 'Who will score more fantasy points in the France vs Brazil semifinal?',
    entities: ['Kylian Mbappé', 'Vinícius Jr'],
    entryFee: 10,
    prizePool: 500,
    participants: 64,
    maxParticipants: 100,
    startsIn: '4 hours',
    status: 'live',
    spotlightText: '⚽ LIVE NOW'
  },
  {
    id: 'duel-mrbeast-speed',
    mode: 'duel',
    category: 'youtube',
    title: 'Virality Clash: MrBeast vs IShowSpeed',
    description: 'Who will gain more views in the next 24 hours?',
    entities: ['MrBeast', 'IShowSpeed'],
    entryFee: 10,
    prizePool: 600,
    participants: 72,
    maxParticipants: 100,
    startsIn: 'Live',
    status: 'live',
    spotlightText: '📈 View Count Battle'
  },
  // BINGO
  {
    id: 'bingo-usa-england',
    mode: 'bingo',
    category: 'sports',
    title: 'USA vs England - Match Bingo',
    description: 'Complete a line on the 3x3 event grid. First to finish wins!',
    entryFee: 5,
    prizePool: 250,
    participants: 41,
    maxParticipants: 50,
    startsIn: '3 hours',
    status: 'upcoming',
    spotlightText: '🎯 Grid Strategy'
  },
  {
    id: 'bingo-mrbeast-next',
    mode: 'bingo',
    category: 'youtube',
    title: 'MrBeast Next Video - Content Bingo',
    description: 'Predict what happens in his next video. Explosions? Giveaways? Last to Leave?',
    entryFee: 5,
    prizePool: 300,
    participants: 55,
    maxParticipants: 60,
    startsIn: '6 hours',
    status: 'upcoming',
    spotlightText: '🎥 Video Drops Tonight'
  }
]

export default function ContestsPage() {
  const [selectedMode, setSelectedMode] = useState<GameMode | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const contests = MOCK_CONTESTS

  // Filter contests
  const filteredContests = contests.filter(contest => {
    const matchesMode = selectedMode === 'all' || contest.mode === selectedMode
    const matchesCategory = selectedCategory === 'all' || contest.category === selectedCategory
    return matchesMode && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
              3-Mode Fantasy Marketplace
            </span>
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            Sports • Creator Economy • Skill-Based Competition
          </p>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Choose your game mode. Build rosters, predict duels, or complete bingo grids. 
            Every contest uses FREE sweepstakes entries ($BB). <strong className="text-yellow-400">NOT betting</strong> — pure skill gaming.
          </p>
        </motion.div>

        {/* Game Mode Explainer Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <ModeCard
            icon="👥"
            title="Roster Draft"
            subtitle="Long Form Portfolio"
            description="Draft 5 players/creators. Analyze stats, build winning lineups."
            legalDefense="Portfolio Management (Skill)"
            isActive={selectedMode === 'roster'}
            onClick={() => setSelectedMode(selectedMode === 'roster' ? 'all' : 'roster')}
          />
          <ModeCard
            icon="⚔️"
            title="The Duel"
            subtitle="Head-to-Head Metrics"
            description="Pick who performs better. Not who wins, but who does MORE."
            legalDefense="Comparative Analysis (Skill)"
            isActive={selectedMode === 'duel'}
            onClick={() => setSelectedMode(selectedMode === 'duel' ? 'all' : 'duel')}
          />
          <ModeCard
            icon="🎯"
            title="Tactical Bingo"
            subtitle="Event Grid Strategy"
            description="Pick events on a 3x3 grid. Complete a line to win the pot."
            legalDefense="Predictive Strategy (Skill)"
            isActive={selectedMode === 'bingo'}
            onClick={() => setSelectedMode(selectedMode === 'bingo' ? 'all' : 'bingo')}
          />
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white shadow-xl'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setSelectedCategory('sports')}
            className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              selectedCategory === 'sports'
                ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-xl'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            ⚽ Sports
          </button>
          <button
            onClick={() => setSelectedCategory('youtube')}
            className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              selectedCategory === 'youtube'
                ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-xl'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            📹 YouTube
          </button>
        </div>

        {/* Contests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest, index) => (
            <ContestCard key={contest.id} contest={contest} delay={index * 0.1} />
          ))}
        </div>

        {filteredContests.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <div className="text-2xl text-gray-400 mb-2">No contests match your filters</div>
            <button
              onClick={() => {
                setSelectedMode('all')
                setSelectedCategory('all')
              }}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* How It Works Section */}
        <HowItWorksSection />
      </main>

      <Footer />
    </div>
  )
}

function ModeCard({ icon, title, subtitle, description, legalDefense, isActive, onClick }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-6 transition-all ${
        isActive
          ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500'
          : 'bg-white/5 border border-white/10 hover:border-purple-500/50'
      }`}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="text-sm text-purple-400 mb-3">{subtitle}</div>
      <p className="text-gray-300 text-sm mb-4">{description}</p>
      <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
        ⚖️ {legalDefense}
      </div>
    </motion.div>
  )
}

function ContestCard({ contest, delay }: { contest: Contest; delay: number }) {
  const modeConfig = {
    roster: { icon: '👥', color: 'from-blue-500 to-cyan-500', label: 'Roster' },
    duel: { icon: '⚔️', color: 'from-orange-500 to-red-500', label: 'Duel' },
    bingo: { icon: '🎯', color: 'from-purple-500 to-pink-500', label: 'Bingo' }
  }

  const categoryConfig = {
    sports: { icon: '⚽', color: 'bg-green-500/20 text-green-400' },
    youtube: { icon: '📹', color: 'bg-red-500/20 text-red-400' }
  }

  const config = modeConfig[contest.mode]
  const catConfig = categoryConfig[contest.category]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
    >
      <Link href={`/markets/${contest.id}`}>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer h-full">
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.color} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${catConfig.color}`}>
                {catConfig.icon} {contest.category.toUpperCase()}
              </span>
              {contest.spotlightText && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                  {contest.spotlightText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <div className="text-xs text-white/80">{config.label}</div>
                <div className="text-sm font-bold text-white">{contest.startsIn}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-2">{contest.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{contest.description}</p>

            {/* Entities for Duels */}
            {contest.mode === 'duel' && contest.entities && (
              <div className="flex items-center justify-center gap-4 mb-4 py-4 bg-black/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-white font-semibold text-sm">{contest.entities[0]}</div>
                </div>
                <div className="text-2xl text-purple-400">VS</div>
                <div className="text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-white font-semibold text-sm">{contest.entities[1]}</div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Entry Fee</div>
                <div className="text-yellow-400 font-bold">{contest.entryFee} $BB</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Prize Pool</div>
                <div className="text-green-400 font-bold">{contest.prizePool} $BB</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Players</div>
                <div className="text-blue-400 font-bold">{contest.participants}/{contest.maxParticipants}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${config.color} transition-all`}
                  style={{ width: `${(contest.participants / contest.maxParticipants) * 100}%` }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${config.color} hover:shadow-xl transition-all`}>
              {contest.status === 'live' ? '⚡ JOIN LIVE' : '🚀 ENTER CONTEST'}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function HowItWorksSection() {
  return (
    <div className="mt-24 bg-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/10">
      <h2 className="text-4xl font-bold text-white mb-8 text-center">
        How Our 3-Mode System Works
      </h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Roster */}
        <div>
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-white mb-3">Roster Draft</h3>
          <p className="text-gray-300 mb-4">
            <strong className="text-yellow-400">For Sports:</strong> Draft 5 players (2 FWD, 2 MID, 1 DEF). Score points based on goals, assists, clean sheets.
          </p>
          <p className="text-gray-300 mb-4">
            <strong className="text-red-400">For YouTube:</strong> Draft 5 creators/contestants. Score based on screen time, eliminations, challenge wins.
          </p>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
            ⚖️ Legal: Portfolio management requires multi-asset analysis (skill, not chance)
          </div>
        </div>

        {/* Duel */}
        <div>
          <div className="text-5xl mb-4">⚔️</div>
          <h3 className="text-2xl font-bold text-white mb-3">The Duel</h3>
          <p className="text-gray-300 mb-4">
            <strong className="text-yellow-400">For Sports:</strong> Pick who scores more fantasy points. Not just goals — includes assists, dribbles, shots.
          </p>
          <p className="text-gray-300 mb-4">
            <strong className="text-red-400">For YouTube:</strong> Pick who gains more views/likes/subs in 24 hours. Algorithm-dependent, unpredictable.
          </p>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
            ⚖️ Legal: Comparative analysis on metrics (not outcomes) = skill-based prediction
          </div>
        </div>

        {/* Bingo */}
        <div>
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-3">Tactical Bingo</h3>
          <p className="text-gray-300 mb-4">
            <strong className="text-yellow-400">For Sports:</strong> 3x3 grid of match events (Corner Kick, Yellow Card, VAR Check). Complete a line first.
          </p>
          <p className="text-gray-300 mb-4">
            <strong className="text-red-400">For YouTube:</strong> Grid of video events (Explosion, Giveaway, "Last to Leave"). Requires strategic picking.
          </p>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
            ⚖️ Legal: Strategic event prediction requires analysis (skill, not pure luck)
          </div>
        </div>
      </div>

      {/* Anti-Rigging Notice */}
      <div className="mt-8 p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl">
        <h4 className="text-xl font-bold text-yellow-400 mb-3">🛡️ Anti-Rigging Protection</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <strong className="text-white">For Pre-Recorded Content (YouTube):</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Focus on <strong className="text-green-400">Metrics</strong> (views/likes) not Outcomes (winners)</li>
              <li>• Lock bets 1 hour before video upload</li>
              <li>• Cap entry limits to $50 max</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">For Live Events (Sports):</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Nobody knows the result → truly random</li>
              <li>• Real-time oracle data (Opta/Sportradar)</li>
              <li>• Instant settlement after match</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
