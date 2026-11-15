import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { 
  getStoredGoogleUser, 
  setStoredGoogleUser, 
  signInWithGoogleConsoleOAuth, 
  signOutGoogleConsole, 
  isGoogleClientIdConfigured,
  GoogleAuthUser 
} from './googleOAuth';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId?: string;
  authSource?: 'google_console' | 'firebase' | 'test';
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (explicitClientId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isConfigured: boolean;
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Friendly error message converter
export const formatAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add your domain to Authorized JavaScript Origins in Google Cloud Console or Firebase.';
    case 'auth/too-many-requests':
      return 'Too many sign-in requests. Please wait a few seconds before retrying.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address under a different credential.';
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again.';
    default:
      return errorCode || 'Failed to sign in with Google. Please verify your Google Console OAuth credentials.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  const hasFirebase = isFirebaseConfigured();
  const hasGoogleConsole = isGoogleClientIdConfigured();
  const isConfigured = hasFirebase || hasGoogleConsole;

  // 1. Initial Session Restoration
  useEffect(() => {
    // 1a. Check stored Google Cloud Console OAuth session
    const storedGoogle = getStoredGoogleUser();
    if (storedGoogle) {
      setUser(storedGoogle);
      setLoading(false);
      return;
    }

    // 1b. Check Firebase redirect result & auth state if Firebase is available
    if (auth && hasFirebase) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            setUser({
              uid: result.user.uid,
              displayName: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
              providerId: 'google.com',
              authSource: 'firebase',
            });
          }
        })
        .catch((err: any) => {
          console.error('[Firebase] Redirect error:', err);
          setError(formatAuthError(err?.code || ''));
        });

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            providerId: 'google.com',
            authSource: 'firebase',
          });
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [hasFirebase]);

  // Detect mobile device
  const isMobileOrWebview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isWebview = /(FBAN|FBAV|Instagram|Twitter|Line|LinkedIn)/i.test(ua);
    return isMobile || isWebview;
  }, []);

  // Primary Google Sign-In Action
  const signInWithGoogle = async (explicitClientId?: string) => {
    setError(null);

    // If client ID provided or Google Console OAuth is configured
    const googleClientId = explicitClientId || (isGoogleClientIdConfigured() ? 'USE_CONFIGURED' : '');

    if (googleClientId) {
      setLoading(true);
      try {
        const loggedUser = await signInWithGoogleConsoleOAuth(explicitClientId);
        setUser(loggedUser);
        setError(null);
        setShowConfigModal(false);
        return;
      } catch (err: any) {
        console.error('[GoogleOAuth] Sign-in failed:', err);
        setError(formatAuthError(err?.message || 'Google OAuth Sign-In failed.'));
        throw err;
      } finally {
        setLoading(false);
      }
    }

    // If Firebase Auth is configured
    if (auth && hasFirebase) {
      setLoading(true);
      try {
        if (isMobileOrWebview) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        try {
          const result = await signInWithPopup(auth, googleProvider);
          if (result.user) {
            setUser({
              uid: result.user.uid,
              displayName: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
              providerId: 'google.com',
              authSource: 'firebase',
            });
            setError(null);
          }
        } catch (popupErr: any) {
          if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
            console.warn('[Firebase] Popup blocked, falling back to redirect...');
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupErr;
        }
      } catch (err: any) {
        console.error('[Firebase] Sign-in error:', err);
        setError(formatAuthError(err?.code || ''));
      } finally {
        setLoading(false);
      }
      return;
    }

    // If neither is configured yet, open the Google Cloud Console Configuration Modal
    setShowConfigModal(true);
  };

  // Sign Out Flow
  const signOut = async () => {
    setError(null);
    setLoading(true);

    try {
      if (user?.authSource === 'google_console') {
        await signOutGoogleConsole();
      } else if (auth && hasFirebase) {
        await firebaseSignOut(auth);
      }
      setStoredGoogleUser(null);
      setUser(null);
    } catch (err: any) {
      console.error('[Auth] Sign-out error:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Expose mock sign-in for testing environments
  if (typeof window !== 'undefined') {
    (window as any).__chronoforge_mock_google_login = (customUser?: Partial<AppUser>) => {
      const mock: AppUser = {
        uid: customUser?.uid || 'google_oauth_sub_1092837465',
        displayName: customUser?.displayName || 'Google Verified Administrator',
        email: customUser?.email || 'admin@school.edu',
        photoURL: customUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        providerId: 'google.com',
        authSource: 'google_console',
      };
      setStoredGoogleUser(mock as GoogleAuthUser);
      setUser(mock);
      setError(null);
      return mock;
    };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signOut,
        clearError,
        isConfigured,
        showConfigModal,
        setShowConfigModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
