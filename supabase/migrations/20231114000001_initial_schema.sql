-- Initial database schema for Wordds app
-- Run this migration first

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    auth_provider VARCHAR(50) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    preferences JSONB DEFAULT '{"difficulty_level": 5, "notifications_enabled": true, "daily_challenge_reminder": false, "theme": "auto"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word definitions (global reference table)
CREATE TABLE word_definitions (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) UNIQUE NOT NULL,
    word_lower VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    part_of_speech VARCHAR(50),
    pronunciation VARCHAR(255),
    etymology TEXT,
    usage_example TEXT,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    frequency_score DECIMAL(10, 2),
    synonyms TEXT[],
    antonyms TEXT[],
    source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word embeddings for vector search
CREATE TABLE word_embeddings (
    id SERIAL PRIMARY KEY,
    word_definition_id INTEGER REFERENCES word_definitions(id) ON DELETE CASCADE,
    embedding vector(1536), -- OpenAI ada-002 dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's personal word list
CREATE TABLE words (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_definition_id INTEGER REFERENCES word_definitions(id),
    word VARCHAR(255) NOT NULL,
    definition TEXT,
    custom_definition TEXT,
    status VARCHAR(50) DEFAULT 'learning' CHECK (status IN ('learning', 'mastered', 'archived')),
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    source VARCHAR(100),
    import_context JSONB,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_word UNIQUE (user_id, word)
);

-- Clue bank
CREATE TABLE clues (
    id SERIAL PRIMARY KEY,
    word_definition_id INTEGER NOT NULL REFERENCES word_definitions(id),
    clue_text TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    clue_type VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    average_solve_time INTEGER,
    success_rate DECIMAL(5, 2),
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Puzzles
CREATE TABLE puzzles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grid_size INTEGER NOT NULL,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
    grid_data JSONB NOT NULL,
    clues_across JSONB NOT NULL,
    clues_down JSONB NOT NULL,
    user_words TEXT[],
    filler_words TEXT[],
    generation_method VARCHAR(50),
    generation_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Puzzle attempts
CREATE TABLE puzzle_attempts (
    id SERIAL PRIMARY KEY,
    puzzle_id INTEGER NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_grid JSONB DEFAULT '{}'::jsonb,
    completed BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_time_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    checks_used INTEGER DEFAULT 0,
    reveals_used INTEGER DEFAULT 0,
    correct_words INTEGER DEFAULT 0,
    incorrect_words INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_at);

CREATE INDEX idx_word_definitions_word_lower ON word_definitions(word_lower);
CREATE INDEX idx_word_definitions_difficulty ON word_definitions(difficulty_level);

CREATE INDEX idx_word_embeddings_vector ON word_embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_words_user_id ON words(user_id);
CREATE INDEX idx_words_status ON words(status);
CREATE INDEX idx_words_mastery ON words(mastery_level);

CREATE INDEX idx_clues_word_definition_id ON clues(word_definition_id);
CREATE INDEX idx_clues_difficulty ON clues(difficulty_level);

CREATE INDEX idx_puzzles_user_id ON puzzles(user_id);
CREATE INDEX idx_puzzles_status ON puzzles(status);
CREATE INDEX idx_puzzles_created_at ON puzzles(created_at DESC);

CREATE INDEX idx_puzzle_attempts_puzzle_id ON puzzle_attempts(puzzle_id);
CREATE INDEX idx_puzzle_attempts_user_id ON puzzle_attempts(user_id);
CREATE INDEX idx_puzzle_attempts_completed ON puzzle_attempts(completed);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view their own words"
    ON words FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own words"
    ON words FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own words"
    ON words FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own words"
    ON words FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own puzzles"
    ON puzzles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own puzzles"
    ON puzzles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own puzzles"
    ON puzzles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own puzzle attempts"
    ON puzzle_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own puzzle attempts"
    ON puzzle_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own puzzle attempts"
    ON puzzle_attempts FOR UPDATE
    USING (auth.uid() = user_id);

-- Word definitions and clues are globally readable
CREATE POLICY "Word definitions are viewable by everyone"
    ON word_definitions FOR SELECT
    USING (true);

CREATE POLICY "Clues are viewable by everyone"
    ON clues FOR SELECT
    USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_word_definitions_updated_at
    BEFORE UPDATE ON word_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clues_updated_at
    BEFORE UPDATE ON clues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_puzzle_attempts_updated_at
    BEFORE UPDATE ON puzzle_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
