'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useLayer2 } from '@/app/contexts/Layer2Context'
import { useAuth } from '@/app/contexts/AuthContext'

export default function OraclePage() {
  const { 
    resolveMarket, 
    signResolution, 
    proposeResolution, 
    disputeResolution, 
    voteOnDispute,
    getOracleStats,
    listOracles,
    isConnected 
  } = useLayer2()
  const { isAuthenticated, activeWallet } = useAuth()
  
  const [pendingMarkets, setPendingMarkets] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [oracleStats, setOracleStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Only allow Alice and Bob to access oracle functions (test accounts)
  const isOracle = activeWallet === 'alice' || activeWallet === 'bob'

  useEffect(() => {
    if (isAuthenticated && isConnected && isOracle) {
      loadOracleData()
    }
  }, [isAuthenticated, isConnected, isOracle])

  async function loadOracleData() {
    try {
      setLoading(true)
      
      // Get markets pending resolution
      const res = await fetch('http://localhost:1234/markets?status=pending_resolution')
      if (res.ok) {
        const data = await res.json()
        setPendingMarkets(data.markets || [])
      }

      // Get active disputes
      const disputesRes = await fetch('http://localhost:1234/disputes')
      if (disputesRes.ok) {
        const data = await disputesRes.json()
        setDisputes(data.disputes || [])
      }

      // Get oracle stats for this account
      const stats = await getOracleStats()
      setOracleStats(stats)
      
    } catch (error) {
      console.error('Failed to load oracle data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolveMarket(marketId: string, winningOutcome: number, evidence: string) {
    try {
      await resolveMarket(marketId, winningOutcome, evidence)
      await loadOracleData()
      alert('Market resolved successfully!')
    } catch (error: any) {
      alert(`Failed to resolve market: ${error.message}`)
    }
  }

  async function handleSignResolution(marketId: string) {
    try {
      await signResolution(marketId)
      await loadOracleData()
      alert('Resolution signed successfully!')
    } catch (error: any) {
      alert(`Failed to sign resolution: ${error.message}`)
    }
  }

  async function handleDispute(marketId: string, reason: string) {
    try {
      await disputeResolution(marketId, reason)
      await loadOracleData()
      alert('Dispute submitted successfully!')
    } catch (error: any) {
      alert(`Failed to dispute: ${error.message}`)
    }
  }

  async function handleVote(disputeId: string, vote: boolean) {
    try {
      await voteOnDispute(disputeId, vote)
      await loadOracleData()
      alert('Vote recorded successfully!')
    } catch (error: any) {
      alert(`Failed to vote: ${error.message}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Oracle Dashboard</h1>
          <p className="text-gray-400 mb-8">Sign in to access oracle functions</p>
          <button className="px-8 py-4 rounded-xl font-semibold text-white prism-gradient-bg">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!isOracle) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 text-center max-w-2xl mx-auto px-6">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-4xl font-bold text-white mb-4">Oracle Access Required</h1>
          <p className="text-gray-400 mb-8">
            Only authorized oracle accounts can access this dashboard. Switch to Alice or Bob's wallet to resolve markets and manage disputes.
          </p>
          <div className="prism-card rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">Current Wallet</div>
            <div className="font-bold text-white text-lg">👤 Your Wallet</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !isConnected) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">
              {activeWallet === 'alice' ? '🟣' : '🔵'}
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Oracle Dashboard</h1>
              <p className="text-gray-400">
                Resolve markets and manage disputes as {activeWallet === 'alice' ? 'Alice' : 'Bob'}
              </p>
            </div>
          </div>

          {/* Oracle Stats */}
          {oracleStats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="prism-card rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Markets Resolved</div>
                <div className="text-3xl font-bold text-prism-teal">{oracleStats.markets_resolved || 0}</div>
              </div>
              <div className="prism-card rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Reputation</div>
                <div className="text-3xl font-bold text-prism-gold">{oracleStats.reputation || 100}</div>
              </div>
              <div className="prism-card rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Accuracy</div>
                <div className="text-3xl font-bold text-prism-purple">{oracleStats.accuracy || 100}%</div>
              </div>
              <div className="prism-card rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Active Disputes</div>
                <div className="text-3xl font-bold text-prism-red">{disputes.length}</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pending Resolutions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Markets Pending Resolution</h2>
          {pendingMarkets.length === 0 ? (
            <div className="prism-card rounded-xl p-12 text-center text-gray-400">
              No markets pending resolution
            </div>
          ) : (
            <div className="space-y-6">
              {pendingMarkets.map((market, index) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="prism-card rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{market.title}</h3>
                      {market.description && (
                        <p className="text-gray-400 text-sm">{market.description}</p>
                      )}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-prism-orange/20 text-prism-orange border border-prism-orange/50 text-xs font-bold">
                      PENDING
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-400 mb-3">Select Winning Outcome:</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(market.options || market.outcomes || []).map((outcome: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const evidence = prompt(`Resolve "${market.title}" with outcome "${outcome}"?\n\nProvide evidence URL or description:`)
                            if (evidence) handleResolveMarket(market.id, idx, evidence)
                          }}
                          className="px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white hover:border-prism-teal hover:bg-prism-teal/10 transition-colors text-left font-semibold"
                        >
                          {outcome}
                        </button>
                      ))}
                    </div>
                  </div>

                  {market.proposed_resolution && (
                    <div className="mt-4 p-4 rounded-lg bg-dark-300 border border-prism-gold/50">
                      <div className="text-sm text-gray-400 mb-2">
                        Proposed Resolution: <span className="text-white font-semibold">{market.options[market.proposed_resolution.outcome]}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Signatures: {market.proposed_resolution.signatures?.length || 0} / {market.required_signatures || 2}
                      </div>
                      <button
                        onClick={() => handleSignResolution(market.id)}
                        className="px-4 py-2 rounded-lg font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity text-sm"
                      >
                        Sign Resolution
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        const reason = prompt('Why are you disputing this resolution?')
                        if (reason) handleDispute(market.id, reason)
                      }}
                      className="px-4 py-2 rounded-lg bg-prism-red/20 text-prism-red border border-prism-red/50 hover:bg-prism-red/30 transition-colors text-sm font-semibold"
                    >
                      Dispute Resolution
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Active Disputes */}
        {disputes.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Active Disputes</h2>
            <div className="space-y-6">
              {disputes.map((dispute, index) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="prism-card rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{dispute.market_title}</h3>
                      <p className="text-gray-400 text-sm">{dispute.reason}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-prism-red/20 text-prism-red border border-prism-red/50 text-xs font-bold">
                      DISPUTED
                    </div>
                  </div>

                  <div className="mb-4 p-4 rounded-lg bg-dark-300 border border-dark-border">
                    <div className="text-sm text-gray-400 mb-2">Disputed Resolution</div>
                    <div className="text-white font-semibold">{dispute.disputed_outcome}</div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(dispute.id, true)}
                      className="flex-1 px-4 py-3 rounded-lg bg-prism-teal/20 text-prism-teal border border-prism-teal/50 hover:bg-prism-teal/30 transition-colors font-semibold"
                    >
                      ✓ Uphold Resolution
                    </button>
                    <button
                      onClick={() => handleVote(dispute.id, false)}
                      className="flex-1 px-4 py-3 rounded-lg bg-prism-red/20 text-prism-red border border-prism-red/50 hover:bg-prism-red/30 transition-colors font-semibold"
                    >
                      ✗ Support Dispute
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-dark-300">
                      <div className="text-xs text-gray-400">Uphold Votes</div>
                      <div className="text-lg font-bold text-prism-teal">{dispute.uphold_votes || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-300">
                      <div className="text-xs text-gray-400">Dispute Votes</div>
                      <div className="text-lg font-bold text-prism-red">{dispute.dispute_votes || 0}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
