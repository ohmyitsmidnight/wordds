-- Analytics and session tracking tables

-- User sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    device_type VARCHAR(50),
    device_model VARCHAR(255),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    
    country_code VARCHAR(2),
    timezone VARCHAR(100),
    
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    screens_viewed INTEGER DEFAULT 0,
    puzzles_started INTEGER DEFAULT 0,
    puzzles_completed INTEGER DEFAULT 0
);

-- Analytics events
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(100),
    
    properties JSONB,
    
    screen_name VARCHAR(255),
    previous_screen VARCHAR(255),
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    achievement_type VARCHAR(100) NOT NULL,
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_start_time ON user_sessions(start_time DESC);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_properties ON analytics_events USING GIN (properties);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
    ON user_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON user_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON user_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW user_dashboard_stats AS
SELECT 
    u.id AS user_id,
    COUNT(DISTINCT w.id) FILTER (WHERE w.status != 'archived') AS total_words,
    COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'learning') AS learning_words,
    COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'mastered') AS mastered_words,
    COUNT(DISTINCT pa.id) AS total_puzzles_attempted,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.completed = TRUE) AS completed_puzzles,
    COALESCE(AVG(pa.total_time_seconds) FILTER (WHERE pa.completed = TRUE), 0) AS avg_solve_time_seconds,
    COALESCE(AVG(pa.accuracy_percentage) FILTER (WHERE pa.completed = TRUE), 0) AS avg_accuracy,
    u.last_active_at,
    EXTRACT(EPOCH FROM (NOW() - u.last_active_at))/86400 AS days_since_last_play
FROM users u
LEFT JOIN words w ON w.user_id = u.id
LEFT JOIN puzzle_attempts pa ON pa.user_id = u.id
GROUP BY u.id;

CREATE UNIQUE INDEX idx_user_dashboard_stats_user_id ON user_dashboard_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
END;
$$ LANGUAGE plpgsql;
