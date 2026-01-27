'use client'

import { useState, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Creator {
  id: string
  name: string
  avatar_url?: string
  salary: number
  avg_score: number
  category: string
  stats?: {
    subscribers?: string
    avg_views?: string
    engagement?: string
  }
}

interface RosterDraftProps {
  creators: Creator[]
  maxSlots: number
  salaryCap: number
  selectedCreators: Creator[]
  onSelect: (creator: Creator) => void
  onRemove: (creatorId: string) => void
  disabled?: boolean
  status: 'upcoming' | 'live' | 'settled'
}

export default function RosterDraft({
  creators,
  maxSlots,
  salaryCap,
  selectedCreators,
  onSelect,
  onRemove,
  disabled = false,
  status
}: RosterDraftProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Calculate salary usage
  const usedSalary = selectedCreators.reduce((sum, c) => sum + c.salary, 0)
  const remainingSalary = salaryCap - usedSalary
  const salaryPercentage = (usedSalary / salaryCap) * 100

  // Filter creators
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || creator.category === categoryFilter
    const notSelected = !selectedCreators.find(c => c.id === creator.id)
    return matchesSearch && matchesCategory && notSelected
  })

  // Get unique categories
  const categories = ['all', ...new Set(creators.map(c => c.category))]

  // Check if roster is complete
  const isRosterComplete = selectedCreators.length === maxSlots

  // Can afford check
  const canAfford = (creator: Creator) => creator.salary <= remainingSalary

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: The Market (Creator Pool) */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>👥</span>
                Creator Market
              </h3>
              <span className="px-2 py-1 text-xs border border-gray-600 rounded-full">
                {filteredCreators.length} available
              </span>
            </div>
            
            {/* Search & Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 text-sm rounded-lg capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-cyan-400 text-black font-semibold'
                        : 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredCreators.map((creator) => {
                const affordable = canAfford(creator)
                const slotsAvailable = selectedCreators.length < maxSlots

                return (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between p-4 bg-gray-900 rounded-lg border transition-all ${
                      affordable && slotsAvailable && !disabled
                        ? 'border-gray-700 hover:border-cyan-400 cursor-pointer'
                        : 'border-gray-800 opacity-50'
                    }`}
                    onClick={() => affordable && slotsAvailable && !disabled && onSelect(creator)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{creator.name[0]}</span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">{creator.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            📈 {creator.avg_score} avg pts
                          </span>
                          {creator.stats?.subscribers && (
                            <span>{creator.stats.subscribers} subs</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-lg font-bold ${affordable ? 'text-green-400' : 'text-red-400'}`}>
                          ${creator.salary.toLocaleString()}
                        </span>
                        <p className="text-xs text-gray-500">salary</p>
                      </div>
                      
                      {affordable && slotsAvailable && !disabled && (
                        <button className="h-10 w-10 rounded-full bg-cyan-400/20 hover:bg-cyan-400/40 flex items-center justify-center text-cyan-400 text-xl transition-colors">
                          +
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {filteredCreators.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No creators match your search
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: My Squad */}
      <div className="space-y-4">
        {/* Salary Cap Bar */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              💰 Salary Cap
            </span>
            <span className={`font-bold ${salaryPercentage > 100 ? 'text-red-400' : 'text-green-400'}`}>
              ${usedSalary.toLocaleString()} / ${salaryCap.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(salaryPercentage, 100)}%` }}
              className={`h-full rounded-full ${
                salaryPercentage > 100
                  ? 'bg-red-500'
                  : salaryPercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-gradient-to-r from-cyan-400 to-purple-500'
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ${remainingSalary.toLocaleString()} remaining
          </p>
        </div>

        {/* Squad Slots */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">My Squad</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                isRosterComplete ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {selectedCreators.length}/{maxSlots}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Array.from({ length: maxSlots }).map((_, index) => {
                const creator = selectedCreators[index]

                return (
                  <motion.div
                    key={index}
                    layout
                    className={`p-4 rounded-lg border-2 border-dashed ${
                      creator
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    {creator ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {creator.avatar_url ? (
                              <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{creator.name[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{creator.name}</p>
                            <p className="text-xs text-gray-400">${creator.salary.toLocaleString()}</p>
                          </div>
                        </div>
                        {!disabled && (
                          <button
                            className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center justify-center transition-colors"
                            onClick={() => onRemove(creator.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-10 text-gray-500 text-sm">
                        + Slot {index + 1}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Projected Score */}
            {selectedCreators.length > 0 && (
              <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Projected Score</span>
                  <span className="font-bold text-cyan-400">
                    {selectedCreators.reduce((sum, c) => sum + c.avg_score, 0).toFixed(1)} pts
                  </span>
                </div>
              </div>
            )}

            {/* Complete Status */}
            {isRosterComplete && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-lg flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm text-green-400">Roster complete! Ready to submit.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
