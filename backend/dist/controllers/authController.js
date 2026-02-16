"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const AppError_1 = require("../utils/AppError");
const ApiResponse_1 = require("../utils/ApiResponse");
const token_1 = require("../utils/token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, address, organization } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return next(new AppError_1.AppError('Email already exists', 400));
        }
        const user = await User_1.default.create({
            name,
            email,
            password,
            role: role.toUpperCase(),
            phone,
            address,
            organization,
        });
        // Generate tokens for immediate login after registration
        const accessToken = (0, token_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, token_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json(new ApiResponse_1.ApiResponse('User registered successfully', {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError_1.AppError('Please provide email and password', 400));
        }
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError_1.AppError('Invalid email or password', 401));
        }
        if (user.isBlocked) {
            return next(new AppError_1.AppError('Account is blocked', 403));
        }
        const accessToken = (0, token_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, token_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json(new ApiResponse_1.ApiResponse('Login successful', {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    const token = req.cookies.refresh_token;
    if (!token) {
        return next(new AppError_1.AppError('No refresh token provided', 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User_1.default.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            return next(new AppError_1.AppError('Invalid refresh token', 401));
        }
        const accessToken = (0, token_1.generateAccessToken)(user._id.toString(), user.role);
        const newRefreshToken = (0, token_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json(new ApiResponse_1.ApiResponse('Token refreshed', { accessToken }));
    }
    catch (error) {
        next(new AppError_1.AppError('Invalid refresh token', 401));
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res, next) => {
    const token = req.cookies.refresh_token;
    if (token) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded) {
            await User_1.default.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
        }
    }
    res.clearCookie('refresh_token');
    res.status(200).json(new ApiResponse_1.ApiResponse('Logged out successfully'));
};
exports.logout = logout;
