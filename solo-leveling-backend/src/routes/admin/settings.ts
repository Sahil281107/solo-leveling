import express from 'express';
import pool from '../../config/database';
import { authenticate, requireAdmin, type AuthRequest } from '../../middleware/auth';
import { logAdminAction } from '../../middleware/adminLogger';

const router = express.Router();

// Middleware to ensure admin access
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/settings - Get all system settings
router.get('/', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [settings]: any = await connection.execute(
      'SELECT * FROM system_settings ORDER BY setting_key'
    );

    // Categorize settings
    const categorizedSettings: any = {
      quest_system: {},
      level_progression: {},
      security: {},
      platform: {},
      monitoring: {},
      coach_system: {}
    };

    settings.forEach((setting: any) => {
      const key = setting.setting_key;
      let value = setting.setting_value;

      // Parse value based on type
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.setting_value;
        }
      }

      // Categorize the setting
      let category = 'platform';
      if (key.includes('quest') || key.includes('xp') || key.includes('streak')) {
        category = 'quest_system';
      } else if (key.includes('level') || key.includes('prestige') || key.includes('title')) {
        category = 'level_progression';
      } else if (key.includes('login') || key.includes('session') || key.includes('password') || key.includes('ip') || key.includes('two_factor')) {
        category = 'security';
      } else if (key.includes('theme') || key.includes('welcome') || key.includes('maintenance') || key.includes('logo') || key.includes('notification') || key.includes('background')) {
        category = 'platform';
      } else if (key.includes('monitoring') || key.includes('analytics') || key.includes('error') || key.includes('performance') || key.includes('retention') || key.includes('ab_testing')) {
        category = 'monitoring';
      } else if (key.includes('coach')) {
        category = 'coach_system';
      }

      categorizedSettings[category][key] = {
        value,
        type: setting.setting_type,
        description: setting.description
      };
    });

    res.json({
      success: true,
      settings: categorizedSettings
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  } finally {
    connection.release();
  }
});

// PUT /api/admin/settings - Update system settings
router.put('/', logAdminAction('settings_update'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid settings data'
      });
    }

    const updatePromises: Promise<any>[] = [];

    // Process each category of settings
    Object.entries(settings).forEach(([category, categorySettings]) => {
      Object.entries(categorySettings as any).forEach(([key, settingData]: [string, any]) => {
        let value = settingData.value;

        // Convert value to string for database storage
        if (typeof value === 'boolean') {
          value = value.toString();
        } else if (typeof value === 'number') {
          value = value.toString();
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        updatePromises.push(
          connection.execute(
            `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value), 
             updated_at = CURRENT_TIMESTAMP`,
            [
              key,
              value,
              settingData.type || 'string',
              settingData.description || ''
            ]
          )
        );
      });
    });

    await Promise.all(updatePromises);

    // Log the admin action
    await connection.execute(
      'INSERT INTO admin_action_logs (admin_user_id, action_type, target_type, action_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user?.user_id,
        'settings_bulk_update',
        'system_settings',
        JSON.stringify({
          updated_settings: Object.keys(settings).map(category => 
            Object.keys((settings as any)[category])
          ).flat(),
          timestamp: new Date().toISOString()
        }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  } finally {
    connection.release();
  }
});

// POST /api/admin/settings/reset - Reset to default values
router.post('/reset', logAdminAction('settings_reset'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const defaultSettings = {
      daily_quest_count: '8',
      weekly_quest_count: '3',
      level_multiplier: '1.5',
      streak_bonus_xp: '50',
      streak_bonus_enabled: 'true',
      quest_refresh_hour: '0',
      auto_generate_quests: 'true',
      base_xp_per_level: '100',
      max_level_cap: '100',
      title_unlocks_enabled: 'true',
      prestige_system_enabled: 'false',
      max_login_attempts: '5',
      session_lifetime_days: '7',
      two_factor_enabled: 'false',
      ip_whitelist_enabled: 'false',
      password_min_length: '8',
      password_require_special: 'true',
      password_require_numbers: 'true',
      password_require_uppercase: 'false',
      default_theme: 'dark',
      welcome_message: 'Welcome to Solo Leveling Life!',
      maintenance_mode: 'false',
      notification_email_enabled: 'true',
      performance_monitoring_enabled: 'true',
      error_tracking_enabled: 'true',
      analytics_enabled: 'true',
      user_retention_tracking: 'true',
      ab_testing_enabled: 'false'
    };

    await connection.beginTransaction();

    const updatePromises = Object.entries(defaultSettings).map(([key, value]) =>
      connection.execute(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
         VALUES (?, ?, 'string', 'Default system setting') 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value), 
         updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      )
    );

    await Promise.all(updatePromises);

    // Log the admin action
    await connection.execute(
      'INSERT INTO admin_action_logs (admin_user_id, action_type, target_type, action_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user?.user_id,
        'settings_reset',
        'system_settings',
        JSON.stringify({
          action: 'Reset all settings to defaults',
          timestamp: new Date().toISOString()
        }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Settings reset to defaults successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  } finally {
    connection.release();
  }
});

// GET /api/admin/settings/export - Export current configuration
router.get('/export', logAdminAction('settings_export'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [settings]: any = await connection.execute('SELECT * FROM system_settings');
    const [featureFlags]: any = await connection.execute('SELECT * FROM feature_flags');
    const [ipWhitelist]: any = await connection.execute('SELECT * FROM admin_ip_whitelist WHERE is_active = true');

    const exportData = {
      exported_at: new Date().toISOString(),
      exported_by: req.user?.user_id,
      version: '1.0',
      settings: settings.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = {
          value: setting.setting_value,
          type: setting.setting_type,
          description: setting.description
        };
        return acc;
      }, {}),
      feature_flags: featureFlags,
      ip_whitelist: ipWhitelist.map((ip: any) => ({
        ip_address: ip.ip_address,
        ip_range: ip.ip_range,
        description: ip.description
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=solo-leveling-config-${Date.now()}.json`);
    res.json(exportData);

  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export configuration'
    });
  } finally {
    connection.release();
  }
});

// POST /api/admin/settings/import - Import configuration
router.post('/import', logAdminAction('settings_import'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { config } = req.body;

    if (!config || !config.settings) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    const updatePromises = Object.entries(config.settings).map(([key, data]: [string, any]) =>
      connection.execute(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value), 
         updated_at = CURRENT_TIMESTAMP`,
        [key, data.value, data.type, data.description || '']
      )
    );

    await Promise.all(updatePromises);

    // Log the admin action
    await connection.execute(
      'INSERT INTO admin_action_logs (admin_user_id, action_type, target_type, action_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user?.user_id,
        'settings_import',
        'system_settings',
        JSON.stringify({
          imported_from: config.exported_at || 'Unknown',
          settings_count: Object.keys(config.settings).length,
          timestamp: new Date().toISOString()
        }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Configuration imported successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error importing settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import configuration'
    });
  } finally {
    connection.release();
  }
});

// Feature Flags endpoints
router.get('/feature-flags', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [flags]: any = await connection.execute(
      'SELECT * FROM feature_flags ORDER BY flag_name'
    );

    res.json({
      success: true,
      flags
    });

  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags'
    });
  } finally {
    connection.release();
  }
});

router.post('/feature-flags', logAdminAction('feature_flag_create'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { flag_key, flag_name, description, is_enabled, rollout_percentage } = req.body;

    const [result]: any = await connection.execute(
      `INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [flag_key, flag_name, description || '', is_enabled || false, rollout_percentage || 0, req.user?.user_id]
    );

    res.json({
      success: true,
      flag: { flag_id: result.insertId, flag_key, flag_name, description, is_enabled, rollout_percentage }
    });

  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feature flag'
    });
  } finally {
    connection.release();
  }
});

router.put('/feature-flags/:flag_id', logAdminAction('feature_flag_update'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { flag_id } = req.params;
    const { flag_name, description, is_enabled, rollout_percentage } = req.body;

    await connection.execute(
      `UPDATE feature_flags 
       SET flag_name = ?, description = ?, is_enabled = ?, rollout_percentage = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE flag_id = ?`,
      [flag_name, description, is_enabled, rollout_percentage, flag_id]
    );

    res.json({
      success: true,
      message: 'Feature flag updated successfully'
    });

  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag'
    });
  } finally {
    connection.release();
  }
});

router.delete('/feature-flags/:flag_id', logAdminAction('feature_flag_delete'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { flag_id } = req.params;

    await connection.execute('DELETE FROM feature_flags WHERE flag_id = ?', [flag_id]);

    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature flag'
    });
  } finally {
    connection.release();
  }
});

// IP Whitelist endpoints
router.get('/ip-whitelist', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [whitelist]: any = await connection.execute(
      'SELECT * FROM admin_ip_whitelist ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      whitelist
    });

  } catch (error) {
    console.error('Error fetching IP whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch IP whitelist'
    });
  } finally {
    connection.release();
  }
});

router.post('/ip-whitelist', logAdminAction('ip_whitelist_add'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { ip_address, ip_range, description } = req.body;

    const [result]: any = await connection.execute(
      `INSERT INTO admin_ip_whitelist (ip_address, ip_range, description, created_by) 
       VALUES (?, ?, ?, ?)`,
      [ip_address, ip_range || null, description || '', req.user?.user_id]
    );

    res.json({
      success: true,
      entry: { whitelist_id: result.insertId, ip_address, ip_range, description }
    });

  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add IP to whitelist'
    });
  } finally {
    connection.release();
  }
});

router.delete('/ip-whitelist/:whitelist_id', logAdminAction('ip_whitelist_remove'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { whitelist_id } = req.params;

    await connection.execute('DELETE FROM admin_ip_whitelist WHERE whitelist_id = ?', [whitelist_id]);

    res.json({
      success: true,
      message: 'IP removed from whitelist successfully'
    });

  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove IP from whitelist'
    });
  } finally {
    connection.release();
  }
});

// System Health endpoint
router.get('/system-health', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get recent errors
    const [recentErrors]: any = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM system_error_logs 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) AND resolved = false`
    );

    // Get performance metrics
    const [performanceMetrics]: any = await connection.execute(
      `SELECT * FROM system_performance_logs 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) 
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    // Calculate average response time
    const avgResponseTime = performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum: number, p: any) => sum + p.response_time_ms, 0) / performanceMetrics.length
      : 0;

    // Get active users
    const [activeUsers]: any = await connection.execute(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM user_analytics 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    // Get error counts by level
    const [errorCounts]: any = await connection.execute(
      `SELECT error_level, COUNT(*) as count 
       FROM system_error_logs 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) 
       GROUP BY error_level`
    );

    res.json({
      success: true,
      health: {
        database: recentErrors[0]?.count > 10 ? 'unhealthy' : 'healthy',
        average_response_time: Math.round(avgResponseTime),
        active_users: activeUsers[0]?.count || 0,
        error_counts: errorCounts.reduce((acc: any, error: any) => {
          acc[error.error_level] = error.count;
          return acc;
        }, {}),
        performance_metrics: performanceMetrics.slice(0, 100),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health',
      health: {
        database: 'unhealthy',
        average_response_time: -1,
        active_users: 0,
        error_counts: {},
        performance_metrics: [],
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    connection.release();
  }
});

// Analytics endpoint
router.get('/analytics', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { timeframe = '7d' } = req.query;
    
    let interval: string;
    switch (timeframe) {
      case '24h':
        interval = '24 HOUR';
        break;
      case '30d':
        interval = '30 DAY';
        break;
      default:
        interval = '7 DAY';
    }

    // User activity
    const [userActivity]: any = await connection.execute(
      `SELECT 
        DATE(created_at) as date, 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_events
       FROM user_analytics 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL ${interval})
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Quest completions
    const [questStats]: any = await connection.execute(
      `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completions,
        SUM(xp_reward) as total_xp
       FROM quest_history 
       WHERE completed_at > DATE_SUB(NOW(), INTERVAL ${interval}) AND status = 'completed'
       GROUP BY DATE(completed_at)
       ORDER BY date DESC`
    );

    // Error trends
    const [errorTrends]: any = await connection.execute(
      `SELECT 
        DATE(created_at) as date,
        error_level,
        COUNT(*) as count
       FROM system_error_logs 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL ${interval})
       GROUP BY DATE(created_at), error_level
       ORDER BY date DESC`
    );

    res.json({
      success: true,
      analytics: {
        user_activity: userActivity,
        quest_stats: questStats,
        error_trends: errorTrends,
        timeframe
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  } finally {
    connection.release();
  }
});

export default router;