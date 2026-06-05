import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { getUserProfile, updateProfile, updatePassword } from '../controllers/userController.js';

const router = Router();

router.use(protect);
router.get('/:id', getUserProfile);
router.patch('/profile', updateProfile);
router.patch('/update-password', updatePassword);

export default router;
