import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Import after app is created
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { startAllSchedulers } from './schedulers/questScheduler';

// CORRECT: Import admin settings with ES6 import (not require)
import adminSettingsRoutes from './routes/admin/settings';

const { PrismaClient } = require('@prisma/client');
const { performanceMonitor, logSystemError } = require('./middleware/adminLogger');

const app: Application = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

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
    setHeaders: (res) => {
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// Performance monitoring middleware
if (performanceMonitor) {
  app.use(performanceMonitor);
}

// Mount main API routes
app.use('/api', routes);

// Mount admin settings routes separately (if needed for specific admin settings)
// This line might be redundant if settings are already handled in adminRoutes
// app.use('/api/admin/settings', adminSettingsRoutes);

// Global error handler
app.use(errorHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Solo Leveling System API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
    console.log('✅ Database connected successfully');

    // Start schedulers
    console.log('⚡ Starting quest schedulers...');
    await startAllSchedulers();
    console.log('✅ Quest schedulers started');

    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 Solo Leveling System API Server Started!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health Check: http://localhost:${PORT}/api/health
📚 API Docs: http://localhost:${PORT}/api
⏰ Server Time: ${new Date().toISOString()}
      `);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    if (logSystemError) {
      await logSystemError(error, null, null, 'server_startup');
    }
    
    process.exit(1);
  }
};

// Start the server
startServer();