import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
    DONATION_CLAIMED = 'donation_claimed',
    VOLUNTEER_ASSIGNED = 'volunteer_assigned',
    PICKED_UP = 'picked_up',
    DISTRIBUTED = 'distributed',
    FEEDBACK_RECEIVED = 'feedback_received',
    USER_VERIFIED = 'user_verified',
    SYSTEM_ALERT = 'system_alert'
}

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    sender: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    type: { 
        type: String, 
        enum: Object.values(NotificationType),
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    link: { 
        type: String 
    },
    read: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
