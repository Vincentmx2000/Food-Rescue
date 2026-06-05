import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';
import { getAssignedTasks, updateTaskStatus, getRescueHistory, getAvailableTasks, acceptTask, uploadVolunteerDistributionProof } from '../controllers/volunteerController.js';
import { upload } from '../config/cloudinary.js';

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
