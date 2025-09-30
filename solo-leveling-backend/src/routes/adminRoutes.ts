import { Router } from 'express';
import { 
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAllQuests,
  getAdminLogs,
  getDatabaseStats,
  getAllQuestsDetailed
} from '../controllers/adminController';
import { authenticate, authorizeRole } from '../middleware/auth';

// Import the admin settings routes
import adminSettingsRoutes from './admin/settings';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRole(['admin']));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', getDashboardStats);
router.get('/database/stats', getDatabaseStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.get('/users/:user_id', getUserDetails);
router.post('/users', createUser);
router.put('/users/:user_id', updateUser);
router.delete('/users/:user_id', deleteUser);
router.patch('/users/:user_id/toggle-status', toggleUserStatus);

// ==================== QUEST MANAGEMENT ====================
router.get('/quests', getAllQuestsDetailed);

// ==================== ADMIN LOGS ====================
router.get('/logs', getAdminLogs);

// ==================== SETTINGS ====================
// Mount the admin settings sub-routes
router.use('/settings', adminSettingsRoutes);

export default router;