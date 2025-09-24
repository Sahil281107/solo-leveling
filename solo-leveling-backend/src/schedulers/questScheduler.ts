// src/schedulers/questScheduler.ts
import cron from 'node-cron';
import  pool from '../config/database';
import { shuffleArray, isQuestUnique } from '../controllers/questController';
interface QuestTemplate {
  quest_template_id: number;
  quest_title: string;
  quest_description: string;
  base_xp: number;
  difficulty: string;
  related_stat: string;
  field_name: string;
}
/**
 * AUTOMATIC QUEST GENERATION SYSTEM
 * This scheduler ensures every user gets fresh quests automatically
 * without any manual intervention
 */

// Generate daily quests for all users at midnight
export const scheduleDailyQuestGeneration = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 [CRON] Starting midnight daily quest reset...');
    
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      // Get all active users
      const [users]: any = await connection.execute(`
        SELECT u.user_id, ap.field_of_interest, ap.full_name
        FROM users u
        JOIN adventurer_profiles ap ON u.user_id = ap.user_id
        WHERE u.is_active = true AND u.user_type = 'adventurer'
      `);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const user of users) {
        try {
          // Clear all existing daily quests
          await connection.execute(
            'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "daily"',
            [user.user_id]
          );
          
          // Get quest templates with proper typing
          const [templates]: [QuestTemplate[], any] = await connection.execute(
            `SELECT DISTINCT quest_template_id, quest_title, quest_description, base_xp, difficulty, related_stat, field_name
             FROM quest_templates 
             WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
             ORDER BY RAND()`,
            [user.field_of_interest]
          );
          
          // Apply uniqueness logic
          const shuffledTemplates = shuffleArray(templates);
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
          
          // Get backup quests if needed
          if (selectedQuests.length < 8) {
            const [backupTemplates]: [QuestTemplate[], any] = await connection.execute(
              `SELECT DISTINCT quest_template_id, quest_title, quest_description, base_xp, difficulty, related_stat, field_name
               FROM quest_templates 
               WHERE quest_type = 'daily' AND is_active = 1 AND field_name != ?
               ORDER BY RAND() 
               LIMIT ?`,
              [user.field_of_interest, 20]
            );
            
            const shuffledBackups = shuffleArray(backupTemplates);
            
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
          
          // Insert exactly 8 unique quests
          const finalQuests = shuffleArray(selectedQuests).slice(0, 8);
          
          for (const template of finalQuests) {
            await connection.execute(
              `INSERT INTO user_active_quests 
               (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
               VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
              [user.user_id, template.quest_template_id]
            );
          }
          
          successCount++;
          console.log(`✅ Generated ${finalQuests.length} unique quests for ${user.full_name}`);
          
        } catch (userError) {
          errorCount++;
          console.error(`❌ Failed for user ${user.user_id}:`, userError);
        }
      }
      
      await connection.commit();
      connection.release();
      
      console.log(`✨ [MIDNIGHT RESET] Complete! Success: ${successCount}, Errors: ${errorCount}`);
      
    } catch (error) {
      console.error('💥 [MIDNIGHT RESET] Failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Change to your timezone
  });
  
  console.log('✅ Midnight quest reset scheduler initialized');
};

// Generate weekly quests every Monday at 00:00
export const scheduleWeeklyQuestGeneration = () => {
  // Run every Monday at midnight
  cron.schedule('0 0 * * 1', async () => {
    console.log('🔄 [CRON] Starting automatic weekly quest generation...');
    
    try {
      const connection = await pool.getConnection();
      
      const [users]: any = await connection.execute(`
        SELECT u.user_id, ap.field_of_interest, ap.full_name
        FROM users u
        JOIN adventurer_profiles ap ON u.user_id = ap.user_id
        WHERE u.is_active = true
      `);
      
      let successCount = 0;
      
      for (const user of users) {
        try {
          // Clear expired weekly quests
          await connection.execute(
            'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "weekly" AND expires_at < NOW()',
            [user.user_id]
          );
          
          // Check if user already has weekly quests for this week
          const [existingQuests]: any = await connection.execute(
            'SELECT COUNT(*) as count FROM user_active_quests WHERE user_id = ? AND quest_type = "weekly" AND WEEK(assigned_date) = WEEK(CURDATE())',
            [user.user_id]
          );
          
          if (existingQuests[0].count === 0) {
            // Generate new weekly quests
            const [templates]: any = await connection.execute(
              `SELECT * FROM quest_templates 
               WHERE field_name = ? AND quest_type = 'weekly' AND is_active = 1 
               ORDER BY RAND() 
               LIMIT 3`,
              [user.field_of_interest]
            );
            
            // Insert quest assignments
            for (const template of templates) {
              await connection.execute(
                `INSERT INTO user_active_quests 
                 (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
                 VALUES (?, ?, 'weekly', CURDATE(), DATE_ADD(NOW(), INTERVAL 7 DAY))`,
                [user.user_id, template.quest_template_id]
              );
            }
            
            successCount++;
            console.log(`✅ Generated weekly quests for ${user.full_name}`);
          }
        } catch (userError) {
          console.error(`❌ Failed weekly quests for user ${user.user_id}:`, userError);
        }
      }
      
      connection.release();
      console.log(`✨ [CRON] Weekly quest generation complete! Success: ${successCount}`);
      
    } catch (error) {
      console.error('💥 [CRON] Weekly quest generation failed:', error);
    }
  });
  
  console.log('✅ Weekly quest scheduler initialized (runs every Monday at midnight)');
};

// Initialize quests for new users automatically
export const initializeNewUserQuests = async (userId: number, fieldOfInterest: string) => {
  console.log(`🎯 Initializing quests for new user ${userId} (${fieldOfInterest})...`);
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
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
    
    // Initialize user stats based on field
    const [statsTemplate]: any = await connection.execute(
      'SELECT * FROM stats_template WHERE field_name = ?',
      [fieldOfInterest]
    );
    
    for (const stat of statsTemplate) {
      await connection.execute(
        `INSERT INTO user_stats (user_id, stat_name, stat_icon, current_value, max_value)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, stat.stat_name, stat.stat_icon, stat.initial_value, stat.max_value]
      );
    }
    
    await connection.commit();
    connection.release();
    
    console.log(`✅ Successfully initialized ${dailyTemplates.length} daily and ${weeklyTemplates.length} weekly quests for user ${userId}`);
    
    return {
      dailyQuests: dailyTemplates.length,
      weeklyQuests: weeklyTemplates.length,
      stats: statsTemplate.length
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize new user quests:', error);
    throw error;
  }
};

// Start all schedulers
export const startAllSchedulers = () => {
  console.log('🚀 Starting automatic quest generation system...');
  scheduleDailyQuestGeneration();
  scheduleWeeklyQuestGeneration();
  console.log('✨ All quest schedulers are now active!');
};
export const generateDailyQuestsForUser = async (userId: number, fieldOfInterest: string) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Clear existing daily quests for today
    await connection.execute(
      'DELETE FROM user_active_quests WHERE user_id = ? AND quest_type = "daily" AND DATE(assigned_date) = CURDATE()',
      [userId]
    );
    
    // Get ALL available daily quest templates for this field (no duplicates)
    const [templates]: any = await connection.execute(
      `SELECT DISTINCT quest_template_id, field_name, quest_title, quest_description, base_xp, difficulty, related_stat
       FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND()`,
      [fieldOfInterest]
    );
    
    console.log(`Found ${templates.length} unique daily quest templates for ${fieldOfInterest}`);
    
    // Determine how many quests to assign
    let questsToAssign;
    if (templates.length >= 8) {
      // If we have 8+ templates, assign 8 random ones
      questsToAssign = templates.slice(0, 8);
    } else if (templates.length >= 4) {
      // If we have 4-7 templates, assign all of them
      questsToAssign = templates;
    } else if (templates.length > 0) {
      // If we have 1-3 templates, assign them + fill with generic ones
      questsToAssign = [...templates];
      
      // Add generic quests to reach 6 total
      const genericQuests = [
        { quest_title: 'Morning Routine', base_xp: 25, difficulty: 'easy', related_stat: 'Stamina' },
        { quest_title: 'Study/Practice Session', base_xp: 35, difficulty: 'medium', related_stat: 'Intelligence' },
        { quest_title: 'Physical Exercise', base_xp: 30, difficulty: 'medium', related_stat: 'Strength' },
        { quest_title: 'Skill Development', base_xp: 40, difficulty: 'medium', related_stat: 'Intelligence' },
        { quest_title: 'Healthy Meal Planning', base_xp: 20, difficulty: 'easy', related_stat: 'Wisdom' },
      ];
      
      const needed = Math.min(6 - templates.length, genericQuests.length);
      for (let i = 0; i < needed; i++) {
        questsToAssign.push({
          quest_template_id: null,
          ...genericQuests[i]
        });
      }
    } else {
      // No templates found - use all generic quests
      questsToAssign = [
        { quest_template_id: null, quest_title: 'Morning Routine', base_xp: 25, difficulty: 'easy', related_stat: 'Stamina' },
        { quest_template_id: null, quest_title: 'Study/Practice Session', base_xp: 35, difficulty: 'medium', related_stat: 'Intelligence' },
        { quest_template_id: null, quest_title: 'Physical Exercise', base_xp: 30, difficulty: 'medium', related_stat: 'Strength' },
        { quest_template_id: null, quest_title: 'Skill Development', base_xp: 40, difficulty: 'medium', related_stat: 'Intelligence' },
        { quest_template_id: null, quest_title: 'Healthy Meal Planning', base_xp: 20, difficulty: 'easy', related_stat: 'Wisdom' },
        { quest_template_id: null, quest_title: 'Evening Reflection', base_xp: 20, difficulty: 'easy', related_stat: 'Wisdom' }
      ];
    }
    
    // Insert the assigned quests (NO DUPLICATES)
    for (const quest of questsToAssign) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [userId, quest.quest_template_id]
      );
    }
    
    await connection.commit();
    console.log(`✅ Assigned ${questsToAssign.length} unique daily quests to user ${userId}`);
    
    return questsToAssign;
    
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Failed to generate daily quests for user ${userId}:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Automated Quest Expiration Scheduler
 * Runs every day at midnight to expire old quests and generate new ones
 */

const generateUniqueQuestsForUser = async (connection: any, userId: number, fieldOfInterest: string) => {
  // Same logic as in questController - you might want to extract this to a shared utility
  try {
    const [templates]: any = await connection.execute(
      `SELECT * FROM quest_templates 
       WHERE field_name = ? AND quest_type = 'daily' AND is_active = 1 
       ORDER BY RAND()`,
      [fieldOfInterest]
    );
    
    // Apply uniqueness logic (shortened for brevity)
    const selectedQuests: any[] = [];
    const usedQuestIds = new Set<number>();
    const usedQuestTitles = new Set<string>();
    
    // Selection logic here...
    for (const template of templates) {
      if (selectedQuests.length >= 8) break;
      if (usedQuestIds.has(template.quest_template_id)) continue;
      
      selectedQuests.push(template);
      usedQuestIds.add(template.quest_template_id);
      usedQuestTitles.add(template.quest_title.toLowerCase().trim());
    }
    
    // Insert new quests
    for (const template of selectedQuests.slice(0, 8)) {
      await connection.execute(
        `INSERT INTO user_active_quests 
         (user_id, quest_template_id, quest_type, assigned_date, expires_at) 
         VALUES (?, ?, 'daily', CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [userId, template.quest_template_id]
      );
    }
    
    return selectedQuests;
  } catch (error) {
    console.error('Generate quests error:', error);
    return [];
  }
};

const automatedQuestReset = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log(`[${new Date().toISOString()}] 🕒 Starting automated daily quest reset...`);
    
    // Step 1: Expire uncompleted daily quests
    const [expired]: any = await connection.execute(
      `UPDATE user_active_quests 
       SET expires_at = NOW() - INTERVAL 1 SECOND
       WHERE quest_type = 'daily' 
       AND expires_at < NOW() 
       AND is_completed = FALSE`
    );
    
    console.log(`⏰ Expired ${expired.affectedRows} uncompleted daily quests`);
    
    // Step 2: Get users needing new quests
    const [users]: any = await connection.execute(
      `SELECT DISTINCT u.user_id, ap.field_of_interest, u.email
       FROM users u
       JOIN adventurer_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN user_active_quests uaq ON u.user_id = uaq.user_id 
         AND uaq.quest_type = 'daily' 
         AND uaq.expires_at > NOW()
       WHERE u.user_type = 'adventurer' 
       AND uaq.user_id IS NULL`
    );
    
    console.log(`👥 Generating fresh quests for ${users.length} users`);
    
    // Step 3: Generate new quests for each user
    let successCount = 0;
    for (const user of users) {
      try {
        const newQuests = await generateUniqueQuestsForUser(
          connection, 
          user.user_id, 
          user.field_of_interest
        );
        
        if (newQuests.length > 0) {
          successCount++;
        }
      } catch (userError) {
        console.error(`Error for user ${user.email}:`, userError);
      }
    }
    
    // Step 4: Clean up old expired quests
    const [cleanup]: any = await connection.execute(
      `DELETE FROM user_active_quests 
       WHERE expires_at < NOW() - INTERVAL 7 DAY 
       AND is_completed = FALSE`
    );
    
    await connection.commit();
    
    console.log(`✅ Quest reset complete: ${successCount}/${users.length} users renewed, ${cleanup.affectedRows} old quests cleaned`);
    
  } catch (error) {
    await connection.rollback();
    console.error('Automated quest reset error:', error);
  } finally {
    connection.release();
  }
};

// Schedule the automated quest reset
export const startQuestScheduler = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', automatedQuestReset, {
    scheduled: true,
    timezone: "America/New_York" // Change to your timezone
  });
  
  // Optional: Run every hour for testing (comment out in production)
  // cron.schedule('0 * * * *', automatedQuestReset);
  
  console.log('🚀 Quest scheduler started - will reset daily quests at midnight');
};

export default { startQuestScheduler };