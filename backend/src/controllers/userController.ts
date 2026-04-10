import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id).select('name email role phone address organization isVerified');
        if (!user) {
            return next(new AppError('User not found', 404));
        }
        res.status(200).json(new ApiResponse('User profile fetched successfully', user));
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user || !(await user.comparePassword(currentPassword))) {
            return next(new AppError('Incorrect current password', 401));
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json(new ApiResponse('Password updated successfully'));
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // List of fields that are allowed to be updated
        const updateableFields = [
            'name', 'phone', 'altPhone', 'address', 'city', 'state',
            'landmark', 'organization', 'preferredTime', 'ngoType',
            'establishedYear', 'serviceArea', 'activeWorkers',
            'availableDays', 'transportMode'
        ];

        // Update user object with values from request body
        updateableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                (user as any)[field] = req.body[field];
            }
        });

        await user.save();

        res.status(200).json(new ApiResponse('Profile updated successfully', user));
    } catch (error) {
        next(error);
    }
};
