import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const AuthForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { pendingEmail, requestPasswordReset, authStatus, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState(pendingEmail || '');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);
    try {
      await requestPasswordReset({ email });
      setMessage('If an account exists, a reset code has been emailed.');
      setTimeout(() => navigate(`/auth/reset-password?email=${encodeURIComponent(email.toLowerCase())}`), 800);
    } catch (error) {
      // handled via context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Forgot password</h1>
          <p>Enter your email and we&apos;ll send a reset code.</p>
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
              />
            </div>
            {authError && <p className="form-error">{authError}</p>}
            {message && <p className="form-success">{message}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={authStatus === 'forgot'}
            >
              {authStatus === 'forgot' ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
          <p className="auth-footer-text">
            Remembered your password?{' '}
            <Link to="/auth/login" className="text-link">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthForgotPasswordPage;
