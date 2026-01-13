// Authentication Context
// Manages user authentication state and wallet connection
// Integrated with BlackBook blockchain profiles

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, signInWithWallet, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, getUserProfile, getProfileByWallet, type UserProfile } from '@/lib/supabase'
import { prismBlockchain } from '@/lib/blockchain'
import { TEST_ACCOUNTS } from '@/lib/test-accounts'

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
  signIn: (email: string, password: string) => Promise<boolean>
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
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
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
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmail(email, password)
      if (result?.user) {
        await loadUserProfile(result.user.email || result.user.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  async function signUp(email: string, password: string, username?: string): Promise<boolean> {
    try {
      const result = await signUpWithEmail(email, password, username)
      if (result?.user) {
        await loadUserProfile(result.user.email || result.user.id)
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
    return null // User's private key should be in their wallet
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
    signIn,
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
