import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.requestPasswordReset(email);
      setMessage('Password reset instructions have been sent to your email address.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Reset Your Password</h1>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
        Enter your email address and we'll send you instructions to reset your password
      </p>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSubmit}>
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
          disabled={loading}
        >
          {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
        </button>
      </form>

      <div className="auth-link">
        Remember your password? <Link to="/signin">Sign in here</Link>
      </div>

      <div className="auth-link">
        Don't have an account? <Link to="/create-account">Create one here</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;