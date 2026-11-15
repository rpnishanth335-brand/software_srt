/**
 * Google Cloud Console OAuth 2.0 Client (Google Identity Services)
 * Direct integration with Google Cloud Console Credentials (console.cloud.google.com)
 */

export interface GoogleUserProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

export interface GoogleAuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  providerId: 'google.com';
  authSource: 'google_console';
  accessToken?: string;
}

const STORAGE_KEY_USER = 'chronoforge_google_auth_user';
const STORAGE_KEY_CLIENT_ID = 'chronoforge_google_client_id';

/**
 * Retrieves the Google Client ID configured either via .env (VITE_GOOGLE_CLIENT_ID)
 * or dynamically stored in localStorage.
 */
export const getGoogleClientId = (): string => {
  const envId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (envId) return envId;

  if (typeof window !== 'undefined') {
    const stored = (localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '').trim();
    if (stored) return stored;
  }

  return '';
};

/**
 * Allows the user or admin to save the Google Cloud Console Client ID dynamically.
 */
export const setStoredGoogleClientId = (clientId: string) => {
  if (typeof window !== 'undefined') {
    const cleaned = clientId.trim();
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, cleaned);
    } else {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
  }
};

/**
 * Returns whether a valid Google Cloud Console Client ID is present.
 */
export const isGoogleClientIdConfigured = (): boolean => {
  const id = getGoogleClientId();
  return Boolean(id && id.length > 10 && id.includes('.apps.googleusercontent.com'));
};

/**
 * Loads the official Google Identity Services script asynchronously.
 */
export const loadGoogleIdentityScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Retrieves cached active Google session from localStorage.
 */
export const getStoredGoogleUser = (): GoogleAuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleAuthUser;
  } catch (e) {
    console.error('[GoogleOAuth] Error parsing stored user session:', e);
    return null;
  }
};

/**
 * Saves authenticated Google session in localStorage.
 */
export const setStoredGoogleUser = (user: GoogleAuthUser | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }
};

/**
 * Initiates the Google OAuth 2.0 popup flow via Google Identity Services Token Client.
 * Requests 'openid profile email' scopes, then fetches profile information from Google UserInfo endpoint.
 */
export const signInWithGoogleConsoleOAuth = async (clientId?: string): Promise<GoogleAuthUser> => {
  const activeClientId = (clientId || getGoogleClientId()).trim();

  if (!activeClientId) {
    throw new Error('Google Cloud Console Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID.');
  }

  // Ensure script is loaded
  await loadGoogleIdentityScript();

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK failed to initialize. Please check network connection.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid profile email',
        prompt: 'consent',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('[GoogleOAuth] Token client error:', tokenResponse);
            return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google Sign-In was cancelled.'));
          }

          if (!tokenResponse.access_token) {
            return reject(new Error('No access token returned by Google OAuth.'));
          }

          try {
            // Fetch User Profile from Google's standard UserInfo API
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch Google profile (status ${response.status})`);
            }

            const profile: GoogleUserProfile = await response.json();

            const authUser: GoogleAuthUser = {
              uid: profile.sub,
              displayName: profile.name || profile.email.split('@')[0],
              email: profile.email,
              photoURL: profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=f59e0b&color=fff`,
              providerId: 'google.com',
              authSource: 'google_console',
              accessToken: tokenResponse.access_token,
            };

            setStoredGoogleUser(authUser);
            resolve(authUser);
          } catch (fetchErr: any) {
            console.error('[GoogleOAuth] Error fetching user profile:', fetchErr);
            reject(fetchErr);
          }
        },
        error_callback: (err: any) => {
          console.error('[GoogleOAuth] Error callback:', err);
          reject(new Error(err?.message || 'Google OAuth popup encountered an error.'));
        },
      });

      // Launch popup
      tokenClient.requestAccessToken();
    } catch (initErr: any) {
      console.error('[GoogleOAuth] InitTokenClient error:', initErr);
      reject(initErr);
    }
  });
};

/**
 * Signs out from Google Console OAuth session.
 */
export const signOutGoogleConsole = async () => {
  const currentUser = getStoredGoogleUser();
  if (currentUser?.accessToken && (window as any).google?.accounts?.oauth2?.revoke) {
    try {
      (window as any).google.accounts.oauth2.revoke(currentUser.accessToken, () => {
        console.log('[GoogleOAuth] Access token revoked.');
      });
    } catch (e) {
      console.warn('[GoogleOAuth] Token revocation skipped:', e);
    }
  }
  setStoredGoogleUser(null);
};
