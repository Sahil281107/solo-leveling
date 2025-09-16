import { Router } from 'express';
import { 
  getDailyQuests, 
  getWeeklyQuests, 
  completeQuest,
  generateDailyQuests,
  generateWeeklyQuests,
  initializeQuestSystem
} from '../controllers/questController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRole(['adventurer']));

// Quest endpoints
router.get('/daily', getDailyQuests);
router.get('/weekly', getWeeklyQuests);
router.post('/initialize', initializeQuestSystem);
router.post('/generate-daily', generateDailyQuests);
router.post('/generate-weekly', generateWeeklyQuests);
router.post('/complete/:quest_id', completeQuest);

export default router;