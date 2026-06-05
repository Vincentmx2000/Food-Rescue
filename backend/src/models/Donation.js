import mongoose, { Schema } from 'mongoose';

export const DonationStatus = {
    AVAILABLE: 'AVAILABLE',
    CLAIMED_BY_NGO: 'CLAIMED_BY_NGO',
    VOLUNTEER_ASSIGNED: 'VOLUNTEER_ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    DISTRIBUTED: 'DISTRIBUTED',
    CANCELLED: 'CANCELLED',
};

const donationSchema = new Schema(
    {
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        foodCategory: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
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
        claimedAt: { type: Date },
        volunteerAssignedAt: { type: Date },
        pickedUpAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

donationSchema.index({ location: '2dsphere' });

export default mongoose.model('Donation', donationSchema);
