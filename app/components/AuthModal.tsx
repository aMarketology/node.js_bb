// Authentication Modal
// Login and Sign Up modal with wallet connection

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import KYCSignup from './KYCSignup'
import { resetPasswordForEmail } from '@/lib/supabase'

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, signUp, connectWallet } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup' | 'quicksignup' | 'kyc' | 'forgot-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = await signIn(email, password)
    if (success) {
      onClose()
    } else {
      setError('Invalid email or password. Make sure you have signed up first.')
    }
    setLoading(false)
  }

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const result = await signUp(email, password, username || undefined)
    if (result) {
      // Try to sign in immediately after signup
      const signInSuccess = await signIn(email, password)
      if (signInSuccess) {
        onClose()
      } else {
        // If sign in fails, show message (might need email confirmation)
        setSuccess('Account created! You can now sign in.')
        setMode('login')
      }
    } else {
      setError('Failed to create account. Email may already be in use.')
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    const result = await resetPasswordForEmail(email)
    if (result) {
      setSuccess('Password reset link sent! Check your email.')
      setTimeout(() => {
        setMode('login')
        setSuccess('')
      }, 3000)
    } else {
      setError('Failed to send reset email. Please try again.')
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
              {mode === 'kyc' ? 'Full KYC Signup' : mode === 'quicksignup' ? 'Quick Sign Up' : mode === 'signup' ? 'Get Started' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400">
              {mode === 'kyc' 
                ? 'Complete KYC verification to start trading' 
                : mode === 'quicksignup'
                ? 'Create an account quickly (no KYC required)'
                : mode === 'signup' 
                ? 'Choose how you want to join' 
                : 'Sign in to continue'}
            </p>
          </div>

          {/* KYC Signup Flow */}
          {mode === 'kyc' ? (
            <KYCSignup onClose={onClose} />
          ) : mode === 'quicksignup' ? (
            /* Quick Signup Form - No KYC */
            <div className="max-w-md mx-auto space-y-6">
              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm">
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleQuickSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username (optional)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="cooltrader123"
                    className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                  You can complete full KYC verification later for increased limits.
                </p>
              </form>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-prism-teal hover:underline"
                >
                  Already have an account? Sign in
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-sm text-gray-500 hover:text-gray-300"
                >
                  ← Back to signup options
                </button>
              </div>
            </div>
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

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm">
                    {success}
                  </div>
                )}

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
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-xs text-prism-teal hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
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
                ) : mode === 'forgot-password' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
                      <p className="text-sm text-gray-400">
                        Enter your email and we'll send you a link to reset your password.
                      </p>
                    </div>

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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-sm text-prism-teal hover:underline"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : mode === 'signup' ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-dark-200 rounded-xl border border-dark-border">
                      <h3 className="font-bold text-white mb-3">Account Types:</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="text-prism-teal text-xl">⚡</div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">Quick Account</div>
                            <div className="text-sm text-gray-400">Email signup, start trading immediately</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-prism-purple text-xl">✓</div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">Full KYC Account</div>
                            <div className="text-sm text-gray-400">Complete verification, higher limits</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setMode('quicksignup')}
                      className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
                    >
                      ⚡ Quick Sign Up (No KYC)
                    </button>

                    <button
                      onClick={() => setMode('kyc')}
                      className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-purple transition-colors"
                    >
                      Full KYC Sign Up →
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
                ) : null}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
