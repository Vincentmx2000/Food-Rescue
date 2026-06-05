import Notification from '../models/Notification.js';

export const createNotification = async (
    recipient,
    type,
    title,
    message,
    link,
    sender
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
