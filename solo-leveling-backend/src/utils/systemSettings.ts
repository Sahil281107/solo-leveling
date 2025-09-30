const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export class SystemSettingsUtil {
  static async getSetting(key, defaultValue = null) {
    try {
      const setting = await prisma.system_settings.findUnique({
        where: { setting_key: key }
      });

      if (!setting) return defaultValue;

      // Parse value based on type
      switch (setting.setting_type) {
        case 'number':
          return parseFloat(setting.setting_value);
        case 'boolean':
          return setting.setting_value === 'true';
        case 'json':
          try {
            return JSON.parse(setting.setting_value);
          } catch {
            return defaultValue;
          }
        default:
          return setting.setting_value;
      }
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  static async setSetting(key, value, type = 'string', description = '') {
    try {
      let stringValue;
      switch (type) {
        case 'boolean':
          stringValue = value.toString();
          break;
        case 'number':
          stringValue = value.toString();
          break;
        case 'json':
          stringValue = JSON.stringify(value);
          break;
        default:
          stringValue = value;
      }

      await prisma.system_settings.upsert({
        where: { setting_key: key },
        update: { 
          setting_value: stringValue,
          updated_at: new Date()
        },
        create: {
          setting_key: key,
          setting_value: stringValue,
          setting_type: type,
          description
        }
      });

      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  }

  static async getMultipleSettings(keys) {
    try {
      const settings = await prisma.system_settings.findMany({
        where: {
          setting_key: { in: keys }
        }
      });

      const result = {};
      settings.forEach(setting => {
        let value = setting.setting_value;
        
        switch (setting.setting_type) {
          case 'number':
            value = parseFloat(value);
            break;
          case 'boolean':
            value = value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string if JSON parse fails
            }
            break;
        }

        result[setting.setting_key] = value;
      });

      return result;
    } catch (error) {
      console.error('Error getting multiple settings:', error);
      return {};
    }
  }

  static async isFeatureEnabled(flagKey, userId = null, userType = null) {
    try {
      const flag = await prisma.feature_flags.findUnique({
        where: { flag_key: flagKey }
      });

      if (!flag || !flag.is_enabled) {
        return false;
      }

      // Check rollout percentage
      if (flag.rollout_percentage < 100) {
        const userHash = userId ? 
          userId.toString().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0) : Math.random() * 100;
        
        if (Math.abs(userHash) % 100 >= flag.rollout_percentage) {
          return false;
        }
      }

      // Check user type targeting
      if (flag.target_user_types && userType) {
        const targetTypes = Array.isArray(flag.target_user_types) 
          ? flag.target_user_types 
          : JSON.parse(flag.target_user_types);
        
        if (!targetTypes.includes(userType)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Feature flag check error:', error);
      return false;
    }
  }

  static async validateSystemHealth() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check recent error rates
      const recentErrors = await prisma.system_error_logs.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          },
          error_level: {
            in: ['error', 'critical']
          }
        }
      });

      // Check performance metrics
      const recentPerformance = await prisma.performance_logs.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000)
          }
        },
        select: {
          response_time_ms: true
        }
      });

      const avgResponseTime = recentPerformance.length > 0 
        ? recentPerformance.reduce((sum, p) => sum + p.response_time_ms, 0) / recentPerformance.length
        : 0;

      return {
        database: 'healthy',
        error_count: recentErrors,
        avg_response_time: Math.round(avgResponseTime),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        database: 'unhealthy',
        error_count: -1,
        avg_response_time: -1,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SystemSettingsUtil;