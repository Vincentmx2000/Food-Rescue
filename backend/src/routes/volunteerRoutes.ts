import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';
import { getAssignedTasks, updateTaskStatus, getRescueHistory, getAvailableTasks, acceptTask, uploadVolunteerDistributionProof } from '../controllers/volunteerController';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.VOLUNTEER));

router.get('/tasks', getAssignedTasks);
router.get('/available-tasks', getAvailableTasks);
router.post('/accept-task', acceptTask);
router.patch('/update-status', updateTaskStatus);
router.post('/distribution-proof', upload.array('images', 5), uploadVolunteerDistributionProof);
router.get('/history', getRescueHistory);

export default router;
