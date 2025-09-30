// File: frontend/app/admin/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import FeatureFlags from '@/components/admin/FeatureFlags';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import { 
  Settings, Crown, Save, RotateCcw, Download, Upload, 
  Gamepad2, Trophy, Shield, Palette, BarChart3, Database,
  Sliders, AlertCircle, CheckCircle, Clock, Activity, Flag,
  ArrowLeft
} from 'lucide-react';

interface SettingValue {
  value: any;
  type: string;
  description: string;
}

interface Settings {
  quest_system: Record<string, SettingValue>;
  level_progression: Record<string, SettingValue>;
  security: Record<string, SettingValue>;
  platform: Record<string, SettingValue>;
  monitoring: Record<string, SettingValue>;
  coach_system: Record<string, SettingValue>;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('quest_system');
  const [settings, setSettings] = useState<Settings>({
    quest_system: {},
    level_progression: {},
    security: {},
    platform: {},
    monitoring: {},
    coach_system: {}
  });
  const [originalSettings, setOriginalSettings] = useState<Settings>({
    quest_system: {},
    level_progression: {},
    security: {},
    platform: {},
    monitoring: {},
    coach_system: {}
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Background animation
  const [currentBg, setCurrentBg] = useState(0);
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
      await fetchSettings();
      setLoading(false);
    };

    initAdmin();
  }, [router]);

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    return () => clearInterval(bgTimer);
  }, []);

  useEffect(() => {
    // Check for changes
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

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

  const exportConfig = async () => {
    try {
      const response = await api.get('/admin/settings/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `solo-leveling-config-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Configuration exported successfully!');
    } catch (error) {
      console.error('Error exporting config:', error);
      toast.error('Failed to export configuration');
    }
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        const response = await api.post('/admin/settings/import', { config });
        if (response.data.success) {
          await fetchSettings();
          toast.success('Configuration imported successfully!');
        }
      } catch (error) {
        console.error('Error importing config:', error);
        toast.error('Failed to import configuration');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof Settings],
        [key]: {
          ...prev[category as keyof Settings][key],
          value
        }
      }
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  // Helper function to format setting names
  const formatSettingName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get tab descriptions
  const getTabDescription = (tabId: string) => {
    const descriptions = {
      quest_system: 'Configure daily and weekly quest generation, rewards, and difficulty settings',
      level_progression: 'Manage experience points, level requirements, and progression rewards',
      security: 'Authentication, authorization, and security-related configurations',
      platform: 'User interface, themes, and platform-wide settings',
      monitoring: 'System performance tracking, analytics, and error reporting',
      feature_flags: 'Enable or disable features across the platform',
      coach_system: 'Coach-student relationships, verification, and management settings'
    };
    return descriptions[tabId as keyof typeof descriptions] || 'System configuration options';
  };

  // Function to render settings sections
  const renderSettingsSection = (section: string) => {
    // Special sections
    if (section === 'monitoring') {
      return <SystemMonitoring />;
    }
    
    if (section === 'feature_flags') {
      return <FeatureFlags />;
    }

    // Regular settings sections
    const sectionSettings = settings[section as keyof Settings] || {};
    
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
        {Object.entries(sectionSettings).map(([key, setting]) => 
          renderSettingItem(section, key, setting)
        )}
      </div>
    );
  };

  // Function to render individual setting items
  const renderSettingItem = (category: string, key: string, setting: SettingValue) => {
    const displayName = formatSettingName(key);
    
    return (
      <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="text-white font-medium">{displayName}</h4>
            <p className="text-gray-400 text-sm mt-1">{setting.description}</p>
          </div>
          {renderSettingStatus(setting.value, setting.type)}
        </div>
        
        <div className="mt-4">
          {renderSettingControl(category, key, setting)}
        </div>
      </div>
    );
  };

  const renderSettingStatus = (value: any, type: string) => {
    if (type === 'boolean') {
      return value ? (
        <CheckCircle className="w-5 h-5 text-green-400" />
      ) : (
        <Clock className="w-5 h-5 text-gray-500" />
      );
    }
    return null;
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
            value={value}
            onChange={(e) => updateSetting(category, key, type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        );

      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateSetting(category, key, e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
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

  // Enhanced tabs with more sections
  const tabs = [
    { id: 'quest_system', label: 'Quest System', icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
    { id: 'level_progression', label: 'Level & Progression', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { id: 'security', label: 'Security & Auth', icon: Shield, color: 'from-red-500 to-pink-500' },
    { id: 'platform', label: 'Platform', icon: Palette, color: 'from-blue-500 to-cyan-500' },
    { id: 'monitoring', label: 'System Monitoring', icon: BarChart3, color: 'from-green-500 to-teal-500' },
    { id: 'feature_flags', label: 'Feature Flags', icon: Flag, color: 'from-indigo-500 to-purple-500' },
    { id: 'coach_system', label: 'Coach System', icon: Database, color: 'from-cyan-500 to-blue-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Admin Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-2000 ${
              currentBg === index ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Navbar */}
      <div className="relative z-10">
        <Navbar user={user} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        {/* Header */}
        <div className="bg-black/60 backdrop-blur-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-8 h-8 text-purple-400" />
                    <h1 className="text-3xl font-bold text-white">System Settings</h1>
                  </div>
                  <p className="text-gray-400">
                    Configure and manage system-wide settings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">System Online</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Enhanced Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4">
                <h3 className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-4">
                  Settings Categories
                </h3>
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          activeTab === tab.id
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

              {/* Quick Stats */}
              <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4 mt-4">
                <h4 className="text-white font-medium mb-3">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Active Settings</span>
                    <span className="text-white font-semibold">
                      {Object.values(settings).reduce((count, section) => count + Object.keys(section).length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Categories</span>
                    <span className="text-purple-400 font-semibold">{tabs.length}</span>
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

            {/* Main Content */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-xl overflow-hidden">
                {/* Content Header */}
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {tabs.find(t => t.id === activeTab)?.label}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {getTabDescription(activeTab)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="p-6">
                  {renderSettingsSection(activeTab)}
                </div>

                {/* Action Buttons - Only show for regular settings tabs */}
                {!['monitoring', 'feature_flags'].includes(activeTab) && (
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
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={exportConfig}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        
                        <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-all">
                          <Upload className="w-4 h-4" />
                          Import
                          <input
                            type="file"
                            accept=".json"
                            onChange={importConfig}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .glass {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(147, 51, 234, 0.2);
        }
      `}</style>
    </div>
  );
}