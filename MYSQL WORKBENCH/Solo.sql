-- =====================================================
-- SOLO LEVELING LIFE SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS solo_leveling_system;
USE solo_leveling_system;

-- =====================================================
-- 1. USERS TABLE (Core user authentication)
-- =====================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('adventurer', 'coach') NOT NULL,
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_user_type (user_type)
);

-- =====================================================
-- 2. ADVENTURER PROFILES (Extended profile for adventurers)
-- =====================================================
CREATE TABLE adventurer_profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    field_of_interest VARCHAR(100) NOT NULL,
    custom_goal TEXT,
    commitment_level ENUM('30_minutes', '1_hour', '2_hours', '3_plus_hours') NOT NULL,
    experience_level ENUM('beginner', 'some_experience', 'intermediate', 'advanced') NOT NULL,
    current_level INT DEFAULT 1,
    total_exp INT DEFAULT 0,
    current_exp INT DEFAULT 0,
    exp_to_next_level INT DEFAULT 100,
    streak_days INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    title VARCHAR(255) DEFAULT 'Novice Adventurer',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_field_of_interest (field_of_interest),
    INDEX idx_level (current_level)
);

-- =====================================================
-- 3. COACH PROFILES (Extended profile for coaches)
-- =====================================================
CREATE TABLE coach_profiles (
    coach_profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    bio TEXT,
    credentials TEXT,
    years_experience INT,
    max_students INT DEFAULT 10,
    current_students INT DEFAULT 0,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_specialization (specialization)
);

-- =====================================================
-- 4. COACH-STUDENT RELATIONSHIPS
-- =====================================================
CREATE TABLE coach_student_relationships (
    relationship_id INT PRIMARY KEY AUTO_INCREMENT,
    coach_user_id INT NOT NULL,
    student_user_id INT NOT NULL,
    status ENUM('pending', 'active', 'terminated') DEFAULT 'pending',
    relationship_type ENUM('primary', 'secondary', 'observer') DEFAULT 'primary',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (coach_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_coach_student (coach_user_id, student_user_id),
    INDEX idx_coach (coach_user_id),
    INDEX idx_student (student_user_id),
    INDEX idx_status (status)
);

-- =====================================================
-- 5. FIELDS OF INTEREST (Master table for all fields)
-- =====================================================
CREATE TABLE fields_of_interest (
    field_id INT PRIMARY KEY AUTO_INCREMENT,
    field_name VARCHAR(100) UNIQUE NOT NULL,
    field_icon VARCHAR(10),
    field_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all predefined fields
INSERT INTO fields_of_interest (field_name, field_icon) VALUES
('Elite Athlete', '🏆'),
('Academic Excellence', '📚'),
('Physical Fitness', '💪'),
('Professional Growth', '💼'),
('Creative Mastery', '🎨'),
('Mental Wellness', '🧠'),
('Programming Skills', '💻'),
('Language Learning', '🌍'),
('Music Production', '🎵'),
('Content Creation', '📹'),
('Writing & Literature', '✍️'),
('Business & Entrepreneurship', '📈'),
('Martial Arts', '🥋'),
('Cooking & Nutrition', '🍳'),
('Public Speaking', '🎤'),
('Digital Art & Design', '🎨'),
('Photography', '📷'),
('Gaming & Esports', '🎮'),
('Meditation & Mindfulness', '🧘'),
('Social Skills', '🤝'),
('Financial Literacy', '💰'),
('Scientific Research', '🔬'),
('Dance & Movement', '💃'),
('Chess & Strategy', '♟️'),
('Custom Goal', '⭐');

-- =====================================================
-- 6. STATS TEMPLATE (Stats for each field)
-- =====================================================
CREATE TABLE stats_template (
    stat_template_id INT PRIMARY KEY AUTO_INCREMENT,
    field_name VARCHAR(100) NOT NULL,
    stat_name VARCHAR(100) NOT NULL,
    stat_icon VARCHAR(10),
    max_value INT DEFAULT 100,
    initial_value INT DEFAULT 10,
    stat_order INT DEFAULT 0,
    FOREIGN KEY (field_name) REFERENCES fields_of_interest(field_name) ON DELETE CASCADE,
    UNIQUE KEY unique_field_stat (field_name, stat_name),
    INDEX idx_field (field_name)
);

-- Insert stats for each field (sample for a few fields)
-- Elite Athlete Stats
INSERT INTO stats_template (field_name, stat_name, stat_icon, stat_order) VALUES
('Elite Athlete', 'Technical Skill', '🎯', 1),
('Elite Athlete', 'Physical Power', '💪', 2),
('Elite Athlete', 'Stamina', '🏃', 3),
('Elite Athlete', 'Mental Focus', '🧠', 4),
('Elite Athlete', 'Recovery', '💤', 5),
('Elite Athlete', 'Tactical IQ', '♟️', 6);

-- Programming Skills Stats
INSERT INTO stats_template (field_name, stat_name, stat_icon, stat_order) VALUES
('Programming Skills', 'Algorithm Mastery', '🔢', 1),
('Programming Skills', 'Debug Power', '🐛', 2),
('Programming Skills', 'Code Quality', '✨', 3),
('Programming Skills', 'Speed', '⚡', 4),
('Programming Skills', 'Architecture', '🏗️', 5),
('Programming Skills', 'Problem Solving', '🧩', 6);

-- Add more stats for other fields as needed...

-- =====================================================
-- 7. USER STATS (Actual stats for each user)
-- =====================================================
CREATE TABLE user_stats (
    user_stat_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    stat_name VARCHAR(100) NOT NULL,
    stat_icon VARCHAR(10),
    current_value INT DEFAULT 10,
    max_value INT DEFAULT 100,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stat (user_id, stat_name),
    INDEX idx_user (user_id)
);

-- =====================================================
-- 8. QUEST TEMPLATES (Master quest pool)
-- =====================================================
CREATE TABLE quest_templates (
    quest_template_id INT PRIMARY KEY AUTO_INCREMENT,
    field_name VARCHAR(100) NOT NULL,
    quest_type ENUM('daily', 'weekly', 'special', 'main') NOT NULL,
    quest_title VARCHAR(255) NOT NULL,
    quest_description TEXT,
    base_xp INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    related_stat VARCHAR(100),
    stat_increase INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_name) REFERENCES fields_of_interest(field_name) ON DELETE CASCADE,
    INDEX idx_field_type (field_name, quest_type),
    INDEX idx_related_stat (related_stat)
);

-- Insert sample quests for Elite Athlete
INSERT INTO quest_templates (field_name, quest_type, quest_title, base_xp, difficulty, related_stat) VALUES
-- Daily quests - one for each stat
('Elite Athlete', 'daily', 'Practice technical drills (30 min)', 35, 'medium', 'Technical Skill'),
('Elite Athlete', 'daily', 'Complete strength training session', 30, 'medium', 'Physical Power'),
('Elite Athlete', 'daily', 'Cardio endurance training', 30, 'medium', 'Stamina'),
('Elite Athlete', 'daily', 'Mental visualization practice', 25, 'easy', 'Mental Focus'),
('Elite Athlete', 'daily', 'Recovery stretching and foam rolling', 20, 'easy', 'Recovery'),
('Elite Athlete', 'daily', 'Study game footage and tactics', 30, 'medium', 'Tactical IQ'),
-- Additional daily quests for variety
('Elite Athlete', 'daily', 'Morning warm-up routine', 20, 'easy', 'Physical Power'),
('Elite Athlete', 'daily', 'Track nutrition intake', 15, 'easy', 'Recovery'),
('Elite Athlete', 'daily', 'Hydration goal (3L water)', 15, 'easy', 'Stamina'),
('Elite Athlete', 'daily', 'Equipment maintenance check', 10, 'easy', 'Technical Skill'),
('Elite Athlete', 'daily', 'Meditation for focus', 20, 'easy', 'Mental Focus'),
('Elite Athlete', 'daily', 'Agility ladder drills', 25, 'medium', 'Technical Skill');

-- Programming Skills daily quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, base_xp, difficulty, related_stat) VALUES
('Programming Skills', 'daily', 'Solve algorithm challenge', 35, 'medium', 'Algorithm Mastery'),
('Programming Skills', 'daily', 'Debug existing code', 30, 'hard', 'Debug Power'),
('Programming Skills', 'daily', 'Code review and refactor', 25, 'medium', 'Code Quality'),
('Programming Skills', 'daily', 'Speed coding practice', 30, 'medium', 'Speed'),
('Programming Skills', 'daily', 'Design system architecture', 35, 'hard', 'Architecture'),
('Programming Skills', 'daily', 'Solve logic puzzles', 25, 'medium', 'Problem Solving'),
('Programming Skills', 'daily', 'Write unit tests', 25, 'medium', 'Code Quality'),
('Programming Skills', 'daily', 'Learn new framework feature', 30, 'medium', 'Architecture'),
('Programming Skills', 'daily', 'Optimize code performance', 35, 'hard', 'Speed'),
('Programming Skills', 'daily', 'Documentation writing', 20, 'easy', 'Code Quality');

-- =====================================================
-- 9. USER ACTIVE QUESTS (Currently assigned quests)
-- =====================================================
CREATE TABLE user_active_quests (
    active_quest_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quest_template_id INT NOT NULL,
    quest_type ENUM('daily', 'weekly', 'special', 'main') NOT NULL,
    assigned_date DATE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    xp_earned INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_template_id) REFERENCES quest_templates(quest_template_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, assigned_date),
    INDEX idx_user_type (user_id, quest_type),
    INDEX idx_expires (expires_at)
);

-- =====================================================
-- 10. QUEST COMPLETION HISTORY
-- =====================================================
DROP TABLE IF EXISTS quest_completion_history;
CREATE TABLE quest_completion_history (
    completion_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quest_template_id INT, -- Changed to allow NULL (was INT NOT NULL)
    quest_type VARCHAR(20) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_earned INT NOT NULL,
    time_to_complete INT COMMENT 'Time in minutes',
    difficulty_rating INT COMMENT 'User rating 1-5',
    notes TEXT,
    verified_by_coach BOOLEAN DEFAULT FALSE,
    coach_user_id INT,
    verification_method ENUM('manual', 'photo', 'video', 'gps', 'app_integration') DEFAULT 'manual',
    proof_url VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_template_id) REFERENCES quest_templates(quest_template_id) ON DELETE SET NULL,
    FOREIGN KEY (coach_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_completed_at (completed_at),
    INDEX idx_coach_verification (coach_user_id, verified_by_coach)
);
-- =====================================================
-- 11. LEVEL PROGRESSION HISTORY
-- =====================================================
CREATE TABLE level_progression (
    progression_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    old_level INT NOT NULL,
    new_level INT NOT NULL,
    total_exp_at_levelup INT NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    milestone_name VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_achieved_at (achieved_at)
);

-- =====================================================
-- 12. DAILY CHECK-INS (For streak tracking)
-- =====================================================
CREATE TABLE daily_checkins (
    checkin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    checkin_date DATE NOT NULL,
    quests_completed INT DEFAULT 0,
    total_xp_earned INT DEFAULT 0,
    mood_rating INT COMMENT '1-5 scale',
    energy_level INT COMMENT '1-5 scale',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, checkin_date),
    INDEX idx_user (user_id),
    INDEX idx_date (checkin_date)
);

-- =====================================================
-- 13. ACHIEVEMENTS (Badges and milestones)
-- =====================================================
CREATE TABLE achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(10),
    achievement_type ENUM('streak', 'level', 'quest', 'stat', 'special') NOT NULL,
    requirement_value INT,
    xp_reward INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert sample achievements
INSERT INTO achievements (achievement_name, achievement_description, achievement_icon, achievement_type, requirement_value, xp_reward) VALUES
('First Steps', 'Complete your first quest', '👣', 'quest', 1, 50),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7, 100),
('Month Master', 'Maintain a 30-day streak', '💎', 'streak', 30, 500),
('Level 10', 'Reach Level 10', '⭐', 'level', 10, 200),
('Quest Hunter', 'Complete 100 quests', '🎯', 'quest', 100, 300),
('Stat Master', 'Max out any stat', '💯', 'stat', 100, 400);

INSERT IGNORE INTO achievements (achievement_name, achievement_description, achievement_icon, achievement_type, requirement_value, xp_reward) VALUES
('Level 5 Hunter', 'Reach Level 5', '⭐', 'level', 5, 150),
('Quest Master', 'Complete 50 quests', '👑', 'quest', 50, 500),
('Dedication', 'Maintain a 30-day streak', '💎', 'streak', 30, 1000),
('Power Surge', 'Reach 1000 total XP', '⚡', 'special', 1000, 200),
('Elite Hunter', 'Reach Level 20', '🏆', 'level', 20, 600),
('Shadow Monarch', 'Reach Level 50', '👤', 'level', 50, 2000);

-- =====================================================
-- 14. USER ACHIEVEMENTS (Earned achievements)
-- =====================================================
CREATE TABLE user_achievements (
    user_achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user (user_id)
);

-- =====================================================
-- 15. COACH FEEDBACK (Comments from coaches)
-- =====================================================
CREATE TABLE coach_feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    coach_user_id INT NOT NULL,
    student_user_id INT NOT NULL,
    feedback_type ENUM('daily', 'weekly', 'quest', 'general') NOT NULL,
    related_quest_id INT,
    feedback_text TEXT NOT NULL,
    rating INT COMMENT '1-5 scale',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_quest_id) REFERENCES quest_completion_history(completion_id) ON DELETE SET NULL,
    INDEX idx_student (student_user_id),
    INDEX idx_coach (coach_user_id),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 16. NOTIFICATION QUEUE
-- =====================================================
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type ENUM('quest_reminder', 'level_up', 'achievement', 'coach_feedback', 'streak_warning', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 17. ACTIVITY LOGS (For detailed tracking)
-- =====================================================
CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type ENUM('login', 'quest_complete', 'level_up', 'stat_increase', 'achievement_earned', 'profile_update') NOT NULL,
    activity_details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 18. SESSIONS (For managing active sessions)
-- =====================================================
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);

-- =====================================================
-- 19. MEDIA UPLOADS (For profile photos and proof)
-- =====================================================
CREATE TABLE media_uploads (
    media_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    media_type ENUM('profile_photo', 'quest_proof', 'achievement_badge') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (media_type)
);

-- =====================================================
-- 20. SYSTEM SETTINGS (For app configuration)
-- =====================================================
CREATE TABLE system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('daily_quest_count', '8', 'number', 'Number of daily quests assigned to users'),
('weekly_quest_count', '3', 'number', 'Number of weekly quests assigned to users'),
('level_multiplier', '1.5', 'number', 'XP multiplier for each level'),
('streak_bonus_xp', '50', 'number', 'Bonus XP for maintaining streaks'),
('max_coach_students', '20', 'number', 'Maximum students per coach'),
('quest_refresh_hour', '0', 'number', 'Hour of day when daily quests refresh (24-hour format)');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_quest_completion_date ON quest_completion_history(user_id, completed_at);
CREATE INDEX idx_active_quests_user ON user_active_quests(user_id, is_completed);
CREATE INDEX idx_checkin_streak ON daily_checkins(user_id, checkin_date DESC);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for coach dashboard
CREATE VIEW coach_student_overview AS
SELECT 
    csr.coach_user_id,
    csr.student_user_id,
    u.username AS student_username,
    ap.full_name AS student_name,
    ap.field_of_interest,
    ap.current_level,
    ap.total_exp,
    ap.streak_days,
    ap.last_activity_date,
    COUNT(DISTINCT qch.completion_id) AS total_quests_completed,
    COUNT(DISTINCT CASE WHEN DATE(qch.completed_at) = CURDATE() THEN qch.completion_id END) AS quests_today
FROM coach_student_relationships csr
JOIN users u ON u.user_id = csr.student_user_id
JOIN adventurer_profiles ap ON ap.user_id = csr.student_user_id
LEFT JOIN quest_completion_history qch ON qch.user_id = csr.student_user_id
WHERE csr.status = 'active'
GROUP BY csr.coach_user_id, csr.student_user_id;

-- View for user progress summary
CREATE VIEW user_progress_summary AS
SELECT 
    u.user_id,
    u.username,
    ap.full_name,
    ap.field_of_interest,
    ap.current_level,
    ap.total_exp,
    ap.streak_days,
    COUNT(DISTINCT qch.completion_id) AS total_quests,
    COUNT(DISTINCT ua.achievement_id) AS total_achievements,
    AVG(us.current_value) AS avg_stat_level
FROM users u
JOIN adventurer_profiles ap ON ap.user_id = u.user_id
LEFT JOIN quest_completion_history qch ON qch.user_id = u.user_id
LEFT JOIN user_achievements ua ON ua.user_id = u.user_id
LEFT JOIN user_stats us ON us.user_id = u.user_id
WHERE u.user_type = 'adventurer'
GROUP BY u.user_id;

-- TRIGGER 1: Create User Stats on Profile Creation
CREATE TRIGGER create_user_stats_on_profile
AFTER INSERT ON adventurer_profiles
FOR EACH ROW
INSERT INTO user_stats (user_id, stat_name, stat_icon, current_value, max_value)
SELECT NEW.user_id, stat_name, stat_icon, initial_value, max_value
FROM stats_template
WHERE field_name = NEW.field_of_interest;

-- TRIGGER 2: Update Coach Student Count on Active Relationship
CREATE TRIGGER update_coach_student_count
AFTER INSERT ON coach_student_relationships
FOR EACH ROW
UPDATE coach_profiles
SET current_students = current_students + 1
WHERE user_id = NEW.coach_user_id AND NEW.status = 'active';

-- TRIGGER 3: Update Last Login Timestamp
CREATE TRIGGER update_last_login
AFTER INSERT ON user_sessions
FOR EACH ROW
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE user_id = NEW.user_id;

-- TRIGGER 4: Create Level Up Notification
CREATE TRIGGER notify_level_up
AFTER INSERT ON level_progression
FOR EACH ROW
INSERT INTO notifications (user_id, notification_type, title, message, expires_at)
VALUES (NEW.user_id, 'level_up', CONCAT('Level ', NEW.new_level, ' Achieved!'), 
        CONCAT('Congratulations! You have reached Level ', NEW.new_level, '!'),
        DATE_ADD(NOW(), INTERVAL 30 DAY));

-- TRIGGER 5: Update Profile Timestamp on Stats Change
CREATE TRIGGER update_profile_on_stat_change
AFTER UPDATE ON user_stats
FOR EACH ROW
UPDATE adventurer_profiles
SET updated_at = CURRENT_TIMESTAMP
WHERE user_id = NEW.user_id;

-- TRIGGER 6: Create Welcome Notification
CREATE TRIGGER welcome_new_adventurer
AFTER INSERT ON adventurer_profiles
FOR EACH ROW
INSERT INTO notifications (user_id, notification_type, title, message, action_url, expires_at)
VALUES (NEW.user_id, 'system', 'Welcome to Solo Leveling Life System!',
        CONCAT('Welcome, ', NEW.full_name, '! Your journey begins now!'),
        '/dashboard', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- TRIGGER 7: Initialize Daily Checkin
CREATE TRIGGER init_daily_checkin
AFTER INSERT ON adventurer_profiles
FOR EACH ROW
INSERT INTO daily_checkins (user_id, checkin_date, quests_completed, total_xp_earned)
VALUES (NEW.user_id, CURDATE(), 0, 0);

-- TRIGGER 8: Log Login Activity
CREATE TRIGGER log_login_activity
AFTER INSERT ON user_sessions
FOR EACH ROW
INSERT INTO activity_logs (user_id, activity_type, activity_details, ip_address, user_agent)
VALUES (NEW.user_id, 'login', '{"session_created": true}', NEW.ip_address, NEW.user_agent);

-- TRIGGER 9: Update Total XP on Quest Completion
CREATE TRIGGER update_total_xp
AFTER INSERT ON quest_completion_history
FOR EACH ROW
UPDATE adventurer_profiles
SET total_exp = total_exp + NEW.xp_earned
WHERE user_id = NEW.user_id;

-- TRIGGER 10: Track Profile Updates
CREATE TRIGGER track_profile_update
AFTER UPDATE ON adventurer_profiles
FOR EACH ROW
INSERT INTO activity_logs (user_id, activity_type, activity_details)
VALUES (NEW.user_id, 'profile_update', CONCAT('{"level":', NEW.current_level, ',"exp":', NEW.total_exp, '}'));



-- Create index for better performance
CREATE INDEX  idx_quest_user_type_expires 
ON user_active_quests(user_id, quest_type, expires_at);

CREATE INDEX  idx_quest_completion_user_date 
ON quest_completion_history(user_id, completed_at);

CREATE INDEX  idx_user_stats_user 
ON user_stats(user_id);

CREATE INDEX  idx_daily_checkin_user_date 
ON daily_checkins(user_id, checkin_date);

SELECT user_id, username, profile_photo_url FROM users;

ALTER TABLE coach_feedback 
MODIFY COLUMN feedback_type ENUM('daily', 'weekly', 'quest', 'general', 'guidance') NOT NULL;