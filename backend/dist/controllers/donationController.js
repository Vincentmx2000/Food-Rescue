"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDonation = exports.deleteDonation = exports.getDonationDetails = exports.getAvailableDonations = exports.getMyDonations = exports.createDonation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Donation_1 = __importStar(require("../models/Donation"));
const Claim_1 = __importStar(require("../models/Claim"));
const VolunteerTask_1 = __importStar(require("../models/VolunteerTask"));
const AppError_1 = require("../utils/AppError");
const ApiResponse_1 = require("../utils/ApiResponse");
const createDonation = async (req, res, next) => {
    try {
        const { foodType, quantity, unit, expiryTime, description, address, longitude, latitude } = req.body;
        const imageUrls = req.files ? req.files.map(f => f.path) : [];
        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);
        if (isNaN(lon) || isNaN(lat)) {
            return next(new AppError_1.AppError('Invalid coordinates provided. Please select a location on the map.', 400));
        }
        const donation = await Donation_1.default.create({
            donorId: req.user._id,
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
        res.status(201).json(new ApiResponse_1.ApiResponse('Donation posted successfully', donation));
    }
    catch (error) {
        next(error);
    }
};
exports.createDonation = createDonation;
const getMyDonations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const donations = await Donation_1.default.find({ donorId: req.user._id })
            .populate('donorId', 'name email')
            .populate('claimedByNGO', 'name organization')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance
        console.log(`Fetched ${donations.length} donations for donor ${req.user._id}`);
        // Fetch claim data for each donation to get distribution proof images
        const donationsWithProof = await Promise.all(donations.map(async (donation) => {
            const claim = await Claim_1.default.findOne({ donationId: donation._id }).lean();
            console.log(`Donation ${donation._id}: Claim found:`, !!claim, 'Proof images:', claim?.distributionProofImages?.length || 0);
            return {
                ...donation,
                distributionProofImages: claim?.distributionProofImages || []
            };
        }));
        const total = await Donation_1.default.countDocuments({ donorId: req.user._id });
        res.status(200).json(new ApiResponse_1.ApiResponse('Donations fetched successfully', {
            donations: donationsWithProof,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    }
    catch (error) {
        console.error('Error in getMyDonations:', error);
        next(error);
    }
};
exports.getMyDonations = getMyDonations;
const getAvailableDonations = async (req, res, next) => {
    try {
        const { longitude, latitude, maxDistance = 10000, foodType } = req.query; // maxDistance in meters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        let query = {};
        const userRole = req.user.role;
        // Base filter for Status based on role
        let statusFilter;
        if (userRole === 'VOLUNTEER') {
            statusFilter = {
                $or: [
                    { status: Donation_1.DonationStatus.AVAILABLE },
                    { status: Donation_1.DonationStatus.CLAIMED_BY_NGO, assignedVolunteer: { $exists: false } },
                    { status: Donation_1.DonationStatus.CLAIMED_BY_NGO, assignedVolunteer: null }
                ]
            };
        }
        else {
            // NGOs and Admins only see donations that are actually available to be claimed
            statusFilter = { status: Donation_1.DonationStatus.AVAILABLE };
        }
        if (longitude && latitude) {
            // MongoDB requires $near to be at the top level, but it can be combined
            query = {
                ...statusFilter,
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                        $maxDistance: parseInt(maxDistance),
                    },
                }
            };
        }
        else {
            query = statusFilter;
        }
        if (foodType) {
            query.foodType = { $regex: foodType, $options: 'i' };
        }
        const donations = await Donation_1.default.find(query)
            .populate('donorId', 'name email')
            .skip(skip)
            .limit(limit);
        const total = await Donation_1.default.countDocuments(query);
        res.status(200).json(new ApiResponse_1.ApiResponse('Available donations fetched successfully', {
            donations,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableDonations = getAvailableDonations;
const getDonationDetails = async (req, res, next) => {
    try {
        const donation = await Donation_1.default.findById(req.params.id).populate('donorId', 'name email phone');
        if (!donation) {
            return next(new AppError_1.AppError('Donation not found', 404));
        }
        res.status(200).json(new ApiResponse_1.ApiResponse('Donation details fetched', donation));
    }
    catch (error) {
        next(error);
    }
};
exports.getDonationDetails = getDonationDetails;
const deleteDonation = async (req, res, next) => {
    try {
        const donation = await Donation_1.default.findById(req.params.id);
        if (!donation) {
            return next(new AppError_1.AppError('Donation not found', 404));
        }
        // Check ownership
        if (donation.donorId.toString() !== req.user._id.toString()) {
            return next(new AppError_1.AppError('You are not authorized to delete this donation', 403));
        }
        // Hard delete if it's still POSTED
        if (donation.status === Donation_1.DonationStatus.AVAILABLE) {
            await Donation_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json(new ApiResponse_1.ApiResponse('Donation deleted successfully', null));
        }
        // Soft cancel if it's already CLAIMED or ASSIGNED
        if ([Donation_1.DonationStatus.CLAIMED_BY_NGO, Donation_1.DonationStatus.VOLUNTEER_ASSIGNED].includes(donation.status)) {
            donation.status = Donation_1.DonationStatus.CANCELLED;
            await donation.save();
            return res.status(200).json(new ApiResponse_1.ApiResponse('Donation cancelled successfully', donation));
        }
        // Cannot cancel if already picked up or distributed
        if ([Donation_1.DonationStatus.PICKED_UP, Donation_1.DonationStatus.DISTRIBUTED].includes(donation.status)) {
            return next(new AppError_1.AppError('Cannot cancel a donation that has already been picked up or distributed', 400));
        }
        if (donation.status === Donation_1.DonationStatus.CANCELLED) {
            return next(new AppError_1.AppError('Donation is already cancelled', 400));
        }
        next(new AppError_1.AppError('Something went wrong', 500));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDonation = deleteDonation;
const updateDonation = async (req, res, next) => {
    try {
        const donation = await Donation_1.default.findById(req.params.id);
        if (!donation) {
            return next(new AppError_1.AppError('Donation not found', 404));
        }
        // Authorization
        const isDonor = donation.donorId && req.user._id && donation.donorId.toString() === req.user._id.toString();
        const isNGO = donation.claimedByNGO && req.user._id && donation.claimedByNGO.toString() === req.user._id.toString();
        const isAdmin = req.user.role && req.user.role.toUpperCase() === 'ADMIN';
        if (!isDonor && !isNGO && !isAdmin) {
            return next(new AppError_1.AppError('You are not authorized to update this donation', 403));
        }
        // Transform status to uppercase if present to match enum
        if (req.body.status) {
            req.body.status = req.body.status.toUpperCase();
        }
        const donationIdObj = new mongoose_1.default.Types.ObjectId(req.params.id);
        const ngoIdObj = donation.claimedByNGO ? new mongoose_1.default.Types.ObjectId(donation.claimedByNGO.toString()) : null;
        const updatedDonation = await Donation_1.default.findByIdAndUpdate(donationIdObj, { $set: req.body }, { new: true, runValidators: true });
        // Sync with Claim if status is updated
        if (req.body.status) {
            const statusMap = {
                'AVAILABLE': Claim_1.ClaimStatus.PENDING,
                'CLAIMED_BY_NGO': Claim_1.ClaimStatus.IN_PROGRESS,
                'VOLUNTEER_ASSIGNED': Claim_1.ClaimStatus.IN_PROGRESS,
                'PICKED_UP': Claim_1.ClaimStatus.IN_PROGRESS,
                'DISTRIBUTED': Claim_1.ClaimStatus.COMPLETED,
                'CANCELLED': Claim_1.ClaimStatus.CANCELLED
            };
            const newClaimStatus = statusMap[req.body.status];
            if (newClaimStatus) {
                const claimUpdate = { status: newClaimStatus };
                if (req.body.status.toUpperCase() === 'PICKED_UP' && isNGO) {
                    claimUpdate.pickupMode = 'SELF';
                }
                // Also ensure ngoId is present if we are the ones updating it
                if (ngoIdObj) {
                    claimUpdate.ngoId = ngoIdObj;
                }
                await Claim_1.default.findOneAndUpdate({ donationId: donationIdObj }, { $set: claimUpdate }, { upsert: true, new: true });
            }
            // Sync with VolunteerTask
            const taskStatusMap = {
                'PICKED_UP': VolunteerTask_1.TaskStatus.PICKED_UP,
                'DISTRIBUTED': VolunteerTask_1.TaskStatus.DISTRIBUTED,
                'CANCELLED': VolunteerTask_1.TaskStatus.CANCELLED
            };
            const newTaskStatus = taskStatusMap[req.body.status];
            if (newTaskStatus) {
                const taskUpdate = { status: newTaskStatus };
                if (newTaskStatus === VolunteerTask_1.TaskStatus.PICKED_UP)
                    taskUpdate.pickedUpAt = new Date();
                if (newTaskStatus === VolunteerTask_1.TaskStatus.DISTRIBUTED) {
                    taskUpdate.distributedAt = new Date();
                    taskUpdate.completedAt = new Date();
                }
                await VolunteerTask_1.default.findOneAndUpdate({ donationId: donationIdObj }, { $set: taskUpdate }, { new: true });
            }
        }
        res.status(200).json(new ApiResponse_1.ApiResponse('Donation updated successfully', updatedDonation));
    }
    catch (error) {
        next(error);
    }
};
exports.updateDonation = updateDonation;
