// Authentication Modal
// Login and Sign Up modal with wallet connection

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import KYCSignup from './KYCSignup'

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, connectWallet } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup' | 'kyc'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = await signIn(email, password)
    if (success) {
      onClose()
    } else {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  const handleWalletConnect = async () => {
    setLoading(true)
    setError('')

    const success = await connectWallet()
    if (success) {
      onClose()
    } else {
      setError('Failed to connect wallet')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-dark border-2 prism-border rounded-3xl shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black prism-gradient-text mb-2">
              {mode === 'kyc' ? 'Create Account' : mode === 'signup' ? 'Get Started' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400">
              {mode === 'kyc' 
                ? 'Complete KYC verification to start trading' 
                : mode === 'signup' 
                ? 'Join thousands predicting the World Cup' 
                : 'Sign in to continue'}
            </p>
          </div>

          {/* KYC Signup Flow */}
          {mode === 'kyc' ? (
            <KYCSignup onClose={onClose} />
          ) : (
            <>
              {/* Login/Signup Forms */}
              <div className="max-w-md mx-auto space-y-6">
                {/* Wallet Connect */}
                <button
                  onClick={handleWalletConnect}
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Connect Wallet
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark text-gray-500">Or continue with email</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                    {error}
                  </div>
                )}

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="text-sm text-prism-teal hover:underline"
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-dark-200 rounded-xl border border-dark-border">
                      <h3 className="font-bold text-white mb-3">Account Types:</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="text-prism-teal text-xl">✓</div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">Full KYC Account</div>
                            <div className="text-sm text-gray-400">Complete verification, full trading access</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-prism-purple text-xl">✓</div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">Wallet-Only Account</div>
                            <div className="text-sm text-gray-400">Connect wallet, limited features</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setMode('kyc')}
                      className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
                    >
                      Start Full KYC Signup →
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-sm text-prism-teal hover:underline"
                      >
                        Already have an account? Sign in
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
