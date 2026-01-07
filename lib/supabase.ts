// Supabase Configuration and Database Integration
// Handles user authentication, profiles, and bet history storage

import { createClient } from '@supabase/supabase-js'

// TODO: Add your Supabase credentials to .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your-project-url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  id: string
  wallet_address: string
  username?: string
  email?: string
  avatar_url?: string
  total_bets: number
  total_winnings: number
  win_rate: number
  created_at: string
  updated_at: string
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
export async function signInWithWallet(walletAddress: string) {
  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    // Create user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          wallet_address: walletAddress,
          username: `Player${walletAddress.substring(2, 8)}`,
          total_bets: 0,
          total_winnings: 0,
          win_rate: 0,
        })
        .select()
        .single()

      if (createError) throw createError
      return newUser
    }

    return existingUser
  } catch (error) {
    console.error('Error signing in:', error)
    return null
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error signing in with email:', error)
    return null
  }
}

export async function signUpWithEmail(email: string, password: string, walletAddress?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create profile
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        wallet_address: walletAddress || '',
        email,
        username: `Player${data.user.id.substring(0, 6)}`,
        total_bets: 0,
        total_winnings: 0,
        win_rate: 0,
      })
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

// User Profile Functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    return null
  }
}

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
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  total_bets INTEGER DEFAULT 0,
  total_winnings NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
