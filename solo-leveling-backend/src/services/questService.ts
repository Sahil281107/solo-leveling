import pool from '../config/database';

export const resetDailyQuests = async () => {
  try {
    console.log('Starting daily quest reset...');
    
    const [users]: any = await pool.execute(
      'SELECT user_id FROM adventurer_profiles'
    );
    
    for (const user of users) {
      await pool.execute('CALL AssignDailyQuests(?)', [user.user_id]);
    }
    
    console.log('✅ Daily quests reset completed');
  } catch (error: any) {
    console.error('❌ Daily quest reset failed:', error.message);
  }
};