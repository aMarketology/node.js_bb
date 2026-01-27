-- Contest System Setup for Fantasy Sweepstakes
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contests_metadata table
CREATE TABLE IF NOT EXISTS contests_metadata (
  contest_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_type TEXT NOT NULL CHECK (contest_type IN ('duel', 'roster', 'bingo')),
  category TEXT NOT NULL CHECK (category IN ('youtube', 'sports', 'gaming')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'bb' CHECK (currency IN ('fan_gold', 'bb')),
  prize_pool DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'settled')),
  locks_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entities JSONB,
  payout_structure JSONB,
  oracle_source TEXT
);

-- Create contest_entries table
CREATE TABLE IF NOT EXISTS contest_entries (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES contests_metadata(contest_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  pick JSONB,
  entry_fee_paid DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'bb' CHECK (currency IN ('fan_gold', 'bb')),
  current_rank INTEGER,
  current_score DECIMAL(10,2),
  payout DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'pending')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- Create game_history table (for backwards compatibility)
CREATE TABLE IF NOT EXISTS game_history (
  game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('won', 'lost', 'draw')),
  amount_wagered DECIMAL(10,2) NOT NULL,
  amount_won DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'bb' CHECK (currency IN ('fan_gold', 'bb')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Fan Gold columns to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fan_gold_balance DECIMAL(10,2) NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS bb_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests_metadata(status);
CREATE INDEX IF NOT EXISTS idx_contests_locks_at ON contests_metadata(locks_at);
CREATE INDEX IF NOT EXISTS idx_entries_contest ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON contest_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON contest_entries(status);
CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contests_metadata
CREATE TRIGGER update_contests_metadata_updated_at
BEFORE UPDATE ON contests_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert seed contests
INSERT INTO contests_metadata (
  contest_type, category, title, description, entry_fee, currency, 
  prize_pool, max_participants, status, locks_at, entities, payout_structure
) VALUES
(
  'duel', 
  'youtube', 
  'MrBeast vs IShowSpeed: 24hr View Battle', 
  'Who gains more views in the next 24 hours?', 
  10, 
  'bb', 
  500, 
  100, 
  'upcoming', 
  NOW() + INTERVAL '4 hours',
  '["MrBeast", "IShowSpeed"]'::jsonb,
  '[{"place": 1, "percentage": 100}]'::jsonb
),
(
  'roster', 
  'sports', 
  'EPL Fantasy - Gameweek 22', 
  'Draft your ultimate Premier League lineup', 
  20, 
  'bb', 
  2000, 
  200, 
  'upcoming', 
  NOW() + INTERVAL '8 hours',
  null,
  '[{"place": 1, "percentage": 50}, {"place": 2, "percentage": 30}, {"place": 3, "percentage": 20}]'::jsonb
),
(
  'bingo', 
  'gaming', 
  'Beast Games: Squid Bingo', 
  'Complete any line in the 3x3 grid of challenges', 
  5, 
  'bb', 
  250, 
  50, 
  'live', 
  NOW() + INTERVAL '2 hours',
  null,
  '[{"place": 1, "percentage": 100}]'::jsonb
),
(
  'duel', 
  'youtube', 
  'FREE ENTRY: Kai Cenat vs xQc', 
  'Practice with Fan Gold! Who gets more subs today?', 
  100, 
  'fan_gold', 
  5000, 
  500, 
  'upcoming', 
  NOW() + INTERVAL '6 hours',
  '["Kai Cenat", "xQc"]'::jsonb,
  '[{"place": 1, "percentage": 100}]'::jsonb
);

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT 
  p.user_id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(CASE WHEN ce.status = 'won' THEN ce.payout ELSE 0 END), 0) as total_winnings,
  COUNT(CASE WHEN ce.status = 'won' THEN 1 END) as contests_won,
  p.fan_gold_balance,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN ce.status = 'won' THEN ce.payout ELSE 0 END), 0) DESC) as rank
FROM profiles p
LEFT JOIN contest_entries ce ON p.user_id = ce.user_id
  AND ce.entered_at > NOW() - INTERVAL '7 days'
GROUP BY p.user_id, p.username, p.avatar_url, p.fan_gold_balance
ORDER BY total_winnings DESC;

-- Enable Row Level Security
ALTER TABLE contests_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contests_metadata (public read)
CREATE POLICY "Anyone can view contests"
ON contests_metadata FOR SELECT
USING (true);

-- RLS Policies for contest_entries (users can view their own)
CREATE POLICY "Users can view their own entries"
ON contest_entries FOR SELECT
USING (auth.uid()::text = user_id OR true); -- Allow public read for leaderboards

CREATE POLICY "Users can insert their own entries"
ON contest_entries FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- RLS Policies for game_history
CREATE POLICY "Users can view their own game history"
ON game_history FOR SELECT
USING (auth.uid()::text = user_id);

-- RLS Policies for badges
CREATE POLICY "Users can view their own badges"
ON badges FOR SELECT
USING (auth.uid()::text = user_id);

COMMENT ON TABLE contests_metadata IS 'Fantasy sweepstakes contest definitions';
COMMENT ON TABLE contest_entries IS 'User entries into contests';
COMMENT ON TABLE game_history IS 'Historical game results for tracking stats';
COMMENT ON TABLE badges IS 'User achievement badges';
