import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Donation, { DonationStatus } from '../models/Donation';
import Claim, { ClaimStatus } from '../models/Claim';
import VolunteerTask, { TaskStatus } from '../models/VolunteerTask';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const createDonation = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { foodCategory, foodType, quantity, unit, expiryTime, description, address, longitude, latitude } = req.body;

        const imageUrls = req.files ? (req.files as any[]).map(f => f.path) : [];

        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);

        if (isNaN(lon) || isNaN(lat)) {
            return next(new AppError('Invalid coordinates provided. Please select a location on the map.', 400));
        }

        const donation = await Donation.create({
            donorId: req.user._id,
            foodCategory,
            foodType,
            quantity: Number(quantity),
            unit,
            expiryTime,
            description,
            address,
            images: imageUrls,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
            },
        });

        res.status(201).json(new ApiResponse('Donation posted successfully', donation));
    } catch (error) {
        next(error);
    }
};

export const getMyDonations = async (req: any, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const donations = await Donation.find({ donorId: req.user._id })
            .populate('donorId', 'name email')
            .populate('claimedByNGO', 'name organization phone email address')
            .populate('assignedVolunteer', 'name phone email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance

        console.log(`Fetched ${donations.length} donations for donor ${req.user._id}`);

        // Fetch claim data for each donation to get distribution proof images
        const donationsWithProof = await Promise.all(
            donations.map(async (donation: any) => {
                const claim = await Claim.findOne({ donationId: donation._id }).lean();
                console.log(`Donation ${donation._id}: Claim found:`, !!claim, 'Proof images:', claim?.distributionProofImages?.length || 0);
                return {
                    ...donation,
                    distributionProofImages: claim?.distributionProofImages || []
                };
            })
        );

        const total = await Donation.countDocuments({ donorId: req.user._id });

        res.status(200).json(new ApiResponse('Donations fetched successfully', {
            donations: donationsWithProof,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        console.error('Error in getMyDonations:', error);
        next(error);
    }
};

export const getAvailableDonations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { longitude, latitude, maxDistance = 10000, foodType } = req.query; // maxDistance in meters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        let query: any = {};
        const userRole = (req as any).user.role;

        // Base filter for Status based on role
        let statusFilter;
        if (userRole === 'VOLUNTEER') {
            statusFilter = {
                $or: [
                    { status: DonationStatus.AVAILABLE },
                    { status: DonationStatus.CLAIMED_BY_NGO, assignedVolunteer: { $exists: false } },
                    { status: DonationStatus.CLAIMED_BY_NGO, assignedVolunteer: null }
                ]
            };
        } else {
            // NGOs and Admins only see donations that are actually available to be claimed
            statusFilter = { status: DonationStatus.AVAILABLE };
        }

        if (longitude && latitude) {
            // MongoDB requires $near to be at the top level, but it can be combined
            query = {
                ...statusFilter,
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)] },
                        $maxDistance: parseInt(maxDistance as string),
                    },
                }
            };
        } else {
            query = statusFilter;
        }

        if (foodType) {
            query.foodType = { $regex: foodType, $options: 'i' };
        }

        const donations = await Donation.find(query)
            .populate('donorId', 'name email')
            .skip(skip)
            .limit(limit);

        const total = await Donation.countDocuments(query);

        res.status(200).json(new ApiResponse('Available donations fetched successfully', {
            donations,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
};

export const getDonationDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('donorId', 'name email phone')
            .populate('claimedByNGO', 'name organization phone email address')
            .populate('assignedVolunteer', 'name phone email');
        if (!donation) {
            return next(new AppError('Donation not found', 404));
        }

        // Attach distribution proof images from Claim
        const claim = await Claim.findOne({ donationId: donation._id }).lean();
        const donationObj = donation.toObject();
        (donationObj as any).distributionProofImages = claim?.distributionProofImages || [];

        res.status(200).json(new ApiResponse('Donation details fetched', donationObj));
    } catch (error) {
        next(error);
    }
};
export const deleteDonation = async (req: any, res: Response, next: NextFunction) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return next(new AppError('Donation not found', 404));
        }

        // Check ownership
        if (donation.donorId.toString() !== req.user._id.toString()) {
            return next(new AppError('You are not authorized to delete this donation', 403));
        }

        // Hard delete if it's still POSTED
        if (donation.status === DonationStatus.AVAILABLE) {
            await Donation.findByIdAndDelete(req.params.id);
            return res.status(200).json(new ApiResponse('Donation deleted successfully', null));
        }

        // Soft cancel if it's already CLAIMED or ASSIGNED
        if ([DonationStatus.CLAIMED_BY_NGO, DonationStatus.VOLUNTEER_ASSIGNED].includes(donation.status)) {
            donation.status = DonationStatus.CANCELLED;
            await donation.save();
            return res.status(200).json(new ApiResponse('Donation cancelled successfully', donation));
        }

        // Cannot cancel if already picked up or distributed
        if ([DonationStatus.PICKED_UP, DonationStatus.DISTRIBUTED].includes(donation.status)) {
            return next(new AppError('Cannot cancel a donation that has already been picked up or distributed', 400));
        }

        if (donation.status === DonationStatus.CANCELLED) {
            return next(new AppError('Donation is already cancelled', 400));
        }

        next(new AppError('Something went wrong', 500));
    } catch (error) {
        next(error);
    }
};

export const updateDonation = async (req: any, res: Response, next: NextFunction) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return next(new AppError('Donation not found', 404));
        }

        // Authorization
        const isDonor = donation.donorId && req.user._id && donation.donorId.toString() === req.user._id.toString();
        const isAdmin = req.user.role && req.user.role.toUpperCase() === 'ADMIN';

        if (!isDonor && !isAdmin) {
            // NGOs can only update status (which is what they were doing before)
            const isNGO = donation.claimedByNGO && req.user._id && donation.claimedByNGO.toString() === req.user._id.toString();
            if (!isNGO) {
                return next(new AppError('You are not authorized to update this donation', 403));
            }
        }

        const updateData: any = { ...req.body };

        // Handle Status Transform
        if (updateData.status) {
            updateData.status = updateData.status.toUpperCase();
            if (updateData.status === 'PICKED_UP') updateData.pickedUpAt = new Date();
            if (updateData.status === 'DISTRIBUTED') updateData.completedAt = new Date();
        }

        // Handle Images
        let currentImages = donation.images || [];

        // If the client sent a list of existing images to keep OR new files are provided
        const hasExistingImages = req.body && Object.prototype.hasOwnProperty.call(req.body, 'existingImages');
        const hasNewFiles = req.files && (req.files as any[]).length > 0;

        if (hasExistingImages) {
            const keepImages = Array.isArray(req.body.existingImages)
                ? req.body.existingImages
                : (req.body.existingImages ? [req.body.existingImages] : []);

            // Filter current images to only keep those present in keepImages
            currentImages = currentImages.filter(img => {
                const normalizedPath = img.replace(/\\/g, '/');
                return keepImages.some((keep: string) => keep.includes(normalizedPath));
            });
        }

        // Add new images
        if (hasNewFiles) {
            const newImages = (req.files as any[]).map(f => f.path);
            currentImages = [...currentImages, ...newImages];
        }

        // Only update images field if something was changed or explicitly sent
        if (hasExistingImages || hasNewFiles) {
            updateData.images = currentImages;
        }

        // Handle Location coordinates
        if (updateData.longitude && updateData.latitude) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
            };
            delete updateData.longitude;
            delete updateData.latitude;
        }

        // Handle numeric fields
        if (updateData.quantity) updateData.quantity = Number(updateData.quantity);

        const updatedDonation = await Donation.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedDonation) {
            return next(new AppError('Failed to update donation', 500));
        }

        // Sync with Claim if status is updated
        if (updateData.status) {
            const statusMap: Record<string, string> = {
                'AVAILABLE': ClaimStatus.PENDING,
                'CLAIMED_BY_NGO': ClaimStatus.IN_PROGRESS,
                'VOLUNTEER_ASSIGNED': ClaimStatus.IN_PROGRESS,
                'PICKED_UP': ClaimStatus.IN_PROGRESS,
                'DISTRIBUTED': ClaimStatus.COMPLETED,
                'CANCELLED': ClaimStatus.CANCELLED
            };

            const newClaimStatus = statusMap[updateData.status];
            if (newClaimStatus) {
                const claimUpdate: any = { status: newClaimStatus };

                // If NGO is updating to PICKED_UP, it's a self-pickup
                const isNGO = req.user.role === 'NGO';
                if (updateData.status === 'PICKED_UP' && isNGO) {
                    claimUpdate.pickupMode = 'SELF';
                }

                await Claim.findOneAndUpdate(
                    { donationId: updatedDonation._id },
                    { $set: claimUpdate },
                    { upsert: true }
                );
            }

            // Sync with VolunteerTask
            const taskStatusMap: Record<string, string> = {
                'PICKED_UP': TaskStatus.PICKED_UP,
                'DISTRIBUTED': TaskStatus.DISTRIBUTED,
                'CANCELLED': TaskStatus.CANCELLED
            };
            const newTaskStatus = taskStatusMap[updateData.status];

            if (newTaskStatus) {
                const taskUpdate: any = { status: newTaskStatus };
                if (newTaskStatus === TaskStatus.PICKED_UP) taskUpdate.pickedUpAt = new Date();
                if (newTaskStatus === TaskStatus.DISTRIBUTED) {
                    taskUpdate.distributedAt = new Date();
                    taskUpdate.completedAt = new Date();
                }

                await VolunteerTask.findOneAndUpdate(
                    { donationId: updatedDonation._id },
                    { $set: taskUpdate }
                );
            }
        }

        res.status(200).json(new ApiResponse('Donation updated successfully', updatedDonation));
    } catch (error) {
        next(error);
    }
};
