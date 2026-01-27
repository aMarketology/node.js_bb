// TypeScript types generated from Supabase database schema
// Run: npx supabase gen types typescript --project-id "$PROJECT_ID" --schema public > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          auth_id: string | null
          email: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          reputation_score: number
          follower_count: number
          following_count: number
          post_count: number
          salt: string
          encrypted_blob: string
          blackbook_address: string
          last_login: string
          public_key: string
          total_bets: number | null
          total_winnings: number | null
          win_rate: number | null
          kyc_verified: boolean | null
          kyc_status: string | null
          fan_gold_balance: number
          bb_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          auth_id?: string | null
          email: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          reputation_score?: number
          follower_count?: number
          following_count?: number
          post_count?: number
          salt: string
          encrypted_blob: string
          blackbook_address: string
          last_login?: string
          public_key: string
          total_bets?: number | null
          total_winnings?: number | null
          win_rate?: number | null
          kyc_verified?: boolean | null
          kyc_status?: string | null
          fan_gold_balance?: number
          bb_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          auth_id?: string | null
          email?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          reputation_score?: number
          follower_count?: number
          following_count?: number
          post_count?: number
          salt?: string
          encrypted_blob?: string
          blackbook_address?: string
          last_login?: string
          public_key?: string
          total_bets?: number | null
          total_winnings?: number | null
          win_rate?: number | null
          kyc_verified?: boolean | null
          kyc_status?: string | null
          fan_gold_balance?: number
          bb_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      contests_metadata: {
        Row: {
          contest_id: string
          contest_type: 'duel' | 'roster' | 'bingo'
          category: 'youtube' | 'sports' | 'gaming'
          title: string
          description: string
          entry_fee: number
          currency: 'fan_gold' | 'bb'
          prize_pool: number
          max_participants: number
          current_participants: number
          status: 'upcoming' | 'live' | 'settled'
          locks_at: string
          ends_at: string | null
          created_at: string
          updated_at: string
          entities: Json | null
          payout_structure: Json | null
          oracle_source: string | null
        }
        Insert: {
          contest_id?: string
          contest_type: 'duel' | 'roster' | 'bingo'
          category: 'youtube' | 'sports' | 'gaming'
          title: string
          description: string
          entry_fee: number
          currency?: 'fan_gold' | 'bb'
          prize_pool?: number
          max_participants: number
          current_participants?: number
          status?: 'upcoming' | 'live' | 'settled'
          locks_at: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
          entities?: Json | null
          payout_structure?: Json | null
          oracle_source?: string | null
        }
        Update: {
          contest_id?: string
          contest_type?: 'duel' | 'roster' | 'bingo'
          category?: 'youtube' | 'sports' | 'gaming'
          title?: string
          description?: string
          entry_fee?: number
          currency?: 'fan_gold' | 'bb'
          prize_pool?: number
          max_participants?: number
          current_participants?: number
          status?: 'upcoming' | 'live' | 'settled'
          locks_at?: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
          entities?: Json | null
          payout_structure?: Json | null
          oracle_source?: string | null
        }
      }
      contest_entries: {
        Row: {
          entry_id: string
          contest_id: string
          user_id: string
          pick: Json | null
          entry_fee_paid: number
          currency: 'fan_gold' | 'bb'
          current_rank: number | null
          current_score: number | null
          payout: number | null
          status: 'active' | 'won' | 'lost' | 'pending'
          entered_at: string
          settled_at: string | null
        }
        Insert: {
          entry_id?: string
          contest_id: string
          user_id: string
          pick?: Json | null
          entry_fee_paid: number
          currency?: 'fan_gold' | 'bb'
          current_rank?: number | null
          current_score?: number | null
          payout?: number | null
          status?: 'active' | 'won' | 'lost' | 'pending'
          entered_at?: string
          settled_at?: string | null
        }
        Update: {
          entry_id?: string
          contest_id?: string
          user_id?: string
          pick?: Json | null
          entry_fee_paid?: number
          currency?: 'fan_gold' | 'bb'
          current_rank?: number | null
          current_score?: number | null
          payout?: number | null
          status?: 'active' | 'won' | 'lost' | 'pending'
          entered_at?: string
          settled_at?: string | null
        }
      }
      game_history: {
        Row: {
          game_id: string
          user_id: string
          game_type: string
          result: 'won' | 'lost' | 'draw'
          amount_wagered: number
          amount_won: number
          currency: 'fan_gold' | 'bb'
          created_at: string
          metadata: Json | null
        }
        Insert: {
          game_id?: string
          user_id: string
          game_type: string
          result: 'won' | 'lost' | 'draw'
          amount_wagered: number
          amount_won: number
          currency?: 'fan_gold' | 'bb'
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          game_id?: string
          user_id?: string
          game_type?: string
          result?: 'won' | 'lost' | 'draw'
          amount_wagered?: number
          amount_won?: number
          currency?: 'fan_gold' | 'bb'
          created_at?: string
          metadata?: Json | null
        }
      }
      fan_gold_transactions: {
        Row: {
          transaction_id: string
          user_id: string
          amount: number
          transaction_type: 'earned' | 'spent' | 'bonus' | 'contest_entry' | 'contest_payout'
          description: string | null
          created_at: string
          metadata: Json | null
        }
        Insert: {
          transaction_id?: string
          user_id: string
          amount: number
          transaction_type: 'earned' | 'spent' | 'bonus' | 'contest_entry' | 'contest_payout'
          description?: string | null
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          transaction_id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'earned' | 'spent' | 'bonus' | 'contest_entry' | 'contest_payout'
          description?: string | null
          created_at?: string
          metadata?: Json | null
        }
      }
      badges: {
        Row: {
          badge_id: string
          user_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at: string
        }
        Insert: {
          badge_id?: string
          user_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at?: string
        }
        Update: {
          badge_id?: string
          user_id?: string
          badge_name?: string
          badge_description?: string
          badge_icon?: string
          earned_at?: string
        }
      }
    }
    Views: {
      leaderboard_weekly: {
        Row: {
          user_id: string
          username: string | null
          avatar_url: string | null
          total_winnings: number
          contests_won: number
          fan_gold_balance: number
          rank: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
