import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const AuthResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, authStatus, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(paramEmail.toLowerCase());
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);

    if (newPassword !== confirmPassword) {
      setAuthError?.('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ email, otp, newPassword });
      setMessage('Password updated successfully. Please log in.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/auth/login'), 1000);
    } catch (error) {
      // handled via context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Reset password</h1>
          <p>Enter the code sent to your email and choose a new password.</p>
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
            <div className="form-field">
              <label htmlFor="otp">Reset code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                required
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            {authError && <p className="form-error">{authError}</p>}
            {message && <p className="form-success">{message}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={authStatus === 'reset'}
            >
              {authStatus === 'reset' ? 'Updating...' : 'Reset password'}
            </button>
          </form>
          <p className="auth-footer-text">
            Return to{' '}
            <Link to="/auth/login" className="text-link">
              login
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthResetPasswordPage;
