-- =====================================================
-- STREAK SYSTEM DATABASE MAINTENANCE & FIXES
-- =====================================================

-- 1. Check current streak data integrity
SELECT 
    ap.user_id,
    ap.full_name,
    ap.streak_days,
    ap.longest_streak,
    ap.last_activity_date,
    COUNT(DISTINCT DATE(qch.completed_at)) as actual_active_days,
    MAX(DATE(qch.completed_at)) as last_quest_date
FROM adventurer_profiles ap
LEFT JOIN quest_completion_history qch ON ap.user_id = qch.user_id
GROUP BY ap.user_id, ap.full_name, ap.streak_days, ap.longest_streak, ap.last_activity_date
ORDER BY ap.user_id;

-- 2. Check daily_checkins table integrity
SELECT 
    user_id,
    COUNT(*) as total_checkins,
    MIN(checkin_date) as first_checkin,
    MAX(checkin_date) as last_checkin,
    SUM(quests_completed) as total_quests_in_checkins,
    SUM(total_xp_earned) as total_xp_in_checkins
FROM daily_checkins
GROUP BY user_id
ORDER BY user_id;

-- 3. Fix missing daily_checkins entries
-- This will create checkin entries for dates when users completed quests but don't have checkins
INSERT IGNORE INTO daily_checkins (user_id, checkin_date, quests_completed, total_xp_earned)
SELECT 
    qch.user_id,
    DATE(qch.completed_at) as checkin_date,
    COUNT(*) as quests_completed,
    SUM(qch.xp_earned) as total_xp_earned
FROM quest_completion_history qch
LEFT JOIN daily_checkins dc ON qch.user_id = dc.user_id AND DATE(qch.completed_at) = dc.checkin_date
WHERE dc.checkin_id IS NULL
GROUP BY qch.user_id, DATE(qch.completed_at);

-- 4. Recalculate streaks for all users (run this to fix existing data)
DELIMITER $$
CREATE PROCEDURE RecalculateAllStreaks()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id INT;
    DECLARE cur CURSOR FOR SELECT DISTINCT user_id FROM adventurer_profiles;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    user_loop: LOOP
        FETCH cur INTO v_user_id;
        IF done THEN
            LEAVE user_loop;
        END IF;
        
        CALL RecalculateUserStreak(v_user_id);
    END LOOP;
    
    CLOSE cur;
    
    SELECT 'All user streaks have been recalculated' as result;
END$$
DELIMITER ;

-- 5. Recalculate streak for a specific user
DELIMITER $$
CREATE PROCEDURE RecalculateUserStreak(IN p_user_id INT)
BEGIN
    DECLARE v_current_streak INT DEFAULT 0;
    DECLARE v_longest_streak INT DEFAULT 0;
    DECLARE v_last_date DATE DEFAULT NULL;
    DECLARE v_temp_streak INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_checkin_date DATE;
    
    -- Cursor to get all checkin dates for the user in chronological order
    DECLARE date_cursor CURSOR FOR 
        SELECT DISTINCT checkin_date 
        FROM daily_checkins 
        WHERE user_id = p_user_id 
        ORDER BY checkin_date ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Initialize variables
    SET v_current_streak = 0;
    SET v_longest_streak = 0;
    SET v_temp_streak = 0;
    
    OPEN date_cursor;
    
    date_loop: LOOP
        FETCH date_cursor INTO v_checkin_date;
        IF done THEN
            LEAVE date_loop;
        END IF;
        
        IF v_last_date IS NULL THEN
            -- First date
            SET v_temp_streak = 1;
        ELSEIF DATEDIFF(v_checkin_date, v_last_date) = 1 THEN
            -- Consecutive day
            SET v_temp_streak = v_temp_streak + 1;
        ELSE
            -- Gap in dates, reset streak
            IF v_temp_streak > v_longest_streak THEN
                SET v_longest_streak = v_temp_streak;
            END IF;
            SET v_temp_streak = 1;
        END IF;
        
        SET v_last_date = v_checkin_date;
    END LOOP;
    
    CLOSE date_cursor;
    
    -- Check if the final streak is the longest
    IF v_temp_streak > v_longest_streak THEN
        SET v_longest_streak = v_temp_streak;
    END IF;
    
    -- Determine current streak (only if last activity was recent)
    IF v_last_date IS NOT NULL AND DATEDIFF(CURDATE(), v_last_date) <= 1 THEN
        SET v_current_streak = v_temp_streak;
    ELSE
        SET v_current_streak = 0;
    END IF;
    
    -- Update the user's profile
    UPDATE adventurer_profiles 
    SET 
        streak_days = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_last_date
    WHERE user_id = p_user_id;
    
END$$
DELIMITER ;

-- 6. Test the recalculation for a specific user (replace 1 with actual user_id)
-- CALL RecalculateUserStreak(3);

-- 7. Run full recalculation for all users (uncomment if needed)
-- CALL RecalculateAllStreaks();

-- 8. Check for users who might have streak achievements but don't have them yet
SELECT 
    ap.user_id,
    ap.full_name,
    ap.streak_days,
    ap.longest_streak,
    CASE 
        WHEN ap.streak_days >= 30 THEN 'Should have 30-day streak achievement'
        WHEN ap.streak_days >= 7 THEN 'Should have 7-day streak achievement'
        ELSE 'No streak achievements due'
    END as achievement_status,
    COUNT(ua.achievement_id) as current_streak_achievements
FROM adventurer_profiles ap
LEFT JOIN user_achievements ua ON ap.user_id = ua.user_id 
    AND ua.achievement_id IN (SELECT achievement_id FROM achievements WHERE achievement_type = 'streak')
WHERE ap.streak_days > 0
GROUP BY ap.user_id, ap.full_name, ap.streak_days, ap.longest_streak;

-- 9. Clean up any orphaned daily_checkins (users that don't exist)
DELETE dc FROM daily_checkins dc
LEFT JOIN adventurer_profiles ap ON dc.user_id = ap.user_id
WHERE ap.user_id IS NULL;

-- 10. Add indexes for better performance if they don't exist
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);
CREATE INDEX idx_adventurer_profiles_streak ON adventurer_profiles(streak_days, last_activity_date);

-- 11. View to easily check streak status for all users
CREATE OR REPLACE VIEW user_streak_status AS
SELECT 
    u.user_id,
    u.username,
    ap.full_name,
    ap.streak_days,
    ap.longest_streak,
    ap.last_activity_date,
    DATEDIFF(CURDATE(), ap.last_activity_date) as days_since_last_activity,
    CASE 
        WHEN DATEDIFF(CURDATE(), ap.last_activity_date) = 0 THEN 'Active today'
        WHEN DATEDIFF(CURDATE(), ap.last_activity_date) = 1 THEN 'Streak at risk'
        WHEN DATEDIFF(CURDATE(), ap.last_activity_date) > 1 THEN 'Streak broken'
        ELSE 'Unknown'
    END as streak_status,
    COUNT(DISTINCT dc.checkin_date) as total_active_days
FROM users u
JOIN adventurer_profiles ap ON u.user_id = ap.user_id
LEFT JOIN daily_checkins dc ON u.user_id = dc.user_id
GROUP BY u.user_id, u.username, ap.full_name, ap.streak_days, ap.longest_streak, ap.last_activity_date
ORDER BY ap.streak_days DESC;

-- 12. Select from the view to see current status
SELECT * FROM user_streak_status;

-- 13. Test data insertion (for testing the streak system)
-- Insert some test quest completions to verify streak calculation
 INSERT INTO quest_completion_history (user_id, quest_template_id, quest_type, xp_earned, completed_at) 
 VALUES 
     (1, 1, 'daily', 30, DATE_SUB(NOW(), INTERVAL 2 DAY)),
     (1, 2, 'daily', 35, DATE_SUB(NOW(), INTERVAL 1 DAY)),
     (1, 3, 'daily', 25, NOW());