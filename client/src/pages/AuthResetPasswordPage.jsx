import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';
import { clearResetOtp, persistResetOtp } from '../lib/resetFlowStorage';

const AuthResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pendingEmail, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    clearResetOtp();
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(paramEmail.toLowerCase());
      return;
    }
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail, searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setAuthError?.(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setAuthError?.('Enter the OTP sent to your email.');
      return;
    }

    persistResetOtp({ email, otp: trimmedOtp });
    setMessage('Code captured. Continue to set a new password.');
    navigate(`/auth/reset-password/new?email=${encodeURIComponent(email.toLowerCase())}`);
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Enter reset code</h1>
          <p>Check your email for the 6-digit code and enter it to continue.</p>
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
            {authError && <p className="form-error">{authError}</p>}
            {message && <p className="form-success">{message}</p>}
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </form>
          <p className="auth-footer-text">
            Didn&apos;t get a code?{' '}
            <Link to="/auth/forgot-password" className="text-link">
              Resend reset code
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthResetPasswordPage;
