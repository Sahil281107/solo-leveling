import { Request, Response } from 'express';
import prisma from '../config/prisma';
import  pool from '../config/database'; // For non-Prisma operations if needed

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      adventurerCount,
      coachCount,
      adminCount,
      activeUsers,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { user_type: 'adventurer' } }),
      prisma.user.count({ where: { user_type: 'coach' } }),
      prisma.user.count({ where: { user_type: 'admin' } }),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          user_id: true,
          username: true,
          email: true,
          user_type: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 10
      })
    ]);

    // FIXED: Get total quests count using MySQL pool instead of Prisma
    let totalQuests = 0;
    try {
      const connection = await pool.getConnection();
      
      // Try multiple quest-related tables
      try {
        // First try active_quests (current quests)
        const [activeQuestsResult]: any = await connection.execute(
          'SELECT COUNT(*) as count FROM active_quests'
        );
        const activeQuests = activeQuestsResult[0]?.count || 0;
        
        // Then try quest_completion_history (completed quests)
        const [completedQuestsResult]: any = await connection.execute(
          'SELECT COUNT(*) as count FROM quest_completion_history'
        );
        const completedQuests = completedQuestsResult[0]?.count || 0;
        
        // Total quests = active + completed
        totalQuests = activeQuests + completedQuests;
        
        console.log(`✅ Quest Stats: ${activeQuests} active, ${completedQuests} completed, ${totalQuests} total`);
        
      } catch (questError: any) {
        console.warn('⚠️ Quest tables query failed:', questError.message);
        
        // Fallback: Try to count from quest_templates (templates available)
        try {
          const [templatesResult]: any = await connection.execute(
            'SELECT COUNT(*) as count FROM quest_templates'
          );
          totalQuests = templatesResult[0]?.count || 0;
          console.log(`✅ Using quest templates count: ${totalQuests}`);
        } catch (templateError) {
          console.warn('⚠️ No quest data available, returning 0');
          totalQuests = 0;
        }
      }
      
      connection.release();
      
    } catch (connectionError) {
      console.error('❌ Database connection error for quests:', connectionError);
      totalQuests = 0;
    }

    res.json({
      stats: {
        totalUsers,
        usersByType: {
          adventurers: adventurerCount,
          coaches: coachCount,
          admins: adminCount
        },
        activeUsers,
        totalQuests, // This should now show real data!
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get all users with pagination and filters
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      user_type, 
      search,
      sort_by = 'created_at',
      order = 'desc' 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (user_type && user_type !== 'all') {
      where.user_type = user_type;
    }
    
    if (search) {
      where.OR = [
        { username: { contains: String(search) } },
        { email: { contains: String(search) } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [String(sort_by)]: order },
        select: {
          user_id: true,
          email: true,
          username: true,
          user_type: true,
          profile_photo_url: true,
          created_at: true,
          last_login: true,
          is_active: true,
          email_verified: true,
          adventurerProfile: {
            select: {
              full_name: true,
              current_level: true,
              total_exp: true,
              field_of_interest: true
            }
          },
          coachProfile: {
            select: {
              full_name: true,
              specialization: true,
              current_students: true
            }
          },
          adminProfile: {
            select: {
              full_name: true,
              department: true,
              access_level: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Log admin action
    await logAdminAction(
      (req as any).user.user_id,
      'VIEW_USERS',
      null,
      null,
      { filters: { user_type, search }, page },
      req
    );

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get specific user details
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: Number(user_id) },
      include: {
        adventurerProfile: true,
        coachProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional stats using raw queries for tables not in Prisma schema
    const additionalStats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM quest_completion_history WHERE user_id = ${Number(user_id)}) as completed_quests,
        (SELECT COUNT(*) FROM achievements_earned WHERE user_id = ${Number(user_id)}) as achievements,
        (SELECT COUNT(*) FROM daily_checkins WHERE user_id = ${Number(user_id)}) as checkins
    `;

    res.json({
      user,
      stats: additionalStats[0]
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const adminUser = (req as any).user;

    // Get user info before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { user_id: Number(user_id) },
      select: { username: true, email: true, user_type: true }
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting super admins
    if (userToDelete.user_type === 'admin') {
      const targetAdmin = await prisma.adminProfile.findUnique({
        where: { user_id: Number(user_id) }
      });
      
      if (targetAdmin?.access_level === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Cannot delete super admin' });
      }
    }

    // Delete user (cascades to profiles)
    await prisma.user.delete({
      where: { user_id: Number(user_id) }
    });

    // Log admin action
    await logAdminAction(
      adminUser.user_id,
      'DELETE_USER',
      'user',
      Number(user_id),
      { deletedUser: userToDelete },
      req
    );

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: userToDelete
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Toggle user status
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const adminUser = (req as any).user;

    const user = await prisma.user.findUnique({
      where: { user_id: Number(user_id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: Number(user_id) },
      data: { is_active: !user.is_active }
    });

    // Log admin action
    await logAdminAction(
      adminUser.user_id,
      user.is_active ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
      'user',
      Number(user_id),
      { newStatus: updatedUser.is_active },
      req
    );

    res.json({
      message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Get admin activity logs
export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.adminActionLog.count()
    ]);

    // Get admin usernames
    const adminIds = [...new Set(logs.map(log => log.admin_user_id))];
    const admins = await prisma.user.findMany({
      where: { user_id: { in: adminIds } },
      select: { user_id: true, username: true }
    });

    const adminMap = new Map(admins.map(a => [a.user_id, a.username]));

    const logsWithAdminNames = logs.map(log => ({
      ...log,
      admin_username: adminMap.get(log.admin_user_id) || 'Unknown'
    }));

    res.json({
      logs: logsWithAdminNames,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
};


// Create new user from admin panel
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, username, password, user_type, full_name, ...profileData } = req.body;
    const adminUser = (req as any).user;

    // Validate required fields
    if (!email || !username || !password || !user_type || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, username, password, user_type, full_name' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          password_hash,
          user_type: user_type as any,
          is_active: true
        }
      });

      // Create appropriate profile
      if (user_type === 'adventurer') {
        await tx.adventurerProfile.create({
          data: {
            user_id: user.user_id,
            full_name,
            field_of_interest: profileData.field_of_interest || 'General',
            commitment_level: profileData.commitment_level || 'one_hour',
            experience_level: profileData.experience_level || 'beginner',
          
          }
        });
      } else if (user_type === 'coach') {
        await tx.coachProfile.create({
          data: {
            user_id: user.user_id,
            full_name,
            specialization: profileData.field_of_interest || 'General',
            verification_status: 'pending'
          }
        });
      }

      return user;
    });

    // Log admin action
    await logAdminAction(
      adminUser.user_id,
      'CREATE_USER',
      'user',
      newUser.user_id,
      { createdUser: { email, username, user_type } },
      req
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { email, username, is_active, ...updateData } = req.body;
    const adminUser = (req as any).user;

    const updates: any = {};
    
    if (email !== undefined) updates.email = email;
    if (username !== undefined) updates.username = username;
    if (is_active !== undefined) updates.is_active = is_active;

    const updatedUser = await prisma.user.update({
      where: { user_id: Number(user_id) },
      data: updates
    });

    // Log admin action
    await logAdminAction(
      adminUser.user_id,
      'UPDATE_USER',
      'user',
      Number(user_id),
      { updates },
      req
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Get all quests
export const getAllQuests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const quests = await prisma.$queryRaw`
      SELECT * FROM active_quests 
      ORDER BY created_at DESC 
      LIMIT ${Number(limit)} OFFSET ${skip}
    `;

    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM active_quests
    `;
    const total = (totalResult as any)[0].count;

    res.json({
      quests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

// Get database statistics
export const getDatabaseStats = async (req: Request, res: Response) => {
  try {
    const tables = [
      'users', 
      'adventurer_profiles', 
      'coach_profiles',
      'admin_profiles',
      'active_quests', 
      'quest_completion_history', 
      'achievements_earned', 
      'user_achievements',
      'daily_checkins', 
      'activity_logs',
      'admin_action_logs'
    ];

    const stats = await Promise.all(
      tables.map(async (table) => {
        try {
          const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
          return { table, count: (result as any)[0].count };
        } catch {
          return { table, count: 0, error: 'Table not found' };
        }
      })
    );

    res.json({ tableStats: stats });
  } catch (error) {
    console.error('Get database stats error:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
};

// Helper function to log admin actions
async function logAdminAction(
  admin_user_id: number,
  action_type: string,
  target_type: string | null,
  target_id: number | null,
  details: any,
  req: Request
) {
  try {
    await prisma.adminActionLog.create({
      data: {
        admin_user_id,
        action_type,
        target_type,
        target_id,
        action_details: details,
        ip_address: req.ip,
        user_agent: req.get('user-agent') || null
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// Update admin's last action
async function updateAdminLastAction(admin_user_id: number, action: string) {
  try {
    await prisma.adminProfile.update({
      where: { user_id: admin_user_id },
      data: {
        last_action: action,
        last_action_date: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to update admin last action:', error);
  }
}
export const getAllQuestsDetailed = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 15, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const connection = await pool.getConnection();

    try {
      let whereClause = '';
      let countWhereClause = '';
      
      if (status === 'active') {
        whereClause = 'WHERE uaq.is_completed = FALSE';
        countWhereClause = 'WHERE is_completed = FALSE';
      } else if (status === 'completed') {
        whereClause = 'WHERE uaq.is_completed = TRUE';
        countWhereClause = 'WHERE is_completed = TRUE';
      }

      // ✅ Using user_active_quests (the main table)
      const [quests]: any = await connection.execute(`
        SELECT 
          uaq.active_quest_id,
          uaq.user_id,
          uaq.quest_template_id,
          uaq.quest_type,
          uaq.assigned_date,
          uaq.expires_at,
          uaq.is_completed,
          uaq.completed_at,
          uaq.xp_earned,
          uaq.created_at,
          qt.quest_title,
          qt.quest_description,
          qt.base_xp,
          qt.difficulty,
          qt.related_stat,
          u.username,
          u.email,
          ap.full_name,
          ap.field_of_interest
        FROM user_active_quests uaq
        LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
        LEFT JOIN users u ON uaq.user_id = u.user_id
        LEFT JOIN adventurer_profiles ap ON uaq.user_id = ap.user_id
        ${whereClause}
        ORDER BY uaq.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${skip}
      `);

      const [totalResult]: any = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM user_active_quests
        ${countWhereClause}
      `);
      
      const total = totalResult[0].count;

      connection.release();

      res.json({
        quests,
        pagination: {
          total: Number(total),
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(Number(total) / Number(limit))
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Get quests detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};