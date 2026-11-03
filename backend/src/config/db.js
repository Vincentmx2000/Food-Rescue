import mongoose from 'mongoose';

/**
 * Diagnostic state tracker for database connectivity.
 * Never stores or exposes raw credentials.
 */
const dbDiagnostics = {
    configuredVar: null,
    targetHost: 'unknown',
    isAtlas: false,
    isConnected: false,
    state: 'disconnected',
    attempts: 0,
    lastError: null,
    lastConnectedAt: null,
};

let connectionPromise = null;
let retryTimeout = null;
let isShuttingDown = false;

/**
 * Resolve and sanitize the MongoDB URI from supported environment variables.
 * Checks MONGODB_URI, MONGO_URI, and DATABASE_URL in order of priority.
 */
export const resolveMongoUri = () => {
    let rawUri = process.env.MONGODB_URI;
    let varName = 'MONGODB_URI';

    if (!rawUri && process.env.MONGO_URI) {
        rawUri = process.env.MONGO_URI;
        varName = 'MONGO_URI';
    } else if (!rawUri && process.env.DATABASE_URL) {
        rawUri = process.env.DATABASE_URL;
        varName = 'DATABASE_URL';
    }

    if (!rawUri) {
        dbDiagnostics.configuredVar = 'NONE (fallback localhost)';
        dbDiagnostics.targetHost = 'localhost:27017';
        dbDiagnostics.isAtlas = false;
        return {
            uri: 'mongodb://localhost:27017/food_rescue',
            varName: 'NONE',
            isFallback: true,
        };
    }

    // Strip accidental wrapping quotes or whitespace commonly introduced in web dashboards
    const cleanUri = rawUri.trim().replace(/^["']|["']$/g, '');
    dbDiagnostics.configuredVar = varName;

    // Safely extract target host for diagnostics without exposing credentials
    try {
        const atIndex = cleanUri.indexOf('@');
        if (atIndex !== -1) {
            const hostAndPath = cleanUri.substring(atIndex + 1);
            const slashIndex = hostAndPath.indexOf('/');
            const qIndex = hostAndPath.indexOf('?');
            const endHost = slashIndex !== -1 ? slashIndex : (qIndex !== -1 ? qIndex : hostAndPath.length);
            dbDiagnostics.targetHost = hostAndPath.substring(0, endHost);
        } else {
            const match = cleanUri.match(/mongodb(?:\+srv)?:\/\/([^/?]+)/);
            dbDiagnostics.targetHost = match ? match[1] : 'unknown';
        }
    } catch {
        dbDiagnostics.targetHost = 'configured-host';
    }

    dbDiagnostics.isAtlas = cleanUri.includes('.mongodb.net');

    return {
        uri: cleanUri,
        varName,
        isFallback: false,
    };
};

/**
 * Categorize error and provide actionable advice without leaking sensitive credentials.
 */
const analyzeMongoError = (error) => {
    const msg = error?.message || '';
    const errCode = error?.code || '';

    if (msg.includes('querySrv ENOTFOUND') || errCode === 'ENOTFOUND') {
        return {
            code: 'DNS_ENOTFOUND_CLUSTER_PAUSED_OR_INVALID',
            summary: `DNS SRV record lookup failed for host '${dbDiagnostics.targetHost}'.`,
            actionRecommendation: 'MongoDB Atlas hostname could not be found via DNS. If using a free-tier M0 cluster, Atlas automatically pauses clusters after inactivity (removing DNS records). Log into cloud.mongodb.com and click Resume on your cluster.',
        };
    }

    if (msg.includes('bad auth') || msg.includes('Authentication failed') || errCode === 18) {
        return {
            code: 'AUTH_FAILED',
            summary: 'Database authentication failed.',
            actionRecommendation: 'Check your database username and password in Render environment variables. Ensure special characters in the password are URL-encoded (e.g. @ as %40).',
        };
    }

    if (msg.includes('serverSelectionTimeoutMS') || msg.includes('timed out') || msg.includes('ETIMEDOUT')) {
        return {
            code: 'CONNECTION_TIMEOUT',
            summary: `Connection to host '${dbDiagnostics.targetHost}' timed out.`,
            actionRecommendation: 'Verify MongoDB Atlas Network Access whitelist: ensure 0.0.0.0/0 (Allow Access from Anywhere) is configured, as Render instances use dynamic IP addresses.',
        };
    }

    if (msg.includes('ECONNREFUSED') && dbDiagnostics.targetHost.includes('localhost')) {
        return {
            code: 'LOCALHOST_UNREACHABLE',
            summary: 'Attempted to connect to localhost:27017, but no local MongoDB service is running.',
            actionRecommendation: 'Production backend requires a remote database. Please configure MONGODB_URI in your Render service environment variables pointing to MongoDB Atlas.',
        };
    }

    return {
        code: 'CONNECTION_FAILED',
        summary: msg,
        actionRecommendation: 'Please verify database URI format, user credentials, and Atlas cluster network access.',
    };
};

/**
 * Single reusable MongoDB connection manager.
 * Prevents multiple simultaneous connection attempts and guarantees a singleton lifecycle.
 */
export const connectToDatabase = async (attempt = 1) => {
    if (isShuttingDown) return;

    // If already connected, return the existing connection
    if (mongoose.connection.readyState === 1) {
        dbDiagnostics.isConnected = true;
        dbDiagnostics.state = 'connected';
        return mongoose.connection;
    }

    // If a connection attempt is actively in-flight, return the existing promise
    if (connectionPromise) {
        return connectionPromise;
    }

    const { uri, varName, isFallback } = resolveMongoUri();
    dbDiagnostics.attempts = attempt;

    if (isFallback && process.env.NODE_ENV === 'production') {
        console.warn('[MongoDB Warning] Neither MONGODB_URI nor MONGO_URI found in environment variables. Falling back to localhost in production!');
    } else {
        console.log(`[MongoDB] Connecting using '${varName}' to '${dbDiagnostics.targetHost}' (attempt ${attempt})...`);
    }

    connectionPromise = (async () => {
        try {
            await mongoose.connect(uri, {
                // High enough for cloud cold starts and TLS handshakes
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                // Keep-alive and pool settings for stability across cloud firewalls
                socketTimeoutMS: 45000,
                heartbeatFrequencyMS: 10000,
                maxPoolSize: 10,
                minPoolSize: 1,
                family: 4, // Prefer IPv4 to avoid cloud IPv6 latency/DNS lookup failures
            });

            dbDiagnostics.isConnected = true;
            dbDiagnostics.state = 'connected';
            dbDiagnostics.lastError = null;
            dbDiagnostics.lastConnectedAt = new Date().toISOString();
            if (retryTimeout) {
                clearTimeout(retryTimeout);
                retryTimeout = null;
            }
            console.log(`[MongoDB] Connection established successfully to '${dbDiagnostics.targetHost}'.`);
            return mongoose.connection;
        } catch (error) {
            const errorAnalysis = analyzeMongoError(error);
            dbDiagnostics.isConnected = false;
            dbDiagnostics.state = 'disconnected';
            dbDiagnostics.lastError = {
                ...errorAnalysis,
                rawMessage: error.message,
                timestamp: new Date().toISOString(),
            };

            console.error(`[MongoDB] Connection failed (attempt ${attempt}): ${error.message}`);
            console.error(`[MongoDB Diagnostic] ${errorAnalysis.actionRecommendation}`);

            if (!isShuttingDown) {
                // Exponential backoff with jitter, capped at 30 seconds
                const baseDelay = Math.min(attempt * 4000, 30000);
                const jitter = Math.floor(Math.random() * 1000);
                const delay = baseDelay + jitter;

                if (retryTimeout) clearTimeout(retryTimeout);
                console.log(`[MongoDB] Scheduling reconnection attempt in ${(delay / 1000).toFixed(1)}s...`);
                retryTimeout = setTimeout(() => {
                    retryTimeout = null;
                    connectToDatabase(attempt + 1).catch(() => {});
                }, delay);
            }

            throw error;
        } finally {
            connectionPromise = null;
        }
    })();

    return connectionPromise;
};

/**
 * Wait for the database connection to be ready.
 * Resolves to true if connected within maxWaitMs, or false if not.
 * Ensures incoming requests during a cold start do not fail immediately.
 */
export const waitForDatabase = async (maxWaitMs = 8000) => {
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    // Trigger connection if disconnected or not yet started
    if (mongoose.connection.readyState === 0 && !connectionPromise) {
        connectToDatabase().catch(() => {});
    }

    const startTime = Date.now();
    return new Promise((resolve) => {
        // Fast polling check every 150ms
        const interval = setInterval(() => {
            if (mongoose.connection.readyState === 1) {
                clearInterval(interval);
                return resolve(true);
            }
            if (Date.now() - startTime >= maxWaitMs) {
                clearInterval(interval);
                return resolve(mongoose.connection.readyState === 1);
            }
        }, 150);
    });
};

/**
 * Hook up Mongoose connection state listeners.
 */
export const initMongooseEvents = () => {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    mongoose.connection.on('connected', () => {
        dbDiagnostics.isConnected = true;
        dbDiagnostics.state = 'connected';
        dbDiagnostics.lastError = null;
        dbDiagnostics.lastConnectedAt = new Date().toISOString();
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        console.log('[MongoDB] Runtime connection event: connected.');
    });

    mongoose.connection.on('error', (err) => {
        const errorAnalysis = analyzeMongoError(err);
        dbDiagnostics.isConnected = false;
        dbDiagnostics.state = dbStates[mongoose.connection.readyState] || 'error';
        dbDiagnostics.lastError = {
            ...errorAnalysis,
            rawMessage: err.message,
            timestamp: new Date().toISOString(),
        };
        console.error('[MongoDB] Runtime connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        dbDiagnostics.isConnected = false;
        dbDiagnostics.state = 'disconnected';
        console.warn('[MongoDB] Runtime connection event: disconnected.');

        // Actively trigger reconnection if disconnected unexpectedly during runtime
        if (!isShuttingDown && !connectionPromise && !retryTimeout) {
            console.log('[MongoDB] Triggering automatic reconnection in 2s...');
            retryTimeout = setTimeout(() => {
                retryTimeout = null;
                connectToDatabase(1).catch(() => {});
            }, 2000);
        }
    });
};

/**
 * Returns safe diagnostic status for health check endpoints.
 */
export const getDbDiagnosticStatus = () => {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const currentMongooseState = dbStates[mongoose.connection.readyState] || 'unknown';

    return {
        isConnected: mongoose.connection.readyState === 1,
        state: currentMongooseState,
        configuredVar: dbDiagnostics.configuredVar,
        targetHost: dbDiagnostics.targetHost,
        isAtlas: dbDiagnostics.isAtlas,
        attempts: dbDiagnostics.attempts,
        lastError: dbDiagnostics.lastError,
        lastConnectedAt: dbDiagnostics.lastConnectedAt,
    };
};

/**
 * Clean up connections during graceful shutdown.
 */
export const closeDatabaseConnection = async () => {
    isShuttingDown = true;
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('[MongoDB] Connection closed cleanly.');
    }
};
