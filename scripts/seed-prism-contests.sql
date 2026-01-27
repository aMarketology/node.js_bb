-- =====================================================
-- PRISM TABLE - 6 CONTESTS SEED DATA
-- Copy and paste this into Supabase SQL Editor
-- =====================================================

-- Create the PRISM table with Legal Compliance fields
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
  -- ========================================
  locks_at TIMESTAMPTZ NOT NULL,                                  -- Human-readable lock time
  lock_timestamp BIGINT,                                          -- Unix epoch (e.g., 1738490000) - AUTHORITATIVE
  lock_type TEXT DEFAULT 'scheduled' CHECK (lock_type IN ('scheduled', 'event_start', 'upload_window')),
  buffer_minutes INTEGER DEFAULT 5,                               -- Pre-event buffer (default 5 min)
  
  -- ========================================
  -- LEGAL COMPLIANCE: Settle/Grade Fields
  -- ========================================
  settles_at TIMESTAMPTZ,                                         -- Human-readable settle time
  settle_timestamp BIGINT,                                        -- Unix epoch for settlement
  cooldown_minutes INTEGER DEFAULT 30,                            -- Wait period before grading (15-60 min)
  
  -- ========================================
  -- LEGAL COMPLIANCE: Oracle/Verification
  -- ========================================
  oracle_source TEXT,                                             -- "YouTube Data API", "FIFA Official Stats"
  oracle_snapshot JSONB,                                          -- Raw API response (immutable proof)
  oracle_fetched_at TIMESTAMPTZ,                                  -- When snapshot was captured
  oracle_signature TEXT,                                          -- Dealer signature on snapshot
  
  -- ========================================
  -- LEGAL COMPLIANCE: Scoring & Tiebreaker
  -- ========================================
  scoring_rules JSONB DEFAULT '{}'::jsonb,                        -- e.g., {"goal": 10, "assist": 5}
  tiebreaker_rules JSONB DEFAULT '{"method": "split_equal"}'::jsonb, -- Tiebreaker method
  -- Options: {"method": "split_equal"} or {"method": "secondary_metric", "metric": "shots_on_target"}
  
  -- Standard fields
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'locked', 'settling', 'settled', 'cancelled')),
  game_data JSONB DEFAULT '{}'::jsonb,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prism_entries table with Legal Compliance fields
CREATE TABLE IF NOT EXISTS prism_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES prism(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  picks JSONB NOT NULL DEFAULT '{}',
  entry_fee INTEGER NOT NULL DEFAULT 0,
  
  -- ========================================
  -- LEGAL COMPLIANCE: Entry Verification
  -- ========================================
  entry_timestamp BIGINT,                                         -- Unix epoch of entry (proof)
  entry_signature TEXT,                                           -- User's signature (proof of consent)
  locked BOOLEAN DEFAULT false,                                   -- Locked after contest lock_timestamp
  
  -- Scoring results
  score INTEGER DEFAULT 0,
  payout INTEGER DEFAULT 0,
  rank INTEGER,                                                   -- Final position after settlement
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clear existing contests (fresh start)
TRUNCATE TABLE prism CASCADE;

-- =====================================================
-- CONTEST 1: World Cup Semifinals - Dream Team (Roster, Sports)
-- Entry: 20 $BB | Pool: 1000 $BB
-- =====================================================
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
  20,
  1000,
  50,
  NOW() + INTERVAL '2 days',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 days'))::BIGINT,  -- lock_timestamp (Unix)
  'event_start',
  5,  -- 5 min buffer before event
  NOW() + INTERVAL '3 days',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '3 days'))::BIGINT,  -- settle_timestamp (Unix)
  30,  -- 30 min cooldown
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 25}, {"place": 3, "percentage": 15}, {"place": 4, "percentage": 10}]'::jsonb,
  'FIFA Official Stats API',
  '{"goal": 10, "assist": 5, "clean_sheet": 3, "save": 1}'::jsonb,
  '{"method": "secondary_metric", "metric": "total_goals"}'::jsonb,
  ARRAY['prism', 'sports', 'world-cup', 'roster', 'featured'],
  true,
  'upcoming',
  '{
    "salary_cap": 50000,
    "roster_slots": 5,
    "min_teams": 2,
    "scoring": {"goal": 10, "assist": 5, "clean_sheet": 3, "save": 1},
    "players": [
      {"id": "mbappe", "name": "Kylian Mbappé", "team": "France", "position": "FWD", "salary": 12000, "avg_score": 18.5, "stats": {"goals": 4, "assists": 2}},
      {"id": "vinicius", "name": "Vinícius Jr", "team": "Brazil", "position": "FWD", "salary": 11000, "avg_score": 16.2, "stats": {"goals": 3, "assists": 3}},
      {"id": "bellingham", "name": "Jude Bellingham", "team": "England", "position": "MID", "salary": 10500, "avg_score": 15.8, "stats": {"goals": 3, "assists": 2}},
      {"id": "rodri", "name": "Rodri", "team": "Spain", "position": "MID", "salary": 9500, "avg_score": 12.4, "stats": {"tackles": 12, "passes": 156}},
      {"id": "saliba", "name": "William Saliba", "team": "France", "position": "DEF", "salary": 8500, "avg_score": 10.2, "stats": {"clean_sheets": 3, "blocks": 8}},
      {"id": "gvardiol", "name": "Joško Gvardiol", "team": "Croatia", "position": "DEF", "salary": 8000, "avg_score": 9.8, "stats": {"clean_sheets": 2, "tackles": 10}},
      {"id": "donnarumma", "name": "Gianluigi Donnarumma", "team": "Italy", "position": "GK", "salary": 7500, "avg_score": 11.5, "stats": {"saves": 18, "clean_sheets": 2}},
      {"id": "saka", "name": "Bukayo Saka", "team": "England", "position": "FWD", "salary": 10000, "avg_score": 14.6, "stats": {"goals": 2, "assists": 4}},
      {"id": "pedri", "name": "Pedri", "team": "Spain", "position": "MID", "salary": 9000, "avg_score": 11.8, "stats": {"assists": 3, "key_passes": 12}},
      {"id": "martinez", "name": "Emiliano Martínez", "team": "Argentina", "position": "GK", "salary": 7000, "avg_score": 10.8, "stats": {"saves": 15, "penalty_saves": 2}}
    ]
  }'::jsonb
);

-- =====================================================
-- CONTEST 2: Beast Games Week 3 - Creator League (Roster, YouTube)
-- Entry: 20 $BB | Pool: 800 $BB
-- =====================================================
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Beast Games Week 3 - Creator League',
  'Draft your team of 4 contestants for this week''s Beast Games challenges. Points based on challenge wins, survival, and viral moments.',
  'Select 4 contestants within the $40,000 budget. Points: Challenge Win = 15pts, Survival = 5pts, Viral Moment = 10pts, Elimination = -20pts.',
  'roster',
  'youtube',
  20,
  800,
  40,
  NOW() + INTERVAL '1 day',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 day'))::BIGINT,
  'upload_window',
  0,  -- No buffer for upload window
  NOW() + INTERVAL '2 days',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 days'))::BIGINT,
  60,  -- 60 min cooldown for YouTube (data stabilization)
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'Beast Games Official + Social Blade',
  '{"challenge_win": 15, "survival": 5, "viral_moment": 10, "elimination": -20}'::jsonb,
  '{"method": "split_equal"}'::jsonb,
  ARRAY['prism', 'youtube', 'beast-games', 'roster', 'trending'],
  true,
  'upcoming',
  '{
    "salary_cap": 40000,
    "roster_slots": 4,
    "scoring": {"challenge_win": 15, "survival": 5, "viral_moment": 10, "elimination": -20},
    "contestants": [
      {"id": "contestant1", "name": "Alex TheGamer", "salary": 12000, "avg_score": 22.5, "category": "Gaming", "stats": {"survival_rate": "85%", "challenge_wins": 3}},
      {"id": "contestant2", "name": "Sarah Fitness", "salary": 11000, "avg_score": 19.8, "category": "Fitness", "stats": {"survival_rate": "90%", "challenge_wins": 2}},
      {"id": "contestant3", "name": "Mike Comedy", "salary": 10000, "avg_score": 18.2, "category": "Comedy", "stats": {"survival_rate": "75%", "challenge_wins": 2}},
      {"id": "contestant4", "name": "Emma Vlogs", "salary": 9500, "avg_score": 16.5, "category": "Lifestyle", "stats": {"survival_rate": "80%", "challenge_wins": 1}},
      {"id": "contestant5", "name": "Jake Adventure", "salary": 9000, "avg_score": 15.8, "category": "Adventure", "stats": {"survival_rate": "70%", "challenge_wins": 2}},
      {"id": "contestant6", "name": "Lisa Tech", "salary": 8500, "avg_score": 14.2, "category": "Tech", "stats": {"survival_rate": "65%", "challenge_wins": 1}},
      {"id": "contestant7", "name": "Tom Music", "salary": 8000, "avg_score": 13.5, "category": "Music", "stats": {"survival_rate": "60%", "challenge_wins": 1}},
      {"id": "contestant8", "name": "Nina Art", "salary": 7500, "avg_score": 12.0, "category": "Art", "stats": {"survival_rate": "55%", "challenge_wins": 0}}
    ]
  }'::jsonb
);

-- =====================================================
-- CONTEST 3: Striker Clash - Mbappé vs Vinícius Jr (Duel, Sports, LIVE)
-- Entry: 10 $BB | Pool: 500 $BB
-- =====================================================
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Striker Clash: Mbappé vs Vinícius Jr',
  'Who will dominate the World Cup semifinal? Pick the player with more combined goals + assists in their match.',
  'Winner is determined by total goals + assists. If tied, the player with more shots on target wins. All stats from official FIFA match data.',
  'duel',
  'sports',
  10,
  500,
  100,
  NOW() + INTERVAL '4 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '4 hours'))::BIGINT,
  'event_start',
  5,  -- 5 min buffer before kickoff
  NOW() + INTERVAL '6 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '6 hours'))::BIGINT,
  15,  -- 15 min cooldown (live event, fast data)
  '[{"place": 1, "percentage": 100}]'::jsonb,
  'FIFA Official Stats',
  '{"goal": 1, "assist": 1}'::jsonb,
  '{"method": "secondary_metric", "metric": "shots_on_target"}'::jsonb,
  ARRAY['prism', 'sports', 'duel', 'live', 'world-cup'],
  true,
  'live',
  '{
    "metric": "goals_plus_assists",
    "tiebreaker": "shots_on_target",
    "entities": [
      {
        "name": "Kylian Mbappé",
        "team": "France",
        "avatar_url": "/avatars/mbappe.jpg",
        "stats": [
          {"label": "Goals This Tournament", "value": 4, "trend": "up"},
          {"label": "Assists", "value": 2, "trend": "neutral"},
          {"label": "Shots/Game", "value": 5.2, "trend": "up"},
          {"label": "Form Rating", "value": "9.1", "trend": "up"}
        ]
      },
      {
        "name": "Vinícius Jr",
        "team": "Brazil",
        "avatar_url": "/avatars/vinicius.jpg",
        "stats": [
          {"label": "Goals This Tournament", "value": 3, "trend": "up"},
          {"label": "Assists", "value": 3, "trend": "up"},
          {"label": "Shots/Game", "value": 4.8, "trend": "neutral"},
          {"label": "Form Rating", "value": "8.9", "trend": "up"}
        ]
      }
    ],
    "current_scores": {
      "Kylian Mbappé": 1,
      "Vinícius Jr": 0
    }
  }'::jsonb
);

-- =====================================================
-- CONTEST 4: Virality Clash - MrBeast vs IShowSpeed (Duel, YouTube, LIVE)
-- Entry: 10 $BB | Pool: 600 $BB
-- =====================================================
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'Virality Clash: MrBeast vs IShowSpeed',
  'Two YouTube titans go head-to-head! Predict who gets more views on their next video released within 24 hours.',
  'Winner determined by total views after 24 hours from video publish time. Only main channel uploads count. Shorts excluded.',
  'duel',
  'youtube',
  10,
  600,
  100,
  NOW() + INTERVAL '6 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '6 hours'))::BIGINT,
  'upload_window',
  0,  -- No buffer (locks when upload window closes)
  NOW() + INTERVAL '30 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 hours'))::BIGINT,
  60,  -- 60 min cooldown (YouTube view counts stabilize slowly)
  '[{"place": 1, "percentage": 100}]'::jsonb,
  'YouTube Data API + Social Blade',
  '{"views_24h": 1}'::jsonb,
  '{"method": "secondary_metric", "metric": "likes"}'::jsonb,
  ARRAY['prism', 'youtube', 'duel', 'live', 'trending'],
  true,
  'live',
  '{
    "metric": "video_views_24h",
    "tiebreaker": "likes",
    "entities": [
      {
        "name": "MrBeast",
        "team": "@MrBeast",
        "avatar_url": "/avatars/mrbeast.jpg",
        "stats": [
          {"label": "Subscribers", "value": "320M", "trend": "up"},
          {"label": "Avg Views (24h)", "value": "45M", "trend": "up"},
          {"label": "Last Video Views", "value": "52M", "trend": "up"},
          {"label": "Upload Streak", "value": "Weekly", "trend": "neutral"}
        ]
      },
      {
        "name": "IShowSpeed",
        "team": "@IShowSpeed",
        "avatar_url": "/avatars/ishowspeed.jpg",
        "stats": [
          {"label": "Subscribers", "value": "28M", "trend": "up"},
          {"label": "Avg Views (24h)", "value": "8M", "trend": "up"},
          {"label": "Last Video Views", "value": "12M", "trend": "up"},
          {"label": "Stream Hours/Week", "value": "40+", "trend": "neutral"}
        ]
      }
    ],
    "current_scores": {
      "MrBeast": 0,
      "IShowSpeed": 0
    }
  }'::jsonb
);

-- =====================================================
-- CONTEST 5: USA vs England - Match Bingo (Bingo, Sports)
-- Entry: 5 $BB | Pool: 250 $BB
-- =====================================================
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'USA vs England - Match Bingo',
  'Predict match events! Select 5 squares you think will happen. Complete a line for bonus points!',
  'Select exactly 5 predictions. Each correct = 10pts. Complete a line (row/col/diagonal) = 25pt bonus. Max 3 lines can score.',
  'bingo',
  'sports',
  5,
  250,
  50,
  NOW() + INTERVAL '1 day',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 day'))::BIGINT,
  'event_start',
  5,  -- 5 min buffer before kickoff
  NOW() + INTERVAL '2 days',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 days'))::BIGINT,
  15,  -- 15 min cooldown
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'FIFA Official Match Events',
  '{"correct_pick": 10, "line_bonus": 25}'::jsonb,
  '{"method": "split_equal"}'::jsonb,
  ARRAY['prism', 'sports', 'bingo', 'world-cup'],
  false,
  'upcoming',
  '{
    "max_selections": 5,
    "points_per_correct": 10,
    "line_bonus": 25,
    "max_lines": 3,
    "squares": [
      {"id": "sq1", "text": "Goal in first 15 min", "completed": false},
      {"id": "sq2", "text": "Penalty awarded", "completed": false},
      {"id": "sq3", "text": "Red card shown", "completed": false},
      {"id": "sq4", "text": "Hat-trick scored", "completed": false},
      {"id": "sq5", "text": "Own goal", "completed": false},
      {"id": "sq6", "text": "VAR review", "completed": false},
      {"id": "sq7", "text": "Goal from outside box", "completed": false},
      {"id": "sq8", "text": "Goalkeeper saves penalty", "completed": false},
      {"id": "sq9", "text": "5+ total goals", "completed": false}
    ],
    "winning_lines": [
      ["sq1", "sq2", "sq3"],
      ["sq4", "sq5", "sq6"],
      ["sq7", "sq8", "sq9"],
      ["sq1", "sq4", "sq7"],
      ["sq2", "sq5", "sq8"],
      ["sq3", "sq6", "sq9"],
      ["sq1", "sq5", "sq9"],
      ["sq3", "sq5", "sq7"]
    ]
  }'::jsonb
);

-- =====================================================
-- CONTEST 6: MrBeast Next Video - Content Bingo (Bingo, YouTube)
-- Entry: 5 $BB | Pool: 300 $BB
-- =====================================================
INSERT INTO prism (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries,
  locks_at, lock_timestamp, lock_type, buffer_minutes,
  settles_at, settle_timestamp, cooldown_minutes,
  payout_structure, oracle_source, scoring_rules, tiebreaker_rules,
  tags, featured, status, game_data
) VALUES (
  'MrBeast Next Video - Content Bingo',
  'Predict what happens in MrBeast''s next main channel upload! Pick 5 events you think will occur.',
  'Select 5 predictions about video content. Each correct = 10pts. Line bonus = 25pts. Based on video content within first 48 hours.',
  'bingo',
  'youtube',
  5,
  300,
  60,
  NOW() + INTERVAL '12 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '12 hours'))::BIGINT,
  'upload_window',
  0,  -- No buffer (locks when upload happens)
  NOW() + INTERVAL '60 hours',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '60 hours'))::BIGINT,
  60,  -- 60 min cooldown
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  'YouTube Data API + Manual Verification',
  '{"correct_pick": 10, "line_bonus": 25}'::jsonb,
  '{"method": "split_equal"}'::jsonb,
  ARRAY['prism', 'youtube', 'bingo', 'mrbeast'],
  false,
  'upcoming',
  '{
    "max_selections": 5,
    "points_per_correct": 10,
    "line_bonus": 25,
    "max_lines": 3,
    "squares": [
      {"id": "sq1", "text": "Gives away $100K+", "completed": false},
      {"id": "sq2", "text": "Celebrity cameo", "completed": false},
      {"id": "sq3", "text": "Chris appears", "completed": false},
      {"id": "sq4", "text": "Chandler loses", "completed": false},
      {"id": "sq5", "text": "50M+ views in 24h", "completed": false},
      {"id": "sq6", "text": "Video over 20 min", "completed": false},
      {"id": "sq7", "text": "Feastables plug", "completed": false},
      {"id": "sq8", "text": "Subscriber milestone mentioned", "completed": false},
      {"id": "sq9", "text": "Physical challenge", "completed": false}
    ],
    "winning_lines": [
      ["sq1", "sq2", "sq3"],
      ["sq4", "sq5", "sq6"],
      ["sq7", "sq8", "sq9"],
      ["sq1", "sq4", "sq7"],
      ["sq2", "sq5", "sq8"],
      ["sq3", "sq6", "sq9"],
      ["sq1", "sq5", "sq9"],
      ["sq3", "sq5", "sq7"]
    ]
  }'::jsonb
);

-- =====================================================
-- Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_prism_status ON prism(status);
CREATE INDEX IF NOT EXISTS idx_prism_game_type ON prism(game_type);
CREATE INDEX IF NOT EXISTS idx_prism_category ON prism(category);
CREATE INDEX IF NOT EXISTS idx_prism_locks_at ON prism(locks_at);
CREATE INDEX IF NOT EXISTS idx_prism_entries_contest ON prism_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_prism_entries_user ON prism_entries(user_id);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE prism ENABLE ROW LEVEL SECURITY;
ALTER TABLE prism_entries ENABLE ROW LEVEL SECURITY;

-- Public read access to contests
DROP POLICY IF EXISTS "Public can view prism contests" ON prism;
CREATE POLICY "Public can view prism contests" ON prism FOR SELECT USING (true);

-- Authenticated users can enter contests
DROP POLICY IF EXISTS "Users can view own prism entries" ON prism_entries;
CREATE POLICY "Users can view own prism entries" ON prism_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create prism entries" ON prism_entries;
CREATE POLICY "Users can create prism entries" ON prism_entries FOR INSERT WITH CHECK (true);

-- =====================================================
-- Verify: Show all 6 contests with compliance fields
-- =====================================================
SELECT 
  title,
  game_type,
  category,
  entry_fee || ' $BB' as entry,
  prize_pool || ' $BB' as pool,
  status,
  lock_type,
  buffer_minutes || ' min' as buffer,
  cooldown_minutes || ' min' as cooldown,
  tiebreaker_rules->>'method' as tiebreaker
FROM prism 
ORDER BY entry_fee DESC, title;
