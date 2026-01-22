'use client'

import { useState } from 'react'

interface PasswordPromptProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<boolean> | boolean
  onReset?: () => void
  title?: string
  message?: string
  externalError?: string
}

export default function PasswordPrompt({ 
  isOpen, 
  onClose, 
  onSubmit,
  onReset,
  title = "Password Required",
  message = "Your session has expired. Please enter your password to continue.",
  externalError
}: PasswordPromptProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await onSubmit(password)
      
      if (result) {
        // Success - clear and close
        setPassword('')
        setLoading(false)
      } else {
        // Failed - show error but keep open for retry
        setError('Incorrect password. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-amber-500/30 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-400">{title}</h2>
            <p className="text-gray-400 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-amber-500/30 rounded-lg text-white focus:outline-none focus:border-amber-500"
              placeholder="Enter your password"
              autoFocus
              disabled={loading}
            />
            {(error || externalError) && (
              <p className="text-red-400 text-sm mt-1">{error || externalError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-xs">
            🔒 Password will be stored in memory for 15 minutes only. Your private keys are never stored.
          </p>
        </div>
      </div>
    </div>
  )
}
