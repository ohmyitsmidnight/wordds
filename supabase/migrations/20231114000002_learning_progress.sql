-- Learning progress and spaced repetition tables

-- Learning progress for each word
CREATE TABLE learning_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    
    -- SM-2 algorithm variables
    easiness_factor DECIMAL(5, 2) DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    
    -- Scheduling
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_review_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance tracking
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    total_exposures INTEGER DEFAULT 0,
    
    -- Learning stage
    stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'learning', 'reviewing', 'mastered')),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_word_progress UNIQUE (user_id, word_id)
);

-- Word interactions (detailed tracking)
CREATE TABLE word_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    puzzle_attempt_id INTEGER REFERENCES puzzle_attempts(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(50),
    time_to_solve_seconds INTEGER,
    clue_used TEXT,
    was_correct BOOLEAN,
    attempts_count INTEGER DEFAULT 1,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_next_review ON learning_progress(next_review_at);
CREATE INDEX idx_learning_progress_stage ON learning_progress(stage);

CREATE INDEX idx_word_interactions_user_id ON word_interactions(user_id);
CREATE INDEX idx_word_interactions_word_id ON word_interactions(word_id);
CREATE INDEX idx_word_interactions_timestamp ON word_interactions(timestamp DESC);

-- Enable RLS
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own learning progress"
    ON learning_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning progress"
    ON learning_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress"
    ON learning_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own word interactions"
    ON word_interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own word interactions"
    ON word_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for puzzle attempts
CREATE OR REPLACE FUNCTION increment_hints_used(attempt_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE puzzle_attempts
    SET hints_used = hints_used + 1
    WHERE id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_checks_used(attempt_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE puzzle_attempts
    SET checks_used = checks_used + 1
    WHERE id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_reveals_used(attempt_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE puzzle_attempts
    SET reveals_used = reveals_used + 1
    WHERE id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
