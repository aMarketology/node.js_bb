'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface Market {
  id: string
  title: string
  description: string
  outcomes: string[]
  status: string
  totalVolume: number
  prices?: number[]
}

export default function Home() {
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState({ totalMarkets: 0, totalVolume: 0, activeUsers: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const response = await fetch(`${L2_API}/markets`)
      if (response.ok) {
        const data = await response.json()
        const markets = data.markets || []
        setFeaturedMarkets(markets.slice(0, 3))
        setStats({
          totalMarkets: markets.length,
          totalVolume: markets.reduce((sum: number, m: any) => sum + (m.total_volume || 0), 0),
          activeUsers: 1234 // Mock data
        })
      }
    } catch (error) {
      console.error('Failed to load markets:', error)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      {/* Hero Section - FIFA-inspired */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-prism-purple via-dark to-prism-teal opacity-40" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Floating Orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-prism-teal rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-prism-purple rounded-full blur-3xl"
        />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-8xl font-black text-white mb-6 leading-tight">
              FIFA WORLD CUP<br />
              <span className="bg-gradient-to-r from-prism-teal via-prism-purple to-prism-teal bg-clip-text text-transparent">
                2026 FANTASY LEAGUE
              </span>
            </h1>
            <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Social Gaming Platform • Free Sweepstakes Entries • Skill-Based Contests
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Build your champion roster, compete against real players, and win with FREE sweepstakes entries. Buy virtual currency, get bonus entries — 100% legal entertainment.
            </p>
            
            <div className="flex gap-6 justify-center">
              <Link href="/get-started">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-4 bg-gradient-to-r from-prism-teal to-prism-purple text-white text-lg font-bold rounded-full shadow-2xl hover:shadow-prism-teal/50 transition-all"
                >
                  GET FREE ENTRIES 🎁
                </motion.button>
              </Link>
              <Link href="/markets">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-full border-2 border-white/30 hover:bg-white/20 transition-all"
                >
                  BROWSE CONTESTS
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex flex-col items-center text-gray-400">
              <span className="text-sm mb-2">SCROLL TO EXPLORE</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-dark-lighter border-y border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl font-black bg-gradient-to-r from-prism-teal to-prism-purple bg-clip-text text-transparent mb-2">
                {stats.totalMarkets}+
              </div>
              <div className="text-gray-400 text-lg">Live Contests</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-5xl font-black bg-gradient-to-r from-prism-teal to-prism-purple bg-clip-text text-transparent mb-2">
                ${(stats.totalVolume / 1000).toFixed(0)}K+
              </div>
              <div className="text-gray-400 text-lg">Prize Pool</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-5xl font-black bg-gradient-to-r from-prism-teal to-prism-purple bg-clip-text text-transparent mb-2">
                {stats.activeUsers}+
              </div>
              <div className="text-gray-400 text-lg">Active Players</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Legal Clarity Banner */}
      <section className="py-8 bg-gradient-to-r from-yellow-500/10 via-green-500/10 to-blue-500/10 border-y border-yellow-500/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">🎮</span>
              <h3 className="text-2xl font-bold text-white">Social Gaming Platform</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">100% Legal</span>
            </div>
            <p className="text-gray-300 text-lg mb-4">
              <strong className="text-yellow-400">NOT A SPORTSBOOK.</strong> We sell virtual currency (Fan Coins) for entertainment. 
              BlackBook tokens ($BB) are <strong className="text-green-400">FREE sweepstakes entries</strong> — never purchased directly.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl mb-2">🎁</div>
                <div className="font-bold text-white mb-1">No Purchase Necessary</div>
                <div className="text-sm text-gray-400">Free $BB tokens with sign-up and daily logins</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl mb-2">🧠</div>
                <div className="font-bold text-white mb-1">Skill-Based Gameplay</div>
                <div className="text-sm text-gray-400">Fantasy roster building, not random chance</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="font-bold text-white mb-1">Texas Law Compliant</div>
                <div className="text-sm text-gray-400">Sweepstakes + Fantasy = Legal everywhere</div>
              </div>
            </div>
            <Link href="/get-started" className="inline-block mt-6 text-purple-400 hover:text-purple-300 font-semibold underline">
              Learn how our legal model works →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Contests */}
      <section className="py-24 bg-dark">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">FEATURED CONTESTS</h2>
            <p className="text-xl text-gray-400">Compete in skill-based fantasy leagues with FREE sweepstakes entries</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredMarkets.map((market, index) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/markets/${market.id}`}>
                  <div className="group relative bg-dark-lighter rounded-2xl overflow-hidden border border-gray-800 hover:border-prism-teal transition-all cursor-pointer">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-prism-purple/20 to-prism-teal/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative p-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          market.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {market.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        <span className="text-gray-400 text-sm">⚽</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-prism-teal transition-colors">
                        {market.title}
                      </h3>
                      
                      <p className="text-gray-400 mb-6 line-clamp-2">{market.description || 'No description available'}</p>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <div className="text-gray-500">Volume</div>
                          <div className="text-white font-bold">${market.totalVolume.toFixed(0)}</div>
                        </div>
                        {market.prices && market.prices.length > 0 && (
                          <div>
                            <div className="text-gray-500">Best Odds</div>
                            <div className="text-prism-teal font-bold">{(market.prices[0] * 100).toFixed(0)}%</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center text-prism-teal font-semibold group-hover:translate-x-2 transition-transform">
                        VIEW MARKET <span className="ml-2">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-full border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                VIEW ALL MARKETS
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-lighter">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">WHY PRISM PREDICTIONS</h2>
            <p className="text-xl text-gray-400">The future of sports prediction markets</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-prism-teal to-prism-purple rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400">Instant settlements powered by Layer 2 blockchain technology</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-prism-purple to-prism-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Transparent</h3>
              <p className="text-gray-400">Every prediction recorded on-chain with cryptographic verification</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-prism-teal to-prism-purple rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real Rewards</h3>
              <p className="text-gray-400">Win based on accuracy with transparent odds and instant payouts</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-prism-purple via-dark to-prism-teal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-black text-white mb-6">
              READY TO PREDICT<br />THE FUTURE?
            </h2>
            <p className="text-2xl text-gray-200 mb-12 max-w-2xl mx-auto">
              Join thousands of predictors making winning calls on the World Cup 2026
            </p>
            
            <Link href="/markets">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-5 bg-white text-dark text-xl font-black rounded-full shadow-2xl hover:shadow-white/50 transition-all"
              >
                START PREDICTING NOW
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
