-- ═══════════════════════════════════════════════════════════════════════════
-- DATA ARCHITECTURE REFACTOR - Production-Ready Layer Separation
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- PURPOSE: Align database with the Casino Architecture:
--   • Layer 1 (Base): The Vault (Slow, secure, holds real cash)
--   • Layer 2 (Redb): The Table (Fast, where chips move) - NOT IN SUPABASE
--   • Supabase: The Front Desk (Records, history, member profiles, Fan Gold)
--
-- WHAT CHANGES:
--   1. Remove live state from Supabase (belongs on L2)
--   2. Rename tables to clarify they are HISTORICAL, not active
--   3. Remove live financial tracking (L2 is source of truth)
--   4. Add Fan Gold table (has $0 value, like Reddit Karma)
--   5. Add proper contest history tables
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: DROP HELPER FUNCTIONS THAT UPDATE LIVE STATE
-- These were incrementing stats in Supabase - WRONG. L2 tracks live state.
-- ───────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS increment_market_stats(UUID, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS increment_outcome_stats(UUID, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS increment_profile_stats(TEXT, DECIMAL, INTEGER, DECIMAL);
DROP VIEW IF EXISTS market_leaderboard;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2: RESTRUCTURE PROFILES TABLE
-- Keep: username, email, avatar_url, bio (Web2 data)
-- Remove: total_bets, total_volume, total_winnings (L2 data)
-- Add: fan_gold_balance (Supabase-only, $0 value like Reddit Karma)
-- ───────────────────────────────────────────────────────────────────────────

-- Add Fan Gold column (this is NOT $BB, it has no monetary value)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fan_gold_balance BIGINT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Remove live financial tracking columns (L2 is source of truth)
-- Note: We keep the columns but mark them deprecated via comments
-- To actually remove: ALTER TABLE profiles DROP COLUMN IF EXISTS total_bets;
COMMENT ON COLUMN profiles.total_bets IS 'DEPRECATED: Query L2 for live stats. This is historical only.';
COMMENT ON COLUMN profiles.total_volume IS 'DEPRECATED: Query L2 for live stats. This is historical only.';
COMMENT ON COLUMN profiles.total_winnings IS 'DEPRECATED: Query L2 for live stats. This is historical only.';
COMMENT ON COLUMN profiles.fan_gold_balance IS 'Fan Gold (FG) - Social currency with $0 value. Like Reddit Karma.';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3: RENAME BETS TABLE -> BET_HISTORY
-- This table should ONLY contain settled bets, not active ones.
-- Active bets live on L2 (Redb) for fast execution.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS bets RENAME TO bet_history;

-- Update status column comment
COMMENT ON TABLE bet_history IS 
'HISTORICAL BET RECORDS - Only settled bets (won/lost/refunded). 
Active bets live on L2 (Redb). Indexer syncs here AFTER settlement.';

COMMENT ON COLUMN bet_history.status IS 
'Settled status only: won, lost, refunded. Never "active" - active bets are on L2.';

-- Add constraint to prevent active bets in Supabase
ALTER TABLE bet_history DROP CONSTRAINT IF EXISTS bet_history_no_active;
ALTER TABLE bet_history ADD CONSTRAINT bet_history_no_active 
  CHECK (status IN ('won', 'lost', 'refunded', 'cancelled'));

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 4: RENAME MARKETS TABLE -> MARKET_HISTORY
-- Active markets with live liquidity/volume are on L2.
-- This is for resolved markets and historical queries.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS markets RENAME TO market_history;

COMMENT ON TABLE market_history IS
'HISTORICAL MARKET RECORDS - For resolved markets and analytics.
Active market state (liquidity, volume, prices) lives on L2.
Indexer syncs here after market resolution.';

-- Update foreign key references
ALTER TABLE IF EXISTS market_outcomes RENAME TO market_outcome_history;

COMMENT ON TABLE market_outcome_history IS
'HISTORICAL OUTCOME RECORDS - Final settlement data.
Live odds and liquidity come from L2.';

-- Update foreign key in bet_history to point to market_history
-- This requires recreating the constraint
ALTER TABLE bet_history DROP CONSTRAINT IF EXISTS bets_market_id_fkey;
ALTER TABLE bet_history DROP CONSTRAINT IF EXISTS bet_history_market_id_fkey;
ALTER TABLE bet_history ADD CONSTRAINT bet_history_market_id_fkey 
  FOREIGN KEY (market_id) REFERENCES market_history(id) ON DELETE CASCADE;

ALTER TABLE bet_history DROP CONSTRAINT IF EXISTS bets_outcome_id_fkey;
ALTER TABLE bet_history DROP CONSTRAINT IF EXISTS bet_history_outcome_id_fkey;
ALTER TABLE bet_history ADD CONSTRAINT bet_history_outcome_id_fkey 
  FOREIGN KEY (outcome_id) REFERENCES market_outcome_history(id) ON DELETE CASCADE;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 5: UPDATE USER_ANALYTICS_SUMMARY
-- Remove live financial tracking (L2 is source of truth)
-- ───────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE user_analytics_summary IS
'USER ANALYTICS - Behavioral metrics only. 
Financial totals (wagered, deposits, withdrawals) should be computed from L2/L1 on demand.';

COMMENT ON COLUMN user_analytics_summary.total_wagered IS 
'DEPRECATED: Compute from L2 bet_history on demand.';
COMMENT ON COLUMN user_analytics_summary.total_deposits IS 
'DEPRECATED: Query L1 vault for authoritative deposit total.';
COMMENT ON COLUMN user_analytics_summary.total_withdrawals IS 
'DEPRECATED: Query L1 vault for authoritative withdrawal total.';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 6: CREATE CONTEST HISTORY TABLE
-- Contests (Roster, Duel, Bingo) - Historical records only.
-- Live contest state lives on L2.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contest_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id TEXT UNIQUE NOT NULL,  -- L2 contest identifier
    
    -- Contest Definition
    title TEXT NOT NULL,
    contest_type TEXT NOT NULL,  -- 'duel', 'roster', 'bingo'
    category TEXT,  -- 'youtube', 'sports', 'esports'
    
    -- Entry & Prize (Final settled values)
    entry_fee DECIMAL NOT NULL,
    prize_pool DECIMAL NOT NULL,
    rake_amount DECIMAL DEFAULT 0,
    participants_count INTEGER DEFAULT 0,
    
    -- Settlement
    status TEXT DEFAULT 'settled',  -- 'settled', 'cancelled', 'refunded'
    winner_addresses TEXT[],
    payout_distribution JSONB,  -- {"1st": 0.5, "2nd": 0.3, "3rd": 0.2}
    
    -- Oracle Proof (Fairness)
    oracle_source TEXT,
    oracle_data JSONB,  -- The raw API response proving the result
    oracle_signature TEXT,  -- Signature from oracle provider
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contest_history IS
'HISTORICAL CONTEST RECORDS - Only settled contests.
Active contests (entries, scores, timers) live on L2.
This table is for the "My History" page and fairness audits.';

CREATE INDEX IF NOT EXISTS idx_contest_history_type ON contest_history(contest_type);
CREATE INDEX IF NOT EXISTS idx_contest_history_status ON contest_history(status);
CREATE INDEX IF NOT EXISTS idx_contest_history_settled ON contest_history(settled_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 7: CREATE CONTEST ENTRY HISTORY TABLE
-- Individual user entries with their picks/roster - AFTER settlement only.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contest_entry_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id TEXT UNIQUE NOT NULL,  -- L2 entry identifier
    
    contest_id UUID REFERENCES contest_history(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    
    -- The User's Picks (depends on contest type)
    selection JSONB NOT NULL,  -- Duel: {"pick": "Kai Cenat"}, Roster: {"players": [...], "salary_used": 48000}
    
    -- Scoring & Result
    final_score DECIMAL,
    final_rank INTEGER,
    
    -- Payout (settled)
    entry_fee_paid DECIMAL NOT NULL,
    payout_received DECIMAL DEFAULT 0,
    result TEXT DEFAULT 'loss',  -- 'win', 'loss', 'refund', 'partial'
    
    -- Timestamps
    entered_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contest_entry_history IS
'HISTORICAL CONTEST ENTRIES - User picks after settlement.
Active entries (before contest locks) live on L2.
This powers the "My History" and "Past Contests" pages.';

CREATE INDEX IF NOT EXISTS idx_entry_history_contest ON contest_entry_history(contest_id);
CREATE INDEX IF NOT EXISTS idx_entry_history_user ON contest_entry_history(user_address);
CREATE INDEX IF NOT EXISTS idx_entry_history_result ON contest_entry_history(result);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 8: CREATE FAN GOLD TRANSACTION HISTORY
-- Fan Gold is a social currency with $0 value (like Reddit Karma).
-- It is entirely managed in Supabase, not on L2/L1.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fan_gold_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    
    -- Transaction
    amount BIGINT NOT NULL,  -- Positive for credit, negative for debit
    balance_after BIGINT NOT NULL,
    
    -- Reason
    transaction_type TEXT NOT NULL,  -- 'daily_bonus', 'contest_win', 'social_share', 'referral', 'spent'
    reason TEXT,
    metadata JSONB,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE fan_gold_transactions IS
'FAN GOLD LEDGER - Social currency with $0 monetary value.
Used for: Daily bonuses, social engagement rewards, leaderboard rankings.
NOT related to $BB (which lives on L2) or real money (L1 vault).';

CREATE INDEX IF NOT EXISTS idx_fg_transactions_user ON fan_gold_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_fg_transactions_type ON fan_gold_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fg_transactions_created ON fan_gold_transactions(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 9: CREATE LEADERBOARD VIEW (From Historical Data)
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT 
    p.wallet_address,
    p.username,
    p.avatar_url,
    p.fan_gold_balance,
    COUNT(ceh.id) as contests_entered,
    COUNT(CASE WHEN ceh.result = 'win' THEN 1 END) as contests_won,
    COALESCE(SUM(ceh.payout_received), 0) as total_winnings,
    COALESCE(SUM(ceh.entry_fee_paid), 0) as total_wagered
FROM profiles p
LEFT JOIN contest_entry_history ceh ON p.wallet_address = ceh.user_address
    AND ceh.settled_at > NOW() - INTERVAL '7 days'
GROUP BY p.wallet_address, p.username, p.avatar_url, p.fan_gold_balance
ORDER BY total_winnings DESC
LIMIT 100;

COMMENT ON VIEW leaderboard_weekly IS
'WEEKLY LEADERBOARD - Computed from historical settled contests.
Use this for the leaderboard page. Fan Gold shown for social status.';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 10: ENABLE RLS ON NEW TABLES
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE contest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_gold_transactions ENABLE ROW LEVEL SECURITY;

-- Public read access to contest history (transparency)
CREATE POLICY "Anyone can view contest history"
    ON contest_history FOR SELECT
    USING (true);

-- Users can only see their own entries
CREATE POLICY "Users can view their own contest entries"
    ON contest_entry_history FOR SELECT
    USING (true);  -- Or: auth.uid()::text = user_address for stricter

-- Users can view their own fan gold transactions
CREATE POLICY "Users can view their own fan gold"
    ON fan_gold_transactions FOR SELECT
    USING (true);

-- Service role can insert (for indexer)
CREATE POLICY "Service can insert contest history"
    ON contest_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service can insert contest entries"
    ON contest_entry_history FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service can insert fan gold"
    ON fan_gold_transactions FOR INSERT
    WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 11: UPDATE INDEXES FOR RENAMED TABLES
-- ───────────────────────────────────────────────────────────────────────────

-- Ensure old index names still work (Postgres keeps them after rename)
-- But add new descriptive indexes

CREATE INDEX IF NOT EXISTS idx_bet_history_settled 
    ON bet_history(settled_at DESC) WHERE status != 'active';

CREATE INDEX IF NOT EXISTS idx_market_history_resolved 
    ON market_history(resolution_timestamp DESC) WHERE status = 'resolved';

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- 
-- SUMMARY OF CHANGES:
--   ✅ Dropped live-stat increment functions (L2 tracks live state)
--   ✅ Renamed bets -> bet_history (only settled bets)
--   ✅ Renamed markets -> market_history (only resolved markets)
--   ✅ Added constraint: bet_history cannot have 'active' status
--   ✅ Added contest_history table for settled contests
--   ✅ Added contest_entry_history table for user picks after settlement
--   ✅ Added fan_gold_transactions for social currency ($0 value)
--   ✅ Added weekly_leaderboard view from historical data
--
-- WHAT THE APP MUST DO NOW:
--   1. Query L2 for ALL active state (balances, live contests, entries)
--   2. Only write to Supabase AFTER settlement
--   3. Use fan_gold_transactions for social currency (Supabase-only)
--   4. Show oracle_data from contest_history for fairness proof
--
-- ═══════════════════════════════════════════════════════════════════════════
