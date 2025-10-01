import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  role: 'user' | 'admin';
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      mentions: boolean;
      assignments: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  getFullName(): string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: Partial<IUser['preferences']>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Partial<IUser>;
    token?: string;
  };
}