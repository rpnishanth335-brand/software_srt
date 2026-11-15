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
 * Retrieves the Google Client ID configured either via environment variable
 * (GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID) or dynamically stored in localStorage.
 */
export const getGoogleClientId = (): string => {
  // Check build-time injected define
  if (typeof __GOOGLE_CLIENT_ID__ !== 'undefined' && __GOOGLE_CLIENT_ID__) {
    return __GOOGLE_CLIENT_ID__.trim();
  }

  // Check import.meta.env (supports both GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID)
  const envId = (
    import.meta.env.GOOGLE_CLIENT_ID ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
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
 * Computes standard Authorized Redirect URI (callback URL).
 * Checks GOOGLE_REDIRECT_URI environment variable or defaults to current origin /auth/callback.
 */
export const getGoogleRedirectUri = (): string => {
  if (typeof __GOOGLE_REDIRECT_URI__ !== 'undefined' && __GOOGLE_REDIRECT_URI__) {
    return __GOOGLE_REDIRECT_URI__.trim();
  }

  const envUri = (
    import.meta.env.GOOGLE_REDIRECT_URI ||
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    ''
  ).trim();
  if (envUri) return envUri;

  if (typeof window === 'undefined') return 'https://software-srt.vercel.app/auth/callback';
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
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
 * Helper to decode JWT without external dependencies.
 */
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('[GoogleOAuth] Failed to parse JWT token:', e);
    return null;
  }
};

/**
 * Initiates the Google OAuth 2.0 full browser redirect flow.
 * Redirects the user to Google's standard OAuth endpoint, returning to Authorized Redirect URI.
 */
export const initiateGoogleRedirectOAuth = (clientId?: string) => {
  const activeClientId = (clientId || getGoogleClientId()).trim();
  if (!activeClientId) {
    throw new Error('Google Cloud Console Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID.');
  }

  const redirectUri = getGoogleRedirectUri();
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', activeClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token id_token');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  // Navigate to Google OAuth
  window.location.assign(authUrl.toString());
};

/**
 * Inspects the current URL hash/search for OAuth callback tokens (access_token or id_token).
 * If present, fetches profile info, persists session, cleans URL, and returns the user.
 */
export const handleGoogleOAuthCallback = async (): Promise<GoogleAuthUser | null> => {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash ? window.location.hash.substring(1) : '';
  const search = window.location.search ? window.location.search.substring(1) : '';
  const rawParams = hash || search;

  if (!rawParams) return null;

  const params = new URLSearchParams(rawParams);
  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const error = params.get('error');

  if (error) {
    console.error('[GoogleOAuth] Callback returned error:', error, params.get('error_description'));
    throw new Error(params.get('error_description') || error);
  }

  if (!accessToken && !idToken) {
    return null;
  }

  try {
    let profile: GoogleUserProfile | null = null;

    // 1. Try UserInfo API with access_token
    if (accessToken) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          profile = await response.json();
        }
      } catch (fetchErr) {
        console.warn('[GoogleOAuth] UserInfo fetch failed, falling back to id_token:', fetchErr);
      }
    }

    // 2. Fallback to decoding id_token
    if (!profile && idToken) {
      const decoded = parseJwt(idToken);
      if (decoded && decoded.sub) {
        profile = {
          sub: decoded.sub,
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          email: decoded.email,
          picture: decoded.picture,
        };
      }
    }

    if (!profile) {
      throw new Error('Unable to extract user profile from Google callback tokens.');
    }

    const authUser: GoogleAuthUser = {
      uid: profile.sub,
      displayName: profile.name || profile.email.split('@')[0],
      email: profile.email,
      photoURL: profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=f59e0b&color=fff`,
      providerId: 'google.com',
      authSource: 'google_console',
      accessToken: accessToken || undefined,
    };

    setStoredGoogleUser(authUser);

    // Clean up browser address bar (remove hash and /auth/callback path)
    const cleanPath = window.location.pathname.replace('/auth/callback', '') || '/';
    window.history.replaceState({}, document.title, cleanPath);

    return authUser;
  } catch (err) {
    console.error('[GoogleOAuth] Error handling OAuth callback:', err);
    throw err;
  }
};

/**
 * Initiates the Google OAuth 2.0 popup flow via Google Identity Services Token Client.
 * Falls back seamlessly to full redirect flow if popups are blocked or on mobile.
 */
export const signInWithGoogleConsoleOAuth = async (clientId?: string): Promise<GoogleAuthUser> => {
  const activeClientId = (clientId || getGoogleClientId()).trim();

  if (!activeClientId) {
    throw new Error('Google Cloud Console Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID.');
  }

  // Load GIS script
  await loadGoogleIdentityScript();

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK failed to load. Please check your internet connection.');
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
          console.warn('[GoogleOAuth] Popup blocked or failed, falling back to redirect...', err);
          initiateGoogleRedirectOAuth(activeClientId);
        },
      });

      // Launch popup
      tokenClient.requestAccessToken();
    } catch (initErr: any) {
      console.warn('[GoogleOAuth] TokenClient error, redirecting...', initErr);
      initiateGoogleRedirectOAuth(activeClientId);
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
