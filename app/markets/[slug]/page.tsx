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
      {
        id: 'total-goals',
        type: 'Total Goals',
        question: 'Over/Under 2.5 Goals',
        options: [
          { label: 'Over 2.5', odds: 1.85, pool: 62000 },
          { label: 'Under 2.5', odds: 2.05, pool: 58000 },
        ],
        totalPool: 120000,
        description: 'Will there be more or fewer than 2.5 total goals scored in the match?'
      },
      {
        id: 'both-score',
        type: 'Both Teams to Score',
        question: 'Will both teams score?',
        options: [
          { label: 'Yes', odds: 1.75, pool: 45000 },
          { label: 'No', odds: 2.15, pool: 38000 },
        ],
        totalPool: 83000,
        description: 'Will both teams score at least one goal during the match?'
      },
      {
        id: 'first-half',
        type: 'First Half Result',
        question: 'Who leads at halftime?',
        options: [
          { label: match.homeTeam, odds: 3.2, pool: 22000 },
          { label: 'Draw', odds: 2.4, pool: 35000 },
          { label: match.awayTeam, odds: 3.5, pool: 18000 },
        ],
        totalPool: 75000,
        description: 'Predict which team will be leading at halftime (45 minutes).'
      },
      {
        id: 'correct-score',
        type: 'Correct Score',
        question: 'Exact final score',
        options: [
          { label: '1-0', odds: 8.5, pool: 8000 },
          { label: '2-0', odds: 12.0, pool: 5000 },
          { label: '2-1', odds: 9.5, pool: 7000 },
          { label: '1-1', odds: 7.0, pool: 10000 },
          { label: '0-0', odds: 11.0, pool: 6000 },
          { label: '0-1', odds: 9.0, pool: 7500 },
          { label: '0-2', odds: 14.0, pool: 4000 },
          { label: '1-2', odds: 10.5, pool: 6500 },
          { label: '3-0', odds: 18.0, pool: 3000 },
          { label: '3-1', odds: 15.0, pool: 3500 },
        ],
        totalPool: 60500,
        description: 'Predict the exact final score of the match.'
      },
      {
        id: 'cards',
        type: 'Total Cards',
        question: 'Over/Under 4.5 Cards',
        options: [
          { label: 'Over 4.5', odds: 1.95, pool: 28000 },
          { label: 'Under 4.5', odds: 1.92, pool: 29000 },
        ],
        totalPool: 57000,
        description: 'Total yellow and red cards shown by the referee (red = 2 yellows).'
      },
      {
        id: 'corners',
        type: 'Corners',
        question: 'Over/Under 9.5 Corners',
        options: [
          { label: 'Over 9.5', odds: 1.88, pool: 32000 },
          { label: 'Under 9.5', odds: 2.00, pool: 30000 },
        ],
        totalPool: 62000,
        description: 'Total number of corner kicks awarded to both teams combined.'
      },
    ]
    
    setPropBets(bets)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePlaceBet = () => {
    if (!selectedBet || !betAmount) return
    
    // TODO: Integrate with blockchain/Supabase
    console.log('Place bet:', { selectedBet, betAmount })
    alert(`Bet placed: ${selectedBet} for $${betAmount}`)
    
    // Reset
    setSelectedBet('')
    setBetAmount('')
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-2xl text-white font-bold mb-2">Match Not Found</h1>
          <p className="text-gray-400">This market does not exist or has been removed.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 prism-gradient-bg rounded-xl text-white font-semibold">
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />
      
      {/* Market Header - Professional Trading Layout */}
      <section className="relative pt-24 pb-8">
        <div className="max-w-[1600px] mx-auto px-6">
          {/* Back Button */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Matches
          </motion.a>

          {/* Two Column Layout - Match Info Left, Rules Right */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* LEFT: Match Info Card - No Border */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-200 p-6"
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
                <div className="flex flex-col gap-2">
                  <span className="px-3 py-1 bg-dark-300 text-prism-teal text-sm font-bold tracking-wide uppercase w-fit">
                    GROUP {match.group}
                  </span>
                  <span className="text-white text-xl font-bold">
                    {match.status === 'live' ? '🔴 LIVE' : formatDate(match.date)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 text-right">
                  <div className="font-semibold">{match.venue}</div>
                  <div>{match.city}, {match.country}</div>
                </div>
              </div>

              {/* Teams - Compact Layout */}
              <div className="space-y-4">
                {/* Home Team */}
                <div className="flex items-center justify-between p-4 bg-dark-300 border border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{teamFlags[match.homeTeam] || '⚽'}</div>
                    <div>
                      <div className="text-white font-bold text-2xl">{match.homeTeam}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Home</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-prism-teal text-2xl font-mono font-bold">{match.homeOdds?.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(match.homePool || 0)}</div>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between p-4 bg-dark-300 border border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{teamFlags[match.awayTeam] || '⚽'}</div>
                    <div>
                      <div className="text-white font-bold text-2xl">{match.awayTeam}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Away</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-prism-pink text-2xl font-mono font-bold">{match.awayOdds?.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(match.awayPool || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Total Pool */}
              <div className="mt-6 pt-4 border-t border-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Total Market Pool</span>
                  <span className="text-2xl font-mono font-bold text-white">
                    {formatCurrency((match.homePool || 0) + (match.drawPool || 0) + (match.awayPool || 0))}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Market Resolution Rules */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-200 border border-dark-border p-6"
            >
              <div className="flex items-start gap-3 mb-4 pb-4 border-b border-dark-border">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wide">Market Resolution Rules</h3>
                  <p className="text-xs text-gray-500 mt-1">Settlement & Verification Protocol</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="border-l-2 border-prism-teal pl-4">
                  <div className="text-white font-semibold text-xs uppercase tracking-wide mb-1">Settlement</div>
                  <p className="text-xs leading-relaxed">All bets settled based on official FIFA result after 90 minutes of play plus stoppage time.</p>
                </div>
                
                <div className="border-l-2 border-prism-purple pl-4">
                  <div className="text-white font-semibold text-xs uppercase tracking-wide mb-1">Extra Time & Penalties</div>
                  <p className="text-xs leading-relaxed">Do NOT count towards settlement unless market specifically includes them.</p>
                </div>
                
                <div className="border-l-2 border-prism-pink pl-4">
                  <div className="text-white font-semibold text-xs uppercase tracking-wide mb-1">Data Source</div>
                  <p className="text-xs leading-relaxed">Results verified through FIFA official match reports and confirmed by oracle network.</p>
                </div>
                
                <div className="border-l-2 border-prism-gold pl-4">
                  <div className="text-white font-semibold text-xs uppercase tracking-wide mb-1">Payout</div>
                  <p className="text-xs leading-relaxed">Winners receive proportional share of total pool based on bet size. Prism takes 2% protocol fee.</p>
                </div>
                
                <div className="border-l-2 border-prism-red pl-4">
                  <div className="text-white font-semibold text-xs uppercase tracking-wide mb-1">Void Markets</div>
                  <p className="text-xs leading-relaxed">If match is postponed or cancelled, all bets are refunded in full.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Prop Bets Section - Professional Trading Grid */}
      <section className="py-8 bg-dark-100">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
              Available <span className="text-prism-teal">Markets</span>
            </h2>
            <p className="text-sm text-gray-400">{propBets.length} betting markets • Click to select</p>
          </div>

          {/* Prop Bets Grid - Sharp Corners, Professional Look */}
          <div className="grid lg:grid-cols-2 gap-4">
            {propBets.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-200 border border-dark-border p-5"
              >
                {/* Header */}
                <div className="mb-4 pb-3 border-b border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-prism-teal font-bold uppercase tracking-wider">{bet.type}</div>
                    <div className="text-xs text-gray-500 font-mono">{formatCurrency(bet.totalPool)}</div>
                  </div>
                  <h3 className="text-base font-bold text-white">{bet.question}</h3>
                  {bet.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{bet.description}</p>
                  )}
                </div>

                {/* Options - Sharp Corners */}
                <div className="space-y-2">
                  {bet.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedBet(`${bet.id}:${option.label}`)}
                      className={`w-full p-3 border transition-all ${
                        selectedBet === `${bet.id}:${option.label}`
                          ? 'border-prism-teal bg-prism-teal/10'
                          : 'border-dark-border hover:border-dark-300 bg-dark-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-white font-semibold text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">
                            {formatCurrency(option.pool)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold font-mono text-white">
                            {option.odds.toFixed(2)}
                          </div>
                          {selectedBet === `${bet.id}:${option.label}` && (
                            <div className="text-xs text-prism-teal mt-0.5 font-bold">✓ ACTIVE</div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bet Placement Sticky Footer - Professional Trading Interface */}
      {selectedBet && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-dark-200 border-t-2 prism-border shadow-2xl z-40"
        >
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Selected Bet Info */}
              <div className="flex-1">
                <div className="text-sm text-gray-400">Selected Bet</div>
                <div className="text-white font-bold">{selectedBet.split(':')[1]}</div>
                <div className="text-xs text-gray-500">{propBets.find(b => selectedBet.startsWith(b.id))?.question}</div>
              </div>

              {/* Bet Amount Input */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Bet Amount</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-4 py-3 bg-dark-300 border border-dark-border rounded-xl text-white font-semibold focus:outline-none focus:border-prism-teal"
                  />
                </div>

                {betAmount && (
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Potential Win</div>
                    <div className="text-lg font-bold prism-gradient-text">
                      ${(parseFloat(betAmount) * (propBets.find(b => selectedBet.startsWith(b.id))?.options.find(o => selectedBet.includes(o.label))?.odds || 1)).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Place Bet Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlaceBet}
                  disabled={!betAmount || parseFloat(betAmount) <= 0}
                  className="px-8 py-3 rounded-xl font-bold text-white prism-gradient-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Bet
                </motion.button>

                {/* Cancel */}
                <button
                  onClick={() => {
                    setSelectedBet('')
                    setBetAmount('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <Footer />
    </div>
  )
}
