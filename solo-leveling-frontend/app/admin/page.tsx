'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import QuestManagementModal from '@/components/admin/QuestManagementModal';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import AdminLogs from '@/components/admin/AdminLogs';
// Import settings components
import FeatureFlags from '@/components/admin/FeatureFlags';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import { 
  Shield, Users, Activity, Settings, LogOut, Save, RotateCcw, Download, Upload,
  BarChart3, Clock, AlertCircle, Database, Crown, Gamepad2, Trophy, 
  Palette, Flag, CheckCircle, Sliders
} from 'lucide-react';

// Define interfaces for better type safety
interface SettingValue {
  value: any;
  type: 'boolean' | 'string' | 'number' | 'integer' | 'json';
  description: string;
}

interface SettingsCategory {
  [key: string]: SettingValue;
}

interface SystemSettings {
  quest_system: SettingsCategory;
  level_progression: SettingsCategory;
  security: SettingsCategory;
  platform: SettingsCategory;
  monitoring: SettingsCategory;
  coach_system: SettingsCategory;
}

interface Tab {
  id: string;
  label: string;
  icon: any;
  color?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [currentBg, setCurrentBg] = useState(0);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [userFilter, setUserFilter] = useState<string>('all');

  // Settings-related state with proper typing
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('quest_system');
  const [settings, setSettings] = useState<SystemSettings>({
    quest_system: {},
    level_progression: {},
    security: {},
    platform: {},
    monitoring: {},
    coach_system: {}
  });
  const [originalSettings, setOriginalSettings] = useState<SystemSettings>({
    quest_system: {},
    level_progression: {},
    security: {},
    platform: {},
    monitoring: {},
    coach_system: {}
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Solo Leveling themed backgrounds
  const backgrounds = [
    '/images/backgrounds/solo-leveling-1.jpg',
    '/images/backgrounds/solo-leveling-2.jpg',
    '/images/backgrounds/solo-leveling-3.jpg',
    '/images/backgrounds/solo-leveling-4.jpg',
  ];

  useEffect(() => {
    const initAdmin = async () => {
      const userData = await getUser();
      
      if (!userData || userData.user_type !== 'admin') {
        router.push('/login');
        return;
      }
      
      setUser(userData);
      await fetchDashboardStats();
      await fetchSettings();
      setLoading(false);
    };

    initAdmin();
  }, [router]);

  // Background rotation
  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => clearInterval(bgTimer);
  }, []);

  // Check for settings changes
  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  // Settings functions with proper error handling
  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
        setOriginalSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.put('/admin/settings', { settings });
      if (response.data.success) {
        setOriginalSettings({ ...settings });
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/admin/settings/reset');
      if (response.data.success) {
        await fetchSettings();
        toast.success('Settings reset to defaults successfully!');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev: SystemSettings) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof SystemSettings],
        [key]: {
          ...prev[category as keyof SystemSettings][key],
          value
        }
      }
    }));
  };

  const handleUsersClick = () => {
    setUserFilter('all');
    setActiveTab('users');
  };

  const handleAdventurersClick = () => {
    setUserFilter('adventurer');
    setActiveTab('users');
  };

  const handleCoachesClick = () => {
    setUserFilter('coach');
    setActiveTab('users');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Settings helper functions with proper typing
  const formatSettingName = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderSettingControl = (category: string, key: string, setting: SettingValue) => {
  const { value, type } = setting;

  switch (type) {
    case 'boolean':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => updateSetting(category, key, !value)}
            style={{
              position: 'relative',
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: value 
                ? 'linear-gradient(135deg, #9333ea, #ec4899)' 
                : 'rgba(107, 114, 128, 0.4)',
              boxShadow: value ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: value ? '27px' : '3px',
                width: '22px',
                height: '22px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            />
          </button>
          <span style={{ 
            fontSize: '14px',
            fontWeight: '600',
            color: value ? '#10b981' : '#9ca3af'
          }}>
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );

    case 'number':
    case 'integer':
      return (
        <input
          type="number"
          value={value || 0}
          onChange={(e) => {
            const newValue = type === 'integer' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0;
            updateSetting(category, key, newValue);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#a855f7';
            e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
            e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(147, 51, 234, 0.2)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'rgba(0, 0, 0, 0.5)';
          }}
        />
      );

    case 'string':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateSetting(category, key, e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#a855f7';
            e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
            e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(147, 51, 234, 0.2)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'rgba(0, 0, 0, 0.5)';
          }}
        />
      );

    case 'json':
      return (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2)}
          onChange={(e) => {
            try {
              const jsonValue = JSON.parse(e.target.value);
              updateSetting(category, key, jsonValue);
            } catch (error) {
              updateSetting(category, key, e.target.value);
            }
          }}
          rows={4}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontSize: '13px',
            fontFamily: 'monospace',
            transition: 'all 0.3s ease',
            outline: 'none',
            resize: 'vertical'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#a855f7';
            e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
            e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(147, 51, 234, 0.2)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'rgba(0, 0, 0, 0.5)';
          }}
        />
      );

    default:
      return (
        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
          Unknown setting type: {type}
        </div>
      );
  }
};

 const renderSettingsSection = (section: string) => {
  // Special sections
  if (section === 'monitoring') {
    return <SystemMonitoring />;
  }
  
  if (section === 'feature_flags') {
    return <FeatureFlags />;
  }

  // Regular settings sections
  const sectionSettings = settings[section as keyof SystemSettings] || {};
  
  if (Object.keys(sectionSettings).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Settings style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 16px' }} />
        <p style={{ color: '#9ca3af', marginBottom: '8px', fontSize: '16px' }}>No settings available for this section</p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Settings will appear here once they are loaded from the database</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
      {Object.entries(sectionSettings).map(([key, setting], index) => (
        <div
          key={key}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(147, 51, 234, 0.15)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(147, 51, 234, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.15)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Glow effect on hover */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }} className="card-glow-top" />
          
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h4 style={{ 
                  color: '#fff', 
                  fontWeight: '600',
                  fontSize: '15px',
                  margin: 0
                }}>
                  {formatSettingName(key)}
                </h4>
                {setting.type === 'boolean' && (
                  setting.value ? (
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  ) : (
                    <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  )
                )}
              </div>
              <p style={{ 
                color: '#9ca3af', 
                fontSize: '13px',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {setting.description}
              </p>
            </div>
            
            {/* Type Badge */}
            <div style={{
              background: setting.type === 'boolean' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : setting.type === 'number' || setting.type === 'integer'
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(168, 85, 247, 0.1)',
              color: setting.type === 'boolean' 
                ? '#10b981' 
                : setting.type === 'number' || setting.type === 'integer'
                ? '#3b82f6'
                : '#a855f7',
              border: `1px solid ${
                setting.type === 'boolean' 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : setting.type === 'number' || setting.type === 'integer'
                  ? 'rgba(59, 130, 246, 0.3)'
                  : 'rgba(168, 85, 247, 0.3)'
              }`,
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap'
            }}>
              {setting.type}
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            {renderSettingControl(section, key, setting)}
          </div>
        </div>
      ))}
    </div>
  );
};

  if (loading) {
    return (
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Loading screen with background animation */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: currentBg === index ? 1 : 0,
                transition: 'opacity 2s ease-in-out',
                transform: `scale(${currentBg === index ? 1 : 1.1})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'brightness(0.5) contrast(1.2) saturate(1.2)',
                  transform: 'scale(1.1)',
                }}
              />
            </div>
          ))}
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
          }} />
          
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 4s ease-in-out infinite 2s',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(147, 51, 234, 0.3)',
            borderTopColor: '#9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#9ca3af', fontSize: '18px' }}>Initializing Admin Portal...</p>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const settingsTabs: Tab[] = [
    { id: 'quest_system', label: 'Quest System', icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
    { id: 'level_progression', label: 'Level & Progression', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { id: 'security', label: 'Security & Auth', icon: Shield, color: 'from-red-500 to-pink-500' },
    { id: 'platform', label: 'Platform', icon: Palette, color: 'from-blue-500 to-cyan-500' },
    { id: 'monitoring', label: 'System Monitoring', icon: BarChart3, color: 'from-green-500 to-teal-500' },
    { id: 'feature_flags', label: 'Feature Flags', icon: Flag, color: 'from-indigo-500 to-purple-500' },
    { id: 'coach_system', label: 'Coach System', icon: Database, color: 'from-cyan-500 to-blue-500' }
  ];

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* Animated Background System */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: currentBg === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              transform: `scale(${currentBg === index ? 1 : 1.1})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(0.5) contrast(1.2) saturate(1.2)',
                transform: 'scale(1.1)',
              }}
            />
          </div>
        ))}
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
        }} />
      </div>

      {/* Admin Header */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(147, 51, 234, 0.2)'
      }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div style={{
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)'
              }}>
                <Crown className="w-6 h-6" style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(to right, #a855f7, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
                }}>
                  SYSTEM ADMIN
                </h1>
                <p className="text-gray-400 text-sm">Solo Leveling System Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div style={{
                background: 'rgba(147, 51, 234, 0.1)',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}>
                <p style={{ fontSize: '14px', color: '#a855f7', fontWeight: '700' }}>
                  WELCOME {user?.name?.toUpperCase() || user?.username?.toUpperCase() || 'ADMIN'}
                </p>
                <p style={{ fontSize: '11px', color: '#a855f7', fontWeight: '700' }}>
                  {user?.profile?.access_level || 'SUPER ADMIN'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8" style={{ position: 'relative', zIndex: 10 }}>
        {/* Main Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '8px',
          border: '1px solid rgba(147, 51, 234, 0.2)'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: isActive ? 'linear-gradient(135deg, #9333ea, #ec4899)' : 'transparent',
                  border: isActive ? '1px solid rgba(147, 51, 234, 0.5)' : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: '600',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? '0 4px 20px rgba(147, 51, 234, 0.4)' : 'none'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transform: 'rotate(45deg)',
                    animation: 'shimmer 3s infinite'
                  }} />
                )}
                <Icon style={{ width: '18px', height: '18px', position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn">
              <AdminStats 
                stats={stats} 
                onRefresh={fetchDashboardStats}
                onQuestsClick={() => setShowQuestModal(true)}
                onUsersClick={handleUsersClick}
                onAdventurersClick={handleAdventurersClick} 
                onCoachesClick={handleCoachesClick}
              />
            </div>
          )}
          {activeTab === 'users' && <UserManagement initialFilter={userFilter} />}
          {activeTab === 'logs' && <AdminLogs />}
          
          {/* Settings Tab Content */}
          // Find this section in your app/admin/page.tsx (around line 680+)

{activeTab === 'settings' && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
    {/* Enhanced Settings Sidebar */}
    <div style={{ gridColumn: 'span 12 / span 12' }} className="lg:col-span-3">
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(147, 51, 234, 0.2)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: '#a855f7',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={16} />
          Settings Categories
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))'
                    : 'transparent',
                  color: isActive ? '#fff' : '#9ca3af',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px',
                  boxShadow: isActive ? '0 4px 15px rgba(147, 51, 234, 0.3)' : 'none',
                  transform: isActive ? 'translateX(4px)' : 'translateX(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <Icon style={{ width: '20px', height: '20px', position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                {isActive && (
                  <>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      background: 'linear-gradient(to bottom, #a855f7, #ec4899)',
                      borderRadius: '0 2px 2px 0'
                    }} />
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                      animation: 'pulse 2s infinite'
                    }} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Settings Quick Stats */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(147, 51, 234, 0.2)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <h4 style={{
          color: '#fff',
          fontWeight: '600',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={18} />
          Quick Stats
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'rgba(147, 51, 234, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(147, 51, 234, 0.1)'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Active Settings</span>
            <span style={{
              color: '#fff',
              fontWeight: '700',
              fontSize: '18px'
            }}>
              {Object.values(settings).reduce((count: number, section: SettingsCategory) => count + Object.keys(section).length, 0)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'rgba(147, 51, 234, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(147, 51, 234, 0.1)'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Categories</span>
            <span style={{ color: '#a855f7', fontWeight: '600' }}>{settingsTabs.length}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: hasChanges ? 'rgba(250, 204, 21, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: hasChanges ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Unsaved Changes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: hasChanges ? '#facc15' : '#10b981',
                boxShadow: hasChanges ? '0 0 10px #facc15' : '0 0 10px #10b981',
                animation: hasChanges ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{
                fontWeight: '600',
                color: hasChanges ? '#facc15' : '#10b981'
              }}>
                {hasChanges ? 'Yes' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Enhanced Settings Main Content */}
    <div style={{ gridColumn: 'span 12 / span 12' }} className="lg:col-span-9">
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(147, 51, 234, 0.2)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Enhanced Settings Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(147, 51, 234, 0.2)',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(236, 72, 153, 0.08))',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #a855f7, transparent)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 8px 20px rgba(147, 51, 234, 0.4)'
              }}>
                {(() => {
                  const Icon = settingsTabs.find(t => t.id === activeSettingsTab)?.icon || Settings;
                  return <Icon style={{ width: '26px', height: '26px', color: '#fff' }} />;
                })()}
                <div style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '14px',
                  border: '2px solid rgba(147, 51, 234, 0.4)',
                  animation: 'spin 4s linear infinite'
                }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: '700',
                  color: '#fff',
                  fontFamily: 'Orbitron, monospace',
                  marginBottom: '4px',
                  letterSpacing: '0.5px'
                }}>
                  {settingsTabs.find(t => t.id === activeSettingsTab)?.label || 'Settings'}
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                  Configure system settings for this category
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(147, 51, 234, 0.2)',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(147, 51, 234, 0.3)'
            }}>
              <Database size={18} style={{ color: '#a855f7' }} />
              <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: '700' }}>
                {Object.keys(settings[activeSettingsTab as keyof SystemSettings] || {}).length} Active
              </span>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ padding: '32px' }}>
          {renderSettingsSection(activeSettingsTab)}
        </div>

        {/* Enhanced Action Buttons */}
        {!['monitoring', 'feature_flags'].includes(activeSettingsTab) && (
          <div style={{
            padding: '24px 32px',
            borderTop: '1px solid rgba(147, 51, 234, 0.2)',
            background: 'rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={saveSettings}
                  disabled={!hasChanges || saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: hasChanges && !saving ? 'pointer' : 'not-allowed',
                    background: hasChanges && !saving
                      ? 'linear-gradient(135deg, #9333ea, #ec4899)'
                      : 'rgba(107, 114, 128, 0.3)',
                    color: hasChanges && !saving ? '#fff' : '#6b7280',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: hasChanges && !saving ? '0 4px 15px rgba(147, 51, 234, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (hasChanges && !saving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasChanges && !saving) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 51, 234, 0.4)';
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetToDefaults}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#f97316',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <RotateCcw size={18} />
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
        </div>
      </div>

      {/* Quest Management Modal */}
      <QuestManagementModal 
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
      />

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.5; 
            transform: scale(1.1); 
          }
        }
        
        @keyframes spin {
          to { 
            transform: rotate(360deg); 
          }
        }

        @keyframes shimmer {
          0% { 
            transform: translateX(-100%) translateY(-100%) rotate(45deg); 
          }
          100% { 
            transform: translateX(100%) translateY(100%) rotate(45deg); 
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
      `}</style>
    </div>
  );
}