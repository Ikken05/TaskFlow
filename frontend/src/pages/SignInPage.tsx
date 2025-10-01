import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const SignInPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 SignInPage component mounted`);
    console.log(`[${timestamp}] Current auth status: ${authService.isAuthenticated() ? 'Authenticated' : 'Not authenticated'}`);

    // If user is already authenticated, redirect to dashboard
    if (authService.isAuthenticated()) {
      console.log(`[${timestamp}] User already authenticated, redirecting to dashboard`);
      navigate('/dashboard');
    }

    return () => {
      console.log(`[${new Date().toISOString()}] 📝 SignInPage component unmounted`);
    };
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] 🚀 SignIn form submitted`);
    console.log(`[${timestamp}] Email: ${formData.email}`);
    console.log(`[${timestamp}] Form validation: ${formData.email && formData.password ? 'Valid' : 'Invalid'}`);

    setLoading(true);
    setError('');

    try {
      const result = await authService.signIn(formData.email, formData.password);
      console.log(`[${timestamp}] ✅ SignIn successful, navigating to dashboard`);
      console.log(`[${timestamp}] User authenticated:`, {
        id: result.user._id,
        email: result.user.email,
        emailVerified: result.user.isEmailVerified
      });
      navigate('/dashboard');
    } catch (err: any) {
      const errorId = Math.random().toString(36).substr(2, 9);
      console.error(`[${timestamp}] 🔥 SignIn failed [ID: ${errorId}]:`);
      console.error(`[${timestamp}] Email attempted: ${formData.email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        serverMessage: err.response?.data?.message,
        errorId: err.response?.data?.errorId
      });

      // Set user-friendly error message
      let errorMessage = 'Sign in failed. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Welcome Back</h1>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
        Sign in to your TaskFlow account
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-link">
        <Link to="/forgot-password">Forgot your password?</Link>
      </div>

      <div className="auth-link">
        Don't have an account? <Link to="/create-account">Create one here</Link>
      </div>
    </div>
  );
};

export default SignInPage;