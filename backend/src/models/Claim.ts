import mongoose, { Schema, Document } from 'mongoose';

export enum PickupMode {
    SELF = 'SELF',
    VOLUNTEER = 'VOLUNTEER',
}

export enum ClaimStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface IClaim extends Document {
    donationId: mongoose.Types.ObjectId;
    ngoId: mongoose.Types.ObjectId;
    pickupMode: PickupMode;
    volunteerId?: mongoose.Types.ObjectId;
    distributionProofImages: string[];
    status: ClaimStatus;
}

const claimSchema = new Schema<IClaim>(
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

export default mongoose.model<IClaim>('Claim', claimSchema);
