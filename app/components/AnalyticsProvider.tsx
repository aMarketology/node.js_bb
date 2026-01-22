'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { initializeUserTracking, identifyUser, clearUserTracking } from '@/lib/analytics'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, walletAddress } = useAuth()

  // Initialize tracking on mount
  useEffect(() => {
    initializeUserTracking()
  }, [])

  // Track authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.user_id, {
        email: user.email,
        walletAddress: walletAddress || undefined,
        isKYCVerified: user.kyc_verified,
      })
    } else {
      clearUserTracking()
    }
  }, [isAuthenticated, user, walletAddress])

  return <>{children}</>
}
