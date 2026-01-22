// Authentication Context
// Manages user authentication state and wallet connection
// Integrated with BlackBook blockchain profiles
// 
// SECURITY: Password is stored in memory only for the session.
// Private keys are NEVER stored - they are derived on-demand for each signing operation.

'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabase, signInWithWallet, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, getUserProfile, getProfileByWallet, getWalletVault, type UserProfile } from '@/lib/supabase'
import { prismBlockchain } from '@/lib/blockchain'
import { TEST_ACCOUNTS } from '@/lib/test-accounts'
import { createVaultSession, type VaultSession } from '@/lib/blackbook-wallet'
import { signInWithGoogle as googleSignIn, handleGoogleCallback } from '@/lib/google-auth'

// Use centralized test accounts
const TEST_WALLETS = {
  alice: TEST_ACCOUNTS.alice,
  bob: TEST_ACCOUNTS.bob,
}

type ActiveWallet = 'user' | 'alice' | 'bob'

interface AuthContextType {
  user: UserProfile | null
  walletAddress: string | null
  isAuthenticated: boolean
  isKYCVerified: boolean
  loading: boolean
  activeWallet: ActiveWallet
  activeWalletData: typeof TEST_WALLETS.alice | null
  // Vault session for secure signing (no private key stored)
  vaultSession: VaultSession | null
  // Get password for on-demand key derivation (only available in memory)
  getPassword: () => string | null
  // Check if password is unlocked (within 15-minute window)
  isPasswordUnlocked: () => boolean
  // Unlock with password (stores for 15 minutes)
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
  // Password expires after 15 minutes and is cleared on sign out
  // Never persisted to storage
  const passwordRef = useRef<string | null>(null)
  const passwordTimestampRef = useRef<number | null>(null)
  const passwordTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 15 minutes in milliseconds
  const PASSWORD_EXPIRY_MS = 15 * 60 * 1000

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

    return () => {
      authListener.subscription.unsubscribe()
      if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
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
   * Store password in memory for 15 minutes
   */
  function storePassword(password: string) {
    // Clear any existing timer
    if (passwordTimerRef.current) {
      clearTimeout(passwordTimerRef.current)
    }
    
    // Store password and timestamp
    passwordRef.current = password
    passwordTimestampRef.current = Date.now()
    
    // Set timer to clear password after 15 minutes
    passwordTimerRef.current = setTimeout(() => {
      console.log('🔒 Password expired after 15 minutes - clearing from memory')
      clearPassword()
    }, PASSWORD_EXPIRY_MS)
    
    console.log('🔑 Password stored in memory for 15 minutes')
  }

  /**
   * Clear password from memory
   */
  function clearPassword() {
    passwordRef.current = null
    passwordTimestampRef.current = null
    if (passwordTimerRef.current) {
      clearTimeout(passwordTimerRef.current)
      passwordTimerRef.current = null
    }
  }

  /**
   * Check if password is still valid (within 15-minute window)
   */
  function isPasswordUnlocked(): boolean {
    if (!passwordRef.current || !passwordTimestampRef.current) {
      return false
    }
    
    const elapsed = Date.now() - passwordTimestampRef.current
    const isValid = elapsed < PASSWORD_EXPIRY_MS
    
    if (!isValid) {
      console.log('🔒 Password expired - clearing from memory')
      clearPassword()
    }
    
    return isValid
  }

  /**
   * Unlock with password - stores for 15 minutes
   * Returns true if successful
   */
  function unlockWithPassword(password: string): boolean {
    if (!password) return false
    storePassword(password)
    return true
  }

  /**
   * Get password if still valid
   */
  function getPassword(): string | null {
    if (isPasswordUnlocked()) {
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
    } else if (user) {
      setWalletAddress(user.blackbook_address || null)
    }
  }

  function getActiveAddress(): string | null {
    if (activeWallet === 'alice') return TEST_WALLETS.alice.l1Address
    if (activeWallet === 'bob') return TEST_WALLETS.bob.l1Address
    return user?.blackbook_address || walletAddress
  }

  function getActivePrivateKey(): string | null {
    if (activeWallet === 'alice') return TEST_WALLETS.alice.privateKey
    if (activeWallet === 'bob') return TEST_WALLETS.bob.privateKey
    return null // User's private key is derived on-demand, never stored
  }

  const activeWalletData = activeWallet === 'alice' ? TEST_WALLETS.alice : 
                           activeWallet === 'bob' ? TEST_WALLETS.bob : null

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
