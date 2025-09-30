-- Enhanced System Settings for Solo Leveling Admin
-- Add this to your existing database
USE solo_leveling_system;

-- First, let's add all the settings we need to your existing system_settings table
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
-- Quest System Settings
('daily_quest_count', '8', 'number', 'Number of daily quests assigned to users'),
('weekly_quest_count', '3', 'number', 'Number of weekly quests assigned to users'),
('level_multiplier', '1.5', 'number', 'XP multiplier for each level'),
('streak_bonus_xp', '50', 'number', 'Bonus XP for maintaining streaks'),
('streak_bonus_enabled', 'true', 'boolean', 'Enable streak bonus system'),
('quest_refresh_hour', '0', 'number', 'Hour of day when daily quests refresh (24-hour format)'),
('auto_generate_quests', 'true', 'boolean', 'Enable AI-powered quest generation'),
('ai_quest_model', 'gpt-4-turbo', 'string', 'AI model for quest generation'),

-- Level & Progression Settings
('base_xp_per_level', '100', 'number', 'Base experience points required for first level'),
('xp_scaling_factor', '1.5', 'number', 'level_progression', 'Scaling factor for XP requirements per level', 1, 1),
('max_level_cap', '100', 'number', 'Maximum achievable level (0 = unlimited)'),
('title_unlocks_enabled', 'true', 'boolean', 'Enable automatic title unlocks at levels'),
('prestige_system_enabled', 'false', 'boolean', 'Enable prestige system'),
('prestige_unlock_level', '50', 'number', 'Level required to unlock prestige'),
('level_up_rewards_enabled', 'true', 'boolean', 'level_progression', 'Enable rewards for leveling up', 1, 1),
('streak_bonus_enabled', 'true', 'boolean', 'level_progression', 'Enable streak bonuses for consecutive daily quest completion', 1, 1),
('streak_bonus_multiplier', '0.1', 'number', 'level_progression', 'Multiplier increase per consecutive day (10% = 0.1)', 1, 1),
('max_streak_bonus', '2.0', 'number', 'level_progression', 'Maximum streak bonus multiplier (2.0 = 200%)', 1, 1),

-- Security & Authentication (you already have some)
('max_login_attempts', '5', 'number', 'Maximum login attempts before rate limiting'),
('login_rate_limit_window', '900', 'number', 'Rate limit window in seconds (15 minutes)'),
('session_lifetime_days', '7', 'number', 'Default session lifetime in days'),
('two_factor_enabled', 'false', 'boolean', 'Require 2FA for admin accounts'),
('two_factor_method', 'google_auth', 'string', '2FA method: google_auth, sms, email'),
('ip_whitelist_enabled', 'false', 'boolean', 'Enable IP whitelist for admin access'),
('password_min_length', '8', 'number', 'Minimum password length'),
('password_require_special', 'true', 'boolean', 'Require special characters in passwords'),
('password_require_numbers', 'true', 'boolean', 'Require numbers in passwords'),
('password_require_uppercase', 'false', 'boolean', 'Require uppercase letters in passwords'),

-- Platform Customization
('default_theme', 'dark', 'string', 'Default theme for new users: dark, light, auto, purple, blue'),
('background_animation_enabled', 'true', 'boolean', 'Enable animated backgrounds'),
('background_animation_speed', '5', 'number', 'Animation speed (1-10 scale)'),
('notification_sounds_enabled', 'true', 'boolean', 'Enable notification sounds'),
('welcome_message', 'Welcome to Solo Leveling! Start your journey to become stronger by completing daily quests and leveling up your skills.', 'string', 'Welcome message for new users'),
('maintenance_mode_enabled', 'false', 'boolean', 'Enable maintenance mode'),
('maintenance_message', 'System maintenance in progress. Please check back soon.', 'string', 'Maintenance mode message'),
('custom_logo_url', '', 'string', 'Custom logo URL'),
('custom_favicon_url', '', 'string', 'Custom favicon URL'),

-- System Monitoring & Analytics
('performance_monitoring_enabled', 'true', 'boolean', 'Enable performance monitoring'),
('performance_alert_threshold', '500', 'number', 'Performance alert threshold in milliseconds'),
('user_analytics_enabled', 'true', 'boolean', 'Enable user behavior analytics'),
('analytics_track_pageviews', 'true', 'boolean', 'Track page views'),
('analytics_track_quest_completion', 'true', 'boolean', 'Track quest completion rates'),
('analytics_track_device_info', 'false', 'boolean', 'Track device information'),
('error_reporting_enabled', 'true', 'boolean', 'Enable automatic error reporting'),
('error_reporting_level', 'all', 'string', 'Error reporting level: all, critical, custom'),
('data_retention_days', '90', 'number', 'Data retention period in days'),
('ab_testing_enabled', 'false', 'boolean', 'Enable A/B testing feature flags'),

-- Coach System Settings
('max_coach_students', '20', 'number', 'Maximum students per coach'),
('coach_auto_approval', 'false', 'boolean', 'Auto-approve coach applications'),
('coach_verification_required', 'true', 'boolean', 'Require verification for coaches'),
('coach_feedback_enabled', 'true', 'boolean', 'coach_system', 'Allow coaches to provide feedback to students', 1, 1),
('student_progress_sharing', 'true', 'boolean', 'coach_system', 'Allow students to share progress with coaches', 1, 1),
('coach_dashboard_analytics', 'true', 'boolean', 'coach_system', 'Enable detailed analytics for coaches', 1, 1);

-- Create IP whitelist table for admin access
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
    whitelist_id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL,
    ip_range VARCHAR(18), -- For CIDR notation like /24
    description VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ip (ip_address),
    INDEX idx_active (is_active)
);

-- Create feature flags table for A/B testing
CREATE TABLE IF NOT EXISTS feature_flags (
    flag_id INT PRIMARY KEY AUTO_INCREMENT,
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0, -- 0-100% rollout
    target_user_types JSON, -- ["adventurer", "coach", "admin"]
    conditions JSON, -- Additional conditions
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_key (flag_key),
    INDEX idx_enabled (is_enabled)
);

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INT NOT NULL,
    status_code INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_endpoint (endpoint),
    INDEX idx_response_time (response_time_ms),
    INDEX idx_created (created_at)
);

-- Create user analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
    analytics_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- pageview, quest_complete, level_up, etc.
    event_data JSON,
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    device_info JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
);

-- Create system error logs table
CREATE TABLE IF NOT EXISTS system_error_logs (
    error_id INT PRIMARY KEY AUTO_INCREMENT,
    error_level VARCHAR(20) NOT NULL, -- error, warn, critical, fatal
    error_message TEXT NOT NULL,
    error_stack TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    user_id INT,
    request_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_level (error_level),
    INDEX idx_resolved (resolved),
    INDEX idx_created (created_at)
);

-- Insert some default feature flags
INSERT IGNORE INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage) VALUES
('new_quest_ui', 'New Quest Interface', 'Enable the redesigned quest interface', FALSE, 0),
('social_features', 'Social Features', 'Enable friend system and social interactions', FALSE, 0),
('premium_features', 'Premium Features', 'Enable premium subscription features', FALSE, 0),
('dark_mode_default', 'Dark Mode Default', 'Make dark mode the default theme', TRUE, 100);

-- Add indexes for better performance on existing tables
CREATE INDEX idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Add some sample IP whitelist entries (replace with your actual admin IPs)
INSERT IGNORE INTO admin_ip_whitelist (ip_address, description, created_by) VALUES
('127.0.0.1', 'Localhost development', 1),
('::1', 'IPv6 localhost', 1);

SET SQL_SAFE_UPDATES = 0;
SET SQL_SAFE_UPDATES = 1;
-- Update admin profiles to have better permissions structure
UPDATE admin_profiles SET permissions = JSON_OBJECT(
    'system_settings', true,
    'user_management', true,
    'quest_management', true,
    'analytics', true,
    'security', true,
    'maintenance', true
) WHERE access_level = 'SUPER_ADMIN';

UPDATE admin_profiles SET permissions = JSON_OBJECT(
    'system_settings', true,
    'user_management', true,
    'quest_management', true,
    'analytics', true,
    'security', false,
    'maintenance', false
) WHERE access_level = 'ADMIN';

UPDATE admin_profiles SET permissions = JSON_OBJECT(
    'system_settings', false,
    'user_management', true,
    'quest_management', false,
    'analytics', false,
    'security', false,
    'maintenance', false
) WHERE access_level = 'MODERATOR';

