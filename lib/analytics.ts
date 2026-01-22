// Advanced Analytics Tracking
// Tracks user behavior, conversions, and engagement
// Integrates with Google Analytics and custom cookie-based tracking
// Privacy-first: Respects user consent preferences

import Cookies from 'js-cookie'
import { hasConsent } from './consent'

const RETURNING_USER_COOKIE = 'prism_returning_user'
const USER_SESSION_COOKIE = 'prism_user_session'
const USER_ID_COOKIE = 'prism_user_id'
const COOKIE_EXPIRY_DAYS = 365

// Check if analytics is allowed
const canTrack = (category: 'analytics' | 'marketing' | 'personalization' = 'analytics'): boolean => {
  return hasConsent(category)
}

// Initialize user tracking cookies
export const initializeUserTracking = () => {
  if (typeof window === 'undefined') return
  if (!canTrack('analytics')) return // Respect consent

  // Check if user is returning
  const isReturning = Cookies.get(RETURNING_USER_COOKIE)
  
  if (!isReturning) {
    // First time visitor
    Cookies.set(RETURNING_USER_COOKIE, 'true', { expires: COOKIE_EXPIRY_DAYS, sameSite: 'lax', secure: true })
    trackEvent('user_type', { type: 'new_visitor' })
  } else {
    trackEvent('user_type', { type: 'returning_visitor' })
  }

  // Set session cookie (expires when browser closes)
  if (!Cookies.get(USER_SESSION_COOKIE)) {
    const sessionId = generateSessionId()
    Cookies.set(USER_SESSION_COOKIE, sessionId, { sameSite: 'lax', secure: true })
  }
  
  // Track session start
  trackEvent('session_start', {
    session_id: Cookies.get(USER_SESSION_COOKIE),
    is_returning: !!isReturning,
  })
}

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Track authenticated user
export const identifyUser = (userId: string, userData?: {
  email?: string
  username?: string
  walletAddress?: string
  isKYCVerified?: boolean
  signupDate?: string
}) => {
  if (typeof window === 'undefined') return
  if (!canTrack('analytics')) return

  // Set persistent user cookie
  Cookies.set(USER_ID_COOKIE, userId, { expires: COOKIE_EXPIRY_DAYS, sameSite: 'lax', secure: true })

  // Track in Google Analytics
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: userId,
    })

    // Set user properties
    if (userData) {
      const userProperties: Record<string, any> = {
        wallet_connected: !!userData.walletAddress,
        kyc_verified: userData.isKYCVerified || false,
        user_type: 'authenticated',
      }
      
      // Only include PII if personalization is enabled
      if (canTrack('personalization')) {
        userProperties.signup_date = userData.signupDate
      }
      
      window.gtag('set', 'user_properties', userProperties)
    }
  }

  // Track login event
  trackEvent('user_login', {
    method: userData?.walletAddress ? 'wallet' : 'email',
    user_id: userId,
  })
  
  // Send to database for advanced analytics
  sendToDatabase('user_login', {
    userId,
    walletAddress: userData?.walletAddress,
    isKYCVerified: userData?.isKYCVerified,
    timestamp: new Date().toISOString(),
  })
}

// Clear user tracking on logout
export const clearUserTracking = () => {
  if (typeof window === 'undefined') return

  Cookies.remove(USER_ID_COOKIE)
  
  // Clear user ID in GA
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: undefined,
    })
  }

  trackEvent('user_logout', {})
  
  // Send to database
  sendToDatabase('user_logout', {
    timestamp: new Date().toISOString(),
  })
}

// Track custom events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined') return
  if (!canTrack('analytics')) return

  // Add session and user context
  const enrichedParams = {
    ...params,
    session_id: Cookies.get(USER_SESSION_COOKIE),
    user_id: Cookies.get(USER_ID_COOKIE),
    timestamp: new Date().toISOString(),
    page_path: window.location.pathname,
    page_title: document.title,
  }

  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, enrichedParams)
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, enrichedParams)
  }
  
  // Send to custom database for advanced analysis
  sendToDatabase(eventName, enrichedParams)
}

// Track page views with additional context
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  })
}

// Track conversions
export const trackConversion = (conversionType: string, value?: number, currency = 'USD') => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value,
    currency,
  })

  // Send to GA4 as conversion event
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      value,
      currency,
      transaction_id: generateSessionId(),
    })
  }
}

// Track betting activity
export const trackBetting = (action: 'place_bet' | 'win' | 'lose', data: {
  marketId?: string
  amount?: number
  outcome?: string
}) => {
  trackEvent(`bet_${action}`, {
    market_id: data.marketId,
    amount: data.amount,
    outcome: data.outcome,
  })
}

// Track wallet activity
export const trackWallet = (action: 'connect' | 'disconnect' | 'deposit' | 'withdraw', data?: {
  walletAddress?: string
  amount?: number
  method?: string
}) => {
  trackEvent(`wallet_${action}`, {
    wallet_address: data?.walletAddress,
    amount: data?.amount,
    method: data?.method,
  })
}

// Track engagement metrics
export const trackEngagement = (action: string, data?: Record<string, any>) => {
  trackEvent(`engagement_${action}`, data)
}

// Get user analytics data
export const getUserAnalyticsData = () => {
  return {
    userId: Cookies.get(USER_ID_COOKIE),
    sessionId: Cookies.get(USER_SESSION_COOKIE),
    isReturning: !!Cookies.get(RETURNING_USER_COOKIE),
  }
}

// Send data to custom database for advanced analytics
const sendToDatabase = async (eventName: string, data: Record<string, any>) => {
  if (!canTrack('analytics')) return
  
  try {
    // Send to API endpoint for storage in Supabase
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_data: data,
        session_id: Cookies.get(USER_SESSION_COOKIE),
        user_id: Cookies.get(USER_ID_COOKIE),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        url: window.location.href,
      }),
    }).catch(() => {
      // Silently fail - don't block user experience
    })
  } catch (error) {
    // Silently fail
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to send to database:', error)
    }
  }
}

// Track scroll depth
export const trackScrollDepth = (depth: 25 | 50 | 75 | 100) => {
  trackEvent('scroll_depth', { depth_percentage: depth })
}

// Initialize scroll tracking
export const initScrollTracking = () => {
  if (!canTrack('analytics')) return
  
  const scrollDepths = [25, 50, 75, 100]
  const tracked = new Set<number>()
  
  const handleScroll = () => {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    
    scrollDepths.forEach(depth => {
      if (scrollPercent >= depth && !tracked.has(depth)) {
        tracked.add(depth)
        trackScrollDepth(depth as 25 | 50 | 75 | 100)
      }
    })
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  return () => window.removeEventListener('scroll', handleScroll)
}

// Track time on page
export const trackTimeOnPage = () => {
  if (!canTrack('analytics')) return
  
  const startTime = Date.now()
  
  const sendTimeOnPage = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000) // seconds
    trackEvent('time_on_page', {
      duration_seconds: timeSpent,
      page_path: window.location.pathname,
    })
  }
  
  // Send on page unload
  window.addEventListener('beforeunload', sendTimeOnPage)
  
  // Also send every 30 seconds for long sessions
  const interval = setInterval(sendTimeOnPage, 30000)
  
  return () => {
    window.removeEventListener('beforeunload', sendTimeOnPage)
    clearInterval(interval)
  }
}

// Track clicks on specific elements
export const trackClick = (elementId: string, elementType: string, additionalData?: Record<string, any>) => {
  trackEvent('element_click', {
    element_id: elementId,
    element_type: elementType,
    ...additionalData,
  })
}

// Track form interactions
export const trackFormInteraction = (formId: string, action: 'start' | 'complete' | 'abandon', data?: Record<string, any>) => {
  trackEvent(`form_${action}`, {
    form_id: formId,
    ...data,
  })
}

// Track errors
export const trackError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  })
}

// Track feature usage
export const trackFeatureUsage = (featureName: string, data?: Record<string, any>) => {
  trackEvent('feature_used', {
    feature_name: featureName,
    ...data,
  })
}

// Track user signup
export const trackSignup = (method: 'email' | 'wallet', data?: Record<string, any>) => {
  trackEvent('user_signup', {
    method,
    ...data,
  })
  
  // Track as conversion
  trackConversion('signup', 5) // $5 value for signup
}

// Track KYC events
export const trackKYC = (action: 'started' | 'completed' | 'failed', data?: Record<string, any>) => {
  trackEvent(`kyc_${action}`, data)
  
  if (action === 'completed') {
    trackConversion('kyc_completion', 15) // $15 value for KYC
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

