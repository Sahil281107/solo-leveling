-- Insert sample quest templates for different fields

-- Programming Skills Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Programming Skills', 'daily', 'Solve 3 Algorithm Problems', 'Complete 3 coding challenges on any platform', 35, 'medium', 'Algorithm Mastery'),
('Programming Skills', 'daily', 'Debug Legacy Code', 'Find and fix bugs in existing codebase', 30, 'hard', 'Debug Power'),
('Programming Skills', 'daily', 'Code Review Session', 'Review and provide feedback on team code', 25, 'medium', 'Code Quality'),
('Programming Skills', 'daily', 'Speed Coding Challenge', 'Complete a programming task in under 30 minutes', 30, 'medium', 'Speed'),
('Programming Skills', 'daily', 'System Design Study', 'Learn about software architecture patterns', 35, 'hard', 'Architecture'),
('Programming Skills', 'daily', 'Logic Puzzle Solving', 'Solve 5 logical reasoning problems', 25, 'medium', 'Problem Solving'),
('Programming Skills', 'daily', 'Write Unit Tests', 'Add test coverage to existing code', 25, 'medium', 'Code Quality'),
('Programming Skills', 'daily', 'Learn New Framework Feature', 'Study documentation and implement a new feature', 30, 'medium', 'Architecture'),

-- Programming Skills Weekly Quests
('Programming Skills', 'weekly', 'Build a Mini Project', 'Create a complete application from scratch', 300, 'hard', 'Architecture'),
('Programming Skills', 'weekly', 'Contribute to Open Source', 'Make a meaningful contribution to an open source project', 250, 'medium', 'Code Quality'),
('Programming Skills', 'weekly', 'Algorithm Master Challenge', 'Solve 20+ advanced algorithm problems', 350, 'hard', 'Algorithm Mastery');

-- Physical Fitness Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Physical Fitness', 'daily', 'Morning Cardio Session', 'Complete 30 minutes of cardiovascular exercise', 30, 'medium', 'Stamina'),
('Physical Fitness', 'daily', 'Strength Training', 'Complete a full-body strength workout', 35, 'medium', 'Strength'),
('Physical Fitness', 'daily', 'Flexibility & Mobility', 'Do 20 minutes of stretching or yoga', 20, 'easy', 'Agility'),
('Physical Fitness', 'daily', 'Core Strengthening', 'Complete core-focused exercise routine', 25, 'medium', 'Strength'),
('Physical Fitness', 'daily', 'Hydration Goal', 'Drink at least 2.5 liters of water', 15, 'easy', 'Stamina'),
('Physical Fitness', 'daily', 'Active Recovery Walk', 'Take a 30-minute brisk walk outdoors', 20, 'easy', 'Stamina'),
('Physical Fitness', 'daily', 'Nutrition Tracking', 'Log all meals and track macronutrients', 20, 'easy', 'Wisdom'),
('Physical Fitness', 'daily', 'Sleep Optimization', 'Get 7-8 hours of quality sleep', 25, 'medium', 'Stamina'),

-- Physical Fitness Weekly Quests
('Physical Fitness', 'weekly', 'Fitness Milestone Challenge', 'Achieve a new personal record in any exercise', 300, 'hard', 'Strength'),
('Physical Fitness', 'weekly', 'Consistency Champion', 'Complete 6 out of 7 daily fitness quests', 250, 'medium', 'Stamina'),
('Physical Fitness', 'weekly', 'Endurance Test', 'Complete a long-distance run or equivalent cardio', 350, 'hard', 'Stamina');

-- Academic Excellence Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Academic Excellence', 'daily', 'Deep Study Session', 'Complete 2 hours of focused studying', 35, 'medium', 'Intelligence'),
('Academic Excellence', 'daily', 'Research & Note-Taking', 'Research a topic and create comprehensive notes', 30, 'medium', 'Wisdom'),
('Academic Excellence', 'daily', 'Practice Problems', 'Solve practice problems in your subject area', 25, 'medium', 'Intelligence'),
('Academic Excellence', 'daily', 'Knowledge Review', 'Review and consolidate previous learning', 20, 'easy', 'Wisdom'),
('Academic Excellence', 'daily', 'Reading Assignment', 'Read academic material for 45 minutes', 25, 'easy', 'Intelligence'),
('Academic Excellence', 'daily', 'Essay/Report Writing', 'Write or work on academic papers', 30, 'medium', 'Charisma'),
('Academic Excellence', 'daily', 'Group Study/Discussion', 'Participate in academic discussions', 25, 'medium', 'Charisma'),
('Academic Excellence', 'daily', 'Memory Palace Training', 'Practice memorization techniques', 20, 'easy', 'Intelligence'),

-- Academic Excellence Weekly Quests
('Academic Excellence', 'weekly', 'Research Project', 'Complete a comprehensive research project', 300, 'hard', 'Wisdom'),
('Academic Excellence', 'weekly', 'Knowledge Mastery Test', 'Take a comprehensive test in your field', 250, 'medium', 'Intelligence'),
('Academic Excellence', 'weekly', 'Academic Presentation', 'Prepare and deliver an academic presentation', 350, 'hard', 'Charisma');

-- Creative Mastery Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Creative Mastery', 'daily', 'Creative Practice Session', 'Spend 1 hour practicing your creative skill', 30, 'medium', 'Charisma'),
('Creative Mastery', 'daily', 'Inspiration Gathering', 'Study and analyze works by masters in your field', 25, 'easy', 'Wisdom'),
('Creative Mastery', 'daily', 'Technique Development', 'Practice specific techniques or skills', 30, 'medium', 'Agility'),
('Creative Mastery', 'daily', 'Creative Experiment', 'Try a new style, medium, or approach', 35, 'medium', 'Charisma'),
('Creative Mastery', 'daily', 'Sketch/Draft Creation', 'Create quick studies or preliminary work', 20, 'easy', 'Agility'),
('Creative Mastery', 'daily', 'Creative Tool Mastery', 'Learn new features of your creative tools', 25, 'medium', 'Intelligence'),
('Creative Mastery', 'daily', 'Portfolio Organization', 'Organize and curate your creative work', 20, 'easy', 'Wisdom'),
('Creative Mastery', 'daily', 'Creative Community Engagement', 'Share work or engage with other creatives', 25, 'medium', 'Charisma'),

-- Creative Mastery Weekly Quests
('Creative Mastery', 'weekly', 'Major Creative Project', 'Complete a significant creative work', 300, 'hard', 'Charisma'),
('Creative Mastery', 'weekly', 'Style Challenge', 'Create works in 3 different styles', 250, 'medium', 'Agility'),
('Creative Mastery', 'weekly', 'Creative Showcase', 'Present or exhibit your creative work', 350, 'hard', 'Charisma');

-- Professional Growth Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Professional Growth', 'daily', 'Skill Development Hour', 'Spend 1 hour learning job-relevant skills', 30, 'medium', 'Intelligence'),
('Professional Growth', 'daily', 'Network Building', 'Connect with one new professional contact', 25, 'medium', 'Charisma'),
('Professional Growth', 'daily', 'Industry News Update', 'Read industry news and trends for 30 minutes', 20, 'easy', 'Wisdom'),
('Professional Growth', 'daily', 'Goal Progress Review', 'Review and update career goals and progress', 25, 'easy', 'Wisdom'),
('Professional Growth', 'daily', 'Professional Communication', 'Send meaningful professional emails/messages', 20, 'easy', 'Charisma'),
('Professional Growth', 'daily', 'Productivity Optimization', 'Implement a productivity technique or tool', 25, 'medium', 'Intelligence'),
('Professional Growth', 'daily', 'Mentor/Mentee Interaction', 'Connect with mentor or help junior colleague', 30, 'medium', 'Charisma'),
('Professional Growth', 'daily', 'Professional Documentation', 'Update resume, portfolio, or professional profiles', 20, 'easy', 'Wisdom'),

-- Professional Growth Weekly Quests
('Professional Growth', 'weekly', 'Professional Project', 'Complete a significant work project', 300, 'hard', 'Intelligence'),
('Professional Growth', 'weekly', 'Leadership Challenge', 'Take on a leadership role or initiative', 250, 'medium', 'Charisma'),
('Professional Growth', 'weekly', 'Industry Expert Interview', 'Conduct informational interviews with experts', 350, 'hard', 'Wisdom');

-- Mental Wellness Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Mental Wellness', 'daily', 'Meditation Session', 'Practice mindfulness meditation for 20 minutes', 25, 'easy', 'Wisdom'),
('Mental Wellness', 'daily', 'Gratitude Journaling', 'Write down 3 things you are grateful for', 15, 'easy', 'Wisdom'),
('Mental Wellness', 'daily', 'Stress Management', 'Practice stress-reduction techniques', 25, 'medium', 'Stamina'),
('Mental Wellness', 'daily', 'Emotional Check-in', 'Reflect on and process your emotions', 20, 'easy', 'Wisdom'),
('Mental Wellness', 'daily', 'Mindful Walking', 'Take a 20-minute mindful walk in nature', 25, 'easy', 'Stamina'),
('Mental Wellness', 'daily', 'Digital Detox Hour', 'Spend 1 hour without digital devices', 30, 'medium', 'Stamina'),
('Mental Wellness', 'daily', 'Breathing Exercises', 'Practice deep breathing or pranayama', 20, 'easy', 'Stamina'),
('Mental Wellness', 'daily', 'Positive Affirmations', 'Practice self-affirmation and positive self-talk', 15, 'easy', 'Charisma'),

-- Mental Wellness Weekly Quests
('Mental Wellness', 'weekly', 'Therapy/Counseling Session', 'Attend mental health professional session', 200, 'medium', 'Wisdom'),
('Mental Wellness', 'weekly', 'Mental Health Goal Review', 'Assess and adjust mental wellness goals', 150, 'easy', 'Wisdom'),
('Mental Wellness', 'weekly', 'Mindfulness Retreat Day', 'Dedicate a full day to mindfulness practices', 300, 'hard', 'Wisdom');

-- Language Learning Daily Quests
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Language Learning', 'daily', 'Vocabulary Building', 'Learn and practice 10 new words', 25, 'easy', 'Intelligence'),
('Language Learning', 'daily', 'Grammar Practice', 'Complete grammar exercises for 30 minutes', 30, 'medium', 'Intelligence'),
('Language Learning', 'daily', 'Listening Comprehension', 'Listen to native content for 20 minutes', 25, 'medium', 'Wisdom'),
('Language Learning', 'daily', 'Speaking Practice', 'Practice speaking for 15 minutes', 30, 'medium', 'Charisma'),
('Language Learning', 'daily', 'Reading Practice', 'Read in target language for 20 minutes', 25, 'easy', 'Intelligence'),
('Language Learning', 'daily', 'Writing Exercise', 'Write a short text in target language', 30, 'medium', 'Charisma'),
('Language Learning', 'daily', 'Cultural Learning', 'Learn about target language culture', 20, 'easy', 'Wisdom'),
('Language Learning', 'daily', 'Language App Practice', 'Complete daily lesson on language app', 20, 'easy', 'Intelligence'),

-- Language Learning Weekly Quests
('Language Learning', 'weekly', 'Conversation Partner Session', 'Have extended conversation with native speaker', 250, 'hard', 'Charisma'),
('Language Learning', 'weekly', 'Language Media Immersion', 'Watch movies/shows in target language', 200, 'medium', 'Wisdom'),
('Language Learning', 'weekly', 'Language Proficiency Test', 'Take practice test or assessment', 300, 'hard', 'Intelligence');

-- Elite Athlete Daily Quests (already exist in your database, but adding more)
INSERT INTO quest_templates (field_name, quest_type, quest_title, quest_description, base_xp, difficulty, related_stat) VALUES
('Elite Athlete', 'daily', 'Competition Preparation', 'Practice competition-specific skills', 40, 'hard', 'Technical Skill'),
('Elite Athlete', 'daily', 'Performance Analysis', 'Review and analyze training footage', 30, 'medium', 'Tactical IQ'),
('Elite Athlete', 'daily', 'Mental Training', 'Visualization and mental preparation', 25, 'medium', 'Mental Focus'),
('Elite Athlete', 'daily', 'Recovery Protocol', 'Complete full recovery routine', 30, 'medium', 'Recovery'),

-- Elite Athlete Weekly Quests
('Elite Athlete', 'weekly', 'Competition Simulation', 'Complete full competition simulation', 400, 'hard', 'Technical Skill'),
('Elite Athlete', 'weekly', 'Performance Benchmark', 'Achieve new personal best in key metrics', 350, 'hard', 'Physical Power'),
('Elite Athlete', 'weekly', 'Training Intensity Peak', 'Complete highest intensity training week', 300, 'hard', 'Stamina');