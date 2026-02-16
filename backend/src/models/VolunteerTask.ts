import mongoose, { Schema, Document } from 'mongoose';

export enum TaskStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    PICKED_UP = 'PICKED_UP',
    DISTRIBUTED = 'DISTRIBUTED',
    DELIVERED = 'DELIVERED', // For backward compatibility
    CANCELLED = 'CANCELLED',
}

export interface IVolunteerTask extends Document {
    donationId: mongoose.Types.ObjectId;
    ngoId: mongoose.Types.ObjectId;
    volunteerId?: mongoose.Types.ObjectId; // Optional for OPEN tasks
    status: TaskStatus;
    assignedAt?: Date;
    acceptedAt?: Date;
    pickedUpAt?: Date;
    distributedAt?: Date; // Was completedAt
    completedAt?: Date; // Keep for backward compat or generic completion
}

const volunteerTaskSchema = new Schema<IVolunteerTask>(
    {
        donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
        ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        volunteerId: { type: Schema.Types.ObjectId, ref: 'User' }, // Not required for OPEN
        status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.OPEN },
        assignedAt: { type: Date },
        acceptedAt: { type: Date },
        pickedUpAt: { type: Date },
        distributedAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IVolunteerTask>('VolunteerTask', volunteerTaskSchema);
