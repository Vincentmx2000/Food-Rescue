import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectToDatabase, initMongooseEvents, closeDatabaseConnection } from './config/db.js';

const PORT = process.env.PORT || 5000;

// 1. Initialize Mongoose connection event listeners
initMongooseEvents();

// 2. Start the HTTP server immediately so Render detects port binding in <1s
// and health check endpoints respond without waiting on MongoDB.
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check ready at http://localhost:${PORT}/health`);
});

// 3. Connect to MongoDB with safe timeouts, fallback support, and exponential backoff retry
connectToDatabase();

// Graceful shutdown handling
const gracefulShutdown = () => {
    console.log('Received shutdown signal. Closing HTTP server and DB connections...');
    server.close(async () => {
        await closeDatabaseConnection();
        console.log('Server and database connections closed cleanly.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


