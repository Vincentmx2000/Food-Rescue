import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.access_token) {
        token = req.cookies.access_token;
    }

    if (!token) {
        console.log('No token provided in headers or cookies');
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        console.log('Verifying token:', token.substring(0, 10) + '...');
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log('Token decoded successfully for user:', decoded.id);
        const user = await User.findById(decoded.id);

        if (!user) {
            console.log('User not found for decoded ID:', decoded.id);
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        if (user.isBlocked) {
            return next(new AppError('Your account has been blocked. Please contact admin.', 403));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new AppError('Invalid token or token expired.', 401));
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            console.log(`Authorization failed: User role '${userRole}' not in allowed roles [${allowedRoles.join(', ')}]`);
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
