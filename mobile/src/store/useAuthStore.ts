import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authService } from '../services/supabase/auth';
import { supabase } from '../services/supabase/client';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      console.log('[AuthStore] Initializing auth store');
      set({ loading: true });
      const session = await authService.getSession();
      console.log('[AuthStore] Session retrieved:', session?.user?.email);
      
      if (session?.user) {
        console.log('[AuthStore] User found, fetching profile for:', session.user.id);
        try {
          const profile = await authService.getUserProfile(session.user.id);
          console.log('[AuthStore] Profile loaded successfully:', profile?.email);
          set({ user: profile, session, loading: false });
        } catch (profileError) {
          console.warn('[AuthStore] Could not fetch user profile, using basic auth data:', profileError);
          // Fallback to basic user data if profile fetch fails
          set({ 
            user: {
              id: session.user.id,
              email: session.user.email!,
              display_name: session.user.email?.split('@')[0] || 'User',
              auth_provider: 'email',
              subscription_tier: 'free',
              preferences: {
                difficulty_level: 5,
                notifications_enabled: true,
                daily_challenge_reminder: false,
                theme: 'auto',
              },
              created_at: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
            } as any,
            session, 
            loading: false 
          });
        }
      } else {
        set({ user: null, session: null, loading: false });
      }

      // Listen to auth changes
      authService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const profile = await authService.getUserProfile(session.user.id);
            set({ user: profile, session });
          } catch (error) {
            console.warn('Could not fetch profile on auth change:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ user: null, session: null, loading: false });
    }
  },

  signIn: async (provider, email?: string, password?: string) => {
    try {
      console.log('[AuthStore] Sign in initiated');
      set({ loading: true });
      
      if (email && password) {
        // Email/password sign in
        console.log('[AuthStore] Signing in with email:', email);
        await authService.signInWithEmail(email, password);
        console.log('[AuthStore] Email sign in completed');
      } else if (provider) {
        // OAuth sign in
        console.log('[AuthStore] Signing in with provider:', provider);
        const supabaseProvider = provider === 'microsoft' ? 'azure' : provider;
        await authService.signInWithOAuth(supabaseProvider as any);
      }
      
      // After auth, the session will be set via onAuthStateChange
      console.log('[AuthStore] Sign in successful, waiting for auth state change');
      set({ loading: false });
    } catch (error) {
      console.error('[AuthStore] Sign in error:', error);
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
}));
