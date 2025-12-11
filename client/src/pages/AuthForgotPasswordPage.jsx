import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const AuthForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { pendingEmail, requestPasswordReset, authStatus, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState(pendingEmail || '');
  const [message, setMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);
    setShowSignupPrompt(false);
    try {
      await requestPasswordReset({ email });
      setMessage('A reset code has been emailed. Enter it on the next step.');
      setTimeout(
        () => navigate(`/auth/reset-password?email=${encodeURIComponent(email.toLowerCase())}`),
        800
      );
    } catch (error) {
      if (error?.status === 404 || /not registered/i.test(error?.message || '')) {
        setShowSignupPrompt(true);
      }
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
            {showSignupPrompt && (
              <p className="form-hint">
                New here?{' '}
                <Link to="/auth/signup" className="text-link">
                  Create an account
                </Link>{' '}
                to continue.
              </p>
            )}
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
