import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import useAuth from '../hooks/useAuth';

const initialState = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
};

const AuthSignupPage = () => {
  const navigate = useNavigate();
  const { signup, authStatus, authError, setAuthError } = useAuth();
  const [form, setForm] = useState(initialState);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setAuthError?.(null);
    try {
      await signup(form);
      setSuccessMessage('Signup successful! Please check your email for the verification code.');
      navigate(`/auth/verify?email=${encodeURIComponent(form.email.toLowerCase())}`);
    } catch (error) {
      // error already handled via context
    }
  };

  return (
    <Layout>
      <section className="section auth-section">
        <div className="container auth-card">
          <h1>Create your account</h1>
          <p>We'll email you a one-time code to verify your address.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g., Sita Lakshmi"
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
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
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone (optional)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="WhatsApp or mobile number"
              />
            </div>
            {authError && <p className="form-error">{authError}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={authStatus === 'signup'}
            >
              {authStatus === 'signup' ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-link">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AuthSignupPage;
