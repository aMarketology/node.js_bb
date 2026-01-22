'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  shouldShowConsentBanner,
  acceptAllCookies,
  rejectAllCookies,
  saveConsentPreferences,
  getConsentPreferences,
  logConsent,
  type ConsentPreferences,
} from '@/lib/consent'
import { useAuth } from '../contexts/AuthContext'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    timestamp: new Date().toISOString(),
    version: '1.0',
  })
  const { user } = useAuth()

  useEffect(() => {
    // Check if banner should be shown
    const shouldShow = shouldShowConsentBanner()
    setShowBanner(shouldShow)

    // Load existing preferences if any
    const existing = getConsentPreferences()
    if (existing) {
      setPreferences(existing)
    }
  }, [])

  const handleAcceptAll = async () => {
    acceptAllCookies()
    await logConsent({
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }, user?.user_id)
    setShowBanner(false)
  }

  const handleRejectAll = async () => {
    rejectAllCookies()
    await logConsent({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }, user?.user_id)
    setShowBanner(false)
  }

  const handleSavePreferences = async () => {
    saveConsentPreferences(preferences)
    await logConsent(preferences, user?.user_id)
    setShowBanner(false)
    setShowCustomize(false)
  }

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
          {!showCustomize ? (
            // Simple Banner
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    🍪 We Value Your Privacy
                  </h3>
                  <p className="text-gray-300 text-sm">
                    We use cookies and similar technologies to enhance your experience, analyze site traffic, 
                    and personalize content. By clicking "Accept All", you consent to our use of cookies. 
                    You can customize your preferences or learn more in our{' '}
                    <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition whitespace-nowrap"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition whitespace-nowrap"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition font-semibold whitespace-nowrap"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Detailed Preferences
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Cookie Preferences</h3>
                <p className="text-gray-300 text-sm">
                  Choose which cookies you'd like to allow. Some cookies are essential for the site to function.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">Essential Cookies</h4>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">Required</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Necessary for the website to function. Includes authentication, security, and basic functionality.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex-1 mr-4">
                    <h4 className="font-semibold text-white mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-gray-400">
                      Help us understand how you use our site. Includes Google Analytics, user behavior tracking, 
                      and performance monitoring. We track page views, time on site, and feature usage.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => updatePreference('analytics', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex-1 mr-4">
                    <h4 className="font-semibold text-white mb-1">Marketing Cookies</h4>
                    <p className="text-sm text-gray-400">
                      Used to show you relevant ads and measure campaign effectiveness. Includes retargeting pixels 
                      and social media tracking.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => updatePreference('marketing', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Personalization Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex-1 mr-4">
                    <h4 className="font-semibold text-white mb-1">Personalization Cookies</h4>
                    <p className="text-sm text-gray-400">
                      Enable customized content and recommendations based on your preferences and behavior. 
                      Helps us show you relevant markets and features.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.personalization}
                      onChange={(e) => updatePreference('personalization', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowCustomize(false)}
                  className="text-gray-400 hover:text-white text-sm underline"
                >
                  ← Back to simple view
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition font-semibold"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
