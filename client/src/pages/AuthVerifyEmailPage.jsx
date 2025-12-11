import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const AuthVerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    pendingEmail,
    verifyEmail,
    resendOtp,
    authStatus,
    authError,
    setAuthError,
    accessToken,
    hydrated,
    user,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(paramEmail.toLowerCase());
    } else if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [searchParams, pendingEmail]);

  useEffect(() => {
    if (!hydrated) return;
    if (accessToken && user?.emailVerified !== false) {
      navigate('/', { replace: true });
    }
  }, [accessToken, hydrated, navigate, user?.emailVerified]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);
    try {
      await verifyEmail({ email, otp });
      setMessage('Email verified! Redirecting you to the home page.');
      setOtp('');
      setTimeout(() => navigate('/', { replace: true }), 900);
    } catch (error) {
      // handled via context
    }
  };

  const handleResend = async () => {
    if (!email) {
      setAuthError?.('Please enter your signup email to resend the OTP.');
      return;
    }
    setMessage('');
    setAuthError?.(null);
    try {
      await resendOtp({ email });
      setMessage('A new verification code has been sent to your email.');
    } catch (error) {
      // handled via context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Verify your email</h1>
          <p>Enter the 6-digit code sent to your inbox.</p>
          <form className="auth-form" onSubmit={handleVerify}>
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
              <label htmlFor="otp">Verification code</label>
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
            {authError && <p className="form-error">{authError}</p>}
            {message && <p className="form-success">{message}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={authStatus === 'verify'}
            >
              {authStatus === 'verify' ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <button
            type="button"
            className="btn-link"
            onClick={handleResend}
            disabled={authStatus === 'resend'}
          >
            {authStatus === 'resend' ? 'Sending...' : 'Resend code'}
          </button>
          <p className="auth-footer-text">
            Need to create an account?{' '}
            <Link to="/auth/signup" className="text-link">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthVerifyEmailPage;
