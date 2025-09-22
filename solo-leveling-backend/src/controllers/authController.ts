import { Request, Response } from 'express';
import pool from '../config/database';
import prisma from '../config/prisma'; 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const crypto = require('crypto');

// Helper function to get client IP address
const getClientIP = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string) ||
         (req.headers['x-real-ip'] as string) ||
         (req.connection?.remoteAddress) ||
         (req.socket?.remoteAddress) ||
         req.ip ||
         'unknown';
};

// Helper function to get user agent
const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

// Generate session ID
const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const signup = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      email, 
      username, 
      password, 
      user_type, 
      full_name, 
      field_of_interest, 
      commitment_level, 
      experience_level 
    } = req.body;
    
    // Check if user exists
    const [existing]: any = await connection.execute(
      'SELECT user_id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Handle profile photo
    let profilePhotoUrl = null;
if (req.file) {
  const file = req.file as any;
 profilePhotoUrl = `/uploads/profiles/${file.filename}`;

  // Move file from temp to profiles
  const oldPath = file.path;
  const newPath = `uploads/profiles/${file.filename}`;
  await fs.rename(oldPath, newPath);
    }
    
    // Create user
    const [userResult]: any = await connection.execute(
      'INSERT INTO users (email, username, password_hash, user_type, profile_photo_url) VALUES (?, ?, ?, ?, ?)',
      [email, username, hashedPassword, user_type, profilePhotoUrl]
    );
    
    const userId = userResult.insertId;
    
    // Create profile based on user type
    if (user_type === 'adventurer') {
      await connection.execute(
        'INSERT INTO adventurer_profiles (user_id, full_name, field_of_interest, commitment_level, experience_level) VALUES (?, ?, ?, ?, ?)',
        [userId, full_name, field_of_interest, commitment_level, experience_level]
      );
    } else if (user_type === 'coach') {
      await connection.execute(
        'INSERT INTO coach_profiles (user_id, full_name, specialization) VALUES (?, ?, ?)',
        [userId, full_name, field_of_interest]
      );
    }
    
    await connection.commit();
    
    // Generate token
    const token = jwt.sign(
      { user_id: userId, email, user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Log signup activity
    try {
      await connection.execute(
        'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [userId, 'signup', JSON.stringify({ account_created: true }), getClientIP(req), getUserAgent(req)]
      );
    } catch (logError) {
      console.warn('Failed to log signup activity:', logError);
    }
    console.log("DEBUG signup user response:", {
  user_id: userId,
  email,
  username,
  user_type,
  profile_photo_url: profilePhotoUrl
    ? `${process.env.BASE_URL || 'http://localhost:5000'}${profilePhotoUrl}`
    : null
});
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        user_id: userId,
        email,
        username,
        user_type,
        profile_photo_url: profilePhotoUrl
         ? `${process.env.BASE_URL || 'http://localhost:5000'}${profilePhotoUrl}`
      : null
      }
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    connection.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email, password } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // ==================== HARDCODED ADMIN CHECK (ADD THIS) ====================
// Check if this is an admin login attempt
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sololeveling.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

if (email === ADMIN_EMAIL) {
  // Admin login - verify password directly (no bcrypt for admin)
  if (password !== ADMIN_PASSWORD) {
    console.log('❌ Admin login failed: Invalid password');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('✅ Admin login successful');

  // Generate session ID and JWT token for admin
  const sessionId = generateSessionId();
  const adminUserId = 9999; // Virtual admin user ID

  const token = jwt.sign(
    { 
      user_id: adminUserId,
      email: ADMIN_EMAIL,
      user_type: 'admin',
      session_id: sessionId,
      isHardcodedAdmin: true // Special flag for admin
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Log admin login action using Prisma
  try {
    await prisma.adminActionLog.create({
      data: {
        admin_user_id: adminUserId,
        action_type: 'ADMIN_LOGIN',
        action_details: {
          login_time: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
          type: 'hardcoded_admin'
        },
        ip_address: clientIP,
        user_agent: userAgent
      }
    });
  } catch (logError) {
    console.warn('Failed to log admin action:', logError);
  }

  await connection.commit();
  connection.release();

  // Return admin response
  return res.json({
    message: 'Admin login successful',
    token,
    user: {
      user_id: adminUserId,
      email: ADMIN_EMAIL,
      username: 'SystemAdmin',
      user_type: 'admin',
      profile_photo_url: null,
      is_active: true
    },
    profile: {
      full_name: 'System Administrator',
      department: 'System Administration',
      access_level: 'SUPER_ADMIN'
    },
    session: {
      session_id: sessionId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
}
// ==================== END HARDCODED ADMIN CHECK ====================

    // Get user with additional fields for security
    const [users]: any = await connection.execute(
      'SELECT user_id, email, username, password_hash, user_type, profile_photo_url, is_active, email_verified FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      // Log failed login attempt
      try {
        await connection.execute(
          'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
          [null, 'login_failed', JSON.stringify({ reason: 'user_not_found', email: email }), clientIP, userAgent]
        );
      } catch (logError) {
        console.warn('Failed to log failed login attempt:', logError);
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check if user account is active
    if (!user.is_active) {
      // Log failed login attempt
      try {
        await connection.execute(
          'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
          [user.user_id, 'login_failed', JSON.stringify({ reason: 'account_inactive' }), clientIP, userAgent]
        );
      } catch (logError) {
        console.warn('Failed to log failed login attempt:', logError);
      }
      
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed login attempt
      try {
        await connection.execute(
          'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
          [user.user_id, 'login_failed', JSON.stringify({ reason: 'invalid_password' }), clientIP, userAgent]
        );
      } catch (logError) {
        console.warn('Failed to log failed login attempt:', logError);
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate session ID and JWT token
    const sessionId = generateSessionId();
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        email: user.email, 
        user_type: user.user_type,
        session_id: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create session in database (this will trigger the update_last_login trigger)
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 7); // 7 days from now
    
    try {
      await connection.execute(
        'INSERT INTO user_sessions (session_id, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [sessionId, user.user_id, sessionExpiry, clientIP, userAgent]
      );
    } catch (sessionError) {
      console.error('Failed to create session:', sessionError);
      // Continue without session creation if it fails
    }
    
    // Get user profile
   // Get user profile based on user type
let profile = null;
if (user.user_type === 'adventurer') {
  // Keep existing MySQL connection for adventurer
  const [profiles]: any = await connection.execute(
    'SELECT * FROM adventurer_profiles WHERE user_id = ?',
    [user.user_id]
  );
  profile = profiles[0];
} else if (user.user_type === 'coach') {
  // Keep existing MySQL connection for coach
  const [profiles]: any = await connection.execute(
    'SELECT * FROM coach_profiles WHERE user_id = ?',
    [user.user_id]
  );
  profile = profiles[0];
} else if (user.user_type === 'admin') {
  // USE PRISMA ONLY FOR ADMIN
  try {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { user_id: user.user_id }
    });
    
    if (adminProfile) {
      // Update admin's last action using Prisma
      await prisma.adminProfile.update({
        where: { user_id: user.user_id },
        data: {
          last_action: 'LOGIN',
          last_action_date: new Date()
        }
      });
      
      // Log admin login action using Prisma
      await prisma.adminActionLog.create({
        data: {
          admin_user_id: user.user_id,
          action_type: 'ADMIN_LOGIN',
          action_details: {
            login_time: new Date().toISOString(),
            ip_address: clientIP,
            user_agent: userAgent
          },
          ip_address: clientIP,
          user_agent: userAgent
        }
      });
      
      profile = adminProfile;
    }
  } catch (prismaError) {
    console.error('Prisma admin profile error:', prismaError);
    // If Prisma fails, you can fallback to regular query or handle the error
  }
}
    
    // Update last login manually if triggers don't work
    try {
      await connection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [user.user_id]
      );
    } catch (updateError) {
      console.warn('Failed to update last_login:', updateError);
    }
    
    // Log successful login activity manually if trigger doesn't work
    try {
      await connection.execute(
        'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [user.user_id, 'login', JSON.stringify({ 
          session_created: true, 
          session_id: sessionId,
          login_time: new Date().toISOString()
        }), clientIP, userAgent]
      );
    } catch (logError) {
      console.warn('Failed to log login activity:', logError);
    }
    
    await connection.commit();
    
    // Clean up old sessions (optional, for maintenance)
    try {
      await connection.execute(
        'DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()',
        [user.user_id]
      );
    } catch (cleanupError) {
      console.warn('Failed to cleanup old sessions:', cleanupError);
    }
    console.log("DEBUG login user response:", {
  user_id: user.user_id,
  email: user.email,
  username: user.username,
  user_type: user.user_type,
  profile_photo_url: user.profile_photo_url
    ? `${process.env.BASE_URL || 'http://localhost:5000'}${user.profile_photo_url}`
    : null
});
    res.json({
  message: 'Login successful',
  token,
  user: {
    user_id: user.user_id,
    email: user.email,
    username: user.username,
    user_type: user.user_type,
    profile_photo_url: user.profile_photo_url 
      ? `${process.env.BASE_URL || 'http://localhost:5000'}${user.profile_photo_url}`
      : null
  },
  profile,
  session: {
    session_id: sessionId,
    expires_at: sessionExpiry
  }
});
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  } finally {
    connection.release();
  }
};

// New logout function to handle session cleanup
export const logout = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Decode token to get session info
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      const userId = decoded.user_id;
      const sessionId = decoded.session_id;
      
      // Remove session from database
      if (sessionId) {
        await connection.execute(
          'DELETE FROM user_sessions WHERE session_id = ? AND user_id = ?',
          [sessionId, userId]
        );
      }
      
      // Log logout activity
      try {
        await connection.execute(
          'INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
          [userId, 'logout', JSON.stringify({ 
            session_ended: true,
            session_id: sessionId,
            logout_time: new Date().toISOString()
          }), getClientIP(req), getUserAgent(req)]
        );
      } catch (logError) {
        console.warn('Failed to log logout activity:', logError);
      }
    }
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  } finally {
    connection.release();
  }
};

// Function to validate session (for middleware use)
export const validateSession = async (sessionId: string, userId: number): Promise<boolean> => {
  const connection = await pool.getConnection();
  
  try {
    const [sessions]: any = await connection.execute(
      'SELECT session_id FROM user_sessions WHERE session_id = ? AND user_id = ? AND expires_at > NOW()',
      [sessionId, userId]
    );
    
    return sessions.length > 0;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  } finally {
    connection.release();
  }
};

// Function to get login statistics (for admin/analytics)
export const getLoginStats = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    // Get recent login activities
    const [recentLogins]: any = await connection.execute(`
      SELECT 
        u.username,
        u.email,
        al.created_at as login_time,
        al.ip_address,
        al.activity_details
      FROM activity_logs al
      JOIN users u ON al.user_id = u.user_id
      WHERE al.activity_type = 'login'
      ORDER BY al.created_at DESC
      LIMIT 50
    `);
    
    // Get daily login counts for the last 30 days
    const [dailyStats]: any = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as login_count
      FROM activity_logs
      WHERE activity_type = 'login' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    // Get total active sessions
    const [activeSessions]: any = await connection.execute(`
      SELECT COUNT(*) as active_sessions
      FROM user_sessions
      WHERE expires_at > NOW()
    `);
    
    res.json({
      recent_logins: recentLogins,
      daily_stats: dailyStats,
      active_sessions: activeSessions[0].active_sessions
    });
    
  } catch (error: any) {
    console.error('Failed to get login stats:', error);
    res.status(500).json({ error: 'Failed to retrieve login statistics' });
  } finally {
    connection.release();
  }
};