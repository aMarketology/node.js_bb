'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCreditPrediction } from '../contexts/CreditPredictionContext'
import { signWithdrawal } from '@/lib/l2-signer'

// Alice's test credentials
const ALICE = {
  publicKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
  privateKey: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  l1Address: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  l2Address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8'
}

type BridgeTab = 'deposit' | 'withdraw'

export default function BridgeInterface() {
  const { balance, getL1Balance, bridge, refreshBalance } = useCreditPrediction()
  
  console.log('🔍 BridgeInterface current balance:', balance)
  
  const [activeTab, setActiveTab] = useState<BridgeTab>('deposit')
  const [l1Balance, setL1Balance] = useState<{ available: number; locked: number } | null>(null)
  const [bridgeAmount, setBridgeAmount] = useState('')
  const [bridging, setBridging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'locking' | 'claiming' | 'complete' | 'withdrawing'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    loadL1Balance()
  }, [])

  async function loadL1Balance() {
    try {
      const l1Bal = await getL1Balance()
      setL1Balance(l1Bal)
    } catch (error: any) {
      console.error('Failed to load L1 balance:', error)
      setError('L1 server unavailable. Make sure it\'s running on port 8080.')
    }
  }

  async function handleBridge() {
    const amount = parseFloat(bridgeAmount)
    if (!amount || amount <= 0) return

    if (l1Balance && l1Balance.available < amount) {
      setError(`Insufficient L1 balance: ${l1Balance.available} $BC available`)
      return
    }

    try {
      setBridging(true)
      setError('')
      setStatus('locking')

      const result = await bridge(amount)

      if (result.success) {
        setStatus('complete')
        setBridgeAmount('')
        await Promise.all([loadL1Balance(), refreshBalance()])
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch (error: any) {
      setError(error.message)
      setStatus('idle')
    } finally {
      setBridging(false)
    }
  }

  async function handleWithdraw() {
    const amount = parseFloat(bridgeAmount)
    if (!amount || amount <= 0) return

    if (balance.available < amount) {
      setError(`Insufficient L2 balance: ${balance.available} $BB available`)
      return
    }

    try {
      setBridging(true)
      setError('')
      setStatus('withdrawing')

      console.log('🔐 Starting withdrawal:', { amount, from: ALICE.l2Address })

      // Sign the withdrawal request (async)
      const signedRequest = await signWithdrawal(
        amount,
        ALICE.l2Address,
        ALICE.privateKey,
        ALICE.publicKey
      )

      console.log('📝 Signed request details:', {
        amount,
        from_address: ALICE.l2Address,
        public_key: signedRequest.publicKey,
        signature: signedRequest.signature,
        timestamp: signedRequest.timestamp,
        nonce: signedRequest.nonce,
        message: signedRequest.message
      })

      // Call L2 server directly
      const l2Url = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
      const withdrawUrl = `${l2Url}/withdraw`
      
      console.log('📤 Sending to L2:', withdrawUrl)

      const payload = {
        from_address: ALICE.l2Address,
        amount: amount,
        public_key: signedRequest.publicKey,
        signature: signedRequest.signature,
        timestamp: signedRequest.timestamp,
        nonce: signedRequest.nonce
      }

      console.log('📤 Full payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(withdrawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('📥 L2 Response status:', response.status)
      
      // Handle response - could be JSON or plain text
      let result
      const contentType = response.headers.get('content-type')
      const responseText = await response.text()
      
      console.log('📥 L2 Response body (raw):', responseText)
      
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        // Not JSON - treat as plain text error
        result = { error: responseText, success: false }
      }
      
      console.log('📥 L2 Response (parsed):', result)

      if (!response.ok) {
        throw new Error(result.error || result.message || responseText || `HTTP ${response.status}`)
      }

      if (result.success) {
        setStatus('complete')
        setBridgeAmount('')
        await Promise.all([loadL1Balance(), refreshBalance()])
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        throw new Error(result.error || 'Withdrawal failed')
      }
    } catch (error: any) {
      console.error('❌ Withdrawal failed:', error)
      setError(error.message)
      setStatus('idle')
    } finally {
      setBridging(false)
    }
  }

  return (
    <div className="prism-card rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-prism-teal to-prism-gold flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bridge</h2>
          <p className="text-gray-400 text-sm">Transfer between L1 and L2</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('deposit')
            setBridgeAmount('')
            setError('')
            setStatus('idle')
          }}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'deposit'
              ? 'bg-gradient-to-r from-prism-teal to-prism-teal/80 text-white'
              : 'bg-dark-300 text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
            </svg>
            <span>Deposit L1 → L2</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('withdraw')
            setBridgeAmount('')
            setError('')
            setStatus('idle')
          }}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'withdraw'
              ? 'bg-gradient-to-r from-prism-gold to-prism-gold/80 text-white'
              : 'bg-dark-300 text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span>Withdraw L2 → L1</span>
          </div>
        </button>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-dark-300 border border-dark-border">
          <div className="text-gray-500 text-sm mb-1">L1 Balance ($BC)</div>
          <div className="text-2xl font-bold text-prism-teal">
            {l1Balance ? l1Balance.available.toLocaleString() : '---'}
          </div>
          {l1Balance && l1Balance.locked > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Locked: {l1Balance.locked.toLocaleString()}
            </div>
          )}
        </div>
        <div className="p-4 rounded-lg bg-dark-300 border border-dark-border">
          <div className="text-gray-500 text-sm mb-1">L2 Balance ($BB)</div>
          <div className="text-2xl font-bold text-prism-gold">
            {balance.available.toLocaleString()}
          </div>
          {balance.locked > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Locked: {balance.locked.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Status Display */}
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border ${
            activeTab === 'deposit'
              ? 'bg-gradient-to-r from-prism-teal/20 to-prism-teal/10 border-prism-teal/30'
              : 'bg-gradient-to-r from-prism-gold/20 to-prism-gold/10 border-prism-gold/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {status === 'complete' ? (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-white font-bold">
                    {activeTab === 'deposit' ? 'Deposit Complete!' : 'Withdrawal Request Submitted!'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {activeTab === 'deposit' 
                      ? 'Funds are now available on L2'
                      : 'L2 balance debited. Awaiting dealer completion on L1'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={`animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${
                  activeTab === 'deposit' ? 'border-prism-teal' : 'border-prism-gold'
                }`}></div>
                <div>
                  <div className="text-white font-bold">
                    {status === 'locking' && 'Step 1: Locking on L1...'}
                    {status === 'claiming' && 'Step 2: Claiming on L2...'}
                    {status === 'withdrawing' && 'Processing withdrawal request...'}
                  </div>
                  <div className="text-gray-400 text-sm">Please wait...</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <div className="text-red-400 font-semibold">
                {activeTab === 'deposit' ? 'Deposit Failed' : 'Withdrawal Failed'}
              </div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Amount Input Form */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {activeTab === 'deposit' ? 'Amount to Deposit' : 'Amount to Withdraw'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={bridgeAmount}
            onChange={(e) => setBridgeAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={bridging || (activeTab === 'deposit' && !l1Balance)}
            className={`w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white text-lg transition-colors disabled:opacity-50 ${
              activeTab === 'deposit'
                ? 'focus:border-prism-teal focus:ring-1 focus:ring-prism-teal'
                : 'focus:border-prism-gold focus:ring-1 focus:ring-prism-gold'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
            {activeTab === 'deposit' ? '$BC' : '$BB'}
          </div>
        </div>
        {activeTab === 'deposit' && l1Balance && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">Available: {l1Balance.available.toLocaleString()} $BC</span>
            <button
              onClick={() => setBridgeAmount(l1Balance.available.toString())}
              className="text-prism-teal hover:text-prism-teal/80 font-semibold transition-colors"
            >
              Max
            </button>
          </div>
        )}
        {activeTab === 'withdraw' && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">Available: {balance.available.toLocaleString()} $BB</span>
            <button
              onClick={() => setBridgeAmount(balance.available.toString())}
              className="text-prism-gold hover:text-prism-gold/80 font-semibold transition-colors"
            >
              Max
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      {activeTab === 'deposit' ? (
        <div className="mb-6 p-4 rounded-lg bg-prism-teal/10 border border-prism-teal/30">
          <h3 className="text-white font-semibold text-sm mb-2">How it works:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Step 1: Lock $BC tokens on L1 blockchain</li>
            <li>• Step 2: Receive equivalent $BB tokens on L2</li>
            <li>• Process typically takes 2-3 seconds</li>
            <li>• 1:1 exchange rate (1 $BC = 1 $BB)</li>
          </ul>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-prism-gold/10 border border-prism-gold/30">
          <h3 className="text-white font-semibold text-sm mb-2">How it works:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Step 1: Burn $BB tokens on L2 (immediate)</li>
            <li>• Step 2: Dealer unlocks $BC on L1 (pending)</li>
            <li>• Two-step process for security</li>
            <li>• 1:1 exchange rate (1 $BB = 1 $BC)</li>
          </ul>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={activeTab === 'deposit' ? handleBridge : handleWithdraw}
        disabled={
          bridging || 
          !bridgeAmount || 
          parseFloat(bridgeAmount) <= 0 || 
          (activeTab === 'deposit' && !l1Balance)
        }
        className={`w-full px-6 py-4 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
          activeTab === 'deposit'
            ? 'bg-gradient-to-r from-prism-teal to-prism-teal/80'
            : 'bg-gradient-to-r from-prism-gold to-prism-gold/80'
        }`}
      >
        {bridging ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            {activeTab === 'deposit' ? 'Depositing...' : 'Withdrawing...'}
          </span>
        ) : (
          activeTab === 'deposit'
            ? `Deposit ${bridgeAmount || '0'} $BC to L2`
            : `Withdraw ${bridgeAmount || '0'} $BB to L1`
        )}
      </button>
    </div>
  )
}
