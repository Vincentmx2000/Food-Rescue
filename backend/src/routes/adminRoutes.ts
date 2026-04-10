import { Router } from 'express';
import { getPlatformStats, getAllUsers, toggleUserBlock, getAllDonations, toggleUserVerification } from '../controllers/adminController';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-block', toggleUserBlock);
router.patch('/users/:userId/toggle-verify', toggleUserVerification);
router.get('/donations', getAllDonations);

export default router;
