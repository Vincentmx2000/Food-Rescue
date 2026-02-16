import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import donationRoutes from './routes/donationRoutes';
import ngoRoutes from './routes/ngoRoutes';
import volunteerRoutes from './routes/volunteerRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middlewares/errorHandler';
import passport from './config/passport';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));
import path from 'path';

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/ngos', ngoRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Food Rescue API is healthy' });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
