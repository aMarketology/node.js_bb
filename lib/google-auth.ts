// Google Sign-In Integration
// Handles Google OAuth authentication with Supabase

import { supabase } from './supabase'
import { identifyUser, trackSignup } from './analytics'

export interface GoogleSignInOptions {
  redirectTo?: string
  scopes?: string[]
}

// Sign in with Google
export async function signInWithGoogle(options?: GoogleSignInOptions) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options?.redirectTo || `${window.location.origin}/`,
        scopes: options?.scopes?.join(' ') || undefined,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Google sign-in error:', error)
      return { success: false, error: error.message }
    }

    // Track signup/login in analytics
    trackSignup('email') // Using 'email' as analytics method type for Google OAuth

    return { success: true, data }
  } catch (error) {
    console.error('Google sign-in exception:', error)
    return { success: false, error: 'Failed to initiate Google sign-in' }
  }
}

// Handle Google OAuth callback
export async function handleGoogleCallback() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user after Google auth:', error)
      return { success: false, error: error.message }
    }

    if (!user) {
      return { success: false, error: 'No user found' }
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
    }

    // If no profile exists, create one
    if (!profile) {
      const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'user'
      const email = user.email || ''

      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: username.toLowerCase().replace(/\s+/g, '_'),
          auth_id: user.id,
          email: email,
          reputation_score: 0,
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          salt: '', // Will be generated when wallet is created
          encrypted_blob: '',
          blackbook_address: '',
          last_login: new Date().toISOString(),
          public_key: '',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return { success: false, error: 'Failed to create user profile' }
      }

      // Identify user in analytics
      if (newProfile) {
        identifyUser(user.id, {
          email: email,
          username: username,
          signupDate: new Date().toISOString(),
        })
      }

      return { success: true, user, profile: newProfile, isNewUser: true }
    }

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('auth_id', user.id)

    // Identify user in analytics
    identifyUser(user.id, {
      email: profile.email,
      username: profile.user_id,
      isKYCVerified: profile.kyc_verified,
    })

    return { success: true, user, profile, isNewUser: false }
  } catch (error) {
    console.error('Google callback exception:', error)
    return { success: false, error: 'Failed to process Google authentication' }
  }
}

// Get Google user info
export async function getGoogleUserInfo() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      return null
    }

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info')
    }

    const userInfo = await response.json()
    return userInfo
  } catch (error) {
    console.error('Error fetching Google user info:', error)
    return null
  }
}

// Check if user signed in with Google
export async function isGoogleUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.app_metadata?.provider === 'google'
  } catch (error) {
    return false
  }
}
