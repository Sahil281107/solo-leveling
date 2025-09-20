import { Router } from 'express';
import { verifyAndGetStudent, getMyStudents, provideFeedback, removeStudent, getStudentStats  } from '../controllers/coachController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRole(['coach']));

router.post('/verify-student', verifyAndGetStudent);
router.get('/my-students', getMyStudents);
router.get('/student-stats/:student_id', getStudentStats);
router.post('/feedback', provideFeedback);
router.delete('/remove-student/:student_id', removeStudent);
export default router;