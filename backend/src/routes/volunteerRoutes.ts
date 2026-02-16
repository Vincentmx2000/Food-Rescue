import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';
import { getAssignedTasks, updateTaskStatus, getRescueHistory, getAvailableTasks, acceptTask } from '../controllers/volunteerController';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.VOLUNTEER));

router.get('/tasks', getAssignedTasks);
router.get('/available-tasks', getAvailableTasks);
router.post('/accept-task', acceptTask);
router.patch('/update-status', updateTaskStatus);
router.get('/history', getRescueHistory);

export default router;
