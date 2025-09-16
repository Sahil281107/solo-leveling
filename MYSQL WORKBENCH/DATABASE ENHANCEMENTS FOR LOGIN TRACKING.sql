-- =====================================================
-- DATABASE ENHANCEMENTS FOR LOGIN TRACKING
-- =====================================================

USE solo_leveling_system;

-- =====================================================
-- 1. ENSURE USER_SESSIONS TABLE HAS ALL NEEDED FIELDS
-- =====================================================

-- Check if refresh_token column exists, if not add it
ALTER TABLE user_sessions 

ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN  login_method ENUM('web', 'mobile', 'api') DEFAULT 'web',
ADD COLUMN device_info TEXT;

-- =====================================================
-- 2. ADD INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Index for session lookup
CREATE INDEX idx_user_sessions_active 
ON user_sessions(user_id, is_active, expires_at);

-- Index for cleanup operations
CREATE INDEX  idx_user_sessions_expires 
ON user_sessions(expires_at);

-- Index for login activity logs
CREATE INDEX idx_activity_logs_login 
ON activity_logs(activity_type, created_at, user_id);

-- Index for IP-based tracking
CREATE INDEX idx_activity_logs_ip 
ON activity_logs(ip_address, created_at);

-- =====================================================
-- 3. UPDATE TRIGGERS FOR ENHANCED LOGIN TRACKING
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_last_login;
DROP TRIGGER IF EXISTS log_login_activity;

-- Enhanced trigger to update last login with more details
DELIMITER $$
CREATE TRIGGER update_last_login
AFTER INSERT ON user_sessions
FOR EACH ROW
BEGIN
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
END$$
DELIMITER ;

-- Enhanced trigger to log login activity with session details
DELIMITER $$
CREATE TRIGGER log_login_activity
AFTER INSERT ON user_sessions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (
        user_id, 
        activity_type, 
        activity_details, 
        ip_address, 
        user_agent
    ) VALUES (
        NEW.user_id, 
        'login', 
        JSON_OBJECT(
            'session_created', TRUE,
            'session_id', NEW.session_id,
            'login_method', COALESCE(NEW.login_method, 'web'),
            'device_info', NEW.device_info,
            'expires_at', NEW.expires_at
        ),
        NEW.ip_address, 
        NEW.user_agent
    );
END$$
DELIMITER ;

-- Trigger to log session cleanup
DELIMITER $$
CREATE TRIGGER log_session_cleanup
AFTER DELETE ON user_sessions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (
        user_id, 
        activity_type, 
        activity_details, 
        ip_address, 
        user_agent
    ) VALUES (
        OLD.user_id, 
        'session_ended', 
        JSON_OBJECT(
            'session_id', OLD.session_id,
            'ended_at', NOW(),
            'was_expired', OLD.expires_at < NOW()
        ),
        OLD.ip_address, 
        OLD.user_agent
    );
END$$
DELIMITER ;

-- =====================================================
-- 4. CREATE STORED PROCEDURES FOR LOGIN MANAGEMENT
-- =====================================================

-- Procedure to clean up expired sessions
DELIMITER $$
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE session_count INT DEFAULT 0;
    
    -- Count expired sessions
    SELECT COUNT(*) INTO session_count
    FROM user_sessions 
    WHERE expires_at < NOW();
    
    -- Delete expired sessions (triggers will log the cleanup)
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    -- Log cleanup activity
    INSERT INTO activity_logs (
        user_id, 
        activity_type, 
        activity_details, 
        ip_address, 
        user_agent
    ) VALUES (
        NULL, 
        'system_cleanup', 
        JSON_OBJECT(
            'action', 'expired_sessions_cleanup',
            'sessions_removed', session_count,
            'cleanup_time', NOW()
        ),
        'system', 
        'cleanup_procedure'
    );
    
    SELECT CONCAT('Cleaned up ', session_count, ' expired sessions') as result;
END$$
DELIMITER ;

-- Procedure to get login statistics
DELIMITER $$
CREATE PROCEDURE GetLoginStatistics(IN days_back INT)
BEGIN
    -- Daily login counts
    SELECT 
        DATE(al.created_at) as login_date,
        COUNT(*) as login_count,
        COUNT(DISTINCT al.user_id) as unique_users
    FROM activity_logs al
    WHERE al.activity_type = 'login'
        AND al.created_at >= DATE_SUB(NOW(), INTERVAL days_back DAY)
    GROUP BY DATE(al.created_at)
    ORDER BY login_date DESC;
    
    -- Top IP addresses
    SELECT 
        ip_address,
        COUNT(*) as login_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM activity_logs
    WHERE activity_type = 'login'
        AND created_at >= DATE_SUB(NOW(), INTERVAL days_back DAY)
        AND ip_address != 'system'
    GROUP BY ip_address
    ORDER BY login_count DESC
    LIMIT 10;
    
    -- Current active sessions
    SELECT 
        COUNT(*) as active_sessions,
        COUNT(DISTINCT user_id) as unique_active_users
    FROM user_sessions
    WHERE expires_at > NOW()
        AND is_active = TRUE;
END$$
DELIMITER ;

-- =====================================================
-- 5. CREATE VIEWS FOR EASY LOGIN DATA ACCESS
-- =====================================================

-- View for recent login activity
CREATE OR REPLACE VIEW recent_login_activity AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.user_type,
    al.created_at as login_time,
    al.ip_address,
    JSON_EXTRACT(al.activity_details, '$.session_id') as session_id,
    JSON_EXTRACT(al.activity_details, '$.login_method') as login_method,
    al.user_agent
FROM activity_logs al
JOIN users u ON al.user_id = u.user_id
WHERE al.activity_type = 'login'
ORDER BY al.created_at DESC;

-- View for active user sessions
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
    us.session_id,
    u.user_id,
    u.username,
    u.email,
    u.user_type,
    us.created_at as session_started,
    us.last_activity,
    us.expires_at,
    us.ip_address,
    us.login_method,
    TIMESTAMPDIFF(MINUTE, us.last_activity, NOW()) as minutes_inactive
FROM user_sessions us
JOIN users u ON us.user_id = u.user_id
WHERE us.expires_at > NOW()
    AND us.is_active = TRUE
ORDER BY us.last_activity DESC;

-- View for user login summary
CREATE OR REPLACE VIEW user_login_summary AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.user_type,
    u.last_login,
    COUNT(al.log_id) as total_logins,
    MAX(al.created_at) as last_login_activity,
    COUNT(DISTINCT DATE(al.created_at)) as unique_login_days,
    COUNT(DISTINCT al.ip_address) as unique_ip_addresses
FROM users u
LEFT JOIN activity_logs al ON u.user_id = al.user_id AND al.activity_type = 'login'
GROUP BY u.user_id, u.username, u.email, u.user_type, u.last_login
ORDER BY u.last_login DESC;

-- =====================================================
-- 6. CREATE EVENT FOR AUTOMATIC SESSION CLEANUP
-- =====================================================

-- Enable event scheduler if not already enabled
SET GLOBAL event_scheduler = ON;

-- Create event to cleanup expired sessions daily
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL CleanupExpiredSessions();

-- =====================================================
-- 7. INSERT SAMPLE SYSTEM SETTINGS FOR LOGIN TRACKING
-- =====================================================

-- Insert login-related system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('max_login_attempts', '5', 'number', 'Maximum login attempts before rate limiting'),
('login_rate_limit_window', '900', 'number', 'Rate limit window in seconds (15 minutes)'),
('session_lifetime_days', '7', 'number', 'Default session lifetime in days'),
('session_cleanup_interval', '24', 'number', 'Hours between session cleanup runs'),
('track_login_locations', 'true', 'boolean', 'Whether to track and log login IP addresses'),
('require_session_validation', 'true', 'boolean', 'Whether to validate sessions in database on each request');

-- =====================================================
-- 8. GRANT NECESSARY PERMISSIONS (if using specific DB user)
-- =====================================================

-- If you have a specific database user for the application, grant permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON solo_leveling_system.user_sessions TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON solo_leveling_system.activity_logs TO 'your_app_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE solo_leveling_system.CleanupExpiredSessions TO 'your_app_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE solo_leveling_system.GetLoginStatistics TO 'your_app_user'@'localhost';

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify the enhancements are working
SELECT 'Database enhancements completed successfully!' as status;

-- Show table structure
DESCRIBE user_sessions;
DESCRIBE activity_logs;

-- Show indexes
SHOW INDEX FROM user_sessions;
SHOW INDEX FROM activity_logs;

-- Show triggers
SHOW TRIGGERS LIKE 'user_sessions';

-- Show events
SHOW EVENTS;

-- Show views
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Check recent logins
SELECT * FROM activity_logs WHERE activity_type = 'login' ORDER BY created_at DESC LIMIT 10;

-- Check active sessions
SELECT * FROM user_sessions WHERE expires_at > NOW() ORDER BY created_at DESC;

-- Check user last login timestamps
SELECT user_id, username, email, last_login FROM users ORDER BY last_login DESC;

-- Check failed login attempts
SELECT * FROM activity_logs WHERE activity_type = 'login_failed' ORDER BY created_at DESC LIMIT 10;
