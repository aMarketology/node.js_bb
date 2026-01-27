/**
 * ═══════════════════════════════════════════════════════════════
 * INDEXER HELPER: Increment Market Stats
 * ═══════════════════════════════════════════════════════════════
 * 
 * PostgreSQL function to efficiently increment market statistics
 * when a new bet is placed.
 * 
 * Usage:
 *   SELECT increment_market_stats('market-uuid', 100.0, 1);
 * 
 * This is more efficient than SELECT + UPDATE pattern.
 * ═══════════════════════════════════════════════════════════════
 */

-- Create function to increment market stats atomically
CREATE OR REPLACE FUNCTION increment_market_stats(
    p_market_id UUID,
    p_volume DECIMAL,
    p_bets INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE markets
    SET 
        total_volume = total_volume + p_volume,
        total_bets = total_bets + p_bets,
        updated_at = NOW()
    WHERE id = p_market_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment outcome stats atomically
CREATE OR REPLACE FUNCTION increment_outcome_stats(
    p_outcome_id UUID,
    p_volume DECIMAL,
    p_bets INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE market_outcomes
    SET 
        total_volume = total_volume + p_volume,
        total_bets = total_bets + p_bets,
        updated_at = NOW()
    WHERE id = p_outcome_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment profile stats atomically
CREATE OR REPLACE FUNCTION increment_profile_stats(
    p_wallet_address TEXT,
    p_volume DECIMAL,
    p_bets INTEGER,
    p_winnings DECIMAL DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO profiles (wallet_address, total_volume, total_bets, total_winnings)
    VALUES (p_wallet_address, p_volume, p_bets, p_winnings)
    ON CONFLICT (wallet_address) 
    DO UPDATE SET
        total_volume = profiles.total_volume + p_volume,
        total_bets = profiles.total_bets + p_bets,
        total_winnings = profiles.total_winnings + p_winnings,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Optional: Create a view for market leaderboard
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW market_leaderboard AS
SELECT 
    p.wallet_address,
    p.username,
    p.total_bets,
    p.total_volume,
    p.total_winnings,
    p.reputation_score,
    (p.total_winnings / NULLIF(p.total_volume, 0) * 100) as roi_percentage,
    p.created_at
FROM profiles p
WHERE p.total_bets > 0
ORDER BY p.total_winnings DESC
LIMIT 100;

-- ═══════════════════════════════════════════════════════════════
-- Optional: Create indexes for common queries
-- ═══════════════════════════════════════════════════════════════

-- Index for user bet history
CREATE INDEX IF NOT EXISTS idx_bets_user_created 
ON bets(user_address, created_at DESC);

-- Index for market bet history
CREATE INDEX IF NOT EXISTS idx_bets_market_created 
ON bets(market_id, created_at DESC);

-- Index for active bets
CREATE INDEX IF NOT EXISTS idx_bets_active 
ON bets(status) WHERE status = 'active';

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_winnings 
ON profiles(total_winnings DESC) WHERE total_bets > 0;
