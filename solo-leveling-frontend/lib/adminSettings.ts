// File: frontend/lib/adminSettings.ts
import api from './api';

export interface SettingValue {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
}

export interface Settings {
  quest_system: Record<string, SettingValue>;
  level_progression: Record<string, SettingValue>;
  security: Record<string, SettingValue>;
  platform: Record<string, SettingValue>;
  monitoring: Record<string, SettingValue>;
  coach_system: Record<string, SettingValue>;
}

export interface FeatureFlag {
  flag_id: number;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_user_types?: string[];
  conditions?: any;
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator?: {
    username: string;
    full_name: string;
  };
}

export interface IPWhitelistEntry {
  whitelist_id: number;
  ip_address: string;
  ip_range?: string;
  description?: string;
  created_by?: number;
  created_at: string;
  is_active: boolean;
  creator?: {
    username: string;
  };
}

export interface SystemHealth {
  database: 'healthy' | 'unhealthy';
  average_response_time: number;
  active_users: number;
  error_counts: Record<string, number>;
  performance_metrics: Array<{
    log_id: number;
    endpoint: string;
    method: string;
    response_time_ms: number;
    status_code: number;
    created_at: string;
  }>;
  timestamp: string;
}

export interface AnalyticsData {
  timeframe: string;
  unique_users: number;
  total_events: number;
  event_counts: Record<string, number>;
  page_views_by_day: Record<string, number>;
  recent_events: Array<{
    analytics_id: number;
    user_id?: number;
    session_id?: string;
    event_type: string;
    event_data?: any;
    page_url?: string;
    created_at: string;
  }>;
}

class AdminSettingsAPI {
  // Settings Management
  async getSettings(): Promise<Settings> {
    const response = await api.get('/admin/settings');
    return response.data.settings;
  }

  async updateSettings(settings: Settings): Promise<void> {
    await api.put('/admin/settings', { settings });
  }

  async resetSettings(): Promise<void> {
    await api.post('/admin/settings/reset');
  }

  async exportConfiguration(): Promise<Blob> {
    const response = await api.get('/admin/settings/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importConfiguration(config: any): Promise<void> {
    await api.post('/admin/settings/import', { config });
  }

  // Feature Flags Management
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await api.get('/admin/settings/feature-flags');
    return response.data.flags;
  }

  async createFeatureFlag(flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await api.post('/admin/settings/feature-flags', flagData);
    return response.data.flag;
  }

  async updateFeatureFlag(flagId: number, flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await api.put(`/admin/settings/feature-flags/${flagId}`, flagData);
    return response.data.flag;
  }

  async deleteFeatureFlag(flagId: number): Promise<void> {
    await api.delete(`/admin/settings/feature-flags/${flagId}`);
  }

  // IP Whitelist Management
  async getIPWhitelist(): Promise<IPWhitelistEntry[]> {
    const response = await api.get('/admin/settings/ip-whitelist');
    return response.data.whitelist;
  }

  async addIPToWhitelist(ipData: {
    ip_address: string;
    ip_range?: string;
    description?: string;
  }): Promise<IPWhitelistEntry> {
    const response = await api.post('/admin/settings/ip-whitelist', ipData);
    return response.data.entry;
  }

  async removeIPFromWhitelist(whitelistId: number): Promise<void> {
    await api.delete(`/admin/settings/ip-whitelist/${whitelistId}`);
  }

  // System Monitoring
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get('/admin/settings/system-health');
    return response.data.health;
  }

  async getAnalytics(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<AnalyticsData> {
    const response = await api.get(`/admin/settings/analytics?timeframe=${timeframe}`);
    return response.data.analytics;
  }

  // Utility functions for settings formatting
  formatSettingName(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Xp/g, 'XP')
      .replace(/Ai/g, 'AI')
      .replace(/Ip/g, 'IP')
      .replace(/2fa/g, '2FA');
  }

  getSettingCategory(key: string): string {
    if (key.includes('quest') || key.includes('xp') || key.includes('streak')) {
      return 'quest_system';
    } else if (key.includes('level') || key.includes('prestige') || key.includes('title')) {
      return 'level_progression';
    } else if (key.includes('login') || key.includes('session') || key.includes('password') || key.includes('ip') || key.includes('two_factor')) {
      return 'security';
    } else if (key.includes('theme') || key.includes('welcome') || key.includes('maintenance') || key.includes('logo') || key.includes('notification') || key.includes('background')) {
      return 'platform';
    } else if (key.includes('monitoring') || key.includes('analytics') || key.includes('error') || key.includes('performance') || key.includes('retention') || key.includes('ab_testing')) {
      return 'monitoring';
    } else if (key.includes('coach')) {
      return 'coach_system';
    }
    return 'platform';
  }

  validateIPAddress(ip: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  validateCIDR(cidr: string): boolean {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(cidr)) return false;

    const [ip, prefix] = cidr.split('/');
    const prefixNum = parseInt(prefix, 10);
    
    return this.validateIPAddress(ip) && prefixNum >= 0 && prefixNum <= 32;
  }

  parseSettingValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  stringifySettingValue(value: any, type: string): string {
    switch (type) {
      case 'boolean':
        return value.toString();
      case 'number':
        return value.toString();
      case 'json':
        return JSON.stringify(value);
      default:
        return value;
    }
  }

  getDefaultValue(key: string, type: string): any {
    const defaults: Record<string, any> = {
      // Quest System
      daily_quest_count: 8,
      weekly_quest_count: 3,
      level_multiplier: 1.5,
      streak_bonus_xp: 50,
      streak_bonus_enabled: true,
      quest_refresh_hour: 0,
      auto_generate_quests: true,
      ai_quest_model: 'gpt-4-turbo',

      // Level & Progression
      base_xp_per_level: 100,
      max_level_cap: 100,
      title_unlocks_enabled: true,
      prestige_system_enabled: false,
      prestige_unlock_level: 50,

      // Security
      max_login_attempts: 5,
      login_rate_limit_window: 900,
      session_lifetime_days: 7,
      two_factor_enabled: false,
      two_factor_method: 'google_auth',
      ip_whitelist_enabled: false,
      password_min_length: 8,
      password_require_special: true,
      password_require_numbers: true,
      password_require_uppercase: false,

      // Platform
      default_theme: 'dark',
      background_animation_enabled: true,
      background_animation_speed: 5,
      notification_sounds_enabled: true,
      welcome_message: 'Welcome to Solo Leveling! Start your journey to become stronger by completing daily quests and leveling up your skills.',
      maintenance_mode_enabled: false,
      maintenance_message: 'System maintenance in progress. Please check back soon.',
      custom_logo_url: '',
      custom_favicon_url: '',

      // Monitoring
      performance_monitoring_enabled: true,
      performance_alert_threshold: 500,
      user_analytics_enabled: true,
      analytics_track_pageviews: true,
      analytics_track_quest_completion: true,
      analytics_track_device_info: false,
      error_reporting_enabled: true,
      error_reporting_level: 'all',
      data_retention_days: 90,
      ab_testing_enabled: false,

      // Coach System
      max_coach_students: 20,
      coach_auto_approval: false,
      coach_verification_required: true
    };

    return defaults[key] ?? (type === 'boolean' ? false : type === 'number' ? 0 : '');
  }

  getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
      // Quest System
      daily_quest_count: 'Number of daily quests assigned to each user',
      weekly_quest_count: 'Number of weekly quests assigned to each user',
      level_multiplier: 'Experience multiplier increase for each level',
      streak_bonus_xp: 'Bonus XP awarded for maintaining daily streaks',
      streak_bonus_enabled: 'Enable the streak bonus system',
      quest_refresh_hour: 'Hour of day when daily quests refresh (24-hour format)',
      auto_generate_quests: 'Enable AI-powered quest generation',
      ai_quest_model: 'AI model used for quest generation',

      // Level & Progression
      base_xp_per_level: 'Base experience points required for first level',
      max_level_cap: 'Maximum achievable level (0 = unlimited)',
      title_unlocks_enabled: 'Enable automatic title unlocks at specific levels',
      prestige_system_enabled: 'Enable prestige system for level resets',
      prestige_unlock_level: 'Level required to unlock prestige system',

      // Security
      max_login_attempts: 'Maximum failed login attempts before rate limiting',
      login_rate_limit_window: 'Rate limit window in seconds',
      session_lifetime_days: 'Number of days before user sessions expire',
      two_factor_enabled: 'Require 2FA for admin accounts',
      two_factor_method: '2FA method: Google Authenticator, SMS, or Email',
      ip_whitelist_enabled: 'Restrict admin access to specific IP addresses',
      password_min_length: 'Minimum required password length',
      password_require_special: 'Require special characters in passwords',
      password_require_numbers: 'Require numbers in passwords',
      password_require_uppercase: 'Require uppercase letters in passwords',

      // Platform
      default_theme: 'Default theme for new users',
      background_animation_enabled: 'Enable animated backgrounds on dashboard',
      background_animation_speed: 'Speed of background animations (1-10 scale)',
      notification_sounds_enabled: 'Enable sound effects for notifications',
      welcome_message: 'Welcome message displayed to new users',
      maintenance_mode_enabled: 'Enable maintenance mode for system updates',
      maintenance_message: 'Message displayed during maintenance mode',
      custom_logo_url: 'URL for custom logo image',
      custom_favicon_url: 'URL for custom favicon image',

      // Monitoring
      performance_monitoring_enabled: 'Track API response times and performance',
      performance_alert_threshold: 'Response time threshold for alerts (milliseconds)',
      user_analytics_enabled: 'Collect anonymized user behavior data',
      analytics_track_pageviews: 'Track user page views',
      analytics_track_quest_completion: 'Track quest completion rates',
      analytics_track_device_info: 'Track user device information',
      error_reporting_enabled: 'Enable automatic error logging and reporting',
      error_reporting_level: 'Level of errors to report: all, critical, or custom',
      data_retention_days: 'How long to keep analytics and log data (days)',
      ab_testing_enabled: 'Enable A/B testing feature flags',

      // Coach System
      max_coach_students: 'Maximum number of students per coach',
      coach_auto_approval: 'Automatically approve coach applications',
      coach_verification_required: 'Require manual verification for coaches'
    };

    return descriptions[key] || 'System setting';
  }
}

export const adminSettingsAPI = new AdminSettingsAPI();
export default adminSettingsAPI;