import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  signup as signupRequest,
  verifyEmail as verifyEmailRequest,
  resendOtp as resendOtpRequest,
  login as loginRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
  refreshSession as refreshSessionRequest,
} from '../lib/apiClient';

const AuthContext = createContext(undefined);

const STORAGE_KEY = 'online-annavaram@auth-user';
const ACCESS_TOKEN_KEY = 'online-annavaram@access-token';

function normaliseUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id || user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [authStatus, setAuthStatus] = useState('idle');
  const [authError, setAuthError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(normaliseUser(parsed));
      }
      if (storedToken) {
        setAccessToken(storedToken);
      }
    } catch (error) {
      console.warn('Failed to parse stored auth user', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  const persistUser = useCallback((nextUser) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persistAccessToken = useCallback((token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, []);

  const applyAuthSession = useCallback(
    (response) => {
      const payload = response?.data || response;
      if (!payload) return null;
      const nextUser = normaliseUser(payload.user);
      const token = payload.accessToken || null;

      if (nextUser) {
        setUser(nextUser);
        persistUser(nextUser);
      }
      setAccessToken(token);
      persistAccessToken(token);

      return { user: nextUser, token };
    },
    [persistAccessToken, persistUser]
  );

  const signup = useCallback(
    async (payload) => {
      setAuthStatus('signup');
      setAuthError(null);
      try {
        const response = await signupRequest(payload);
        const email = payload.email.toLowerCase();
        setPendingEmail(email);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Signup failed');
        throw error;
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (payload) => {
      setAuthStatus('verify');
      setAuthError(null);
      try {
        const response = await verifyEmailRequest(payload);
        applyAuthSession(response);
        setPendingEmail(null);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Verification failed');
        throw error;
      }
    },
    [applyAuthSession]
  );

  const resendOtp = useCallback(
    async (payload) => {
      setAuthStatus('resend');
      setAuthError(null);
      try {
        const response = await resendOtpRequest(payload);
        setPendingEmail(payload.email.toLowerCase());
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Unable to resend OTP');
        throw error;
      }
    },
    []
  );

  const login = useCallback(
    async (payload) => {
      setAuthStatus('login');
      setAuthError(null);
      try {
        const response = await loginRequest(payload);
        applyAuthSession(response);
        setPendingEmail(null);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        if (error?.status === 401) {
          setAuthError('Invalid email or password.');
        } else {
          setAuthError(error.message || 'Login failed');
        }
        throw error;
      }
    },
    [applyAuthSession]
  );

  const requestPasswordReset = useCallback(
    async (payload) => {
      setAuthStatus('forgot');
      setAuthError?.(null);
      try {
        const response = await requestPasswordResetRequest(payload);
        setPendingEmail(payload.email.toLowerCase());
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Unable to send reset code');
        throw error;
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (payload) => {
      setAuthStatus('reset');
      setAuthError?.(null);
      try {
        const response = await resetPasswordRequest(payload);
        applyAuthSession(response);
        setPendingEmail(null);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Reset failed');
        throw error;
      }
    },
    [applyAuthSession]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setPendingEmail(null);
    persistUser(null);
    persistAccessToken(null);
    setAuthError(null);
    
    // Clear all user-related data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('online-annavaram@') || key.includes('cart') || key.includes('wishlist'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [persistAccessToken, persistUser]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshSessionRequest();
      applyAuthSession(response);
      setAuthError(null);
      return response;
    } catch (error) {
      console.warn('Failed to refresh session', error);
      logout();
      throw error;
    }
  }, [applyAuthSession, logout]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      pendingEmail,
      authStatus,
      authError,
      hydrated,
      signup,
      verifyEmail,
      resendOtp,
      login,
      requestPasswordReset,
      resetPassword,
      logout,
      refreshSession,
      setAuthError,
      setPendingEmail,
    }),
    [
      accessToken,
      authError,
      authStatus,
      hydrated,
      login,
      logout,
      pendingEmail,
      resendOtp,
      requestPasswordReset,
      resetPassword,
      signup,
      user,
      verifyEmail,
      setAuthError,
      setPendingEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
