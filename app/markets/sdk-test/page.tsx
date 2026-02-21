'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { ContestsSDK, ContestType } from '@/sdk/contests-sdk.js'
import { FanCreditSDK } from '@/sdk/fancredit-sdk.js'

export default function MarketsSDKTestPage() {
  const [username, setUsername] = useState('alice')
  const [fcBalance, setFcBalance] = useState(null)
  const [contests, setContests] = useState([])
  const [selectedContest, setSelectedContest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Initialize SDKs
  const fcSDK = new FanCreditSDK({
    apiUrl: process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
  })
  
  const contestsSDK = new ContestsSDK({
    apiUrl: process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234',
    username: username
  })

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  // Fetch balance
  const fetchBalance = async () => {
    try {
      setLoading(true)
      addLog(`Fetching balance for ${username}...`, 'info')
      const balance = await fcSDK.getBalance(username)
      setFcBalance(balance)
      addLog(`Balance loaded: ${balance.available} FC available, ${balance.locked} FC locked`, 'success')
    } catch (err) {
      addLog(`Error fetching balance: ${err.message}`, 'error')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch contests
  const fetchContests = async (type = 'all') => {
    try {
      setLoading(true)
      addLog(`Fetching contests (${type})...`, 'info')
      
      let contestList = []
      if (type === 'all') {
        contestList = await contestsSDK.listAll()
      } else if (type === 'active') {
        contestList = await contestsSDK.listActive()
      } else {
        contestList = await contestsSDK.listByType(type)
      }
      
      setContests(contestList)
      addLog(`Loaded ${contestList.length} contests`, 'success')
    } catch (err) {
      addLog(`Error fetching contests: ${err.message}`, 'error')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Enter contest
  const enterContest = async (contestId, choice) => {
    try {
      setLoading(true)
      addLog(`Entering contest ${contestId}...`, 'info')
      
      const result = await contestsSDK.enter(contestId, choice, username)
      addLog(`Successfully entered contest! Entry ID: ${result.entry_id || 'N/A'}`, 'success')
      
      // Refresh balance and contests
      await fetchBalance()
      await fetchContests('active')
    } catch (err) {
      addLog(`Error entering contest: ${err.message}`, 'error')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Credit FC (test function)
  const creditFCTest = async (amount) => {
    try {
      setLoading(true)
      addLog(`Crediting ${amount} FC to ${username}...`, 'info')
      
      const result = await fcSDK.creditFC(username, amount, 'Test credit')
      addLog(`Credited ${amount} FC. New balance: ${result.newBalance}`, 'success')
      
      await fetchBalance()
    } catch (err) {
      addLog(`Error crediting FC: ${err.message}`, 'error')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    fetchContests('active')
  }, [username])

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black prism-gradient-text mb-4">
            Markets SDK Test Page
          </h1>
          <p className="text-xl text-gray-400">
            Testing FanCredit SDK & Contests SDK
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - User & Balance */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Selector */}
            <div className="bg-dark-200 border border-dark-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">User Account</h3>
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-dark-100 border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-prism-teal"
              >
                <option value="alice">Alice</option>
                <option value="bob">Bob</option>
                <option value="mac">Mac</option>
                <option value="dealer">Dealer</option>
                <option value="apollo">Apollo</option>
              </select>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-br from-prism-purple/20 to-prism-teal/20 border border-prism-teal/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 FanCredit Balance</h3>
              {fcBalance ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-2xl font-bold prism-gradient-text">
                      {fcBalance.available} FC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Locked:</span>
                    <span className="text-lg font-semibold text-yellow-400">
                      {fcBalance.locked} FC
                    </span>
                  </div>
                  <div className="border-t border-dark-border pt-3 flex justify-between items-center">
                    <span className="text-gray-300 font-bold">Total:</span>
                    <span className="text-xl font-bold text-white">
                      {fcBalance.total} FC
                    </span>
                  </div>
                  <button
                    onClick={fetchBalance}
                    className="w-full mt-4 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
                  >
                    🔄 Refresh Balance
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400">Loading...</div>
              )}
            </div>

            {/* Test Actions */}
            <div className="bg-dark-200 border border-dark-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">🧪 Test Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => creditFCTest(1000)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  + Credit 1000 FC
                </button>
                <button
                  onClick={() => creditFCTest(100)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  + Credit 100 FC
                </button>
                <button
                  onClick={() => fetchContests('all')}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  📋 Load All Contests
                </button>
                <button
                  onClick={() => fetchContests('active')}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  ✅ Load Active Only
                </button>
              </div>
            </div>

            {/* Console Logs */}
            <div className="bg-dark-200 border border-dark-border rounded-xl p-6 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">📝 Console</h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs px-2 py-1 bg-dark-300 hover:bg-dark-400 text-gray-400 rounded"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${
                      log.type === 'error' ? 'bg-red-900/30 text-red-400' :
                      log.type === 'success' ? 'bg-green-900/30 text-green-400' :
                      'bg-dark-300 text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500 text-center py-4">No logs yet...</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contests */}
          <div className="lg:col-span-2">
            <div className="bg-dark-200 border border-dark-border rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">🎮 Active Contests</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchContests(ContestType.BINARY)}
                    className="px-3 py-1 bg-dark-300 hover:bg-dark-400 text-white text-sm rounded transition-colors"
                  >
                    Binary
                  </button>
                  <button
                    onClick={() => fetchContests(ContestType.HEAD_TO_HEAD)}
                    className="px-3 py-1 bg-dark-300 hover:bg-dark-400 text-white text-sm rounded transition-colors"
                  >
                    H2H
                  </button>
                  <button
                    onClick={() => fetchContests(ContestType.SQUAD_BATTLE)}
                    className="px-3 py-1 bg-dark-300 hover:bg-dark-400 text-white text-sm rounded transition-colors"
                  >
                    Squad
                  </button>
                </div>
              </div>

              {/* Contest List */}
              <div className="space-y-4">
                {contests.length > 0 ? (
                  contests.map((contest) => (
                    <motion.div
                      key={contest.contest_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-dark-300 border border-dark-border rounded-lg p-6 hover:border-prism-teal transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{contest.title}</h4>
                          <p className="text-gray-400 text-sm">{contest.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          contest.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                          contest.status === 'Frozen' ? 'bg-yellow-500/20 text-yellow-400' :
                          contest.status === 'Resolved' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {contest.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Type</div>
                          <div className="text-sm font-semibold text-white">{contest.contest_type}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Entry Fee</div>
                          <div className="text-sm font-bold prism-gradient-text">{contest.entry_fee} FC</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Entries</div>
                          <div className="text-sm font-semibold text-white">
                            {contest.entries || 0}/{contest.max_participants || '∞'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Prize Pool</div>
                          <div className="text-sm font-bold text-green-400">
                            {(contest.entry_fee || 0) * (contest.entries || 0)} FC
                          </div>
                        </div>
                      </div>

                      {/* Entry UI based on contest type */}
                      {contest.status === 'Active' && (
                        <div className="border-t border-dark-border pt-4">
                          {contest.contest_type === ContestType.BINARY && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => enterContest(contest.contest_id, { choice: 'yes' })}
                                disabled={loading || !fcBalance || fcBalance.available < contest.entry_fee}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                              >
                                👍 YES
                              </button>
                              <button
                                onClick={() => enterContest(contest.contest_id, { choice: 'no' })}
                                disabled={loading || !fcBalance || fcBalance.available < contest.entry_fee}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                              >
                                👎 NO
                              </button>
                            </div>
                          )}
                          
                          {contest.contest_type === ContestType.HEAD_TO_HEAD && contest.options && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => enterContest(contest.contest_id, { selection: contest.options.player_a })}
                                disabled={loading || !fcBalance || fcBalance.available < contest.entry_fee}
                                className="flex-1 px-4 py-2 bg-prism-purple hover:bg-prism-purple/80 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                              >
                                {contest.options.player_a}
                              </button>
                              <button
                                onClick={() => enterContest(contest.contest_id, { selection: contest.options.player_b })}
                                disabled={loading || !fcBalance || fcBalance.available < contest.entry_fee}
                                className="flex-1 px-4 py-2 bg-prism-teal hover:bg-prism-teal/80 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                              >
                                {contest.options.player_b}
                              </button>
                            </div>
                          )}

                          {(!fcBalance || fcBalance.available < contest.entry_fee) && (
                            <div className="mt-2 text-xs text-red-400 text-center">
                              Insufficient balance. Need {contest.entry_fee} FC
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {loading ? 'Loading contests...' : 'No contests found'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
