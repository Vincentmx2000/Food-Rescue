import mongoose, { Schema } from 'mongoose';

export const PickupMode = {
    SELF: 'SELF',
    VOLUNTEER: 'VOLUNTEER',
};

export const ClaimStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const claimSchema = new Schema(
    {
        donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
        ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        pickupMode: { type: String, enum: Object.values(PickupMode), required: true },
        volunteerId: { type: Schema.Types.ObjectId, ref: 'User' },
        distributionProofImages: [{ type: String }],
        status: { type: String, enum: Object.values(ClaimStatus), default: ClaimStatus.PENDING },
    },
    { timestamps: true }
);

export default mongoose.model('Claim', claimSchema);
