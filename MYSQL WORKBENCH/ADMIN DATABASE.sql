USE solo_leveling_system;

-- Add admin to user_type enum
ALTER TABLE users MODIFY COLUMN user_type ENUM('adventurer', 'coach', 'admin') NOT NULL;

-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
    admin_profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'System Administration',
    access_level ENUM('SUPER_ADMIN', 'ADMIN', 'MODERATOR') DEFAULT 'MODERATOR',
    permissions JSON,
    last_action VARCHAR(255),
    last_action_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Create admin action logs table
CREATE TABLE IF NOT EXISTS admin_action_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    action_details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created (created_at)
);

-- Create a default admin user
INSERT INTO users (email, username, password_hash, user_type, created_at) 
VALUES ('admin@sololeveling.com', 'admin', '$2b$10$YourHashedPasswordHere', 'admin', NOW());

-- Get the admin user_id
SET @admin_id = LAST_INSERT_ID();

-- Create admin profile
INSERT INTO admin_profiles (user_id, full_name, department, access_level) 
VALUES (@admin_id, 'System Administrator', 'System Administration', 'SUPER_ADMIN');

-- Check if the table exists and its structure
SHOW TABLES LIKE 'activity_logs';

-- Check how many rows are in the table
SELECT COUNT(*) FROM activity_logs;

-- Check the current structure
SHOW CREATE TABLE activity_logs;

CREATE TABLE admin_action_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT,
    action_type VARCHAR(100),
    target_type VARCHAR(50),
    target_id INT,
    action_details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_created (created_at)
);

-- Create active_quests table
-- Run this in MySQL Workbench or via a script

USE solo_leveling_system;

CREATE TABLE IF NOT EXISTS active_quests (
    quest_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quest_template_id INT,
    quest_type ENUM('daily', 'weekly', 'special', 'main') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quest_data JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    exp_reward INT DEFAULT 0,
    gold_reward INT DEFAULT 0,
    status ENUM('active', 'completed', 'failed', 'expired') DEFAULT 'active',
    progress INT DEFAULT 0,
    max_progress INT DEFAULT 100,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_quest_type (quest_type),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);