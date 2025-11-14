import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Trim any whitespace from environment variables
const cleanUrl = supabaseUrl.trim();
const cleanKey = supabaseAnonKey.trim();

if (!cleanUrl || !cleanKey) {
  console.warn(
    'Missing Supabase environment variables. App will have limited functionality.'
  );
}

export const supabase = createClient(
  cleanUrl || 'https://placeholder.supabase.co',
  cleanKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
