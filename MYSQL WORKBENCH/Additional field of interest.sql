-- =====================================================
-- COMPLETE QUEST TEMPLATES FOR ALL 25 FIELDS
-- Insert this after your existing quest templates
-- =====================================================

-- =====================================================
-- MARTIAL ARTS
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Martial Arts', 'daily', 'Practice Basic Forms', 'Execute fundamental forms and stances for 30 minutes', 30, 'medium', 'Technical Skill'),
('Martial Arts', 'daily', 'Strength & Conditioning', 'Complete martial arts conditioning workout', 30, 'medium', 'Physical Power'),
('Martial Arts', 'daily', 'Sparring Session', 'Practice controlled sparring with partner', 35, 'hard', 'Tactical IQ'),
('Martial Arts', 'daily', 'Flexibility Training', 'Stretching and mobility exercises for 20 minutes', 20, 'easy', 'Recovery'),
('Martial Arts', 'daily', 'Kata/Pattern Practice', 'Perfect your kata or pattern sequences', 30, 'medium', 'Technical Skill'),
('Martial Arts', 'daily', 'Speed Drills', 'Practice rapid striking and movement combinations', 25, 'medium', 'Speed'),
('Martial Arts', 'daily', 'Meditation & Focus', 'Mental preparation and breathing exercises', 25, 'easy', 'Mental Focus'),
('Martial Arts', 'daily', 'Technique Refinement', 'Focus on perfecting one specific technique', 30, 'medium', 'Technical Skill'),
-- Weekly Quests
('Martial Arts', 'weekly', 'Belt Progression Training', 'Intensive training for next level advancement', 300, 'hard', 'Technical Skill'),
('Martial Arts', 'weekly', 'Tournament Preparation', 'Full competition simulation and strategy', 350, 'hard', 'Tactical IQ'),
('Martial Arts', 'weekly', 'Master a New Technique', 'Learn and master an advanced technique', 250, 'medium', 'Technical Skill');

-- =====================================================
-- COOKING & NUTRITION
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Cooking & Nutrition', 'daily', 'Prepare Healthy Meal', 'Cook a nutritious meal from scratch', 30, 'medium', 'Strength'),
('Cooking & Nutrition', 'daily', 'Learn New Recipe', 'Study and practice a new cooking technique', 25, 'medium', 'Intelligence'),
('Cooking & Nutrition', 'daily', 'Meal Prep Session', 'Prepare meals for the next 2-3 days', 35, 'medium', 'Wisdom'),
('Cooking & Nutrition', 'daily', 'Nutrition Tracking', 'Log and analyze your daily nutrition intake', 20, 'easy', 'Wisdom'),
('Cooking & Nutrition', 'daily', 'Kitchen Organization', 'Clean and organize cooking space and tools', 15, 'easy', 'Wisdom'),
('Cooking & Nutrition', 'daily', 'Practice Knife Skills', 'Improve chopping, dicing, and cutting techniques', 25, 'medium', 'Agility'),
('Cooking & Nutrition', 'daily', 'Grocery Planning', 'Plan weekly meals and create shopping list', 20, 'easy', 'Intelligence'),
('Cooking & Nutrition', 'daily', 'Recipe Documentation', 'Document and photograph your cooking creation', 20, 'easy', 'Charisma'),
-- Weekly Quests
('Cooking & Nutrition', 'weekly', 'Host Dinner Party', 'Plan and execute a full meal for guests', 300, 'hard', 'Charisma'),
('Cooking & Nutrition', 'weekly', 'Master Complex Dish', 'Perfect an advanced or challenging recipe', 250, 'medium', 'Intelligence'),
('Cooking & Nutrition', 'weekly', 'Weekly Meal Plan', 'Complete full week of healthy meal preparation', 350, 'hard', 'Wisdom');

-- =====================================================
-- PUBLIC SPEAKING
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Public Speaking', 'daily', 'Voice Training', 'Practice vocal exercises and projection', 25, 'easy', 'Charisma'),
('Public Speaking', 'daily', 'Speech Practice', 'Rehearse a 5-minute presentation', 30, 'medium', 'Charisma'),
('Public Speaking', 'daily', 'Body Language Study', 'Practice gestures and stage presence', 25, 'medium', 'Charisma'),
('Public Speaking', 'daily', 'Watch TED Talk', 'Analyze professional speaker techniques', 20, 'easy', 'Wisdom'),
('Public Speaking', 'daily', 'Impromptu Speaking', 'Practice 2-minute impromptu speeches on random topics', 30, 'medium', 'Intelligence'),
('Public Speaking', 'daily', 'Storytelling Practice', 'Craft and tell engaging stories', 25, 'medium', 'Charisma'),
('Public Speaking', 'daily', 'Vocal Warm-ups', 'Breathing exercises and vocal preparation', 15, 'easy', 'Stamina'),
('Public Speaking', 'daily', 'Record & Review', 'Record yourself speaking and analyze', 25, 'medium', 'Wisdom'),
-- Weekly Quests
('Public Speaking', 'weekly', 'Deliver Presentation', 'Give a complete presentation to an audience', 350, 'hard', 'Charisma'),
('Public Speaking', 'weekly', 'Join Speaking Club', 'Attend Toastmasters or similar speaking event', 250, 'medium', 'Charisma'),
('Public Speaking', 'weekly', 'Speech Competition', 'Participate in speaking competition or challenge', 300, 'hard', 'Charisma');

-- =====================================================
-- DIGITAL ART & DESIGN
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Digital Art & Design', 'daily', 'Daily Sketch Challenge', 'Complete digital sketching exercises', 25, 'medium', 'Charisma'),
('Digital Art & Design', 'daily', 'Color Theory Study', 'Practice color palettes and harmonies', 30, 'medium', 'Intelligence'),
('Digital Art & Design', 'daily', 'Software Tutorial', 'Learn new tool or technique in design software', 30, 'medium', 'Intelligence'),
('Digital Art & Design', 'daily', 'Design Inspiration', 'Study and analyze professional artwork', 20, 'easy', 'Wisdom'),
('Digital Art & Design', 'daily', 'Speed Art Challenge', 'Create artwork within time constraint', 30, 'medium', 'Agility'),
('Digital Art & Design', 'daily', 'Portfolio Update', 'Work on portfolio pieces or presentation', 25, 'medium', 'Charisma'),
('Digital Art & Design', 'daily', 'Composition Practice', 'Study and apply design principles', 25, 'medium', 'Wisdom'),
('Digital Art & Design', 'daily', 'Client Brief Practice', 'Create designs based on fictional briefs', 30, 'medium', 'Intelligence'),
-- Weekly Quests
('Digital Art & Design', 'weekly', 'Complete Design Project', 'Finish a comprehensive design project', 300, 'hard', 'Charisma'),
('Digital Art & Design', 'weekly', 'Design Challenge', 'Participate in design competition or contest', 350, 'hard', 'Charisma'),
('Digital Art & Design', 'weekly', 'Client Project', 'Complete freelance or practice client work', 250, 'medium', 'Intelligence');

-- =====================================================
-- PHOTOGRAPHY
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Photography', 'daily', 'Daily Photo Challenge', 'Capture photos based on daily theme', 25, 'medium', 'Charisma'),
('Photography', 'daily', 'Composition Practice', 'Practice rule of thirds, leading lines, framing', 30, 'medium', 'Wisdom'),
('Photography', 'daily', 'Lighting Study', 'Experiment with natural or artificial lighting', 30, 'medium', 'Intelligence'),
('Photography', 'daily', 'Edit 10 Photos', 'Post-processing and editing practice', 25, 'medium', 'Intelligence'),
('Photography', 'daily', 'Gear Maintenance', 'Clean and maintain photography equipment', 15, 'easy', 'Wisdom'),
('Photography', 'daily', 'Photography Tutorial', 'Learn new technique or camera setting', 25, 'medium', 'Intelligence'),
('Photography', 'daily', 'Portfolio Curation', 'Organize and select best shots for portfolio', 20, 'easy', 'Wisdom'),
('Photography', 'daily', 'Street Photography Walk', 'Practice candid and street photography', 30, 'medium', 'Agility'),
-- Weekly Quests
('Photography', 'weekly', 'Photo Series Project', 'Create cohesive photo series on one theme', 300, 'hard', 'Charisma'),
('Photography', 'weekly', 'Client Photoshoot', 'Complete full photoshoot session', 350, 'hard', 'Charisma'),
('Photography', 'weekly', 'Photography Exhibition', 'Prepare work for online/offline exhibition', 250, 'medium', 'Charisma');

-- =====================================================
-- GAMING & ESPORTS
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Gaming & Esports', 'daily', 'Ranked Practice', 'Play 3+ ranked matches with focus', 30, 'medium', 'Tactical IQ'),
('Gaming & Esports', 'daily', 'Mechanical Training', 'Practice aim, reflexes, or game mechanics', 30, 'medium', 'Agility'),
('Gaming & Esports', 'daily', 'VOD Review', 'Analyze your gameplay or pro player replays', 25, 'medium', 'Wisdom'),
('Gaming & Esports', 'daily', 'Strategy Study', 'Learn new strategies, builds, or meta', 25, 'medium', 'Intelligence'),
('Gaming & Esports', 'daily', 'Communication Practice', 'Practice team callouts and coordination', 20, 'easy', 'Charisma'),
('Gaming & Esports', 'daily', 'Warm-up Routine', 'Complete full pre-game warm-up exercises', 20, 'easy', 'Stamina'),
('Gaming & Esports', 'daily', 'Mental Game', 'Practice focus, tilt management, mindfulness', 25, 'easy', 'Mental Focus'),
('Gaming & Esports', 'daily', 'Custom Game Training', 'Practice specific scenarios in custom games', 30, 'medium', 'Tactical IQ'),
-- Weekly Quests
('Gaming & Esports', 'weekly', 'Tournament Participation', 'Compete in online or local tournament', 350, 'hard', 'Tactical IQ'),
('Gaming & Esports', 'weekly', 'Climb Ranked Ladder', 'Achieve rank milestone or improvement', 300, 'hard', 'Intelligence'),
('Gaming & Esports', 'weekly', 'Content Creation', 'Stream or create gaming content for audience', 250, 'medium', 'Charisma');

-- =====================================================
-- MEDITATION & MINDFULNESS
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Meditation & Mindfulness', 'daily', 'Morning Meditation', '15-minute morning meditation session', 25, 'easy', 'Mental Focus'),
('Meditation & Mindfulness', 'daily', 'Breathing Exercises', 'Practice controlled breathing techniques', 20, 'easy', 'Stamina'),
('Meditation & Mindfulness', 'daily', 'Mindful Walking', 'Take mindful walk in nature or quiet space', 25, 'easy', 'Wisdom'),
('Meditation & Mindfulness', 'daily', 'Gratitude Journal', 'Write 3 things you are grateful for', 20, 'easy', 'Wisdom'),
('Meditation & Mindfulness', 'daily', 'Body Scan', 'Complete body awareness meditation', 25, 'medium', 'Mental Focus'),
('Meditation & Mindfulness', 'daily', 'Loving-Kindness', 'Practice metta meditation for compassion', 25, 'medium', 'Charisma'),
('Meditation & Mindfulness', 'daily', 'Evening Reflection', 'Review day mindfully before sleep', 20, 'easy', 'Wisdom'),
('Meditation & Mindfulness', 'daily', 'Present Moment', 'Practice staying present during daily activity', 25, 'medium', 'Mental Focus'),
-- Weekly Quests
('Meditation & Mindfulness', 'weekly', 'Extended Meditation', 'Complete 45+ minute meditation session', 250, 'medium', 'Mental Focus'),
('Meditation & Mindfulness', 'weekly', 'Meditation Course', 'Complete weekly module of meditation course', 300, 'hard', 'Wisdom'),
('Meditation & Mindfulness', 'weekly', 'Mindfulness Retreat', 'Attend meditation retreat or extended practice', 350, 'hard', 'Mental Focus');

-- =====================================================
-- SOCIAL SKILLS
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Social Skills', 'daily', 'Start Conversations', 'Initiate 3 genuine conversations with people', 30, 'medium', 'Charisma'),
('Social Skills', 'daily', 'Active Listening', 'Practice deep listening without interrupting', 25, 'medium', 'Wisdom'),
('Social Skills', 'daily', 'Body Language Study', 'Observe and practice positive body language', 25, 'medium', 'Charisma'),
('Social Skills', 'daily', 'Networking Activity', 'Reach out to new connection or strengthen existing one', 30, 'medium', 'Charisma'),
('Social Skills', 'daily', 'Compliment Practice', 'Give sincere compliments to 3 people', 20, 'easy', 'Charisma'),
('Social Skills', 'daily', 'Social Media Engagement', 'Meaningfully engage with others online', 20, 'easy', 'Charisma'),
('Social Skills', 'daily', 'Empathy Exercise', 'Practice seeing situations from others perspectives', 25, 'medium', 'Wisdom'),
('Social Skills', 'daily', 'Small Talk Practice', 'Engage in casual conversation confidently', 25, 'medium', 'Charisma'),
-- Weekly Quests
('Social Skills', 'weekly', 'Social Event Attendance', 'Attend party, meetup, or social gathering', 300, 'hard', 'Charisma'),
('Social Skills', 'weekly', 'Organize Social Event', 'Plan and host social activity for friends', 350, 'hard', 'Charisma'),
('Social Skills', 'weekly', 'Public Interaction', 'Engage in extended social situations', 250, 'medium', 'Charisma');

-- =====================================================
-- FINANCIAL LITERACY
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Financial Literacy', 'daily', 'Track Expenses', 'Log all daily expenses and income', 20, 'easy', 'Wisdom'),
('Financial Literacy', 'daily', 'Financial Education', 'Read article or watch video on finance topic', 25, 'medium', 'Intelligence'),
('Financial Literacy', 'daily', 'Budget Review', 'Review and adjust monthly budget', 25, 'medium', 'Wisdom'),
('Financial Literacy', 'daily', 'Investment Research', 'Research stocks, funds, or investment opportunities', 30, 'medium', 'Intelligence'),
('Financial Literacy', 'daily', 'Savings Check', 'Review savings goals and progress', 20, 'easy', 'Wisdom'),
('Financial Literacy', 'daily', 'Debt Management', 'Review debts and payment strategies', 25, 'medium', 'Wisdom'),
('Financial Literacy', 'daily', 'Financial News', 'Stay updated on market and economic news', 20, 'easy', 'Intelligence'),
('Financial Literacy', 'daily', 'No-Spend Practice', 'Complete day without unnecessary spending', 25, 'medium', 'Wisdom'),
-- Weekly Quests
('Financial Literacy', 'weekly', 'Monthly Financial Report', 'Complete comprehensive monthly financial review', 300, 'hard', 'Intelligence'),
('Financial Literacy', 'weekly', 'Investment Action', 'Make informed investment or financial decision', 350, 'hard', 'Intelligence'),
('Financial Literacy', 'weekly', 'Financial Goal Progress', 'Significant progress toward financial goal', 250, 'medium', 'Wisdom');

-- =====================================================
-- SCIENTIFIC RESEARCH
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Scientific Research', 'daily', 'Literature Review', 'Read and summarize research papers', 30, 'medium', 'Intelligence'),
('Scientific Research', 'daily', 'Experiment Planning', 'Design or plan research methodology', 35, 'hard', 'Intelligence'),
('Scientific Research', 'daily', 'Data Collection', 'Gather experimental or observational data', 30, 'medium', 'Wisdom'),
('Scientific Research', 'daily', 'Lab Work', 'Conduct experiments or lab procedures', 35, 'hard', 'Intelligence'),
('Scientific Research', 'daily', 'Data Analysis', 'Analyze research data using statistical methods', 35, 'hard', 'Intelligence'),
('Scientific Research', 'daily', 'Research Documentation', 'Write research notes and observations', 25, 'medium', 'Wisdom'),
('Scientific Research', 'daily', 'Peer Review', 'Review colleague\'s work or provide feedback', 30, 'medium', 'Wisdom'),
('Scientific Research', 'daily', 'Scientific Reading', 'Stay current with field publications', 25, 'medium', 'Intelligence'),
-- Weekly Quests
('Scientific Research', 'weekly', 'Research Paper', 'Write or contribute to research paper', 350, 'hard', 'Intelligence'),
('Scientific Research', 'weekly', 'Major Experiment', 'Complete significant experimental study', 300, 'hard', 'Intelligence'),
('Scientific Research', 'weekly', 'Conference Preparation', 'Prepare presentation for scientific conference', 250, 'medium', 'Charisma');

-- =====================================================
-- DANCE & MOVEMENT
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Dance & Movement', 'daily', 'Technique Practice', 'Practice fundamental dance techniques', 30, 'medium', 'Agility'),
('Dance & Movement', 'daily', 'Choreography Session', 'Learn or create dance choreography', 30, 'medium', 'Charisma'),
('Dance & Movement', 'daily', 'Flexibility Training', 'Stretching and mobility work for dancers', 25, 'medium', 'Agility'),
('Dance & Movement', 'daily', 'Rhythm Practice', 'Work on musicality and timing', 25, 'medium', 'Intelligence'),
('Dance & Movement', 'daily', 'Dance Style Study', 'Learn new style or technique', 30, 'medium', 'Intelligence'),
('Dance & Movement', 'daily', 'Performance Practice', 'Rehearse full performance piece', 35, 'hard', 'Charisma'),
('Dance & Movement', 'daily', 'Body Conditioning', 'Strength and endurance for dancers', 25, 'medium', 'Stamina'),
('Dance & Movement', 'daily', 'Video Analysis', 'Record and review your dance technique', 20, 'easy', 'Wisdom'),
-- Weekly Quests
('Dance & Movement', 'weekly', 'Recital/Performance', 'Perform for audience or competition', 350, 'hard', 'Charisma'),
('Dance & Movement', 'weekly', 'Choreograph Piece', 'Create complete dance choreography', 300, 'hard', 'Charisma'),
('Dance & Movement', 'weekly', 'Dance Workshop', 'Attend or teach dance workshop', 250, 'medium', 'Intelligence');

-- =====================================================
-- CHESS & STRATEGY
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Chess & Strategy', 'daily', 'Tactical Puzzles', 'Solve 20+ chess tactical puzzles', 30, 'medium', 'Tactical IQ'),
('Chess & Strategy', 'daily', 'Play Rated Games', 'Play 3+ rated chess games', 30, 'medium', 'Tactical IQ'),
('Chess & Strategy', 'daily', 'Opening Study', 'Study and practice chess openings', 25, 'medium', 'Intelligence'),
('Chess & Strategy', 'daily', 'Endgame Training', 'Practice endgame positions and techniques', 30, 'medium', 'Intelligence'),
('Chess & Strategy', 'daily', 'Game Analysis', 'Analyze your games or master games', 30, 'medium', 'Wisdom'),
('Chess & Strategy', 'daily', 'Blitz Practice', 'Play speed chess to improve intuition', 25, 'medium', 'Agility'),
('Chess & Strategy', 'daily', 'Strategic Study', 'Learn positional concepts and strategy', 25, 'medium', 'Intelligence'),
('Chess & Strategy', 'daily', 'Blindfold Training', 'Practice visualization without board', 35, 'hard', 'Mental Focus'),
-- Weekly Quests
('Chess & Strategy', 'weekly', 'Tournament Play', 'Participate in chess tournament', 350, 'hard', 'Tactical IQ'),
('Chess & Strategy', 'weekly', 'Rating Improvement', 'Achieve new rating milestone', 300, 'hard', 'Intelligence'),
('Chess & Strategy', 'weekly', 'Deep Opening Study', 'Master specific opening line thoroughly', 250, 'medium', 'Intelligence');

-- =====================================================
-- CUSTOM GOAL (Flexible templates)
-- =====================================================
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
-- Daily Quests
('Custom Goal', 'daily', 'Daily Practice Session', 'Dedicate 30+ minutes to your custom goal', 30, 'medium', 'Strength'),
('Custom Goal', 'daily', 'Skill Development', 'Learn or practice specific skill', 30, 'medium', 'Intelligence'),
('Custom Goal', 'daily', 'Goal Planning', 'Plan and strategize toward your objective', 25, 'medium', 'Wisdom'),
('Custom Goal', 'daily', 'Research & Learning', 'Study materials related to your goal', 25, 'medium', 'Intelligence'),
('Custom Goal', 'daily', 'Progress Tracking', 'Document and analyze your progress', 20, 'easy', 'Wisdom'),
('Custom Goal', 'daily', 'Focused Work Block', 'Deep work session on your custom goal', 35, 'medium', 'Mental Focus'),
('Custom Goal', 'daily', 'Milestone Check', 'Review progress toward milestones', 20, 'easy', 'Wisdom'),
('Custom Goal', 'daily', 'Community Engagement', 'Connect with others pursuing similar goals', 25, 'medium', 'Charisma'),
-- Weekly Quests
('Custom Goal', 'weekly', 'Major Milestone', 'Achieve significant progress milestone', 300, 'hard', 'Strength'),
('Custom Goal', 'weekly', 'Weekly Project', 'Complete substantial project or task', 350, 'hard', 'Intelligence'),
('Custom Goal', 'weekly', 'Goal Assessment', 'Comprehensive review and adjustment of strategy', 250, 'medium', 'Wisdom');

-- =====================================================
-- VERIFY INSERTION
-- =====================================================
SELECT 
    field_name, 
    COUNT(*) as total_quests,
    SUM(CASE WHEN quest_type = 'daily' THEN 1 ELSE 0 END) as daily_quests,
    SUM(CASE WHEN quest_type = 'weekly' THEN 1 ELSE 0 END) as weekly_quests
FROM quest_templates
GROUP BY field_name
ORDER BY field_name;

SELECT * FROM users WHERE user_id = 38;
SELECT * FROM adventurer_profiles WHERE user_id = 38;
SELECT 
    field_name, 
    COUNT(*) as total_daily_quests
FROM quest_templates 
WHERE quest_type = 'daily' AND is_active = 1
GROUP BY field_name
ORDER BY total_daily_quests DESC;

-- Check specific field you're testing with
SELECT field_name, quest_title, base_xp, difficulty
FROM quest_templates 
WHERE field_name = 'Programming Skills' AND quest_type = 'daily' AND is_active = 1;
SELECT 
    uaq.active_quest_id,
    qt.quest_title,
    qt.field_name,
    uaq.assigned_date,
    uaq.expires_at
FROM user_active_quests uaq
LEFT JOIN quest_templates qt ON uaq.quest_template_id = qt.quest_template_id
WHERE uaq.user_id = 39 AND uaq.quest_type = 'daily'
ORDER BY uaq.assigned_date DESC;

-- Quick verification script to check your current quest templates
-- Run this to see the current state before implementing the random+unique solution

-- =======================================================================
-- VERIFICATION QUERIES - Check current quest template status
-- =======================================================================

-- 1. Count daily quests per field
SELECT 
    field_name, 
    COUNT(*) as total_daily_quests,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_daily_quests,
    COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_daily_quests
FROM quest_templates 
WHERE quest_type = 'daily'
GROUP BY field_name
ORDER BY active_daily_quests DESC;

-- 2. Check for potential duplicates within each field
SELECT 
    field_name,
    quest_title,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(quest_template_id) as template_ids
FROM quest_templates 
WHERE quest_type = 'daily' AND is_active = 1
GROUP BY field_name, quest_title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, field_name;

-- 3. Show sample quests for each field (to verify variety)
SELECT 
    field_name,
    GROUP_CONCAT(DISTINCT quest_title ORDER BY quest_title SEPARATOR ' | ') as sample_quests
FROM quest_templates 
WHERE quest_type = 'daily' AND is_active = 1
GROUP BY field_name
ORDER BY field_name;

-- 4. Test the random selection query for a specific field
-- Replace 'Programming Skills' with your field of interest
SELECT 
    quest_template_id,
    quest_title,
    base_xp,
    difficulty,
    related_stat
FROM quest_templates 
WHERE field_name = 'Programming Skills' AND quest_type = 'daily' AND is_active = 1 
ORDER BY RAND() 
LIMIT 8;

-- 5. Check total available quest templates across all fields
SELECT 
    COUNT(*) as total_active_daily_quests,
    COUNT(DISTINCT field_name) as total_fields,
    AVG(subquery.field_count) as avg_quests_per_field
FROM (
    SELECT field_name, COUNT(*) as field_count
    FROM quest_templates 
    WHERE quest_type = 'daily' AND is_active = 1
    GROUP BY field_name
) subquery;

-- =======================================================================
-- OPTIONAL: Quick fix for obvious duplicates (if found)
-- =======================================================================

-- Only run this if the above queries show exact duplicate quest titles
-- This keeps the first occurrence of each duplicate and deactivates the rest

/*
UPDATE quest_templates qt1
SET is_active = 0
WHERE qt1.quest_type = 'daily' 
AND qt1.is_active = 1
AND EXISTS (
    SELECT 1 FROM quest_templates qt2 
    WHERE qt2.field_name = qt1.field_name 
    AND qt2.quest_title = qt1.quest_title 
    AND qt2.quest_type = 'daily'
    AND qt2.is_active = 1
    AND qt2.quest_template_id < qt1.quest_template_id
);
*/

-- =======================================================================
-- TEST THE RANDOM + UNIQUE SOLUTION
-- =======================================================================

-- Simulate the random + unique selection process for any field
-- This shows what the new system would select
WITH RandomizedQuests AS (
    SELECT 
        quest_template_id,
        quest_title,
        base_xp,
        difficulty,
        related_stat,
        field_name,
        RAND() as random_order,
        ROW_NUMBER() OVER (
            PARTITION BY field_name, LOWER(TRIM(quest_title))
            ORDER BY RAND()
        ) as uniqueness_rank
    FROM quest_templates 
    WHERE quest_type = 'daily' AND is_active = 1
)
SELECT 
    field_name,
    quest_template_id,
    quest_title,
    base_xp,
    difficulty,
    related_stat
FROM RandomizedQuests
WHERE uniqueness_rank = 1  -- Only get first occurrence of each unique title
ORDER BY field_name, random_order
LIMIT 8;