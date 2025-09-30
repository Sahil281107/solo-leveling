// File: backend/routes/admin/settings.ts
import express from 'express';
import pool from '../../config/database';
import { authenticate, authorizeRole, type AuthRequest } from '../../middleware/auth';
import { logAdminAction } from '../../middleware/adminLogger';

const router = express.Router();

// Middleware to ensure admin access - USE authorizeRole instead of requireAdmin
router.use(authenticate);
router.use(authorizeRole(['admin'])); // This is the correct way to authorize admin access

// GET /api/admin/settings - Get all system settings
router.get('/', logAdminAction('view_system_settings'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Fetch all system settings grouped by category
    const [settings]: any = await connection.execute(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        category,
        description,
        is_encrypted,
        created_at,
        updated_at,
        updated_by
      FROM system_settings 
      ORDER BY category, setting_key
    `);

    // Group settings by category
    const groupedSettings: any = {};
    
    settings.forEach((setting: any) => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {};
      }
      
      // Parse the setting value based on its type
      let parsedValue = setting.setting_value;
      try {
        if (setting.setting_type === 'json') {
          parsedValue = JSON.parse(setting.setting_value);
        } else if (setting.setting_type === 'boolean') {
          parsedValue = setting.setting_value === 'true';
        } else if (setting.setting_type === 'number') {
          parsedValue = parseFloat(setting.setting_value);
        } else if (setting.setting_type === 'integer') {
          parsedValue = parseInt(setting.setting_value);
        }
      } catch (parseError) {
        console.warn(`Failed to parse setting ${setting.setting_key}:`, parseError);
        parsedValue = setting.setting_value; // Keep original value if parsing fails
      }
      
      groupedSettings[setting.category][setting.setting_key] = {
        value: parsedValue,
        type: setting.setting_type,
        description: setting.description,
        is_encrypted: setting.is_encrypted,
        updated_at: setting.updated_at,
        updated_by: setting.updated_by
      };
    });

    res.json({
      success: true,
      settings: groupedSettings,
      categories: Object.keys(groupedSettings)
    });
    
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system settings',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// PUT /api/admin/settings - Update system settings
router.put('/', logAdminAction('update_system_settings'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Settings object is required'
      });
    }

    // Start transaction
    await connection.beginTransaction();
    
    const updatedSettings = [];
    const errors = [];
    
    // Process each category and its settings
    for (const [category, categorySettings] of Object.entries(settings)) {
      if (typeof categorySettings !== 'object' || categorySettings === null) {
        continue;
      }
      
      for (const [settingKey, settingData] of Object.entries(categorySettings as any)) {
        try {
          const { value, type } = settingData as any;
          
          // Validate and serialize the value based on its type
          let serializedValue = value;
          if (type === 'json') {
            serializedValue = JSON.stringify(value);
          } else if (type === 'boolean') {
            serializedValue = value ? 'true' : 'false';
          } else {
            serializedValue = String(value);
          }
          
          // Update the setting in database
          const [result]: any = await connection.execute(`
            UPDATE system_settings 
            SET 
              setting_value = ?,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = ?
            WHERE setting_key = ? AND category = ?
          `, [serializedValue, req.user?.user_id || null, settingKey, category]);
          
          if (result.affectedRows > 0) {
            updatedSettings.push({
              category,
              key: settingKey,
              value: value,
              type: type
            });
          } else {
            errors.push({
              category,
              key: settingKey,
              error: 'Setting not found or no changes made'
            });
          }
          
        } catch (settingError: any) {
          errors.push({
            category,
            key: settingKey,
            error: settingError.message
          });
        }
      }
    }
    
    // Commit transaction if we have successful updates
    if (updatedSettings.length > 0 && errors.length === 0) {
      await connection.commit();
      
      res.json({
        success: true,
        message: `Successfully updated ${updatedSettings.length} settings`,
        updated_settings: updatedSettings
      });
    } else if (updatedSettings.length > 0 && errors.length > 0) {
      await connection.commit();
      
      res.status(207).json({
        success: true,
        message: `Partially updated ${updatedSettings.length} settings with ${errors.length} errors`,
        updated_settings: updatedSettings,
        errors: errors
      });
    } else {
      await connection.rollback();
      
      res.status(400).json({
        success: false,
        error: 'No settings were updated',
        errors: errors
      });
    }
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/admin/settings/reset - Reset settings to defaults
router.post('/reset', logAdminAction('reset_system_settings'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { category } = req.body;
    
    let resetQuery = `
      UPDATE system_settings 
      SET 
        setting_value = default_value,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
    `;
    
    const queryParams = [req.user?.user_id || null];
    
    if (category) {
      resetQuery += ' WHERE category = ?';
      queryParams.push(category);
    }
    
    const [result]: any = await connection.execute(resetQuery, queryParams);
    
    res.json({
      success: true,
      message: `Reset ${result.affectedRows} settings to default values`,
      affected_rows: result.affectedRows,
      category: category || 'all'
    });
    
  } catch (error: any) {
    console.error('Error resetting system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset system settings',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// GET /api/admin/settings/export - Export settings
router.get('/export', logAdminAction('export_system_settings'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [settings]: any = await connection.execute(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        category,
        description,
        default_value,
        is_encrypted
      FROM system_settings 
      ORDER BY category, setting_key
    `);
    
    const exportData = {
      exported_at: new Date().toISOString(),
      exported_by: req.user?.user_id,
      settings: settings
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="system_settings_${Date.now()}.json"`);
    res.json(exportData);
    
  } catch (error: any) {
    console.error('Error exporting system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export system settings',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/admin/settings/import - Import settings
router.post('/import', logAdminAction('import_system_settings'), async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { settings, overwrite = false } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: 'Settings array is required'
      });
    }
    
    await connection.beginTransaction();
    
    let imported = 0;
    let skipped = 0;
    let errors = [];
    
    for (const setting of settings) {
      try {
        const {
          setting_key,
          setting_value,
          setting_type,
          category,
          description
        } = setting;
        
        // Check if setting exists
        const [existing]: any = await connection.execute(
          'SELECT setting_key FROM system_settings WHERE setting_key = ? AND category = ?',
          [setting_key, category]
        );
        
        if (existing.length > 0 && !overwrite) {
          skipped++;
          continue;
        }
        
        // Insert or update setting
        if (existing.length > 0) {
          await connection.execute(`
            UPDATE system_settings 
            SET 
              setting_value = ?,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = ?
            WHERE setting_key = ? AND category = ?
          `, [setting_value, req.user?.user_id, setting_key, category]);
        } else {
          await connection.execute(`
            INSERT INTO system_settings 
            (setting_key, setting_value, setting_type, category, description, created_by, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            setting_key,
            setting_value,
            setting_type,
            category,
            description,
            req.user?.user_id,
            req.user?.user_id
          ]);
        }
        
        imported++;
        
      } catch (settingError: any) {
        errors.push({
          setting: setting.setting_key,
          error: settingError.message
        });
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    await connection.rollback();
    console.error('Error importing system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import system settings',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// GET /api/admin/settings/health - System health check
router.get('/health', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get recent error logs
    const [recentErrors]: any = await connection.execute(`
      SELECT COUNT(*) as error_count
      FROM system_error_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      AND error_level IN ('error', 'critical')
    `);
    
    // Get performance metrics
    const [performanceMetrics]: any = await connection.execute(`
      SELECT 
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(*) as request_count
      FROM system_performance_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTES)
    `);
    
    // Get active users count
    const [activeUsers]: any = await connection.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions 
      WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      AND is_active = true
    `);
    
    // Get error counts by level
    const [errorCounts]: any = await connection.execute(`
      SELECT 
        error_level,
        COUNT(*) as count
      FROM system_error_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY error_level
    `);
    
    // Get recent performance data
    const [recentPerformance]: any = await connection.execute(`
      SELECT 
        response_time_ms,
        endpoint,
        method,
        status_code,
        created_at
      FROM system_performance_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    const recentErrorCount = recentErrors[0]?.error_count || 0;
    const avgResponseTime = performanceMetrics[0]?.avg_response_time || 0;
    
    res.json({
      success: true,
      health: {
        database: recentErrorCount < 10 ? 'healthy' : 'unhealthy',
        average_response_time: Math.round(avgResponseTime),
        active_users: activeUsers[0]?.count || 0,
        error_counts: errorCounts.reduce((acc: any, error: any) => {
          acc[error.error_level] = error.count;
          return acc;
        }, {}),
        performance_metrics: recentPerformance.slice(0, 100), // Last 100 requests
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

export default router;