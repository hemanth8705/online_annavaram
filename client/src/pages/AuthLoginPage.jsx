import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authStatus, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);
    try {
      const response = await login({ email, password });
      const redirectTo =
        location.state?.from && !location.state.from.startsWith('/auth/')
          ? location.state.from
          : '/';
      setMessage(response?.message || 'Login successful!');
      setTimeout(() => navigate(redirectTo), 600);
    } catch (error) {
      // error surfaced via context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Welcome back</h1>
          <p>Sign in with your verified email and password.</p>
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
              disabled={authStatus === 'login'}
            >
              {authStatus === 'login' ? 'Signing in...' : 'Log In'}
            </button>
          </form>
          <p className="auth-footer-text">
            New to Online Annavaram?{' '}
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
