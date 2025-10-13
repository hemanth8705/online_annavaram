import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  signup as signupRequest,
  verifyEmail as verifyEmailRequest,
  resendOtp as resendOtpRequest,
  login as loginRequest,
} from '../lib/apiClient';

const AuthContext = createContext(undefined);

const STORAGE_KEY = 'online-annavaram@auth-user';

function normaliseUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id || user._id,
    fullName: user.fullName,
    email: user.email,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [authStatus, setAuthStatus] = useState('idle');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(normaliseUser(parsed));
      }
    } catch (error) {
      console.warn('Failed to parse stored auth user', error);
    }
  }, []);

  const persistUser = useCallback((nextUser) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

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
        setPendingEmail(null);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Verification failed');
        throw error;
      }
    },
    []
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
        const nextUser = normaliseUser(response?.data?.user);
        setUser(nextUser);
        persistUser(nextUser);
        setAuthStatus('idle');
        return response;
      } catch (error) {
        setAuthStatus('idle');
        setAuthError(error.message || 'Login failed');
        throw error;
      }
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    setPendingEmail(null);
    persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      pendingEmail,
      authStatus,
      authError,
      signup,
      verifyEmail,
      resendOtp,
      login,
      logout,
      setAuthError,
      setPendingEmail,
    }),
    [
      authError,
      authStatus,
      login,
      logout,
      pendingEmail,
      resendOtp,
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
