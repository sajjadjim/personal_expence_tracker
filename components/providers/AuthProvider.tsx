'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, fullName?: string) => {
    if (!isConfigured) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else if (userEmail) {
        // Fallback: If profile doesn't exist yet, create it & seed categories
        const newProfile: Partial<Profile> = {
          id: userId,
          email: userEmail,
          full_name: fullName || userEmail.split('@')[0],
          currency_code: 'BDT',
          currency_symbol: '৳',
          date_format: 'DD/MM/YYYY',
        };

        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert(newProfile as Profile)
          .select()
          .single();

        if (createdProfile) {
          setProfile(createdProfile);
        }

        // Seed default categories
        try {
          await supabase.rpc('seed_default_categories_for_user', { target_user_id: userId });
        } catch (seedErr) {
          console.warn('Seed RPC error or not permitted:', seedErr);
        }
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        ).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        );
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, isConfigured]);

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.full_name);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
