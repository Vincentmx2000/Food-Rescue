import mongoose, { Schema, Document } from 'mongoose';

export enum DonationStatus {
    AVAILABLE = 'AVAILABLE', // Was POSTED
    CLAIMED_BY_NGO = 'CLAIMED_BY_NGO', // Was CLAIMED
    VOLUNTEER_ASSIGNED = 'VOLUNTEER_ASSIGNED', // Was ASSIGNED
    PICKED_UP = 'PICKED_UP',
    DISTRIBUTED = 'DISTRIBUTED',
    CANCELLED = 'CANCELLED',
}

export interface IDonation extends Document {
    donorId: mongoose.Types.ObjectId;
    foodType: string;
    quantity: number;
    unit: string;
    expiryTime: Date;
    images: string[];
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    address: string;
    description: string;
    status: DonationStatus;
    claimedByNGO?: mongoose.Types.ObjectId;
    assignedVolunteer?: mongoose.Types.ObjectId;
    pickupTime?: Date;
    completedAt?: Date;
}

const donationSchema = new Schema<IDonation>(
    {
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        foodType: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'servings' },
        expiryTime: { type: Date, required: true },
        images: [{ type: String }],
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        address: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: Object.values(DonationStatus), default: DonationStatus.AVAILABLE },
        claimedByNGO: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedVolunteer: { type: Schema.Types.ObjectId, ref: 'User' },
        pickupTime: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

donationSchema.index({ location: '2dsphere' });

export default mongoose.model<IDonation>('Donation', donationSchema);
