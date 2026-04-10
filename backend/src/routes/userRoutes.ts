import { Router } from 'express';
import { getUserProfile, updatePassword, updateProfile } from '../controllers/userController';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);
router.get('/:id', getUserProfile);
router.patch('/profile', updateProfile);
router.patch('/update-password', updatePassword);

export default router;
