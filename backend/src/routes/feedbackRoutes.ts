import express from 'express';
import { createFeedback, getDonorFeedback, getMyFeedback } from '../controllers/feedbackController';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

router.post('/', authorize(UserRole.NGO), createFeedback);
router.get('/my-feedback', authorize(UserRole.DONOR), getMyFeedback);
router.get('/donor/:donorId', getDonorFeedback);

export default router;
