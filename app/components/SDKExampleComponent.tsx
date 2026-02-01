/**
 * Example React Component demonstrating SDK usage
 * 
 * This component shows how to:
 * 1. Display FanCredit balance
 * 2. Show live contests
 * 3. Check eligibility
 * 4. Enter contests
 */

'use client'

import { useState } from 'react'
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'
import { useAuth } from '@/app/contexts/AuthContext'

export default function SDKExampleComponent() {
  const { isAuthenticated, activeWalletData } = useAuth()
  
  // FanCredit SDK Hook
  const {
    balance: fcBalance,
    transactions: fcTransactions,
    loading: fcLoading,
    error: fcError,
    formatFC,
    canEnterContest: canAffordFC
  } = useFanCredit()

  // L2Markets SDK Hook
  const {
    liveContests,
    userContests,
    loading: marketsLoading,
    error: marketsError,
    enterContest,
    canEnterContest,
    formatAmount
  } = useL2Markets()

  const [selectedContest, setSelectedContest] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Example: Check if user can enter a specific contest
  async function checkEligibility(contestId: string) {
    const eligibility = await canEnterContest(contestId)
    
    if (eligibility.canEnter) {
      setMessage(`✅ You can enter! Fee: ${formatAmount(eligibility.entryFee || 0, eligibility.currency || 'FC')}`)
    } else {
      setMessage(`❌ ${eligibility.reason}`)
    }
  }

  // Example: Enter a contest
  async function handleEnterContest(contestId: string) {
    try {
      setMessage('Entering contest...')
      
      // Example roster - replace with your roster selection logic
      const roster = [1, 2, 3, 4, 5]
      
      const success = await enterContest({
        contestId,
        userAddress: activeWalletData?.l2Address || '',
        roster
      })

      if (success) {
        setMessage('✅ Successfully entered contest!')
      } else {
        setMessage('❌ Failed to enter contest')
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Example: Check FC balance before action
  async function checkFCBalance(requiredAmount: number) {
    const hasBalance = await canAffordFC(requiredAmount)
    if (hasBalance) {
      setMessage(`✅ You have enough FC (${formatFC(fcBalance?.available || 0)})`)
    } else {
      setMessage(`❌ Insufficient FC. Need ${formatFC(requiredAmount)}, have ${formatFC(fcBalance?.available || 0)}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Please log in to use SDK features</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white">SDK Example Component</h2>

      {/* FanCredit Balance Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-semibold text-purple-400 mb-3">💰 FanCredit Balance</h3>
        {fcLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : fcError ? (
          <p className="text-red-400">Error: {fcError}</p>
        ) : fcBalance ? (
          <div className="space-y-2">
            <p className="text-white">
              Available: <span className="font-bold text-purple-400">{formatFC(fcBalance.available)}</span>
            </p>
            {fcBalance.locked > 0 && (
              <p className="text-gray-400">
                Locked: <span className="font-bold">{formatFC(fcBalance.locked)}</span>
              </p>
            )}
            <p className="text-white">
              Total: <span className="font-bold">{formatFC(fcBalance.total)}</span>
            </p>
            
            {/* Example: Check if can afford 100 FC */}
            <button
              onClick={() => checkFCBalance(100)}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
            >
              Check if can afford 100 FC
            </button>
          </div>
        ) : (
          <p className="text-gray-400">No balance data</p>
        )}
      </div>

      {/* Live Contests Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-semibold text-cyan-400 mb-3">🎮 Live Contests</h3>
        {marketsLoading ? (
          <p className="text-gray-400">Loading contests...</p>
        ) : marketsError ? (
          <p className="text-red-400">Error: {marketsError}</p>
        ) : liveContests && liveContests.length > 0 ? (
          <div className="space-y-3">
            {liveContests.map((contest) => (
              <div key={contest.contest_id} className="bg-gray-700 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">
                      {contest.name || `Contest ${contest.contest_id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      Entry: {formatAmount(contest.entry_fee, contest.currency === 'FanCoin' ? 'FC' : 'BB')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    contest.currency === 'FanCoin' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {contest.currency === 'FanCoin' ? 'FC' : 'BB'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => checkEligibility(contest.contest_id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                  >
                    Check Eligibility
                  </button>
                  <button
                    onClick={() => handleEnterContest(contest.contest_id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                    disabled={contest.isFull}
                  >
                    {contest.isFull ? 'Full' : 'Enter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No live contests available</p>
        )}
      </div>

      {/* User's Contests */}
      {userContests && userContests.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-green-400 mb-3">📋 Your Contests</h3>
          <div className="space-y-2">
            {userContests.map((contest) => (
              <div key={contest.contest_id} className="bg-gray-700 p-3 rounded">
                <p className="font-semibold text-white">
                  {contest.name || contest.contest_id}
                </p>
                <p className="text-sm text-gray-400">Status: {contest.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent FC Transactions */}
      {fcTransactions && fcTransactions.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-400 mb-3">📊 Recent FC Transactions</h3>
          <div className="space-y-2">
            {fcTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="bg-gray-700 p-2 rounded flex justify-between">
                <div>
                  <p className="text-sm text-white">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-purple-400">{formatFC(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
          <p className="text-white">{message}</p>
        </div>
      )}

      {/* SDK Methods Reference */}
      <div className="bg-gray-800 p-4 rounded-lg text-sm">
        <h3 className="text-lg font-semibold text-white mb-2">🔧 Available SDK Methods</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-purple-400 mb-1">FanCredit SDK:</p>
            <ul className="text-gray-300 space-y-1 text-xs">
              <li>• balance - Current FC balance</li>
              <li>• transactions - Transaction history</li>
              <li>• loading - Loading state</li>
              <li>• error - Error message</li>
              <li>• refreshBalance() - Refresh balance</li>
              <li>• refreshTransactions() - Refresh history</li>
              <li>• canEnterContest(fee) - Check affordability</li>
              <li>• formatFC(amount) - Format amount</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-cyan-400 mb-1">L2Markets SDK:</p>
            <ul className="text-gray-300 space-y-1 text-xs">
              <li>• contests - All contests</li>
              <li>• liveContests - Live contests only</li>
              <li>• userContests - User's contests</li>
              <li>• loading - Loading state</li>
              <li>• error - Error message</li>
              <li>• refreshContests() - Refresh all</li>
              <li>• getContest(id) - Get specific contest</li>
              <li>• enterContest(params) - Enter contest</li>
              <li>• canEnterContest(id) - Check eligibility</li>
              <li>• formatAmount(amt, curr) - Format amount</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
