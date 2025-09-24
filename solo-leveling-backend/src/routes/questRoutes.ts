import { Router } from 'express';
import { 
  getDailyQuests, 
  getWeeklyQuests, 
  completeQuest,
  generateDailyQuests,
  generateWeeklyQuests,
  initializeQuestSystem,
  processQuestExpiration,  
  triggerQuestReset,      
  checkQuestStatus 
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

router.post('/expire-and-renew', processQuestExpiration);  // Admin/system use
router.post('/reset-quests', triggerQuestReset);           // Manual reset
router.get('/status', checkQuestStatus);                   // Check if user needs new quests

export default router;