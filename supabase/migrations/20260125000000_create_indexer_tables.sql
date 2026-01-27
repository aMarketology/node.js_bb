-- ═══════════════════════════════════════════════════════════════
-- L2 EVENT INDEXER TABLES
-- Purpose: Store synchronized L2 blockchain events for fast queries
-- Created: 2026-01-25
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Purpose: User profiles linked to wallet addresses
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    email TEXT,
    avatar_url TEXT,
    total_bets INTEGER DEFAULT 0,
    total_volume DECIMAL DEFAULT 0,
    total_winnings DECIMAL DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ───────────────────────────────────────────────────────────────
-- TABLE: markets
-- Purpose: Store L2 market metadata for fast queries
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id TEXT UNIQUE NOT NULL, -- L2 contract market ID
    l2_contract_address TEXT NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Market state
    status TEXT DEFAULT 'active', -- active, resolved, cancelled
    resolution_source TEXT,
    resolution_timestamp TIMESTAMPTZ,
    resolved_outcome TEXT,
    
    -- Financial metrics
    total_liquidity DECIMAL DEFAULT 0,
    total_volume DECIMAL DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    
    -- Metadata
    creator_address TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closes_at TIMESTAMPTZ,
    
    -- L2 sync tracking
    last_synced_at TIMESTAMPTZ,
    last_synced_block BIGINT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_markets_market_id ON markets(market_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_markets_created ON markets(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- TABLE: market_outcomes
-- Purpose: Store possible outcomes for each market
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id TEXT NOT NULL, -- "yes", "no", or specific outcome
    outcome_name TEXT NOT NULL,
    
    -- Odds and liquidity
    current_odds DECIMAL,
    total_liquidity DECIMAL DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    total_volume DECIMAL DEFAULT 0,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(market_id, outcome_id)
);

CREATE INDEX IF NOT EXISTS idx_outcomes_market ON market_outcomes(market_id);

-- ───────────────────────────────────────────────────────────────
-- TABLE: bets
-- Purpose: Store individual bet history
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Bet identification
    bet_id TEXT UNIQUE NOT NULL, -- L2 transaction/bet ID
    user_address TEXT NOT NULL,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES market_outcomes(id) ON DELETE CASCADE,
    
    -- Bet details
    amount DECIMAL NOT NULL,
    potential_payout DECIMAL,
    odds_at_bet DECIMAL,
    
    -- Status
    status TEXT DEFAULT 'active', -- active, won, lost, refunded
    payout_amount DECIMAL,
    
    -- L2 blockchain tracking
    l2_transaction_hash TEXT,
    l2_block_number BIGINT,
    l2_timestamp TIMESTAMPTZ,
    
    -- Local timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_bets_bet_id ON bets(bet_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_address);
CREATE INDEX IF NOT EXISTS idx_bets_market ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_outcome ON bets(outcome_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_created ON bets(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- TABLE: l2_events
-- Purpose: Raw event log for debugging and replay
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS l2_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type TEXT NOT NULL, -- BetPlaced, MarketCreated, MarketResolved, etc.
    l2_transaction_hash TEXT,
    l2_block_number BIGINT,
    l2_timestamp TIMESTAMPTZ,
    
    -- Event data (raw JSON)
    event_data JSONB NOT NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_l2_events_type ON l2_events(event_type);
CREATE INDEX IF NOT EXISTS idx_l2_events_processed ON l2_events(processed);
CREATE INDEX IF NOT EXISTS idx_l2_events_block ON l2_events(l2_block_number);
CREATE INDEX IF NOT EXISTS idx_l2_events_created ON l2_events(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- TABLE: indexer_state
-- Purpose: Track indexer sync progress
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_synced_block BIGINT DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    total_events_processed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running', -- running, paused, error
    error_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with single row
INSERT INTO indexer_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ───────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE l2_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexer_state ENABLE ROW LEVEL SECURITY;

-- Public read access (all tables are read-only for users)
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public read outcomes" ON market_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read bets" ON bets FOR SELECT USING (true);
CREATE POLICY "Public read events" ON l2_events FOR SELECT USING (true);
CREATE POLICY "Public read indexer state" ON indexer_state FOR SELECT USING (true);

-- Only service role can write (indexer will use service role key)
-- No user-facing INSERT/UPDATE/DELETE policies

-- ───────────────────────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ───────────────────────────────────────────────────────────────

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER markets_updated_at BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER market_outcomes_updated_at BEFORE UPDATE ON market_outcomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER indexer_state_updated_at BEFORE UPDATE ON indexer_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ───────────────────────────────────────────────────────────────
-- REALTIME PUBLICATION
-- Enable real-time subscriptions for frontend
-- ───────────────────────────────────────────────────────────────

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for real-time updates
CREATE PUBLICATION supabase_realtime FOR TABLE 
    profiles,
    markets,
    market_outcomes,
    bets;

-- ═══════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════
