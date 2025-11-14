# Supabase Setup Guide

## Initial Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Configure Environment Variables

Create `mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Supabase CLI

```bash
npm install -g supabase
```

### 4. Link Project

```bash
cd wordds
supabase login
supabase link --project-ref your-project-ref
```

### 5. Run Migrations

```bash
supabase db push
```

This will create all tables, indexes, RLS policies, and functions.

## Configure Authentication

### Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### Apple OAuth

1. Enable Apple provider in Supabase Dashboard
2. Configure Apple Developer account:
   - Create Services ID
   - Enable Sign in with Apple
   - Add redirect URL
3. Upload Apple private key to Supabase

### Facebook OAuth

1. Enable Facebook provider
2. Create Facebook App
3. Add OAuth credentials to Supabase
4. Set redirect URL

### Microsoft OAuth

1. Enable Azure (Microsoft) provider
2. Create app in Azure Portal
3. Add client ID and secret to Supabase

## Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy generate-puzzle
supabase functions deploy generate-clue
supabase functions deploy process-ereader-import
supabase functions deploy update-learning-progress

# Set secrets for AI APIs
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set ANTHROPIC_API_KEY=your-key
```

## Enable pgvector Extension

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Seed Data

### Import Word Definitions

```bash
# Upload word definitions CSV to Supabase Storage
# Then run Edge Function to process

supabase functions invoke process-word-bank \
  --data '{"file_path": "word-bank.csv"}'
```

### Import Clue Bank

Use the Supabase SQL Editor to import clues:

```sql
COPY clues(word_definition_id, clue_text, difficulty_level, clue_type, source)
FROM '/path/to/clues.csv'
DELIMITER ','
CSV HEADER;
```

## Storage Buckets

Create buckets in Supabase Dashboard → Storage:

1. **user-imports** - For CSV/text file uploads
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: text/csv, text/plain

2. **ereader-files** - For Kindle/Kobo imports
   - Public: No
   - File size limit: 50MB

### Storage Policies

```sql
-- User imports bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-imports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Realtime Configuration

Enable Realtime for tables:

```sql
-- Enable realtime for words table
ALTER PUBLICATION supabase_realtime ADD TABLE words;
ALTER PUBLICATION supabase_realtime ADD TABLE puzzles;
ALTER PUBLICATION supabase_realtime ADD TABLE learning_progress;
```

## Scheduled Jobs (via pg_cron)

Refresh materialized views daily:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily refresh at 2 AM
SELECT cron.schedule(
  'refresh-dashboard-stats',
  '0 2 * * *',
  'SELECT refresh_dashboard_stats();'
);
```

## Performance Optimization

### Connection Pooling

Enable connection pooling in Supabase Dashboard → Settings → Database → Connection Pooling

Use connection pool URL for production:
```
postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Indexes

All necessary indexes are created in migrations. Monitor slow queries:

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoring

### Error Tracking

Integrate Sentry with Edge Functions:

```typescript
import * as Sentry from 'https://deno.land/x/sentry/index.ts';

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
});
```

### Analytics

Query analytics tables:

```sql
-- Most common events
SELECT event_name, COUNT(*) as count
FROM analytics_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_name
ORDER BY count DESC;
```

## Backup & Recovery

Supabase Pro plan includes:
- Daily backups
- Point-in-time recovery
- Multi-region support

## Cost Management

### Free Tier Limits
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 500K Edge Function invocations/month

### Optimization Tips
1. Use connection pooling
2. Implement pagination for large queries
3. Cache frequently accessed data
4. Use materialized views for complex aggregations
5. Batch analytics events before inserting

## Security Checklist

- ✅ RLS enabled on all user tables
- ✅ Secure API keys in Edge Functions
- ✅ Input validation in Edge Functions
- ✅ Rate limiting configured
- ✅ HTTPS only
- ✅ OAuth redirect URLs whitelisted
- ✅ Storage policies configured
- ✅ Secrets rotated regularly

## Troubleshooting

### Common Issues

**Issue**: OAuth not working on mobile
- Check redirect URLs in OAuth provider settings
- Verify deep linking configuration in app.json
- Test with Expo Go vs standalone build

**Issue**: RLS blocking legitimate queries
- Check RLS policies
- Verify auth.uid() matches user_id
- Use `SECURITY DEFINER` for functions that need elevated permissions

**Issue**: Edge Functions timing out
- Optimize database queries
- Use connection pooling
- Implement caching
- Break large operations into smaller chunks

## Next Steps

1. Run migrations: `supabase db push`
2. Configure OAuth providers
3. Deploy Edge Functions
4. Seed word definitions and clues
5. Test authentication flow
6. Monitor performance and costs
