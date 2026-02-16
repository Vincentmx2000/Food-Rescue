"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key';
let storage;
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    storage = new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.v2,
        params: async (req, file) => {
            return {
                folder: 'food-rescue',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            };
        },
    });
}
else {
    // Fallback to local disk storage
    const uploadDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    });
}
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
