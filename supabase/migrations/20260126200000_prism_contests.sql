-- =====================================================
-- PRISM CONTEST SYSTEM - Full Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS contest_entries CASCADE;
DROP TABLE IF EXISTS contests_metadata CASCADE;
DROP TABLE IF EXISTS game_history CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- =====================================================
-- CONTESTS METADATA TABLE
-- Static contest information (the "menu")
-- =====================================================
CREATE TABLE contests_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Info
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  
  -- Game Configuration
  game_type TEXT NOT NULL CHECK (game_type IN ('duel', 'roster', 'bingo')),
  category TEXT NOT NULL CHECK (category IN ('sports', 'youtube', 'gaming', 'crypto', 'entertainment')),
  
  -- Economics
  entry_fee INTEGER NOT NULL DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  payout_structure JSONB DEFAULT '[{"place": 1, "percentage": 100}]'::jsonb,
  
  -- Capacity
  max_entries INTEGER NOT NULL DEFAULT 100,
  current_entries INTEGER NOT NULL DEFAULT 0,
  
  -- Timing
  locks_at TIMESTAMPTZ NOT NULL,
  settles_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'settled', 'cancelled')),
  
  -- Data Sources
  oracle_source TEXT,
  
  -- Game-specific data
  game_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTEST ENTRIES TABLE
-- User picks and results
-- =====================================================
CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  contest_id UUID NOT NULL REFERENCES contests_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Entry Details
  picks JSONB NOT NULL DEFAULT '{}'::jsonb,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  
  -- Results (filled after settlement)
  score DECIMAL(10,2) DEFAULT 0,
  rank INTEGER,
  payout INTEGER DEFAULT 0,
  
  -- Metadata
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries
  UNIQUE(contest_id, user_id)
);

-- =====================================================
-- GAME HISTORY TABLE
-- Historical results for analytics
-- =====================================================
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contest_id UUID REFERENCES contests_metadata(id),
  
  game_type TEXT NOT NULL,
  entry_fee INTEGER DEFAULT 0,
  payout INTEGER DEFAULT 0,
  net_result INTEGER DEFAULT 0,
  
  picks JSONB,
  final_score DECIMAL(10,2),
  rank INTEGER,
  
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BADGES TABLE
-- User achievements
-- =====================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  contest_id UUID REFERENCES contests_metadata(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_contests_status ON contests_metadata(status);
CREATE INDEX idx_contests_category ON contests_metadata(category);
CREATE INDEX idx_contests_game_type ON contests_metadata(game_type);
CREATE INDEX idx_contests_locks_at ON contests_metadata(locks_at);
CREATE INDEX idx_contests_featured ON contests_metadata(featured) WHERE featured = true;

CREATE INDEX idx_entries_contest ON contest_entries(contest_id);
CREATE INDEX idx_entries_user ON contest_entries(user_id);
CREATE INDEX idx_entries_score ON contest_entries(score DESC);

CREATE INDEX idx_history_user ON game_history(user_id);
CREATE INDEX idx_badges_user ON badges(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE contests_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view contests
CREATE POLICY "Contests are viewable by everyone" 
  ON contests_metadata FOR SELECT 
  USING (true);

-- Users can view their own entries
CREATE POLICY "Users can view their own entries" 
  ON contest_entries FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can create entries" 
  ON contest_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own history
CREATE POLICY "Users can view their own history" 
  ON game_history FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can view their own badges
CREATE POLICY "Users can view their own badges" 
  ON badges FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: THE 6 PRISM LAUNCH CONTESTS
-- =====================================================

-- 1. World Cup Semifinals - Dream Team (ROSTER, SPORTS)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'World Cup Semifinals - Dream Team',
  'Draft 5 players (2 FWD, 2 MID, 1 DEF) for the semifinal matchday',
  'Select players within the $50,000 salary cap. Points based on goals, assists, clean sheets, and match ratings.',
  'roster', 'sports',
  20, 1000, 50, 48,
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '6 hours',
  'upcoming',
  'FIFA Fantasy API',
  true,
  ARRAY['sports', 'soccer', 'world-cup', 'filling-fast'],
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  '{
    "salary_cap": 50000,
    "roster_slots": 5,
    "slot_requirements": {"FWD": 2, "MID": 2, "DEF": 1},
    "players": [
      {"id": "p1", "name": "Kylian Mbappé", "position": "FWD", "team": "France", "salary": 12000, "avg_score": 9.2},
      {"id": "p2", "name": "Vinícius Jr", "position": "FWD", "team": "Brazil", "salary": 11500, "avg_score": 8.8},
      {"id": "p3", "name": "Jude Bellingham", "position": "MID", "team": "England", "salary": 10500, "avg_score": 8.5},
      {"id": "p4", "name": "Kevin De Bruyne", "position": "MID", "team": "Belgium", "salary": 10000, "avg_score": 8.3},
      {"id": "p5", "name": "Pedri", "position": "MID", "team": "Spain", "salary": 9000, "avg_score": 7.9},
      {"id": "p6", "name": "Bukayo Saka", "position": "FWD", "team": "England", "salary": 9500, "avg_score": 8.1},
      {"id": "p7", "name": "Rodri", "position": "MID", "team": "Spain", "salary": 8500, "avg_score": 7.6},
      {"id": "p8", "name": "William Saliba", "position": "DEF", "team": "France", "salary": 7500, "avg_score": 7.2},
      {"id": "p9", "name": "Rúben Dias", "position": "DEF", "team": "Portugal", "salary": 7000, "avg_score": 7.0},
      {"id": "p10", "name": "João Cancelo", "position": "DEF", "team": "Portugal", "salary": 6500, "avg_score": 6.8}
    ]
  }'::jsonb
);

-- 2. Beast Games Week 3 - Creator League (ROSTER, YOUTUBE)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'Beast Games Week 3 - Creator League',
  'Draft 5 contestants you think will survive longest or get most screen time',
  'Select contestants within budget. Points for survival time, challenge wins, and screen time.',
  'roster', 'youtube',
  20, 800, 40, 35,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  'upcoming',
  'YouTube Data API v3',
  true,
  ARRAY['youtube', 'mrbeast', 'beast-games', 'episode-drops-sunday'],
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb,
  '{
    "salary_cap": 30000,
    "roster_slots": 5,
    "contestants": [
      {"id": "c1", "name": "Alex (Contestant #47)", "salary": 8000, "avg_score": 85, "stats": {"survival_rate": "92%", "challenges_won": 3}},
      {"id": "c2", "name": "Maya (Contestant #12)", "salary": 7500, "avg_score": 78, "stats": {"survival_rate": "88%", "challenges_won": 2}},
      {"id": "c3", "name": "Jordan (Contestant #99)", "salary": 7000, "avg_score": 72, "stats": {"survival_rate": "85%", "challenges_won": 2}},
      {"id": "c4", "name": "Chris (Contestant #23)", "salary": 6500, "avg_score": 68, "stats": {"survival_rate": "80%", "challenges_won": 1}},
      {"id": "c5", "name": "Sam (Contestant #55)", "salary": 6000, "avg_score": 65, "stats": {"survival_rate": "78%", "challenges_won": 1}},
      {"id": "c6", "name": "Taylor (Contestant #7)", "salary": 5500, "avg_score": 60, "stats": {"survival_rate": "75%", "challenges_won": 1}},
      {"id": "c7", "name": "Riley (Contestant #88)", "salary": 5000, "avg_score": 55, "stats": {"survival_rate": "70%", "challenges_won": 0}},
      {"id": "c8", "name": "Casey (Contestant #33)", "salary": 4500, "avg_score": 50, "stats": {"survival_rate": "65%", "challenges_won": 0}}
    ]
  }'::jsonb
);

-- 3. Striker Clash: Mbappé vs Vinícius Jr (DUEL, SPORTS)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'Striker Clash: Mbappé vs Vinícius Jr',
  'Who will score more fantasy points in the France vs Brazil semifinal?',
  'Fantasy points based on goals (6pts), assists (3pts), shots on target (1pt), dribbles (0.5pt).',
  'duel', 'sports',
  10, 500, 100, 64,
  NOW() + INTERVAL '4 hours',
  NOW() + INTERVAL '6 hours',
  'live',
  'FIFA Fantasy API',
  true,
  ARRAY['sports', 'soccer', 'duel', 'live-now'],
  '[{"place": 1, "percentage": 100}]'::jsonb,
  '{
    "entities": [
      {
        "name": "Kylian Mbappé",
        "team": "France",
        "avatar_url": "https://img.a.transfermarkt.technology/portrait/big/342229-1682683695.jpg",
        "stats": [
          {"label": "Tournament Goals", "value": 5, "trend": "up"},
          {"label": "Assists", "value": 2, "trend": "up"},
          {"label": "Fantasy Avg", "value": 12.3, "trend": "up"}
        ]
      },
      {
        "name": "Vinícius Jr",
        "team": "Brazil",
        "avatar_url": "https://img.a.transfermarkt.technology/portrait/big/371998-1696923512.jpg",
        "stats": [
          {"label": "Tournament Goals", "value": 3, "trend": "neutral"},
          {"label": "Assists", "value": 4, "trend": "up"},
          {"label": "Fantasy Avg", "value": 11.8, "trend": "up"}
        ]
      }
    ],
    "current_scores": {
      "Kylian Mbappé": 0,
      "Vinícius Jr": 0
    }
  }'::jsonb
);

-- 4. Virality Clash: MrBeast vs IShowSpeed (DUEL, YOUTUBE)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'Virality Clash: MrBeast vs IShowSpeed',
  'Who will gain more views in the next 24 hours?',
  'Total view count increase across all videos in the 24-hour period. Snapshots taken at start and end.',
  'duel', 'youtube',
  10, 600, 100, 72,
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '22 hours',
  'live',
  'YouTube Data API v3',
  true,
  ARRAY['youtube', 'viral', 'duel', 'view-count-battle'],
  '[{"place": 1, "percentage": 100}]'::jsonb,
  '{
    "entities": [
      {
        "name": "MrBeast",
        "channel_id": "UCX6OQ3DkcsbYNE6H8uQQuVA",
        "avatar_url": "https://yt3.googleusercontent.com/ytc/APkrFKY455xp16s2AIHalRjK60RaAj8d9q0iAc",
        "stats": [
          {"label": "Subscribers", "value": "245M", "trend": "up"},
          {"label": "Avg Video Views", "value": "50M", "trend": "up"},
          {"label": "7d Growth", "value": "+2.3%", "trend": "up"}
        ]
      },
      {
        "name": "IShowSpeed",
        "channel_id": "UCcgVECVN4OKV6DH1jLkqmcA",
        "avatar_url": "https://yt3.googleusercontent.com/ytc/APkrFKZ",
        "stats": [
          {"label": "Subscribers", "value": "28M", "trend": "up"},
          {"label": "Avg Video Views", "value": "15M", "trend": "neutral"},
          {"label": "7d Growth", "value": "+4.1%", "trend": "up"}
        ]
      }
    ],
    "start_views": {
      "MrBeast": 52847291000,
      "IShowSpeed": 8293847000
    },
    "current_views": {
      "MrBeast": 52852341000,
      "IShowSpeed": 8298921000
    }
  }'::jsonb
);

-- 5. USA vs England - Match Bingo (BINGO, SPORTS)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'USA vs England - Match Bingo',
  'Complete a line on the 3x3 event grid. First to finish wins!',
  'Select 5 events you predict will happen. Complete a horizontal, vertical, or diagonal line to win.',
  'bingo', 'sports',
  5, 250, 50, 41,
  NOW() + INTERVAL '3 hours',
  NOW() + INTERVAL '5 hours',
  'upcoming',
  'FIFA Match Events API',
  true,
  ARRAY['sports', 'soccer', 'bingo', 'grid-strategy'],
  '[{"place": 1, "percentage": 60}, {"place": 2, "percentage": 25}, {"place": 3, "percentage": 15}]'::jsonb,
  '{
    "max_selections": 5,
    "squares": [
      {"id": "s1", "text": "Goal in first 15 min", "completed": false},
      {"id": "s2", "text": "Yellow card shown", "completed": false},
      {"id": "s3", "text": "Corner kick awarded", "completed": false},
      {"id": "s4", "text": "Penalty awarded", "completed": false},
      {"id": "s5", "text": "Substitution before halftime", "completed": false},
      {"id": "s6", "text": "Header attempt on goal", "completed": false},
      {"id": "s7", "text": "Offside called", "completed": false},
      {"id": "s8", "text": "Free kick in box area", "completed": false},
      {"id": "s9", "text": "Goal in second half", "completed": false}
    ],
    "winning_lines": [
      ["s1", "s2", "s3"],
      ["s4", "s5", "s6"],
      ["s7", "s8", "s9"],
      ["s1", "s4", "s7"],
      ["s2", "s5", "s8"],
      ["s3", "s6", "s9"],
      ["s1", "s5", "s9"],
      ["s3", "s5", "s7"]
    ]
  }'::jsonb
);

-- 6. MrBeast Next Video - Content Bingo (BINGO, YOUTUBE)
INSERT INTO contests_metadata (
  title, description, rules, game_type, category,
  entry_fee, prize_pool, max_entries, current_entries,
  locks_at, settles_at, status, oracle_source, featured, tags,
  payout_structure, game_data
) VALUES (
  'MrBeast Next Video - Content Bingo',
  'Predict what happens in his next video. Explosions? Giveaways? Last to Leave?',
  'Select 5 content elements you predict will appear. Complete a line to win!',
  'bingo', 'youtube',
  5, 300, 60, 55,
  NOW() + INTERVAL '6 hours',
  NOW() + INTERVAL '1 day',
  'upcoming',
  'YouTube Data API v3',
  true,
  ARRAY['youtube', 'mrbeast', 'bingo', 'video-drops-tonight'],
  '[{"place": 1, "percentage": 60}, {"place": 2, "percentage": 25}, {"place": 3, "percentage": 15}]'::jsonb,
  '{
    "max_selections": 5,
    "squares": [
      {"id": "b1", "text": "Cash Giveaway", "completed": false},
      {"id": "b2", "text": "Explosion/Fire", "completed": false},
      {"id": "b3", "text": "Last to Leave Challenge", "completed": false},
      {"id": "b4", "text": "Chandler loses first", "completed": false},
      {"id": "b5", "text": "Chris wins", "completed": false},
      {"id": "b6", "text": "Karl screams", "completed": false},
      {"id": "b7", "text": "Celebrity cameo", "completed": false},
      {"id": "b8", "text": "Extreme stunt", "completed": false},
      {"id": "b9", "text": "Charity donation", "completed": false}
    ],
    "winning_lines": [
      ["b1", "b2", "b3"],
      ["b4", "b5", "b6"],
      ["b7", "b8", "b9"],
      ["b1", "b4", "b7"],
      ["b2", "b5", "b8"],
      ["b3", "b6", "b9"],
      ["b1", "b5", "b9"],
      ["b3", "b5", "b7"]
    ]
  }'::jsonb
);

-- =====================================================
-- HELPER FUNCTION: Update contest entries count
-- =====================================================
CREATE OR REPLACE FUNCTION update_contest_entries_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contests_metadata 
    SET current_entries = current_entries + 1 
    WHERE id = NEW.contest_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contests_metadata 
    SET current_entries = current_entries - 1 
    WHERE id = OLD.contest_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_entries_count
AFTER INSERT OR DELETE ON contest_entries
FOR EACH ROW EXECUTE FUNCTION update_contest_entries_count();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
SELECT 
  title,
  game_type,
  category,
  entry_fee || ' $BB' as entry,
  prize_pool || ' $BB' as prize,
  current_entries || '/' || max_entries as capacity,
  status,
  ARRAY_LENGTH(tags, 1) as tag_count
FROM contests_metadata
ORDER BY created_at;
