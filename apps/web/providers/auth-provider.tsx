'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
import { UserProfile, OnboardingStatus } from '@social/types';
import { OnboardingProfileInput } from '@social/validation';
import { auth, googleProvider } from '@/lib/firebase/client';
import { formatFirebaseAuthError } from '@/lib/firebase/errors';
import { apiClient, setAuthToken } from '@/lib/api-client';

export function computeOnboardingStatus(user: {
  onboardingCompletedAt?: Date | string | null;
  onboardingSkipped?: boolean;
}): OnboardingStatus {
  if (user.onboardingCompletedAt) return 'COMPLETED';
  if (user.onboardingSkipped) return 'SKIPPED';
  return 'NOT_COMPLETED';
}

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isProfileCompleted: boolean;
  isOnboardingSkipped: boolean;
  isProfilePending: boolean;
  onboardingStatus: OnboardingStatus;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{
    success: boolean;
    error?: string;
    onboardingStatus?: OnboardingStatus;
    isOnboarded?: boolean;
  }>;
  signUp: (name: string, email: string, username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{
    success: boolean;
    error?: string;
    cancelled?: boolean;
    onboardingStatus?: OnboardingStatus;
    isOnboarded?: boolean;
  }>;
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
  const queryClient = useQueryClient();
  const isGoogleAuthInProgress = useRef(false);
  const inFlightSyncRef = useRef<{ token: string | null; promise: Promise<boolean> } | null>(null);

  // Synchronize server-side session cookie via Route Handler with in-flight deduplication
  const syncServerSession = useCallback(async (token: string | null): Promise<boolean> => {
    // If an identical synchronization request is already in-flight, return the shared promise
    if (inFlightSyncRef.current && inFlightSyncRef.current.token === token) {
      return inFlightSyncRef.current.promise;
    }

    const syncPromise = (async (): Promise<boolean> => {
      try {
        if (token) {
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-requested-with': 'XMLHttpRequest',
            },
            body: JSON.stringify({ idToken: token }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.warn(
              '[Auth Provider] Session cookie synchronization warning:',
              res.status,
              data?.error || res.statusText,
            );
            return false;
          }
          return true;
        } else {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'x-requested-with': 'XMLHttpRequest',
            },
          });
          return true;
        }
      } catch (e) {
        console.warn('[Auth Provider] Session cookie synchronization warning:', e);
        return false;
      } finally {
        if (inFlightSyncRef.current?.token === token) {
          inFlightSyncRef.current = null;
        }
      }
    })();

    inFlightSyncRef.current = { token, promise: syncPromise };
    return syncPromise;
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

          const initialCompletedAt = cachedProfile.onboardingCompletedAt || null;
          const initialSkipped = cachedProfile.onboardingSkipped || false;
          const initialStatus =
            cachedProfile.onboardingStatus ||
            computeOnboardingStatus({
              onboardingCompletedAt: initialCompletedAt,
              onboardingSkipped: initialSkipped,
            });

          let currentProfile: UserProfile = {
            id: currentFirebaseUser.uid,
            name: currentFirebaseUser.displayName || currentFirebaseUser.email?.split('@')[0] || 'User',
            email: currentFirebaseUser.email || '',
            username: defaultUsername,
            avatarUrl: cachedProfile.avatarUrl || currentFirebaseUser.photoURL || null,
            bio: cachedProfile.bio || null,
            location: cachedProfile.location || null,
            website: cachedProfile.website || null,
            isVerified: currentFirebaseUser.emailVerified,
            onboardingCompletedAt: initialCompletedAt,
            onboardingSkipped: initialSkipped,
            onboardingStatus: initialStatus,
            createdAt: currentFirebaseUser.metadata.creationTime || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Authoritatively fetch live profile from backend before completing loading
          try {
            const res = await apiClient.users.getMe();
            if (res.success && res.data) {
              const live = res.data;
              const liveCompletedAt =
                live.onboardingCompletedAt !== undefined
                  ? live.onboardingCompletedAt
                  : currentProfile.onboardingCompletedAt;
              const liveSkipped =
                live.onboardingSkipped !== undefined
                  ? live.onboardingSkipped
                  : currentProfile.onboardingSkipped;
              const liveStatus =
                live.onboardingStatus ||
                computeOnboardingStatus({
                  onboardingCompletedAt: liveCompletedAt,
                  onboardingSkipped: liveSkipped,
                });

              currentProfile = {
                ...currentProfile,
                name: live.displayName || currentProfile.name,
                username: live.username || currentProfile.username,
                avatarUrl: live.avatar || currentProfile.avatarUrl,
                bio: live.bio ?? currentProfile.bio,
                location: live.location !== undefined ? live.location : currentProfile.location,
                website: live.website !== undefined ? live.website : currentProfile.website,
                isVerified: live.verified ?? currentProfile.isVerified,
                onboardingCompletedAt: liveCompletedAt,
                onboardingSkipped: liveSkipped,
                onboardingStatus: liveStatus,
              };

              if (typeof window !== 'undefined') {
                localStorage.setItem(`profile_${currentFirebaseUser.uid}`, JSON.stringify(currentProfile));
              }
            }
          } catch {
            // Offline fallback remains active
          }

          setUser(currentProfile);
        } catch (e: any) {
          const isTokenExpired =
            e?.code === 'auth/user-token-expired' ||
            e?.code === 'auth/id-token-expired' ||
            e?.code === 'auth/id-token-revoked' ||
            e?.message?.includes('user-token-expired');

          if (isTokenExpired) {
            console.warn('[Auth Provider] User token expired or revoked. Resetting auth state.');
            // Clean up invalidated session to avoid stuck application state
            await signOut(auth).catch(() => {});
            setAuthToken(null);
            await syncServerSession(null);
            setUser(null);
            setFirebaseUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('social_auth_token');
            }
          } else {
            console.error('[Auth Provider] Failed to initialize user token:', e);
          }
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
      try {
        const token = await auth.currentUser.getIdToken(true);
        setAuthToken(token);
        await syncServerSession(token);
      } catch (err: any) {
        const isTokenExpired =
          err?.code === 'auth/user-token-expired' ||
          err?.code === 'auth/id-token-expired' ||
          err?.code === 'auth/id-token-revoked' ||
          err?.message?.includes('user-token-expired');

        if (isTokenExpired) {
          console.warn('[Auth Provider] Stale session expired during refresh. Resetting auth state.');
          await signOut(auth).catch(() => {});
          setAuthToken(null);
          await syncServerSession(null);
          setUser(null);
          setFirebaseUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('social_auth_token');
          }
        } else {
          console.warn('[Auth Provider] Failed to refresh session:', err?.message);
        }
      }
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

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pass);
      let status: OnboardingStatus = 'NOT_COMPLETED';

      if (userCredential?.user) {
        const idToken = await userCredential.user.getIdToken();
        setAuthToken(idToken);
        await syncServerSession(idToken);

        // Fetch live profile to check onboarding status
        try {
          const res = await apiClient.users.getMe();
          if (res.success && res.data) {
            const live = res.data;
            status = live.onboardingStatus || computeOnboardingStatus(live);
            const updatedProfile: UserProfile = {
              id: userCredential.user.uid,
              name: live.displayName || userCredential.user.displayName || 'User',
              email: userCredential.user.email || '',
              username: live.username || null,
              avatarUrl: live.avatar || userCredential.user.photoURL || null,
              bio: live.bio || null,
              location: live.location || null,
              website: live.website || null,
              isVerified: live.verified ?? userCredential.user.emailVerified,
              onboardingCompletedAt: live.onboardingCompletedAt || null,
              onboardingSkipped: live.onboardingSkipped || false,
              onboardingStatus: status,
              createdAt: userCredential.user.metadata.creationTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(updatedProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`profile_${userCredential.user.uid}`, JSON.stringify(updatedProfile));
            }
          }
        } catch {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem(`profile_${userCredential.user.uid}`);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                status = parsed.onboardingStatus || computeOnboardingStatus(parsed);
              } catch {}
            }
          }
        }
      }

      const isOnboarded = status === 'COMPLETED' || status === 'SKIPPED';
      return { success: true, onboardingStatus: status, isOnboarded };
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

      // Synchronize session cookie
      const idToken = await createdUser.getIdToken();
      setAuthToken(idToken);
      await syncServerSession(idToken);

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
        onboardingStatus: 'NOT_COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`profile_${createdUser.uid}`, JSON.stringify(newProfile));
      }

      // Synchronize with backend if reachable, without marking onboarding completed
      try {
        await apiClient.users.updateProfile({ username, completeOnboarding: false, skip: false });
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

  const loginWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
    cancelled?: boolean;
    onboardingStatus?: OnboardingStatus;
    isOnboarded?: boolean;
  }> => {
    // Prevent duplicate concurrent popup requests
    if (isGoogleAuthInProgress.current) {
      return { success: false, cancelled: true };
    }
    isGoogleAuthInProgress.current = true;
    setIsLoading(true);

    try {
      // Ensure account chooser is prompted
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      // Execute popup with automatic retry on stale/expired credential
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // Handle user closing popup or duplicate popup request gracefully without error
        const isPopupClosedByUser =
          popupErr?.code === 'auth/popup-closed-by-user' ||
          popupErr?.code === 'auth/cancelled-popup-request' ||
          popupErr?.message?.includes('popup-closed-by-user') ||
          popupErr?.message?.includes('cancelled-popup-request');

        if (isPopupClosedByUser) {
          console.info('[Google Sign-In] Popup closed or cancelled by user.');
          return { success: false, cancelled: true };
        }

        const isTokenExpired =
          popupErr?.code === 'auth/user-token-expired' ||
          popupErr?.code === 'auth/id-token-expired' ||
          popupErr?.code === 'auth/id-token-revoked' ||
          popupErr?.message?.includes('user-token-expired');

        if (isTokenExpired) {
          console.warn(
            '[Auth Provider] User token expired during Google sign-in. Clearing stale cache and retrying...',
          );
          await signOut(auth).catch(() => {});
          setAuthToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('social_auth_token');
          }
          // Retry once with a completely clean slate
          result = await signInWithPopup(auth, googleProvider);
        } else {
          throw popupErr;
        }
      }

      if (result?.user) {
        // Retrieve valid ID token from newly authenticated user
        const freshIdToken = await result.user.getIdToken();
        setAuthToken(freshIdToken);
        await syncServerSession(freshIdToken);

        let status: OnboardingStatus = 'NOT_COMPLETED';
        try {
          const res = await apiClient.users.getMe();
          if (res.success && res.data) {
            const live = res.data;
            status = live.onboardingStatus || computeOnboardingStatus(live);
            const updatedProfile: UserProfile = {
              id: result.user.uid,
              name: live.displayName || result.user.displayName || 'User',
              email: result.user.email || '',
              username: live.username || null,
              avatarUrl: live.avatar || result.user.photoURL || null,
              bio: live.bio || null,
              location: live.location || null,
              website: live.website || null,
              isVerified: live.verified ?? result.user.emailVerified,
              onboardingCompletedAt: live.onboardingCompletedAt || null,
              onboardingSkipped: live.onboardingSkipped || false,
              onboardingStatus: status,
              createdAt: result.user.metadata.creationTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(updatedProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`profile_${result.user.uid}`, JSON.stringify(updatedProfile));
            }
          }
        } catch {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem(`profile_${result.user.uid}`);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                status = parsed.onboardingStatus || computeOnboardingStatus(parsed);
              } catch {}
            }
          }
        }

        const isOnboarded = status === 'COMPLETED' || status === 'SKIPPED';
        return { success: true, onboardingStatus: status, isOnboarded };
      }
      return { success: false, error: 'Google sign-in did not complete.' };
    } catch (e: any) {
      const isPopupClosedByUser =
        e?.code === 'auth/popup-closed-by-user' ||
        e?.code === 'auth/cancelled-popup-request' ||
        e?.message?.includes('popup-closed-by-user') ||
        e?.message?.includes('cancelled-popup-request');

      if (isPopupClosedByUser) {
        console.info('[Google Sign-In] Popup closed or cancelled by user.');
        return { success: false, cancelled: true };
      }

      console.error('[Google Sign-In Error]:', e);
      return { success: false, error: formatFirebaseAuthError(e) };
    } finally {
      isGoogleAuthInProgress.current = false;
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

      if (data.name && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.name }).catch(() => {});
      }

      // Attempt API sync
      const res = await apiClient.users.updateProfile(data);
      if (res.success && res.data) {
        const live = res.data;
        const status = live.onboardingStatus || computeOnboardingStatus(live);
        const merged: UserProfile = {
          ...live,
          onboardingStatus: status,
        };
        setUser(merged);
        if (typeof window !== 'undefined' && currentUid) {
          localStorage.setItem(`profile_${currentUid}`, JSON.stringify(merged));
        }
        return { success: true };
      }

      // Update local state when backend is offline
      if (user) {
        let nextCompletedAt = user.onboardingCompletedAt;
        let nextSkipped = user.onboardingSkipped;

        if (data.skip) {
          nextSkipped = true;
          nextCompletedAt = null;
        } else if (data.completeOnboarding !== false) {
          nextCompletedAt = new Date().toISOString();
          nextSkipped = false;
        }

        const nextStatus = computeOnboardingStatus({
          onboardingCompletedAt: nextCompletedAt,
          onboardingSkipped: nextSkipped,
        });

        const updatedUser: UserProfile = {
          ...user,
          name: data.name || user.name,
          username: data.username || user.username,
          bio: data.bio ?? user.bio,
          location: data.location ?? user.location,
          website: data.website ?? user.website,
          avatarUrl: data.avatarUrl ?? user.avatarUrl,
          onboardingCompletedAt: nextCompletedAt,
          onboardingSkipped: Boolean(nextSkipped),
          onboardingStatus: nextStatus,
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

    // 1. Immediately purge cached queries and client tokens
    setAuthToken(null);
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.removeItem(`profile_${user.id}`);
    }
    try {
      queryClient.clear();
    } catch {
      // Ignore if queryClient cannot be cleared
    }

    // 2. Terminate client Firebase Auth session
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[Auth Provider] Sign out error:', e);
    }

    // 3. Clear server-side session cookie
    await syncServerSession(null);

    setUser(null);
    setFirebaseUser(null);
    setIsLoading(false);
    router.push('/login');
  };

  const isAuthenticated = Boolean(user && firebaseUser);
  const onboardingStatus: OnboardingStatus =
    user?.onboardingStatus || computeOnboardingStatus(user || {});
  const isOnboarded = onboardingStatus === 'COMPLETED' || onboardingStatus === 'SKIPPED';
  const isProfileCompleted = onboardingStatus === 'COMPLETED';
  const isOnboardingSkipped = onboardingStatus === 'SKIPPED';
  const isProfilePending = onboardingStatus === 'NOT_COMPLETED';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        session: firebaseUser,
        isLoading,
        isAuthenticated,
        isOnboarded,
        isProfileCompleted,
        isOnboardingSkipped,
        isProfilePending,
        onboardingStatus,
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
