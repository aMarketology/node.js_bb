'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useLayer2 } from '@/app/contexts/Layer2Context'
import { useAuth } from '@/app/contexts/AuthContext'

export default function MarketDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const { getMarket, getPosition, placeBet, getQuote, sellShares, isConnected } = useLayer2()
  const { isAuthenticated, activeWallet } = useAuth()
  
  const [market, setMarket] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0)
  const [betAmount, setBetAmount] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [betting, setBetting] = useState(false)

  useEffect(() => {
    loadMarket()
  }, [slug, isConnected])

  useEffect(() => {
    if (isAuthenticated && market) {
      loadPosition()
    }
  }, [isAuthenticated, market])

  useEffect(() => {
    if (betAmount && market && parseFloat(betAmount) > 0) {
      fetchQuote()
    } else {
      setQuote(null)
    }
  }, [betAmount, selectedOutcome, market])

  async function loadMarket() {
    try {
      setLoading(true)
      // Get market ID from slug (slug format: team1-vs-team2-marketId)
      const marketId = slug.split('-').pop()
      const data = await getMarket(marketId!)
      setMarket(data)
    } catch (error: any) {
      console.error('Failed to load market:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPosition() {
    try {
      const pos = await getPosition(market.id)
      setPosition(pos)
    } catch (error) {
      console.log('No position in this market')
    }
  }

  async function fetchQuote() {
    try {
      const amount = parseFloat(betAmount)
      const q = await getQuote(market.id, selectedOutcome, amount)
      setQuote(q)
    } catch (error) {
      console.error('Failed to get quote:', error)
    }
  }

  async function handlePlaceBet() {
    if (!betAmount || parseFloat(betAmount) <= 0) return
    
    try {
      setBetting(true)
      await placeBet(market.id, selectedOutcome, parseFloat(betAmount))
      setBetAmount('')
      setQuote(null)
      await loadMarket()
      await loadPosition()
      alert('Bet placed successfully!')
    } catch (error: any) {
      alert(`Failed to place bet: ${error.message}`)
    } finally {
      setBetting(false)
    }
  }

  async function handleSellShares(outcome: number, shares: number) {
    try {
      await sellShares(market.id, outcome, shares)
      await loadMarket()
      await loadPosition()
      alert('Shares sold successfully!')
    } catch (error: any) {
      alert(`Failed to sell shares: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal"></div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Market Not Found</h1>
          <p className="text-gray-400">This market does not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const prices = market.cpmm_pool?.current_prices || []
  const outcomes = market.options || market.outcomes || []

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        {/* Market Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="prism-card rounded-2xl p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{market.title}</h1>
                {market.description && (
                  <p className="text-gray-400 text-lg">{market.description}</p>
                )}
              </div>
              <div className="px-4 py-2 rounded-full bg-prism-teal/20 text-prism-teal border border-prism-teal/50 text-sm font-bold">
                {market.market_status || 'ACTIVE'}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-gray-500 text-sm">Total Volume</div>
                <div className="text-2xl font-bold prism-gradient-text">
                  {parseInt(market.total_volume || 0).toLocaleString()} BB
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Bets</div>
                <div className="text-2xl font-bold text-white">{market.bet_count || 0}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Liquidity</div>
                <div className="text-2xl font-bold text-prism-gold">
                  {parseInt(market.cpmm_pool?.total_liquidity || 0).toLocaleString()} BB
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Outcomes & Odds */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white">Outcomes & Odds</h2>
            
            {outcomes.map((outcome: string, index: number) => {
              const probability = prices[index] || 0
              const odds = probability > 0 ? (1 / probability).toFixed(2) : '0.00'
              const isSelected = selectedOutcome === index

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className={`prism-card rounded-xl p-6 cursor-pointer transition-all ${
                    isSelected ? 'border-2 border-prism-teal shadow-lg shadow-prism-teal/50' : ''
                  }`}
                  onClick={() => setSelectedOutcome(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{outcome}</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">
                          Probability: <span className="text-prism-teal font-bold">{(probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Odds: <span className="text-prism-gold font-bold">{odds}x</span>
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="text-prism-teal">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-4 h-2 bg-dark-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full prism-gradient-bg transition-all duration-500"
                      style={{ width: `${probability * 100}%` }}
                    />
                  </div>
                </motion.div>
              )
            })}

            {/* Your Positions */}
            {position && position.positions && position.positions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Your Positions</h2>
                <div className="prism-card rounded-xl p-6">
                  {position.positions.map((pos: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-dark-border last:border-0">
                      <div>
                        <div className="font-bold text-white">{outcomes[pos.outcome]}</div>
                        <div className="text-sm text-gray-400">{pos.shares} shares</div>
                      </div>
                      <button
                        onClick={() => handleSellShares(pos.outcome, pos.shares)}
                        className="px-4 py-2 rounded-lg bg-prism-red/20 text-prism-red border border-prism-red/50 hover:bg-prism-red/30 transition-colors text-sm font-semibold"
                      >
                        Sell All
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Betting Interface */}
          <div>
            <div className="sticky top-24">
              <div className="prism-card rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Place Bet</h3>

                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Sign in to place bets</p>
                    <button className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg">
                      Sign In
                    </button>
                  </div>
                ) : !isConnected ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Connecting to L2...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prism-teal mx-auto mt-4"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Selected Outcome
                      </label>
                      <div className="px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white font-semibold">
                        {outcomes[selectedOutcome]}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Bet Amount (BB)
                      </label>
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                      />
                    </div>

                    {quote && (
                      <div className="mb-4 p-4 rounded-lg bg-dark-300 border border-prism-teal/50">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Estimated Shares:</span>
                          <span className="text-white font-bold">{quote.shares_to_receive?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Avg Price:</span>
                          <span className="text-prism-teal font-bold">{quote.average_price?.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Potential Win:</span>
                          <span className="text-prism-gold font-bold">
                            {((quote.shares_to_receive || 0) / (prices[selectedOutcome] || 1)).toFixed(2)} BB
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handlePlaceBet}
                      disabled={betting || !betAmount || parseFloat(betAmount) <= 0}
                      className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {betting ? 'Placing Bet...' : `Bet ${betAmount || '0'} BB`}
                    </button>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                      Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
