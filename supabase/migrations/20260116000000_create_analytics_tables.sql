-- Analytics Events Table
-- Stores all user analytics events for advanced analysis

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  referrer TEXT,
  url TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_data ON analytics_events USING GIN (event_data);

-- Consent Logs Table
-- Stores user consent preferences for GDPR/CCPA compliance

CREATE TABLE IF NOT EXISTS consent_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  preferences JSONB NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for consent logs
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_timestamp ON consent_logs(timestamp DESC);

-- User Sessions Table
-- Tracks user sessions for detailed analytics

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  pages_viewed INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- User Analytics Summary Table
-- Aggregated user-level metrics for quick access

CREATE TABLE IF NOT EXISTS user_analytics_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  total_bets_placed INTEGER DEFAULT 0,
  total_wagered DECIMAL(20, 2) DEFAULT 0,
  total_deposits DECIMAL(20, 2) DEFAULT 0,
  total_withdrawals DECIMAL(20, 2) DEFAULT 0,
  kyc_verified BOOLEAN DEFAULT FALSE,
  wallet_connected BOOLEAN DEFAULT FALSE,
  signup_source TEXT,
  user_segment TEXT,
  lifetime_value DECIMAL(20, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for summary
CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_last_seen ON user_analytics_summary(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_segment ON user_analytics_summary(user_segment);

-- Funnel Analytics Table
-- Track user progression through conversion funnels

CREATE TABLE IF NOT EXISTS funnel_events (
  id BIGSERIAL PRIMARY KEY,
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for funnels
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel_name ON funnel_events(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id ON funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_timestamp ON funnel_events(timestamp DESC);

-- Create view for easy funnel analysis
CREATE OR REPLACE VIEW funnel_conversion_rates AS
SELECT 
  funnel_name,
  step_name,
  step_order,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completions
FROM funnel_events
GROUP BY funnel_name, step_name, step_order
ORDER BY funnel_name, step_order;

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin can see all, users can see their own)

-- Analytics events - users can see their own
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (for API)
CREATE POLICY "Service role can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Consent logs - users can view their own
CREATE POLICY "Users can view their own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (true);

-- User sessions - users can view their own
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON user_sessions FOR ALL
  USING (true);

-- User analytics summary - users can view their own
CREATE POLICY "Users can view their own analytics summary"
  ON user_analytics_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analytics summary"
  ON user_analytics_summary FOR ALL
  USING (true);

-- Funnel events policies
CREATE POLICY "Users can view their own funnel events"
  ON funnel_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert funnel events"
  ON funnel_events FOR INSERT
  WITH CHECK (true);

-- Function to update user analytics summary
CREATE OR REPLACE FUNCTION update_user_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_analytics_summary (
    user_id,
    first_seen_at,
    last_seen_at,
    total_events
  )
  VALUES (
    NEW.user_id,
    NEW.timestamp,
    NEW.timestamp,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_seen_at = NEW.timestamp,
    total_events = user_analytics_summary.total_events + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update summary
CREATE TRIGGER trg_update_user_analytics_summary
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_analytics_summary();

-- Grant permissions
GRANT SELECT ON funnel_conversion_rates TO authenticated;
GRANT SELECT ON funnel_conversion_rates TO anon;
