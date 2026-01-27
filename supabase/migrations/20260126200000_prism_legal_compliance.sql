-- =====================================================
-- PRISM CONTEST SYSTEM - LEGALLY COMPLIANT SKILL GAMES
-- Complete migration with contest tables + 6 test contests
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: prism (Contest Definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS prism (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  game_type TEXT NOT NULL CHECK (game_type IN ('duel', 'roster', 'bingo')),
  category TEXT NOT NULL CHECK (category IN ('sports', 'youtube', 'gaming', 'crypto', 'entertainment')),
  entry_fee INTEGER NOT NULL DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  payout_structure JSONB DEFAULT '[{"place": 1, "percentage": 100}]'::jsonb,
  max_entries INTEGER NOT NULL DEFAULT 100,
  current_entries INTEGER NOT NULL DEFAULT 0,
  
  -- ========================================
  -- LEGAL COMPLIANCE: Lock/Freeze Fields
  -- "The Freeze" - When betting must stop
  -- ========================================
  locks_at TIMESTAMPTZ NOT NULL,                                  -- Human-readable lock time (UI display)
  lock_timestamp BIGINT,                                          -- Unix epoch (AUTHORITATIVE for past-posting prevention)
  lock_type TEXT DEFAULT 'scheduled' CHECK (lock_type IN ('scheduled', 'event_start', 'upload_window')),
  buffer_minutes INTEGER DEFAULT 5,                               -- Pre-event buffer (TV delay protection)
  
  -- ========================================
  -- LEGAL COMPLIANCE: Settle/Grade Fields
  -- "The Grade" - When results are finalized
  -- ========================================
  settles_at TIMESTAMPTZ,                                         -- Human-readable settle time (UI display)
  settle_timestamp BIGINT,                                        -- Unix epoch for settlement
  cooldown_minutes INTEGER DEFAULT 30,                            -- Cool-down period (data stabilization: 15-60 min)
  
  -- ========================================
  -- LEGAL COMPLIANCE: Oracle/Verification
  -- Proof of data source for dispute resolution
  -- ========================================
  oracle_source TEXT,                                             -- "YouTube Data API v3", "FIFA Official Stats API"
  oracle_snapshot JSONB,                                          -- Raw API response (immutable proof)
  oracle_fetched_at TIMESTAMPTZ,                                  -- Timestamp when snapshot was captured
  oracle_signature TEXT,                                          -- Dealer cryptographic signature
  
  -- ========================================
  -- LEGAL COMPLIANCE: Scoring & Tiebreaker
  -- "The Contract" - Rules must be known before entry
  -- ========================================
  scoring_rules JSONB DEFAULT '{}'::jsonb,                        -- Point system (e.g., {"goal": 10, "assist": 5})
  tiebreaker_rules JSONB DEFAULT '{"method": "split_equal"}'::jsonb, -- Tie resolution
  -- Options: {"method": "split_equal"} or {"method": "secondary_metric", "metric": "shots_on_target"}
  
  -- Standard fields
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'locked', 'settling', 'settled', 'cancelled')),
  game_data JSONB DEFAULT '{}'::jsonb,                            -- Game-specific data (players, entities, bingo squares)
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLE 2: prism_entries (User Contest Entries)
-- =====================================================
CREATE TABLE IF NOT EXISTS prism_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES prism(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  picks JSONB NOT NULL DEFAULT '{}',                              -- User's selections (duel choice, roster, bingo card)
  entry_fee INTEGER NOT NULL DEFAULT 0,
  
  -- ========================================
  -- LEGAL COMPLIANCE: Entry Verification
  -- Proof of entry timing (anti-fraud)
  -- ========================================
  entry_timestamp BIGINT,                                         -- Unix epoch when entry was made (proof)
  entry_signature TEXT,                                           -- User's cryptographic signature (consent proof)
  locked BOOLEAN DEFAULT false,                                   -- Immutably locked after contest lock_timestamp
  
  -- Scoring results (populated after settlement)
  score INTEGER DEFAULT 0,
  payout INTEGER DEFAULT 0,
  rank INTEGER,                                                   -- Final position after tiebreakers
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PROFILES TABLE ENHANCEMENTS
-- =====================================================
-- Add Fan Gold and username if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fan_gold_balance INTEGER NOT NULL DEFAULT 1000,  -- Free starting balance (1000 FC)
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_prism_status ON prism(status);
CREATE INDEX IF NOT EXISTS idx_prism_locks_at ON prism(locks_at);
CREATE INDEX IF NOT EXISTS idx_prism_category ON prism(category);
CREATE INDEX IF NOT EXISTS idx_prism_featured ON prism(featured WHERE featured = true);
CREATE INDEX IF NOT EXISTS idx_prism_entries_contest ON prism_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_prism_entries_user ON prism_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_entries_rank ON prism_entries(rank) WHERE rank IS NOT NULL;

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_prism_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prism_timestamp
BEFORE UPDATE ON prism
FOR EACH ROW
EXECUTE FUNCTION update_prism_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE prism ENABLE ROW LEVEL SECURITY;
ALTER TABLE prism_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can view contests
CREATE POLICY "Anyone can view contests"
ON prism FOR SELECT
USING (true);

-- Users can view all entries (for leaderboards)
CREATE POLICY "Anyone can view entries"
ON prism_entries FOR SELECT
USING (true);

-- Users can only insert their own entries
CREATE POLICY "Users can insert their own entries"
ON prism_entries FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'alice_%' OR user_id LIKE 'bob_%');

-- =====================================================
-- CLEAR EXISTING TEST DATA (IF ANY)
-- =====================================================
TRUNCATE TABLE prism CASCADE;

-- =====================================================
-- SEED DATA: 6 TEST CONTESTS
-- =====================================================

-- CONTEST 1: World Cup Semifinals - Dream Team (Roster, Sports)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, 
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'World Cup Semifinals - Dream Team',
  'Build your ultimate 5-player squad from both semifinal matches. Score points based on goals, assists, saves, and clean sheets.',
  'Select 5 players within the $50,000 salary cap. Points: Goal = 10pts, Assist = 5pts, Clean Sheet = 3pts, Save = 1pt. Must have players from at least 2 different teams.',
  'roster',
  'sports',
  20,     -- 20 FC entry fee
  1000,   -- 1000 FC prize pool
  50,     -- Max 50 entries
  '2026-02-15 18:55:00+00',           -- Locks 5 min before kickoff
  1739646900,                          -- Unix timestamp
  'event_start',
  5,      -- 5-minute buffer for TV delay
  '2026-02-15 21:00:00+00',           -- Settles 30 min after match ends
  1739655600,
  30,     -- 30-minute cooldown for data stabilization
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'FIFA Official Match Stats API',
  '{"goal": 10, "assist": 5, "clean_sheet": 3, "save": 1}'::jsonb,
  '{"method": "secondary_metric", "metric": "assists", "description": "Ties broken by most assists"}'::jsonb,
  ARRAY['sports', 'soccer', 'world-cup', 'roster'],
  true,   -- Featured contest
  'upcoming',
  '{
    "salary_cap": 50000,
    "min_players": 5,
    "max_players": 5,
    "positions": ["FWD", "FWD", "MID", "DEF", "GK"],
    "players": [
      {"id": "mbap", "name": "Kylian Mbappé", "team": "France", "position": "FWD", "salary": 12000},
      {"id": "vini", "name": "Vinícius Júnior", "team": "Brazil", "position": "FWD", "salary": 11000},
      {"id": "messi", "name": "Lionel Messi", "team": "Argentina", "position": "FWD", "salary": 15000},
      {"id": "mbappe", "name": "Bukayo Saka", "team": "England", "position": "MID", "salary": 9000},
      {"id": "bellingham", "name": "Jude Bellingham", "team": "England", "position": "MID", "salary": 10000},
      {"id": "rudiger", "name": "Antonio Rüdiger", "team": "Germany", "position": "DEF", "salary": 7000},
      {"id": "van_dijk", "name": "Virgil van Dijk", "team": "Netherlands", "position": "DEF", "salary": 8000},
      {"id": "alisson", "name": "Alisson Becker", "team": "Brazil", "position": "GK", "salary": 6000},
      {"id": "maignan", "name": "Mike Maignan", "team": "France", "position": "GK", "salary": 5000}
    ]
  }'::jsonb
);

-- CONTEST 2: Beast Games Week 3 - Creator League (Roster, YouTube)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Beast Games Week 3 - Creator League',
  'Draft 3 creators from the upload window. Points based on views, likes, and engagement within 24 hours of upload.',
  'Pick 3 creators from the eligible list. Points: 1 View = 0.001pt, 1 Like = 0.01pt, 1 Comment = 0.05pt. Videos must upload between Saturday 12AM-Sunday 12AM EST.',
  'roster',
  'youtube',
  20,
  800,
  40,
  '2026-02-08 04:59:00+00',           -- Locks before upload window opens
  1739000340,
  'upload_window',
  0,      -- No buffer needed (locks before window)
  '2026-02-10 05:00:00+00',           -- Settles 24 hours after window closes
  1739173200,
  60,     -- 60-minute cooldown (YouTube views take time to stabilize)
  '[{"place": 1, "percentage": 60}, {"place": 2, "percentage": 25}, {"place": 3, "percentage": 15}]'::jsonb,
  'YouTube Data API v3',
  '{"view": 0.001, "like": 0.01, "comment": 0.05}'::jsonb,
  '{"method": "secondary_metric", "metric": "likes", "description": "Ties broken by total likes"}'::jsonb,
  ARRAY['youtube', 'creators', 'beast-games', 'roster'],
  true,
  'upcoming',
  '{
    "max_picks": 3,
    "upload_window_start": "2026-02-08T05:00:00Z",
    "upload_window_end": "2026-02-09T05:00:00Z",
    "creators": [
      {"id": "mrbeast", "name": "MrBeast", "channel": "@MrBeast", "category": "Challenges"},
      {"id": "ishowspeed", "name": "IShowSpeed", "channel": "@IShowSpeed", "category": "Gaming"},
      {"id": "kai_cenat", "name": "Kai Cenat", "channel": "@KaiCenat", "category": "Entertainment"},
      {"id": "faze_rug", "name": "FaZe Rug", "channel": "@FaZeRug", "category": "Vlogs"},
      {"id": "dream", "name": "Dream", "channel": "@Dream", "category": "Minecraft"}
    ]
  }'::jsonb
);

-- CONTEST 3: Striker Clash: Mbappé vs Vinícius Jr (Duel, Sports)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Striker Clash: Mbappé vs Vinícius Jr',
  'Who will have more goals + assists in their next match? Pick your side!',
  'Choose Mbappé or Vinícius. Winner is determined by total goals + assists in their respective matches.',
  'duel',
  'sports',
  10,
  500,
  50,
  '2026-02-14 19:55:00+00',           -- 5 min before kickoff
  1739564100,
  'event_start',
  5,
  '2026-02-14 22:00:00+00',           -- 15 min after match ends
  1739574000,
  15,
  '[{"place": 1, "percentage": 100}]'::jsonb,
  'FIFA Official Match Stats API',
  '{"winner_takes_all": true}'::jsonb,
  '{"method": "split_equal", "description": "Prize pool split equally if tied"}'::jsonb,
  ARRAY['sports', 'soccer', 'duel', 'strikers'],
  false,
  'upcoming',
  '{
    "entities": [
      {"name": "Kylian Mbappé", "team": "Real Madrid", "position": "Forward"},
      {"name": "Vinícius Júnior", "team": "Real Madrid", "position": "Forward"}
    ],
    "metric": "goals_plus_assists"
  }'::jsonb
);

-- CONTEST 4: Virality Clash: MrBeast vs IShowSpeed (Duel, YouTube)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Virality Clash: MrBeast vs IShowSpeed',
  'Next upload battle: Who gets more views in the first 24 hours?',
  'Pick MrBeast or IShowSpeed. Winner has the most views 24 hours after their next upload.',
  'duel',
  'youtube',
  10,
  600,
  60,
  '2026-02-07 04:59:00+00',           -- Locks before upload window
  1738913940,
  'upload_window',
  0,
  '2026-02-09 05:00:00+00',           -- 24 hours after window closes
  1739086800,
  60,
  '[{"place": 1, "percentage": 100}]'::jsonb,
  'YouTube Data API v3',
  '{"winner_takes_all": true}'::jsonb,
  '{"method": "split_equal", "description": "Prize pool split equally if tied"}'::jsonb,
  ARRAY['youtube', 'creators', 'duel', 'views'],
  true,
  'upcoming',
  '{
    "entities": [
      {"name": "MrBeast", "channel": "@MrBeast", "team": "@MrBeast"},
      {"name": "IShowSpeed", "channel": "@IShowSpeed", "team": "@IShowSpeed"}
    ],
    "metric": "views_24h",
    "upload_window_start": "2026-02-07T05:00:00Z",
    "upload_window_end": "2026-02-08T05:00:00Z"
  }'::jsonb
);

-- CONTEST 5: USA vs England - Match Bingo (Bingo, Sports)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'USA vs England - Match Bingo',
  'Complete a line or full card! First goal, yellow cards, corner kicks, and more.',
  'Mark off squares as events happen. First to complete any line (horizontal, vertical, diagonal) or full card wins!',
  'bingo',
  'sports',
  5,
  250,
  50,
  '2026-02-13 19:55:00+00',
  1739478900,
  'event_start',
  5,
  '2026-02-13 22:00:00+00',
  1739488800,
  15,
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'FIFA Official Match Stats API',
  '{"line": 10, "full_card": 25, "tiebreaker": "first_to_complete"}'::jsonb,
  '{"method": "secondary_metric", "metric": "timestamp", "description": "Ties broken by who completed first"}'::jsonb,
  ARRAY['sports', 'soccer', 'bingo', 'usa-england'],
  false,
  'upcoming',
  '{
    "board_size": 9,
    "squares": [
      {"id": "first_goal", "label": "First Goal (Either Team)", "completed": false},
      {"id": "yellow_card", "label": "Yellow Card", "completed": false},
      {"id": "corner_kick", "label": "5+ Corner Kicks", "completed": false},
      {"id": "penalty", "label": "Penalty Awarded", "completed": false},
      {"id": "own_goal", "label": "Own Goal", "completed": false},
      {"id": "red_card", "label": "Red Card", "completed": false},
      {"id": "offside", "label": "10+ Offsides", "completed": false},
      {"id": "hat_trick", "label": "Hat Trick", "completed": false},
      {"id": "clean_sheet", "label": "Clean Sheet", "completed": false}
    ]
  }'::jsonb
);

-- CONTEST 6: MrBeast Next Video - Content Bingo (Bingo, YouTube)
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'MrBeast Next Video - Content Bingo',
  'Predict what happens in MrBeast''s next upload! Money giveaway, celebrity cameo, or challenge?',
  'Mark off predicted content elements. Complete any line to win! Videos uploaded Sat-Sun count.',
  'bingo',
  'youtube',
  5,
  300,
  60,
  '2026-02-07 04:59:00+00',
  1738913940,
  'upload_window',
  0,
  '2026-02-09 05:00:00+00',
  1739086800,
  60,
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'YouTube Data API v3 + Manual Review',
  '{"line": 10, "full_card": 25, "requires_manual_review": true}'::jsonb,
  '{"method": "split_equal", "description": "Prize split among all line completers"}'::jsonb,
  ARRAY['youtube', 'mrbeast', 'bingo', 'content'],
  true,
  'upcoming',
  '{
    "board_size": 9,
    "upload_window_start": "2026-02-07T05:00:00Z",
    "upload_window_end": "2026-02-08T05:00:00Z",
    "squares": [
      {"id": "money_giveaway", "label": "$100K+ Giveaway", "completed": false},
      {"id": "celebrity", "label": "Celebrity Cameo", "completed": false},
      {"id": "challenge", "label": "Physical Challenge", "completed": false},
      {"id": "charitable", "label": "Charity/Donation", "completed": false},
      {"id": "reaction", "label": "Emotional Reaction", "completed": false},
      {"id": "branded", "label": "Brand Sponsorship", "completed": false},
      {"id": "crew_appears", "label": "Crew Member Featured", "completed": false},
      {"id": "expensive_item", "label": "Expensive Item ($10K+)", "completed": false},
      {"id": "viral_moment", "label": "Viral-Worthy Moment", "completed": false}
    ]
  }'::jsonb
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check created contests
SELECT 
  title, 
  game_type, 
  entry_fee, 
  prize_pool,
  status,
  locks_at,
  cooldown_minutes,
  oracle_source
FROM prism 
ORDER BY locks_at;

-- Verify profiles have fan_gold_balance
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'fan_gold_balance';

COMMENT ON TABLE prism IS 'PRISM contests - legally compliant skill games with full compliance fields';
COMMENT ON TABLE prism_entries IS 'User entries with cryptographic proof and immutability after lock';
