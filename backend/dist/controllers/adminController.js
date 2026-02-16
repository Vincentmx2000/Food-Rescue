"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDonations = exports.toggleUserBlock = exports.getAllUsers = exports.getPlatformStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Donation_1 = __importDefault(require("../models/Donation"));
const ApiResponse_1 = require("../utils/ApiResponse");
const AppError_1 = require("../utils/AppError");
const getPlatformStats = async (req, res, next) => {
    try {
        const totalDonations = await Donation_1.default.countDocuments();
        const totalUsers = await User_1.default.countDocuments();
        const totalNGOs = await User_1.default.countDocuments({ role: 'NGO' });
        const totalDonors = await User_1.default.countDocuments({ role: 'DONOR' });
        const totalVolunteers = await User_1.default.countDocuments({ role: 'VOLUNTEER' });
        res.status(200).json(new ApiResponse_1.ApiResponse('Platform stats fetched', {
            totalDonations,
            totalUsers,
            totalNGOs,
            totalDonors,
            totalVolunteers,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.getPlatformStats = getPlatformStats;
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const users = await User_1.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await User_1.default.countDocuments();
        res.status(200).json(new ApiResponse_1.ApiResponse('Users fetched successfully', {
            users,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const toggleUserBlock = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user)
            return next(new AppError_1.AppError('User not found', 404));
        user.isBlocked = !user.isBlocked;
        await user.save();
        res.status(200).json(new ApiResponse_1.ApiResponse(`User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`));
    }
    catch (error) {
        next(error);
    }
};
exports.toggleUserBlock = toggleUserBlock;
const getAllDonations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const donations = await Donation_1.default.find().populate('donorId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Donation_1.default.countDocuments();
        res.status(200).json(new ApiResponse_1.ApiResponse('All donations fetched successfully', {
            donations,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.getAllDonations = getAllDonations;
