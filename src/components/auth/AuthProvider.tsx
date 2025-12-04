"use client";

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { getDatabaseHelper } from '@/lib/sqlserver';
import type { Database } from '@/lib/sqlserver';

type Profile = Database['tables']['profiles'];

interface AuthContextType {
  user: any; // Clerk user object
  profile: Profile | null; // Database profile
  loading: boolean;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setProfileLoading(true);
    try {
      const db = await getDatabaseHelper();
      let userProfile = await db.getProfile(user.id);

      // If profile doesn't exist, create it from Clerk data
      if (!userProfile) {
        const newProfile = {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          full_name: user.fullName || user.firstName + ' ' + user.lastName || null,
          role: 'student' as const, // Default role
          avatar_url: user.imageUrl || null,
          is_approved: false, // Teachers need approval
        };
        await db.createProfile(newProfile);
        userProfile = await db.getProfile(user.id);
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to basic profile from Clerk
      setProfile({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        full_name: user.fullName || null,
        role: 'student',
        avatar_url: user.imageUrl || null,
        is_approved: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    } else if (isLoaded && !user) {
      setProfile(null);
    }
  }, [user, isLoaded, fetchProfile]);

  const value = {
    user,
    profile,
    loading: !isLoaded || profileLoading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
