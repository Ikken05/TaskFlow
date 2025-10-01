import axios from 'axios';
import { errorLogger } from '../utils/errorLogger';

const API_BASE_URL = 'http://localhost:8001/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 Making API request: ${config.method?.toUpperCase()} ${config.url}`);

  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[${timestamp}] 🔑 Token added to request headers`);
  } else {
    console.log(`[${timestamp}] ⚠️  No auth token found in localStorage`);
  }

  // Log request data (excluding sensitive fields)
  if (config.data) {
    const logData = { ...config.data };
    if (logData.password) logData.password = '[REDACTED]';
    if (logData.newPassword) logData.newPassword = '[REDACTED]';
    console.log(`[${timestamp}] Request data:`, logData);
  }

  return config;
}, (error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ Request interceptor error:`, error);
  return Promise.reject(error);
});

// Add response interceptor for error logging
api.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ API response: ${response.status} ${response.statusText}`);
    console.log(`[${timestamp}] Response data:`, response.data);
    return response;
  },
  (error) => {
    // Use our error logger for API errors
    errorLogger.logApiError(error, {
      endpoint: error.config?.url || 'unknown',
      method: error.config?.method || 'unknown',
      component: 'AuthService',
      requestData: error.config?.data
    });

    return Promise.reject(error);
  }
);

interface CreateAccountData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authService = {
  // Sign in to existing account
  async signIn(email: string, password: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔑 Attempting sign in for: ${email}`);

    try {
      const response = await api.post('/login', { email, password });
      const { data } = response.data;

      if (data?.token && data?.user) {
        localStorage.setItem('authToken', data.token);
        console.log(`[${timestamp}] ✅ Sign in successful for: ${email}`);
        console.log(`[${timestamp}] User details:`, {
          id: data.user._id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          isEmailVerified: data.user.isEmailVerified
        });
        return { token: data.token, user: data.user };
      } else {
        console.error(`[${timestamp}] ❌ Unexpected response format:`, response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Sign in failed for: ${email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Create new account
  async createAccount(userData: CreateAccountData) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 Creating new account for: ${userData.email}`);

    try {
      const response = await api.post('/register', userData);
      console.log(`[${timestamp}] ✅ Account created successfully for: ${userData.email}`);
      console.log(`[${timestamp}] Registration response:`, {
        success: response.data.success,
        message: response.data.message,
        userId: response.data.data?.user?._id
      });
      return response.data;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Account creation failed for: ${userData.email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Request password reset
  async requestPasswordReset(email: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔑 Requesting password reset for: ${email}`);

    try {
      const response = await api.post('/forgot-password', { email });
      console.log(`[${timestamp}] ✅ Password reset request sent for: ${email}`);
      console.log(`[${timestamp}] Response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Password reset request failed for: ${email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔑 Resetting password with token: ${token.substring(0, 10)}...`);

    try {
      const response = await api.post('/reset-password', { token, password: newPassword });
      console.log(`[${timestamp}] ✅ Password reset successful`);
      console.log(`[${timestamp}] Response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Password reset failed`);
      console.error(`[${timestamp}] Token: ${token.substring(0, 10)}...`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Verify email with token
  async verifyEmail(token: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✉️ Verifying email with token: ${token.substring(0, 10)}...`);

    try {
      const response = await api.get(`/verify-email?token=${token}`);
      console.log(`[${timestamp}] ✅ Email verification successful`);
      console.log(`[${timestamp}] Response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Email verification failed`);
      console.error(`[${timestamp}] Token: ${token.substring(0, 10)}...`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Resend email verification
  async resendEmailVerification(email: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✉️ Resending verification email to: ${email}`);

    try {
      const response = await api.post('/resend-verification', { email });
      console.log(`[${timestamp}] ✅ Verification email resent to: ${email}`);
      console.log(`[${timestamp}] Response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Failed to resend verification email to: ${email}`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Get current user profile
  async getCurrentUser() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 👤 Fetching current user profile`);

    try {
      const response = await api.get('/profile');
      console.log(`[${timestamp}] ✅ User profile fetched successfully`);
      console.log(`[${timestamp}] User details:`, {
        id: response.data.data?.user?._id,
        email: response.data.data?.user?.email,
        firstName: response.data.data?.user?.firstName,
        isEmailVerified: response.data.data?.user?.isEmailVerified
      });
      return response.data.data.user;
    } catch (error: any) {
      console.error(`[${timestamp}] 🔥 Failed to fetch user profile`);
      console.error(`[${timestamp}] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Sign out
  signOut() {
    const timestamp = new Date().toISOString();
    const token = localStorage.getItem('authToken');

    if (token) {
      console.log(`[${timestamp}] 🚪 Signing out - removing auth token`);
      localStorage.removeItem('authToken');
      console.log(`[${timestamp}] ✅ Sign out successful`);
    } else {
      console.log(`[${timestamp}] ⚠️  Sign out called but no auth token found`);
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const timestamp = new Date().toISOString();
    const token = localStorage.getItem('authToken');
    const isAuth = !!token;

    console.log(`[${timestamp}] 🔍 Authentication check: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);

    if (isAuth) {
      console.log(`[${timestamp}] Token present (first 20 chars): ${token.substring(0, 20)}...`);
    }

    return isAuth;
  },

  // Get stored token
  getToken() {
    const timestamp = new Date().toISOString();
    const token = localStorage.getItem('authToken');

    if (token) {
      console.log(`[${timestamp}] 🔑 Retrieved auth token (first 20 chars): ${token.substring(0, 20)}...`);
    } else {
      console.log(`[${timestamp}] ⚠️  No auth token found in localStorage`);
    }

    return token;
  }
};