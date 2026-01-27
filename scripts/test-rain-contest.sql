-- =====================================================
-- TEST CONTEST: Will It Rain Tomorrow?
-- Simple duel between Alice and Bob to test settlement
-- =====================================================

-- First, ensure the prism tables exist (run seed-prism-contests.sql first if not)

-- Clear any existing test contest with this title
DELETE FROM prism WHERE title = 'TEST: Will It Rain Tomorrow?';

-- Insert the test contest
-- Lock: Already passed (allows immediate settlement)
-- Settle: Already passed (allows immediate settlement)
-- Cooldown: 0 minutes (no waiting for test)
INSERT INTO prism (
  id,
  title, 
  description, 
  rules, 
  game_type, 
  category,
  entry_fee, 
  prize_pool, 
  max_entries,
  current_entries,
  locks_at, 
  lock_timestamp, 
  lock_type, 
  buffer_minutes,
  settles_at, 
  settle_timestamp, 
  cooldown_minutes,
  payout_structure, 
  oracle_source, 
  scoring_rules, 
  tiebreaker_rules,
  tags, 
  featured, 
  status, 
  game_data
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Fixed UUID for easy reference
  'TEST: Will It Rain Tomorrow?',
  'Simple yes/no prediction: Will it rain tomorrow in New York City? Winner takes the pool!',
  'Pick YES or NO. If you match the actual weather, you win! 50/50 split if tied.',
  'duel',
  'entertainment',
  10,     -- 10 FC entry fee
  20,     -- 20 FC prize pool (10 + 10 from Alice & Bob)
  2,      -- Only 2 entries allowed
  2,      -- Already has 2 entries (Alice & Bob)
  '2026-01-25 12:00:00+00',           -- Locked yesterday
  1737802800,                          -- Unix: Jan 25, 2026 12:00 PM UTC
  'scheduled',
  5,
  '2026-01-26 12:00:00+00',           -- Settles today
  1737889200,                          -- Unix: Jan 26, 2026 12:00 PM UTC  
  0,                                   -- No cooldown (immediate settlement for testing)
  '[{"place": 1, "percentage": 100}]'::jsonb,  -- Winner takes all
  'Weather API (mock)',
  '{"correct_answer": 20}'::jsonb,     -- 20 points for correct answer
  '{"method": "split_equal"}'::jsonb,  -- Split if tie
  ARRAY['test', 'weather', 'duel'],
  false,
  'locked',  -- Ready for settlement
  '{
    "question": "Will it rain tomorrow in NYC?",
    "options": ["YES", "NO"],
    "correct_answer": null
  }'::jsonb
);

-- Insert Alice's entry (she picks YES - it WILL rain)
INSERT INTO prism_entries (
  id,
  contest_id,
  user_id,
  picks,
  entry_fee,
  entry_timestamp,
  entry_signature,
  locked,
  score,
  payout,
  rank
) VALUES (
  'entry-alice-rain-001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'alice_52882D768C0F3E7932AAD1813CF8B19058D507A8',  -- Alice's user ID (based on L1 address)
  '{"answer": "YES", "confidence": "high"}'::jsonb,
  10,
  1737716400,  -- Jan 24, 2026 (before lock)
  'alice_signature_abc123',
  true,
  0,
  0,
  null
);

-- Insert Bob's entry (he picks NO - it will NOT rain)
INSERT INTO prism_entries (
  id,
  contest_id,
  user_id,
  picks,
  entry_fee,
  entry_timestamp,
  entry_signature,
  locked,
  score,
  payout,
  rank
) VALUES (
  'entry-bob-rain-001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'bob_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433',  -- Bob's user ID (based on L1 address)
  '{"answer": "NO", "confidence": "medium"}'::jsonb,
  10,
  1737716500,  -- Jan 24, 2026 (before lock)
  'bob_signature_xyz789',
  true,
  0,
  0,
  null
);

-- Verify the contest was created
SELECT 
  id,
  title,
  entry_fee,
  prize_pool,
  current_entries,
  status,
  cooldown_minutes
FROM prism 
WHERE title = 'TEST: Will It Rain Tomorrow?';

-- Verify entries were created
SELECT 
  e.id,
  e.user_id,
  e.picks,
  e.entry_fee,
  e.score,
  e.payout,
  e.rank
FROM prism_entries e
JOIN prism p ON e.contest_id = p.id
WHERE p.title = 'TEST: Will It Rain Tomorrow?';
