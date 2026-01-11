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
  const [liquidityAmount, setLiquidityAmount] = useState('')
  const [addingLiquidity, setAddingLiquidity] = useState(false)

  useEffect(() => {
    loadMarket()
  }, [slug])

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
      // Use full slug as market ID (it's the UUID)
      const response = await fetch(`http://localhost:1234/markets/${slug}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch market: ${response.status}`)
      }
      const data = await response.json()
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

  async function handleAddLiquidity() {
    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) return
    
    try {
      setAddingLiquidity(true)
      // Call L2 API to add liquidity
      const response = await fetch(`http://localhost:1234/markets/${market.id}/liquidity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(liquidityAmount),
          l2_address: activeWallet === 'alice' ? 'Alice L2 Address' : 'Bob L2 Address' // TODO: Get from context
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add liquidity: ${response.status}`)
      }
      
      setLiquidityAmount('')
      await loadMarket()
      alert('Liquidity added successfully! Market is now ACTIVE.')
    } catch (error: any) {
      alert(`Failed to add liquidity: ${error.message}`)
    } finally {
      setAddingLiquidity(false)
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="prism-card rounded-2xl p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{market.title}</h1>
                {market.description && <p className="text-gray-400 text-lg">{market.description}</p>}
              </div>
              <div className="px-4 py-2 rounded-full bg-prism-teal/20 text-prism-teal border border-prism-teal/50 text-sm font-bold">
                {market.market_status || 'ACTIVE'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-gray-500 text-sm">Total Volume</div>
                <div className="text-2xl font-bold prism-gradient-text">{parseInt(market.total_volume || 0).toLocaleString()} BB</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Bets</div>
                <div className="text-2xl font-bold text-white">{market.bet_count || 0}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Liquidity</div>
                <div className="text-2xl font-bold text-prism-gold">{parseInt(market.cpmm_pool?.total_liquidity || 0).toLocaleString()} BB</div>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white">Outcomes & Odds</h2>
            {outcomes.map((outcome: string, index: number) => {
              const probability = prices[index] || 0
              const odds = probability > 0 ? (1 / probability).toFixed(2) : '0.00'
              const isSelected = selectedOutcome === index
              return (
                <motion.div key={index} whileHover={{ scale: 1.02 }} className={`prism-card rounded-xl p-6 cursor-pointer transition-all ${isSelected ? 'border-2 border-prism-teal shadow-lg shadow-prism-teal/50' : ''}`} onClick={() => setSelectedOutcome(index)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{outcome}</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">Probability: <span className="text-prism-teal font-bold">{(probability * 100).toFixed(1)}%</span></div>
                        <div className="text-sm text-gray-400">Odds: <span className="text-prism-gold font-bold">{odds}x</span></div>
                      </div>
                    </div>
                    {isSelected && <div className="text-prism-teal"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
                  </div>
                  <div className="mt-4 h-2 bg-dark-300 rounded-full overflow-hidden"><div className="h-full prism-gradient-bg transition-all duration-500" style={{ width: `${probability * 100}%` }} /></div>
                </motion.div>
              )
            })}
          </div>
          <div>
            <div className="sticky top-24">
              <div className="prism-card rounded-xl p-6">
                {/* Show liquidity panel for PENDING markets */}
                {market.market_status?.toLowerCase() === 'pending' && (market.cpmm_pool?.total_liquidity || 0) === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-4">⏳ Market Pending</h3>
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-500 text-sm font-semibold mb-2">This market needs liquidity to become active</p>
                      <p className="text-gray-400 text-xs">Be the first liquidity provider and enable trading on this market</p>
                    </div>
                    {!isAuthenticated ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">Sign in to add liquidity</p>
                        <button className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg">Sign In</button>
                      </div>
                    ) : !isConnected ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Connecting to L2...</p>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prism-teal mx-auto mt-4"></div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-400 mb-2">Liquidity Amount (BB)</label>
                          <input 
                            type="number" 
                            value={liquidityAmount} 
                            onChange={(e) => setLiquidityAmount(e.target.value)} 
                            placeholder="1000" 
                            className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors" 
                          />
                          <p className="text-xs text-gray-500 mt-2">Minimum: 1000 BB recommended</p>
                        </div>
                        <button 
                          onClick={handleAddLiquidity} 
                          disabled={addingLiquidity || !liquidityAmount || parseFloat(liquidityAmount) <= 0} 
                          className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingLiquidity ? 'Adding Liquidity...' : `Add ${liquidityAmount || '0'} BB Liquidity`}
                        </button>
                        <div className="mt-4 text-xs text-gray-500 text-center">
                          Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Normal betting panel */}
                    <h3 className="text-xl font-bold text-white mb-4">Place Bet</h3>
                    {!isAuthenticated ? (
                      <div className="text-center py-8"><p className="text-gray-400 mb-4">Sign in to place bets</p><button className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg">Sign In</button></div>
                    ) : !isConnected ? (
                      <div className="text-center py-8"><p className="text-gray-400">Connecting to L2...</p><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prism-teal mx-auto mt-4"></div></div>
                    ) : (
                      <>
                        <div className="mb-4"><label className="block text-sm font-medium text-gray-400 mb-2">Selected Outcome</label><div className="px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white font-semibold">{outcomes[selectedOutcome]}</div></div>
                        <div className="mb-4"><label className="block text-sm font-medium text-gray-400 mb-2">Bet Amount (BB)</label><input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="100" className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors" /></div>
                        {quote && (<div className="mb-4 p-4 rounded-lg bg-dark-300 border border-prism-teal/50"><div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Estimated Shares:</span><span className="text-white font-bold">{quote.shares_to_receive?.toFixed(2)}</span></div><div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Avg Price:</span><span className="text-prism-teal font-bold">{quote.average_price?.toFixed(4)}</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">Potential Win:</span><span className="text-prism-gold font-bold">{((quote.shares_to_receive || 0) / (prices[selectedOutcome] || 1)).toFixed(2)} BB</span></div></div>)}
                        <button onClick={handlePlaceBet} disabled={betting || !betAmount || parseFloat(betAmount) <= 0} className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{betting ? 'Placing Bet...' : `Bet ${betAmount || '0'} BB`}</button>
                        <div className="mt-4 text-xs text-gray-500 text-center">Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}</div>
                      </>
                    )}
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
