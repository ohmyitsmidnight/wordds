-- Simplify words table for automatic definition lookup
-- Run this migration after 20231114000004_fix_users_insert_policy.sql

-- Add new columns for API-fetched definitions
ALTER TABLE words
ADD COLUMN fetched_definition TEXT,
ADD COLUMN definition_source VARCHAR(100) DEFAULT 'free_dictionary_api',
ADD COLUMN fetch_status VARCHAR(50) DEFAULT 'pending' CHECK (fetch_status IN ('pending', 'success', 'failed', 'not_found')),
ADD COLUMN fetch_error TEXT,
ADD COLUMN fetched_at TIMESTAMP WITH TIME ZONE;

-- Make definition column nullable (for backward compatibility)
ALTER TABLE words
ALTER COLUMN definition DROP NOT NULL;

-- Add index for fetch_status to efficiently query words needing definition lookup
CREATE INDEX idx_words_fetch_status ON words(fetch_status);

-- Add comment explaining the new structure
COMMENT ON COLUMN words.fetched_definition IS 'Definition automatically fetched from Free Dictionary API';
COMMENT ON COLUMN words.definition_source IS 'Source of the definition (e.g., free_dictionary_api, custom)';
COMMENT ON COLUMN words.fetch_status IS 'Status of definition fetch: pending, success, failed, not_found';
COMMENT ON COLUMN words.custom_definition IS 'User-provided custom definition (optional override)';
