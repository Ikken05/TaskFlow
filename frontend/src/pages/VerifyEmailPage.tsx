import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setLoading(true);
    setError('');

    try {
      await authService.verifyEmail(verificationToken);
      setMessage('Your email has been successfully verified! You can now sign in to your account.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.resendEmailVerification(email);
      setMessage('A new verification email has been sent to your email address.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <h1 className="auth-title">Verifying Your Email</h1>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Please wait while we verify your email address...
        </p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1 className="auth-title">Email Verification</h1>

      {!token && (
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
          We've sent a verification email to your address. Please check your inbox and click the verification link.
        </p>
      )}

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {message && (
        <div className="auth-link">
          <Link to="/signin">Continue to Sign In</Link>
        </div>
      )}

      {!message && !token && (
        <>
          <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>
            Didn't receive the email? Enter your email address to resend:
          </p>

          <form onSubmit={handleResendVerification}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>
        </>
      )}

      <div className="auth-link">
        <Link to="/signin">Back to Sign In</Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;