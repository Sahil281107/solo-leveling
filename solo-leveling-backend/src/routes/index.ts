import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import questRoutes from './questRoutes';
import coachRoutes from './coachRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/quests', questRoutes);
router.use('/coach', coachRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Solo Leveling System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      quests: '/api/quests',
      coach: '/api/coach',
      health: '/api/health'
    }
  });
});

export default router;