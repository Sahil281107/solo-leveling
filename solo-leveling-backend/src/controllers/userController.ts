// src/controller/userController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
const fs = require('fs').promises;
const path = require('path');

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const userType = req.user?.user_type;
    
    // Get user data
    const [users]: any = await pool.execute(
      'SELECT user_id, email, username, user_type, profile_photo_url FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get profile
    let profile = null;
    let stats = null;
    
    if (userType === 'adventurer') {
      const [profiles]: any = await pool.execute(
        'SELECT * FROM adventurer_profiles WHERE user_id = ?',
        [userId]
      );
      profile = profiles[0];
      
      // Initialize profile if missing fields
      if (profile && (!profile.exp_to_next_level || !profile.current_exp)) {
        await pool.execute(
          `UPDATE adventurer_profiles 
           SET exp_to_next_level = COALESCE(exp_to_next_level, 100),
               current_exp = COALESCE(current_exp, 0),
               streak_days = COALESCE(streak_days, 0)
           WHERE user_id = ?`,
          [userId]
        );
        
        // Fetch updated profile
        const [updatedProfiles]: any = await pool.execute(
          'SELECT * FROM adventurer_profiles WHERE user_id = ?',
          [userId]
        );
        profile = updatedProfiles[0];
      }
      
      const [userStats]: any = await pool.execute(
        'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
        [userId]
      );
      stats = userStats;
      
      // Initialize stats if empty
      if (stats.length === 0) {
        await initializeUserStatsInternal(userId, profile.field_of_interest);
        const [newStats]: any = await pool.execute(
          'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
          [userId]
        );
        stats = newStats;
      }
    } else {
      const [profiles]: any = await pool.execute(
        'SELECT * FROM coach_profiles WHERE user_id = ?',
        [userId]
      );
      profile = profiles[0];
    }
    
    res.json({
      user: users[0],
      profile,
      stats
    });
    
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    let [stats]: any = await pool.execute(
      'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
      [userId]
    );
    
    // Initialize stats if they don't exist
    if (stats.length === 0) {
      const [profile]: any = await pool.execute(
        'SELECT field_of_interest FROM adventurer_profiles WHERE user_id = ?',
        [userId]
      );
      
      if (profile.length > 0) {
        await initializeUserStatsInternal(userId, profile[0].field_of_interest);
        
        [stats] = await pool.execute(
          'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
          [userId]
        );
      }
    }
    
    res.json({ stats });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Internal function to initialize stats
async function initializeUserStatsInternal(userId: number, fieldOfInterest: string) {
  const connection = await pool.getConnection();
  
  try {
    // Check if stats already exist
    const [existing]: any = await connection.execute(
      'SELECT COUNT(*) as count FROM user_stats WHERE user_id = ?',
      [userId]
    );
    
    if (existing[0].count > 0) {
      return; // Stats already exist
    }
    
    // Try to get stats from template first
    const [templateStats]: any = await connection.execute(
      `SELECT stat_name, stat_icon, initial_value, max_value 
       FROM stats_template 
       WHERE field_name = ? 
       ORDER BY stat_order`,
      [fieldOfInterest]
    );
    
    let statsToInsert = [];
    
    if (templateStats.length > 0) {
      // Use template stats
      statsToInsert = templateStats.map((stat: any) => ({
        name: stat.stat_name,
        icon: stat.stat_icon,
        initial: stat.initial_value || 10,
        max: stat.max_value || 100
      }));
    } else {
      // Use default stats
      statsToInsert = [
        { name: 'Strength', icon: '💪', initial: 10, max: 100 },
        { name: 'Intelligence', icon: '🧠', initial: 10, max: 100 },
        { name: 'Agility', icon: '⚡', initial: 10, max: 100 },
        { name: 'Stamina', icon: '🏃', initial: 10, max: 100 },
        { name: 'Wisdom', icon: '📚', initial: 10, max: 100 },
        { name: 'Charisma', icon: '✨', initial: 10, max: 100 }
      ];
    }
    
    // Insert stats
    for (const stat of statsToInsert) {
      await connection.execute(
        'INSERT INTO user_stats (user_id, stat_name, stat_icon, current_value, max_value) VALUES (?, ?, ?, ?, ?)',
        [userId, stat.name, stat.icon, stat.initial, stat.max]
      );
    }
    
  } catch (error) {
    console.error('Error initializing stats:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export const initializeUserStats = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    
    // Get user's field of interest
    const [profile]: any = await connection.execute(
      'SELECT field_of_interest FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (profile.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    await initializeUserStatsInternal(userId, profile[0].field_of_interest);
    
    await connection.commit();
    
    // Fetch and return the initialized stats
    const [stats]: any = await pool.execute(
      'SELECT * FROM user_stats WHERE user_id = ? ORDER BY stat_name',
      [userId]
    );
    
    res.json({ stats, message: 'Stats initialized successfully' });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Initialize stats error:', error);
    res.status(500).json({ error: 'Failed to initialize stats' });
  } finally {
    connection.release();
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    // Get earned achievements
    const [earned]: any = await pool.execute(
      `SELECT a.*, ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC`,
      [userId]
    );
    
    res.json({ achievements: earned });
  } catch (error: any) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

export const checkAchievements = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    const { level, totalExp } = req.body;
    
    const newAchievements = [];
    
    // Get current profile and stats
    const [profile]: any = await connection.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (profile.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const currentProfile = profile[0];
    const currentLevel = level || currentProfile.current_level;
    const currentTotalExp = totalExp || currentProfile.total_exp;
    
    // Count completed quests
    const [questCount]: any = await connection.execute(
      'SELECT COUNT(*) as count FROM quest_completion_history WHERE user_id = ?',
      [userId]
    );
    
    const completedQuests = questCount[0].count;
    
    // Check various achievement conditions
    const achievementChecks = [
      { id: 1, name: 'First Steps', condition: completedQuests >= 1 },
      { id: 2, name: 'Week Warrior', condition: currentProfile.streak_days >= 7 },
      { id: 3, name: 'Level 5 Hunter', condition: currentLevel >= 5 },
      { id: 4, name: 'Level 10 Fighter', condition: currentLevel >= 10 },
      { id: 5, name: 'Quest Master', condition: completedQuests >= 50 },
      { id: 6, name: 'Dedication', condition: currentProfile.streak_days >= 30 },
      { id: 7, name: 'Power Surge', condition: currentTotalExp >= 1000 },
      { id: 8, name: 'Elite Hunter', condition: currentLevel >= 20 },
      { id: 10, name: 'Shadow Monarch', condition: currentLevel >= 50 }
    ];
    
    // Check stat-based achievements
    const [stats]: any = await connection.execute(
      'SELECT * FROM user_stats WHERE user_id = ? AND current_value >= 100',
      [userId]
    );
    
    if (stats.length > 0) {
      achievementChecks.push({ id: 9, name: 'Stat Master', condition: true });
    }
    
    // Check and award achievements
    for (const check of achievementChecks) {
      if (check.condition) {
        // Check if already earned
        const [existing]: any = await connection.execute(
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
          [userId, check.id]
        );
        
        if (existing.length === 0) {
          // Award achievement
          await connection.execute(
            'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, NOW())',
            [userId, check.id]
          );
          
          // Add to new achievements list
          newAchievements.push({
            achievement_id: check.id,
            achievement_name: check.name
          });
          
          // Create notification
          await connection.execute(
            `INSERT INTO notifications 
             (user_id, notification_type, title, message, expires_at) 
             VALUES (?, 'achievement', ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [userId, `Achievement Unlocked: ${check.name}!`, `Congratulations! You've earned the ${check.name} achievement!`]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({ newAchievements });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  } finally {
    connection.release();
  }
};

export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate unique filename
    const uniqueName = `${userId}_${Date.now()}${path.extname(file.originalname)}`;
    const newPath = path.join('uploads', 'profiles', uniqueName);
    
    // Move file from temp to profiles folder
    try {
      await fs.rename(file.path, newPath);
    } catch (moveError: any) {
      // If rename fails, try copy and delete
      await fs.copyFile(file.path, newPath);
      await fs.unlink(file.path);
    }
    
    const profilePhotoUrl = `/uploads/profiles/${uniqueName}`;
    
    // Get old photo URL to delete
    const [oldPhoto]: any = await connection.execute(
      'SELECT profile_photo_url FROM users WHERE user_id = ?',
      [userId]
    );
    
    // Update user profile photo
    await connection.execute(
      'UPDATE users SET profile_photo_url = ? WHERE user_id = ?',
      [profilePhotoUrl, userId]
    );
    
    // Log to media_uploads table
    await connection.execute(
      `INSERT INTO media_uploads 
       (user_id, media_type, file_url, file_name, file_size, mime_type) 
       VALUES (?, 'profile_photo', ?, ?, ?, ?)`,
      [userId, profilePhotoUrl, file.originalname, file.size, file.mimetype]
    );
    
    // Delete old photo file if exists
    if (oldPhoto[0]?.profile_photo_url) {
      const oldPath = path.join('uploads', 'profiles', path.basename(oldPhoto[0].profile_photo_url));
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Could not delete old photo:', err);
      }
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Profile photo uploaded successfully',
      profile_photo_url: profilePhotoUrl 
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Upload profile photo error:', error);
    
    // Try to clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.log('Could not delete temp file:', err);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload profile photo' });
  } finally {
    connection.release();
  }
};

export const removeProfilePhoto = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    
    // Get current photo URL
    const [currentPhoto]: any = await connection.execute(
      'SELECT profile_photo_url FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (currentPhoto[0]?.profile_photo_url) {
      // Delete file
      const photoPath = path.join('uploads', 'profiles', path.basename(currentPhoto[0].profile_photo_url));
      try {
        await fs.unlink(photoPath);
      } catch (err) {
        console.log('Could not delete photo file:', err);
      }
    }
    
    // Update database
    await connection.execute(
      'UPDATE users SET profile_photo_url = NULL WHERE user_id = ?',
      [userId]
    );
    
    await connection.commit();
    
    res.json({ message: 'Profile photo removed successfully' });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Remove profile photo error:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
  } finally {
    connection.release();
  }
};

export const getReceivedFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    console.log('=== GET RECEIVED FEEDBACK DEBUG ===');
    console.log('Student User ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }
    
    // Enhanced query with detailed coach info
    const [feedback]: any = await pool.execute(`
      SELECT 
        cf.feedback_id,
        cf.coach_user_id,
        cf.student_user_id,
        cf.feedback_type,
        cf.feedback_text,
        cf.rating,
        cf.is_read,
        cf.created_at,
        -- Coach basic info
        u.username as coach_username,
        u.profile_photo_url as coach_photo,
        u.email as coach_email,
        -- Coach profile info
        cp.full_name as coach_full_name,
        cp.bio as coach_bio,
        cp.specialization as coach_specialization,
        -- Formatted dates
        DATE_FORMAT(cf.created_at, '%M %e, %Y at %h:%i %p') as formatted_date,
        -- Time ago calculation
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, cf.created_at, NOW()) < 60 THEN 
            CONCAT(TIMESTAMPDIFF(MINUTE, cf.created_at, NOW()), ' minutes ago')
          WHEN TIMESTAMPDIFF(HOUR, cf.created_at, NOW()) < 24 THEN 
            CONCAT(TIMESTAMPDIFF(HOUR, cf.created_at, NOW()), ' hours ago')
          WHEN TIMESTAMPDIFF(DAY, cf.created_at, NOW()) < 30 THEN 
            CONCAT(TIMESTAMPDIFF(DAY, cf.created_at, NOW()), ' days ago')
          ELSE 
            DATE_FORMAT(cf.created_at, '%M %e, %Y')
        END as time_ago
        
      FROM coach_feedback cf
      LEFT JOIN users u ON cf.coach_user_id = u.user_id
      LEFT JOIN coach_profiles cp ON cf.coach_user_id = cp.user_id
      WHERE cf.student_user_id = ?
      ORDER BY cf.created_at DESC
      LIMIT 50
    `, [userId]);
    
    console.log(`Found ${feedback.length} feedback messages`);
    
    // Debug each feedback message's coach info
    feedback.forEach((f: any, index: number) => {
      console.log(`\n--- Feedback ${index + 1} Debug ---`);
      console.log('Coach User ID:', f.coach_user_id);
      console.log('Coach Username:', f.coach_username);
      console.log('Coach Full Name:', f.coach_full_name);
      console.log('Coach Photo URL (RAW):', f.coach_photo);
      console.log('Coach Email:', f.coach_email);
      console.log('Message Preview:', f.feedback_text.substring(0, 30) + '...');
    });
    
    // Process feedback with enhanced coach info
    const processedFeedback = feedback.map((f: any) => ({
      ...f,
      coach_name: f.coach_full_name || f.coach_username || 'Your Coach',
      coach_title: f.coach_specialization || 'Life Coach',
      coach_experience: '1+ years experience',
      formatted_date: f.formatted_date || new Date(f.created_at).toLocaleDateString(),
      time_ago: f.time_ago || 'Recently'
    }));
    
    console.log('\n=== PROCESSED FEEDBACK SAMPLE ===');
    if (processedFeedback.length > 0) {
      const sample = processedFeedback[0];
      console.log('Sample processed feedback:');
      console.log('- Coach Name:', sample.coach_name);
      console.log('- Coach Photo URL:', sample.coach_photo);
      console.log('- Coach Title:', sample.coach_title);
      console.log('- Formatted Date:', sample.formatted_date);
    }
    console.log('=================================');
    
    res.json({ 
      feedback: processedFeedback,
      unread_count: processedFeedback.filter((f: any) => !f.is_read).length,
      total_count: processedFeedback.length,
      debug_info: {
        student_id: userId,
        raw_feedback_count: feedback.length,
        processed_feedback_count: processedFeedback.length,
        sample_coach_photo: processedFeedback.length > 0 ? processedFeedback[0].coach_photo : null
      }
    });
    
  } catch (error: any) {
    console.error('=== GET RECEIVED FEEDBACK ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('====================================');
    
    res.status(500).json({ 
      error: 'Failed to fetch received feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const markFeedbackAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { feedback_id } = req.params;
    
    // Mark specific feedback as read
    await pool.execute(
      'UPDATE coach_feedback SET is_read = TRUE WHERE feedback_id = ? AND student_user_id = ?',
      [feedback_id, userId]
    );
    
    res.json({ message: 'Feedback marked as read' });
    
  } catch (error: any) {
    console.error('Mark feedback as read error:', error);
    res.status(500).json({ error: 'Failed to mark feedback as read' });
  }
};

export const recalculateUserStreak = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user?.user_id;
    
    // Call the stored procedure to recalculate streak
    await connection.execute('CALL RecalculateUserStreak(?)', [userId]);
    
    // Get updated profile data
    const [profile]: any = await connection.execute(
      'SELECT streak_days, longest_streak, last_activity_date FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      message: 'Streak recalculated successfully',
      streakInfo: profile[0] || null
    });
    
  } catch (error: any) {
    console.error('Recalculate streak error:', error);
    res.status(500).json({ error: 'Failed to recalculate streak' });
  } finally {
    connection.release();
  }
};

export const getUserStreakDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    // Get streak information
    const [profile]: any = await pool.execute(
      `SELECT 
         streak_days, 
         longest_streak, 
         last_activity_date,
         DATEDIFF(CURDATE(), last_activity_date) as days_since_last_activity
       FROM adventurer_profiles 
       WHERE user_id = ?`,
      [userId]
    );
    
    // Get daily checkins for the last 30 days
    const [checkins]: any = await pool.execute(
      `SELECT 
         checkin_date, 
         quests_completed, 
         total_xp_earned 
       FROM daily_checkins 
       WHERE user_id = ? AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY checkin_date DESC`,
      [userId]
    );
    
    // Calculate streak status
    let streakStatus = 'unknown';
    if (profile[0]) {
      const daysSinceLastActivity = profile[0].days_since_last_activity;
      if (daysSinceLastActivity === 0) streakStatus = 'active';
      else if (daysSinceLastActivity === 1) streakStatus = 'at_risk';
      else if (daysSinceLastActivity > 1) streakStatus = 'broken';
    }
    
    res.json({
      streakInfo: profile[0] || null,
      streakStatus,
      recentCheckins: checkins,
      totalActiveDays: checkins.length
    });
    
  } catch (error: any) {
    console.error('Get streak details error:', error);
    res.status(500).json({ error: 'Failed to fetch streak details' });
  }
};
export const getCoachDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { coach_id } = req.params;
    const studentId = req.user?.user_id;
    
    // Verify the relationship exists
    const [relationship]: any = await pool.execute(
      'SELECT * FROM coach_student_relationships WHERE coach_user_id = ? AND student_user_id = ? AND status = "active"',
      [coach_id, studentId]
    );
    
    if (relationship.length === 0) {
      return res.status(403).json({ error: 'No active coaching relationship found' });
    }
    
    // Get comprehensive coach details
    const [coach]: any = await pool.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.profile_photo_url,
        u.created_at as joined_date,
        COALESCE(cp.full_name, u.username) as full_name,
        cp.bio,
        cp.specialization,
        cp.years_experience,
        cp.total_students_coached,
        cp.success_stories,
        cp.certification,
        cp.created_at as coach_since,
        
        -- Current student stats
        cp.current_students,
        cp.max_students,
        
        -- Calculate coach ratings if you have a rating system
        COUNT(DISTINCT csr.student_user_id) as active_students,
        AVG(cf.rating) as average_rating,
        COUNT(DISTINCT cf.feedback_id) as total_feedback_given
        
      FROM users u
      LEFT JOIN coach_profiles cp ON u.user_id = cp.user_id
      LEFT JOIN coach_student_relationships csr ON u.user_id = csr.coach_user_id AND csr.status = 'active'
      LEFT JOIN coach_feedback cf ON u.user_id = cf.coach_user_id AND cf.rating IS NOT NULL
      WHERE u.user_id = ? AND u.user_type = 'coach'
      GROUP BY u.user_id
    `, [coach_id]);
    
    if (coach.length === 0) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    
    res.json({ coach: coach[0] });
    
  } catch (error: any) {
    console.error('Get coach details error:', error);
    res.status(500).json({ error: 'Failed to fetch coach details' });
  }
};