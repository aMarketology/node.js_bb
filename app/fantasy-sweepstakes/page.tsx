'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'

export default function FantasySweepstakesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full mb-6">
            <span className="text-green-400 font-bold">✓ 100% Legal in Texas</span>
            <span className="text-gray-400">•</span>
            <span className="text-green-400 font-bold">✓ NO PURCHASE NECESSARY</span>
            <span className="text-gray-400">•</span>
            <span className="text-green-400 font-bold">✓ Real Prizes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            How <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">Fantasy Sweepstakes</span> Works
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            PRISM is NOT a sportsbook. We're a legal Social Sweepstakes platform operating under Texas and US Sweepstakes law.
            Here's exactly how our dual-currency system works and why it's 100% legal.
          </p>
        </motion.div>

        {/* The Dual-Currency System */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            💰 The Dual-Currency System
          </h2>
          <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            To comply with Texas and US Sweepstakes law, we use two separate tokens. 
            It is critical to understand the difference:
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* FanCoins */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🪙</div>
                <h3 className="text-2xl font-bold text-purple-400 mb-2">1. FanCoins (FC)</h3>
                <p className="text-purple-300 font-semibold">"Play for Fun"</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white mb-2">Purpose:</h4>
                  <p className="text-gray-300">Social reputation and practice.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">How to get them:</h4>
                  <ul className="text-gray-300 space-y-1 ml-4">
                    <li>• Purchase packages or earn via daily login</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">Value:</h4>
                  <p className="text-gray-300"><strong className="text-red-400">NO monetary value.</strong> Cannot be redeemed.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">Usage:</h4>
                  <p className="text-gray-300">Use FanCoins to climb the "Social Leaderboard" and track your prediction accuracy.</p>
                </div>
              </div>
            </div>

            {/* $blackbook */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">2. $blackbook</h3>
                <p className="text-yellow-300 font-semibold">"Sweepstakes Entry"</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white mb-2">Purpose:</h4>
                  <p className="text-gray-300">To enter Sweepstakes contests for real prizes.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">How to get them:</h4>
                  <ul className="text-gray-300 space-y-1 ml-4">
                    <li>• <strong className="text-green-400">FREE</strong> bonus when you purchase FanCoins</li>
                    <li>• <strong className="text-green-400">FREE</strong> via mail-in request (AMOE)</li>
                    <li>• <strong className="text-green-400">FREE</strong> via daily login challenges</li>
                    <li>• <strong className="text-red-400">NEVER</strong> available for direct purchase</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">Value:</h4>
                  <p className="text-gray-300">Redeemable for prizes (e.g., 1 $blackbook = $1.00 USD value).</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* The Legal Framework */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
            ⚖️ The Legal Framework (Why this is Legal in Texas)
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-3xl mx-auto">
            For a game to be "Illegal Gambling" in Texas (Penal Code Ch. 47), it must have three elements: 
            <strong className="text-white"> Prize, Chance, and Consideration (Payment).</strong>
          </p>
          
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6 mb-8 text-center">
            <p className="text-xl text-white">
              <strong>We legally eliminate Consideration:</strong>
            </p>
          </div>
          
          {/* Three Elements */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700 relative">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">❌</span>
              </div>
              <div className="text-4xl mb-4 text-center">💵</div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Consideration (Payment)</h3>
              <p className="text-gray-400 text-center text-sm mb-4">Payment Required</p>
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-300 text-sm">
                  <strong>ELIMINATED.</strong> Because $blackbook tokens are given away for free (via daily bonuses or mail-in requests), you never have to pay to enter a contest.
                </p>
              </div>
            </div>
            
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700 relative">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">❌</span>
              </div>
              <div className="text-4xl mb-4 text-center">🎲</div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Chance</h3>
              <p className="text-gray-400 text-center text-sm mb-4">Random Outcome</p>
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  <strong>REDUCED.</strong> Our contests are skill-based predictions, not random drawings.
                </p>
              </div>
            </div>
            
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700">
              <div className="text-4xl mb-4 text-center">🏆</div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Prize</h3>
              <p className="text-gray-400 text-center text-sm mb-4">Value Awarded</p>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <strong>INCLUDED.</strong> Winners redeem their $blackbook winnings for legal prizes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-xl text-white">
              <strong>Result:</strong> Without "Consideration," PRISM is a legal Social Sweepstakes, not a gambling platform.
            </p>
          </div>
        </motion.section>

        {/* Step by Step */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            📋 Step-by-Step: How to Play
          </h2>
          
          <div className="max-w-3xl mx-auto">
            {[
              { 
                step: 1, 
                title: 'Create Account', 
                desc: 'Sign up instantly. You receive a Welcome Package of 5,000 FanCoins (Social) and 2.0 $blackbook (Sweepstakes) for free.',
                icon: '👤',
                color: 'purple'
              },
              { 
                step: 2, 
                title: 'Choose Your Mode', 
                desc: 'Social Mode: Bet with FanCoins to test your strategy. Sweepstakes Mode: Switch to $blackbook to play for redeemable value.',
                icon: '🎮',
                color: 'blue'
              },
              { 
                step: 3, 
                title: 'Make Your Prediction', 
                desc: '"Will MrBeast upload today?" You predict YES using 5 $blackbook.',
                icon: '🎯',
                color: 'green'
              },
              { 
                step: 4, 
                title: 'Win & Redeem', 
                desc: 'If you are correct, you win 10 $blackbook. You can now use that 10 $blackbook to play more, or Redeem it for $10.00 USDC directly to your wallet.',
                icon: '💰',
                color: 'yellow'
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 mb-6"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 border border-${item.color}-500/50 flex items-center justify-center text-3xl flex-shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`w-8 h-8 rounded-full bg-${item.color}-500 flex items-center justify-center text-white font-bold text-sm`}>
                      {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-gray-400 ml-11">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            ❓ Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">Is this legal in Texas?</h3>
              <p className="text-gray-400">Yes. PRISM operates under Sweepstakes Law, not Sports Betting law. Because no purchase is required to obtain $blackbook (the prize-winning token), we are compliant with Texas regulations.</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">Can I buy $blackbook directly?</h3>
              <p className="text-gray-400">No. $blackbook can never be purchased. It is only obtained as a free bonus when purchasing FanCoins, or via free Alternative Methods of Entry (mail-in).</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">What is the minimum redemption?</h3>
              <p className="text-gray-400">You must have a minimum of 50 $blackbook (Value: $50) to request a redemption.</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">Do I need to verify my ID?</h3>
              <p className="text-gray-400">Yes. Before redeeming any prizes, you must complete a KYC (Know Your Customer) check to verify you are 18+ and not located in a restricted jurisdiction (e.g., Washington, Idaho).</p>
            </div>
          </div>
        </motion.section>

        {/* Legal Disclaimer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-12"
        >
          <h2 className="text-lg font-bold text-red-400 mb-4 text-center">Legal Disclaimer</h2>
          <p className="text-gray-300 text-sm text-center leading-relaxed">
            <strong>NO PURCHASE NECESSARY</strong> to enter or win. A purchase will not increase your chances of winning. 
            Void where prohibited by law. Open only to legal residents of the United States (excluding WA, ID, MI) who are 18 years or older. 
            "FanCoins" are social tokens with no monetary value. "$blackbook" are sweepstakes entry tokens used to participate in the promotion. 
            See Official Rules for details on how to enter for free via mail.
          </p>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Play?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of fans already competing in legal sweepstakes contests. 
            Get your FREE $blackbook tokens and start winning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/markets"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              🎮 Get Free Tokens
            </Link>
            <Link
              href="/get-started"
              className="px-8 py-4 bg-white/10 border border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 transition-colors"
            >
              📖 Learn More
            </Link>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  )
}