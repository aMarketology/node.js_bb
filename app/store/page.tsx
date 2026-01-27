"use client"

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Navigation, Footer } from '../components'
import { BuyPackModal } from '../components/WalletConnection'

export default function StorePage() {
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)

  const packs = [
    {
      id: 'starter',
      name: 'Starter Pack',
      price: 10,
      fanCoins: 10000,
      bonusBB: 50,
      popular: false,
      description: 'Perfect for beginners',
      icon: '🎮'
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: 50,
      fanCoins: 55000,
      bonusBB: 300,
      popular: true,
      savings: '10% Bonus',
      description: 'Best value for regular players',
      icon: '🏆'
    },
    {
      id: 'elite',
      name: 'Elite Pack',
      price: 100,
      fanCoins: 120000,
      bonusBB: 700,
      popular: false,
      savings: '20% Bonus',
      description: 'Maximum entertainment value',
      icon: '👑'
    },
    {
      id: 'mega',
      name: 'Mega Pack',
      price: 250,
      fanCoins: 325000,
      bonusBB: 2000,
      popular: false,
      savings: '30% Bonus',
      description: 'For the ultimate experience',
      icon: '💎'
    }
  ]

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-dark-100 via-dark-200 to-dark-300 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="prism-gradient-text">Fan Coins Store</span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Purchase entertainment currency for social gaming
            </p>
            
            {/* Legal Banner */}
            <div className="max-w-3xl mx-auto p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-gray-300">
                <strong className="text-yellow-400">COMPLIANCE:</strong> You are purchasing <strong>Fan Coins (FC)</strong> for entertainment only. 
                BlackBook tokens (<strong>$BB</strong>) are <strong className="text-green-400">FREE BONUSES</strong> included with every purchase. 
                You are <strong className="text-red-400">NOT</strong> buying $BB directly.
              </p>
            </div>
          </motion.div>

          {/* Pack Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group ${pack.popular ? 'lg:col-span-1' : ''}`}
              >
                {pack.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                      🔥 MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className={`relative h-full p-8 rounded-2xl border-2 transition-all duration-300 ${
                  pack.popular
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'bg-dark-200/50 border-dark-border hover:border-purple-500/30'
                } group-hover:scale-105 group-hover:shadow-2xl`}>
                  {/* Icon */}
                  <div className="text-6xl mb-4 text-center">{pack.icon}</div>
                  
                  {/* Pack Name */}
                  <h3 className="text-2xl font-bold text-center text-white mb-2">
                    {pack.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-center text-gray-400 text-sm mb-6">
                    {pack.description}
                  </p>
                  
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold prism-gradient-text mb-1">
                      ${pack.price}
                    </div>
                    <div className="text-sm text-gray-500">USD / USDC</div>
                  </div>
                  
                  {/* What You Get */}
                  <div className="space-y-4 mb-6">
                    {/* Fan Coins (PRIMARY PURCHASE) */}
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm">You Receive:</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-300">
                        {pack.fanCoins.toLocaleString()} FC
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Fan Coins (Entertainment)</div>
                    </div>
                    
                    {/* $BB Bonus (FREE - COMPLIANT) */}
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-bl">
                        FREE BONUS
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm">Free Sweepstakes:</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-300">
                        {pack.bonusBB} $BB
                      </div>
                      <div className="text-xs text-gray-400 mt-1">BlackBook Tokens (No Purchase Necessary)</div>
                    </div>
                  </div>
                  
                  {/* Savings Badge */}
                  {pack.savings && (
                    <div className="text-center mb-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full">
                        💰 {pack.savings}
                      </span>
                    </div>
                  )}
                  
                  {/* Buy Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPack(pack.id)
                      setShowBuyModal(true)
                    }}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
                    }`}
                  >
                    Buy {pack.name}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 bg-dark-200/50 border border-dark-border rounded-xl">
                <div className="text-4xl mb-4 text-center">1️⃣</div>
                <h3 className="font-bold text-white mb-2 text-center">Choose Your Pack</h3>
                <p className="text-sm text-gray-400 text-center">
                  Select the Fan Coins package that fits your entertainment needs.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="p-6 bg-dark-200/50 border border-dark-border rounded-xl">
                <div className="text-4xl mb-4 text-center">2️⃣</div>
                <h3 className="font-bold text-white mb-2 text-center">Complete Purchase</h3>
                <p className="text-sm text-gray-400 text-center">
                  Pay with USDC on Base blockchain for instant delivery.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="p-6 bg-dark-200/50 border border-dark-border rounded-xl">
                <div className="text-4xl mb-4 text-center">3️⃣</div>
                <h3 className="font-bold text-white mb-2 text-center">Start Playing!</h3>
                <p className="text-sm text-gray-400 text-center">
                  Use FC for fun contests. Your FREE $BB can win real USDC prizes!
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              <details className="p-6 bg-dark-200/50 border border-dark-border rounded-xl group">
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>What are Fan Coins (FC)?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  Fan Coins are virtual entertainment currency with NO cash value. They're used for fun play, practice contests, and social competitions. Think of them like arcade tokens!
                </p>
              </details>
              
              <details className="p-6 bg-dark-200/50 border border-dark-border rounded-xl group">
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>Am I buying BlackBook tokens ($BB)?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  <strong className="text-red-400">NO.</strong> You are purchasing Fan Coins (FC) for entertainment. The $BB tokens are a <strong className="text-green-400">FREE BONUS</strong> (like a sweepstakes prize). This keeps everything 100% legal.
                </p>
              </details>
              
              <details className="p-6 bg-dark-200/50 border border-dark-border rounded-xl group">
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>Can I get $BB without buying FC?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  <strong className="text-green-400">YES!</strong> Get 100 $BB when you sign up, 10 $BB per day for logging in, and more through promotions. <strong>No purchase necessary.</strong>
                </p>
              </details>
              
              <details className="p-6 bg-dark-200/50 border border-dark-border rounded-xl group">
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>What can I win with $BB?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  Real USDC prizes! $BB entries in skill-based fantasy contests can win cryptocurrency that you can withdraw to your wallet.
                </p>
              </details>
              
              <details className="p-6 bg-dark-200/50 border border-dark-border rounded-xl group">
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between">
                  <span>Is this legal?</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  <strong className="text-green-400">100% LEGAL.</strong> We use a "Double Shield" strategy: (1) Sweepstakes model (free $BB) + (2) Skill-based fantasy games. Both are legal under Texas law and federal regulations.
                </p>
              </details>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-12"
          >
            <p className="text-gray-400 mb-4">
              Need more information about our legal framework?
            </p>
            <a
              href="/get-started"
              className="inline-block px-8 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded-xl transition-colors"
            >
              Learn About Our Double Shield Strategy →
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
      
      {/* Buy Pack Modal */}
      {showBuyModal && (
        <BuyPackModal onClose={() => setShowBuyModal(false)} />
      )}
    </>
  )
}
