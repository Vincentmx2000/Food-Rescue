import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_rescue';

// 1. Start the HTTP server immediately so Render detects port binding in <1s
// and health check endpoints respond without waiting on MongoDB.
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check ready at http://localhost:${PORT}/health`);
});

// Configure Mongoose connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established successfully.');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnection will be attempted...');
});

// 2. Connect to MongoDB with safe timeouts and exponential backoff retry
let retryTimeout = null;
const connectWithRetry = async (attempt = 1) => {
    try {
        console.log(`Attempting MongoDB connection (attempt ${attempt})...`);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
    } catch (error) {
        console.error(`MongoDB connection failed (attempt ${attempt}):`, error.message);
        console.error('Tip: Check MONGODB_URI in Render dashboard and ensure Network Access allows 0.0.0.0/0 on MongoDB Atlas.');
        // Retry with backoff (capped at 30 seconds), without exiting the process
        const delay = Math.min(attempt * 5000, 30000);
        console.log(`Scheduling MongoDB reconnection in ${delay / 1000}s...`);
        retryTimeout = setTimeout(() => connectWithRetry(attempt + 1), delay);
    }
};

connectWithRetry();

// Graceful shutdown handling
const gracefulShutdown = () => {
    console.log('Received shutdown signal. Closing HTTP server and DB connections...');
    if (retryTimeout) clearTimeout(retryTimeout);
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            console.log('Server and database connections closed cleanly.');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

