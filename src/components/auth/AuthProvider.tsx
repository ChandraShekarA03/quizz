"use client";

import { createContext, useContext, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';

interface AuthContextType {
  user: any; // Clerk user object
  profile: any; // Clerk user metadata or public metadata
  loading: boolean;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const refreshProfile = useCallback(async () => {
    await user?.reload();
  }, [user]);

  const value = {
    user,
    profile: user?.publicMetadata || user?.unsafeMetadata, // Adjust based on how you store profile data in Clerk
    loading: !isLoaded,
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
