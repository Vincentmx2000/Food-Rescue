import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { ApiResponse } from '../utils/ApiResponse';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const notifications = await Notification.find({ recipient: (req.user as any)._id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.status(200).json(new ApiResponse('Notifications fetched', notifications));
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { id } = req.params;
        await Notification.findOneAndUpdate(
            { _id: id, recipient: (req.user as any)._id },
            { read: true }
        );
        res.status(200).json(new ApiResponse('Notification marked as read'));
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        await Notification.updateMany(
            { recipient: (req.user as any)._id, read: false },
            { read: true }
        );
        res.status(200).json(new ApiResponse('All notifications marked as read'));
    } catch (error) {
        next(error);
    }
};

export const clearNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        await Notification.deleteMany({ recipient: (req.user as any)._id });
        res.status(200).json(new ApiResponse('Notifications cleared'));
    } catch (error) {
        next(error);
    }
};
