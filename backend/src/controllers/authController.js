import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, address, organization } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email already exists', 400));
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role.toUpperCase(),
            phone,
            address,
            organization,
        });

        // Generate tokens for immediate login after registration
        const accessToken = generateAccessToken(user._id.toString(), user.role);
        const refreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json(new ApiResponse('User registered successfully', {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken,
        }));
    } catch (error) {
        next(error);
    }
};


export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid email or password', 401));
        }

        if (user.isBlocked) {
            return next(new AppError('Account is blocked', 403));
        }

        const accessToken = generateAccessToken(user._id.toString(), user.role);
        const refreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json(new ApiResponse('Login successful', {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken,
        }));

    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    const token = req.cookies.refresh_token;

    if (!token) {
        return next(new AppError('No refresh token provided', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== token) {
            return next(new AppError('Invalid refresh token', 401));
        }

        const accessToken = generateAccessToken(user._id.toString(), user.role);
        const newRefreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json(new ApiResponse('Token refreshed', { accessToken }));
    } catch (error) {
        next(new AppError('Invalid refresh token', 401));
    }
};

export const logout = async (req, res, next) => {
    const token = req.cookies.refresh_token;
    if (token) {
        const decoded = jwt.decode(token);
        if (decoded) {
            await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
        }
    }

    res.clearCookie('refresh_token');
    res.status(200).json(new ApiResponse('Logged out successfully'));
};
