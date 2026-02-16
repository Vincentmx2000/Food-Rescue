import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../models/User';

export const generateAccessToken = (userId: string, role: UserRole): string => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
    );
};

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
    );
};
