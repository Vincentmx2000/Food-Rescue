import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
    donorId: mongoose.Types.ObjectId;
    ngoId: mongoose.Types.ObjectId;
    donationId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const feedbackSchema = new Schema<IFeedback>(
    {
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, unique: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
