// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
const jwt = require('jsonwebtoken');

export interface AuthRequest extends Request {
  user?: any;
}

// Helper function to validate session in database
const validateSessionInDB = async (sessionId: string, userId: number): Promise<boolean> => {
  const connection = await pool.getConnection();
  
  try {
    const [sessions]: any = await connection.execute(
      'SELECT session_id, expires_at FROM user_sessions WHERE session_id = ? AND user_id = ?',
      [sessionId, userId]
    );
    
    if (sessions.length === 0) {
      return false;
    }
    
    const session = sessions[0];
    const now = new Date();
    const expiry = new Date(session.expires_at);
    
    // Check if session has expired
    if (now > expiry) {
      // Clean up expired session
      await connection.execute(
        'DELETE FROM user_sessions WHERE session_id = ?',
        [sessionId]
      );
      return false;
    }
    
    // Update last activity timestamp
    await connection.execute(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
      [sessionId]
    );
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  } finally {
    connection.release();
  }
};

// Main authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const connection = await pool.getConnection();
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    } catch (jwtError: any) {
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else {
        return res.status(401).json({ 
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }
    
    // ==================== HANDLE HARDCODED ADMIN (ADD THIS) ====================
// Check if this is the hardcoded admin
if (decoded.isHardcodedAdmin && decoded.user_type === 'admin') {
  console.log('✅ Authenticated as hardcoded admin');
  
  // Attach admin data to request (no database check needed)
  req.user = {
    user_id: decoded.user_id,
    email: decoded.email,
    user_type: 'admin',
    session_id: decoded.session_id,
    username: 'SystemAdmin',
    is_active: true,
    isHardcodedAdmin: true
  };
  
  connection.release();
  return next();
}
// ==================== END HARDCODED ADMIN HANDLING ====================

    // Validate session in database only if session_id exists in token
    // This provides backward compatibility with tokens that don't have session_id
    if (decoded.session_id) {
      try {
        const isValidSession = await validateSessionInDB(decoded.session_id, decoded.user_id);
        if (!isValidSession) {
          return res.status(401).json({ 
            error: 'Session expired or invalid',
            code: 'SESSION_EXPIRED'
          });
        }
      } catch (sessionError) {
        console.error('Session validation error:', sessionError);
        // Continue without session validation if there's a database error
        // This prevents the system from breaking due to temporary DB issues
        console.warn('Continuing without session validation due to DB error');
      }
    }
    
    // Validate user still exists and is active
    const [users]: any = await connection.execute(
      'SELECT user_id, username, is_active FROM users WHERE user_id = ?',
      [decoded.user_id]
    );
    
    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ 
        error: 'User account not found or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Attach user data to request
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      user_type: decoded.user_type,
      session_id: decoded.session_id,
      username: users[0].username,
      is_active: users[0].is_active
    };
    
    next();
    
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  } finally {
    connection.release();
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userType = req.user?.user_type;
    
    if (!userType) {
      return res.status(401).json({ error: 'User type not found' });
    }
    
    if (!roles.includes(userType)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required_roles: roles,
        user_role: userType
      });
    }
    
    next();
  };
};

// Middleware to check if user is active adventurer
export const requireActiveAdventurer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'adventurer') {
    return res.status(403).json({ error: 'This endpoint is only for adventurers' });
  }
  
  if (!req.user?.is_active) {
    return res.status(403).json({ error: 'Account is not active' });
  }
  
  next();
};

// Middleware to check if user is active coach
export const requireActiveCoach = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'coach') {
    return res.status(403).json({ error: 'This endpoint is only for coaches' });
  }
  
  if (!req.user?.is_active) {
    return res.status(403).json({ error: 'Account is not active' });
  }
  
  next();
};

// Middleware for optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Validate session if present
    if (decoded.session_id) {
      try {
        const isValidSession = await validateSessionInDB(decoded.session_id, decoded.user_id);
        if (!isValidSession) {
          // Invalid session, continue without authentication
          return next();
        }
      } catch (sessionError) {
        // Session validation failed, continue without authentication
        console.warn('Session validation failed in optionalAuth:', sessionError);
        return next();
      }
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid, continue without authentication
    next();
  }
};

// Rate limiting middleware for auth endpoints
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [ip, data] of attempts.entries()) {
      if (now > data.resetTime) {
        attempts.delete(ip);
      }
    }
    
    const clientAttempts = attempts.get(clientIP);
    
    if (!clientAttempts) {
      attempts.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientAttempts.count >= maxAttempts) {
      return res.status(429).json({ 
        error: 'Too many authentication attempts. Please try again later.',
        retry_after: Math.ceil((clientAttempts.resetTime - now) / 1000)
      });
    }
    
    clientAttempts.count++;
    next();
  };
};