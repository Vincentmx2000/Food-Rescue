import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { checkDbReady } from './middlewares/checkDbReady.js';
import passport from './config/passport.js';

const app = express();

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// Robust CORS allowing production domain, Vercel preview domains, and local dev
const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : [];

const defaultAllowedOrigins = [
    'https://food-rescue-nine.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    ...configuredOrigins
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server, curl, mobile, or health checks with no origin
        if (!origin) return callback(null, true);

        // Check explicit list
        if (defaultAllowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow any vercel deployment preview
        try {
            const host = new URL(origin).hostname;
            if (host.endsWith('.vercel.app')) {
                return callback(null, true);
            }
        } catch (e) {
            // Ignore parse errors
        }

        // Allow origin
        return callback(null, true);
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoints (available on both root and API version paths)
const getHealth = (req, res) => {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = dbStates[mongoose.connection.readyState] || 'unknown';
    const isHealthy = mongoose.connection.readyState === 1;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'OK' : 'DEGRADED',
        server: 'up',
        database: dbState,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        message: isHealthy
            ? 'Food Rescue API is healthy'
            : 'Backend is up; database is currently initializing or reconnecting'
    });
};

app.get('/health', getHealth);
app.get('/api/v1/health', getHealth);

// Routes guarded by database readiness check so requests never hang indefinitely
app.use('/api/v1/auth', checkDbReady, authRoutes);
app.use('/api/v1/donations', checkDbReady, donationRoutes);
app.use('/api/v1/ngos', checkDbReady, ngoRoutes);
app.use('/api/v1/volunteers', checkDbReady, volunteerRoutes);
app.use('/api/v1/admin', checkDbReady, adminRoutes);
app.use('/api/v1/users', checkDbReady, userRoutes);
app.use('/api/v1/feedback', checkDbReady, feedbackRoutes);
app.use('/api/v1/notifications', checkDbReady, notificationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;

