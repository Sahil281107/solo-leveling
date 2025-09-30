// File: backend/middleware/adminLogger.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from './auth';

/**
 * Middleware to log admin actions
 * @param actionType - Type of action being performed
 * @returns Express middleware function
 */
export const logAdminAction = (actionType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Use res.on('finish') instead of overriding res.end
    res.on('finish', async () => {
      // Only log successful requests
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const connection = await pool.getConnection();
        
        try {
          const actionDetails = {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined,
            query: req.query,
            status_code: res.statusCode,
            timestamp: new Date().toISOString()
          };

          // Remove sensitive data from logging
          if (actionDetails.body) {
            const sanitizedBody = { ...actionDetails.body };
            delete sanitizedBody.password;
            delete sanitizedBody.password_hash;
            delete sanitizedBody.token;
            actionDetails.body = sanitizedBody;
          }

          await connection.execute(
            'INSERT INTO admin_action_logs (admin_user_id, action_type, target_type, action_details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [
              req.user?.user_id || null,
              actionType,
              'system_settings',
              JSON.stringify(actionDetails),
              req.ip || req.connection.remoteAddress,
              req.get('User-Agent') || 'Unknown'
            ]
          );

          // Also update the admin profile's last action
          if (req.user?.user_id) {
            await connection.execute(
              'UPDATE admin_profiles SET last_action = ?, last_action_date = CURRENT_TIMESTAMP WHERE user_id = ?',
              [actionType, req.user.user_id]
            );
          }
        } catch (error) {
          console.error('Failed to log admin action:', error);
        } finally {
          connection.release();
        }
      }
    });

    next();
  };
};

/**
 * Enhanced error logging function
 */
export const logSystemError = async (error: any, req?: Request, user_id?: number) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(
      'INSERT INTO system_error_logs (error_level, error_message, error_stack, endpoint, method, user_id, request_data, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        error.severity || 'error',
        error.message || 'Unknown error',
        error.stack || null,
        req?.path || null,
        req?.method || null,
        user_id,
        req ? JSON.stringify({
          body: req.body,
          query: req.query,
          params: req.params
        }) : null,
        req?.ip || null,
        req?.get('User-Agent') || null
      ]
    );
  } catch (logError) {
    console.error('Failed to log system error:', logError);
  } finally {
    connection.release();
  }
};

/**
 * Analytics event logger
 */
export const logUserAnalytics = async (
  userId: number | null, 
  sessionId: string | null, 
  eventType: string, 
  eventData: any = {}, 
  req?: Request
) => {
  const connection = await pool.getConnection();
  
  try {
    // Check if analytics is enabled
    const [analyticsEnabled]: any = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['user_analytics_enabled']
    );

    if (analyticsEnabled.length > 0 && analyticsEnabled[0].setting_value === 'true') {
      await connection.execute(
        'INSERT INTO user_analytics (user_id, session_id, event_type, event_data, page_url, referrer, device_info, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          sessionId,
          eventType,
          JSON.stringify(eventData),
          req?.originalUrl || null,
          req?.get('Referrer') || null,
          req ? JSON.stringify({
            user_agent: req.get('User-Agent'),
            accept_language: req.get('Accept-Language'),
            accept_encoding: req.get('Accept-Encoding')
          }) : null,
          req?.ip || null
        ]
      );
    }
  } catch (error) {
    console.error('Failed to log user analytics:', error);
  } finally {
    connection.release();
  }
};

/**
 * Performance monitoring middleware - simplified version
 */
export const performanceMonitor = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Use res.on('finish') to capture response time
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    // Log performance if monitoring is enabled
    const connection = await pool.getConnection();
    
    try {
      const [monitoringEnabled]: any = await connection.execute(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?',
        ['performance_monitoring_enabled']
      );

      if (monitoringEnabled.length > 0 && monitoringEnabled[0].setting_value === 'true') {
        const [threshold]: any = await connection.execute(
          'SELECT setting_value FROM system_settings WHERE setting_key = ?',
          ['performance_alert_threshold']
        );

        const alertThreshold = threshold.length > 0 ? parseInt(threshold[0].setting_value) : 500;

        // Always log performance data
        await connection.execute(
          'INSERT INTO performance_logs (endpoint, method, response_time_ms, status_code, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            req.path,
            req.method,
            responseTime,
            res.statusCode,
            (req as AuthRequest).user?.user_id || null,
            req.ip,
            req.get('User-Agent')
          ]
        );

        // Log as error if response time is too high
        if (responseTime > alertThreshold) {
          await logSystemError({
            message: `Slow response detected: ${responseTime}ms for ${req.method} ${req.path}`,
            severity: 'warn'
          }, req, (req as AuthRequest).user?.user_id);
        }
      }
    } catch (error) {
      console.error('Performance monitoring error:', error);
    } finally {
      connection.release();
    }
  });

  next();
};

/**
 * Data cleanup utility
 */
export const cleanupOldData = async () => {
  const connection = await pool.getConnection();
  
  try {
    const [retentionSetting]: any = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['data_retention_days']
    );

    const retentionDays = retentionSetting.length > 0 ? parseInt(retentionSetting[0].setting_value) : 90;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Clean up old performance logs
    await connection.execute(
      'DELETE FROM performance_logs WHERE created_at < ?',
      [cutoffDate]
    );

    // Clean up old analytics data
    await connection.execute(
      'DELETE FROM user_analytics WHERE created_at < ?',
      [cutoffDate]
    );

    // Clean up resolved error logs older than retention period
    await connection.execute(
      'DELETE FROM system_error_logs WHERE created_at < ? AND resolved = true',
      [cutoffDate]
    );

    console.log(`Data cleanup completed. Removed data older than ${retentionDays} days.`);

  } catch (error) {
    console.error('Data cleanup error:', error);
  } finally {
    connection.release();
  }
};

/**
 * Feature flag checker
 */
export const checkFeatureFlag = async (flagKey: string, userId?: number, userType?: string): Promise<boolean> => {
  const connection = await pool.getConnection();
  
  try {
    const [flag]: any = await connection.execute(
      'SELECT * FROM feature_flags WHERE flag_key = ?',
      [flagKey]
    );

    if (flag.length === 0 || !flag[0].is_enabled) {
      return false;
    }

    const flagData = flag[0];

    // Check rollout percentage
    if (flagData.rollout_percentage < 100) {
      const userHash = userId ? 
        userId.toString().split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0) : Math.random() * 100;
      
      if (Math.abs(userHash) % 100 >= flagData.rollout_percentage) {
        return false;
      }
    }

    // Check user type targeting
    if (flagData.target_user_types && userType) {
      let targetTypes: string[];
      try {
        targetTypes = Array.isArray(flagData.target_user_types) 
          ? flagData.target_user_types 
          : JSON.parse(flagData.target_user_types);
      } catch {
        targetTypes = [];
      }
      
      if (targetTypes.length > 0 && !targetTypes.includes(userType)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Feature flag check error:', error);
    return false;
  } finally {
    connection.release();
  }
};