'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from './Navigation'
import Footer from './Footer'
import MarketCard from './MarketCard'

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

interface CategoryPageProps {
  category: string
  title: string
  description: string
  icon: React.ReactNode
}

export default function CategoryPage({ category, title, description, icon }: CategoryPageProps) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch(`/api/markets?limit=24&active=true&tag=${category}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch markets')
        }

        const data = await response.json()
        
        // Transform the API response
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
  }, [category])

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-black via-grey-900 to-black">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(105,219,124,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(105,219,124,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
            >
              {icon}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-grey-300 font-light max-w-3xl mx-auto"
            >
              {description}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="relative py-16 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Stats Bar */}
          {!loading && !error && markets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 p-6 bg-grey-900/50 border border-grey-800 rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{markets.length}</div>
                  <div className="text-sm text-grey-400">Active Markets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    ${(markets.reduce((sum, m) => sum + parseFloat(m.volume || '0'), 0) / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-grey-400">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-sm text-grey-400">Live Trading</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-grey-700 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-grey-400 text-lg">Loading {title.toLowerCase()} markets...</p>
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

          {/* Markets Grid */}
          {!loading && !error && markets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market, index) => (
                <MarketCard key={market.id} market={market} index={index} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && markets.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-grey-900 border border-grey-800 mb-6">
                <svg className="w-10 h-10 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-grey-300 mb-2">No Markets Found</h3>
              <p className="text-grey-500">Check back soon for new {title.toLowerCase()} markets.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
