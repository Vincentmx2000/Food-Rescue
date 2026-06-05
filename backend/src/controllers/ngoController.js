import mongoose from 'mongoose';
import Donation, { DonationStatus } from '../models/Donation.js';
import Claim, { ClaimStatus, PickupMode } from '../models/Claim.js';
import VolunteerTask, { TaskStatus } from '../models/VolunteerTask.js';
import { AppError } from '../utils/AppError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User, { UserRole } from '../models/User.js';
import { createNotification } from '../utils/notifHelper.js';
import { NotificationType } from '../models/Notification.js';

export const claimDonation = async (req, res, next) => {
    try {
        const { donationId, pickupMode = PickupMode.SELF } = req.body;

        if (!mongoose.Types.ObjectId.isValid(donationId)) {
            return next(new AppError('Invalid donation ID', 400));
        }

        // Check if NGO is verified
        if (!req.user.isVerified) {
            return next(new AppError('Your organization account is not yet verified by Admin. You cannot claim food until verified.', 403));
        }

        console.log(`NGO ${req.user._id} attempting to claim donation ${donationId}`);
        const donationIdObj = new mongoose.Types.ObjectId(donationId);
        const ngoIdObj = new mongoose.Types.ObjectId(req.user._id);

        const donation = await Donation.findOneAndUpdate(
            { _id: donationIdObj, status: DonationStatus.AVAILABLE },
            {
                status: DonationStatus.CLAIMED_BY_NGO,
                claimedByNGO: ngoIdObj,
                claimedAt: new Date()
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

        // NOTIFICATION: Notify Donor
        await createNotification(
            donation.donorId,
            NotificationType.DONATION_CLAIMED,
            'Donation Claimed',
            `Your donation of ${donation.foodType} has been claimed by ${req.user.organization || req.user.name}.`,
            `/donation/${donation._id}`,
            req.user._id
        );

        console.log(`Claim record created/updated: ${claim._id}`);
        res.status(201).json(new ApiResponse('Donation claimed successfully', { donation, claim }));
    } catch (error) {
        console.error('Error in claimDonation:', error);
        next(error);
    }
};

export const assignVolunteer = async (req, res, next) => {
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

        if (!isBroadcast) {
            donation.status = DonationStatus.VOLUNTEER_ASSIGNED;
            donation.assignedVolunteer = volunteer._id;
            donation.volunteerAssignedAt = new Date();
            await donation.save();

            // NOTIFICATION: Notify Volunteer
            await createNotification(
                volunteer._id,
                NotificationType.VOLUNTEER_ASSIGNED,
                'New Mission Assigned',
                `${req.user.organization || req.user.name} has assigned you to pick up food from ${donation.donorName}.`,
                `/task/${donation._id}`,
                req.user._id
            );
        }

        // Update Claim
        await Claim.findOneAndUpdate(
            { donationId },
            {
                pickupMode: PickupMode.VOLUNTEER,
                ngoId: req.user._id,
                volunteerId: volunteer ? volunteer._id : null
            },
            { upsert: true }
        );

        // Create/Update VolunteerTask
        await VolunteerTask.findOneAndUpdate(
            { donationId },
            {
                ngoId: req.user._id,
                volunteerId: volunteer ? volunteer._id : null,
                status: taskStatus,
                assignedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const message = isBroadcast
            ? 'Task broadcasted to all volunteers'
            : `Task assigned to ${volunteer.name}`;

        res.status(200).json(new ApiResponse(message));
    } catch (error) {
        next(error);
    }
};

export const uploadDistributionProof = async (req, res, next) => {
    try {
        const { donationId } = req.body;
        const imageUrls = req.files ? req.files.map(f => f.path) : [];

        console.log('uploadDistributionProof called');
        console.log('donationId:', donationId);
        console.log('req.files:', req.files);
        console.log('imageUrls:', imageUrls);

        const hasExisting = req.body && Object.prototype.hasOwnProperty.call(req.body, 'existingProofImages');
        const hasNew = req.files && req.files.length > 0;

        if (!hasExisting && !hasNew) {
            return next(new AppError('Please upload at least one proof image', 400));
        }

        let claim = await Claim.findOne({ donationId, ngoId: req.user._id });

        if (!claim) {
            const donation = await Donation.findById(donationId);
            if (!donation || donation.claimedByNGO?.toString() !== req.user._id.toString()) {
                return next(new AppError('Claim record not found and you are not the authorized NGO for this donation', 404));
            }

            claim = await Claim.create({
                donationId,
                ngoId: req.user._id,
                pickupMode: donation.assignedVolunteer ? PickupMode.VOLUNTEER : PickupMode.SELF,
                status: ClaimStatus.IN_PROGRESS,
                distributionProofImages: []
            });
            console.log('Created new claim:', claim._id);
        }

        let currentProofImages = claim.distributionProofImages || [];

        if (hasExisting) {
            const keepImages = Array.isArray(req.body.existingProofImages)
                ? req.body.existingProofImages
                : (req.body.existingProofImages ? [req.body.existingProofImages] : []);

            currentProofImages = currentProofImages.filter(img => {
                const normalizedPath = img.replace(/\\/g, '/');
                return keepImages.some((keep) => keep.includes(normalizedPath));
            });
        }

        if (hasNew) {
            const newImages = req.files.map(f => f.path);
            currentProofImages = [...currentProofImages, ...newImages];
        }

        claim.distributionProofImages = currentProofImages;
        claim.status = ClaimStatus.COMPLETED;
        await claim.save();

        console.log('Claim saved with images:', claim.distributionProofImages);

        const donationFull = await Donation.findByIdAndUpdate(donationId, {
            status: DonationStatus.DISTRIBUTED,
            completedAt: new Date()
        });

        if (donationFull) {
            await createNotification(
                donationFull.donorId,
                NotificationType.DISTRIBUTED,
                'Donation Distributed',
                `Your donation of ${donationFull.foodType} has been successfully distributed to people in need!`,
                `/donation/${donationFull._id}`,
                req.user._id
            );
        }

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

export const getMyClaims = async (req, res, next) => {
    try {
        const donations = await Donation.find({ claimedByNGO: req.user._id })
            .populate('donorId', 'name email phone')
            .populate('assignedVolunteer', 'name email phone')
            .sort({ updatedAt: -1 })
            .lean();

        const donationsWithProof = await Promise.all(
            donations.map(async (donation) => {
                const claim = await Claim.findOne({ donationId: donation._id }).lean();
                return {
                    ...donation,
                    distributionProofImages: claim?.distributionProofImages || []
                };
            })
        );

        res.status(200).json(new ApiResponse('Claimed donations fetched successfully', donationsWithProof));
    } catch (error) {
        next(error);
    }
};
