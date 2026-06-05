import User from '../models/User.js';
import Donation from '../models/Donation.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../utils/notifHelper.js';
import { NotificationType } from '../models/Notification.js';

export const getPlatformStats = async (req, res, next) => {
    try {
        const totalDonations = await Donation.countDocuments();
        const totalUsers = await User.countDocuments();
        const activeDonations = await Donation.countDocuments({ 
            status: { $nin: ['DISTRIBUTED', 'CANCELLED'] } 
        });
        const completedDonations = await Donation.countDocuments({ 
            status: 'DISTRIBUTED' 
        });

        res.status(200).json(new ApiResponse('Platform stats fetched', {
            totalDonations,
            totalUsers,
            activeDonations,
            completedDonations
        }));
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await User.countDocuments();

        res.status(200).json(new ApiResponse('Users fetched successfully', {
            users,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
};

export const toggleUserBlock = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return next(new AppError('User not found', 404));

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json(new ApiResponse(`User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`));
    } catch (error) {
        next(error);
    }
};

export const getAllDonations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const donations = await Donation.find().populate('donorId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Donation.countDocuments();

        res.status(200).json(new ApiResponse('All donations fetched successfully', {
            donations,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
};

export const toggleUserVerification = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return next(new AppError('User not found', 404));

        user.isVerified = !user.isVerified;
        await user.save();

        if (user.isVerified) {
            // NOTIFICATION: Notify User
            await createNotification(
                user._id,
                NotificationType.USER_VERIFIED,
                'Account Verified',
                'Your account has been verified by the administrator. You can now fully participate in food rescue missions!',
                user.role === 'NGO' ? '/ ngo/dashboard' : '/volunteer/dashboard',
                req.user._id
            );
        }

        res.status(200).json(new ApiResponse(`User ${user.isVerified ? 'verified' : 'unverified'} successfully`, { user }));
    } catch (error) {
        next(error);
    }
};
