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
exports.getMyClaims = exports.uploadDistributionProof = exports.assignVolunteer = exports.claimDonation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Donation_1 = __importStar(require("../models/Donation"));
const Claim_1 = __importStar(require("../models/Claim"));
const VolunteerTask_1 = __importStar(require("../models/VolunteerTask"));
const AppError_1 = require("../utils/AppError");
const ApiResponse_1 = require("../utils/ApiResponse");
const User_1 = __importStar(require("../models/User"));
const claimDonation = async (req, res, next) => {
    try {
        const { donationId, pickupMode = Claim_1.PickupMode.SELF } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(donationId)) {
            return next(new AppError_1.AppError('Invalid donation ID', 400));
        }
        console.log(`NGO ${req.user._id} attempting to claim donation ${donationId}`);
        const donationIdObj = new mongoose_1.default.Types.ObjectId(donationId);
        const ngoIdObj = new mongoose_1.default.Types.ObjectId(req.user._id);
        const donation = await Donation_1.default.findOneAndUpdate({ _id: donationIdObj, status: Donation_1.DonationStatus.AVAILABLE }, {
            status: Donation_1.DonationStatus.CLAIMED_BY_NGO,
            claimedByNGO: ngoIdObj
        }, { new: true, runValidators: true });
        if (!donation) {
            console.log(`Donation ${donationId} claim failed: Not found or not AVAILABLE`);
            return next(new AppError_1.AppError('Donation not available for claiming', 400));
        }
        console.log(`Donation ${donationId} found and updated. Creating claim record...`);
        const claim = await Claim_1.default.findOneAndUpdate({ donationId: donationIdObj }, {
            ngoId: ngoIdObj,
            pickupMode,
            status: Claim_1.ClaimStatus.IN_PROGRESS
        }, { upsert: true, new: true, runValidators: true });
        console.log(`Claim record created/updated: ${claim._id}`);
        res.status(201).json(new ApiResponse_1.ApiResponse('Donation claimed successfully', { donation, claim }));
    }
    catch (error) {
        console.error('Error in claimDonation:', error);
        next(error);
    }
};
exports.claimDonation = claimDonation;
const assignVolunteer = async (req, res, next) => {
    try {
        const { donationId, volunteerEmail, volunteerId, volunteerName } = req.body;
        if (!donationId)
            return next(new AppError_1.AppError('Donation ID is required', 400));
        let volunteer;
        if (volunteerId && volunteerId !== 'broadcast') {
            volunteer = await User_1.default.findOne({ _id: volunteerId, role: User_1.UserRole.VOLUNTEER });
        }
        else if (volunteerEmail) {
            volunteer = await User_1.default.findOne({ email: volunteerEmail, role: User_1.UserRole.VOLUNTEER });
        }
        else if (volunteerName) {
            volunteer = await User_1.default.findOne({ name: volunteerName, role: User_1.UserRole.VOLUNTEER });
        }
        // Logic check: If volunteerId was meant to be specific but user not found
        if ((volunteerId || volunteerEmail || volunteerName) && !volunteer && volunteerId !== 'broadcast') {
            return next(new AppError_1.AppError('Volunteer not found', 404));
        }
        const donation = await Donation_1.default.findById(donationId);
        if (!donation)
            return next(new AppError_1.AppError('Donation not found', 404));
        if (donation.claimedByNGO?.toString() !== req.user._id.toString()) {
            return next(new AppError_1.AppError('Unauthorized', 403));
        }
        const isBroadcast = !volunteer;
        const taskStatus = isBroadcast ? VolunteerTask_1.TaskStatus.OPEN : VolunteerTask_1.TaskStatus.ASSIGNED;
        // Update Donation Status
        // If specific assignment -> VOLUNTEER_ASSIGNED
        // If broadcast -> remains CLAIMED_BY_NGO (waiting for pickup/assignment)
        if (!isBroadcast) {
            donation.status = Donation_1.DonationStatus.VOLUNTEER_ASSIGNED;
            donation.assignedVolunteer = volunteer._id;
            await donation.save();
        }
        // Update Claim
        await Claim_1.default.findOneAndUpdate({ donationId }, {
            pickupMode: Claim_1.PickupMode.VOLUNTEER,
            ngoId: req.user._id,
            volunteerId: volunteer ? volunteer._id : null
        }, { upsert: true });
        // Create/Update VolunteerTask
        await VolunteerTask_1.default.findOneAndUpdate({ donationId }, {
            ngoId: req.user._id,
            volunteerId: volunteer ? volunteer._id : null,
            status: taskStatus,
            assignedAt: new Date()
        }, { upsert: true, new: true });
        const message = isBroadcast
            ? 'Task broadcasted to all volunteers'
            : `Task assigned to ${volunteer.name}`;
        res.status(200).json(new ApiResponse_1.ApiResponse(message));
    }
    catch (error) {
        next(error);
    }
};
exports.assignVolunteer = assignVolunteer;
const uploadDistributionProof = async (req, res, next) => {
    try {
        const { donationId } = req.body;
        const imageUrls = req.files ? req.files.map(f => f.path) : [];
        console.log('uploadDistributionProof called');
        console.log('donationId:', donationId);
        console.log('req.files:', req.files);
        console.log('imageUrls:', imageUrls);
        if (imageUrls.length === 0)
            return next(new AppError_1.AppError('Please upload at least one proof image', 400));
        let claim = await Claim_1.default.findOne({ donationId, ngoId: req.user._id });
        if (!claim) {
            // Fallback: Check if the donation itself is claimed by this NGO
            const donation = await Donation_1.default.findById(donationId);
            if (!donation || donation.claimedByNGO?.toString() !== req.user._id.toString()) {
                return next(new AppError_1.AppError('Claim record not found and you are not the authorized NGO for this donation', 404));
            }
            // Create missing claim record on the fly
            claim = await Claim_1.default.create({
                donationId,
                ngoId: req.user._id,
                pickupMode: donation.assignedVolunteer ? Claim_1.PickupMode.VOLUNTEER : Claim_1.PickupMode.SELF,
                status: Claim_1.ClaimStatus.IN_PROGRESS
            });
            console.log('Created new claim:', claim._id);
        }
        claim.distributionProofImages = imageUrls;
        claim.status = Claim_1.ClaimStatus.COMPLETED;
        await claim.save();
        console.log('Claim saved with images:', claim.distributionProofImages);
        await Donation_1.default.findByIdAndUpdate(donationId, {
            status: Donation_1.DonationStatus.DISTRIBUTED,
            completedAt: new Date()
        });
        await VolunteerTask_1.default.findOneAndUpdate({ donationId }, {
            status: VolunteerTask_1.TaskStatus.DISTRIBUTED,
            distributedAt: new Date(),
            completedAt: new Date()
        });
        console.log('Distribution proof upload complete');
        res.status(200).json(new ApiResponse_1.ApiResponse('Distribution proof uploaded and rescue completed'));
    }
    catch (error) {
        console.error('Error in uploadDistributionProof:', error);
        next(error);
    }
};
exports.uploadDistributionProof = uploadDistributionProof;
const getMyClaims = async (req, res, next) => {
    try {
        const donations = await Donation_1.default.find({ claimedByNGO: req.user._id })
            .populate('donorId', 'name email phone')
            .populate('assignedVolunteer', 'name email phone')
            .sort({ updatedAt: -1 });
        res.status(200).json(new ApiResponse_1.ApiResponse('Claimed donations fetched successfully', donations));
    }
    catch (error) {
        next(error);
    }
};
exports.getMyClaims = getMyClaims;
