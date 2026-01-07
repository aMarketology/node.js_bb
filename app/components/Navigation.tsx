'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
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
            
            <motion.a
              href="#predict"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-6 py-2.5 rounded-xl font-semibold text-white overflow-hidden group"
            >
              <div className="absolute inset-0 prism-gradient-bg-animated opacity-90" />
              <span className="relative z-10">Start Predicting</span>
            </motion.a>
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
