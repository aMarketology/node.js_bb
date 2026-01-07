'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Footer() {
  const prismColors = [
    { name: 'Teal', color: '#00CED1' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Purple', color: '#8B5CF6' },
    { name: 'Pink', color: '#EC4899' },
    { name: 'Red', color: '#FF4757' },
    { name: 'Orange', color: '#FF6B35' },
    { name: 'Gold', color: '#FFD700' },
  ]

  return (
    <footer className="relative bg-dark-100 border-t border-dark-border overflow-hidden">
      {/* Prism color bar */}
      <div className="h-1 prism-gradient-bg" />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 prism-gradient-bg rounded-xl opacity-80" />
                <div className="absolute inset-[2px] bg-dark-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚽</span>
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold prism-gradient-text">PRISM</span>
                <span className="block text-xs text-gray-400">World Cup 2026 Predictions</span>
              </div>
            </div>
            <p className="text-gray-400 max-w-md mb-6">
              Experience the future of sports prediction with our prism-powered platform. 
              Every color represents a dimension of the beautiful game.
            </p>
            
            {/* Prism color legend */}
            <div className="flex gap-2">
              {prismColors.map((item) => (
                <div
                  key={item.name}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: item.color }}
                  title={item.name}
                />
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {['Matches', 'Markets', 'Leaderboard', 'How It Works'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-prism-teal transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Host Countries */}
          <div>
            <h4 className="text-white font-semibold mb-4">Host Countries</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400">
                <span>🇺🇸</span> United States
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span>🇲🇽</span> Mexico
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span>🇨🇦</span> Canada
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Prism Markets. FIFA World Cup 2026™
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-prism-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-prism-teal transition-colors">Terms</a>
            <span className="prism-gradient-text font-semibold">USA • Mexico • Canada</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
