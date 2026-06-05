import mongoose, { Schema } from 'mongoose';

const feedbackSchema = new Schema(
    {
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, unique: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
