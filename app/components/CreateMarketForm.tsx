'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CREATE MARKET FORM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Market creation form with real-time validation against market standards.
 * Enforces all requirements from /markets-tests/market-standards.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'

// Import market standards for validation
const MARKET_REQUIREMENTS = {
  MIN_LIQUIDITY: 100,
  MAX_LIQUIDITY: 1000000,
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_OUTCOMES: 2,
  MAX_OUTCOMES: 10,
  OUTCOME_LABEL_MAX_LENGTH: 50,
  MIN_DURATION_MS: 60 * 60 * 1000,       // 1 hour
  MAX_DURATION_MS: 365 * 24 * 60 * 60 * 1000  // 365 days
}

const MARKET_CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'politics', label: 'Politics' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'finance', label: 'Finance' },
  { value: 'tech', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'world', label: 'World Events' },
  { value: 'other', label: 'Other' }
  { value: 'social', label: 'Social' }
]

interface FormData {
  title: string
  description: string
  outcomes: string[]
  closes_at: string
  resolution_criteria: string
  category: string
  initial_liquidity: number
}

interface CreateMarketFormProps {
  onSuccess?: (marketId: string) => void
  onCancel?: () => void
}

export default function CreateMarketForm({ onSuccess, onCancel }: CreateMarketFormProps) {
  const { activeWalletData, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    outcomes: ['Yes', 'No'],
    closes_at: '',
    resolution_criteria: '',
    category: 'crypto',
    initial_liquidity: 100
  })

  // Real-time validation
  useEffect(() => {
    validateForm()
  }, [formData])

  const validateForm = () => {
    const newErrors: string[] = []
    const newFieldErrors: Record<string, string> = {}

    // Title validation
    if (formData.title.length > 0 && formData.title.length < MARKET_REQUIREMENTS.MIN_TITLE_LENGTH) {
      newFieldErrors.title = `Title must be at least ${MARKET_REQUIREMENTS.MIN_TITLE_LENGTH} characters`
    }
    if (formData.title.length > MARKET_REQUIREMENTS.MAX_TITLE_LENGTH) {
      newFieldErrors.title = `Title must be at most ${MARKET_REQUIREMENTS.MAX_TITLE_LENGTH} characters`
    }

    // Description validation
    if (formData.description.length > 0 && formData.description.length < MARKET_REQUIREMENTS.MIN_DESCRIPTION_LENGTH) {
      newFieldErrors.description = `Description must be at least ${MARKET_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters`
    }
    if (formData.description.length > MARKET_REQUIREMENTS.MAX_DESCRIPTION_LENGTH) {
      newFieldErrors.description = `Description must be at most ${MARKET_REQUIREMENTS.MAX_DESCRIPTION_LENGTH} characters`
    }

    // Outcomes validation
    const validOutcomes = formData.outcomes.filter(o => o.trim().length > 0)
    if (validOutcomes.length < MARKET_REQUIREMENTS.MIN_OUTCOMES) {
      newFieldErrors.outcomes = `Must have at least ${MARKET_REQUIREMENTS.MIN_OUTCOMES} outcomes`
    }
    if (validOutcomes.length > MARKET_REQUIREMENTS.MAX_OUTCOMES) {
      newFieldErrors.outcomes = `Maximum ${MARKET_REQUIREMENTS.MAX_OUTCOMES} outcomes allowed`
    }

    // Check for duplicate outcomes
    const uniqueOutcomes = new Set(validOutcomes.map(o => o.toLowerCase()))
    if (uniqueOutcomes.size !== validOutcomes.length) {
      newFieldErrors.outcomes = 'Outcome labels must be unique'
    }

    // Closes_at validation
    if (formData.closes_at) {
      const closesAt = new Date(formData.closes_at).getTime()
      const now = Date.now()
      const duration = closesAt - now

      if (closesAt <= now) {
        newFieldErrors.closes_at = 'Market must close in the future'
      } else if (duration < MARKET_REQUIREMENTS.MIN_DURATION_MS) {
        newFieldErrors.closes_at = 'Market must be open for at least 1 hour'
      } else if (duration > MARKET_REQUIREMENTS.MAX_DURATION_MS) {
        newFieldErrors.closes_at = 'Market cannot be open for more than 365 days'
      }
    }

    // Liquidity validation
    if (formData.initial_liquidity < MARKET_REQUIREMENTS.MIN_LIQUIDITY) {
      newFieldErrors.initial_liquidity = `Minimum liquidity is $${MARKET_REQUIREMENTS.MIN_LIQUIDITY} BC`
    }
    if (formData.initial_liquidity > MARKET_REQUIREMENTS.MAX_LIQUIDITY) {
      newFieldErrors.initial_liquidity = `Maximum liquidity is $${MARKET_REQUIREMENTS.MAX_LIQUIDITY.toLocaleString()} BC`
    }

    // Resolution criteria validation
    if (formData.resolution_criteria.length === 0 && formData.description.length > 0) {
      newFieldErrors.resolution_criteria = 'Resolution criteria is required'
    }

    setFieldErrors(newFieldErrors)
    setErrors(Object.values(newFieldErrors))
  }

  const addOutcome = () => {
    if (formData.outcomes.length < MARKET_REQUIREMENTS.MAX_OUTCOMES) {
      setFormData({
        ...formData,
        outcomes: [...formData.outcomes, '']
      })
    }
  }

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length > MARKET_REQUIREMENTS.MIN_OUTCOMES) {
      setFormData({
        ...formData,
        outcomes: formData.outcomes.filter((_, i) => i !== index)
      })
    }
  }

  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...formData.outcomes]
    newOutcomes[index] = value.slice(0, MARKET_REQUIREMENTS.OUTCOME_LABEL_MAX_LENGTH)
    setFormData({ ...formData, outcomes: newOutcomes })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !activeWalletData) {
      alert('Please connect your wallet first')
      return
    }

    // Final validation
    validateForm()
    if (errors.length > 0) {
      alert('Please fix all validation errors before submitting')
      return
    }

    // Check required fields
    if (!formData.title || !formData.description || !formData.resolution_criteria || !formData.closes_at) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'
      
      // Prepare market data
      const marketData = {
        id: `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        description: formData.description,
        outcomes: formData.outcomes
          .filter(o => o.trim().length > 0)
          .map((label, index) => ({ index, label: label.trim() })),
        closes_at: Math.floor(new Date(formData.closes_at).getTime() / 1000),
        resolution_criteria: formData.resolution_criteria,
        category: formData.category,
        initial_liquidity: formData.initial_liquidity,
        creator: activeWalletData.l2Address || activeWalletData.l1Address,
        created_at: Math.floor(Date.now() / 1000),
        status: 'pending' // Will become 'active' once funded
      }

      console.log('📤 Creating market:', marketData)

      const response = await fetch(`${L2_API}/market/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Market creation failed: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Market created:', result)

      if (onSuccess && result.market_id) {
        onSuccess(result.market_id)
      }

    } catch (error: any) {
      console.error('❌ Market creation error:', error)
      alert(`Failed to create market: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Prediction Market</h2>
          <p className="text-gray-400">
            Minimum ${MARKET_REQUIREMENTS.MIN_LIQUIDITY} BC initial liquidity required
          </p>
        </div>

        {/* Category */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
          >
            {MARKET_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Market Title *
            <span className="text-gray-500 font-normal ml-2">
              ({formData.title.length}/{MARKET_REQUIREMENTS.MAX_TITLE_LENGTH} chars, min {MARKET_REQUIREMENTS.MIN_TITLE_LENGTH})
            </span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Will Bitcoin exceed $100,000 before June 1, 2026?"
            maxLength={MARKET_REQUIREMENTS.MAX_TITLE_LENGTH}
            className={`w-full px-4 py-3 bg-dark border rounded-lg text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors ${fieldErrors.title ? 'border-red-500' : 'border-dark-border'}`}
          />
          {fieldErrors.title && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Description *
            <span className="text-gray-500 font-normal ml-2">
              ({formData.description.length}/{MARKET_REQUIREMENTS.MAX_DESCRIPTION_LENGTH} chars, min {MARKET_REQUIREMENTS.MIN_DESCRIPTION_LENGTH})
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide detailed context for this market..."
            rows={6}
            maxLength={MARKET_REQUIREMENTS.MAX_DESCRIPTION_LENGTH}
            className={`w-full px-4 py-3 bg-dark border rounded-lg text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors ${fieldErrors.description ? 'border-red-500' : 'border-dark-border'}`}
          />
          {fieldErrors.description && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.description}</p>
          )}
        </div>

        {/* Outcomes */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Outcomes ({formData.outcomes.length})
            <span className="text-gray-500 font-normal ml-2">
              ({MARKET_REQUIREMENTS.MIN_OUTCOMES}-{MARKET_REQUIREMENTS.MAX_OUTCOMES} outcomes)
            </span>
          </label>
          
          <div className="space-y-3 mb-4">
            {formData.outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder={`Outcome ${index + 1}`}
                  maxLength={MARKET_REQUIREMENTS.OUTCOME_LABEL_MAX_LENGTH}
                  className="flex-1 px-4 py-3 bg-dark border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                />
                {formData.outcomes.length > MARKET_REQUIREMENTS.MIN_OUTCOMES && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {formData.outcomes.length < MARKET_REQUIREMENTS.MAX_OUTCOMES && (
            <button
              type="button"
              onClick={addOutcome}
              className="w-full px-4 py-3 bg-dark border border-dashed border-dark-border hover:border-prism-teal rounded-lg text-gray-400 hover:text-prism-teal transition-colors"
            >
              + Add Outcome
            </button>
          )}

          {fieldErrors.outcomes && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.outcomes}</p>
          )}
        </div>

        {/* Closes At */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Market Closes At *
            <span className="text-gray-500 font-normal ml-2">
              (Trading stops at this time)
            </span>
          </label>
          <input
            type="datetime-local"
            value={formData.closes_at}
            onChange={(e) => setFormData({ ...formData, closes_at: e.target.value })}
            min={new Date(Date.now() + MARKET_REQUIREMENTS.MIN_DURATION_MS).toISOString().slice(0, 16)}
            className={`w-full px-4 py-3 bg-dark border rounded-lg text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors ${fieldErrors.closes_at ? 'border-red-500' : 'border-dark-border'}`}
          />
          {fieldErrors.closes_at && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.closes_at}</p>
          )}
        </div>

        {/* Resolution Criteria */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Resolution Criteria *
            <span className="text-gray-500 font-normal ml-2">
              (How will the market be resolved?)
            </span>
          </label>
          <textarea
            value={formData.resolution_criteria}
            onChange={(e) => setFormData({ ...formData, resolution_criteria: e.target.value })}
            placeholder="Resolves based on CoinGecko BTC/USD price. YES if price >= $100,000 at any point before close."
            rows={4}
            className={`w-full px-4 py-3 bg-dark border rounded-lg text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors ${fieldErrors.resolution_criteria ? 'border-red-500' : 'border-dark-border'}`}
          />
          {fieldErrors.resolution_criteria && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.resolution_criteria}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            💡 Specify a verifiable, objective source (e.g., CoinGecko, official announcements, etc.)
          </p>
        </div>

        {/* Initial Liquidity */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-border">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Initial Liquidity *
            <span className="text-gray-500 font-normal ml-2">
              (Min ${MARKET_REQUIREMENTS.MIN_LIQUIDITY} BC, Recommended $500 BC)
            </span>
          </label>
          <input
            type="number"
            value={formData.initial_liquidity}
            onChange={(e) => setFormData({ ...formData, initial_liquidity: parseInt(e.target.value) || 0 })}
            min={MARKET_REQUIREMENTS.MIN_LIQUIDITY}
            max={MARKET_REQUIREMENTS.MAX_LIQUIDITY}
            className={`w-full px-4 py-3 bg-dark border rounded-lg text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors ${fieldErrors.initial_liquidity ? 'border-red-500' : 'border-dark-border'}`}
          />
          {fieldErrors.initial_liquidity && (
            <p className="text-red-400 text-sm mt-2">⚠️ {fieldErrors.initial_liquidity}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            💡 Higher liquidity = better pricing for traders = more volume
          </p>
        </div>

        {/* Error Summary */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/50 rounded-xl p-4"
            >
              <h4 className="text-red-400 font-semibold mb-2">⚠️ Please fix the following errors:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-dark-200 border border-dark-border hover:border-gray-600 text-white rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || errors.length > 0}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-prism-teal via-prism-purple to-prism-pink hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-opacity"
          >
            {isSubmitting ? 'Creating Market...' : 'Create Market'}
          </button>
        </div>

      </form>
    </div>
  )
}
