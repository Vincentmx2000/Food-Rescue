import { Router } from 'express';
import { claimDonation, assignVolunteer, uploadDistributionProof, getMyClaims } from '../controllers/ngoController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';
import { upload } from '../config/cloudinary.js';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.NGO));

router.get('/my-claims', getMyClaims);
router.post('/claim', claimDonation);
router.post('/assign-volunteer', assignVolunteer);
router.post('/distribution-proof', upload.array('images', 5), uploadDistributionProof);

export default router;
