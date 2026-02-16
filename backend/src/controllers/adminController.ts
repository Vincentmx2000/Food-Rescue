import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Donation from '../models/Donation';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';

export const getPlatformStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalDonations = await Donation.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalNGOs = await User.countDocuments({ role: 'NGO' });
        const totalDonors = await User.countDocuments({ role: 'DONOR' });
        const totalVolunteers = await User.countDocuments({ role: 'VOLUNTEER' });

        res.status(200).json(new ApiResponse('Platform stats fetched', {
            totalDonations,
            totalUsers,
            totalNGOs,
            totalDonors,
            totalVolunteers,
        }));
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
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

export const toggleUserBlock = async (req: Request, res: Response, next: NextFunction) => {
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

export const getAllDonations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
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
