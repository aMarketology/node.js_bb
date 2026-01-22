'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { useUnifiedSDK } from '@/app/contexts/UnifiedSDKContext'

interface SDKBridgeInterfaceProps {
  onClose?: () => void
  defaultTab?: 'deposit' | 'withdraw'
}

export default function SDKBridgeInterface({ onClose, defaultTab = 'deposit' }: SDKBridgeInterfaceProps) {
  const { isAuthenticated } = useAuth()
  const {
    isConnected,
    l1Balance,
    l2Balance,
    bridge,
    requestWithdrawal,
    refreshBalance
  } = useUnifiedSDK()

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(defaultTab)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'complete'>('input')
  const [txDetails, setTxDetails] = useState<any>(null)

  // Refresh balances on mount
  useEffect(() => {
    if (isConnected) {
      refreshBalance().catch(console.error)
    }
  }, [isConnected])

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(2)
  }

  const getMaxAmount = () => {
    if (activeTab === 'deposit') {
      return l1Balance.available
    } else {
      return l2Balance.available
    }
  }

  const handleMaxClick = () => {
    setAmount(Math.floor(getMaxAmount()).toString())
  }

  const handleQuickAmount = (value: number) => {
    const max = getMaxAmount()
    const actualAmount = Math.min(value, max)
    setAmount(actualAmount.toString())
  }

  const validateAmount = (): boolean => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return false
    }

    const max = getMaxAmount()
    if (amountNum > max) {
      setError(`Insufficient balance. Maximum: ${formatBalance(max)}`)
      return false
    }

    if (amountNum < 1) {
      setError('Minimum amount is 1')
      return false
    }

    return true
  }

  const handleConfirm = () => {
    if (!validateAmount()) return
    setStep('confirm')
    setError('')
  }

  const handleBridge = async () => {
    if (!isConnected) {
      setError('Wallet not connected')
      return
    }

    if (!validateAmount()) return

    setLoading(true)
    setError('')
    setStep('processing')

    try {
      const amountNum = parseFloat(amount)

      if (activeTab === 'deposit') {
        // Bridge L1 → L2
        const result = await bridge(amountNum)
        setTxDetails({
          type: 'deposit',
          amount: amountNum,
          lockId: result.lockId,
          newBalance: result.newL2Balance
        })
        setSuccess(`✅ Successfully bridged ${formatBalance(amountNum)} $BC → $BB`)
      } else {
        // Withdraw L2 → L1
        const result = await requestWithdrawal(amountNum)
        setTxDetails({
          type: 'withdraw',
          amount: amountNum,
          requestId: result.requestId,
          status: result.status
        })
        setSuccess(`✅ Withdrawal request submitted for ${formatBalance(amountNum)} $BB`)
      }

      setStep('complete')
      await refreshBalance()
    } catch (err: any) {
      console.error('Bridge error:', err)
      setError(err.message || 'Transaction failed')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setAmount('')
    setStep('input')
    setError('')
    setSuccess('')
    setTxDetails(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-dark-200 border border-dark-border rounded-xl text-center">
        <p className="text-gray-400">Please connect your wallet to use the bridge</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-dark-200 border border-dark-border rounded-xl space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">🌉 Bridge</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-300 rounded-xl p-1">
        <button
          onClick={() => { setActiveTab('deposit'); handleReset(); }}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'deposit'
              ? 'bg-prism-teal text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          L1 → L2 (Deposit)
        </button>
        <button
          onClick={() => { setActiveTab('withdraw'); handleReset(); }}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'withdraw'
              ? 'bg-prism-purple text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          L2 → L1 (Withdraw)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Balance Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${activeTab === 'deposit' ? 'border-prism-teal bg-prism-teal/10' : 'border-dark-border bg-dark-300'}`}>
                <div className="text-xs text-gray-400 mb-1">L1 Balance ($BC)</div>
                <div className="text-lg font-bold text-prism-teal">{formatBalance(l1Balance.available)}</div>
                {l1Balance.locked > 0 && (
                  <div className="text-xs text-gray-500">+{formatBalance(l1Balance.locked)} locked</div>
                )}
              </div>
              <div className={`p-4 rounded-xl border ${activeTab === 'withdraw' ? 'border-prism-purple bg-prism-purple/10' : 'border-dark-border bg-dark-300'}`}>
                <div className="text-xs text-gray-400 mb-1">L2 Balance ($BB)</div>
                <div className="text-lg font-bold text-prism-gold">{formatBalance(l2Balance.available)}</div>
                {l2Balance.locked > 0 && (
                  <div className="text-xs text-gray-500">+{formatBalance(l2Balance.locked)} locked</div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-400">Amount</label>
                <button
                  onClick={handleMaxClick}
                  className="text-xs text-prism-teal hover:underline"
                >
                  MAX: {formatBalance(getMaxAmount())}
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  placeholder="0.00"
                  min="1"
                  className="w-full px-4 py-3 pr-16 bg-dark-300 border border-dark-border rounded-xl text-white text-lg font-mono focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  {activeTab === 'deposit' ? '$BC' : '$BB'}
                </span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-2">
              {[10, 50, 100, 500, 1000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="flex-1 py-2 text-sm bg-dark-300 hover:bg-dark-400 border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  {quickAmount}
                </button>
              ))}
            </div>

            {/* Direction Indicator */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className={`text-center ${activeTab === 'deposit' ? 'text-prism-teal' : 'text-gray-400'}`}>
                <div className="text-2xl">🏦</div>
                <div className="text-xs">L1 Vault</div>
              </div>
              <div className="text-2xl text-gray-400">
                {activeTab === 'deposit' ? '→' : '←'}
              </div>
              <div className={`text-center ${activeTab === 'withdraw' ? 'text-prism-purple' : 'text-gray-400'}`}>
                <div className="text-2xl">🎮</div>
                <div className="text-xs">L2 Trading</div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0 || loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'deposit'
                  ? 'bg-prism-teal hover:bg-prism-teal/90'
                  : 'bg-prism-purple hover:bg-prism-purple/90'
              }`}
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="p-6 bg-dark-300 rounded-xl space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{activeTab === 'deposit' ? '🌉' : '🏧'}</div>
                <div className="text-xl font-bold text-white mb-1">
                  {activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </div>
                <div className="text-gray-400">
                  {activeTab === 'deposit' 
                    ? 'Lock $BC on L1 and receive $BB on L2'
                    : 'Request withdrawal from L2 to L1'}
                </div>
              </div>

              <div className="border-t border-dark-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold">
                    {formatBalance(parseFloat(amount))} {activeTab === 'deposit' ? '$BC' : '$BB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direction:</span>
                  <span className="text-white">
                    {activeTab === 'deposit' ? 'L1 → L2' : 'L2 → L1'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-green-400">Free</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-dark-300 hover:bg-dark-400 rounded-xl font-semibold text-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleBridge}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 ${
                  activeTab === 'deposit'
                    ? 'bg-prism-teal hover:bg-prism-teal/90'
                    : 'bg-prism-purple hover:bg-prism-purple/90'
                }`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 text-center space-y-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-prism-teal/30 border-t-prism-teal rounded-full animate-spin mx-auto" />
            </div>
            <div className="text-lg font-semibold text-white">
              {activeTab === 'deposit' ? 'Bridging to L2...' : 'Processing withdrawal...'}
            </div>
            <div className="text-sm text-gray-400">
              {activeTab === 'deposit' 
                ? 'Locking $BC on L1 and crediting $BB on L2'
                : 'Submitting withdrawal request'}
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="p-6 bg-green-500/10 border border-green-500 rounded-xl text-center space-y-2">
              <div className="text-4xl">✅</div>
              <div className="text-lg font-bold text-green-400">{success}</div>
            </div>

            {txDetails && (
              <div className="p-4 bg-dark-300 rounded-xl space-y-2 text-sm">
                {txDetails.lockId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lock ID:</span>
                    <span className="text-white font-mono">{txDetails.lockId}</span>
                  </div>
                )}
                {txDetails.requestId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Request ID:</span>
                    <span className="text-white font-mono">{txDetails.requestId}</span>
                  </div>
                )}
                {txDetails.newBalance !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">New L2 Balance:</span>
                    <span className="text-prism-gold font-bold">{formatBalance(txDetails.newBalance)} $BB</span>
                  </div>
                )}
                {txDetails.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-yellow-400">{txDetails.status}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-dark-300 hover:bg-dark-400 rounded-xl font-semibold text-gray-300 transition-colors"
              >
                Bridge More
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-prism-teal hover:bg-prism-teal/90 rounded-xl font-bold text-white transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 text-center">
        {activeTab === 'deposit' 
          ? '⚠️ L1 balance verification required via gRPC'
          : '⚠️ Withdrawals may take up to 24h to process'}
      </div>
    </motion.div>
  )
}
