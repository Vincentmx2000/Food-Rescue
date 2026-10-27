import jwt from 'jsonwebtoken';

const getAccessSecret = () =>
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'food_rescue_default_access_secret_2026';

const getRefreshSecret = () =>
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'food_rescue_default_refresh_secret_2026';

export const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        getAccessSecret(),
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
};

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        getRefreshSecret(),
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

