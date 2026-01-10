// Password Reset Page
// Allows users to set a new password after clicking reset link

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/supabase'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const result = await updatePassword(password)
    if (result) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      setError('Failed to update password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-dark-200 border border-dark-border rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Reset Password</h1>
            <p className="text-gray-400 text-center mb-6">Enter your new password below</p>

            {success ? (
              <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center">
                Password updated successfully! Redirecting...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-sm text-prism-teal hover:underline"
                  >
                    ← Back to Home
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
