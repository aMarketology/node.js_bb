// Cookie Consent Management
// GDPR & CCPA compliant consent system
// Manages user privacy preferences

import Cookies from 'js-cookie'

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | 'personalization'

export interface ConsentPreferences {
  essential: boolean // Always true, required for functionality
  analytics: boolean
  marketing: boolean
  personalization: boolean
  timestamp: string
  version: string // Consent policy version
}

const CONSENT_COOKIE = 'prism_consent'
const CONSENT_VERSION = '1.0'
const CONSENT_EXPIRY_DAYS = 365

// Default preferences (only essential enabled)
const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
}

// Get current consent preferences
export const getConsentPreferences = (): ConsentPreferences | null => {
  const consent = Cookies.get(CONSENT_COOKIE)
  if (!consent) return null
  
  try {
    return JSON.parse(consent)
  } catch {
    return null
  }
}

// Save consent preferences
export const saveConsentPreferences = (preferences: Partial<ConsentPreferences>): void => {
  const fullPreferences: ConsentPreferences = {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    essential: true, // Always true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
  
  Cookies.set(CONSENT_COOKIE, JSON.stringify(fullPreferences), {
    expires: CONSENT_EXPIRY_DAYS,
    sameSite: 'lax',
    secure: true,
  })
  
  // Trigger consent change event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consentChanged', { detail: fullPreferences }))
  }
}

// Accept all cookies
export const acceptAllCookies = (): void => {
  saveConsentPreferences({
    analytics: true,
    marketing: true,
    personalization: true,
  })
}

// Reject all non-essential cookies
export const rejectAllCookies = (): void => {
  saveConsentPreferences({
    analytics: false,
    marketing: false,
    personalization: false,
  })
}

// Check if specific category is consented
export const hasConsent = (category: ConsentCategory): boolean => {
  const preferences = getConsentPreferences()
  if (!preferences) return category === 'essential'
  return preferences[category]
}

// Check if consent banner should be shown
export const shouldShowConsentBanner = (): boolean => {
  const preferences = getConsentPreferences()
  
  // Show if no consent given or version outdated
  if (!preferences) return true
  if (preferences.version !== CONSENT_VERSION) return true
  
  return false
}

// Revoke consent (for user settings)
export const revokeConsent = (): void => {
  Cookies.remove(CONSENT_COOKIE)
  
  // Clear all analytics cookies
  clearAnalyticsCookies()
}

// Clear analytics-related cookies
const clearAnalyticsCookies = (): void => {
  // Google Analytics cookies
  const gaCookies = Object.keys(Cookies.get()).filter(
    key => key.startsWith('_ga') || key.startsWith('_gid') || key.startsWith('_gat')
  )
  
  gaCookies.forEach(cookie => Cookies.remove(cookie))
  
  // Custom analytics cookies
  Cookies.remove('prism_user_id')
  Cookies.remove('prism_returning_user')
  Cookies.remove('prism_user_session')
}

// Log consent for compliance
export const logConsent = async (preferences: ConsentPreferences, userId?: string) => {
  // Store in database for audit trail
  try {
    const response = await fetch('/api/consent-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        preferences,
        userAgent: navigator.userAgent,
        ipAddress: null, // Will be captured server-side
        timestamp: new Date().toISOString(),
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to log consent')
    }
  } catch (error) {
    console.error('Error logging consent:', error)
  }
}

// Export user data (GDPR right to data portability)
export const exportUserData = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`/api/user-data-export?userId=${userId}`)
    if (!response.ok) throw new Error('Failed to export data')
    return await response.json()
  } catch (error) {
    console.error('Error exporting user data:', error)
    throw error
  }
}

// Delete user data (GDPR right to be forgotten)
export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    const response = await fetch('/api/user-data-delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    
    if (!response.ok) throw new Error('Failed to delete data')
    
    // Clear all cookies
    revokeConsent()
  } catch (error) {
    console.error('Error deleting user data:', error)
    throw error
  }
}
