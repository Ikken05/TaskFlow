import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../types/user.types';

// Environment variables (you'll need to add these to your .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔑 Generating access token for user: ${user.email}`);

  const payload: JwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'taskflow-api',
      audience: 'taskflow-app'
    });
    console.log(`[${timestamp}] ✅ Access token generated successfully for user: ${user.email}`);
    return token;
  } catch (error: any) {
    console.error(`[${timestamp}] ❌ Error generating access token:`);
    console.error(`[${timestamp}] User ID: ${user._id}`);
    console.error(`[${timestamp}] User email: ${user.email}`);
    console.error(`[${timestamp}] Error: ${error.message}`);
    throw error;
  }
};

export const generateRefreshToken = (userId: string): string => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔑 Generating refresh token for user ID: ${userId}`);

  try {
    const token = jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      {
        expiresIn: '30d',
        issuer: 'taskflow-api',
        audience: 'taskflow-app'
      }
    );
    console.log(`[${timestamp}] ✅ Refresh token generated successfully for user ID: ${userId}`);
    return token;
  } catch (error: any) {
    console.error(`[${timestamp}] ❌ Error generating refresh token:`);
    console.error(`[${timestamp}] User ID: ${userId}`);
    console.error(`[${timestamp}] Error: ${error.message}`);
    throw error;
  }
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Verifying access token`);

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'taskflow-api',
      audience: 'taskflow-app'
    }) as JwtPayload;
    console.log(`[${timestamp}] ✅ Access token verified successfully for user: ${payload.email}`);
    return payload;
  } catch (error: any) {
    console.warn(`[${timestamp}] ⚠️  Access token verification failed:`);
    console.warn(`[${timestamp}] Error name: ${error.name}`);
    console.warn(`[${timestamp}] Error message: ${error.message}`);
    console.warn(`[${timestamp}] Token (first 20 chars): ${token.substring(0, 20)}...`);
    throw new Error(`Invalid or expired access token: ${error.message}`);
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Verifying refresh token`);

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'taskflow-api',
      audience: 'taskflow-app'
    }) as { userId: string };
    console.log(`[${timestamp}] ✅ Refresh token verified successfully for user ID: ${payload.userId}`);
    return payload;
  } catch (error: any) {
    console.warn(`[${timestamp}] ⚠️  Refresh token verification failed:`);
    console.warn(`[${timestamp}] Error name: ${error.name}`);
    console.warn(`[${timestamp}] Error message: ${error.message}`);
    console.warn(`[${timestamp}] Token (first 20 chars): ${token.substring(0, 20)}...`);
    throw new Error(`Invalid or expired refresh token: ${error.message}`);
  }
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  const timestamp = new Date().toISOString();

  if (!authHeader) {
    console.warn(`[${timestamp}] ⚠️  No authorization header provided`);
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.warn(`[${timestamp}] ⚠️  Authorization header doesn't start with 'Bearer ': ${authHeader.substring(0, 20)}...`);
    return null;
  }

  const token = authHeader.substring(7);
  console.log(`[${timestamp}] 🔑 Token extracted from header (first 20 chars): ${token.substring(0, 20)}...`);
  return token;
};