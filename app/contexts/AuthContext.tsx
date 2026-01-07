// Authentication Context
// Manages user authentication state and wallet connection

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, signInWithWallet, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, getUserProfile, type UserProfile } from '@/lib/supabase'
import { prismBlockchain } from '@/lib/blockchain'

interface AuthContextType {
  user: UserProfile | null
  walletAddress: string | null
  isAuthenticated: boolean
  isKYCVerified: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, walletAddress?: string) => Promise<boolean>
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    checkUser()
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id)
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
        await loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProfile(userId: string) {
    const profile = await getUserProfile(userId)
    if (profile) {
      setUser(profile)
      setWalletAddress(profile.wallet_address)
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmail(email, password)
      if (result?.user) {
        await loadUserProfile(result.user.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  async function signUp(email: string, password: string, walletAddress?: string): Promise<boolean> {
    try {
      const result = await signUpWithEmail(email, password, walletAddress)
      if (result?.user) {
        await loadUserProfile(result.user.id)
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
        
        // If user is logged in, update their wallet address
        if (user) {
          // Update profile with wallet address
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            await supabase
              .from('user_profiles')
              .update({ wallet_address: address })
              .eq('id', session.user.id)
            
            await loadUserProfile(session.user.id)
          }
        } else {
          // Try to find existing user with this wallet or create new
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
      await loadUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    walletAddress,
    isAuthenticated: !!user,
    isKYCVerified: user?.kyc_verified || false,
    loading,
    signIn,
    signUp,
    connectWallet,
    disconnectWallet,
    signOut,
    refreshProfile,
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
