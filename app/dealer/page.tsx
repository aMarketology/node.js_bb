'use client'

/**
 * Dealer Admin Page
 * Full admin access to market activation, resolution, and settings
 * Uses dealer private key from environment variable
 */

import { useState, useEffect } from 'react'
import { L2MarketsSDK } from '@/sdk/markets-sdk.js'

interface Market {
  id: string
  title: string
  description?: string
  closes_at?: string
  status?: string
  liquidity?: number
  volume?: number
  home_team?: string
  away_team?: string
  created_at?: string
}

export default function DealerPage() {
  const [sdk, setSdk] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Markets data
  const [pendingMarkets, setPendingMarkets] = useState<Market[]>([])
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState({ total: 0, activated: 0, pending: 0 })
  
  // Form states
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [initialLiquidity, setInitialLiquidity] = useState('1000')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Initialize dealer SDK
  useEffect(() => {
    const initDealer = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch dealer credentials from API (server-side only)
        const credentialsRes = await fetch('/api/dealer/credentials')
        if (!credentialsRes.ok) {
          throw new Error('Failed to get dealer credentials')
        }
        const { privateKey, address } = await credentialsRes.json()
        
        // Initialize SDK with dealer credentials
        const l2ApiUrl = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
        const dealerSDK = new L2MarketsSDK(l2ApiUrl)
        
        // Convert hex private key to bytes (Buffer for SDK compatibility)
        const privateKeyBytes = Buffer.from(
          privateKey.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
        )
        
        // Set credentials directly without authentication for local development
        dealerSDK.address = address
        dealerSDK.privateKey = privateKeyBytes
        
        console.log('✅ Dealer SDK initialized:', address)
        console.log('🔑 Using L2 API:', l2ApiUrl)
        setSdk(dealerSDK)
        
        // Load markets
        await loadMarkets(dealerSDK)
        
      } catch (err: any) {
        console.error('❌ Dealer init error:', err)
        setError(err.message || 'Failed to initialize dealer')
      } finally {
        setLoading(false)
      }
    }
    
    initDealer()
  }, [])
  
  // Load all markets (pending from Supabase, active from L2)
  const loadMarkets = async (dealerSDK?: any) => {
    try {
      const activeSdk = dealerSDK || sdk
      if (!activeSdk) return
      
      // Fetch pending markets from Supabase
      const pendingRes = await fetch('/api/dealer/pending-markets')
      const pendingData = await pendingRes.json()
      
      setPendingMarkets(pendingData.pending || [])
      setStats({
        total: pendingData.total || 0,
        activated: pendingData.activated || 0,
        pending: pendingData.pending?.length || 0
      })
      
      // Fetch active markets from L2
      const active = await activeSdk.getActiveEvents()
      setActiveMarkets(active || [])
      
      console.log(`📊 Loaded: ${pendingData.pending?.length || 0} pending, ${active?.length || 0} active`)
    } catch (err: any) {
      console.error('❌ Load markets error:', err)
    }
  }
  
  // Activate market on L2
  const handleActivateMarket = async () => {
    if (!sdk || !selectedMarket) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      
      const liquidity = parseFloat(initialLiquidity)
      if (isNaN(liquidity) || liquidity < 100) {
        throw new Error('Initial liquidity must be at least 100 BB')
      }
      
      console.log(`🚀 Activating market: ${selectedMarket.title} with ${liquidity} BB`)
      
      // Call dealer's createMarket function
      const result = await sdk.createMarket({
        id: selectedMarket.id,
        title: selectedMarket.title,
        description: selectedMarket.description || '',
        closes_at: selectedMarket.closes_at,
        initial_liquidity: liquidity,
        home_team: selectedMarket.home_team,
        away_team: selectedMarket.away_team
      })
      
      console.log('✅ Market activated:', result)
      
      setActionMessage({ type: 'success', text: `Market "${selectedMarket.title}" activated with ${liquidity} BB!` })
      setSelectedMarket(null)
      setInitialLiquidity('1000')
      
      // Reload markets
      await loadMarkets()
      
    } catch (err: any) {
      console.error('❌ Activate market error:', err)
      setActionMessage({ type: 'error', text: err.message || 'Failed to activate market' })
    } finally {
      setActionLoading(false)
    }
  }
  
  // Resolve market (declare winner)
  const handleResolveMarket = async (marketId: string, outcome: string) => {
    if (!sdk) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      
      console.log(`🏁 Resolving market ${marketId} with outcome: ${outcome}`)
      
      const result = await sdk.resolveMarket(marketId, outcome)
      
      console.log('✅ Market resolved:', result)
      setActionMessage({ type: 'success', text: `Market resolved with outcome: ${outcome}` })
      
      await loadMarkets()
      
    } catch (err: any) {
      console.error('❌ Resolve market error:', err)
      setActionMessage({ type: 'error', text: err.message || 'Failed to resolve market' })
    } finally {
      setActionLoading(false)
    }
  }
  
  // Pause/Resume market
  const handleToggleMarket = async (marketId: string, pause: boolean) => {
    if (!sdk) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      
      const action = pause ? 'pauseMarket' : 'resumeMarket'
      console.log(`⏸️ ${pause ? 'Pausing' : 'Resuming'} market ${marketId}`)
      
      const result = await sdk[action](marketId)
      
      console.log(`✅ Market ${pause ? 'paused' : 'resumed'}:`, result)
      setActionMessage({ type: 'success', text: `Market ${pause ? 'paused' : 'resumed'} successfully` })
      
      await loadMarkets()
      
    } catch (err: any) {
      console.error(`❌ ${pause ? 'Pause' : 'Resume'} error:`, err)
      setActionMessage({ type: 'error', text: err.message || `Failed to ${pause ? 'pause' : 'resume'} market` })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Initializing Dealer SDK...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-500 text-xl font-bold mb-2">Dealer Initialization Error</h2>
          <p className="text-white">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎰 Dealer Admin Panel</h1>
          <p className="text-purple-300">Full admin access to market lifecycle and settings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-purple-300 text-sm mb-1">Total Markets</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-purple-300 text-sm mb-1">Activated on L2</p>
            <p className="text-3xl font-bold text-green-400">{stats.activated}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-purple-300 text-sm mb-1">Pending Activation</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-500/20 border border-green-500 text-green-300' 
              : 'bg-red-500/20 border border-red-500 text-red-300'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Pending Markets Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Pending Markets (Supabase Only)</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
            {pendingMarkets.length === 0 ? (
              <div className="p-8 text-center text-purple-300">
                No pending markets. All Supabase markets are activated on L2! 🎉
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-purple-300">Title</th>
                      <th className="px-4 py-3 text-left text-purple-300">Teams</th>
                      <th className="px-4 py-3 text-left text-purple-300">Closes At</th>
                      <th className="px-4 py-3 text-left text-purple-300">Created</th>
                      <th className="px-4 py-3 text-center text-purple-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMarkets.slice(0, 20).map((market) => (
                      <tr key={market.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{market.title}</td>
                        <td className="px-4 py-3 text-purple-200">
                          {market.home_team && market.away_team 
                            ? `${market.home_team} vs ${market.away_team}`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-purple-200">
                          {market.closes_at 
                            ? new Date(market.closes_at).toLocaleString()
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-purple-200">
                          {market.created_at 
                            ? new Date(market.created_at).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedMarket(market)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                            disabled={actionLoading}
                          >
                            Activate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingMarkets.length > 20 && (
                  <div className="p-4 text-center text-purple-300">
                    Showing 20 of {pendingMarkets.length} pending markets
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activate Market Modal */}
        {selectedMarket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg border border-purple-500 p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Activate Market on L2</h3>
              
              <div className="mb-4">
                <p className="text-purple-300 text-sm mb-1">Market Title</p>
                <p className="text-white font-semibold">{selectedMarket.title}</p>
              </div>
              
              {selectedMarket.home_team && selectedMarket.away_team && (
                <div className="mb-4">
                  <p className="text-purple-300 text-sm mb-1">Teams</p>
                  <p className="text-white">{selectedMarket.home_team} vs {selectedMarket.away_team}</p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-purple-300 text-sm mb-2">
                  Initial Liquidity (BB) - Minimum 100
                </label>
                <input
                  type="number"
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-purple-500 rounded-lg text-white"
                  min="100"
                  step="100"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleActivateMarket}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Activating...' : 'Activate Market'}
                </button>
                <button
                  onClick={() => setSelectedMarket(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Markets Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">⚡ Active Markets (L2 Blockchain)</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
            {activeMarkets.length === 0 ? (
              <div className="p-8 text-center text-purple-300">
                No active markets on L2 yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {activeMarkets.map((market) => (
                  <div key={market.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <h3 className="text-lg font-bold text-white mb-2">{market.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <p className="text-purple-300">Status</p>
                        <p className="text-white font-semibold">{market.status || 'active'}</p>
                      </div>
                      <div>
                        <p className="text-purple-300">Liquidity</p>
                        <p className="text-green-400 font-semibold">{market.liquidity || 0} BB</p>
                      </div>
                      <div>
                        <p className="text-purple-300">Volume</p>
                        <p className="text-white font-semibold">{market.volume || 0} BB</p>
                      </div>
                      <div>
                        <p className="text-purple-300">Closes At</p>
                        <p className="text-white font-semibold">
                          {market.closes_at ? new Date(market.closes_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleMarket(market.id, true)}
                        disabled={actionLoading || market.status === 'paused'}
                        className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleToggleMarket(market.id, false)}
                        disabled={actionLoading || market.status !== 'paused'}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => {
                          const outcome = prompt('Enter winning outcome (home/away/draw):')
                          if (outcome) handleResolveMarket(market.id, outcome)
                        }}
                        disabled={actionLoading}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
