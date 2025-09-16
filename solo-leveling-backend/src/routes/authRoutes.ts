import { Router } from 'express';
import { signup, login, logout, getLoginStats } from '../controllers/authController';
import { authenticate, authorizeRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Public routes
router.post('/signup', upload.single('profile_photo'), signup);
router.post('/login', login);

// Protected routes
router.post('/logout', authenticate, logout);

// Admin routes for login statistics (only for coaches/admins)
router.get('/login-stats', authenticate, authorizeRole(['coach']), getLoginStats);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Authentication Service',
    timestamp: new Date().toISOString()
  });
});

export default router;