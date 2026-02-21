'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useMarkets } from '@/app/contexts/MarketsContext'

export default function MarketsTestPage() {
  const { isAuthenticated, activeWallet, activeWalletData } = useAuth()
  const { balance: fcBalance, loading: fcLoading, formatFC } = useFanCredit()
  const { activeMarkets, loading: marketsLoading, placeBet, refreshMarkets } = useMarkets()
  
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState(0)
  const [betting, setBetting] = useState(false)
  const [message, setMessage] = useState('')

  const handlePlaceBet = async () => {
    if (!selectedMarket || !betAmount || parseFloat(betAmount) <= 0) {
      setMessage('❌ Please select a market and enter a valid bet amount')
      return
    }

    if (!isAuthenticated) {
      setMessage('❌ Please connect your wallet')
      return
    }

    const amount = parseFloat(betAmount)

    if (fcBalance && amount > fcBalance.available) {
      setMessage(`❌ Insufficient balance. You have ${formatFC(fcBalance.available)}`)
      return
    }

    try {
      setBetting(true)
      setMessage('⏳ Placing bet...')

      const result = await placeBet(selectedMarket, selectedOutcome, amount)

      setMessage(`✅ Bet placed! Got ${result.shares?.toFixed(2) || 'N/A'} shares`)
      setBetAmount('')
      
      // Refresh markets to see updated data
      await refreshMarkets()
    } catch (error: any) {
      console.error('Bet failed:', error)
      setMessage(`❌ Bet failed: ${error.message}`)
    } finally {
      setBetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              🎰 FanCredit Betting System
            </h1>
            <p className="text-gray-400 mb-2">
              Testing real balances and betting with production SDKs
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                Active Wallet: 
                <span className="ml-2 text-white font-semibold">
                  {activeWallet === 'alice' ? '🟣 Alice' : 
                   activeWallet === 'bob' ? '🔵 Bob' :
                   activeWallet === 'mac' ? '💻 Mac' :
                   activeWallet === 'dealer' ? '🎰 Dealer' :
                   activeWallet === 'apollo' ? '🚀 Apollo' :
                   '👤 User'}
                </span>
              </span>
              <span className="text-gray-500">
                Balance: 
                <span className="ml-2 text-purple-400 font-semibold">
                  {fcLoading ? 'Loading...' : fcBalance ? formatFC(fcBalance.available) : '0 FC'}
                </span>
              </span>
            </div>
          </motion.div>

          {!isAuthenticated && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 mb-8">
              <p className="text-yellow-300">
                ⚠️ Please sign in to place bets. Use the wallet selector in the navigation to choose an account.
              </p>
            </div>
          )}

          {/* Active Markets */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-dark-lighter rounded-lg border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Active Markets</h2>
              
              {marketsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading markets...</p>
                </div>
              ) : activeMarkets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active markets found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Create a market in the markets admin panel
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMarkets.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => setSelectedMarket(market.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedMarket === market.id
                          ? 'border-prism-teal bg-prism-teal/10'
                          : 'border-gray-700 hover:border-gray-600 bg-dark'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{market.title || market.id}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {market.description || 'No description'}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>Entry: {market.entry_fee} FC</span>
                        <span>•</span>
                        <span>Type: {market.game_type || 'N/A'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Betting Panel */}
            <div className="bg-dark-lighter rounded-lg border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Place Bet</h2>
              
              {!selectedMarket ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Select a market to place a bet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Selected Market
                    </label>
                    <div className="bg-dark border border-gray-700 rounded-lg p-3">
                      <p className="text-white font-semibold text-sm">{selectedMarket}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Outcome
                    </label>
                    <select
                      value={selectedOutcome}
                      onChange={(e) => setSelectedOutcome(parseInt(e.target.value))}
                      className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      <option value={0}>Outcome 0 (Yes)</option>
                      <option value={1}>Outcome 1 (No)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Bet Amount (FC)
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      step="1"
                      className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white"
                      disabled={betting}
                    />
                    {fcBalance && (
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {formatFC(fcBalance.available)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePlaceBet}
                    disabled={betting || !isAuthenticated || !betAmount}
                    className="w-full bg-prism-teal hover:bg-prism-teal/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                  >
                    {betting ? '⏳ Placing Bet...' : '🎰 Place Bet'}
                  </button>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${
                      message.includes('✅') 
                        ? 'bg-green-900/20 border border-green-700 text-green-300'
                        : message.includes('❌')
                        ? 'bg-red-900/20 border border-red-700 text-red-300'
                        : 'bg-gray-800 border border-gray-700 text-gray-300'
                    }`}>
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SDK Status */}
          <div className="bg-dark-lighter rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">SDK Status</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">FanCredit SDK</p>
                <p className={`font-semibold ${fcBalance ? 'text-green-400' : 'text-gray-500'}`}>
                  {fcBalance ? '✅ Connected' : '⏳ Loading...'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Markets SDK</p>
                <p className={`font-semibold ${activeMarkets.length > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  {activeMarkets.length > 0 ? `✅ ${activeMarkets.length} markets` : '⏳ Loading...'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Authentication</p>
                <p className={`font-semibold ${isAuthenticated ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isAuthenticated ? '✅ Authenticated' : '⚠️ Not signed in'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
