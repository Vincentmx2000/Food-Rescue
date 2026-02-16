"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DonationStatus;
(function (DonationStatus) {
    DonationStatus["AVAILABLE"] = "AVAILABLE";
    DonationStatus["CLAIMED_BY_NGO"] = "CLAIMED_BY_NGO";
    DonationStatus["VOLUNTEER_ASSIGNED"] = "VOLUNTEER_ASSIGNED";
    DonationStatus["PICKED_UP"] = "PICKED_UP";
    DonationStatus["DISTRIBUTED"] = "DISTRIBUTED";
    DonationStatus["CANCELLED"] = "CANCELLED";
})(DonationStatus || (exports.DonationStatus = DonationStatus = {}));
const donationSchema = new mongoose_1.Schema({
    donorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
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
    claimedByNGO: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignedVolunteer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    pickupTime: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });
donationSchema.index({ location: '2dsphere' });
exports.default = mongoose_1.default.model('Donation', donationSchema);
