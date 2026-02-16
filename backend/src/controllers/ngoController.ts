import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import Donation, { DonationStatus } from '../models/Donation';
import Claim, { ClaimStatus, PickupMode } from '../models/Claim';
import VolunteerTask, { TaskStatus } from '../models/VolunteerTask';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import User, { UserRole } from '../models/User';

export const claimDonation = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { donationId, pickupMode = PickupMode.SELF } = req.body;

        if (!mongoose.Types.ObjectId.isValid(donationId)) {
            return next(new AppError('Invalid donation ID', 400));
        }

        console.log(`NGO ${req.user._id} attempting to claim donation ${donationId}`);
        const donationIdObj = new mongoose.Types.ObjectId(donationId);
        const ngoIdObj = new mongoose.Types.ObjectId(req.user._id);

        const donation = await Donation.findOneAndUpdate(
            { _id: donationIdObj, status: DonationStatus.AVAILABLE },
            {
                status: DonationStatus.CLAIMED_BY_NGO,
                claimedByNGO: ngoIdObj
            },
            { new: true, runValidators: true }
        );

        if (!donation) {
            console.log(`Donation ${donationId} claim failed: Not found or not AVAILABLE`);
            return next(new AppError('Donation not available for claiming', 400));
        }

        console.log(`Donation ${donationId} found and updated. Creating claim record...`);
        const claim = await Claim.findOneAndUpdate(
            { donationId: donationIdObj },
            {
                ngoId: ngoIdObj,
                pickupMode,
                status: ClaimStatus.IN_PROGRESS
            },
            { upsert: true, new: true, runValidators: true }
        );

        console.log(`Claim record created/updated: ${claim._id}`);
        res.status(201).json(new ApiResponse('Donation claimed successfully', { donation, claim }));
    } catch (error) {
        console.error('Error in claimDonation:', error);
        next(error);
    }
};

export const assignVolunteer = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { donationId, volunteerEmail, volunteerId, volunteerName } = req.body;

        if (!donationId) return next(new AppError('Donation ID is required', 400));

        let volunteer;
        if (volunteerId && volunteerId !== 'broadcast') {
            volunteer = await User.findOne({ _id: volunteerId, role: UserRole.VOLUNTEER });
        } else if (volunteerEmail) {
            volunteer = await User.findOne({ email: volunteerEmail, role: UserRole.VOLUNTEER });
        } else if (volunteerName) {
            volunteer = await User.findOne({ name: volunteerName, role: UserRole.VOLUNTEER });
        }

        // Logic check: If volunteerId was meant to be specific but user not found
        if ((volunteerId || volunteerEmail || volunteerName) && !volunteer && volunteerId !== 'broadcast') {
            return next(new AppError('Volunteer not found', 404));
        }

        const donation = await Donation.findById(donationId);
        if (!donation) return next(new AppError('Donation not found', 404));
        if (donation.claimedByNGO?.toString() !== req.user._id.toString()) {
            return next(new AppError('Unauthorized', 403));
        }

        const isBroadcast = !volunteer;
        const taskStatus = isBroadcast ? TaskStatus.OPEN : TaskStatus.ASSIGNED;

        // Update Donation Status
        // If specific assignment -> VOLUNTEER_ASSIGNED
        // If broadcast -> remains CLAIMED_BY_NGO (waiting for pickup/assignment)
        if (!isBroadcast) {
            donation.status = DonationStatus.VOLUNTEER_ASSIGNED;
            donation.assignedVolunteer = (volunteer as any)._id;
            await donation.save();
        }

        // Update Claim
        await Claim.findOneAndUpdate(
            { donationId },
            {
                pickupMode: PickupMode.VOLUNTEER,
                ngoId: req.user._id,
                volunteerId: volunteer ? (volunteer as any)._id : null
            },
            { upsert: true }
        );

        // Create/Update VolunteerTask
        await VolunteerTask.findOneAndUpdate(
            { donationId },
            {
                ngoId: req.user._id,
                volunteerId: volunteer ? (volunteer as any)._id : null,
                status: taskStatus,
                assignedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const message = isBroadcast
            ? 'Task broadcasted to all volunteers'
            : `Task assigned to ${(volunteer as any).name}`;

        res.status(200).json(new ApiResponse(message));
    } catch (error) {
        next(error);
    }
};

export const uploadDistributionProof = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { donationId } = req.body;
        const imageUrls = req.files ? (req.files as any[]).map(f => f.path) : [];

        console.log('uploadDistributionProof called');
        console.log('donationId:', donationId);
        console.log('req.files:', req.files);
        console.log('imageUrls:', imageUrls);

        if (imageUrls.length === 0) return next(new AppError('Please upload at least one proof image', 400));

        let claim = await Claim.findOne({ donationId, ngoId: req.user._id });

        if (!claim) {
            // Fallback: Check if the donation itself is claimed by this NGO
            const donation = await Donation.findById(donationId);
            if (!donation || donation.claimedByNGO?.toString() !== req.user._id.toString()) {
                return next(new AppError('Claim record not found and you are not the authorized NGO for this donation', 404));
            }

            // Create missing claim record on the fly
            claim = await Claim.create({
                donationId,
                ngoId: req.user._id,
                pickupMode: donation.assignedVolunteer ? PickupMode.VOLUNTEER : PickupMode.SELF,
                status: ClaimStatus.IN_PROGRESS
            });
            console.log('Created new claim:', claim._id);
        }

        claim.distributionProofImages = imageUrls;
        claim.status = ClaimStatus.COMPLETED;
        await claim.save();

        console.log('Claim saved with images:', claim.distributionProofImages);

        await Donation.findByIdAndUpdate(donationId, {
            status: DonationStatus.DISTRIBUTED,
            completedAt: new Date()
        });

        await VolunteerTask.findOneAndUpdate(
            { donationId },
            {
                status: TaskStatus.DISTRIBUTED,
                distributedAt: new Date(),
                completedAt: new Date()
            }
        );

        console.log('Distribution proof upload complete');
        res.status(200).json(new ApiResponse('Distribution proof uploaded and rescue completed'));
    } catch (error) {
        console.error('Error in uploadDistributionProof:', error);
        next(error);
    }
};
export const getMyClaims = async (req: any, res: Response, next: NextFunction) => {
    try {
        const donations = await Donation.find({ claimedByNGO: req.user._id })
            .populate('donorId', 'name email phone')
            .populate('assignedVolunteer', 'name email phone')
            .sort({ updatedAt: -1 });

        res.status(200).json(new ApiResponse('Claimed donations fetched successfully', donations));
    } catch (error) {
        next(error);
    }
};
