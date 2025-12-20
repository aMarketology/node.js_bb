'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import MarketCard from './components/MarketCard'

interface Market {
  id: string
  slug: string
  question: string
  description: string
  outcomes: string[]
  outcomePrices: string[]
  volume: string
  liquidity: string
  endDate: string
  image: string
  active: boolean
  category?: string
  tags?: string[]
  volume24hr?: string
  createdAt?: string
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Use our API route instead of calling Polymarket directly (bypasses CORS)
        const response = await fetch('/api/markets?limit=12&active=true')
        
        if (!response.ok) {
          throw new Error('Failed to fetch markets')
        }

        const data = await response.json()
        
        // Transform the API response to match our interface
        const transformedMarkets = data.map((market: any) => ({
          id: market.id || market.condition_id,
          slug: market.slug || '',
          question: market.question || 'Untitled Market',
          description: market.description || '',
          outcomes: market.outcomes || ['Yes', 'No'],
          outcomePrices: market.outcomePrices || market.outcome_prices || ['0.5', '0.5'],
          volume: market.volume || '0',
          liquidity: market.liquidity || '0',
          endDate: market.end_date_iso || market.endDate || market.end_date || '',
          image: market.image || '',
          active: market.active ?? true,
          category: market.category || market.market_slug || '',
          tags: market.tags || [],
          volume24hr: market.volume24hr || market.volume_24hr || '0',
          createdAt: market.created_at || market.createdAt || ''
        }))

        setMarkets(transformedMarkets)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching markets:', err)
        setError('Failed to load markets. Please try again later.')
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* === HERO SECTION === */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-b from-black via-grey-900 to-black">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(133,187,101,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(133,187,101,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-grey-700 bg-grey-800/50 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-grey-300 uppercase tracking-widest">Live Prediction Markets</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent leading-tight">
                Predict Markets
              </h1>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-grey-200">
                Trade Your Knowledge
              </h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-grey-300 font-light leading-relaxed max-w-3xl mx-auto"
            >
              The world's largest prediction market platform. Trade on sports, politics, crypto, and more. Your knowledge, your profits.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <a
                href="#markets"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light rounded-lg font-semibold text-lg text-black hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
              >
                Explore Markets
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-grey-800/50 border border-grey-700 rounded-lg font-semibold text-lg text-grey-200 hover:bg-grey-700/50 hover:border-grey-600 backdrop-blur-sm transition-all duration-300"
              >
                Start Trading
              </a>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">$100M+</div>
                <div className="text-sm text-grey-400 uppercase tracking-wider">Daily Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
                <div className="text-sm text-grey-400 uppercase tracking-wider">Active Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100K+</div>
                <div className="text-sm text-grey-400 uppercase tracking-wider">Traders</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === MARKETS SECTION === */}
      <section id="markets" className="relative py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-grey-700 bg-grey-800/50 backdrop-blur-sm mb-6">
              <span className="text-xs font-medium text-grey-300 uppercase tracking-widest">Trending Now</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-grey-50 mb-4">
              Active <span className="text-primary">Prediction Markets</span>
            </h2>
            <p className="text-xl text-grey-300 max-w-3xl mx-auto">
              Trade on real-world events with real money. Make predictions on politics, sports, crypto, and more.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-grey-700 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-grey-400 text-lg">Loading markets...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-danger/10 border border-danger/30 rounded-lg text-danger mb-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Markets Grid - 3 per row */}
          {!loading && !error && markets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market, index) => (
                <MarketCard key={market.id} market={market} index={index} />
              ))}
            </div>
          )}

          {/* View All CTA */}
          {!loading && !error && markets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-16"
            >
              <a
                href="https://polymarket.com/markets"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-primary-light rounded-lg font-semibold text-lg text-black hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
              >
                View All Markets
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* === HOW IT WORKS SECTION === */}
      <section className="relative py-24 bg-gradient-to-b from-black via-grey-900 to-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-grey-50 mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-grey-300 max-w-2xl mx-auto">
              Start trading in minutes. It's simple, transparent, and secure.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose a Market',
                description: 'Browse hundreds of markets on politics, sports, crypto, and current events.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )
              },
              {
                step: '02',
                title: 'Make Your Prediction',
                description: 'Buy shares for Yes or No based on your knowledge and research.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                step: '03',
                title: 'Win Money',
                description: 'When the market resolves, winning shares pay out $1.00 each. Profit from being right.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-2xl bg-grey-900/50 border border-grey-700 hover:border-primary/50 transition-all duration-300"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-8 px-4 py-1 bg-primary text-black font-bold text-sm rounded-full">
                  {item.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {item.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-grey-50 mb-4">{item.title}</h3>
                <p className="text-grey-300 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FINAL CTA SECTION === */}
      <section className="relative py-32 bg-gradient-to-b from-black to-grey-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(133,187,101,0.15),transparent_50%)]" />
        
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-grey-50 mb-6">
            Ready to Start
            <br />
            <span className="text-primary">Trading?</span>
          </h2>
          
          <p className="text-xl text-grey-300 mb-12 max-w-2xl mx-auto">
            Join thousands of traders making predictions on real-world events. Your knowledge has value.
          </p>

          {/* CTA Button */}
          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-gradient-to-r from-primary to-primary-light rounded-lg font-bold text-xl text-black hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
          >
            Start Trading Now
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-grey-800">
            <p className="text-grey-500 text-sm mb-4">Powered by Polymarket</p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-grey-600 text-xs">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Transparent
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Decentralized
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
