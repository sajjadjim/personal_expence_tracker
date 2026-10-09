'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signOutUser } from '@/lib/firebase/auth';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email?: string | null, fullName?: string | null) => {
    try {
      const params = new URLSearchParams({
        userId,
        email: email || 'user@example.com',
        fullName: fullName || '',
      });
      const res = await fetch(`/api/profile?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile({
            id: data.profile.userId,
            email: data.profile.email,
            full_name: data.profile.fullName,
            avatar_url: null,
            currency_code: data.profile.currencyCode || 'BDT',
            currency_symbol: data.profile.currencySymbol || '৳',
            date_format: data.profile.dateFormat || 'DD/MM/YYYY',
            created_at: data.profile.createdAt,
            updated_at: data.profile.updatedAt,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user profile from MongoDB:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        );
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email, user.displayName);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
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
