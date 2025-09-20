-- =====================================================
-- COACH GUIDANCE SYSTEM DATABASE VERIFICATION
-- =====================================================
USE solo_leveling_system;
ALTER TABLE coach_student_relationships 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 1. Check coach-student relationships
SELECT 
    csr.coach_user_id,
    csr.student_user_id,
    csr.status,
    csr.created_at,
    -- Coach info
    coach_u.username as coach_username,
    COALESCE(cp.full_name, coach_u.username) as coach_name,
    coach_u.profile_photo_url as coach_photo,
    cp.specialization,
    cp.years_experience,
    -- Student info
    student_u.username as student_username,
    ap.full_name as student_name,
    ap.field_of_interest
FROM coach_student_relationships csr
JOIN users coach_u ON csr.coach_user_id = coach_u.user_id
JOIN users student_u ON csr.student_user_id = student_u.user_id
LEFT JOIN coach_profiles cp ON csr.coach_user_id = cp.user_id
LEFT JOIN adventurer_profiles ap ON csr.student_user_id = ap.user_id
ORDER BY csr.created_at DESC;

-- 2. Check feedback/guidance messages with coach details
SELECT 
    cf.feedback_id,
    cf.coach_user_id,
    cf.student_user_id,
    cf.feedback_type,
    cf.feedback_text,
    cf.rating,
    cf.is_read,
    cf.created_at,
    -- Coach details
    COALESCE(cp.full_name, coach_u.username) as coach_name,
    coach_u.username as coach_username,
    coach_u.profile_photo_url as coach_photo,
    cp.specialization as coach_specialization,
    -- Student details
    student_u.username as student_username,
    ap.full_name as student_name
FROM coach_feedback cf
JOIN users coach_u ON cf.coach_user_id = coach_u.user_id
JOIN users student_u ON cf.student_user_id = student_u.user_id
LEFT JOIN coach_profiles cp ON cf.coach_user_id = cp.user_id
LEFT JOIN adventurer_profiles ap ON cf.student_user_id = ap.user_id
ORDER BY cf.created_at DESC
LIMIT 10;

-- 3. Check for missing coach profiles
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.profile_photo_url,
    cp.full_name,
    cp.specialization,
    cp.years_experience,
    CASE 
        WHEN cp.user_id IS NULL THEN 'MISSING COACH PROFILE'
        ELSE 'Profile exists'
    END as profile_status
FROM users u
LEFT JOIN coach_profiles cp ON u.user_id = cp.user_id
WHERE u.user_type = 'coach'
ORDER BY cp.user_id IS NULL DESC, u.username;

-- 4. Create default coach profiles for coaches without profiles
INSERT INTO coach_profiles (
    user_id, 
    full_name, 
    bio, 
    specialization, 
    years_experience, 
    total_students_coached, 
    success_stories,
    current_students,
    max_students
)
SELECT 
    u.user_id,
    u.username as full_name,
    'Experienced life coach helping adventurers reach their goals.' as bio,
    'Life Coaching' as specialization,
    1 as years_experience,
    0 as total_students_coached,
    0 as success_stories,
    0 as current_students,
    20 as max_students
FROM users u
LEFT JOIN coach_profiles cp ON u.user_id = cp.user_id
WHERE u.user_type = 'coach' AND cp.user_id IS NULL;

-- 5. Test the guidance query that the backend uses
SELECT 
    cf.*,
    -- Coach basic info
    COALESCE(cp.full_name, u.username) as coach_name,
    u.username as coach_username,
    u.profile_photo_url as coach_photo,
    u.email as coach_email,
    
    -- Coach profile details
    cp.bio as coach_bio,
    cp.specialization as coach_specialization,
    cp.years_experience,
    cp.total_students_coached,
    cp.success_stories,
    cp.created_at as coach_since,
    
    -- Format date nicely
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
LEFT JOIN coach_profiles cp ON cf.coach_user_id = cp.user_id
LEFT JOIN users u ON cf.coach_user_id = u.user_id
WHERE cf.student_user_id = 1  -- Replace with actual student user ID
ORDER BY cf.created_at DESC;

-- 6. Create sample feedback data for testing (optional)
-- INSERT INTO coach_feedback (coach_user_id, student_user_id, feedback_type, feedback_text, rating) 
-- VALUES 
--     (2, 1, 'guidance', 'Great progress on your daily quests! Keep up the excellent work and focus on consistency.', 5),
--     (2, 1, 'guidance', 'I noticed you are building good habits. Try to challenge yourself with harder tasks next week.', 4);

-- 7. Check for orphaned feedback (feedback without valid relationships)
SELECT 
    cf.*,
    CASE 
        WHEN csr.coach_user_id IS NULL THEN 'NO RELATIONSHIP EXISTS'
        WHEN csr.status != 'active' THEN 'RELATIONSHIP NOT ACTIVE'
        ELSE 'RELATIONSHIP OK'
    END as relationship_status
FROM coach_feedback cf
LEFT JOIN coach_student_relationships csr ON cf.coach_user_id = csr.coach_user_id 
    AND cf.student_user_id = csr.student_user_id 
    AND csr.status = 'active'
ORDER BY cf.created_at DESC;

-- 8. Get summary statistics
SELECT 
    'Total Coaches' as metric,
    COUNT(*) as count
FROM users WHERE user_type = 'coach'

UNION ALL

SELECT 
    'Coaches with Profiles' as metric,
    COUNT(*) as count
FROM coach_profiles

UNION ALL

SELECT 
    'Active Relationships' as metric,
    COUNT(*) as count
FROM coach_student_relationships WHERE status = 'active'

UNION ALL

SELECT 
    'Total Guidance Messages' as metric,
    COUNT(*) as count
FROM coach_feedback

UNION ALL

SELECT 
    'Unread Messages' as metric,
    COUNT(*) as count
FROM coach_feedback WHERE is_read = FALSE;

-- 9. Check specific user's guidance (replace USER_ID with actual ID)
-- SELECT 
--     'User ID 1 Guidance Messages' as info,
--     COUNT(*) as total_messages,
--     COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_messages
-- FROM coach_feedback 
-- WHERE student_user_id = 1;

DESCRIBE coach_profiles;
ALTER TABLE coach_profiles 
ADD COLUMN total_students_coached INT DEFAULT 0,
ADD COLUMN success_stories INT DEFAULT 0,
ADD COLUMN certification VARCHAR(255);
INSERT IGNORE INTO coach_profiles (user_id, full_name, bio, specialization, years_experience, total_students_coached, success_stories, current_students, max_students)
SELECT 
    u.user_id,
    u.username as full_name,
    'Experienced life coach dedicated to helping adventurers achieve their goals.' as bio,
    'Life Coach' as specialization,
    1 as years_experience,
    0 as total_students_coached,
    0 as success_stories,
    0 as current_students,
    20 as max_students
FROM users u
LEFT JOIN coach_profiles cp ON u.user_id = cp.user_id
WHERE u.user_type = 'coach' AND cp.user_id IS NULL;

UPDATE coach_profiles cp
SET current_students = (
    SELECT COUNT(*) 
    FROM coach_student_relationships csr 
    WHERE csr.coach_user_id = cp.user_id 
    AND csr.status = 'active'
);
SELECT 
    cp.*,
    u.username
FROM coach_profiles cp
JOIN users u ON cp.user_id = u.user_id
ORDER BY cp.user_id;
SELECT 
    cf.feedback_id,
    cf.feedback_text,
    u.username as coach_username,
    cp.full_name as coach_name,
    cp.total_students_coached,
    cp.years_experience
FROM coach_feedback cf
LEFT JOIN users u ON cf.coach_user_id = u.user_id
LEFT JOIN coach_profiles cp ON cf.coach_user_id = cp.user_id
LIMIT 1;