// Authentication Context
// Manages user authentication state and wallet connection
// Integrated with BlackBook blockchain profiles
// 
// SECURITY MODEL:
// - Password stored in memory only during active session
// - 10-minute active session (extends on user activity)
// - 1-hour inactivity auto-logout
// - Large transactions (≥$1000) ALWAYS require password
// - Private keys are NEVER stored - derived on-demand for each signing operation

'use client'

import { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react'
import { supabase, signInWithWallet, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, getUserProfile, getProfileByWallet, getWalletVault, type UserProfile } from '@/lib/supabase'
import { prismBlockchain } from '@/lib/blockchain'
import { TEST_ACCOUNTS } from '@/lib/test-accounts'
import { createVaultSession, type VaultSession } from '@/lib/blackbook-wallet'
import { signInWithGoogle as googleSignIn, handleGoogleCallback } from '@/lib/google-auth'

// Use centralized test accounts
const TEST_WALLETS = {
  alice: TEST_ACCOUNTS.alice,
  bob: TEST_ACCOUNTS.bob,
  mac: TEST_ACCOUNTS.mac,
}

type ActiveWallet = 'user' | 'alice' | 'bob' | 'mac'

// Wallet data types - supports both test wallets (with keys) and user wallets (keys derived on-demand)
type TestWalletData = typeof TEST_ACCOUNTS.alice
type UserWalletData = {
  l1Address: string
  l2Address: string
  publicKey: string | null
  privateKey: null  // User private keys are NEVER stored
  requiresDerivation: true  // Flag indicating keys must be derived on-demand
}
type WalletData = TestWalletData | UserWalletData | null

interface AuthContextType {
  user: UserProfile | null
  walletAddress: string | null
  isAuthenticated: boolean
  isKYCVerified: boolean
  loading: boolean
  activeWallet: ActiveWallet
  activeWalletData: WalletData
  // Vault session for secure signing (no private key stored)
  vaultSession: VaultSession | null
  // Get password for on-demand key derivation (only available in memory)
  getPassword: () => string | null
  // Check if password is unlocked (within active session)
  isPasswordUnlocked: () => boolean
  // Check if password is required for a transaction amount
  shouldPromptPassword: (amount?: number) => boolean
  // Unlock with password (starts activity-based session)
  unlockWithPassword: (password: string) => boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signUp: (email: string, password: string, username?: string) => Promise<boolean>
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  switchWallet: (wallet: ActiveWallet) => void
  getActiveAddress: () => string | null
  getActivePrivateKey: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeWallet, setActiveWallet] = useState<ActiveWallet>('alice') // Default to Alice for testing
  const [vaultSession, setVaultSession] = useState<VaultSession | null>(null)
  
  // Store password in memory only (ref to avoid re-renders)
  // Never persisted to storage
  const passwordRef = useRef<string | null>(null)
  const passwordTimestampRef = useRef<number | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  
  // Session timing constants
  const ACTIVE_SESSION_MS = 10 * 60 * 1000   // 10 minutes - extends on activity
  const INACTIVITY_LOGOUT_MS = 60 * 60 * 1000 // 1 hour - auto logout
  const LARGE_TX_THRESHOLD = 1000             // $1000 - always requires password

  // Initialize auth state
  useEffect(() => {
    checkUser()
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.email || session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setWalletAddress(null)
        clearPassword()
      }
    })

    // Set up activity listeners for session management
    const handleActivity = () => trackActivity()
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    return () => {
      authListener.subscription.unsubscribe()
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user.email || session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProfile(identifier: string) {
    const profile = await getUserProfile(identifier)
    if (profile) {
      setUser(profile)
      setWalletAddress(profile.blackbook_address || null)
      
      // Load vault session if available (for UI state and future signing)
      // Note: Password is not available after page refresh, so user will need to re-enter for signing
      await loadVaultSession(profile.user_id, profile.auth_id)
    }
  }

  /**
   * Track user activity - extends session and resets inactivity timer
   */
  function trackActivity() {
    const now = Date.now()
    lastActivityRef.current = now
    
    // If password is unlocked, extend the active session
    if (passwordRef.current && passwordTimestampRef.current) {
      extendSession()
    }
    
    // Reset inactivity logout timer
    resetInactivityTimer()
  }

  /**
   * Extend the active session (called on activity)
   */
  function extendSession() {
    if (!passwordRef.current) return
    
    // Update timestamp to extend session
    passwordTimestampRef.current = Date.now()
    
    // Reset session timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current)
    }
    
    sessionTimerRef.current = setTimeout(() => {
      console.log('🔒 Active session expired after 10 minutes of no activity')
      clearPassword()
    }, ACTIVE_SESSION_MS)
  }

  /**
   * Reset inactivity logout timer
   */
  function resetInactivityTimer() {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Only set timer if user is logged in
    if (user) {
      inactivityTimerRef.current = setTimeout(async () => {
        console.log('🚪 Auto-logout: 1 hour of inactivity')
        await signOut()
      }, INACTIVITY_LOGOUT_MS)
    }
  }

  /**
   * Store password in memory with activity-based expiry
   */
  function storePassword(password: string) {
    // Clear any existing timers
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current)
    
    // Store password and timestamp
    passwordRef.current = password
    passwordTimestampRef.current = Date.now()
    lastActivityRef.current = Date.now()
    
    // Set session timer (10 minutes)
    sessionTimerRef.current = setTimeout(() => {
      console.log('🔒 Active session expired - clearing password')
      clearPassword()
    }, ACTIVE_SESSION_MS)
    
    console.log('🔑 Password stored - 10-minute active session started')
  }

  /**
   * Clear password from memory
   */
  function clearPassword() {
    passwordRef.current = null
    passwordTimestampRef.current = null
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
  }

  /**
   * Check if password is still valid (within active session window)
   */
  function isPasswordUnlocked(): boolean {
    if (!passwordRef.current || !passwordTimestampRef.current) {
      return false
    }
    
    const elapsed = Date.now() - passwordTimestampRef.current
    const isValid = elapsed < ACTIVE_SESSION_MS
    
    if (!isValid) {
      console.log('🔒 Session expired - clearing password')
      clearPassword()
    }
    
    return isValid
  }

  /**
   * Check if password is required for a transaction
   * @param amount - Transaction amount in dollars
   * @returns true if password prompt is needed
   */
  function shouldPromptPassword(amount: number = 0): boolean {
    // Large transactions ALWAYS require password
    if (amount >= LARGE_TX_THRESHOLD) {
      console.log(`💰 Large transaction ($${amount}) - password required`)
      return true
    }
    
    // For normal transactions, check if session is active
    return !isPasswordUnlocked()
  }

  /**
   * Unlock with password - starts activity-based session
   * Returns true if successful
   */
  function unlockWithPassword(password: string): boolean {
    if (!password) return false
    storePassword(password)
    return true
  }

  /**
   * Get password if session is still active
   */
  function getPassword(): string | null {
    if (isPasswordUnlocked()) {
      // Extend session on password use
      extendSession()
      return passwordRef.current
    }
    return null
  }

  /**
   * Load vault session from Supabase for secure signing
   */
  async function loadVaultSession(userId: string, authId?: string) {
    try {
      console.log('🔐 Loading vault session for:', { userId, authId })
      const vaultData = await getWalletVault(userId, authId)
      console.log('🔐 Vault data received:', {
        hasData: !!vaultData,
        hasBlob: !!vaultData?.encrypted_blob,
        hasNonce: !!vaultData?.nonce,
        hasSalt: !!vaultData?.vault_salt,
        address: vaultData?.blackbook_address
      })
      
      if (vaultData && vaultData.encrypted_blob && vaultData.nonce) {
        const session = createVaultSession(
          vaultData.blackbook_address,
          vaultData.public_key,
          vaultData.encrypted_blob,
          vaultData.nonce,
          vaultData.vault_salt
        )
        setVaultSession(session)
        console.log('✅ Vault session created for:', vaultData.blackbook_address)
        console.log('🔐 Session details:', {
          address: session.address,
          publicKey: session.publicKey?.substring(0, 16) + '...',
          hasSalt: !!session.salt,
          hasNonce: !!session.nonce,
          hasBlob: !!session.encryptedBlob
        })
        return session
      } else {
        console.warn('⚠️ Vault data incomplete, cannot create session')
      }
    } catch (error) {
      console.error('Failed to load vault session:', error)
    }
    return null
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      console.log('🔑 Signing in with email:', email)
      const result = await signInWithEmail(email, password)
      if (result?.user) {
        // Load user profile
        const profile = await getUserProfile(result.user.email || result.user.id)
        if (profile) {
          setUser(profile)
          setWalletAddress(profile.blackbook_address || null)
          
          // Store password in memory for 15 minutes
          storePassword(password)
          
          // Load vault session for secure signing
          const session = await loadVaultSession(profile.user_id, profile.auth_id)
          if (session) {
            console.log('✅ Sign in complete with vault session')
          } else {
            console.warn('⚠️ Sign in complete but no vault session')
          }
          
          // Switch to user wallet on login
          setActiveWallet('user')
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  async function signInWithGoogle(): Promise<boolean> {
    try {
      console.log('🔑 Signing in with Google')
      const result = await googleSignIn({
        redirectTo: `${window.location.origin}/`,
      })
      
      if (result.success) {
        // OAuth redirect happens automatically, will be handled by callback
        return true
      }
      
      console.error('Google sign-in failed:', result.error)
      return false
    } catch (error) {
      console.error('Google sign-in error:', error)
      return false
    }
  }

  async function signUp(email: string, password: string, username?: string): Promise<boolean> {
    try {
      const result = await signUpWithEmail(email, password, username)
      if (result?.user) {
        await loadUserProfile(result.user.email || result.user.id)
        // Store password in memory for wallet creation (15 minutes)
        storePassword(password)
        return true
      }
      return false
    } catch (error) {
      console.error('Sign up error:', error)
      return false
    }
  }

  async function connectWallet(): Promise<boolean> {
    try {
      await prismBlockchain.initialize()
      const address = await prismBlockchain.connectWallet()
      
      if (address) {
        setWalletAddress(address)
        
        // If user is logged in, update their blackbook address
        if (user) {
          await supabase
            .from('profiles')
            .update({ blackbook_address: address })
            .eq('user_id', user.user_id)
          
          await loadUserProfile(user.user_id)
        } else {
          // Try to find existing user with this wallet
          const result = await signInWithWallet(address)
          if (result) {
            setUser(result)
          }
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Wallet connection error:', error)
      return false
    }
  }

  function disconnectWallet() {
    prismBlockchain.disconnectWallet()
    setWalletAddress(null)
  }

  async function signOut() {
    // Clear password and timer from memory
    clearPassword()
    // Clear vault session
    setVaultSession(null)
    
    await supabaseSignOut()
    disconnectWallet()
    setUser(null)
  }

  async function refreshProfile() {
    if (user) {
      await loadUserProfile(user.user_id)
    }
  }

  function switchWallet(wallet: ActiveWallet) {
    setActiveWallet(wallet)
    if (wallet === 'alice') {
      setWalletAddress(TEST_WALLETS.alice.l1Address)
    } else if (wallet === 'bob') {
      setWalletAddress(TEST_WALLETS.bob.l1Address)
    } else if (wallet === 'mac') {
      setWalletAddress(TEST_WALLETS.mac.l1Address)
    } else if (user) {
      setWalletAddress(user.blackbook_address || null)
    }
  }

  function getActiveAddress(): string | null {
    if (activeWallet === 'alice') return TEST_WALLETS.alice.l1Address
    if (activeWallet === 'bob') return TEST_WALLETS.bob.l1Address
    if (activeWallet === 'mac') return TEST_WALLETS.mac.l1Address
    return user?.blackbook_address || walletAddress
  }

  function getActivePrivateKey(): string | null {
    if (activeWallet === 'alice') return TEST_WALLETS.alice.privateKey
    if (activeWallet === 'bob') return TEST_WALLETS.bob.privateKey
    if (activeWallet === 'mac') return null // Mac uses vault-encrypted keys
    return null // User's private key is derived on-demand, never stored
  }

  const activeWalletData: WalletData = useMemo(() => {
    if (activeWallet === 'alice') return TEST_WALLETS.alice
    if (activeWallet === 'bob') return TEST_WALLETS.bob
    if (activeWallet === 'mac') return TEST_WALLETS.mac
    if (activeWallet === 'user' && user?.blackbook_address) {
      return {
        // User wallet data (keys derived on-demand, not stored here)
        l1Address: user.blackbook_address,
        l2Address: user.blackbook_address.replace('L1_', 'L2_'),
        publicKey: vaultSession?.publicKey || null,
        privateKey: null, // NEVER stored - derived on-demand via derivePrivateKeyOnDemand()
        // Flag to indicate keys must be derived
        requiresDerivation: true as const
      }
    }
    return null
  }, [activeWallet, user?.blackbook_address, vaultSession?.publicKey])

  const value: AuthContextType = {
    user,
    walletAddress,
    isAuthenticated: !!user,
    isKYCVerified: user?.kyc_verified || false,
    loading,
    activeWallet,
    activeWalletData,
    vaultSession,
    getPassword,
    isPasswordUnlocked,
    shouldPromptPassword,
    unlockWithPassword,
    signIn,
    signInWithGoogle,
    signUp,
    connectWallet,
    disconnectWallet,
    signOut,
    refreshProfile,
    switchWallet,
    getActiveAddress,
    getActivePrivateKey,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
