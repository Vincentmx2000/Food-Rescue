import Notification, { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

export const createNotification = async (
    recipient: mongoose.Types.ObjectId | string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    sender?: mongoose.Types.ObjectId | string
) => {
    try {
        await Notification.create({
            recipient,
            type,
            title,
            message,
            link,
            sender
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};
