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
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateSetting(category, key, !value)}
              className={`relative w-12 h-6 rounded-full transition-all ${
                value ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  value ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">
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
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        );

      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateSetting(category, key, e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
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
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 font-mono text-sm"
          />
        );

      default:
        return (
          <div className="text-gray-400 text-sm">
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
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No settings available for this section</p>
          <p className="text-gray-500 text-sm">Settings will appear here once they are loaded from the database</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(sectionSettings).map(([key, setting]) => (
          <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-white font-medium">{formatSettingName(key)}</h4>
                <p className="text-gray-400 text-sm mt-1">{setting.description}</p>
              </div>
              {setting.type === 'boolean' && (
                setting.value ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )
              )}
            </div>
            
            <div className="mt-4">
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
          {activeTab === 'settings' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Settings Sidebar */}
              <div className="col-span-12 lg:col-span-3">
                <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4">
                  <h3 className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-4">
                    Settings Categories
                  </h3>
                  <div className="space-y-2">
                    {settingsTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSettingsTab(tab.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            activeSettingsTab === tab.id
                              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium text-sm">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settings Quick Stats */}
                <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4 mt-4">
                  <h4 className="text-white font-medium mb-3">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Active Settings</span>
                      <span className="text-white font-semibold">
                        {Object.values(settings).reduce((count: number, section: SettingsCategory) => count + Object.keys(section).length, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Categories</span>
                      <span className="text-purple-400 font-semibold">{settingsTabs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Unsaved Changes</span>
                      <span className={`font-semibold ${hasChanges ? 'text-yellow-400' : 'text-green-400'}`}>
                        {hasChanges ? 'Yes' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Main Content */}
              <div className="col-span-12 lg:col-span-9">
                <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl overflow-hidden">
                  {/* Settings Header */}
                  <div className="p-6 border-b border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {settingsTabs.find(t => t.id === activeSettingsTab)?.label || 'Settings'}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          Configure system settings for this category
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Content */}
                  <div className="p-6">
                    {renderSettingsSection(activeSettingsTab)}
                  </div>

                  {/* Settings Action Buttons */}
                  {!['monitoring', 'feature_flags'].includes(activeSettingsTab) && (
                    <div className="p-6 border-t border-purple-500/20 bg-black/40">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={saveSettings}
                            disabled={!hasChanges || saving}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                              hasChanges && !saving
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {saving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={resetToDefaults}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-medium transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
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
      `}</style>
    </div>
  );
}