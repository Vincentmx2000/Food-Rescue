import mongoose from 'mongoose';

/**
 * Middleware to check if MongoDB is connected before attempting DB operations.
 * Prevents requests from hanging indefinitely in Mongoose's internal buffer
 * when the database is unreachable or still connecting.
 */
export const checkDbReady = (req, res, next) => {
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const state = mongoose.connection.readyState;

    if (state === 1) {
        return next();
    }

    if (state === 2) {
        return res.status(503).json({
            success: false,
            message: 'The database is currently connecting. Please try again in a few moments.',
            code: 'DB_CONNECTING'
        });
    }

    return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify backend database configuration.',
        code: 'DB_UNAVAILABLE'
    });
};
