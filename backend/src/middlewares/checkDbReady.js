import mongoose from 'mongoose';
import { waitForDatabase } from '../config/db.js';

/**
 * Middleware to check if MongoDB is connected before attempting DB operations.
 * During cold starts or brief reconnections, it waits up to 8 seconds for the
 * connection to complete rather than immediately rejecting requests with 503.
 * Only if the connection remains unestablished after the grace period does it
 * return an actionable 503 response.
 */
export const checkDbReady = async (req, res, next) => {
    // 1. Fast path: if already connected, proceed immediately
    if (mongoose.connection.readyState === 1) {
        return next();
    }

    // 2. Cold-start / Reconnecting path: wait up to 8 seconds for connection to establish
    try {
        const isReady = await waitForDatabase(8000);
        if (isReady) {
            return next();
        }
    } catch {
        // Fall through to 503 response
    }

    // 3. Database is still unavailable after waiting
    res.setHeader('Retry-After', '5');
    return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify backend database configuration.',
        code: 'DB_UNAVAILABLE',
        retryAfter: 5,
    });
};
