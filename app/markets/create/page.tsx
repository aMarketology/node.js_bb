'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import CreateMarketForm from '@/app/components/CreateMarketForm'

export default function CreateMarketPage() {
  const router = useRouter()

  const handleSuccess = (marketId: string) => {
    console.log('✅ Market created successfully:', marketId)
    // Redirect to the new market page
    setTimeout(() => {
      router.push(`/markets/${marketId}`)
    }, 2000)
  }

  const handleCancel = () => {
    router.push('/markets')
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 prism-gradient-bg opacity-5" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            {/* Market Standards Info */}
            <div className="bg-dark-200 border border-dark-border rounded-xl p-6 mb-8 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">📋 Market Standards</h3>
              <div className="grid md:grid-columns-2 gap-4 text-sm text-gray-300">
                <div>
                  <p className="text-prism-teal font-medium mb-2">Liquidity Requirements:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Minimum: $100 BC</li>
                    <li>• Recommended: $500 BC</li>
                    <li>• Maximum: $1,000,000 BC</li>
                  </ul>
                </div>
                <div>
                  <p className="text-prism-teal font-medium mb-2">Market Duration:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Minimum: 1 hour</li>
                    <li>• Maximum: 365 days</li>
                    <li>• Resolution window: 72 hours</li>
                  </ul>
                </div>
                <div>
                  <p className="text-prism-teal font-medium mb-2">Content Requirements:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Title: 10-200 characters</li>
                    <li>• Description: 20-2000 characters</li>
                    <li>• Resolution criteria required</li>
                  </ul>
                </div>
                <div>
                  <p className="text-prism-teal font-medium mb-2">Outcomes:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Minimum: 2 outcomes (binary)</li>
                    <li>• Maximum: 10 outcomes</li>
                    <li>• Labels must be unique</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form */}
            <CreateMarketForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
