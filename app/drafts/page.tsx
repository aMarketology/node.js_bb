'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import { useLayer2 } from '@/app/contexts/Layer2Context'
import { useAuth } from '@/app/contexts/AuthContext'

export default function DraftsPage() {
  const { createDraftProp, fundDraft, getMyDrafts, editDraft, deleteDraft, isConnected } = useLayer2()
  const { isAuthenticated } = useAuth()
  
  const [myDrafts, setMyDrafts] = useState<any[]>([])
  const [allDrafts, setAllDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Create form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [outcomes, setOutcomes] = useState(['', ''])
  const [initialLiquidity, setInitialLiquidity] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isAuthenticated && isConnected) {
      loadDrafts()
    }
  }, [isAuthenticated, isConnected])

  async function loadDrafts() {
    try {
      setLoading(true)
      
      // Get drafts created by this user
      const my = await getMyDrafts()
      setMyDrafts(my || [])
      
      // Get all draft markets from API
      const res = await fetch('http://localhost:1234/markets/drafts')
      if (res.ok) {
        const data = await res.json()
        setAllDrafts(data.markets || [])
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDraft() {
    if (!title || outcomes.filter(o => o.trim()).length < 2) {
      alert('Please provide a title and at least 2 outcomes')
      return
    }
    
    try {
      setCreating(true)
      const validOutcomes = outcomes.filter(o => o.trim())
      await createDraftProp(title, validOutcomes, description, parseFloat(initialLiquidity) || 0)
      
      // Reset form
      setTitle('')
      setDescription('')
      setOutcomes(['', ''])
      setInitialLiquidity('')
      setShowCreateForm(false)
      
      await loadDrafts()
      alert('Draft prop created successfully!')
    } catch (error: any) {
      alert(`Failed to create draft: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleFundDraft(marketId: string, amount: number) {
    try {
      await fundDraft(marketId, amount)
      await loadDrafts()
      alert(`Funded ${amount} BB successfully!`)
    } catch (error: any) {
      alert(`Failed to fund draft: ${error.message}`)
    }
  }

  async function handleDeleteDraft(marketId: string) {
    if (!confirm('Are you sure you want to delete this draft?')) return
    
    try {
      await deleteDraft(marketId)
      await loadDrafts()
      alert('Draft deleted successfully!')
    } catch (error: any) {
      alert(`Failed to delete draft: ${error.message}`)
    }
  }

  function addOutcome() {
    setOutcomes([...outcomes, ''])
  }

  function updateOutcome(index: number, value: string) {
    const newOutcomes = [...outcomes]
    newOutcomes[index] = value
    setOutcomes(newOutcomes)
  }

  function removeOutcome(index: number) {
    if (outcomes.length <= 2) return
    const newOutcomes = outcomes.filter((_, i) => i !== index)
    setOutcomes(newOutcomes)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Draft Markets</h1>
          <p className="text-gray-400 mb-8">Sign in to create and fund draft props</p>
          <button className="px-8 py-4 rounded-xl font-semibold text-white prism-gradient-bg">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (loading || !isConnected) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Draft Markets</h1>
              <p className="text-gray-400">Community-proposed prediction markets</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
            >
              {showCreateForm ? 'Cancel' : '+ Create Draft'}
            </button>
          </div>

          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="prism-card rounded-2xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create New Draft Prop</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Will Argentina win Group B?"
                    className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional context or resolution criteria..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Outcomes * (minimum 2)
                  </label>
                  {outcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => updateOutcome(index, e.target.value)}
                        placeholder={`Outcome ${index + 1}`}
                        className="flex-1 px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                      />
                      {outcomes.length > 2 && (
                        <button
                          onClick={() => removeOutcome(index)}
                          className="px-4 py-3 rounded-lg bg-prism-red/20 text-prism-red border border-prism-red/50 hover:bg-prism-red/30 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOutcome}
                    className="text-sm text-prism-teal hover:text-prism-teal-light transition-colors"
                  >
                    + Add Outcome
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Initial Liquidity (BB) - Optional
                  </label>
                  <input
                    type="number"
                    value={initialLiquidity}
                    onChange={(e) => setInitialLiquidity(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-dark-border text-white focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Add initial liquidity to bootstrap your market. Community can fund more.
                  </p>
                </div>

                <button
                  onClick={handleCreateDraft}
                  disabled={creating}
                  className="w-full px-6 py-4 rounded-xl font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Draft Prop'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* My Drafts */}
        {myDrafts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Your Drafts</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {myDrafts.map((draft, index) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="prism-card rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{draft.title}</h3>
                    <div className="px-3 py-1 rounded-full bg-prism-purple/20 text-prism-purple border border-prism-purple/50 text-xs font-bold">
                      DRAFT
                    </div>
                  </div>
                  
                  {draft.description && (
                    <p className="text-gray-400 text-sm mb-4">{draft.description}</p>
                  )}

                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Funding Progress</div>
                    <div className="h-2 bg-dark-300 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full prism-gradient-bg"
                        style={{ width: `${Math.min((draft.current_funding / draft.funding_goal) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {draft.current_funding} / {draft.funding_goal} BB
                      </span>
                      <span className="text-prism-teal font-bold">
                        {((draft.current_funding / draft.funding_goal) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-prism-red/20 text-prism-red border border-prism-red/50 hover:bg-prism-red/30 transition-colors text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Draft Markets */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Community Drafts</h2>
          {allDrafts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No community drafts yet. Be the first to create one!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDrafts.map((draft, index) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="prism-card rounded-xl p-6 hover:border-prism-teal/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{draft.title}</h3>
                    <div className="px-3 py-1 rounded-full bg-prism-purple/20 text-prism-purple border border-prism-purple/50 text-xs font-bold">
                      DRAFT
                    </div>
                  </div>

                  {draft.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{draft.description}</p>
                  )}

                  <div className="mb-4">
                    <div className="h-2 bg-dark-300 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full prism-gradient-bg"
                        style={{ width: `${Math.min((draft.current_funding / draft.funding_goal) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      {draft.current_funding} / {draft.funding_goal} BB ({((draft.current_funding / draft.funding_goal) * 100).toFixed(0)}%)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const amount = prompt('Enter funding amount (BB):')
                      if (amount) handleFundDraft(draft.id, parseFloat(amount))
                    }}
                    className="w-full px-4 py-2 rounded-lg font-semibold text-white prism-gradient-bg hover:opacity-90 transition-opacity"
                  >
                    Fund This Draft
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
