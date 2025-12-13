import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import useAuth from '../hooks/useAuth';

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, authStatus, authError, setAuthError, accessToken, hydrated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const wasAuthenticatedOnMount = useRef(null);

  const getRedirectPath = useCallback(() => {
    const from = location.state?.from;
    let redirectTo = '/';
    if (from && !from.startsWith('/auth/')) {
      const fromLower = from.toLowerCase();
      const isCartOrCheckout = fromLower.includes('/cart') || fromLower.includes('/checkout');
      redirectTo = isCartOrCheckout ? '/' : from;
    }
    return redirectTo;
  }, [location.state?.from]);

  useEffect(() => {
    if (!hydrated) return;
    if (wasAuthenticatedOnMount.current === null) {
      wasAuthenticatedOnMount.current = !!accessToken;
    }
    if (wasAuthenticatedOnMount.current && accessToken && user?.emailVerified !== false) {
      navigate('/', { replace: true });
    }
  }, [accessToken, hydrated, navigate, user?.emailVerified]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);
    try {
      const response = await login({ email, password });
      setMessage(response?.message || 'Login successful!');
      setTimeout(() => navigate(getRedirectPath()), 600);
    } catch (error) {
      // error surfaced via context
    }
  };

  const handleGoogleSuccess = useCallback(
    async (idToken) => {
      setMessage('');
      setAuthError?.(null);
      try {
        const response = await googleLogin(idToken);
        setMessage(response?.message || 'Signed in with Google!');
        setTimeout(() => navigate(getRedirectPath()), 600);
      } catch (error) {
        // error surfaced via context
      }
    },
    [googleLogin, navigate, getRedirectPath, setAuthError]
  );

  const handleGoogleError = useCallback(
    (error) => {
      console.error('Google Sign-In error:', error);
      setAuthError?.(error?.message || 'Google sign-in failed. Please try again.');
    },
    [setAuthError]
  );

  const isLoading = authStatus === 'login' || authStatus === 'google';

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Welcome back</h1>
          <p>Sign in with your verified email and password.</p>
          
          {/* Google Sign-In Button */}
          <div className="google-signin-wrapper" style={{ marginBottom: '1.5rem' }}>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={isLoading}
              text="signin_with"
            />
          </div>
          
          <div className="auth-divider" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '1.5rem 0',
            gap: '1rem'
          }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>or</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value.toLowerCase())}
                placeholder="name@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            <p className="auth-footer-text" style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
              <Link to="/auth/forgot-password" className="text-link">
                Forgot password?
              </Link>
            </p>
            {authError && <p className="form-error">{authError}</p>}
            {message && <p className="form-success">{message}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {authStatus === 'login' ? 'Signing in...' : authStatus === 'google' ? 'Signing in with Google...' : 'Log In'}
            </button>
          </form>
          <p className="auth-footer-text">
            New to Kana Vindu?{' '}
            <Link to="/auth/signup" className="text-link">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthLoginPage;
