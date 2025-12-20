'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categories = [
    { name: 'Politics', href: '/politics' },
    { name: 'Sports', href: '/sports' },
    { name: 'Crypto', href: '/crypto' },
    { name: 'Business', href: '/business' }
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-lg shadow-lg border-b border-grey-700'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                BlackBook
              </span>
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Link
                href="/"
                className={`font-medium transition-colors relative group ${
                  scrolled
                    ? 'text-grey-200 hover:text-primary'
                    : 'text-grey-200 hover:text-primary'
                }`}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            </motion.div>

            {/* Categories Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={`font-medium transition-colors relative group flex items-center gap-1 ${
                  scrolled
                    ? 'text-grey-200 hover:text-primary'
                    : 'text-grey-200 hover:text-primary'
                }`}
              >
                Markets
                <svg className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald transition-all group-hover:w-full" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-black/98 backdrop-blur-lg border border-grey-700 rounded-lg shadow-2xl overflow-hidden"
                  >
                    {categories.map((category, i) => (
                      <Link
                        key={i}
                        href={category.href}
                        className={`block px-4 py-3 text-grey-200 hover:bg-primary/10 hover:text-primary transition-all ${
                          i !== categories.length - 1 ? 'border-b border-grey-800' : ''
                        }`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/about"
                className={`font-medium transition-colors relative group ${
                  scrolled
                    ? 'text-grey-200 hover:text-primary'
                    : 'text-grey-200 hover:text-primary'
                }`}
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            </motion.div>
            <motion.a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold px-6 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Trading
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden flex flex-col gap-1.5 z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className="w-6 h-0.5 bg-grey-50 transition-all"
              animate={{
                rotate: mobileMenuOpen ? 45 : 0,
                y: mobileMenuOpen ? 8 : 0,
              }}
            />
            <motion.div
              className="w-6 h-0.5 bg-grey-50 transition-all"
              animate={{
                opacity: mobileMenuOpen ? 0 : 1,
              }}
            />
            <motion.div
              className="w-6 h-0.5 bg-grey-50 transition-all"
              animate={{
                rotate: mobileMenuOpen ? -45 : 0,
                y: mobileMenuOpen ? -8 : 0,
              }}
            />
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 bg-grey-900/95 backdrop-blur-lg rounded-lg mt-4 shadow-xl border border-grey-700">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Link
                    href="/"
                    className="block px-4 py-3 text-grey-200 hover:bg-primary/10 hover:text-primary transition font-medium rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </motion.div>
                
                {/* Categories in Mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="px-4 py-2 text-grey-400 text-sm font-semibold uppercase tracking-wider">
                    Markets
                  </div>
                  {categories.map((category, i) => (
                    <Link
                      key={i}
                      href={category.href}
                      className="block px-8 py-2 text-grey-200 hover:bg-primary/10 hover:text-primary transition font-medium rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/about"
                    className="block px-4 py-3 text-grey-200 hover:bg-primary/10 hover:text-primary transition font-medium rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </motion.div>
                <div className="px-4 pt-2">
                  <a
                    href="https://polymarket.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-primary to-primary-light hover:shadow-lg text-black text-center font-semibold px-6 py-3 rounded-lg transition"
                  >
                    Start Trading
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
