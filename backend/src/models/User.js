import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserRole = {
    DONOR: 'DONOR',
    NGO: 'NGO',
    VOLUNTEER: 'VOLUNTEER',
    ADMIN: 'ADMIN',
};

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, select: false },
        googleId: { type: String, unique: true, sparse: true },
        facebookId: { type: String, unique: true, sparse: true },
        role: { type: String, enum: Object.values(UserRole), default: UserRole.DONOR },
        phone: { type: String },
        altPhone: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        landmark: { type: String },
        organization: { type: String },
        preferredTime: { type: String },
        ngoType: { type: String },
        establishedYear: { type: String },
        serviceArea: { type: String },
        activeWorkers: { type: String },
        availableDays: [{ type: String }],
        transportMode: { type: String },
        isVerified: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
        refreshToken: { type: String, select: false },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
