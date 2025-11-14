# Wordds - Crossword Learning App

A native mobile application that helps users learn vocabulary through auto-generated crossword puzzles.

## 🎯 Project Overview

Wordds transforms vocabulary learning into an engaging crossword puzzle game. Users maintain personalized word lists and practice through AI-generated crossword puzzles that adapt to their learning patterns.

## 🏗️ Architecture

### Technology Stack

#### **Mobile App (React Native + Expo)**
- **Framework**: React Native with Expo (cross-platform iOS/Android)
- **Language**: TypeScript
- **State Management**: Zustand (lightweight, simple state)
- **Navigation**: Expo Router (file-based routing)
- **Animations**: Reanimated 3 (for smooth crossword interactions)
- **Gestures**: Gesture Handler (tap, pan for puzzle UI)
- **UI Components**: React Native Paper + Custom components
- **Local Storage**: AsyncStorage + expo-sqlite (offline support)

#### **Backend (Supabase)**
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: Supabase Auth (Google, Facebook, Apple, Microsoft OAuth)
- **Storage**: Supabase Storage (file uploads, e-reader imports)
- **API**: Auto-generated REST API + Realtime subscriptions
- **Functions**: Edge Functions (Deno) for:
  - Crossword puzzle generation
  - AI clue generation (OpenAI/Claude API)
  - E-reader file parsing
  - Learning algorithm calculations
- **Vector Search**: pgvector for semantic word matching
- **Realtime**: WebSocket subscriptions for live updates

## 📁 Project Structure

```
wordds/
├── mobile/                           # React Native app
│   ├── app/                          # Expo Router screens
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx             # Dashboard
│   │   │   ├── words.tsx             # Word list
│   │   │   ├── puzzle.tsx            # Play puzzle
│   │   │   └── profile.tsx           # User profile
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── crossword/
│   │   │   │   ├── CrosswordGrid.tsx
│   │   │   │   ├── CrosswordCell.tsx
│   │   │   │   ├── ClueList.tsx
│   │   │   │   └── PuzzleControls.tsx
│   │   │   ├── words/
│   │   │   │   ├── WordCard.tsx
│   │   │   │   ├── WordList.tsx
│   │   │   │   ├── AddWordModal.tsx
│   │   │   │   └── ImportWordsModal.tsx
│   │   │   └── dashboard/
│   │   │       ├── StatsCard.tsx
│   │   │       ├── ProgressChart.tsx
│   │   │       └── StreakDisplay.tsx
│   │   ├── store/                    # Zustand stores
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useWordsStore.ts
│   │   │   ├── usePuzzleStore.ts
│   │   │   ├── useLearningStore.ts
│   │   │   └── useAnalyticsStore.ts
│   │   ├── services/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── words.ts
│   │   │   │   ├── puzzles.ts
│   │   │   │   └── analytics.ts
│   │   │   └── analytics/
│   │   │       └── tracker.ts
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useSupabaseAuth.ts
│   │   │   ├── useRealtimeWords.ts
│   │   │   └── usePuzzleTimer.ts
│   │   ├── utils/                    # Helper functions
│   │   │   ├── crossword.ts
│   │   │   ├── learningAlgorithm.ts
│   │   │   └── dateHelpers.ts
│   │   ├── types/                    # TypeScript types
│   │   │   └── index.ts
│   │   └── constants/
│   │       └── config.ts
│   ├── assets/
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
│
├── supabase/                         # Supabase backend
│   ├── migrations/                   # Database migrations
│   │   ├── 20231114000001_initial_schema.sql
│   │   ├── 20231114000002_learning_progress.sql
│   │   ├── 20231114000003_analytics.sql
│   │   └── 20231114000004_rls_policies.sql
│   ├── functions/                    # Edge Functions
│   │   ├── generate-puzzle/
│   │   │   ├── index.ts
│   │   │   └── crosswordAlgorithm.ts
│   │   ├── generate-clue/
│   │   │   └── index.ts
│   │   ├── process-ereader-import/
│   │   │   └── index.ts
│   │   └── update-learning-progress/
│   │       └── index.ts
│   ├── seed.sql                      # Seed data (word definitions, clues)
│   └── config.toml
│
├── scripts/                          # Utility scripts
│   ├── seed-word-bank.ts
│   └── generate-embeddings.ts
│
└── docs/
    ├── SUPABASE_SETUP.md
    ├── DATABASE_SCHEMA.md
    └── API_DOCUMENTATION.md
```

## 🔑 Key Features

### 1. Authentication & User Management
- Multi-provider OAuth (Google, Facebook, Apple, Microsoft) via Supabase Auth
- Secure session management with automatic token refresh
- User profile and preferences stored in Supabase

### 2. Word List Management
- Add/delete words manually with instant sync
- Bulk import from CSV/text files via Supabase Storage
- E-reader integration (Kindle vocabulary.db, Kobo lookups)
- Browser extension support via deep linking
- iOS/Android system dictionary integration
- Realtime sync across devices

### 3. Crossword Puzzle Generation
- AI-powered puzzle generation (Supabase Edge Functions)
- Dynamic difficulty adjustment based on user performance
- Clue sources:
  - Pre-built clue bank (100k+ entries in PostgreSQL)
  - AI-generated clues (GPT-4/Claude via Edge Functions)
  - Thesaurus-based reverse clues (word ↔ synonym)
- Vector search (pgvector) for semantic word matching
- Unique puzzle generation each time

### 4. Interactive Crossword UI
- Smooth animations with Reanimated 3
- Gesture-based interactions (tap, swipe between clues)
- NYT Crossword-style features:
  - Check (square/word/puzzle)
  - Hint (letter/word suggestions)
  - Reveal (square/word/puzzle)
- Clue navigation and highlighting
- Progress autosave to Supabase
- Timer and scoring

### 5. Spaced Repetition Learning System
- SM-2 algorithm implementation
- Word mastery levels (0-5)
- Optimized review scheduling
- Performance-based difficulty adjustment
- Learning analytics and insights

### 6. Analytics & Dashboard
- Real-time stats with Supabase Realtime
- User metrics:
  - Words learned / in progress / remaining
  - Learning speed (words/week)
  - Puzzle completion rate and average solve time
  - Streak tracking
  - Days since last play
- Interactive charts with victory-native
- Achievement system with gamification

### 7. Comprehensive Tracking
- Event tracking with batched uploads
- User interaction analytics
- Puzzle performance metrics
- Word-level learning outcomes
- Privacy-compliant data collection (GDPR/CCPA)

## 🗄️ Database Schema (PostgreSQL)

### Core Tables
- `users` - User profiles (managed by Supabase Auth)
- `words` - User's word lists with learning status
- `word_definitions` - Global word definition bank
- `clues` - Pre-built clue database
- `word_embeddings` - Vector embeddings for semantic search
- `puzzles` - Generated puzzle data (JSONB grid)
- `puzzle_attempts` - User puzzle solving history
- `word_interactions` - Word-level performance tracking
- `learning_progress` - Spaced repetition scheduling
- `analytics_events` - Event tracking data
- `user_sessions` - Session tracking

### Row Level Security (RLS)
All tables have RLS policies to ensure users can only access their own data.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Supabase account (free tier available)
- OAuth app credentials (Google, Apple, Facebook, Microsoft)

### 1. Clone and Install

```bash
git clone <repository-url>
cd wordds

# Install mobile dependencies
cd mobile
npm install
```

### 2. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy generate-puzzle
supabase functions deploy generate-clue
supabase functions deploy process-ereader-import
supabase functions deploy update-learning-progress
```

### 3. Configure Environment Variables

Create `mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth credentials
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

### 4. Run the App

```bash
cd mobile

# Start Expo
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## 🧪 Testing Strategy

- **Unit Tests**: Jest for utilities and business logic
- **Component Tests**: React Testing Library
- **Integration Tests**: Supabase local development
- **E2E Tests**: Detox for critical user flows

## 📊 Analytics & Privacy

- GDPR/CCPA compliant data collection
- User consent management
- Data anonymization for ML training
- User data export and deletion via Supabase
- Opt-in analytics tracking

## 🔐 Security

- Supabase Auth with automatic token refresh
- Row Level Security (RLS) on all tables
- API rate limiting via Edge Functions
- Input validation and sanitization
- Secure storage for sensitive data
- HTTPS only communication

## 💰 Cost Estimation (Supabase)

### Free Tier (Development/MVP)
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 500K Edge Function invocations/month
- Unlimited Auth users

### Pro Tier ($25/month - Production)
- 8 GB database
- 100 GB file storage
- 250 GB bandwidth
- 2M Edge Function invocations/month
- Daily backups

## 🎯 Roadmap

### Phase 1: MVP (Current)
- Basic auth (Google, Apple)
- Manual word list management
- Simple puzzle generation with pre-built clues
- Basic crossword UI with Reanimated
- Simple progress tracking

### Phase 2: Enhanced Features
- AI-generated clues via Edge Functions
- E-reader integrations (Kindle, Kobo)
- Advanced learning algorithm (SM-2)
- Comprehensive analytics dashboard
- Realtime multiplayer challenges

### Phase 3: ML & Optimization
- Vector search for semantic word matching
- ML-based puzzle difficulty optimization
- Personalized learning paths
- Clue quality improvement
- Performance optimization

### Phase 4: Growth & Scale
- Social features (friends, leaderboards)
- Premium subscription tier
- Offline mode with sync
- Internationalization (i18n)
- Web app (via Expo Web)

## 📱 App Store Information

- **Minimum iOS**: 13.0
- **Minimum Android**: Android 6.0 (API level 23)
- **Age Rating**: 4+ (suitable for all ages)
- **Privacy Policy**: Required for OAuth providers
- **Permissions**: Internet access only

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

[Your chosen license]

---

**Built with ❤️ to make vocabulary learning fun and effective**
