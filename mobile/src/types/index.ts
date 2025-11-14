// Core type definitions for the Wordds app

export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  auth_provider: 'google' | 'facebook' | 'apple' | 'microsoft' | 'email';
  subscription_tier: 'free' | 'premium';
  preferences: UserPreferences;
  created_at: string;
  last_active_at: string;
}

export interface UserPreferences {
  difficulty_level: number; // 1-10
  notifications_enabled: boolean;
  daily_challenge_reminder: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface Word {
  id: number;
  user_id: string;
  word: string;
  definition?: string; // Legacy field
  custom_definition?: string;
  fetched_definition?: string; // Auto-fetched from API
  definition_source?: string; // Source of definition
  fetch_status?: 'pending' | 'success' | 'failed' | 'not_found';
  fetch_error?: string;
  fetched_at?: string;
  status: 'learning' | 'mastered' | 'archived';
  mastery_level: number; // 0-5
  source: WordSource;
  import_context?: Record<string, any>;
  added_at: string;
  last_reviewed_at?: string;
  mastered_at?: string;
}

export type WordSource = 
  | 'manual' 
  | 'kindle' 
  | 'kobo' 
  | 'browser' 
  | 'ios_lookup' 
  | 'android_lookup'
  | 'file_upload';

export interface WordDefinition {
  id: number;
  word: string;
  word_lower: string;
  definition: string;
  part_of_speech?: string;
  pronunciation?: string;
  etymology?: string;
  usage_example?: string;
  difficulty_level: number;
  synonyms?: string[];
  antonyms?: string[];
  frequency_score?: number;
}

export interface Puzzle {
  id: number;
  user_id: string;
  grid_size: number;
  difficulty: number;
  grid_data: GridData;
  clues_across: Clue[];
  clues_down: Clue[];
  user_words: string[];
  filler_words: string[];
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
}

export interface GridData {
  grid: Cell[][];
  black_squares: [number, number][];
}

export interface Cell {
  row: number;
  col: number;
  number?: number;
  answer: string;
  user_answer?: string;
  is_black: boolean;
  revealed?: boolean;
}

export interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
  is_user_word: boolean;
  direction: 'across' | 'down';
}

export interface PuzzleAttempt {
  id: number;
  puzzle_id: number;
  user_id: string;
  current_grid: Record<string, string>;
  completed: boolean;
  start_time: string;
  end_time?: string;
  total_time_seconds?: number;
  hints_used: number;
  checks_used: number;
  reveals_used: number;
  correct_words: number;
  incorrect_words: number;
  accuracy_percentage: number;
  updated_at: string;
}

export interface LearningProgress {
  id: number;
  user_id: string;
  word_id: number;
  easiness_factor: number; // 1.3 to 2.5+
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at?: string;
  correct_count: number;
  incorrect_count: number;
  total_exposures: number;
  stage: 'new' | 'learning' | 'reviewing' | 'mastered';
  updated_at: string;
}

export interface DashboardStats {
  overview: {
    total_words: number;
    mastered_words: number;
    learning_words: number;
    total_puzzles_played: number;
    completed_puzzles: number;
    current_streak: number;
    longest_streak: number;
    days_since_last_play: number;
  };
  learning_progress: {
    words_learned_this_period: number;
    learning_speed: number; // words per day
    average_accuracy: number;
    estimated_completion_date?: string;
  };
  puzzle_stats: {
    total_puzzles_played: number;
    average_solve_time: number; // seconds
    average_accuracy: number;
    hints_used_average: number;
  };
  achievements: Achievement[];
}

export interface Achievement {
  id: number;
  user_id: string;
  achievement_type: string;
  earned_at: string;
}

export interface AnalyticsEvent {
  id?: number;
  user_id?: string;
  session_id?: string;
  event_name: string;
  event_category: string;
  properties?: Record<string, any>;
  screen_name?: string;
  previous_screen?: string;
  timestamp: string;
}

export interface UserSession {
  id: number;
  user_id: string;
  session_id: string;
  device_type: 'ios' | 'android';
  device_model?: string;
  app_version?: string;
  os_version?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  screens_viewed: number;
  puzzles_started: number;
  puzzles_completed: number;
}

// API Response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
}

// Store types
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (provider?: 'google' | 'apple' | 'facebook' | 'microsoft', email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export interface WordsState {
  words: Word[];
  loading: boolean;
  error: string | null;
  fetchWords: (filters?: WordFilters) => Promise<void>;
  addWord: (word: Omit<Word, 'id' | 'user_id' | 'added_at'>) => Promise<void>;
  deleteWord: (id: number) => Promise<void>;
  updateWord: (id: number, updates: Partial<Word>) => Promise<void>;
  bulkImport: (words: string[], source: WordSource) => Promise<void>;
}

export interface WordFilters {
  status?: 'learning' | 'mastered' | 'archived';
  search?: string;
  sort_by?: 'added_at' | 'word' | 'mastery_level';
  order?: 'asc' | 'desc';
}

export interface PuzzleState {
  currentPuzzle: Puzzle | null;
  currentAttempt: PuzzleAttempt | null;
  userAnswers: Record<string, string>;
  selectedClue: { number: number; direction: 'across' | 'down' } | null;
  loading: boolean;
  generatePuzzle: (config: PuzzleConfig) => Promise<void>;
  startAttempt: (puzzleId: number) => Promise<void>;
  updateAnswer: (clueKey: string, answer: string) => void;
  checkAnswer: (scope: 'square' | 'word' | 'puzzle') => Promise<boolean>;
  requestHint: () => Promise<string>;
  revealAnswer: (scope: 'square' | 'word' | 'puzzle') => Promise<void>;
  completePuzzle: () => Promise<void>;
}

export interface PuzzleConfig {
  difficulty: number;
  grid_size: number;
  user_words_count: number;
  include_reverse_clues?: boolean;
}

export interface LearningState {
  progress: LearningProgress[];
  stats: {
    total_words: number;
    learning_words: number;
    mastered_words: number;
    words_due: number;
  };
  loading: boolean;
  fetchProgress: () => Promise<void>;
  reviewWord: (wordId: number, correct: boolean, timeToRecall: number) => Promise<void>;
  getWordsDue: () => Promise<Word[]>;
}

export interface AnalyticsState {
  events: AnalyticsEvent[];
  track: (eventName: string, category: string, properties?: Record<string, any>) => void;
  flush: () => Promise<void>;
}
