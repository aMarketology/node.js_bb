'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { formatAddress } from '@/lib/blockchain'
import AuthModal from './AuthModal'

export default function Navigation() {
  const { user, walletAddress, isAuthenticated, isKYCVerified, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#matches">Matches</NavLink>
              <NavLink href="#markets">Markets</NavLink>
              <NavLink href="#leaderboard">Leaderboard</NavLink>
              
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
                        {user?.username || 'User'}
                      </div>
                      {walletAddress && (
                        <div className="text-xs text-gray-400">
                          {formatAddress(walletAddress)}
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

                      <div className="p-2">
                        <MenuButton href="/dashboard" icon="📊">Dashboard</MenuButton>
                        <MenuButton href="/bets" icon="🎯">My Bets</MenuButton>
                        <MenuButton href="/wallet" icon="💰">Wallet</MenuButton>
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
