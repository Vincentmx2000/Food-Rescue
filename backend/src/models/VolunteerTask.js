import mongoose, { Schema } from 'mongoose';

export const TaskStatus = {
    OPEN: 'OPEN',
    ASSIGNED: 'ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    DISTRIBUTED: 'DISTRIBUTED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
};

const volunteerTaskSchema = new Schema(
    {
        donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
        ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        volunteerId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.OPEN },
        assignedAt: { type: Date },
        acceptedAt: { type: Date },
        pickedUpAt: { type: Date },
        distributedAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model('VolunteerTask', volunteerTaskSchema);
