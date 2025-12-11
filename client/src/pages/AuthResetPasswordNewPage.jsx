import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';
import { clearResetOtp, readResetOtp } from '../lib/resetFlowStorage';

const AuthResetPasswordNewPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, authStatus, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [otpValue, setOtpValue] = useState('');

  useEffect(() => {
    const stored = readResetOtp();
    const paramEmail = searchParams.get('email');
    const effectiveEmail = (paramEmail || stored?.email || '').toLowerCase();
    if (effectiveEmail) {
      setEmail(effectiveEmail);
    }
    if (stored?.otp) {
      setOtpValue(stored.otp);
    } else {
      setAuthError?.('Please enter your reset code before setting a new password.');
      navigate(
        `/auth/reset-password${effectiveEmail ? `?email=${encodeURIComponent(effectiveEmail)}` : ''}`,
        { replace: true }
      );
    }
  }, [navigate, searchParams, setAuthError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);

    if (newPassword !== confirmPassword) {
      setAuthError?.('Passwords do not match.');
      return;
    }
    if (!otpValue) {
      setAuthError?.('Enter the OTP on the previous step to continue.');
      navigate('/auth/reset-password');
      return;
    }

    try {
      const response = await resetPassword({ email, otp: otpValue, newPassword });
      setMessage(response?.message || 'Password updated. You are now signed in.');
      clearResetOtp();
      setTimeout(() => navigate('/', { replace: true }), 900);
    } catch (error) {
      // handled by context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Choose a new password</h1>
          <p>Set a fresh password to secure your account.</p>
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
              {authStatus === 'reset' ? 'Saving...' : 'Update password'}
            </button>
          </form>
          <p className="auth-footer-text">
            Wrong email or code?{' '}
            <Link to="/auth/forgot-password" className="text-link">
              Start over
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthResetPasswordNewPage;
