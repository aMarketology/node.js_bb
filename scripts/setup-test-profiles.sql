-- =====================================================
-- SETUP: Ensure Alice and Bob have profiles with FC balance
-- Run this BEFORE running the rain contest test
-- =====================================================

-- Insert Alice's profile (or update if exists)
INSERT INTO profiles (id, email, fan_gold_balance, created_at, updated_at)
VALUES (
  'alice_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  'alice@blackbook.test',
  100,  -- Start with 100 FC
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  fan_gold_balance = COALESCE(profiles.fan_gold_balance, 0) + 0;  -- Keep existing balance

-- Insert Bob's profile (or update if exists)
INSERT INTO profiles (id, email, fan_gold_balance, created_at, updated_at)
VALUES (
  'bob_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433',
  'bob@blackbook.test',
  100,  -- Start with 100 FC
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  fan_gold_balance = COALESCE(profiles.fan_gold_balance, 0) + 0;  -- Keep existing balance

-- Check current balances
SELECT id, email, fan_gold_balance FROM profiles 
WHERE id IN (
  'alice_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  'bob_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433'
);
