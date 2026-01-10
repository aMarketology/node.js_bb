'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import BettingInterface from '@/app/components/BettingInterface'
import { checkL2Status, type PropBet } from '@/lib/l2-markets'
import { motion } from 'framer-motion'

export default function TestBettingPage() {
  const [l2Status, setL2Status] = useState<boolean | null>(null)
  const [selectedPropBet, setSelectedPropBet] = useState<number>(0)

  // Test prop bets
  const testPropBets: PropBet[] = [
    {
      id: 'prop-001-1',
      match_id: 'wc2026-001',
      type: 'player',
      question: 'Will Santiago Giménez score in the first 15 minutes?',
      outcomes: ['Yes', 'No'],
      outcome_prices: ['0.15', '0.85'],
      player: 'Santiago Giménez',
      team: 'Mexico',
      liquidity: 5000,
      volume: 1200,
      status: 'active'
    },
    {
      id: 'prop-001-2',
      match_id: 'wc2026-001',
      type: 'game',
      question: 'Total goals Over/Under 2.5',
      outcomes: ['Over', 'Under'],
      outcome_prices: ['0.58', '0.42'],
      liquidity: 10000,
      volume: 3500,
      status: 'active'
    },
    {
      id: 'prop-001-3',
      match_id: 'wc2026-001',
      type: 'game',
      question: 'Both teams to score?',
      outcomes: ['Yes', 'No'],
      outcome_prices: ['0.62', '0.38'],
      liquidity: 7500,
      volume: 2100,
      status: 'active'
    }
  ]

  useEffect(() => {
    checkL2Status().then(setL2Status)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navigation />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="prism-gradient-text">BlackBook Markets</span>
            </h1>
            <p className="text-xl text-gray-300">
              Polymarket-style prediction markets on custom blockchain
            </p>
            
            {/* L2 Status */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-dark-200 border border-dark-border rounded-full">
              <div className={`w-2 h-2 rounded-full ${l2Status ? 'bg-green-400' : l2Status === false ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
              <span className="text-sm text-gray-300">
                L2 Server: {l2Status === null ? 'Checking...' : l2Status ? 'Online' : 'Offline'}
              </span>
            </div>
          </motion.div>

          {/* Setup Instructions */}
          {l2Status === false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500 rounded-2xl"
            >
              <h3 className="text-lg font-bold text-yellow-500 mb-3">🚀 Start the L2 Server</h3>
              <p className="text-gray-300 mb-4">
                To enable live betting, start the L2 Markets server in a new terminal:
              </p>
              <code className="block p-4 bg-dark-200 border border-dark-border rounded-xl text-prism-teal font-mono">
                npm run l2
              </code>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Prop Bets List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                Mexico 🇲🇽 vs Canada 🇨🇦
                <span className="block text-sm text-gray-400 font-normal mt-1">
                  Estadio Azteca · June 11, 2026 · 7:00 PM
                </span>
              </h2>

              {testPropBets.map((propBet, index) => (
                <motion.div
                  key={propBet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPropBet(index)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPropBet === index
                      ? 'bg-prism-teal/10 border-prism-teal'
                      : 'bg-dark-200 border-dark-border hover:border-prism-teal/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="inline-block px-2 py-1 bg-prism-purple/20 border border-prism-purple rounded text-xs text-prism-purple font-semibold mb-2">
                        {propBet.type.toUpperCase()}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{propBet.question}</h3>
                      {propBet.player && (
                        <p className="text-sm text-gray-400">
                          Player: {propBet.player} ({propBet.team})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Odds Display */}
                  <div className="flex gap-2">
                    {propBet.outcomes.map((outcome, i) => (
                      <div key={outcome} className="flex-1 p-3 bg-dark rounded-lg text-center">
                        <div className="text-xs text-gray-400">{outcome}</div>
                        <div className="text-xl font-bold text-prism-teal">
                          {(parseFloat(propBet.outcome_prices[i]) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between mt-4 text-xs text-gray-400">
                    <span>Volume: {propBet.volume.toLocaleString()} BB</span>
                    <span>Liquidity: {propBet.liquidity.toLocaleString()} BB</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Betting Interface */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-dark-200 border border-dark-border rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Place Bet</h3>
                  <BettingInterface 
                    propBet={testPropBets[selectedPropBet]}
                    onBetPlaced={() => {
                      console.log('Bet placed!')
                      // In real app, refresh market data
                    }}
                  />
                </motion.div>

                {/* Info */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 p-4 bg-dark-200 border border-prism-purple rounded-xl"
                >
                  <h4 className="font-bold text-white mb-2">How it works</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>✅ Connect your BlackBook wallet</li>
                    <li>📊 Select an outcome and enter amount</li>
                    <li>💰 Buy tokens at current market price</li>
                    <li>🏆 Win if your prediction is correct</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="p-6 bg-dark-200 border border-prism-teal rounded-xl">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Execution</h3>
              <p className="text-sm text-gray-400">
                Powered by BlackBook L1 blockchain - trades execute in milliseconds
              </p>
            </div>

            <div className="p-6 bg-dark-200 border border-prism-purple rounded-xl">
              <div className="text-3xl mb-3">💧</div>
              <h3 className="text-lg font-bold text-white mb-2">Deep Liquidity</h3>
              <p className="text-sm text-gray-400">
                Automated market maker ensures you can always trade at fair prices
              </p>
            </div>

            <div className="p-6 bg-dark-200 border border-prism-gold rounded-xl">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-white mb-2">Self-Custodial</h3>
              <p className="text-sm text-gray-400">
                Your keys, your crypto - fully non-custodial with Ed25519 signatures
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
