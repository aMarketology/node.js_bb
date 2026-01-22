'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFractal } from '@/app/contexts/FractalContext'
import { useCreditPrediction } from '@/app/contexts/CreditPredictionContext'
import { formatAddress } from '@/lib/blockchain'
import AuthModal from './AuthModal'

export default function Navigation() {
  const { user, walletAddress, isAuthenticated, isKYCVerified, signOut, activeWallet, switchWallet } = useAuth()
  const { fractalEnabled, setFractalEnabled } = useFractal()
  const { hasActiveCredit, activeSession, balance, settleCredit } = useCreditPrediction()
  const [scrolled, setScrolled] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [grayscaleMode, setGrayscaleMode] = useState(false)
  const [settlingCredit, setSettlingCredit] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply grayscale to wrapper (excludes fractal particles at body level)
  useEffect(() => {
    const wrapper = document.getElementById('grayscale-wrapper')
    if (wrapper) {
      if (grayscaleMode) {
        wrapper.style.filter = 'grayscale(1)'
      } else {
        wrapper.style.filter = 'none'
      }
    }
    return () => {
      if (wrapper) {
        wrapper.style.filter = 'none'
      }
    }
  }, [grayscaleMode])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-dark-100/90 backdrop-blur-xl border-b border-dark-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                {/* Prism Icon */}
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 prism-gradient-bg rounded-lg opacity-80" />
                  <div className="absolute inset-[2px] bg-dark-100 rounded-md flex items-center justify-center">
                    <span className="text-xl">⚽</span>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold prism-gradient-text">
                    PRISM
                  </span>
                  <span className="block text-[10px] text-gray-400 tracking-widest">
                    WORLD CUP 2026
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Fractal Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFractalEnabled(!fractalEnabled)}
              className="ml-4 p-2 rounded-lg bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors relative group"
              title={fractalEnabled ? 'Disable Fractal Cursor' : 'Enable Fractal Cursor'}
            >
              <div className={`w-5 h-5 transition-all duration-300 ${fractalEnabled ? 'prism-gradient-bg' : 'bg-gray-600'} rounded`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 px-3 py-1 bg-dark-200 border border-dark-border rounded text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {fractalEnabled ? 'Disable' : 'Enable'} Fractal Effect
              </div>
            </motion.button>

            {/* Black & White Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGrayscaleMode(!grayscaleMode)}
              className="ml-2 p-2 rounded-lg bg-dark-200 border border-dark-border hover:border-gray-400 transition-colors relative group"
              title={grayscaleMode ? 'Disable High Contrast' : 'Enable High Contrast'}
            >
              <div className={`w-5 h-5 transition-all duration-300 ${grayscaleMode ? 'bg-white' : 'bg-gradient-to-br from-white via-gray-400 to-black'} rounded flex items-center justify-center`}>
                {grayscaleMode ? (
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 px-3 py-1 bg-dark-200 border border-dark-border rounded text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {grayscaleMode ? 'Disable' : 'Enable'} High Contrast
              </div>
            </motion.button>

            {/* Credit Session Indicator */}
            {isAuthenticated && hasActiveCredit && activeSession && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50"
              >
                <span className="text-lg">💳</span>
                <div className="text-xs">
                  <div className="text-purple-300 font-semibold">Credit Active</div>
                  <div className="text-gray-400">{balance.available.toLocaleString()} BB</div>
                </div>
                <button
                  onClick={async () => {
                    if (settlingCredit) return
                    setSettlingCredit(true)
                    try {
                      const result = await settleCredit()
                      if (result.success) {
                        alert(`✅ Credit settled! P&L: ${result.pnl >= 0 ? '+' : ''}${result.pnl} BB`)
                      }
                    } finally {
                      setSettlingCredit(false)
                    }
                  }}
                  disabled={settlingCredit}
                  className="ml-1 px-2 py-1 rounded bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {settlingCredit ? '...' : 'Settle'}
                </button>
              </motion.div>
            )}

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="/#matches">Matches</NavLink>
              <NavLink href="/markets">Markets</NavLink>
              <NavLink href="/drafts">Drafts</NavLink>
              {isAuthenticated && (activeWallet === 'alice' || activeWallet === 'bob') && (
                <NavLink href="/oracle">Oracle</NavLink>
              )}
              <NavLink href="/ledger">Ledger</NavLink>
              <NavLink href="/#leaderboard">Leaderboard</NavLink>
              {isAuthenticated && <NavLink href="/wallet">Wallet</NavLink>}
              
              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors"
                  >
                    {/* KYC Status Badge */}
                    {isKYCVerified && (
                      <div className="w-2 h-2 rounded-full bg-prism-teal animate-pulse" />
                    )}
                    
                    {/* User Info */}
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {activeWallet === 'alice' ? '🟣 Alice' : 
                         activeWallet === 'bob' ? '🔵 Bob' :
                         user?.user_id || user?.email || 'User'}
                      </div>
                      {(walletAddress || user?.blackbook_address) && (
                        <div className="text-xs text-gray-400">
                          {formatAddress(walletAddress || user?.blackbook_address || '')}
                        </div>
                      )}
                    </div>

                    {/* Dropdown Icon */}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-dark-200 border border-dark-border rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-dark-border bg-dark-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm font-medium text-gray-400">KYC Status</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isKYCVerified 
                              ? 'bg-prism-teal/20 text-prism-teal' 
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {isKYCVerified ? 'Verified' : 'Pending'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.email}
                        </div>
                      </div>

                      {/* Wallet Switcher */}
                      <div className="p-2 border-b border-dark-border">
                        <div className="text-xs font-medium text-gray-500 px-4 py-2">Switch Wallet</div>
                        <button
                          onClick={() => {
                            switchWallet('user')
                            setShowUserMenu(false)
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                            activeWallet === 'user'
                              ? 'bg-prism-teal/20 text-prism-teal'
                              : 'text-gray-300 hover:bg-dark-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span>👤</span>
                            <span>Your Wallet</span>
                          </div>
                          {activeWallet === 'user' && <span className="text-prism-teal">✓</span>}
                        </button>
                        <button
                          onClick={() => {
                            switchWallet('alice')
                            setShowUserMenu(false)
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                            activeWallet === 'alice'
                              ? 'bg-prism-purple/20 text-prism-purple'
                              : 'text-gray-300 hover:bg-dark-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span>🟣</span>
                            <span>Alice</span>
                          </div>
                          {activeWallet === 'alice' && <span className="text-prism-purple">✓</span>}
                        </button>
                        <button
                          onClick={() => {
                            switchWallet('bob')
                            setShowUserMenu(false)
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm rounded-lg transition-colors ${
                            activeWallet === 'bob'
                              ? 'bg-prism-teal/20 text-prism-teal'
                              : 'text-gray-300 hover:bg-dark-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span>🔵</span>
                            <span>Bob</span>
                          </div>
                          {activeWallet === 'bob' && <span className="text-prism-teal">✓</span>}
                        </button>
                      </div>

                      <div className="p-2">
                        <MenuButton href="/settings" icon="⚙️">Settings</MenuButton>
                        <button
                          onClick={() => {
                            signOut()
                            setShowUserMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-prism-red hover:bg-prism-red/10 rounded-lg transition-colors"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuthModal(true)}
                  className="relative px-6 py-2.5 rounded-xl font-semibold text-white overflow-hidden group"
                >
                  <div className="absolute inset-0 prism-gradient-bg-animated opacity-90" />
                  <span className="relative z-10">Sign In</span>
                </motion.button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="relative text-gray-300 hover:text-white transition-colors group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 prism-gradient-bg transition-all group-hover:w-full" />
    </a>
  )
}

function MenuButton({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
    >
      <span>{icon}</span>
      <span>{children}</span>
    </a>
  )
}
