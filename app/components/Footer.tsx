'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Footer() {
  const categories = [
    'Politics',
    'Sports',
    'Crypto',
    'Business',
  ]

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Markets', href: 'https://polymarket.com/markets' },
    { name: 'About', href: '/about' },
  ]

  const serviceAreas = [
    'Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville'
  ]

  return (
    <footer className="bg-gradient-to-b from-black to-grey-900 text-white border-t border-grey-700">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <motion.div
              className="mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-2xl font-bold leading-none mb-1 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">BlackBook</div>
              <div className="text-xl font-light leading-none text-grey-300">
                Trade Your Knowledge
              </div>
            </motion.div>
            <p className="text-grey-400 mb-6 text-sm leading-relaxed">
              The world's largest prediction market platform. Trade on sports, politics, crypto, and real-world events.
            </p>
            <div className="space-y-2 text-sm text-grey-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure & Transparent</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Decentralized Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>24/7 Trading</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary transition flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all" />
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-primary transition flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all" />
                      {link.name}
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Market Categories */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Market Categories</h3>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-gray-400 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {category}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Resources</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light transition font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Start Trading
                </a>
              </li>
              <li className="text-gray-400 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Learn how prediction<br />markets work
              </li>
              <li className="text-gray-400 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Live 24/7 trading<br />on real events
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2025 BlackBook. Powered by Polymarket.</p>
          <div className="flex gap-6">
            <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Polymarket</a>
            <a href="#" className="hover:text-primary transition">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
