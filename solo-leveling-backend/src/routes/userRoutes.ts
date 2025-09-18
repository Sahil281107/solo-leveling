import { Router } from 'express';
import { 
  getUserProfile, 
  getUserStats, 
  getAchievements,
  initializeUserStats,
  checkAchievements,
  uploadProfilePhoto,
  removeProfilePhoto,
  getReceivedFeedback,        // Add this
  markFeedbackAsRead ,         // Add this
  recalculateUserStreak,    // Add this import
  getUserStreakDetails,      // Add this import
  getCoachDetails
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// Existing routes...
router.get('/profile', getUserProfile);
router.get('/stats', getUserStats);
router.get('/achievements', getAchievements);
router.post('/initialize-stats', initializeUserStats);
router.post('/check-achievements', checkAchievements);
router.post('/upload-photo', upload.single('profile_photo'), uploadProfilePhoto);
router.delete('/remove-photo', removeProfilePhoto);

// New routes for feedback
router.get('/received-feedback', getReceivedFeedback);           // Add this
router.put('/feedback/:feedback_id/read', markFeedbackAsRead);   // Add this

router.post('/recalculate-streak', recalculateUserStreak);
router.get('/streak-details', getUserStreakDetails);

router.get('/coach/:coach_id/details', getCoachDetails);

export default router;