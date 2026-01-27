"use client"

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

interface WalletConnectionProps {
  onClose?: () => void
}

export default function WalletConnection({ onClose }: WalletConnectionProps) {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')

  const handleWeb3AuthLogin = async () => {
    setLoading('web3auth')
    try {
      // Placeholder for Web3Auth integration
      console.log('Initiating Web3Auth login...')
      // await signIn('web3auth', { email })
      alert('Web3Auth integration coming soon!')
    } catch (error) {
      console.error('Web3Auth login failed:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleMetamaskLogin = async () => {
    setLoading('metamask')
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to continue')
        window.open('https://metamask.io/download/', '_blank')
        return
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      console.log('MetaMask connected:', accounts[0])
      // await signIn('metamask', { address: accounts[0] })
      alert(`MetaMask connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
    } catch (error) {
      console.error('MetaMask login failed:', error)
      alert('Failed to connect MetaMask. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('email')
    try {
      console.log('Email login:', email)
      await handleWeb3AuthLogin()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-200 border border-dark-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-sm">
            Choose your preferred method to get started
          </p>
        </div>

        {/* Connection Options */}
        <div className="space-y-4">
          {/* Email Login (Web3Auth) */}
          {!showEmailForm ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEmailForm(true)}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'web3auth' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">📧</span>
                  <span>Continue with Email</span>
                  <span className="ml-auto px-2 py-0.5 bg-white/20 rounded text-xs">
                    Easy
                  </span>
                </>
              )}
            </motion.button>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 bg-dark-300 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading !== null}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {loading === 'email' ? 'Connecting...' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="px-4 py-3 bg-dark-300 hover:bg-dark-400 text-gray-300 rounded-xl transition-colors"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-gray-500 text-xs">OR</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {/* MetaMask Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMetamaskLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'metamask' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🦊</span>
                <span>Connect MetaMask</span>
                <span className="ml-auto px-2 py-0.5 bg-white/20 rounded text-xs">
                  Web3
                </span>
              </>
            )}
          </motion.button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="text-xs text-gray-300">
              <p className="font-semibold text-blue-300 mb-1">New to crypto?</p>
              <p>
                Choose <strong>Email</strong> for the easiest experience. 
                We'll create a secure wallet for you automatically using Web3Auth.
              </p>
            </div>
          </div>
        </div>

        {/* Buy Pack Button (shown after connection) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all opacity-50 cursor-not-allowed"
          disabled
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <div>Buy Fan Coins Pack</div>
              <div className="text-xs font-normal opacity-80">
                Available after connecting wallet
              </div>
            </div>
          </div>
        </motion.button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            <strong className="text-yellow-400">LEGAL:</strong> By connecting, you acknowledge this is a social gaming platform. 
            You're purchasing entertainment currency (Fan Coins). BlackBook tokens ($BB) are FREE sweepstakes entries.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Buy Pack Modal Component (for post-connection USDC deposits)
export function BuyPackModal({ onClose }: { onClose: () => void }) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const packs = [
    {
      id: 'starter',
      name: 'Starter Pack',
      usdc: 10,
      fanCoins: 10000,
      bonusBB: 50,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      usdc: 50,
      fanCoins: 55000,
      bonusBB: 300,
      popular: true,
      savings: '10% Bonus'
    },
    {
      id: 'elite',
      name: 'Elite Pack',
      usdc: 100,
      fanCoins: 120000,
      bonusBB: 700,
      popular: false,
      savings: '20% Bonus'
    }
  ]

  const handlePurchase = async () => {
    if (!selectedPack) return
    
    setLoading(true)
    try {
      // Placeholder for Base USDC transaction
      console.log('Initiating USDC deposit on Base:', selectedPack)
      alert('USDC deposit integration coming soon!')
      
      // TODO: Integrate with Base blockchain
      // 1. Request USDC approval
      // 2. Transfer USDC to contract
      // 3. Mint Fan Coins + award $BB bonus
      
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-200 border border-dark-border rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎁</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Buy Fan Coins Pack
          </h2>
          <p className="text-gray-400 text-sm">
            Purchase entertainment currency + get FREE $BB bonus!
          </p>
        </div>

        {/* Pack Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {packs.map((pack) => (
            <motion.button
              key={pack.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPack(pack.id)}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                selectedPack === pack.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-dark-border bg-dark-300 hover:border-gray-600'
              }`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="font-bold text-white mb-2">{pack.name}</h3>
                <div className="text-3xl font-bold prism-gradient-text mb-1">
                  ${pack.usdc}
                </div>
                <div className="text-sm text-gray-400 mb-4">USDC</div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Fan Coins:</span>
                    <span className="font-bold text-purple-300">
                      {pack.fanCoins.toLocaleString()} FC
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">FREE Bonus:</span>
                    <span className="font-bold text-yellow-300">
                      {pack.bonusBB} $BB
                    </span>
                  </div>
                </div>
                
                {pack.savings && (
                  <div className="mt-3 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                    {pack.savings}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Purchase Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePurchase}
          disabled={!selectedPack || loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Transaction...</span>
            </div>
          ) : selectedPack ? (
            `Purchase ${packs.find(p => p.id === selectedPack)?.name} - $${packs.find(p => p.id === selectedPack)?.usdc} USDC`
          ) : (
            'Select a Pack'
          )}
        </motion.button>

        {/* Compliance Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-yellow-400">COMPLIANCE:</strong> You are purchasing <strong>Fan Coins (FC)</strong> for entertainment only. 
            The <strong>$BB tokens</strong> are a <strong>FREE BONUS</strong> (sweepstakes entries). 
            You are NOT buying $BB. No purchase necessary to receive $BB.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  )
}
