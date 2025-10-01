import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../Models/user';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import {
  RegisterUserInput,
  LoginUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthResponse
} from '../types/user.types';
import { AuthenticatedRequest } from '../middleware/auth';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: RegisterUserInput = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'All fields are required.'
      } as AuthResponse);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      } as AuthResponse);
      return;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
      console.log(`[${new Date().toISOString()}] ✉️ Verification email sent successfully to: ${user.email}`);
    } catch (emailError: any) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ❌ Failed to send verification email:`);
      console.error(`[${timestamp}] Email: ${user.email}`);
      console.error(`[${timestamp}] Error name: ${emailError.name}`);
      console.error(`[${timestamp}] Error message: ${emailError.message}`);
      console.error(`[${timestamp}] Stack trace:`, emailError.stack);
      // Continue registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified
        }
      }
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 REGISTRATION ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Error code: ${error.code}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] User Agent: ${req.get('User-Agent')}`);
    console.error(`[${timestamp}] Attempted email: ${req.body.email}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    if (error.code === 11000) {
      console.warn(`[${timestamp}] Duplicate email registration attempt: ${req.body.email}`);
      res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
        errorId: errorId
      } as AuthResponse);
      return;
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      console.warn(`[${timestamp}] Validation errors: ${messages.join(', ')}`);
      res.status(400).json({
        success: false,
        message: messages.join('. '),
        errorId: errorId
      } as AuthResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginUserInput = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      } as AuthResponse);
      return;
    }

    // Find user and include password for comparison
    console.log(`[${new Date().toISOString()}] 🔍 Login attempt for email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.warn(`[${new Date().toISOString()}] ⚠️  Login failed - user not found: ${email}`);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      } as AuthResponse);
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      } as AuthResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.warn(`[${new Date().toISOString()}] ⚠️  Login failed - invalid password for user: ${email}`);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      } as AuthResponse);
      return;
    }

    console.log(`[${new Date().toISOString()}] ✅ Login successful for user: ${email}`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          preferences: user.preferences,
          lastLogin: user.lastLogin
        },
        token: accessToken
      }
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 LOGIN ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] User Agent: ${req.get('User-Agent')}`);
    console.error(`[${timestamp}] Attempted email: ${req.body.email}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invalid verification token.'
      } as AuthResponse);
      return;
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.'
      } as AuthResponse);
      return;
    }

    // Mark email as verified and clear verification fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
      console.log(`[${new Date().toISOString()}] ✉️ Welcome email sent successfully to: ${user.email}`);
    } catch (emailError: any) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ❌ Failed to send welcome email:`);
      console.error(`[${timestamp}] Email: ${user.email}`);
      console.error(`[${timestamp}] Error name: ${emailError.name}`);
      console.error(`[${timestamp}] Error message: ${emailError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified
        }
      }
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 EMAIL VERIFICATION ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Token: ${req.query.token}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Resend verification email
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required.'
      } as AuthResponse);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      } as AuthResponse);
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified.'
      } as AuthResponse);
      return;
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully.'
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 RESEND VERIFICATION ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Email: ${req.body.email}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to send verification email.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email }: ForgotPasswordInput = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required.'
      } as AuthResponse);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      } as AuthResponse);
      return;
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
      console.log(`[${new Date().toISOString()}] 📧 Password reset email sent successfully to: ${user.email}`);
    } catch (emailError: any) {
      const timestamp = new Date().toISOString();
      const errorId = crypto.randomUUID();
      console.error(`[${timestamp}] ❌ Failed to send password reset email [ID: ${errorId}]:`);
      console.error(`[${timestamp}] Email: ${user.email}`);
      console.error(`[${timestamp}] Error name: ${emailError.name}`);
      console.error(`[${timestamp}] Error message: ${emailError.message}`);
      console.error(`[${timestamp}] Stack trace:`, emailError.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email.',
        errorId: errorId
      } as AuthResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 FORGOT PASSWORD ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Email: ${req.body.email}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword }: ResetPasswordInput = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      } as AuthResponse);
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      } as AuthResponse);
      return;
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      } as AuthResponse);
      return;
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    } as AuthResponse);

  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 RESET PASSWORD ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Token provided: ${!!req.body.token}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset.',
      errorId: errorId
    } as AuthResponse);
  }
};

// Logout
export const logout = (req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  } as AuthResponse);
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: {
        user: req.user
      }
    } as AuthResponse);
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] 🔥 GET PROFILE ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] User ID: ${req.user?._id}`);
    console.error(`[${timestamp}] Request IP: ${req.ip}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      errorId: errorId
    } as AuthResponse);
  }
};