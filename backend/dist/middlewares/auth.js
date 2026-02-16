"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../utils/AppError");
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.access_token) {
        token = req.cookies.access_token;
    }
    if (!token) {
        console.log('No token provided in headers or cookies');
        return next(new AppError_1.AppError('You are not logged in! Please log in to get access.', 401));
    }
    try {
        console.log('Verifying token:', token.substring(0, 10) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log('Token decoded successfully for user:', decoded.id);
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            console.log('User not found for decoded ID:', decoded.id);
            return next(new AppError_1.AppError('The user belonging to this token no longer exists.', 401));
        }
        if (user.isBlocked) {
            return next(new AppError_1.AppError('Your account has been blocked. Please contact admin.', 403));
        }
        req.user = user;
        next();
    }
    catch (error) {
        return next(new AppError_1.AppError('Invalid token or token expired.', 401));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        if (!allowedRoles.includes(userRole)) {
            console.log(`Authorization failed: User role '${userRole}' not in allowed roles [${allowedRoles.join(', ')}]`);
            return next(new AppError_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.authorize = authorize;
