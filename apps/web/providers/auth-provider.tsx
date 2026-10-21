'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onIdTokenChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserProfile } from '@social/types';
import { OnboardingProfileInput } from '@social/validation';
import { auth, googleProvider } from '@/lib/firebase/client';
import { formatFirebaseAuthError } from '@/lib/firebase/errors';
import { apiClient, setAuthToken } from '@/lib/api-client';

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: OnboardingProfileInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Synchronize server-side session cookie via Route Handler
  const syncServerSession = useCallback(async (token: string | null) => {
    try {
      if (token) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
          },
          body: JSON.stringify({ idToken: token }),
        });
      } else {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'x-requested-with': 'XMLHttpRequest',
          },
        });
      }
    } catch (e) {
      console.warn('[Auth Provider] Session cookie synchronization warning:', e);
    }
  }, []);

  // Listen for real-time Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        try {
          const idToken = await currentFirebaseUser.getIdToken();
          setAuthToken(idToken);
          await syncServerSession(idToken);

          // Retrieve cached metadata (e.g. username, onboarding status)
          let cachedProfile: Partial<UserProfile> = {};
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem(`profile_${currentFirebaseUser.uid}`);
            if (raw) {
              try {
                cachedProfile = JSON.parse(raw);
              } catch {
                // ignore cache parse errors
              }
            }
          }

          const defaultUsername =
            cachedProfile.username ||
            currentFirebaseUser.displayName?.toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
            currentFirebaseUser.email?.split('@')[0] ||
            null;

          const baseProfile: UserProfile = {
            id: currentFirebaseUser.uid,
            name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split('@')[0] || 'User',
            email: currentFirebaseUser.email || '',
            username: defaultUsername,
            avatarUrl: cachedProfile.avatarUrl || currentFirebaseUser.photoURL || null,
            bio: cachedProfile.bio || null,
            location: cachedProfile.location || null,
            website: cachedProfile.website || null,
            isVerified: currentFirebaseUser.emailVerified,
            onboardingCompletedAt: cachedProfile.onboardingCompletedAt || null,
            onboardingSkipped: cachedProfile.onboardingSkipped || false,
            createdAt: currentFirebaseUser.metadata.creationTime || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setUser(baseProfile);

          // If backend is active and user has a username, attempt to fetch live profile
          if (defaultUsername) {
            apiClient.users
              .getProfile(defaultUsername)
              .then((res) => {
                if (res.success && res.data) {
                  const live = res.data;
                  const merged: UserProfile = {
                    ...baseProfile,
                    name: live.displayName || baseProfile.name,
                    username: live.username || baseProfile.username,
                    avatarUrl: live.avatar || baseProfile.avatarUrl,
                    bio: live.bio ?? baseProfile.bio,
                    isVerified: live.verified ?? baseProfile.isVerified,
                  };
                  setUser(merged);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(`profile_${currentFirebaseUser.uid}`, JSON.stringify(merged));
                  }
                }
              })
              .catch(() => {
                // Offline fallback remains active
              });
          }
        } catch (e) {
          console.error('[Auth Provider] Failed to initialize user token:', e);
        }
      } else {
        setAuthToken(null);
        await syncServerSession(null);
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncServerSession]);

  const refreshSession = useCallback(async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setAuthToken(token);
      await syncServerSession(token);
    }
  }, [syncServerSession]);

  const loginWithCredentials = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      let emailToUse = identifier.trim();

      // If user typed a username without @, check local storage for mapped email
      if (!emailToUse.includes('@')) {
        const stored = typeof window !== 'undefined'
          ? localStorage.getItem(`user_email_${emailToUse.toLowerCase()}`)
          : null;
        if (stored) {
          emailToUse = stored;
        } else {
          return {
            success: false,
            error: 'Please sign in with your registered email address.',
          };
        }
      }

      await signInWithEmailAndPassword(auth, emailToUse, pass);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatFirebaseAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, username: string, pass: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const createdUser = userCredential.user;

      // Update Firebase user displayName
      await updateFirebaseProfile(createdUser, { displayName: name });

      // Save email-to-username local mapping
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_email_${username.toLowerCase()}`, email);
      }

      // Initial user profile
      const newProfile: UserProfile = {
        id: createdUser.uid,
        name,
        email,
        username,
        avatarUrl: null,
        bio: null,
        location: null,
        website: null,
        isVerified: false,
        onboardingCompletedAt: null,
        onboardingSkipped: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`profile_${createdUser.uid}`, JSON.stringify(newProfile));
      }

      // Synchronize with backend if reachable
      try {
        await apiClient.users.updateProfile({ username, skip: false });
      } catch {
        // Backend optional at signup stage
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatFirebaseAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        return { success: true };
      }
      return { success: false, error: 'Google sign-in did not complete.' };
    } catch (e: any) {
      return { success: false, error: formatFirebaseAuthError(e) };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: 'Apple sign-in requires Apple Developer configuration in the Firebase Console.',
    };
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatFirebaseAuthError(e) };
    }
  };

  const updateProfile = async (data: OnboardingProfileInput) => {
    try {
      const currentUid = auth.currentUser?.uid || user?.id;

      if (data.avatarUrl && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { photoURL: data.avatarUrl }).catch(() => {});
      }

      // Attempt API sync
      const res = await apiClient.users.updateProfile(data);
      if (res.success && res.data) {
        setUser(res.data);
        if (typeof window !== 'undefined' && currentUid) {
          localStorage.setItem(`profile_${currentUid}`, JSON.stringify(res.data));
        }
        return { success: true };
      }

      // Update local state when backend is offline
      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          username: data.username || user.username,
          bio: data.bio ?? user.bio,
          location: data.location ?? user.location,
          website: data.website ?? user.website,
          avatarUrl: data.avatarUrl ?? user.avatarUrl,
          onboardingCompletedAt: data.skip ? null : new Date().toISOString(),
          onboardingSkipped: Boolean(data.skip),
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined' && currentUid) {
          localStorage.setItem(`profile_${currentUid}`, JSON.stringify(updatedUser));
        }
        return { success: true };
      }

      return { success: false, error: res.error?.message || 'Failed to update profile' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Profile update failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[Auth Provider] Sign out error:', e);
    }

    setAuthToken(null);
    await syncServerSession(null);

    if (typeof window !== 'undefined' && user?.id) {
      localStorage.removeItem(`profile_${user.id}`);
    }
    setUser(null);
    setFirebaseUser(null);
    setIsLoading(false);
    router.push('/login');
  };

  const isAuthenticated = Boolean(user && firebaseUser);
  const isOnboarded = Boolean(user?.onboardingCompletedAt || user?.onboardingSkipped);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        session: firebaseUser,
        isLoading,
        isAuthenticated,
        isOnboarded,
        loginWithCredentials,
        signUp,
        loginWithGoogle,
        loginWithApple,
        sendPasswordReset,
        updateProfile,
        logout,
        refreshSession,
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
