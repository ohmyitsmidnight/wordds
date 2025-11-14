import { supabase } from './client';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete the OAuth flow by handling the callback
WebBrowser.maybeCompleteAuthSession();

export class SupabaseAuthService {
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string) {
    console.log('[Auth] Signing up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign up error:', error);
      throw error;
    }

    console.log('[Auth] Sign up successful, user ID:', data.user?.id);

    // Create user profile after signup
    if (data.user) {
      console.log('[Auth] Creating user profile for:', data.user.id);
      try {
        const profile = await this.upsertUserProfile(data.user.id, {
          email: data.user.email!,
          display_name: email.split('@')[0],
          auth_provider: 'email',
        });
        console.log('[Auth] User profile created successfully:', profile);
      } catch (profileError) {
        console.error('[Auth] Failed to create user profile:', profileError);
        // Don't throw - allow auth to succeed even if profile creation fails
      }
    }

    return data;
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    console.log('[Auth] Signing in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in error:', error);
      throw error;
    }

    console.log('[Auth] Sign in successful, user ID:', data.user?.id);
    return data;
  }

  /**
   * Sign in with OAuth provider (Google, Apple, Facebook, Microsoft)
   */
  async signInWithOAuth(
    provider: 'google' | 'apple' | 'facebook' | 'azure'
  ) {
    try {
      const redirectUrl = Linking.createURL('/auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      // Open the OAuth URL in browser
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const { url } = result;
          // Extract session from URL
          const params = new URL(url).searchParams;
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }

      return data;
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Create or update user profile after authentication
   */
  async upsertUserProfile(userId: string, profile: any) {
    try {
      console.log('[Auth] Upserting profile for user:', userId);
      console.log('[Auth] Profile data:', profile);
      
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          ...profile,
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Auth] Upsert profile error:', error);
        console.error('[Auth] Error code:', error.code);
        console.error('[Auth] Error details:', error.details);
        console.error('[Auth] Error hint:', error.hint);
        throw error;
      }
      
      console.log('[Auth] Profile upserted successfully');
      return data;
    } catch (error) {
      console.error('[Auth] Upsert user profile error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    try {
      console.log('[Auth] Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Error fetching profile:', error);
        console.error('[Auth] Error details:', JSON.stringify(error));
        throw error;
      }
      
      // If no profile exists, create a basic one
      if (!data) {
        console.log('[Auth] No profile found, creating new profile');
        const user = await this.getUser();
        if (user) {
          console.log('[Auth] Creating profile for user:', user.email);
          const newProfile = await this.upsertUserProfile(userId, {
            email: user.email!,
            display_name: user.email?.split('@')[0] || 'User',
            auth_provider: 'email',
          });
          console.log('[Auth] New profile created:', newProfile);
          return newProfile;
        }
      }
      
      console.log('[Auth] Profile fetched successfully:', data?.email);
      return data;
    } catch (error) {
      console.error('[Auth] Get user profile error:', error);
      console.error('[Auth] Full error object:', JSON.stringify(error, null, 2));
      // Return null instead of throwing to allow graceful degradation
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
}

export const authService = new SupabaseAuthService();
