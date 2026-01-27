'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'

export default function GetStartedPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'legal' | 'howto'>('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">PRISM</span>
          </h1>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            The World's First <span className="text-yellow-400 font-semibold">Free-to-Enter</span> Fantasy League for World Cup 2026
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="px-6 py-3 bg-green-500/20 border border-green-500 rounded-lg">
              <span className="text-green-400 font-semibold">✓ 100% Legal in Texas</span>
            </div>
            <div className="px-6 py-3 bg-blue-500/20 border border-blue-500 rounded-lg">
              <span className="text-blue-400 font-semibold">✓ No Purchase Required</span>
            </div>
            <div className="px-6 py-3 bg-purple-500/20 border border-purple-500 rounded-lg">
              <span className="text-purple-400 font-semibold">✓ Skill-Based Gameplay</span>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 backdrop-blur-lg rounded-full p-2 border border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'legal'
                  ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Legal Shield
            </button>
            <button
              onClick={() => setActiveTab('howto')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'howto'
                  ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Step-by-Step
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'legal' && <LegalTab />}
          {activeTab === 'howto' && <HowToTab />}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <a
            href="/markets"
            className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-2xl"
          >
            Enter Your First Contest 🏆
          </a>
          <p className="mt-4 text-gray-400">No credit card required • Free $BB bonus included</p>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* What Makes PRISM Different */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">🎯 What Makes PRISM Different?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-400 mb-3">❌ Traditional Betting Platforms</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Require real money deposits</li>
              <li>• Based on pure chance/luck</li>
              <li>• Illegal in many US states</li>
              <li>• You vs "The House"</li>
              <li>• Hidden fees and juice</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-3">✅ PRISM Fantasy League</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Free $BB tokens (no purchase needed)</li>
              <li>• Skill-based roster building</li>
              <li>• 100% legal in all 50 states</li>
              <li>• Player vs Player (P2P)</li>
              <li>• Zero fees, zero juice</li>
            </ul>
          </div>
        </div>
      </div>

      {/* The Two-Layer System */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">🏗️ The Two-Layer System</h2>
        <div className="space-y-6">
          {/* Layer 1 */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                L1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-yellow-400">BlackBook Layer 1: The Vault</h3>
                <p className="text-gray-400">Your secure token treasury</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">🪙 Fan Coins (FC)</h4>
                <p className="text-gray-300 text-sm">Entertainment currency you purchase. Cannot be withdrawn. Used for fun play.</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">🎟️ BlackBook Tokens ($BB)</h4>
                <p className="text-gray-300 text-sm">FREE bonus tokens. Used to enter skill contests. Winnings can be redeemed!</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p className="text-yellow-200 text-sm">
                <strong>Legal Shield #1:</strong> You never "purchase" $BB directly. They're always free bonuses with GC purchases or given away for free. This eliminates "consideration" (payment) from the gambling equation.
              </p>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                L2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-purple-400">Prism Layer 2: The Arena</h3>
                <p className="text-gray-400">Where skill-based contests happen</p>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">🏆 Contest Entry</h4>
                <p className="text-gray-300 text-sm">Use your free $BB to enter daily fantasy contests. Example: "USA vs England Squad Battle" - Entry Fee: 10 $BB</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">👥 Roster Building (The Skill Element)</h4>
                <p className="text-gray-300 text-sm">Select 3 players for your roster. Example: Pulisic (FWD), Reyna (MID), Turner (GK). Your skill determines your score.</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">⚔️ P2P Matchmaking</h4>
                <p className="text-gray-300 text-sm">You compete against another user's roster. Winner takes all 20 $BB (10 from you + 10 from opponent). Zero fees.</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">📊 Live Scoring</h4>
                <p className="text-gray-300 text-sm">
                  Real-time stats: Goals (+6), Assists (+4), Saves (+2), Yellow Cards (-2), Red Cards (-5). Your roster scores accumulate as the match unfolds.
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-purple-200 text-sm">
                <strong>Legal Shield #2:</strong> You're not betting on random outcomes. You're competing in a skill-based fantasy league (like DraftKings/FanDuel). Fantasy sports are explicitly legal under Texas law.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Example Contest Flow */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">📖 Example: Your First Contest</h2>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Get Free Tokens', desc: 'Sign up and receive 100 FREE $BB tokens. No purchase required.', icon: '🎁' },
            { step: 2, title: 'Find a Contest', desc: 'Browse "USA vs England - Squad Battle" contest. Entry Fee: 10 $BB.', icon: '🔍' },
            { step: 3, title: 'Build Your Roster', desc: 'Select 3 players: Christian Pulisic (FWD), Weston McKennie (MID), Matt Turner (GK).', icon: '⚽' },
            { step: 4, title: 'Get Matched', desc: 'System finds opponent (Bob) with a different roster. Total pot: 20 $BB.', icon: '👥' },
            { step: 5, title: 'Watch Live', desc: 'Pulisic scores! (+6 pts). McKennie assists! (+4 pts). You\'re winning 45-30.', icon: '📺' },
            { step: 6, title: 'Win & Cash Out', desc: 'You win 20 $BB! Cash out to PayPal or enter bigger contests.', icon: '💰' }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="text-4xl">{item.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-gray-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LegalTab() {
  return (
    <div className="space-y-8">
      {/* Legal Architecture */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">⚖️ The "Double Shield" Legal Architecture</h2>
        <p className="text-gray-300 mb-6 text-lg">
          PRISM uses a revolutionary dual-layer legal strategy that makes it the safest platform for World Cup 2026 in Texas and nationwide.
        </p>
        
        <div className="space-y-6">
          {/* Traditional Gambling Definition */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-4">🚫 Traditional Gambling (Illegal)</h3>
            <p className="text-gray-300 mb-4">For an activity to be "gambling," it must have ALL THREE elements:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">💵</div>
                <h4 className="font-bold text-white mb-2">Consideration</h4>
                <p className="text-gray-400 text-sm">(Payment of money or value)</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🎲</div>
                <h4 className="font-bold text-white mb-2">Chance</h4>
                <p className="text-gray-400 text-sm">(Outcome determined by luck)</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <h4 className="font-bold text-white mb-2">Prize</h4>
                <p className="text-gray-400 text-sm">(Something of value awarded)</p>
              </div>
            </div>
          </div>

          {/* PRISM's Double Shield */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-green-400 mb-4">✅ PRISM's Double Shield (Legal)</h3>
            <p className="text-gray-300 mb-4">We eliminate TWO of the three elements, making it impossible to be classified as gambling:</p>
            
            <div className="space-y-4">
              {/* Defense A */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white">
                    A
                  </div>
                  <h4 className="text-xl font-bold text-yellow-400">Defense A: No Consideration (Sweepstakes Model)</h4>
                </div>
                <p className="text-gray-300 mb-3">
                  <strong>How it works:</strong> $BB tokens are ALWAYS given for free. You never purchase them directly.
                </p>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Sign up → Get 100 FREE $BB</li>
                  <li>• Daily login → Get 10 FREE $BB</li>
                  <li>• Optional: Buy "Fan Coins" (FC) for entertainment → Receive FREE $BB as bonus</li>
                  <li>• Legal precedent: Sweepstakes with "No Purchase Necessary" (like McDonald's Monopoly)</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-yellow-200 text-sm">
                    ⚖️ <strong>Legal Result:</strong> Since $BB is free, there is NO "Consideration" element. Gambling requires payment. Free entry = Not gambling.
                  </p>
                </div>
              </div>

              {/* Defense B */}
              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-bold text-white">
                    B
                  </div>
                  <h4 className="text-xl font-bold text-purple-400">Defense B: No Chance (Skill-Based Fantasy)</h4>
                </div>
                <p className="text-gray-300 mb-3">
                  <strong>How it works:</strong> Winners are determined by SKILL in roster building, not random chance.
                </p>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• You select 3 players from 100+ available (strategic decision)</li>
                  <li>• Player performance is based on real athletic skill (goals, assists, saves)</li>
                  <li>• Better roster knowledge = better results (like DraftKings/FanDuel)</li>
                  <li>• Legal precedent: Texas Penal Code §47.02(a)(4) explicitly exempts "fantasy sports"</li>
                </ul>
                <div className="mt-4 p-3 bg-purple-500/10 rounded border border-purple-500/20">
                  <p className="text-purple-200 text-sm">
                    ⚖️ <strong>Legal Result:</strong> Fantasy sports leagues are games of SKILL, not chance. Texas law explicitly allows skill-based competitions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">📊 Legal Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-gray-400 font-semibold">Platform</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold text-center">Consideration</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold text-center">Chance</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold text-center">Prize</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold text-center">Legal?</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-semibold">Traditional Sportsbook</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Money)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Random)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Winnings)</td>
                    <td className="py-3 px-4 text-center text-red-400">❌ (Gambling)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-semibold">Social Casino (Sweeps)</td>
                    <td className="py-3 px-4 text-center text-green-400">✗ (Free)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Slots/Chance)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Winnings)</td>
                    <td className="py-3 px-4 text-center text-yellow-400">⚠️ (Gray Area)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-semibold">DraftKings/FanDuel</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Money)</td>
                    <td className="py-3 px-4 text-center text-green-400">✗ (Skill)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Winnings)</td>
                    <td className="py-3 px-4 text-center text-green-400">✅ (Legal)</td>
                  </tr>
                  <tr className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border-2 border-yellow-500/50">
                    <td className="py-3 px-4 font-bold text-white">🏆 PRISM (Double Shield)</td>
                    <td className="py-3 px-4 text-center text-green-400 font-bold">✗ (Free $BB)</td>
                    <td className="py-3 px-4 text-center text-green-400 font-bold">✗ (Skill)</td>
                    <td className="py-3 px-4 text-center text-red-400">✓ (Winnings)</td>
                    <td className="py-3 px-4 text-center text-green-400 font-bold">✅✅ (Ultra Legal)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Citations */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">📚 Legal Citations</h3>
            <div className="space-y-3 text-gray-300">
              <div className="p-3 bg-black/20 rounded">
                <strong className="text-white">Texas Penal Code §47.02:</strong> Defines gambling as requiring consideration, chance, and prize. Removing any one element makes it legal.
              </div>
              <div className="p-3 bg-black/20 rounded">
                <strong className="text-white">Texas Penal Code §47.02(a)(4):</strong> Explicitly exempts "participation in a fantasy sports contest" from gambling prohibitions.
              </div>
              <div className="p-3 bg-black/20 rounded">
                <strong className="text-white">UIGEA (2006):</strong> Federal law carves out fantasy sports as legal skill-based games.
              </div>
              <div className="p-3 bg-black/20 rounded">
                <strong className="text-white">FTC Sweepstakes Rules:</strong> "No Purchase Necessary" sweepstakes are legal promotional activities, not gambling.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HowToTab() {
  return (
    <div className="space-y-8">
      {/* Getting Started */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">🚀 Getting Started in 5 Minutes</h2>
        
        <div className="space-y-6">
          {/* Step 1: Create Account */}
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">1</span>
              Create Your Free Account
            </h3>
            <ul className="space-y-2 text-gray-300 ml-14">
              <li>• Click "Sign Up" in the top right</li>
              <li>• Enter email, username, and password</li>
              <li>• Verify your email address</li>
              <li>• <strong className="text-green-400">Receive 100 FREE $BB tokens instantly!</strong></li>
            </ul>
          </div>

          {/* Step 2: Explore Contests */}
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">2</span>
              Browse Available Contests
            </h3>
            <ul className="space-y-2 text-gray-300 ml-14">
              <li>• Go to the "Contests" page</li>
              <li>• Filter by entry fee (10 $BB, 50 $BB, 100 $BB)</li>
              <li>• Filter by match (USA vs England, Brazil vs Argentina, etc.)</li>
              <li>• See contest pot size and number of entries</li>
            </ul>
          </div>

          {/* Step 3: Build Roster */}
          <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">3</span>
              Build Your Winning Roster
            </h3>
            <div className="ml-14 space-y-4">
              <p className="text-gray-300">Select 3 players for your roster (must fit within salary cap):</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-2">⚽ Forward (FWD)</h4>
                  <p className="text-gray-400 text-sm">Goals = +6 pts<br/>Assists = +4 pts<br/>Shots on Target = +1 pt</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-2">🎯 Midfielder (MID)</h4>
                  <p className="text-gray-400 text-sm">Goals = +8 pts<br/>Assists = +5 pts<br/>Key Passes = +2 pts</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-2">🧤 Goalkeeper (GK)</h4>
                  <p className="text-gray-400 text-sm">Saves = +2 pts<br/>Clean Sheet = +10 pts<br/>Goals Conceded = -2 pts</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded border border-yellow-500/20">
                <p className="text-yellow-200 text-sm">
                  💡 <strong>Pro Tip:</strong> Balance high-salary stars with value picks. Research recent form and matchups!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Enter Contest */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">4</span>
              Submit Your Entry
            </h3>
            <ul className="space-y-2 text-gray-300 ml-14">
              <li>• Review your roster one final time</li>
              <li>• Click "Enter Contest" (uses your free $BB)</li>
              <li>• Get instantly matched with an opponent</li>
              <li>• Both players' entries are locked into escrow on Layer 1</li>
            </ul>
          </div>

          {/* Step 5: Watch Live */}
          <div className="bg-gradient-to-r from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-pink-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white">5</span>
              Watch Your Roster Compete Live
            </h3>
            <ul className="space-y-2 text-gray-300 ml-14">
              <li>• Real-time score updates as the match progresses</li>
              <li>• See your roster's cumulative points vs opponent</li>
              <li>• Get notifications when your players score/assist</li>
              <li>• Track live leaderboard position</li>
            </ul>
          </div>

          {/* Step 6: Collect Winnings */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">6</span>
              Win & Cash Out
            </h3>
            <ul className="space-y-2 text-gray-300 ml-14">
              <li>• If you win: $BB is automatically credited to your wallet</li>
              <li>• Minimum cashout: 100 $BB ($10 value)</li>
              <li>• Withdraw via PayPal, Venmo, or bank transfer</li>
              <li>• Or use winnings to enter bigger contests!</li>
            </ul>
            <div className="mt-4 ml-14 p-4 bg-emerald-500/10 rounded border border-emerald-500/20">
              <p className="text-emerald-200 text-sm">
                💰 <strong>Example:</strong> You enter a 10 $BB contest, win 20 $BB. After 10 wins, you have 200 $BB = $20 real cash!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "Do I have to deposit money to play?",
              a: "No! You get 100 FREE $BB tokens when you sign up. You can play indefinitely without spending a dime."
            },
            {
              q: "If I buy Fan Coins, am I buying $BB?",
              a: "No. You're buying FC (entertainment currency). The $BB is a FREE BONUS, like a sweepstakes prize. This keeps it 100% legal."
            },
            {
              q: "Is this legal in my state?",
              a: "Yes! PRISM is legal in all 50 US states, including Texas. We use the same legal model as DraftKings Fantasy + sweepstakes."
            },
            {
              q: "How is this different from gambling?",
              a: "Two ways: (1) You never pay for $BB (free entry = not gambling), (2) It's skill-based fantasy (not chance = not gambling)."
            },
            {
              q: "Can I really cash out my winnings?",
              a: "Yes! Once you accumulate 100+ $BB, you can withdraw to PayPal/Venmo. Processing takes 1-3 business days."
            },
            {
              q: "What if I lose all my free $BB?",
              a: "You get 10 FREE $BB every day just for logging in. You can also earn bonus $BB by referring friends or completing challenges."
            },
            {
              q: "How do you make money if there are no fees?",
              a: "We profit from Fan Coin sales (optional entertainment currency). Zero fees on $BB contests means you keep 100% of winnings."
            },
            {
              q: "Is my data secure?",
              a: "Yes. All wallets use Ed25519 encryption. Private keys never leave your device. Layer 1 provides bank-grade vault security."
            }
          ].map((faq, i) => (
            <details key={i} className="bg-white/5 rounded-lg border border-white/10 p-4 cursor-pointer hover:border-purple-500/30 transition-colors">
              <summary className="font-semibold text-white mb-2">{faq.q}</summary>
              <p className="text-gray-300 pl-4">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your Champion Roster?</h2>
        <p className="text-gray-300 mb-6 text-lg">Join thousands of players competing in the World Cup 2026 Fantasy League</p>
        <a
          href="/markets"
          className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-2xl"
        >
          Enter Your First Contest Now 🚀
        </a>
        <p className="mt-4 text-gray-400 text-sm">100% Free to Start • No Credit Card • No Risk</p>
      </div>
    </div>
  )
}
