import { Router } from 'express';
import { createDonation, getMyDonations, getAvailableDonations, getDonationDetails, deleteDonation, updateDonation } from '../controllers/donationController.js';
import { createDonationValidator } from '../validators/donationValidator.js';
import { validate } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';
import { upload } from '../config/cloudinary.js';

const router = Router();

router.use(protect);

router.post('/', authorize(UserRole.DONOR), upload.array('images', 5), createDonationValidator, validate, createDonation);
router.get('/my-donations', authorize(UserRole.DONOR), getMyDonations);
router.get('/available', authorize(UserRole.NGO, UserRole.ADMIN, UserRole.VOLUNTEER), getAvailableDonations);
router.get('/:id', getDonationDetails);
router.patch('/:id', upload.array('images', 5), updateDonation);
router.delete('/:id', authorize(UserRole.DONOR), deleteDonation);

export default router;
