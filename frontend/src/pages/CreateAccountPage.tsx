import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const CreateAccountPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 CreateAccountPage component mounted`);
    console.log(`[${timestamp}] Current auth status: ${authService.isAuthenticated() ? 'Authenticated' : 'Not authenticated'}`);

    // If user is already authenticated, redirect to dashboard
    if (authService.isAuthenticated()) {
      console.log(`[${timestamp}] User already authenticated, redirecting to dashboard`);
      navigate('/dashboard');
    }

    return () => {
      console.log(`[${new Date().toISOString()}] 📝 CreateAccountPage component unmounted`);
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

    console.log(`[${timestamp}] 🚀 CreateAccount form submitted`);
    console.log(`[${timestamp}] Account details:`, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      passwordLength: formData.password.length,
      confirmPasswordLength: formData.confirmPassword.length
    });

    setLoading(true);
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      console.warn(`[${timestamp}] ⚠️  Password confirmation mismatch`);
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      console.warn(`[${timestamp}] ⚠️  Password too short: ${formData.password.length} characters`);
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const requiredFields = ['firstName', 'lastName', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      console.warn(`[${timestamp}] ⚠️  Missing required fields: ${missingFields.join(', ')}`);
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    console.log(`[${timestamp}] ✅ Client-side validation passed`);

    try {
      const result = await authService.createAccount({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      console.log(`[${timestamp}] ✅ Account creation successful, navigating to verify-email`);
      console.log(`[${timestamp}] Server response:`, {
        success: result.success,
        message: result.message,
        userId: result.data?.user?._id
      });
      navigate('/verify-email');
    } catch (err: any) {
      const errorId = Math.random().toString(36).substr(2, 9);
      console.error(`[${timestamp}] 🔥 Account creation failed [ID: ${errorId}]:`);
      console.error(`[${timestamp}] Email attempted: ${formData.email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        serverMessage: err.response?.data?.message,
        errorId: err.response?.data?.errorId
      });

      // Set user-friendly error message
      let errorMessage = 'Account creation failed. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Please check your input and try again.';
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
      <h1 className="auth-title">Join TaskFlow</h1>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
        Create your account to get started
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName" className="form-label">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Enter your last name"
          />
        </div>

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
            placeholder="Create a password (min. 8 characters)"
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-link">
        Already have an account? <Link to="/signin">Sign in here</Link>
      </div>
    </div>
  );
};

export default CreateAccountPage;