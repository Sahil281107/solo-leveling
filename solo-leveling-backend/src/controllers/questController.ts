import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
interface QuestTemplate {
  quest_template_id: number;
  quest_title: string;
  quest_description: string;
  base_xp: number;
  difficulty: string;
  related_stat: string;
  field_name: string;
  quest_type: string;
  is_active: boolean;
}
/**
 * Fisher-Yates Shuffle Algorithm - for perfect randomization
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]; // Create a copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Advanced uniqueness checker - checks for similar quest titles
 * @param questTitle - Title to check
 * @param existingTitles - Set of existing titles
 * @returns boolean - true if unique enough
 */
export const isQuestUnique = (questTitle: string, existingTitles: Set<string>): boolean => {
  const normalizedTitle = questTitle.toLowerCase().trim();
  
  // Direct match check
  if (existingTitles.has(normalizedTitle)) {
    return false;
  }
  
  // Similar title check (optional - prevents very similar quests)
  for (const existingTitle of existingTitles) {
    // Check if titles are too similar (more than 70% similar)
    const similarity = calculateSimilarity(normalizedTitle, existingTitle);
    if (similarity > 0.7) {
      console.log(`Skipping similar quest: "${questTitle}" (${similarity}% similar to "${existingTitle}")`);
      return false;
    }
  }
  
  return true;
};

/**
 * Calculate similarity between two strings (simple version)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns number - Similarity score (0-1)
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

/**
 * Levenshtein distance calculation
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};



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
    
    // Clear existing active daily quests
    await connection.execute(
      'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "daily"',
      [userId]
    );
    
    // 🎯 STEP 1: Get all available quests (already randomized by database)
    const [templates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND()`,
      [fieldOfInterest]
    );
    
    console.log(`Found ${templates.length} quest templates for ${fieldOfInterest}`);
    
    // 🎯 STEP 2: Apply additional randomization with JavaScript
    const shuffledTemplates = shuffleArray(templates as QuestTemplate[]);
    
    // 🎯 STEP 3: Select unique quests with advanced checking
    const selectedQuests: QuestTemplate[] = [];
    const usedQuestIds = new Set<number>();
    const usedQuestTitles = new Set<string>();
    
    for (const template of shuffledTemplates) {
      if (selectedQuests.length >= 8) break;
      
      // Check ID uniqueness
      if (usedQuestIds.has(template.quest_template_id)) continue;
      
      // Check title uniqueness (with similarity checking)
      if (!isQuestUnique(template.quest_title, usedQuestTitles)) continue;
      
      // Quest is unique - add it!
      selectedQuests.push(template);
      usedQuestIds.add(template.quest_template_id);
      usedQuestTitles.add(template.quest_title.toLowerCase().trim());
      
      console.log(`✅ Selected unique quest: "${template.quest_title}"`);
    }
    
    // 🎯 STEP 4: If we need more quests, get from other fields
    if (selectedQuests.length < 8) {
      console.log(`Need ${8 - selectedQuests.length} more quests from other fields`);
      
      const [backupTemplates]: any = await connection.execute(
        `SELECT * FROM quest_templates 
         WHERE quest_type = 'daily' AND is_active = 1 
         AND field_name != ?
         ORDER BY RAND() 
         LIMIT ?`,
        [fieldOfInterest, 20] // Get more than needed to ensure uniqueness
      );
      
      const shuffledBackups = shuffleArray(backupTemplates as QuestTemplate[]);
      
      for (const template of shuffledBackups) {
        if (selectedQuests.length >= 8) break;
        
        if (!usedQuestIds.has(template.quest_template_id) && 
            isQuestUnique(template.quest_title, usedQuestTitles)) {
          
          selectedQuests.push(template);
          usedQuestIds.add(template.quest_template_id);
          usedQuestTitles.add(template.quest_title.toLowerCase().trim());
          
          console.log(`✅ Added backup quest: "${template.quest_title}" from ${template.field_name}`);
        }
      }
    }
    
    // 🎯 STEP 5: Final randomization of selected quests
    const finalRandomQuests = shuffleArray(selectedQuests).slice(0, 8);
    
    // 🎯 STEP 6: Insert the random unique quests
    for (const template of finalRandomQuests) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [userId, template.quest_template_id]
      );
    }
    
    await connection.commit();
    
    // Fetch and return the results
    const [newQuests]: any = await connection.execute(
      `SELECT 
        uaq.*,
        COALESCE(qt.quest_title, 
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
      WHERE uaq.user_id = ? AND uaq.quest_type = 'daily'
      ORDER BY RAND()`, // One final randomization of the display order
      [userId]
    );
    
    console.log(`🎯 SUCCESS: Generated ${newQuests.length} unique random daily quests`);
    
    res.json({ 
      message: 'Random unique daily quests generated successfully!', 
      quests: newQuests,
      count: newQuests.length,
      fieldOfInterest: fieldOfInterest,
      uniqueCount: new Set(newQuests.map((q: any) => q.quest_title)).size,
      randomSeed: Date.now() // For debugging randomness
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
    
    // *** NEW: UPDATE STREAK BEFORE UPDATING PROFILE ***
    const streakUpdate = await updateUserStreak(connection, userId, quest.quest_type, xpGained);
    
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
        expToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
        leveledUp = true;
      }
      
      // Update profile (streak already updated in updateUserStreak)
      await connection.execute(
        `UPDATE adventurer_profiles 
         SET total_exp = ?, current_exp = ?, current_level = ?, exp_to_next_level = ?
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

      // Check achievements after quest completion
      const newAchievements = await checkAchievementsInternal(connection, userId, newLevel, newTotalExp);
      
      await connection.commit();
      
      res.json({ 
        message: 'Quest completed successfully',
        xp_gained: xpGained,
        leveledUp,
        newLevel: leveledUp ? newLevel : profile.current_level,
        totalExp: newTotalExp,
        newAchievements: newAchievements || [],
        streakInfo: streakUpdate ? {
          currentStreak: streakUpdate.newStreakDays,
          streakBroken: streakUpdate.streakBroken,
          isNewRecord: streakUpdate.isNewRecord
        } : null
      });
      
    } else {
      await connection.rollback();
      res.status(404).json({ error: 'Profile not found' });
    }
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  } finally {
    connection.release();
  }
};

// *** NEW: INTERNAL ACHIEVEMENT CHECKING FUNCTION ***
const checkAchievementsInternal = async (connection: any, userId: number, currentLevel: number, currentTotalExp: number) => {
  try {
    const newAchievements = [];
    
    // Get current profile for streak info
    const [profile]: any = await connection.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (profile.length === 0) {
      return newAchievements;
    }
    
    const currentProfile = profile[0];
    
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
      achievementChecks.push({ id: 9, name: 'Strength Master', condition: true });
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
            [userId, `Achievement Unlocked: ${check.name}!`, `Congratulations! You have earned the ${check.name} achievement!`]
          );
        }
      }
    }
    
    return newAchievements;
    
  } catch (error) {
    console.error('Internal achievement check error:', error);
    return [];
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
const updateUserStreak = async (connection: any, userId: number, questType: string, xpEarned: number) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    // Get current profile info
    const [currentProfile]: any = await connection.execute(
      'SELECT * FROM adventurer_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (currentProfile.length === 0) {
      return;
    }
    
    const profile = currentProfile[0];
    const lastActivityDate = profile.last_activity_date;
    
    // Check if user already has a checkin for today
    const [existingCheckin]: any = await connection.execute(
      'SELECT * FROM daily_checkins WHERE user_id = ? AND checkin_date = ?',
      [userId, today]
    );
    
    if (existingCheckin.length === 0) {
      // No checkin for today, create one
      await connection.execute(
        `INSERT INTO daily_checkins (user_id, checkin_date, quests_completed, total_xp_earned) 
         VALUES (?, ?, 1, ?)`,
        [userId, today, xpEarned]
      );
    } else {
      // Update existing checkin
      await connection.execute(
        `UPDATE daily_checkins 
         SET quests_completed = quests_completed + 1, 
             total_xp_earned = total_xp_earned + ?
         WHERE user_id = ? AND checkin_date = ?`,
        [xpEarned, userId, today]
      );
    }
    
    // Calculate streak
    let newStreakDays = 1;
    let streakBroken = false;
    
    if (lastActivityDate) {
      const lastActivity = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastActivity.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, don't change streak
        newStreakDays = profile.streak_days;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreakDays = profile.streak_days + 1;
      } else {
        // Gap in days, reset streak
        newStreakDays = 1;
        streakBroken = true;
      }
    }
    
    // Update longest streak if current streak is longer
    const newLongestStreak = Math.max(profile.longest_streak || 0, newStreakDays);
    
    // Update adventurer profile with new streak info
    await connection.execute(
      `UPDATE adventurer_profiles 
       SET streak_days = ?, 
           longest_streak = ?, 
           last_activity_date = ?
       WHERE user_id = ?`,
      [newStreakDays, newLongestStreak, today, userId]
    );
    
    // Create streak milestone notifications
    if (newStreakDays === 7) {
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, notification_type, title, message, expires_at) 
         VALUES (?, 'streak_milestone', '7-Day Streak! 🔥', 'Congratulations on maintaining a week-long streak!', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [userId]
      );
    } else if (newStreakDays === 30) {
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, notification_type, title, message, expires_at) 
         VALUES (?, 'streak_milestone', '30-Day Streak! 💎', 'Amazing! You have maintained a month-long streak!', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [userId]
      );
    } else if (newStreakDays % 50 === 0 && newStreakDays > 30) {
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, notification_type, title, message, expires_at) 
         VALUES (?, 'streak_milestone', ?, 'Incredible dedication! You are on fire!', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [userId, `${newStreakDays}-Day Streak! 🚀`]
      );
    }
    
    // Warn about streak being at risk (if last activity was yesterday)
    if (streakBroken && profile.streak_days > 7) {
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, notification_type, title, message, expires_at) 
         VALUES (?, 'streak_warning', 'Streak Reset', 'Your streak has been reset. Start building it again!', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userId]
      );
    }
    
    return {
      newStreakDays,
      streakBroken,
      isNewRecord: newStreakDays > (profile.longest_streak || 0)
    };
    
  } catch (error) {
    console.error('Streak update error:', error);
    return null;
  }
};

// Add these functions to your questController.ts

/**
 * Automatic Quest Expiration and Renewal System
 * This runs daily to expire old quests and generate fresh ones
 */
export const processQuestExpiration = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🕒 Starting automatic quest expiration process...');
    
    // Step 1: Mark all expired daily quests as expired (not completed)
    const [expiredDaily]: any = await connection.execute(
      `UPDATE user_active_quests 
       SET is_completed = FALSE, 
           expires_at = NOW() - INTERVAL 1 SECOND
       WHERE quest_type = 'daily' 
       AND expires_at < NOW() 
       AND is_completed = FALSE`
    );
    
    console.log(`⏰ Expired ${expiredDaily.affectedRows} uncompleted daily quests`);
    
    // Step 2: Get all users who need new daily quests
    const [usersNeedingQuests]: any = await connection.execute(
      `SELECT DISTINCT u.user_id, ap.field_of_interest, u.email
       FROM users u
       JOIN adventurer_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN user_active_quests uaq ON u.user_id = uaq.user_id 
         AND uaq.quest_type = 'daily' 
         AND uaq.expires_at > NOW()
       WHERE u.user_type = 'adventurer' 
       AND uaq.user_id IS NULL`
    );
    
    console.log(`👥 Found ${usersNeedingQuests.length} users needing new daily quests`);
    
    let renewedUsers = 0;
    
    // Step 3: Generate fresh daily quests for each user
    for (const user of usersNeedingQuests) {
      try {
        const userId = user.user_id;
        const fieldOfInterest = user.field_of_interest;
        
        // Generate new unique daily quests using our improved algorithm
        const newQuests = await generateUniqueQuestsForUser(connection, userId, fieldOfInterest);
        
        if (newQuests.length > 0) {
          console.log(`✅ Renewed ${newQuests.length} daily quests for user ${user.email}`);
          renewedUsers++;
        }
        
      } catch (userError) {
        console.error(`❌ Error renewing quests for user ${user.email}:`, userError);
      }
    }
    
    // Step 4: Clean up very old expired quests (optional - keeps database clean)
    const [cleanedUp]: any = await connection.execute(
      `DELETE FROM user_active_quests 
       WHERE expires_at < NOW() - INTERVAL 7 DAY 
       AND is_completed = FALSE`
    );
    
    console.log(`🧹 Cleaned up ${cleanedUp.affectedRows} old expired quests`);
    
    await connection.commit();
    
    const summary = {
      message: 'Quest expiration process completed successfully',
      expiredQuests: expiredDaily.affectedRows,
      usersRenewed: renewedUsers,
      totalUsers: usersNeedingQuests.length,
      oldQuestsCleaned: cleanedUp.affectedRows,
      processTime: new Date().toISOString()
    };
    
    console.log('🎯 Quest expiration summary:', summary);
    
    res.json(summary);
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Quest expiration process error:', error);
    res.status(500).json({ error: 'Failed to process quest expiration' });
  } finally {
    connection.release();
  }
};

/**
 * Helper function to generate unique quests for a specific user
 * Extracted logic for reuse in expiration process
 */
const generateUniqueQuestsForUser = async (connection: any, userId: number, fieldOfInterest: string) => {
  try {
    // Get available quest templates for user's field
    const [templates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND()`,
      [fieldOfInterest]
    );
    
    // Apply uniqueness selection logic
    const shuffledTemplates = shuffleArray(templates as QuestTemplate[]);
    const selectedQuests: QuestTemplate[] = [];
    const usedQuestIds = new Set<number>();
    const usedQuestTitles = new Set<string>();
    
    for (const template of shuffledTemplates) {
      if (selectedQuests.length >= 8) break;
      
      if (usedQuestIds.has(template.quest_template_id)) continue;
      if (!isQuestUnique(template.quest_title, usedQuestTitles)) continue;
      
      selectedQuests.push(template);
      usedQuestIds.add(template.quest_template_id);
      usedQuestTitles.add(template.quest_title.toLowerCase().trim());
    }
    
    // Get backup quests from other fields if needed
    if (selectedQuests.length < 8) {
      const [backupTemplates]: any = await connection.execute(
        `SELECT * FROM quest_templates 
         WHERE quest_type = 'daily' AND is_active = 1 
         AND field_name != ?
         ORDER BY RAND() 
         LIMIT ?`,
        [fieldOfInterest, 20]
      );
      
      const shuffledBackups = shuffleArray(backupTemplates as QuestTemplate[]);
      
      for (const template of shuffledBackups) {
        if (selectedQuests.length >= 8) break;
        
        if (!usedQuestIds.has(template.quest_template_id) && 
            isQuestUnique(template.quest_title, usedQuestTitles)) {
          
          selectedQuests.push(template);
          usedQuestIds.add(template.quest_template_id);
          usedQuestTitles.add(template.quest_title.toLowerCase().trim());
        }
      }
    }
    
    // Insert the new unique quests
    const finalQuests = shuffleArray(selectedQuests).slice(0, 8);
    
    for (const template of finalQuests) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [userId, template.quest_template_id]
      );
    }
    
    return finalQuests;
    
  } catch (error) {
    console.error('Generate unique quests for user error:', error);
    return [];
  }
};

/**
 * Manual trigger for quest expiration (for testing)
 * In production, this should be called automatically via cron job
 */
export const triggerQuestReset = async (req: AuthRequest, res: Response) => {
  // This is the same as processQuestExpiration but with different messaging
  return processQuestExpiration(req, res);
};

/**
 * Check if current user needs quest renewal
 * Useful for frontend to know when to show "generate new quests" button
 */
export const checkQuestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    
    const [activeQuests]: any = await pool.execute(
      `SELECT COUNT(*) as active_count
       FROM user_active_quests 
       WHERE user_id = ? 
       AND quest_type = 'daily' 
       AND expires_at > NOW() 
       AND is_completed = FALSE`,
      [userId]
    );
    
    const [expiredQuests]: any = await pool.execute(
      `SELECT COUNT(*) as expired_count
       FROM user_active_quests 
       WHERE user_id = ? 
       AND quest_type = 'daily' 
       AND expires_at < NOW() 
       AND is_completed = FALSE`,
      [userId]
    );
    
    const hasActiveQuests = activeQuests[0].active_count > 0;
    const hasExpiredQuests = expiredQuests[0].expired_count > 0;
    
    res.json({
      hasActiveQuests,
      hasExpiredQuests,
      activeQuestCount: activeQuests[0].active_count,
      expiredQuestCount: expiredQuests[0].expired_count,
      needsRenewal: !hasActiveQuests || hasExpiredQuests,
      canGenerateNew: !hasActiveQuests
    });
    
  } catch (error: any) {
    console.error('Check quest status error:', error);
    res.status(500).json({ error: 'Failed to check quest status' });
  }
};