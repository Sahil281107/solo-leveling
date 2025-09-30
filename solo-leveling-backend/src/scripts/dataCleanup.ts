const { PrismaClient } = require('@prisma/client');
const SystemSettingsUtil = require('../utils/systemSettings');

const prisma = new PrismaClient();

async function performDataCleanup() {
  console.log('Starting automated data cleanup...');
  
  try {
    const retentionDays = await SystemSettingsUtil.getSetting('data_retention_days', 90);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Clean up old performance logs
    const deletedPerformance = await prisma.performance_logs.deleteMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    });

    // Clean up old analytics data
    const deletedAnalytics = await prisma.user_analytics.deleteMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    });

    // Clean up resolved error logs
    const deletedErrors = await prisma.system_error_logs.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
        resolved: true
      }
    });

    // Clean up expired sessions
    const deletedSessions = await prisma.user_sessions.deleteMany({
      where: {
        expires_at: { lt: new Date() }
      }
    });

    console.log('Data cleanup completed:', {
      performance_logs_deleted: deletedPerformance.count,
      analytics_deleted: deletedAnalytics.count,
      error_logs_deleted: deletedErrors.count,
      sessions_deleted: deletedSessions.count,
      retention_days: retentionDays
    });

  } catch (error) {
    console.error('Data cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  performDataCleanup();
}

module.exports = performDataCleanup;