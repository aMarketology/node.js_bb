'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useMarkets } from '@/app/contexts/MarketsContext'
import { useCreditPrediction } from '@/app/contexts/CreditPredictionContext'
import { useAuth } from '@/app/contexts/AuthContext'

export default function MarketDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  // Use MarketsSDK for betting and liquidity operations
  const {
    getMarket: sdkGetMarket,
    getQuote: sdkGetQuote,
    placeBet: sdkPlaceBet,
    sellShares: sdkSellShares,
    getPosition: sdkGetPosition,
    isReady: marketsReady
  } = useMarkets()
  
  // Use CreditPrediction for credit-based betting operations
  const { 
    isConnected: creditConnected,
    balance,
    activeSession,
    hasActiveCredit,
    openCredit,
    settleCredit,
    placeBet: creditPlaceBet,
    getQuote: creditGetQuote,
    sellPosition,
    getPosition: creditGetPosition,
    refreshBalance
  } = useCreditPrediction()
  
  const { isAuthenticated, activeWallet } = useAuth()
  
  // Combined connection status
  const isConnected = creditConnected || marketsReady
  
  const [market, setMarket] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0)
  const [betAmount, setBetAmount] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [betting, setBetting] = useState(false)
  const [liquidityAmount, setLiquidityAmount] = useState('')
  const [addingLiquidity, setAddingLiquidity] = useState(false)
  const [showLiquidityPanel, setShowLiquidityPanel] = useState(false)
  
  // Credit Line state
  const [creditAmount, setCreditAmount] = useState('1000')
  const [openingCredit, setOpeningCredit] = useState(false)
  const [settlingCredit, setSettlingCredit] = useState(false)
  const [showCreditPanel, setShowCreditPanel] = useState(false)

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

  // Debug L2 connection status
  useEffect(() => {
    console.log('🔍 Market Detail - Connection Status:', {
      isAuthenticated,
      isConnected,
      activeWallet,
      hasMarket: !!market,
      marketId: market?.id
    })
  }, [isAuthenticated, isConnected, activeWallet, market])

  async function loadMarket() {
    try {
      setLoading(true)
      
      // Try to use MarketsSDK if available, otherwise fallback to direct API
      if (marketsReady) {
        const data = await sdkGetMarket(slug)
        if (data) {
          setMarket(data)
        } else {
          throw new Error('Market not found')
        }
      } else {
        // Fallback to direct L2 API call
        const response = await fetch(`http://localhost:1234/markets/${slug}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch market: ${response.status}`)
        }
        const data = await response.json()
        setMarket(data)
      }
    } catch (error: any) {
      console.error('Failed to load market:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPosition() {
    try {
      // Use MarketsSDK if available and not in credit session, otherwise use credit
      if (marketsReady && !hasActiveCredit) {
        const pos = await sdkGetPosition(market.id)
        setPosition(pos)
      } else {
        const pos = creditGetPosition(market.id)
        setPosition(pos)
      }
    } catch (error) {
      console.log('No position in this market')
    }
  }

  async function fetchQuote() {
    try {
      const amount = parseFloat(betAmount)
      
      // Use MarketsSDK if available and user has L2 balance, otherwise use credit
      if (marketsReady && !hasActiveCredit) {
        const q = await sdkGetQuote(market.id, selectedOutcome, amount)
        setQuote(q)
      } else {
        // Use credit prediction for quote
        const q = await creditGetQuote(market.id, selectedOutcome, amount)
        setQuote(q)
      }
    } catch (error) {
      console.error('Failed to get quote:', error)
    }
  }

  // Credit Line handlers
  async function handleOpenCredit() {
    if (!creditAmount || parseFloat(creditAmount) <= 0) return
    
    try {
      setOpeningCredit(true)
      const result = await openCredit(parseFloat(creditAmount))
      if (result.success) {
        alert(`✅ Credit line opened! Virtual balance: ${result.creditAmount} BB`)
        setShowCreditPanel(false)
      } else {
        alert(`❌ Failed: ${result.message}`)
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setOpeningCredit(false)
    }
  }

  async function handleSettleCredit() {
    try {
      setSettlingCredit(true)
      const result = await settleCredit()
      if (result.success) {
        const pnlDisplay = result.pnl >= 0 ? `+${result.pnl}` : result.pnl
        alert(`✅ Credit settled! P&L: ${pnlDisplay} BB`)
      } else {
        alert(`❌ Failed: ${result.message}`)
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setSettlingCredit(false)
    }
  }

  async function handlePlaceBet() {
    if (!betAmount || parseFloat(betAmount) <= 0) return
    
    try {
      setBetting(true)
      
      // Use MarketsSDK if available and user has L2 balance, otherwise use credit
      if (marketsReady && !hasActiveCredit) {
        const result = await sdkPlaceBet(market.id, selectedOutcome, parseFloat(betAmount))
        
        if (result.success) {
          setBetAmount('')
          setQuote(null)
          await loadMarket()
          await loadPosition()
          alert(`✅ Bet placed! Got ${result.shares?.toFixed(2) || 'N/A'} shares`)
        } else {
          alert('❌ Failed to place bet')
        }
      } else {
        // Use credit prediction for betting
        const result = await creditPlaceBet(market.id, selectedOutcome, parseFloat(betAmount))
        
        if (result.success) {
          setBetAmount('')
          setQuote(null)
          await loadMarket()
          await loadPosition()
          await refreshBalance()
          alert(`✅ Bet placed! Got ${result.shares?.toFixed(2) || 'N/A'} shares`)
        } else {
          alert('❌ Failed to place bet')
        }
      }
    } catch (error: any) {
      alert(`❌ Failed to place bet: ${error.message}`)
    } finally {
      setBetting(false)
    }
  }

  async function handleSellShares(outcome: number, shares: number) {
    try {
      // Use MarketsSDK if available and not in credit session, otherwise use credit
      if (marketsReady && !hasActiveCredit) {
        const result = await sdkSellShares(market.id, outcome, shares)
        if (result.success) {
          await loadMarket()
          await loadPosition()
          alert('✅ Shares sold successfully!')
        }
      } else {
        const result = await sellPosition(market.id, outcome, shares)
        if (result.success) {
          await loadMarket()
          await loadPosition()
          await refreshBalance()
          alert('✅ Shares sold successfully!')
        }
      }
    } catch (error: any) {
      alert(`❌ Failed to sell shares: ${error.message}`)
    }
  }

  async function handleAddLiquidity() {
    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) return
    
    try {
      setAddingLiquidity(true)
      // TODO: Implement liquidity through Markets SDK or direct L2 API call
      alert('⚠️ Liquidity addition coming soon! Use the L2 server directly for now.')
      setLiquidityAmount('')
      await loadMarket()
    } catch (error: any) {
      alert(`❌ Failed to add liquidity: ${error.message}`)
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
        {/* Credit Session Banner */}
        {hasActiveCredit && activeSession && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">Credit Session Active</h3>
                  <p className="text-gray-400 text-sm">
                    Virtual Balance: <span className="text-purple-400 font-bold">{(activeSession.virtualBalance || activeSession.creditAmount || 0).toLocaleString()} BB</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleSettleCredit}
                disabled={settlingCredit}
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {settlingCredit ? 'Settling...' : 'Settle & Close'}
              </button>
            </div>
          </motion.div>
        )}

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
            <div className="grid grid-cols-4 gap-6 mt-6">
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
              <div>
                <div className="text-gray-500 text-sm">Your Balance</div>
                <div className="text-2xl font-bold text-purple-400">{balance.available.toLocaleString()} BB</div>
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
            <div className="sticky top-24 space-y-4">
              {/* Credit Line Card - Show when authenticated but no active credit */}
              {isAuthenticated && isConnected && !hasActiveCredit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="prism-card rounded-xl p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">💳</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">Credit Line Trading</h3>
                      <p className="text-gray-400 text-xs">Trade with virtual balance, settle later</p>
                    </div>
                  </div>

                  {showCreditPanel ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Credit Amount (BB)</label>
                        <input 
                          type="number" 
                          value={creditAmount} 
                          onChange={(e) => setCreditAmount(e.target.value)} 
                          placeholder="1000" 
                          className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                        />
                      </div>
                      
                      <div className="mb-4 p-3 bg-purple-500/10 rounded-lg text-xs text-gray-400">
                        <p className="mb-1">🔮 Get virtual balance instantly</p>
                        <p className="mb-1">📈 Trade freely during session</p>
                        <p>💰 Settle P&L when ready</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCreditPanel(false)}
                          className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleOpenCredit}
                          disabled={openingCredit || !creditAmount}
                          className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {openingCredit ? 'Opening...' : 'Open Credit'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowCreditPanel(true)}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-purple-300 font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                    >
                      Open Credit Line →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Main Betting/Liquidity Card */}
              <div className="prism-card rounded-xl p-6">
                {/* Show liquidity panel for zero-liquidity markets */}
                {(market.cpmm_pool?.total_liquidity || 0) === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-4">🚀 Initialize Market</h3>
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-500 text-sm font-semibold mb-2">This market needs initial liquidity</p>
                      <p className="text-gray-400 text-xs">Be the first liquidity provider and earn fees from all trades</p>
                    </div>
                    {!isAuthenticated ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">Sign in to add liquidity</p>
                        <button 
                          onClick={() => window.location.href = '/'}
                          className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg"
                        >
                          Sign In
                        </button>
                      </div>
                    ) : !isConnected ? (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal mx-auto"></div>
                        </div>
                        <p className="text-gray-400 mb-2">Connecting to L2...</p>
                        <p className="text-xs text-gray-500">
                          Active Wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : activeWallet || 'None'}
                        </p>
                        {activeWallet === 'user' && (
                          <p className="text-xs text-yellow-500 mt-2">
                            ⚠️ User wallets not yet supported. Please use Alice or Bob test accounts.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-400 mb-2">Initial Liquidity Amount (BB)</label>
                          <input 
                            type="number" 
                            value={liquidityAmount} 
                            onChange={(e) => setLiquidityAmount(e.target.value)} 
                            placeholder="1000" 
                            className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors" 
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Minimum: 100 BB to activate • Recommended: 1000+ BB for better trading
                          </p>
                        </div>
                        
                        <div className="mb-6 p-4 bg-prism-teal/10 border border-prism-teal/30 rounded-lg">
                          <h4 className="text-white font-semibold text-sm mb-2">💰 Benefits</h4>
                          <ul className="text-xs text-gray-400 space-y-1">
                            <li>• Earn 2% fee on all trades</li>
                            <li>• Initial LP shares at fair price</li>
                            <li>• Remove liquidity anytime</li>
                          </ul>
                        </div>
                        
                        <button 
                          onClick={handleAddLiquidity} 
                          disabled={addingLiquidity || !liquidityAmount || parseFloat(liquidityAmount) < 100} 
                          className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingLiquidity ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                              Initializing Market...
                            </span>
                          ) : (
                            `Initialize with ${liquidityAmount || '0'} BB`
                          )}
                        </button>
                        
                        <div className="mt-4 text-xs text-gray-500 text-center">
                          Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Tabs for Bet vs Liquidity */}
                    <div className="flex gap-2 mb-6">
                      <button 
                        onClick={() => setShowLiquidityPanel(false)}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${!showLiquidityPanel ? 'bg-prism-teal text-white' : 'bg-dark-300 text-gray-400 hover:text-white'}`}
                      >
                        🎲 Bet
                      </button>
                      <button 
                        onClick={() => setShowLiquidityPanel(true)}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${showLiquidityPanel ? 'bg-prism-gold text-dark' : 'bg-dark-300 text-gray-400 hover:text-white'}`}
                      >
                        💧 Liquidity
                      </button>
                    </div>

                    {!showLiquidityPanel ? (
                      <>
                        {/* Betting Panel */}
                        <h3 className="text-xl font-bold text-white mb-4">Place Bet</h3>
                        
                        {/* Credit indicator if active */}
                        {hasActiveCredit && (
                          <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span>💳</span>
                              <span className="text-purple-300 text-sm font-semibold">Using Credit Line</span>
                            </div>
                          </div>
                        )}
                        
                        {!isAuthenticated ? (
                          <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">Sign in to place bets</p>
                            <button 
                              onClick={() => window.location.href = '/'}
                              className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg"
                            >
                              Sign In
                            </button>
                          </div>
                        ) : !isConnected ? (
                          <div className="text-center py-8">
                            <div className="mb-4">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal mx-auto"></div>
                            </div>
                            <p className="text-gray-400 mb-2">Connecting to L2...</p>
                            <p className="text-xs text-gray-500">
                              Active Wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : activeWallet || 'None'}
                            </p>
                            {activeWallet === 'user' && (
                              <p className="text-xs text-yellow-500 mt-2">
                                ⚠️ User wallets not yet supported. Please use Alice or Bob test accounts.
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-400 mb-2">Selected Outcome</label>
                              <div className="px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white font-semibold">
                                {outcomes[selectedOutcome]}
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-400 mb-2">Bet Amount (BB)</label>
                              <input 
                                type="number" 
                                value={betAmount} 
                                onChange={(e) => setBetAmount(e.target.value)} 
                                placeholder="100" 
                                className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors" 
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Available: {balance.available.toLocaleString()} BB
                                {hasActiveCredit && <span className="text-purple-400 ml-2">(Credit)</span>}
                              </p>
                            </div>
                            
                            {quote && (
                              <div className="mb-4 p-4 rounded-lg bg-dark-300 border border-prism-teal/50">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-400">Estimated Shares:</span>
                                  <span className="text-white font-bold">{(quote.shares || quote.shares_to_receive || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-400">Avg Price:</span>
                                  <span className="text-prism-teal font-bold">{(quote.avgPrice || quote.average_price || 0).toFixed(4)}</span>
                                </div>
                                {quote.priceImpact !== undefined && (
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Price Impact:</span>
                                    <span className={`font-bold ${(quote.priceImpact || 0) > 0.05 ? 'text-red-400' : 'text-green-400'}`}>
                                      {((quote.priceImpact || 0) * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Potential Win:</span>
                                  <span className="text-prism-gold font-bold">{(quote.shares || quote.shares_to_receive || 0).toFixed(2)} BB</span>
                                </div>
                              </div>
                            )}
                            
                            <button 
                              onClick={handlePlaceBet} 
                              disabled={betting || !betAmount || parseFloat(betAmount) <= 0} 
                              className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {betting ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                  Placing Bet...
                                </span>
                              ) : (
                                `Bet ${betAmount || '0'} BB`
                              )}
                            </button>
                            
                            <div className="mt-4 text-xs text-gray-500 text-center">
                              Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Liquidity Panel */}
                        <h3 className="text-xl font-bold text-white mb-4">💧 Add Liquidity</h3>
                        {!isAuthenticated ? (
                          <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">Sign in to add liquidity</p>
                            <button 
                              onClick={() => window.location.href = '/'}
                              className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg"
                            >
                              Sign In
                            </button>
                          </div>
                        ) : !isConnected ? (
                          <div className="text-center py-8">
                            <div className="mb-4">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-gold mx-auto"></div>
                            </div>
                            <p className="text-gray-400 mb-2">Connecting to L2...</p>
                            <p className="text-xs text-gray-500">
                              Active Wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : activeWallet || 'None'}
                            </p>
                            {activeWallet === 'user' && (
                              <p className="text-xs text-yellow-500 mt-2">
                                ⚠️ User wallets not yet supported. Please use Alice or Bob test accounts.
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="mb-6 p-4 bg-prism-gold/10 border border-prism-gold/30 rounded-lg">
                              <p className="text-prism-gold text-sm font-semibold mb-2">💰 Earn Trading Fees</p>
                              <p className="text-gray-400 text-xs">Liquidity providers earn 2% of all trading volume. Your LP shares can be withdrawn anytime.</p>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-400 mb-2">Liquidity Amount (BB)</label>
                              <input 
                                type="number" 
                                value={liquidityAmount} 
                                onChange={(e) => setLiquidityAmount(e.target.value)} 
                                placeholder="500" 
                                className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-gold focus:ring-1 focus:ring-prism-gold transition-colors" 
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                Current pool: {parseInt(market.cpmm_pool?.total_liquidity || 0).toLocaleString()} BB
                              </p>
                            </div>

                            {liquidityAmount && parseFloat(liquidityAmount) > 0 && (
                              <div className="mb-4 p-4 rounded-lg bg-dark-300 border border-prism-gold/50">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-400">Your LP Shares:</span>
                                  <span className="text-white font-bold">{parseFloat(liquidityAmount).toFixed(2)} shares</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-400">Pool After:</span>
                                  <span className="text-prism-gold font-bold">{(parseInt(market.cpmm_pool?.total_liquidity || 0) + parseFloat(liquidityAmount)).toLocaleString()} BB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Your Pool Share:</span>
                                  <span className="text-prism-teal font-bold">
                                    {((parseFloat(liquidityAmount) / (parseInt(market.cpmm_pool?.total_liquidity || 0) + parseFloat(liquidityAmount))) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <button 
                              onClick={handleAddLiquidity} 
                              disabled={addingLiquidity || !liquidityAmount || parseFloat(liquidityAmount) <= 0} 
                              className="w-full px-6 py-4 rounded-xl font-semibold text-dark bg-prism-gold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingLiquidity ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-dark"></div>
                                  Adding Liquidity...
                                </span>
                              ) : (
                                `Add ${liquidityAmount || '0'} BB Liquidity`
                              )}
                            </button>
                            
                            <div className="mt-4 text-xs text-gray-500 text-center">
                              Using wallet: {activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 Your Wallet'}
                            </div>
                          </>
                        )}
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
