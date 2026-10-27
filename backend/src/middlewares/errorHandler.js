import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // 1. Mongoose Database Connectivity & Timeout Errors
    if (
        err.name === 'MongooseServerSelectionError' ||
        err.name === 'MongoNetworkError' ||
        err.name === 'MongoTimeoutError' ||
        err.name === 'MongoServerSelectionError' ||
        (err.message && err.message.includes('buffering timed out'))
    ) {
        console.error('❌ [Database Request Failure]:', err.message);
        return res.status(503).json({
            success: false,
            message: 'Database service is temporarily unavailable. Please try again in a few moments.',
            code: 'DB_UNAVAILABLE'
        });
    }

    // 2. Mongoose Bad ObjectId / Cast Error
    if (err.name === 'CastError') {
        const message = `Invalid resource identifier: ${err.value}`;
        error = new AppError(message, 400);
    }

    // 3. Mongoose Duplicate Key Error (e.g. unique email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const message = `An account with this ${field} already exists.`;
        error = new AppError(message, 400);
    }

    // 4. Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map(e => e.message);
        const message = messages.length > 0 ? messages.join('. ') : 'Invalid input data';
        error = new AppError(message, 400);
    }

    // 5. JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid authentication token. Please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new AppError('Your session has expired. Please log in again.', 401);
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            stack: err.stack,
            error: err,
        });
    } else {
        // Production
        if (error.isOperational) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        } else {
            console.error('ERROR [Unhandled]:', err);
            res.status(error.statusCode >= 500 ? 500 : error.statusCode).json({
                success: false,
                message: error.statusCode >= 500 ? 'Something went wrong on the server!' : error.message,
            });
        }
    }
};

