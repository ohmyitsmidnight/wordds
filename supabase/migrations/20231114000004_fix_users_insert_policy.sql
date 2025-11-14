-- Fix missing INSERT policy for users table
-- This allows authenticated users to create their own profile on first login

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
