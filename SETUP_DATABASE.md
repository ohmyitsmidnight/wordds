# Database Setup Guide

## Step 1: Run Migrations in Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/eqzxgzvnetnivxtveypw/sql/new

### Migration 1: Initial Schema
1. Open `supabase/migrations/20231114000001_initial_schema.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" (bottom right)
5. Wait for success message

### Migration 2: Learning Progress
1. Open `supabase/migrations/20231114000002_learning_progress.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"

### Migration 3: Analytics
1. Open `supabase/migrations/20231114000003_analytics.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"

### Migration 4: Fix Users Insert Policy (IMPORTANT!)
1. Open `supabase/migrations/20231114000004_fix_users_insert_policy.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. This fixes the RLS policy to allow users to create their own profile

## Step 2: Verify Tables Created

Go to: https://supabase.com/dashboard/project/eqzxgzvnetnivxtveypw/editor

You should see these tables:
- ✅ users
- ✅ word_definitions
- ✅ word_embeddings
- ✅ words
- ✅ clues
- ✅ puzzles
- ✅ puzzle_attempts
- ✅ learning_progress
- ✅ word_interactions
- ✅ user_sessions
- ✅ analytics_events
- ✅ user_achievements
- ✅ user_dashboard_stats (materialized view)

## Step 3: Deploy Edge Function (Optional for now)

```bash
# Install Supabase CLI (if not already)
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref eqzxgzvnetnivxtveypw

# Deploy function
supabase functions deploy generate-puzzle
```

## Step 4: Configure OAuth Providers

Go to: https://supabase.com/dashboard/project/eqzxgzvnetnivxtveypw/auth/providers

Enable and configure:
- **Google**: Add OAuth credentials, set redirect URL
- **Apple**: Add credentials (requires Apple Developer account)
- **Facebook**: Add App ID and Secret
- **Microsoft**: Add Azure credentials

Redirect URL format:
```
https://eqzxgzvnetnivxtveypw.supabase.co/auth/v1/callback

```

## Next: Start Building UI

Once migrations are complete, you can:
1. Test the app (words will save to database)
2. Build authentication screen
3. Create word list UI
4. Implement crossword grid

Ready to proceed!
