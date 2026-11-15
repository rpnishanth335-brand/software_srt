import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isDemoUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsDemo: () => void;
  clearError: () => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'chronoforge_demo_session';

const DEMO_USER: Partial<User> & { uid: string; displayName: string; email: string; photoURL: string } = {
  uid: 'demo_administrator_uid',
  displayName: 'School Administrator (Demo)',
  email: 'admin@demo.chronoforge.edu',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
};

// Friendly error message converter
export const formatAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Redirecting to Google...';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.';
    case 'auth/too-many-requests':
      return 'Too many sign-in requests. Please wait a few seconds before retrying.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address under a different provider.';
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again.';
    default:
      return 'Failed to sign in with Google. Please try again or continue as demo.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
  });

  const isConfigured = isFirebaseConfigured();

  // 1. Initial Auth Listener & Mobile Redirect Handler
  useEffect(() => {
    // If running in demo mode
    if (localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
      setUser(DEMO_USER as unknown as User);
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    // Check redirect result (e.g. returning from mobile browser OAuth redirect)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          localStorage.removeItem(DEMO_STORAGE_KEY);
          setIsDemoUser(false);
        }
      })
      .catch((err: any) => {
        console.error('[Firebase] Redirect error:', err);
        setError(formatAuthError(err?.code || ''));
      });

    // Listen to live auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (localStorage.getItem(DEMO_STORAGE_KEY) !== 'true') {
        setUser(firebaseUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Detect mobile or standalone webview
  const isMobileOrWebview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isWebview = /(FBAN|FBAV|Instagram|Twitter|Line|LinkedIn)/i.test(ua);
    return isMobile || isWebview;
  }, []);

  // Google Sign-In Flow
  const signInWithGoogle = async () => {
    setError(null);

    if (!auth || !isConfigured) {
      setError('Firebase credentials are not configured in .env. You can continue as a Demo user below.');
      return;
    }

    setLoading(true);

    try {
      if (isMobileOrWebview) {
        // Fall back to redirect on mobile devices and in-app webviews
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      // Try desktop popup first
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          setUser(result.user);
          localStorage.removeItem(DEMO_STORAGE_KEY);
          setIsDemoUser(false);
        }
      } catch (popupErr: any) {
        // If popup was blocked or failed, seamlessly fall back to redirect
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
  };

  // Sign Out Flow
  const signOut = async () => {
    setError(null);
    setLoading(true);

    try {
      if (auth && isConfigured) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemoUser(false);
      setUser(null);
    } catch (err: any) {
      console.error('[Firebase] Sign-out error:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Bypass
  const continueAsDemo = () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setIsDemoUser(true);
    setUser(DEMO_USER as unknown as User);
    setError(null);
    setLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isDemoUser,
        signInWithGoogle,
        signOut,
        continueAsDemo,
        clearError,
        isConfigured,
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
