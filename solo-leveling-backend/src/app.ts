import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { startQuestScheduler } from './schedulers/questScheduler';
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { performanceMonitor, logSystemError } = require('./middleware/adminLogger');
const app: Application = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Import after app is created
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { startAllSchedulers } from './schedulers/questScheduler';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SINGLE uploads middleware with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  })
);

console.log("Serving uploads from:", path.join(__dirname, "../uploads"));

// Performance monitoring middleware
app.use(async (req, res, next) => {
  try {
    const performanceEnabled = await prisma.system_settings.findUnique({
      where: { setting_key: 'performance_monitoring_enabled' }
    });
    
    if (performanceEnabled && performanceEnabled.setting_value === 'true') {
      return performanceMonitor(req, res, next);
    }
    
    next();
  } catch (error) {
    // If we can't check the setting, just continue without monitoring
    next();
  }
});

// Routes - Register ALL routes through the main router
app.use('/api', routes);

// Global error handler with system error logging
app.use(async (err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);

  // Log system error
  try {
    await logSystemError(err, req, req.user?.user_id);
  } catch (logError) {
    console.error('Failed to log system error:', logError);
  }

  // Determine error response based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.log('⚠️ Starting server without database connection');
      console.log('🔧 Check your .env file and MySQL server');
    } else {
      console.log('✅ Database connected successfully');
      
      // 🎯 START AUTOMATIC QUEST GENERATION SYSTEM
      startAllSchedulers();
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log('🎮 Solo Leveling Life System - Quest Generation Active!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;