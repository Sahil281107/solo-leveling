// File: backend/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    username: string;
    user_type: 'adventurer' | 'coach' | 'admin';
    session_id?: string;
    is_active: boolean;
    adminProfile?: any;
    isHardcodedAdmin?: boolean;
  };
}

// Helper function to validate session in database
const validateSessionInDB = async (sessionId: string, userId: number): Promise<boolean> => {
  const connection = await pool.getConnection();
  
  try {
    const [sessions]: any = await connection.execute(
      'SELECT * FROM user_sessions WHERE session_id = ? AND user_id = ? AND is_active = true',
      [sessionId, userId]
    );
    
    if (sessions.length === 0) {
      return false;
    }
    
    const session = sessions[0];
    const now = new Date();
    const lastActivity = new Date(session.last_activity);
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now.getTime() - lastActivity.getTime() > sessionTimeout) {
      // Session expired, mark as inactive
      await connection.execute(
        'UPDATE user_sessions SET is_active = false WHERE session_id = ?',
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
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
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
    
    // ==================== HANDLE HARDCODED ADMIN ====================
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
    
    // Validate session if present
    if (decoded.session_id) {
      const isValidSession = await validateSessionInDB(decoded.session_id, decoded.user_id);
      if (!isValidSession) {
        return res.status(401).json({ 
          error: 'Invalid or expired session',
          code: 'INVALID_SESSION'
        });
      }
    }
    
    // Fetch fresh user data from database
    const [users]: any = await connection.execute(
      'SELECT user_id, email, username, user_type, is_active, created_at FROM users WHERE user_id = ? AND is_active = true',
      [decoded.user_id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    
    // Attach user data to request
    req.user = {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      user_type: user.user_type,
      session_id: decoded.session_id,
      is_active: user.is_active
    };
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  } finally {
    connection.release();
  }
};

// Authorization middleware for role-based access control
export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userType = req.user.user_type;
    
    if (!roles.includes(userType)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        required_roles: roles,
        user_role: userType
      });
    }
    
    next();
  };
};

// Middleware specifically for admin access (alternative to authorizeRole(['admin']))
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const connection = await pool.getConnection();
  
  try {
    // User should already be authenticated via authenticate middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Handle hardcoded admin (skip database checks)
    if (req.user.isHardcodedAdmin) {
      return next();
    }

    // Optional: Check IP whitelist if enabled (for regular admin accounts)
    const [ipWhitelistSetting]: any = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['ip_whitelist_enabled']
    );

    if (ipWhitelistSetting.length > 0 && ipWhitelistSetting[0].setting_value === 'true') {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      const [whitelist]: any = await connection.execute(
        'SELECT * FROM admin_ip_whitelist WHERE ip_address = ? AND is_active = true',
        [clientIP]
      );

      if (whitelist.length === 0) {
        // Log unauthorized access attempt
        await connection.execute(
          'INSERT INTO system_error_logs (error_level, error_message, endpoint, method, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            'warn',
            `Unauthorized admin access attempt from IP: ${clientIP}`,
            req.path,
            req.method,
            req.user.user_id,
            clientIP,
            req.get('User-Agent')
          ]
        );

        return res.status(403).json({ 
          error: 'Access denied: IP not whitelisted' 
        });
      }
    }

    // Check admin profile exists
    const [adminProfile]: any = await connection.execute(
      'SELECT * FROM admin_profiles WHERE user_id = ?',
      [req.user.user_id]
    );

    if (adminProfile.length === 0) {
      return res.status(403).json({ 
        error: 'Admin profile not found' 
      });
    }

    // Attach admin profile to request for use in routes
    req.user.adminProfile = adminProfile[0];
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  } finally {
    connection.release();
  }
};

// Check specific admin permissions
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const adminProfile = req.user?.adminProfile;
      
      if (!adminProfile) {
        return res.status(403).json({ error: 'Admin profile required' });
      }

      // SUPER_ADMIN has all permissions
      if (adminProfile.access_level === 'SUPER_ADMIN') {
        return next();
      }

      // Check specific permission
      let permissions;
      try {
        permissions = typeof adminProfile.permissions === 'string' 
          ? JSON.parse(adminProfile.permissions)
          : adminProfile.permissions;
      } catch (parseError) {
        console.error('Error parsing admin permissions:', parseError);
        return res.status(403).json({ error: 'Invalid permissions configuration' });
      }

      if (!permissions || !permissions.includes(permission)) {
        return res.status(403).json({ 
          error: `Permission denied: ${permission} required`,
          required_permission: permission,
          user_permissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
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