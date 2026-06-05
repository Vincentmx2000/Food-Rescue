import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, clearNotifications } from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/clear', clearNotifications);

export default router;
