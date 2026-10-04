"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut as firebaseSignOut } from '@/lib/auth';
import { initializeUserRepository, getDocById, UserProfileData } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: typeof signInWithEmail;
  signUp: typeof signUpWithEmail;
  signInWithGoogle: typeof signInWithGoogle;
  signOut: typeof firebaseSignOut;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getDocById<UserProfileData>("users", uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      // 1. Immediately set user and unblock loading so the UI renders in 0ms
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // 2. Initialize repository in the background (non-blocking)
        initializeUserRepository(firebaseUser).then(() => {
          fetchProfile(firebaseUser.uid);
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        refreshProfile,
        signIn: signInWithEmail,
        signUp: signUpWithEmail,
        signInWithGoogle,
        signOut: firebaseSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
