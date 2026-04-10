import { Request, Response, NextFunction } from 'express';
import Feedback from '../models/Feedback';
import Donation, { DonationStatus } from '../models/Donation';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { createNotification } from '../utils/notifHelper';
import { NotificationType } from '../models/Notification';

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { donationId, rating, comment } = req.body;
        const ngoId = (req as any).user._id;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return next(new AppError('Donation not found', 404));
        }

        if (donation.status !== DonationStatus.DISTRIBUTED) {
            return next(new AppError('Feedback can only be given for distributed donations', 400));
        }

        if (donation.claimedByNGO?.toString() !== ngoId.toString()) {
            return next(new AppError('You are not authorized to give feedback for this donation', 403));
        }

        const existingFeedback = await Feedback.findOne({ donationId });
        if (existingFeedback) {
            return next(new AppError('Feedback already submitted for this donation', 400));
        }

        const feedback = await Feedback.create({
            donorId: donation.donorId,
            ngoId,
            donationId,
            rating,
            comment,
        });

        // NOTIFICATION: Notify Donor
        await createNotification(
            donation.donorId,
            NotificationType.FEEDBACK_RECEIVED,
            'New Feedback Received',
            `${(req as any).user.organization || (req as any).user.name} gave you a ${rating}-star rating for your donation.`,
            '/donor/history',
            ngoId
        );

        res.status(201).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

export const getDonorFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const donorId = req.params.donorId;
        const feedback = await Feedback.find({ donorId })
            .populate('ngoId', 'name organization')
            .sort('-createdAt');

        const stats = await Feedback.aggregate([
            { $match: { donorId: new (require('mongoose')).Types.ObjectId(donorId) } },
            {
                $group: {
                    _id: '$donorId',
                    averageRating: { $avg: '$rating' },
                    totalFeedback: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                feedback,
                stats: stats[0] || { averageRating: 0, totalFeedback: 0 },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getMyFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const donorId = (req as any).user._id;
        const feedback = await Feedback.find({ donorId })
            .populate('ngoId', 'name organization')
            .sort('-createdAt');

        const stats = await Feedback.aggregate([
            { $match: { donorId: donorId } },
            {
                $group: {
                    _id: '$donorId',
                    averageRating: { $avg: '$rating' },
                    totalFeedback: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                feedback,
                stats: stats[0] || { averageRating: 0, totalFeedback: 0 },
            },
        });
    } catch (error) {
        next(error);
    }
};
