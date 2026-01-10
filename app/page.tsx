'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { type Match } from '@/lib/fixtures'

// Prism colors for cycling effects
const prismColors = ['#00CED1', '#3B82F6', '#8B5CF6', '#EC4899', '#FF4757', '#FF6B35', '#FFD700']

// L2 Markets API
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
const APP_API = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default function Home() {
  const [activeColor, setActiveColor] = useState(0)
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  // Cycle through prism colors
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveColor((prev) => (prev + 1) % prismColors.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Load real markets from L2 blockchain
  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true)
        
        // Fetch directly from L2 blockchain server
        console.log('🔗 Connecting to L2 blockchain at', L2_API)
        const response = await fetch(`${L2_API}/markets`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`L2 server returned ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📦 Received data from L2:', data)
        
        if (data.markets && data.markets.length > 0) {
          // Convert L2 market format to our Match type
          const convertedMatches = data.markets.slice(0, 6).map((m: any) => ({
            id: m.id,
            date: new Date(m.kickoff).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            dateObj: new Date(m.kickoff),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            group: m.group || m.stage,
            venue: m.venue,
            city: m.city,
            country: m.country || '',
            kickoffTime: new Date(m.kickoff).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            homeFlag: m.homeTeamFlag,
            awayFlag: m.awayTeamFlag,
            status: m.status === 'upcoming' ? 'scheduled' : m.status,
            // Convert L2 odds format (0.0-1.0 probabilities) to traditional odds
            homeOdds: parseFloat(m.homeWinOdds) > 0 ? Number((1 / parseFloat(m.homeWinOdds)).toFixed(2)) : 2.0,
            drawOdds: parseFloat(m.drawOdds) > 0 ? Number((1 / parseFloat(m.drawOdds)).toFixed(2)) : 3.0,
            awayOdds: parseFloat(m.awayWinOdds) > 0 ? Number((1 / parseFloat(m.awayWinOdds)).toFixed(2)) : 2.5,
            // Use real volume and liquidity from L2
            totalBets: parseInt(m.volume) > 0 ? Math.floor(parseInt(m.volume) / 10) : 0,
            homePool: parseInt(m.liquidity) * parseFloat(m.homeWinOdds),
            drawPool: parseInt(m.liquidity) * parseFloat(m.drawOdds),
            awayPool: parseInt(m.liquidity) * parseFloat(m.awayWinOdds)
          }))
          
          setFeaturedMatches(convertedMatches)
          console.log('✅ Loaded', convertedMatches.length, 'real markets from L2 blockchain')
        } else {
          throw new Error('No markets returned from L2 blockchain')
        }
      } catch (error) {
        console.error('❌ Failed to connect to L2 blockchain:', error)
        setFeaturedMatches([]) // Show error state, no fallback
      } finally {
        setLoading(false)
      }
    }
    
    loadMarkets()
  }, [])

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      {/* === HERO SECTION === */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Prism Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="prism-orb prism-orb-teal w-[500px] h-[500px] -top-40 -left-40" style={{ animationDelay: '0s' }} />
          <div className="prism-orb prism-orb-purple w-[400px] h-[400px] top-1/4 right-0" style={{ animationDelay: '2s' }} />
          <div className="prism-orb prism-orb-pink w-[300px] h-[300px] bottom-1/4 left-1/4" style={{ animationDelay: '4s' }} />
          <div className="prism-orb prism-orb-gold w-[350px] h-[350px] bottom-0 right-1/4" style={{ animationDelay: '1s' }} />
          <div className="prism-orb prism-orb-blue w-[250px] h-[250px] top-1/3 left-1/3" style={{ animationDelay: '3s' }} />
          <div className="prism-orb prism-orb-orange w-[200px] h-[200px] top-20 right-1/3" style={{ animationDelay: '5s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,206,209,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-dark-200 border border-dark-border relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-prism-teal/10 via-prism-purple/10 to-prism-pink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse relative z-10"
                    style={{ backgroundColor: prismColors[activeColor] }}
                  />
                  <span className="text-sm text-gray-300 font-medium relative z-10">FIFA World Cup 2026™</span>
                  <div className="w-2 h-2 rounded-full animate-pulse relative z-10" style={{ backgroundColor: prismColors[(activeColor + 3) % 7] }} />
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                {/* Glow effect behind text */}
                <div className="absolute inset-0 blur-3xl opacity-30">
                  <div className="prism-gradient-bg h-full" />
                </div>
                <h1 className="text-6xl md:text-7xl lg:text-9xl font-black leading-tight relative">
                  <motion.span 
                    className="prism-gradient-text block"
                    animate={{ 
                      textShadow: [
                        `0 0 20px ${prismColors[activeColor]}`,
                        `0 0 40px ${prismColors[(activeColor + 1) % 7]}`,
                        `0 0 20px ${prismColors[activeColor]}`
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    PRISM
                  </motion.span>
                  <span className="text-white block mt-2">WORLD CUP</span>
                  <span className="text-gray-400 text-3xl md:text-4xl lg:text-5xl block mt-4 font-bold">2026 Predictions</span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Harness the <span className="text-prism-teal font-semibold">full spectrum</span> of prediction power.
                <br className="hidden md:block" />
                <span className="text-prism-purple font-semibold">48 Nations</span>. <span className="text-prism-gold font-semibold">104 Matches</span>. <span className="text-prism-pink font-semibold">Infinite Possibilities</span>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 justify-center"
              >
                <motion.a
                  href="#matches"
                  whileHover={{ scale: 1.08, boxShadow: `0 0 30px ${prismColors[activeColor]}` }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-10 py-5 rounded-2xl font-black text-xl text-white overflow-hidden group shadow-2xl"
                >
                  <div className="absolute inset-0 prism-gradient-bg-animated" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="prism-gradient-bg animate-pulse" />
                  </div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-2xl">⚡</span>
                    Start Predicting
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.a>

                <motion.a
                  href="#how-it-works"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-10 py-5 rounded-2xl font-bold text-xl text-white bg-dark-200 border-2 prism-border overflow-hidden group"
                >
                  <div className="absolute inset-0 prism-gradient-bg opacity-0 group-hover:opacity-10 transition-opacity" />
                  <span className="relative z-10">How It Works</span>
                </motion.a>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto"
              >
                <StatCard value="48" label="Teams" color="prism-teal" icon="🌍" />
                <StatCard value="104" label="Matches" color="prism-purple" icon="⚽" />
                <StatCard value="16" label="Host Cities" color="prism-gold" icon="🏟️" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURED MATCHES === */}
      <section id="matches" className="relative py-24 bg-dark-100">
        {/* Section background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 prism-orb prism-orb-purple opacity-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 prism-orb prism-orb-teal opacity-20" />

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-200 border border-dark-border mb-6">
            
              <span className="text-prism-teal">⚽</span>
              <span className="text-sm text-gray-300">Featured Matches</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Make Your <span className="prism-gradient-text">Predictions</span>
            </h2>
            
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose from hundreds of markets across all World Cup matches. 
              The prism reveals all possibilities.
            </p>
          </div>

          {/* Matches Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal mb-4"></div>
                <p className="text-gray-400">Connecting to L2 blockchain...</p>
                <p className="text-xs text-gray-500 mt-2">Loading real markets from localhost:1234</p>
              </div>
            ) : featuredMatches.length > 0 ? (
              featuredMatches.map((match, index) => (
                <MatchCard key={match.id} match={match} index={index} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-prism-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-prism-red font-bold text-lg mb-2">Not Connecting</p>
                <p className="text-gray-400 text-sm mb-4">Unable to connect to L2 blockchain server</p>
                <p className="text-xs text-gray-500 mb-4">Make sure L2 server is running on localhost:1234</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <a
              href="#"
              className="inline-flex items-center gap-2 text-prism-teal hover:text-prism-teal-light transition-colors"
            >
              View All Matches
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section id="how-it-works" className="relative py-24 bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              How <span className="prism-gradient-text">Prism</span> Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 max-w-2xl mx-auto"
            >
              Three simple steps to harness the power of prediction
            </motion.p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Match',
                description: 'Browse group stage, knockouts, or special markets.',
                icon: '🎯',
                color: 'prism-teal',
              },
              {
                step: '02',
                title: 'Make Predictions',
                description: 'Pick winners, scores, or player props with confidence.',
                icon: '⚡',
                color: 'prism-purple',
              },
              {
                step: '03',
                title: 'Win Rewards',
                description: 'Collect your winnings when predictions come true.',
                icon: '🏆',
                color: 'prism-gold',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative group"
              >
                <div className="prism-card rounded-2xl p-8 h-full">
                  {/* Step number */}
                  <div className={`text-5xl font-black text-${item.color} opacity-20 mb-4`}>
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-4xl mb-4">{item.icon}</div>
                  
                  {/* Content */}
                  <h3 className={`text-xl font-bold text-white mb-2 group-hover:text-${item.color} transition-colors`}>
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="relative py-32 overflow-hidden">
        {/* Prism background effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 prism-gradient-bg opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] prism-orb prism-orb-purple opacity-30" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Ready to Enter the
            <br />
            <span className="prism-gradient-text">Prism?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-12"
          >
            Join thousands predicting the greatest tournament in history.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a
              href="#matches"
              className="relative inline-flex items-center gap-3 px-12 py-6 rounded-2xl font-bold text-xl text-white overflow-hidden group"
            >
              <div className="absolute inset-0 prism-gradient-bg-animated" />
              <span className="relative z-10">Start Predicting Now</span>
              <svg className="relative z-10 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-prism-teal">✓</span> Blockchain Secured
            </span>
            <span className="flex items-center gap-2">
              <span className="text-prism-purple">✓</span> Instant Payouts
            </span>
            <span className="flex items-center gap-2">
              <span className="text-prism-gold">✓</span> 48 Nations
            </span>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// Stat Card Component
function StatCard({ value, label, color, icon }: { value: string; label: string; color: string; icon?: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      <div className="absolute inset-0 prism-gradient-bg opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity" />
      <div className="relative text-center p-6 rounded-2xl bg-dark-200 border-2 prism-border">
        {icon && <div className="text-4xl mb-3">{icon}</div>}
        <div className={`text-3xl md:text-4xl font-black text-${color} mb-2`}>{value}</div>
        <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">{label}</div>
      </div>
    </motion.div>
  )
}

// Match Card Component
function MatchCard({ match, index }: { match: Match; index: number }) {
  const borderColors = [
    'hover:border-prism-teal',
    'hover:border-prism-purple',
    'hover:border-prism-pink'
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <a href={`/markets/${match.id}`} className={`block prism-card rounded-2xl overflow-hidden ${borderColors[index % 3]} transition-all duration-500 shadow-2xl hover:shadow-3xl relative`}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 prism-gradient-bg opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-4 border-b border-dark-border bg-dark-200/50 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <motion.span 
              className="text-xs font-bold px-3 py-1 rounded-full bg-prism-teal/20 text-prism-teal border border-prism-teal/50"
              whileHover={{ scale: 1.1 }}
            >
              {match.group}
            </motion.span>
            <span className="text-xs text-gray-400 font-medium">{match.date}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            {/* Home Team */}
            <motion.div 
              className="text-center flex-1"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div 
                className="text-5xl mb-3 filter drop-shadow-lg"
                animate={{ rotateY: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {match.homeFlag}
              </motion.div>
              <div className="text-white font-bold text-sm px-2">{match.homeTeam}</div>
            </motion.div>

            {/* VS with prism effect */}
            <div className="px-4 relative">
              <motion.div
                className="absolute inset-0 -m-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 rounded-full prism-gradient-bg opacity-20 blur-md" />
              </motion.div>
              <span className="relative z-10 text-white font-black text-lg prism-gradient-text">VS</span>
            </div>

            {/* Away Team */}
            <motion.div 
              className="text-center flex-1"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div 
                className="text-5xl mb-3 filter drop-shadow-lg"
                animate={{ rotateY: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                {match.awayFlag}
              </motion.div>
              <div className="text-white font-bold text-sm px-2">{match.awayTeam}</div>
            </motion.div>
          </div>

          {/* Odds */}
          <div className="grid grid-cols-3 gap-3">
            <OddsButton label="Home" odds={match.homeOdds || 0} color="teal" />
            <OddsButton label="Draw" odds={match.drawOdds || 0} color="purple" />
            <OddsButton label="Away" odds={match.awayOdds || 0} color="pink" />
          </div>

          {/* Total Bets */}
          {match.totalBets && (
            <motion.div 
              className="mt-4 pt-4 border-t border-dark-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  <span className="text-prism-teal font-bold">{match.totalBets.toLocaleString()}</span> bets
                </span>
                <span className="text-prism-gold font-bold">
                  ${(match.totalBets * 10).toLocaleString()}
                </span>
              </div>
              {/* Live indicator */}
              <motion.div 
                className="flex items-center gap-2 mt-2 text-xs"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 rounded-full bg-prism-teal animate-pulse" />
                <span className="text-prism-teal font-medium">Live Betting</span>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-6 py-4 bg-dark-200/50 border-t border-dark-border backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 flex items-center gap-2">
              <span className="text-base">📍</span> {match.city}
            </span>
            <motion.div
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-bold prism-gradient-text flex items-center gap-1"
            >
              Bet Now
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </motion.div>
          </div>
        </div>
      </a>
    </motion.div>
  )
}

// Odds Button Component
function OddsButton({ label, odds, color }: { label: string; odds: number; color: string }) {
  const colorClasses = {
    teal: 'hover:bg-prism-teal/30 hover:border-prism-teal hover:text-white text-prism-teal hover:shadow-lg hover:shadow-prism-teal/50',
    purple: 'hover:bg-prism-purple/30 hover:border-prism-purple hover:text-white text-prism-purple hover:shadow-lg hover:shadow-prism-purple/50',
    pink: 'hover:bg-prism-pink/30 hover:border-prism-pink hover:text-white text-prism-pink hover:shadow-lg hover:shadow-prism-pink/50',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`p-4 rounded-xl bg-dark-200 border-2 border-dark-border transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-wider">{label}</div>
      <div className="font-black text-lg">{odds.toFixed(2)}x</div>
    </motion.button>
  )
}

