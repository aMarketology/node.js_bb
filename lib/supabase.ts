// Supabase Configuration and Database Integration
// Handles user authentication, profiles, and bet history storage
// Uses existing BlackBook blockchain profile structure

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase

// Database Types - Matches existing profiles table structure
export interface UserProfile {
  user_id: string                    // Primary key - username
  auth_id?: string                   // Supabase auth.users UUID (for user_vaults FK)
  email: string
  reputation_score: number
  follower_count: number
  following_count: number
  post_count: number
  salt: string                       // Vault encryption salt
  encrypted_blob: string             // Encrypted wallet vault (mnemonic)
  blackbook_address: string          // L1 blockchain address
  last_login: string
  public_key: string                 // User's public key
  // Extended fields for betting (will add to DB)
  total_bets?: number
  total_winnings?: number
  win_rate?: number
  kyc_verified?: boolean
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'bypassed_testing'
}

// WalletVault interface is defined below in the WALLET VAULT FUNCTIONS section

// Public profile view (no sensitive data)
export interface PublicProfile {
  user_id: string
  email: string
  reputation_score: number
  follower_count: number
  following_count: number
  post_count: number
  blackbook_address: string
  last_login: string
}

export interface BetRecord {
  id: string
  user_id: string
  wallet_address: string
  match_id: string
  prediction: 'home' | 'draw' | 'away'
  amount: number
  odds: number
  potential_payout: number
  tx_hash: string
  status: 'pending' | 'confirmed' | 'won' | 'lost' | 'cancelled'
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface MatchStats {
  match_id: string
  total_bets: number
  total_pool: number
  home_pool: number
  draw_pool: number
  away_pool: number
  home_bets: number
  draw_bets: number
  away_bets: number
  updated_at: string
}

// Authentication Functions
// Sign in with BlackBook wallet address (L1 blockchain)
export async function signInWithWallet(blackbookAddress: string) {
  try {
    // Check if user exists by blackbook_address
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('blackbook_address', blackbookAddress)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingUser) {
      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', existingUser.user_id)
      
      return existingUser
    }

    // User doesn't exist - they need to sign up first
    return null
  } catch (error) {
    console.error('Error signing in with wallet:', error)
    return null
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    console.log('Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Supabase auth error:', error.message)
      throw error
    }
    
    console.log('Auth successful, user:', data.user?.id)
    
    // Also load their profile from profiles table
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }
      
      if (profile) {
        console.log('Profile found:', profile.user_id)
        
        // Backfill auth_id if missing
        if (!profile.auth_id) {
          console.log('⚠️ Backfilling missing auth_id for profile:', profile.user_id)
          await supabase
            .from('profiles')
            .update({ auth_id: data.user.id })
            .eq('user_id', profile.user_id)
        }
        
        // Update last login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', profile.user_id)
      } else {
        console.warn('No profile found for email:', email)
      }
    }
    
    return data
  } catch (error: any) {
    console.error('Error signing in with email:', error?.message || error)
    return null
  }
}

export async function signUpWithEmail(email: string, password: string, username?: string, blackbookAddress?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Skip email confirmation - sign in immediately
        emailRedirectTo: undefined,
      }
    })

    if (error) throw error

    // Create profile in profiles table
    if (data.user) {
      const authId = data.user.id // Store the auth UUID
      const userId = username || `user_${authId.substring(0, 8)}`
      
      // Check if profile already exists (in case of re-signup)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single()
      
      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: userId,
          auth_id: authId, // Store the Supabase auth UUID
          email: email,
          reputation_score: 100,
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          salt: '',
          encrypted_blob: '',
          blackbook_address: blackbookAddress || '',
          last_login: new Date().toISOString(),
          public_key: '',
        })
        
        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }
    }

    return data
  } catch (error) {
    console.error('Error signing up:', error)
    return null
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}

// Password Reset Functions
export async function resetPasswordForEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) throw error
    return true
  } catch (error: any) {
    console.error('Error sending password reset email:', error?.message || error)
    return false
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    return true
  } catch (error: any) {
    console.error('Error updating password:', error?.message || error)
    return false
  }
}

// User Profile Functions
// Get profile by user_id (username) or email
export async function getUserProfile(identifier: string): Promise<UserProfile | null> {
  try {
    // First try by user_id
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', identifier)
      .single()

    // If not found, try by email
    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('email', identifier)
        .single()
      
      data = result.data
      error = result.error
    }

    if (error && error.code !== 'PGRST116') throw error
    
    if (data) {
      console.log('👤 getUserProfile result:', {
        user_id: data.user_id,
        auth_id: data.auth_id,
        email: data.email,
        has_auth_id: !!data.auth_id
      })
    }
    
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

// Get profile by blackbook address
export async function getProfileByWallet(blackbookAddress: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('blackbook_address', blackbookAddress)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error fetching profile by wallet:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    return null
  }
}

// Wallet Vault Functions are defined below in the WALLET VAULT FUNCTIONS section
// storeWalletVault, getWalletVault, userHasWallet/hasWallet

// Bet Functions
export async function saveBet(bet: Omit<BetRecord, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('bet_records')
      .insert(bet)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving bet:', error)
    return null
  }
}

export async function getUserBets(userId: string): Promise<BetRecord[]> {
  try {
    const { data, error } = await supabase
      .from('bet_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user bets:', error)
    return []
  }
}

export async function getMatchBets(matchId: string): Promise<BetRecord[]> {
  try {
    const { data, error } = await supabase
      .from('bet_records')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching match bets:', error)
    return []
  }
}

export async function updateBetStatus(
  betId: string,
  status: BetRecord['status'],
  resolvedAt?: string
) {
  try {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (resolvedAt) updates.resolved_at = resolvedAt

    const { data, error } = await supabase
      .from('bet_records')
      .update(updates)
      .eq('id', betId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating bet status:', error)
    return null
  }
}

// Match Stats Functions
export async function getMatchStats(matchId: string): Promise<MatchStats | null> {
  try {
    const { data, error } = await supabase
      .from('match_stats')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching match stats:', error)
    return null
  }
}

export async function updateMatchStats(matchId: string, stats: Partial<MatchStats>) {
  try {
    const { data, error } = await supabase
      .from('match_stats')
      .upsert({
        match_id: matchId,
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating match stats:', error)
    return null
  }
}

// Leaderboard Functions
export async function getLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('total_winnings', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

// Real-time subscriptions
export function subscribeToBets(matchId: string, callback: (bet: BetRecord) => void) {
  return supabase
    .channel(`bets:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bet_records',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        callback(payload.new as BetRecord)
      }
    )
    .subscribe()
}

// ═══════════════════════════════════════════════════════════════
// WALLET VAULT FUNCTIONS
// Store encrypted wallet vaults in Supabase (host-proof encryption)
// ═══════════════════════════════════════════════════════════════

export interface WalletVault {
  user_id: string             // Profile user_id (username)
  auth_id?: string            // Supabase auth.users UUID (for user_vaults FK)
  encrypted_blob: string      // AES-256-GCM encrypted mnemonic
  nonce: string               // GCM nonce (hex)
  vault_salt: string          // Salt for vault key derivation
  auth_salt: string           // Salt for auth key derivation
  blackbook_address: string   // L1 address
  public_key: string          // Ed25519 public key (hex)
  vault_version: number       // Encryption version (2 = Fork Architecture V2)
  created_at?: string
  updated_at?: string
}

/**
 * Save wallet vault to Supabase
 * The encrypted_blob can only be decrypted client-side with the user's vaultKey
 * Saves to both profiles (for address/public_key) and user_vaults (for encryption data)
 */
export async function saveWalletVault(vault: Omit<WalletVault, 'created_at' | 'updated_at'>): Promise<boolean> {
  try {
    console.log('💾 saveWalletVault called with:', {
      user_id: vault.user_id,
      auth_id: vault.auth_id,
      has_nonce: !!vault.nonce,
      has_encrypted_blob: !!vault.encrypted_blob
    })

    // Update the profiles table with wallet address and public key
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        encrypted_blob: vault.encrypted_blob,
        salt: vault.vault_salt,
        blackbook_address: vault.blackbook_address,
        public_key: vault.public_key,
      })
      .eq('user_id', vault.user_id)

    if (profileError) {
      console.error('❌ Error updating profiles:', profileError)
      throw profileError
    }
    
    console.log('✅ Profiles table updated successfully')
    
    // Save encryption data to user_vaults table
    // user_vaults uses auth.users UUID as foreign key, not profile user_id
    if (vault.auth_id) {
      console.log('💾 Attempting to save to user_vaults with auth_id:', vault.auth_id)
      
      const { error: vaultError } = await supabase
        .from('user_vaults')
        .upsert({
          user_id: vault.auth_id, // Use auth UUID for the FK
          vault_salt: vault.vault_salt,
          nonce: vault.nonce,
          encrypted_blob: vault.encrypted_blob,
          version: vault.vault_version || 2,
          updated_at: new Date().toISOString()
        })

      if (vaultError) {
        console.error('❌ Error saving to user_vaults:', vaultError)
      } else {
        console.log('✅ Saved to user_vaults for auth_id:', vault.auth_id)
      }
    } else {
      console.warn('⚠️ No auth_id provided, skipping user_vaults save')
    }

    return true
  } catch (error) {
    console.error('❌ Error saving wallet vault:', error)
    return false
  }
}

/**
 * Get wallet vault from Supabase
 * Prioritizes user_vaults table (has nonce), falls back to profiles
 * @param userId - profile user_id (username)
 * @param authId - optional Supabase auth.users UUID for user_vaults lookup
 */
export async function getWalletVault(userId: string, authId?: string): Promise<WalletVault | null> {
  try {
    // Get profile data for address, public_key, and auth_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, auth_id, blackbook_address, public_key, encrypted_blob, salt')
      .eq('user_id', userId)
      .single()

    // Use provided authId or get from profile
    const vaultAuthId = authId || profile?.auth_id

    // Try user_vaults table first (has proper encryption fields)
    if (vaultAuthId) {
      const { data: vault, error: vaultError } = await supabase
        .from('user_vaults')
        .select('user_id, vault_salt, nonce, encrypted_blob, version')
        .eq('user_id', vaultAuthId)
        .single()

      if (vault && !vaultError) {
        console.log('✅ Loaded vault from user_vaults')
        return {
          user_id: userId, // Return profile user_id
          auth_id: vaultAuthId,
          encrypted_blob: vault.encrypted_blob,
          nonce: vault.nonce,
          vault_salt: vault.vault_salt,
          auth_salt: '',
          blackbook_address: profile?.blackbook_address || '',
          public_key: profile?.public_key || '',
          vault_version: vault.version || 2
        }
      }
    }

    // Fallback: try to reconstruct from profiles table only
    if (profile?.encrypted_blob) {
      console.log('⚠️ Falling back to profiles table for vault')
      // Parse combined blob format if present: "nonce:ciphertext"
      let nonce = ''
      let encryptedBlob = profile.encrypted_blob || ''
      
      if (encryptedBlob.includes(':')) {
        const colonIndex = encryptedBlob.indexOf(':')
        nonce = encryptedBlob.substring(0, colonIndex)
        encryptedBlob = encryptedBlob.substring(colonIndex + 1)
      }

      return {
        user_id: profile.user_id,
        auth_id: profile.auth_id,
        encrypted_blob: encryptedBlob,
        nonce: nonce,
        vault_salt: profile.salt || '',
        auth_salt: '',
        blackbook_address: profile.blackbook_address || '',
        public_key: profile.public_key || '',
        vault_version: 2
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching wallet vault:', error)
    return null
  }
}

/**
 * Check if user has a wallet
 */
export async function hasWallet(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('blackbook_address, encrypted_blob')
      .eq('user_id', userId)
      .single()

    if (error) return false
    return !!(data?.blackbook_address && data?.encrypted_blob)
  } catch (error) {
    return false
  }
}

/**
 * Update wallet address in profile
 */
export async function updateWalletAddress(userId: string, blackbookAddress: string, publicKey: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        blackbook_address: blackbookAddress,
        public_key: publicKey,
        last_login: new Date().toISOString()
      })
      .eq('user_id', userId)

    return !error
  } catch (error) {
    console.error('Error updating wallet address:', error)
    return false
  }
}

export function subscribeToMatchStats(matchId: string, callback: (stats: MatchStats) => void) {
  return supabase
    .channel(`stats:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_stats',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        callback(payload.new as MatchStats)
      }
    )
    .subscribe()
}

// SQL Schema for reference - Create these tables in your Supabase project:
/*

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  total_bets INTEGER DEFAULT 0,
  total_winnings NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'bypassed_testing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC Submissions Table
CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  ssn_last_4 TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT,
  apartment_unit TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',
  id_type TEXT CHECK (id_type IN ('drivers_license', 'passport', 'state_id')),
  id_number TEXT,
  id_expiration_date DATE,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  proof_of_address_url TEXT,
  source_of_funds TEXT,
  estimated_annual_income TEXT,
  net_worth TEXT,
  employment_status TEXT,
  employer TEXT,
  is_us_citizen BOOLEAN DEFAULT FALSE,
  is_politically_exposed BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'bypassed_testing', 'under_review')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Bet Records Table
CREATE TABLE bet_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  wallet_address TEXT NOT NULL,
  match_id TEXT NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('home', 'draw', 'away')),
  amount NUMERIC NOT NULL,
  odds NUMERIC NOT NULL,
  potential_payout NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'won', 'lost', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Match Stats Table
CREATE TABLE match_stats (
  match_id TEXT PRIMARY KEY,
  total_bets INTEGER DEFAULT 0,
  total_pool NUMERIC DEFAULT 0,
  home_pool NUMERIC DEFAULT 0,
  draw_pool NUMERIC DEFAULT 0,
  away_pool NUMERIC DEFAULT 0,
  home_bets INTEGER DEFAULT 0,
  draw_bets INTEGER DEFAULT 0,
  away_bets INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bet_records_user ON bet_records(user_id);
CREATE INDEX idx_bet_records_match ON bet_records(match_id);
CREATE INDEX idx_bet_records_wallet ON bet_records(wallet_address);
CREATE INDEX idx_user_profiles_wallet ON user_profiles(wallet_address);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own bets" ON bet_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can view match stats" ON match_stats FOR SELECT TO authenticated, anon USING (true);

*/
