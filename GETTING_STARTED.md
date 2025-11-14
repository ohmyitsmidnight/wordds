# Wordds - Getting Started

This guide will help you set up and run the Wordds crossword learning app locally.

## Prerequisites

- Node.js 20+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier available)
- iOS Simulator (Mac) or Android Studio (for mobile testing)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Supabase

Create `mobile/.env` from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Database

Follow the [Supabase Setup Guide](docs/SUPABASE_SETUP.md) to:
- Create Supabase project
- Run database migrations
- Configure OAuth providers
- Deploy Edge Functions

```bash
# Link Supabase project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push

# Deploy Edge Functions
supabase functions deploy generate-puzzle
```

### 4. Run the App

```bash
# Start Expo development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## Project Structure

```
wordds/
├── mobile/                 # React Native app
│   ├── app/               # Expo Router screens
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # Supabase services
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── supabase/              # Backend
│   ├── migrations/        # Database schema
│   └── functions/         # Edge Functions
│
└── docs/                  # Documentation
```

## Key Features

### Authentication
- Multi-provider OAuth (Google, Apple, Facebook, Microsoft)
- Automatic session management
- Secure token storage

### Word Management
- Add/delete words manually
- Bulk import from files
- E-reader integration (Kindle, Kobo)
- Real-time sync

### Crossword Puzzles
- AI-generated puzzles
- Dynamic difficulty
- NYT-style interface
- Check/hint/reveal features

### Learning System
- Spaced repetition (SM-2 algorithm)
- Word mastery tracking
- Personalized review scheduling

### Analytics Dashboard
- Learning progress metrics
- Puzzle performance stats
- Streak tracking
- Achievement system

## Development Workflow

### Running Tests

```bash
cd mobile
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Environment Variables

Required environment variables in `mobile/.env`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# OAuth (optional for local development)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
EXPO_PUBLIC_APPLE_CLIENT_ID=
EXPO_PUBLIC_FACEBOOK_APP_ID=
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=
```

## Common Tasks

### Add a New Screen

1. Create file in `mobile/app/(tabs)/`
2. Expo Router automatically registers the route
3. Add navigation link in layout

### Create a New Zustand Store

1. Create file in `mobile/src/store/`
2. Define state interface in `types/index.ts`
3. Implement store with `create()` from Zustand
4. Use in components with `useStore()`

### Add a New Supabase Edge Function

1. Create folder in `supabase/functions/`
2. Add `index.ts` with Deno handler
3. Deploy: `supabase functions deploy function-name`
4. Call from mobile app via `supabase.functions.invoke()`

### Update Database Schema

1. Create new migration file
2. Write SQL changes
3. Push to Supabase: `supabase db push`

## Troubleshooting

### "Cannot find module 'zustand'"

Install dependencies:
```bash
cd mobile && npm install
```

### OAuth not working

1. Check redirect URLs in OAuth provider settings
2. Verify environment variables in `.env`
3. Rebuild app after changing app.json

### Database connection issues

1. Check Supabase project is running
2. Verify URL and anon key in `.env`
3. Check RLS policies are not blocking queries

### Edge Functions failing

1. Check function logs: `supabase functions logs function-name`
2. Verify secrets are set: `supabase secrets list`
3. Test locally: `supabase functions serve`

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## Next Steps

1. Complete Supabase setup (see docs/SUPABASE_SETUP.md)
2. Configure OAuth providers
3. Seed word definitions and clue bank
4. Test authentication flow
5. Build first crossword puzzle
6. Implement learning dashboard

## Support

For issues or questions:
- Check existing GitHub issues
- Create new issue with detailed description
- Include error logs and reproduction steps

---

Happy coding! 🎯
