import { Request, Response, NextFunction } from 'express';
import { User } from '../Models/user';
import { verifyAccessToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import crypto from 'crypto';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: any;
}

// Middleware to protect routes - requires valid JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  console.log(`[${timestamp}] 🔐 Authentication attempt from IP: ${ip}`);

  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.warn(`[${timestamp}] ⚠️  Authentication failed - no token provided (IP: ${ip})`);
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Verify the token
    let decoded: JwtPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      console.warn(`[${timestamp}] ⚠️  Token verification failed (IP: ${ip}): ${error.message}`);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
      return;
    }

    // Find the user and attach to request
    console.log(`[${timestamp}] 🔍 Looking up user: ${decoded.email}`);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.warn(`[${timestamp}] ⚠️  User not found for ID: ${decoded.userId} (${decoded.email})`);
      res.status(401).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn(`[${timestamp}] ⚠️  Inactive account access attempt: ${user.email}`);
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated.'
      });
      return;
    }

    console.log(`[${timestamp}] ✅ Authentication successful for user: ${user.email}`);
    req.user = user;
    next();
  } catch (error: any) {
    const errorId = crypto.randomUUID();
    console.error(`[${timestamp}] 🔥 AUTHENTICATION ERROR [ID: ${errorId}]:`);
    console.error(`[${timestamp}] IP: ${ip}`);
    console.error(`[${timestamp}] User-Agent: ${userAgent}`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      errorId: errorId
    });
  }
};

// Middleware to check if user's email is verified
export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  if (!req.user.isEmailVerified) {
    console.warn(`[${timestamp}] ⚠️  Unverified email access attempt: ${req.user.email}`);
    res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.'
    });
    return;
  }

  console.log(`[${timestamp}] ✅ Email verification check passed for: ${req.user.email}`);
  next();
};

// Middleware to check user roles
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const timestamp = new Date().toISOString();

    if (!req.user) {
      console.warn(`[${timestamp}] ⚠️  Authorization failed - no authenticated user`);
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`[${timestamp}] ⚠️  Authorization failed - insufficient permissions:`);
      console.warn(`[${timestamp}] User: ${req.user.email}`);
      console.warn(`[${timestamp}] User role: ${req.user.role}`);
      console.warn(`[${timestamp}] Required roles: ${roles.join(', ')}`);
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource.'
      });
      return;
    }

    console.log(`[${timestamp}] ✅ Authorization successful - User: ${req.user.email}, Role: ${req.user.role}`);
    next();
  };
};

// Optional authentication middleware - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently ignore invalid tokens in optional auth
        console.log('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Rate limiting middleware (basic implementation)
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const clients = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const client = clients.get(clientId);

    if (!client) {
      clients.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      next();
      return;
    }

    if (client.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((client.resetTime - now) / 1000)
      });
      return;
    }

    client.count++;
    next();
  };
};