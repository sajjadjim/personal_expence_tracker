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
            age: data.profile.age ?? null,
            current_income: data.profile.currentIncome ?? null,
            address: data.profile.address ?? '',
            mobile_number: data.profile.mobileNumber ?? '',
            total_income: data.profile.totalIncome ?? 0,
            total_expense: data.profile.totalExpense ?? 0,
            current_balance: data.profile.currentBalance ?? 0,
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
        const userEmail = firebaseUser.email || (firebaseUser.phoneNumber ? `${firebaseUser.phoneNumber.replace(/[^0-9]/g, '')}@phone.local` : 'user@example.com');
        const userDisplayName = firebaseUser.displayName || firebaseUser.phoneNumber || 'User';
        await fetchProfile(
          firebaseUser.uid,
          userEmail,
          userDisplayName
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
