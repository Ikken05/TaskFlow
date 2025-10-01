import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout,
  getProfile
} from '../controllers/authController';
import { authenticate, createRateLimiter } from '../middleware/auth';

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
const generalRateLimit = createRateLimiter(10, 60 * 1000); // 10 requests per minute

// Public routes
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/verify-email', generalRateLimit, verifyEmail);
router.post('/resend-verification', authRateLimit, resendVerification);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;