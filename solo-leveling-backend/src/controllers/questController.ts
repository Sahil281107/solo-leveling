import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getDailyQuests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    const [quests]: any = await pool.execute(
      `SELECT 
        uaq.*,
        qt.quest_title,
        qt.quest_description,
        qt.base_xp,
        qt.difficulty,
        qt.related_stat
      FROM user_active_quests uaq
      LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
      WHERE uaq.user_id = ?
      AND uaq.quest_type = 'daily'
      AND uaq.expires_at > NOW()`,
      [userId]
    );
    
    res.json({ quests });
  } catch (error: any) {
    console.error('Get daily quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

export const getWeeklyQuests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    const [quests]: any = await pool.execute(
      `SELECT 
        uaq.*,
        qt.quest_title,
        qt.base_xp,
        qt.difficulty,
        qt.related_stat
      FROM user_active_quests uaq
      LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
      WHERE uaq.user_id = ?
      AND uaq.quest_type = 'weekly'
      AND uaq.expires_at > NOW()`,
      [userId]
    );
    
    res.json({ quests });
  } catch (error: any) {
    console.error('Get weekly quests error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly quests' });
  }
};

export const generateDailyQuests = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    
    // Get user's field of interest
    const [userProfile]: any = await connection.execute(
      'SELECT field_of_interest FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (userProfile.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const fieldOfInterest = userProfile[0].field_of_interest;
    
    // Clear existing active daily quests for this user
    await connection.execute(
      'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "daily"',
      [userId]
    );
    
    // Get available quest templates for user's field
    const [templates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND() 
       LIMIT 8`,
      [fieldOfInterest]
    );
    
    // If no specific templates found, get general templates
    if (templates.length === 0) {
      const [generalTemplates]: any = await connection.execute(
        `SELECT * FROM quest_templates 
         WHERE quest_type = 'daily' AND is_active = 1 
         ORDER BY RAND() 
         LIMIT 8`
      );
      templates.push(...generalTemplates);
    }
    
    // If still no templates, create default ones
    if (templates.length === 0) {
      const defaultQuests = [
        { title: 'Morning Routine', xp: 25, difficulty: 'easy', stat: 'Stamina' },
        { title: 'Study/Practice for 30 minutes', xp: 35, difficulty: 'medium', stat: 'Intelligence' },
        { title: 'Physical Exercise', xp: 30, difficulty: 'medium', stat: 'Strength' },
        { title: 'Skill Development', xp: 40, difficulty: 'medium', stat: 'Intelligence' },
        { title: 'Healthy Meal Planning', xp: 20, difficulty: 'easy', stat: 'Wisdom' },
        { title: 'Goal Review & Planning', xp: 25, difficulty: 'easy', stat: 'Wisdom' },
        { title: 'Creative Activity', xp: 30, difficulty: 'medium', stat: 'Charisma' },
        { title: 'Evening Reflection', xp: 20, difficulty: 'easy', stat: 'Wisdom' }
      ];
      
      for (const quest of defaultQuests) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, NULL, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
          [userId]
        );
      }
    } else {
      // Assign quests from templates
      for (const template of templates) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
          [userId, template.quest_template_id]
        );
      }
    }
    
    await connection.commit();
    
    // Fetch the newly created quests
    const [newQuests]: any = await connection.execute(
      `SELECT 
        uaq.*,
        COALESCE(qt.quest_title, 
          CASE uaq.quest_template_id
            WHEN NULL THEN 
              CASE ROW_NUMBER() OVER (ORDER BY uaq.active_quest_id)
                WHEN 1 THEN 'Morning Routine'
                WHEN 2 THEN 'Study/Practice for 30 minutes'
                WHEN 3 THEN 'Physical Exercise'
                WHEN 4 THEN 'Skill Development'
                WHEN 5 THEN 'Healthy Meal Planning'
                WHEN 6 THEN 'Goal Review & Planning'
                WHEN 7 THEN 'Creative Activity'
                WHEN 8 THEN 'Evening Reflection'
              END
          END
        ) as quest_title,
        COALESCE(qt.quest_description, 'Complete this daily quest to gain XP') as quest_description,
        COALESCE(qt.base_xp, 
          CASE ROW_NUMBER() OVER (ORDER BY uaq.active_quest_id)
            WHEN 1 THEN 25
            WHEN 2 THEN 35
            WHEN 3 THEN 30
            WHEN 4 THEN 40
            WHEN 5 THEN 20
            WHEN 6 THEN 25
            WHEN 7 THEN 30
            WHEN 8 THEN 20
          END
        ) as base_xp,
        COALESCE(qt.difficulty, 'medium') as difficulty,
        COALESCE(qt.related_stat, 'Strength') as related_stat
      FROM user_active_quests uaq
      LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
      WHERE uaq.user_id = ? AND uaq.quest_type = 'daily'`,
      [userId]
    );
    
    res.json({ 
      message: 'Daily quests generated successfully', 
      quests: newQuests 
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Generate daily quests error:', error);
    res.status(500).json({ error: 'Failed to generate daily quests' });
  } finally {
    connection.release();
  }
};

export const generateWeeklyQuests = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    
    // Get user's field of interest
    const [userProfile]: any = await connection.execute(
      'SELECT field_of_interest FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (userProfile.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const fieldOfInterest = userProfile[0].field_of_interest;
    
    // Clear existing active weekly quests for this user
    await connection.execute(
      'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "weekly"',
      [userId]
    );
    
    // Get available weekly quest templates
    const [templates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'weekly' AND is_active = 1 
       ORDER BY RAND() 
       LIMIT 3`,
      [fieldOfInterest]
    );
    
    // If no specific templates found, create default weekly quests
    if (templates.length === 0) {
      const defaultWeeklyQuests = [
        { title: 'Complete 5 Daily Quests', xp: 200, difficulty: 'medium' },
        { title: 'Weekly Skill Master Challenge', xp: 300, difficulty: 'hard' },
        { title: 'Consistency Champion', xp: 250, difficulty: 'medium' }
      ];
      
      for (const quest of defaultWeeklyQuests) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, NULL, 'weekly', CURDATE(), DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [userId]
        );
      }
    } else {
      // Assign quests from templates
      for (const template of templates) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, ?, 'weekly', CURDATE(), DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [userId, template.quest_template_id]
        );
      }
    }
    
    await connection.commit();
    
    // Fetch the newly created weekly quests
    const [newQuests]: any = await connection.execute(
      `SELECT 
        uaq.*,
        COALESCE(qt.quest_title, 
          CASE ROW_NUMBER() OVER (ORDER BY uaq.active_quest_id)
            WHEN 1 THEN 'Complete 5 Daily Quests'
            WHEN 2 THEN 'Weekly Skill Master Challenge'
            WHEN 3 THEN 'Consistency Champion'
          END
        ) as quest_title,
        COALESCE(qt.quest_description, 'Complete this weekly challenge to gain XP') as quest_description,
        COALESCE(qt.base_xp, 
          CASE ROW_NUMBER() OVER (ORDER BY uaq.active_quest_id)
            WHEN 1 THEN 200
            WHEN 2 THEN 300
            WHEN 3 THEN 250
          END
        ) as base_xp,
        COALESCE(qt.difficulty, 'medium') as difficulty,
        COALESCE(qt.related_stat, 'Strength') as related_stat
      FROM user_active_quests uaq
      LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
      WHERE uaq.user_id = ? AND uaq.quest_type = 'weekly'`,
      [userId]
    );
    
    res.json({ 
      message: 'Weekly quests generated successfully', 
      quests: newQuests 
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Generate weekly quests error:', error);
    res.status(500).json({ error: 'Failed to generate weekly quests' });
  } finally {
    connection.release();
  }
};

export const completeQuest = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    const { quest_id } = req.params;
    
    // Check quest exists and get details
    const [questCheck]: any = await connection.execute(
      `SELECT uaq.*, 
        COALESCE(qt.base_xp, 
          CASE uaq.quest_type
            WHEN 'daily' THEN 30
            WHEN 'weekly' THEN 200
            ELSE 50
          END
        ) as xp_reward,
        COALESCE(qt.related_stat, 'Strength') as related_stat
       FROM user_active_quests uaq
       LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
       WHERE uaq.active_quest_id = ? AND uaq.user_id = ? AND uaq.is_completed = FALSE`,
      [quest_id, userId]
    );
    
    if (questCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Quest not found or already completed' });
    }
    
    const quest = questCheck[0];
    const xpGained = quest.xp_reward;
    
    // Mark quest as completed
    await connection.execute(
      'UPDATE user_active_quests SET is_completed = TRUE, completed_at = NOW() WHERE active_quest_id = ?',
      [quest_id]
    );
    
    // Add to completion history
    await connection.execute(
      'INSERT INTO quest_completion_history (user_id, quest_template_id, quest_type, xp_earned) VALUES (?, ?, ?, ?)',
      [userId, quest.quest_template_id, quest.quest_type, xpGained]
    );
    
    // Update user profile with XP
    const [currentProfile]: any = await connection.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (currentProfile.length > 0) {
      const profile = currentProfile[0];
      const newTotalExp = profile.total_exp + xpGained;
      let newCurrentExp = profile.current_exp + xpGained;
      let newLevel = profile.current_level;
      let expToNext = profile.exp_to_next_level;
      let leveledUp = false;
      
      // Check for level up
      while (newCurrentExp >= expToNext) {
        newCurrentExp -= expToNext;
        newLevel++;
        expToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1)); // Exponential growth
        leveledUp = true;
      }
      
      // Update profile
      await connection.execute(
        `UPDATE adventurer_profiles 
         SET total_exp = ?, current_exp = ?, current_level = ?, exp_to_next_level = ?, last_activity_date = CURDATE()
         WHERE user_id = ?`,
        [newTotalExp, newCurrentExp, newLevel, expToNext, userId]
      );
      
      // If leveled up, add to progression history
      if (leveledUp) {
        await connection.execute(
          'INSERT INTO level_progression (user_id, old_level, new_level, total_exp_at_levelup) VALUES (?, ?, ?, ?)',
          [userId, profile.current_level, newLevel, newTotalExp]
        );
      }
      
      // Update stats if quest has related stat
      if (quest.related_stat) {
        await connection.execute(
          `UPDATE user_stats 
           SET current_value = LEAST(current_value + 1, max_value) 
           WHERE user_id = ? AND stat_name = ?`,
          [userId, quest.related_stat]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: 'Quest completed successfully',
        xp_gained: xpGained,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        totalExp: newTotalExp
      });
    } else {
      await connection.rollback();
      res.status(404).json({ error: 'User profile not found' });
    }
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  } finally {
    connection.release();
  }
};

// Add this function to your questController.ts

export const initializeQuestSystem = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user?.user_id;
    
    // Check if user already has quests
    const [existingQuests]: any = await connection.execute(
      'SELECT COUNT(*) as count FROM user_active_quests WHERE user_id = ?',
      [userId]
    );
    
    if (existingQuests[0].count > 0) {
      await connection.rollback();
      return res.json({ message: 'Quest system already initialized' });
    }
    
    // Get user's field of interest
    const [userProfile]: any = await connection.execute(
      'SELECT field_of_interest FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (userProfile.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const fieldOfInterest = userProfile[0].field_of_interest;
    
    // Generate initial daily quests
    const [dailyTemplates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND() 
       LIMIT 8`,
      [fieldOfInterest]
    );
    
    // Generate initial weekly quests
    const [weeklyTemplates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'weekly' AND is_active = 1 
       ORDER BY RAND() 
       LIMIT 3`,
      [fieldOfInterest]
    );
    
    // Insert daily quests
    for (const template of dailyTemplates) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [userId, template.quest_template_id]
      );
    }
    
    // Insert weekly quests
    for (const template of weeklyTemplates) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'weekly', CURDATE(), DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userId, template.quest_template_id]
      );
    }
    
    // If no templates found, create default quests
    if (dailyTemplates.length === 0) {
      const defaultQuests = [
        'Morning Routine', 'Study/Practice Session', 'Physical Exercise', 'Skill Development',
        'Healthy Meal Planning', 'Goal Review', 'Creative Activity', 'Evening Reflection'
      ];
      
      for (const questTitle of defaultQuests) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, NULL, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
          [userId]
        );
      }
    }
    
    if (weeklyTemplates.length === 0) {
      const defaultWeeklyQuests = [
        'Complete 5 Daily Quests', 'Weekly Challenge', 'Consistency Goal'
      ];
      
      for (const questTitle of defaultWeeklyQuests) {
        await connection.execute(
          `INSERT INTO user_active_quests 
           (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
           VALUES (?, NULL, 'weekly', CURDATE(), DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [userId]
        );
      }
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Quest system initialized successfully',
      dailyQuests: dailyTemplates.length || 8,
      weeklyQuests: weeklyTemplates.length || 3
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Initialize quest system error:', error);
    res.status(500).json({ error: 'Failed to initialize quest system' });
  } finally {
    connection.release();
  }
};