'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import ProfileManager from '@/components/dashboard/ProfileManager';
import Cookies from 'js-cookie';
import { 
  Sword, Shield, Heart, Brain, Zap, Star,
  Trophy, Target, TrendingUp, Calendar, Clock, CheckCircle,
  Flame, Swords, Activity, Lock, Unlock, AlertCircle, RefreshCw,
  MessageSquare, Mail, Eye, EyeOff, User
} from 'lucide-react';

const refreshUserData = () => {
  // Refresh user data from cookies
  const userStr = document.cookie
    .split('; ')
    .find(row => row.startsWith('user='));
  
  if (userStr) {
    try {
      const userData = JSON.parse(decodeURIComponent(userStr.split('=')[1]));
      return userData;
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [dailyQuests, setDailyQuests] = useState<any[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [receivedGuidance, setReceivedGuidance] = useState<any[]>([]);
  const [unreadGuidanceCount, setUnreadGuidanceCount] = useState(0);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [selectedGuidance, setSelectedGuidance] = useState<any>(null);

  // Solo Leveling themed backgrounds
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  useEffect(() => {
    console.log('Dashboard: Starting initialization...');
    const currentUser = getUser();
    if (!currentUser || currentUser.user_type !== 'adventurer') {
      console.log('Dashboard: No valid user found, redirecting to login');
      router.push('/login');
      return;
    }
    console.log('Dashboard: User found:', currentUser);
    setUser(currentUser);
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Loading timeout. Please refresh the page.');
        setLoading(false);
      }
    }, 15000); // 15 seconds timeout

    fetchDashboardData().finally(() => {
      clearTimeout(timeout);
    });
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Change background every 10 seconds
    const bgTimer = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 10000);
    
    return () => {
      clearInterval(timer);
      clearInterval(bgTimer);
      clearTimeout(timeout);
    };
  }, []);

  const fetchDashboardData = async () => {
  console.log('Dashboard: Starting data fetch...');
  setLoading(true);
  setError(null);
  
  try {
    // Get current user from cookies first
    const currentUser = getUser();
    console.log('Dashboard: Current user from cookies:', currentUser);
    
    if (currentUser) {
      setUser(currentUser);
      console.log('Dashboard: User profile photo URL from cookies:', currentUser.profile_photo_url);
    }

    // Test backend connection first
    console.log('Dashboard: Testing backend connection...');
    const healthCheck = await fetch('http://localhost:5000/api/health');
    if (!healthCheck.ok) {
      throw new Error('Backend server is not responding');
    }
    console.log('Dashboard: Backend connection successful');

    // Fetch profile 
    console.log('Dashboard: Fetching profile...');
    try {
      const profileRes = await api.get('/users/profile');
      console.log('Dashboard: Profile response:', profileRes.data);
      
      // Update user data if backend returns updated info
      if (profileRes.data.user && profileRes.data.user.profile_photo_url !== currentUser?.profile_photo_url) {
        console.log('Dashboard: Updating user with new profile photo URL:', profileRes.data.user.profile_photo_url);
        
        const updatedUser = { ...currentUser, ...profileRes.data.user };
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
      }
      
      if (profileRes.data.profile) {
        setProfile(profileRes.data.profile);
      } else {
        // Set default profile
        setProfile({ 
          current_level: 1, 
          total_exp: 0, 
          current_exp: 0, 
          exp_to_next_level: 100,
          streak_days: 0,
          field_of_interest: 'Programming Skills'
        });
      }
    } catch (profileError) {
      console.error('Dashboard: Profile fetch failed:', profileError);
      // Keep the user from cookies even if profile fetch fails
      if (currentUser) {
        setUser(currentUser);
      }
      
      // Set default profile and continue
      setProfile({ 
        current_level: 1, 
        total_exp: 0, 
        current_exp: 0, 
        exp_to_next_level: 100,
        streak_days: 0,
        field_of_interest: 'Programming Skills'
      });
    }

      // Fetch stats
      console.log('Dashboard: Fetching stats...');
      try {
        const statsRes = await api.get('/users/stats');
        console.log('Dashboard: Stats response:', statsRes.data);
        if (statsRes.data.stats && statsRes.data.stats.length > 0) {
          setStats(statsRes.data.stats);
        } else {
          await initializeUserStats();
        }
      } catch (statsError) {
        console.error('Dashboard: Stats fetch failed:', statsError);
        // Set default stats
        setStats([
          { stat_name: 'Strength', stat_icon: '💪', current_value: 10, max_value: 100 },
          { stat_name: 'Intelligence', stat_icon: '🧠', current_value: 10, max_value: 100 },
          { stat_name: 'Agility', stat_icon: '⚡', current_value: 10, max_value: 100 },
          { stat_name: 'Stamina', stat_icon: '🏃', current_value: 10, max_value: 100 },
          { stat_name: 'Wisdom', stat_icon: '📚', current_value: 10, max_value: 100 },
          { stat_name: 'Charisma', stat_icon: '✨', current_value: 10, max_value: 100 }
        ]);
      }

      // Fetch quests with more robust error handling
      console.log('Dashboard: Fetching quests...');
      await fetchQuests();

      // Fetch achievements
      console.log('Dashboard: Fetching achievements...');
      try {
        const achievementsRes = await api.get('/users/achievements');
        console.log('Dashboard: Achievements response:', achievementsRes.data);
        const earnedAchievements = achievementsRes.data.achievements || [];
        setAchievements(earnedAchievements);
        
        const allPossibleAchievements = getAchievementsList();
        const achievementsWithStatus = allPossibleAchievements.map(achievement => ({
          ...achievement,
          isEarned: earnedAchievements.some((earned: any) => 
            earned.achievement_id === achievement.achievement_id
          ),
          earned_at: earnedAchievements.find((earned: any) => 
            earned.achievement_id === achievement.achievement_id
          )?.earned_at
        }));
        setAllAchievements(achievementsWithStatus);
      } catch (achievementsError) {
        console.error('Dashboard: Achievements fetch failed:', achievementsError);
        // Set default achievements
        setAllAchievements(getAchievementsList().map(achievement => ({
          ...achievement,
          isEarned: false
        })));
      }
      
      await fetchReceivedGuidance();

      console.log('Dashboard: Data fetch completed successfully');
      
    } catch (error: any) {
      console.error('Dashboard: Data fetch failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuests = async () => {
    try {
      console.log('Dashboard: Fetching daily quests...');
      const dailyRes = await api.get('/quests/daily');
      console.log('Dashboard: Daily quests response:', dailyRes.data);
      
      if (dailyRes.data.quests && dailyRes.data.quests.length > 0) {
        setDailyQuests(dailyRes.data.quests);
      } else {
        console.log('Dashboard: No daily quests found, generating...');
        await generateDailyQuests();
      }
    } catch (dailyError) {
      console.error('Dashboard: Daily quests fetch failed:', dailyError);
      // Generate default daily quests
      await generateDefaultDailyQuests();
    }

    try {
      console.log('Dashboard: Fetching weekly quests...');
      const weeklyRes = await api.get('/quests/weekly');
      console.log('Dashboard: Weekly quests response:', weeklyRes.data);
      
      if (weeklyRes.data.quests && weeklyRes.data.quests.length > 0) {
        setWeeklyQuests(weeklyRes.data.quests);
      } else {
        console.log('Dashboard: No weekly quests found, generating...');
        await generateWeeklyQuests();
      }
    } catch (weeklyError) {
      console.error('Dashboard: Weekly quests fetch failed:', weeklyError);
      // Generate default weekly quests
      await generateDefaultWeeklyQuests();
    }
  };

  const generateDefaultDailyQuests = async () => {
    console.log('Dashboard: Generating default daily quests...');
    const defaultQuests = [
      { active_quest_id: 1, quest_title: 'Morning Routine', base_xp: 25, difficulty: 'easy', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 2, quest_title: 'Study/Practice for 30 minutes', base_xp: 35, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 3, quest_title: 'Physical Exercise', base_xp: 30, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 4, quest_title: 'Skill Development', base_xp: 40, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 5, quest_title: 'Healthy Meal Planning', base_xp: 20, difficulty: 'easy', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 6, quest_title: 'Goal Review & Planning', base_xp: 25, difficulty: 'easy', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 7, quest_title: 'Creative Activity', base_xp: 30, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() },
      { active_quest_id: 8, quest_title: 'Evening Reflection', base_xp: 20, difficulty: 'easy', is_completed: false, expires_at: new Date(Date.now() + 86400000).toISOString() }
    ];
    setDailyQuests(defaultQuests);
  };

  const generateDefaultWeeklyQuests = async () => {
    console.log('Dashboard: Generating default weekly quests...');
    const defaultWeeklyQuests = [
      { active_quest_id: 101, quest_title: 'Complete 5 Daily Quests', base_xp: 200, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 604800000).toISOString() },
      { active_quest_id: 102, quest_title: 'Weekly Skill Master Challenge', base_xp: 300, difficulty: 'hard', is_completed: false, expires_at: new Date(Date.now() + 604800000).toISOString() },
      { active_quest_id: 103, quest_title: 'Consistency Champion', base_xp: 250, difficulty: 'medium', is_completed: false, expires_at: new Date(Date.now() + 604800000).toISOString() }
    ];
    setWeeklyQuests(defaultWeeklyQuests);
  };

  const initializeUserStats = async () => {
    console.log('Dashboard: Initializing user stats...');
    try {
      const initialStats = [
        { stat_name: 'Strength', stat_icon: '💪', current_value: 10, max_value: 100 },
        { stat_name: 'Intelligence', stat_icon: '🧠', current_value: 10, max_value: 100 },
        { stat_name: 'Agility', stat_icon: '⚡', current_value: 10, max_value: 100 },
        { stat_name: 'Stamina', stat_icon: '🏃', current_value: 10, max_value: 100 },
        { stat_name: 'Wisdom', stat_icon: '📚', current_value: 10, max_value: 100 },
        { stat_name: 'Charisma', stat_icon: '✨', current_value: 10, max_value: 100 }
      ];
      
      setStats(initialStats);
      
      // Try to initialize in backend
      try {
        await api.post('/users/initialize-stats', { stats: initialStats });
      } catch (error) {
        console.warn('Dashboard: Backend stats initialization failed, using frontend stats');
      }
    } catch (error) {
      console.error('Dashboard: Failed to initialize stats:', error);
    }
  };

  const generateDailyQuests = async () => {
    try {
      console.log('Dashboard: Generating daily quests via API...');
      const response = await api.post('/quests/generate-daily');
      if (response.data.quests) {
        setDailyQuests(response.data.quests);
      } else {
        await generateDefaultDailyQuests();
      }
    } catch (error) {
      console.error('Dashboard: Failed to generate daily quests:', error);
      await generateDefaultDailyQuests();
    }
  };

  const generateWeeklyQuests = async () => {
    try {
      console.log('Dashboard: Generating weekly quests via API...');
      const response = await api.post('/quests/generate-weekly');
      if (response.data.quests) {
        setWeeklyQuests(response.data.quests);
      } else {
        await generateDefaultWeeklyQuests();
      }
    } catch (error) {
      console.error('Dashboard: Failed to generate weekly quests:', error);
      await generateDefaultWeeklyQuests();
    }
  };

  const getAchievementsList = () => {
    return [
      { achievement_id: 1, achievement_name: 'First Steps', achievement_description: 'Complete your first quest', achievement_icon: '🎯', requirement: 'complete_quests_1' },
      { achievement_id: 2, achievement_name: 'Week Warrior', achievement_description: 'Maintain a 7-day streak', achievement_icon: '🔥', requirement: 'streak_7' },
      { achievement_id: 3, achievement_name: 'Level 5 Hunter', achievement_description: 'Reach Level 5', achievement_icon: '⭐', requirement: 'level_5' },
      { achievement_id: 4, achievement_name: 'Level 10 Fighter', achievement_description: 'Reach Level 10', achievement_icon: '🗡️', requirement: 'level_10' },
      { achievement_id: 5, achievement_name: 'Quest Master', achievement_description: 'Complete 50 quests', achievement_icon: '👑', requirement: 'complete_quests_50' },
      { achievement_id: 6, achievement_name: 'Dedication', achievement_description: 'Maintain a 30-day streak', achievement_icon: '💎', requirement: 'streak_30' },
      { achievement_id: 7, achievement_name: 'Power Surge', achievement_description: 'Reach 1000 total XP', achievement_icon: '⚡', requirement: 'xp_1000' },
      { achievement_id: 8, achievement_name: 'Elite Hunter', achievement_description: 'Reach Level 20', achievement_icon: '🏆', requirement: 'level_20' },
      { achievement_id: 9, achievement_name: 'Strength Master', achievement_description: 'Max out Strength stat', achievement_icon: '💪', requirement: 'stat_strength_100' },
      { achievement_id: 10, achievement_name: 'Shadow Monarch', achievement_description: 'Reach Level 50', achievement_icon: '👤', requirement: 'level_50' }
    ];
  };

  const handleQuestComplete = async (questId: number, questType: 'daily' | 'weekly' = 'daily') => {
    try {
      console.log(`Dashboard: Completing quest ${questId}...`);
      
      // Update locally first for immediate feedback
      if (questType === 'daily') {
        setDailyQuests(prev => prev.map(q => 
          q.active_quest_id === questId ? {...q, is_completed: true} : q
        ));
      } else {
        setWeeklyQuests(prev => prev.map(q => 
          q.active_quest_id === questId ? {...q, is_completed: true} : q
        ));
      }

      // Try to complete via API
      try {
        const response = await api.post(`/quests/complete/${questId}`);
        const xpGained = response.data.xp_gained || (questType === 'weekly' ? 500 : 100);
        toast.success(`🎉 Quest completed! +${xpGained} XP gained!`);
        
        if (response.data.leveledUp) {
          toast.success(`🎊 LEVEL UP! You reached Level ${response.data.newLevel}!`);
          checkAchievements(response.data.newLevel, response.data.totalExp);
        }
        
        // Refresh data
        setTimeout(() => {
          fetchDashboardData();
        }, 1000);
      } catch (apiError) {
        console.warn('Dashboard: API quest completion failed, using frontend simulation');
        // Simulate XP gain locally
        const xpGained = questType === 'weekly' ? 200 : 30;
        toast.success(`🎉 Quest completed! +${xpGained} XP gained! (Demo mode)`);
        
        // Update profile locally
        if (profile) {
          const newTotalExp = profile.total_exp + xpGained;
          let newCurrentExp = profile.current_exp + xpGained;
          let newLevel = profile.current_level;
          
          if (newCurrentExp >= profile.exp_to_next_level) {
            newLevel++;
            newCurrentExp = newCurrentExp - profile.exp_to_next_level;
            toast.success(`🎊 LEVEL UP! You reached Level ${newLevel}!`);
          }
          
          setProfile(prev => ({
            ...prev,
            total_exp: newTotalExp,
            current_exp: newCurrentExp,
            current_level: newLevel
          }));
        }
      }
      
    } catch (error: any) {
      console.error('Dashboard: Quest completion error:', error);
      toast.error('Failed to complete quest. Please try again.');
    }
  };

  const checkAchievements = async (level: number, totalExp: number) => {
    try {
      const response = await api.post('/users/check-achievements', { level, totalExp });
      
      if (response.data.newAchievements && response.data.newAchievements.length > 0) {
        response.data.newAchievements.forEach((achievement: any) => {
          toast.success(`🏆 Achievement Unlocked: ${achievement.achievement_name}!`, {
            duration: 5000
          });
        });
        
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Dashboard: Failed to check achievements:', error);
    }
  };

  const fetchReceivedGuidance = async () => {
    try {
      console.log('Dashboard: Fetching received guidance...');
      const response = await api.get('/users/received-feedback');
      console.log('Dashboard: Received guidance response:', response.data);
      
      setReceivedGuidance(response.data.feedback || []);
      setUnreadGuidanceCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Dashboard: Failed to fetch received guidance:', error);
      setReceivedGuidance([]);
      setUnreadGuidanceCount(0);
    }
  };

  const markGuidanceAsRead = async (feedbackId: number) => {
    try {
      await api.put(`/users/feedback/${feedbackId}/read`);
      
      setReceivedGuidance(prev => 
        prev.map(guidance => 
          guidance.feedback_id === feedbackId 
            ? { ...guidance, is_read: true }
            : guidance
        )
      );
      
      setUnreadGuidanceCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Dashboard: Failed to mark guidance as read:', error);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    try {
      const expires = new Date(expiresAt);
      const now = currentTime;
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) return 'Expired';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} remaining`;
      }
      
      return `${hours}h ${minutes}m remaining`;
    } catch (error) {
      return 'Time remaining';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4ade80';
      case 'medium': return '#facc15';
      case 'hard': return '#f87171';
      default: return '#9ca3af';
    }
  };

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="hero">
        <div className="spinner"></div>
        <p className="text-gray-400 mt-4">Loading your adventure...</p>
        {error && (
          <div className="mt-4 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button 
              onClick={retryFetch}
              className="btn btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="hero">
        <AlertCircle size={64} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {error}
        </p>
        <button 
          onClick={retryFetch}
          className="btn btn-primary flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <div className="mt-6 text-sm text-gray-500">
          <p>Troubleshooting tips:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Make sure the backend server is running on port 5000</li>
            <li>Check your database connection</li>
            <li>Verify your .env file is configured correctly</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>
      {/* Animated Solo Leveling Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden'
      }}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === backgroundIndex ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              transform: `scale(${index === backgroundIndex ? 1.1 : 1})`,
              filter: 'brightness(0.3) saturate(1.2)'
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar user={user} onLogout={logout} />
        
        <div className="container" style={{ padding: '32px 20px' }}>
          {/* Hero Section with Profile */}
          <div className="glass mb-8 fade-in">
            <div className="flex justify-between items-start">
              <div style={{ flex: 1 }}>
                <h1 className="hero-title gradient-text" style={{ fontSize: '48px', marginBottom: '16px' }}>
                  Welcome back, {user?.username}
                </h1>
                <p className="text-gray-400 mb-4">
                  {profile?.field_of_interest || 'Adventurer'} • Level {profile?.current_level || 1}
                </p>
                
                {/* Level Progress */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span>Level {profile?.current_level || 1}</span>
                    <span className="text-indigo-400">
                      {profile?.current_exp || 0} / {profile?.exp_to_next_level || 100} XP
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${((profile?.current_exp || 0) / (profile?.exp_to_next_level || 100)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* Streak & Total XP */}
                <div className="flex items-center gap-4">
                  <div className="stat-card" style={{ padding: '16px', minWidth: '150px' }}>
                    <div className="stat-value">
                      <Flame className="inline w-6 h-6 mr-2 text-orange-500" />
                      {profile?.streak_days || 0}
                    </div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                  <div className="stat-card" style={{ padding: '16px', minWidth: '150px' }}>
                    <div className="stat-value">
                      <Zap className="inline w-6 h-6 mr-2 text-yellow-500" />
                      {profile?.total_exp || 0}
                    </div>
                    <div className="stat-label">Total XP</div>
                  </div>
                </div>
              </div>
              
              {/* Profile Photo Manager */}
              <ProfileManager 
                user={user} 
                onUpdate={(updatedUser) => {
                  setUser(updatedUser);
                }} 
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card float-animation" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-value">{stat.stat_icon} {stat.current_value}</div>
                <div className="stat-label">{stat.stat_name}</div>
                <div className="progress-bar mt-2" style={{ height: '6px' }}>
                  <div 
                    className="progress-fill"
                    style={{ width: `${(stat.current_value / stat.max_value) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Guidance Section - Always Visible */}
          <div 
            className="glass mb-8 fade-in" 
            style={{
              background: unreadGuidanceCount > 0 
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))'
                : 'rgba(0, 0, 0, 0.3)',
              border: unreadGuidanceCount > 0 
                ? '2px solid rgba(168, 85, 247, 0.4)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              animation: unreadGuidanceCount > 0 ? 'pulse 2s infinite' : 'none'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: unreadGuidanceCount > 0 
                    ? 'linear-gradient(135deg, #a855f7, #ec4899)' 
                    : 'rgba(147, 51, 234, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <MessageSquare size={28} style={{ color: '#fff' }} />
                  {unreadGuidanceCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'bounce 1s infinite'
                    }}>
                      {unreadGuidanceCount}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {unreadGuidanceCount > 0 
                      ? 'New Guidance from Your Coach!'
                      : 'Coach Guidance Center'
                    }
                  </h3>
                  <p className="text-gray-300">
                    {unreadGuidanceCount > 0 
                      ? `${unreadGuidanceCount} new messages from your coach`
                      : receivedGuidance.length > 0 
                        ? `${receivedGuidance.length} total messages from your coach`
                        : 'No messages yet from your coach'
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowGuidanceModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Mail size={20} />
                {unreadGuidanceCount > 0 ? 'Read Messages' : 'View Messages'}
              </button>
            </div>
          </div>

          {/* Quests Section */}
          <div className="glass">
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6" style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
              <button
                onClick={() => setActiveTab('daily')}
                className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Daily Quests ({dailyQuests.filter(q => !q.is_completed).length})
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`btn ${activeTab === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Weekly Challenges ({weeklyQuests.filter(q => !q.is_completed).length})
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`btn ${activeTab === 'achievements' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Achievements ({achievements.length}/{allAchievements.length})
              </button>
            </div>

            {/* Daily Quests */}
            {activeTab === 'daily' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Daily Quests</h2>
                  <p className="text-gray-400">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Reset in {formatTimeRemaining(dailyQuests[0]?.expires_at || new Date(Date.now() + 86400000).toISOString())}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {dailyQuests.length > 0 ? dailyQuests.map((quest) => (
                    <div 
                      key={quest.active_quest_id} 
                      className={`quest-card ${quest.is_completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {quest.quest_title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span style={{ 
                              color: getDifficultyColor(quest.difficulty),
                              fontSize: '14px',
                              textTransform: 'uppercase',
                              fontWeight: 'bold'
                            }}>
                              {quest.difficulty}
                            </span>
                            <span className="text-yellow-400">
                              <Zap className="inline w-4 h-4 mr-1" />
                              {quest.base_xp} XP
                            </span>
                            {quest.related_stat && (
                              <span className="text-gray-400" style={{ fontSize: '14px' }}>
                                +{quest.related_stat}
                              </span>
                            )}
                          </div>
                        </div>
                        {quest.is_completed && (
                          <CheckCircle className="text-green-400" size={24} />
                        )}
                      </div>
                      
                      {!quest.is_completed && (
                        <button
                          onClick={() => handleQuestComplete(quest.active_quest_id, 'daily')}
                          className="btn btn-primary w-full"
                        >
                          Complete Quest
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="text-center col-span-2 py-8">
                      <p className="text-gray-400">No daily quests available.</p>
                      <button 
                        onClick={generateDailyQuests}
                        className="btn btn-primary mt-4"
                      >
                        Generate Daily Quests
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Challenges */}
            {activeTab === 'weekly' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Weekly Challenges</h2>
                  <p className="text-gray-400">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Reset in {formatTimeRemaining(weeklyQuests[0]?.expires_at || new Date(Date.now() + 604800000).toISOString())}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {weeklyQuests.length > 0 ? weeklyQuests.map((quest) => (
                    <div 
                      key={quest.active_quest_id} 
                      className={`quest-card ${quest.is_completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {quest.quest_title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span style={{ 
                              color: getDifficultyColor(quest.difficulty),
                              fontSize: '14px',
                              textTransform: 'uppercase',
                              fontWeight: 'bold'
                            }}>
                              {quest.difficulty}
                            </span>
                            <span className="text-yellow-400">
                              <Zap className="inline w-4 h-4 mr-1" />
                              {quest.base_xp} XP
                            </span>
                          </div>
                        </div>
                        {quest.is_completed && (
                          <CheckCircle className="text-green-400" size={24} />
                        )}
                      </div>
                      
                      {!quest.is_completed && (
                        <button
                          onClick={() => handleQuestComplete(quest.active_quest_id, 'weekly')}
                          className="btn btn-primary w-full"
                        >
                          Complete Challenge
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="text-center col-span-2 py-8">
                      <p className="text-gray-400">No weekly challenges available.</p>
                      <button 
                        onClick={generateWeeklyQuests}
                        className="btn btn-primary mt-4"
                      >
                        Generate Weekly Quests
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Achievements */}
            {activeTab === 'achievements' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Achievements</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {allAchievements.map((achievement) => (
                    <div 
                      key={achievement.achievement_id} 
                      className={`card text-center ${!achievement.isEarned ? 'opacity-50' : ''}`}
                      style={{
                        position: 'relative',
                        border: achievement.isEarned ? '2px solid #fbbf24' : '2px solid #374151'
                      }}
                    >
                      {!achievement.isEarned && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 1
                        }}>
                          <Lock size={32} className="text-gray-600" />
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '48px', 
                        marginBottom: '12px',
                        filter: !achievement.isEarned ? 'grayscale(1)' : 'none'
                      }}>
                        {achievement.achievement_icon || '🏆'}
                      </div>
                      
                      <h3 style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        color: achievement.isEarned ? '#fff' : '#6b7280'
                      }}>
                        {achievement.achievement_name}
                      </h3>
                      
                      <p className="text-gray-400" style={{ fontSize: '14px', marginBottom: '8px' }}>
                        {achievement.achievement_description}
                      </p>
                      
                      {achievement.isEarned && achievement.earned_at && (
                        <p className="text-yellow-400" style={{ fontSize: '12px' }}>
                          <Unlock className="inline w-3 h-3 mr-1" />
                          Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      )}
                      
                      {!achievement.isEarned && (
                        <p className="text-gray-600" style={{ fontSize: '12px' }}>
                          Locked
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guidance Modal */}
      {showGuidanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="glass" style={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(147, 51, 234, 0.4)',
          }}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{
                fontSize: '32px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Coach Guidance ({receivedGuidance.length})
              </h2>
              <button
                onClick={() => setShowGuidanceModal(false)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '24px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {receivedGuidance.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {receivedGuidance.map((guidance) => (
                    <div
                      key={guidance.feedback_id}
                      style={{
                        padding: '20px',
                        background: guidance.is_read 
                          ? 'rgba(0, 0, 0, 0.4)' 
                          : 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                        border: guidance.is_read 
                          ? '1px solid rgba(255, 255, 255, 0.2)' 
                          : '2px solid rgba(147, 51, 234, 0.6)',
                        borderRadius: '16px',
                        cursor: guidance.is_read ? 'default' : 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                      }}
                      onClick={() => {
                        if (!guidance.is_read) {
                          markGuidanceAsRead(guidance.feedback_id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!guidance.is_read) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(147, 51, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* New Message Badge */}
                      {!guidance.is_read && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fff',
                          animation: 'pulse 2s infinite',
                          zIndex: 1,
                        }}>
                          !
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(147, 51, 234, 0.4)',
                          }}>
                            <User size={24} style={{ color: '#fff' }} />
                          </div>
                          
                          <div>
                            <p style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '4px',
                              fontSize: '18px',
                              color: guidance.is_read ? '#d1d5db' : '#fff'
                            }}>
                              {guidance.coach_name || 'Your Coach'}
                            </p>
                            <p style={{ 
                              fontSize: '12px', 
                              color: '#9ca3af',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <Clock size={12} />
                              {new Date(guidance.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {guidance.is_read ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#10b981',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              <Eye size={16} />
                              Read
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#a855f7',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              <EyeOff size={16} />
                              New
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message Content */}
                      <div style={{
                        padding: '20px',
                        background: guidance.is_read 
                          ? 'rgba(0, 0, 0, 0.4)' 
                          : 'rgba(147, 51, 234, 0.2)',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${guidance.is_read ? '#6b7280' : '#a855f7'}`,
                        marginBottom: '16px',
                      }}>
                        <p style={{ 
                          lineHeight: '1.7',
                          fontSize: '16px',
                          color: guidance.is_read ? '#d1d5db' : '#fff',
                          margin: 0,
                        }}>
                          {guidance.feedback_text}
                        </p>
                      </div>
                      
                      {/* Footer */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '12px'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          background: guidance.is_read 
                            ? 'rgba(107, 114, 128, 0.3)' 
                            : 'rgba(147, 51, 234, 0.4)',
                          borderRadius: '20px',
                          textTransform: 'capitalize',
                          color: guidance.is_read ? '#9ca3af' : '#e9d5ff',
                          fontWeight: '600'
                        }}>
                          {guidance.feedback_type || 'guidance'}
                        </span>
                        
                        {guidance.rating && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: '#fbbf24'
                          }}>
                            {'★'.repeat(guidance.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <MessageSquare size={80} style={{ margin: '0 auto 24px', color: '#6b7280', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#9ca3af' }}>
                    No Guidance Yet
                  </h3>
                  <p className="text-gray-400" style={{ fontSize: '16px' }}>
                    Your coach hasn't sent any guidance messages yet. Keep up the great work on your quests!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0);
          }
          50% { 
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}