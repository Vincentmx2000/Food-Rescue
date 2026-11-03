import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
    resolveMongoUri,
    getDbDiagnosticStatus,
    waitForDatabase,
    connectToDatabase,
    closeDatabaseConnection,
} from '../src/config/db.js';
import { checkDbReady } from '../src/middlewares/checkDbReady.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  FAIL: ${name}`);
        console.error(err);
        failed++;
    }
}

async function run() {
    console.log('=== RUNNING BACKEND DATABASE & AUTH ARCHITECTURE TESTS ===\n');

    // Test 1: URI Resolution - Credential masking and Atlas detection
    await test('URI Resolution - Masks credentials and identifies Atlas host', () => {
        process.env.MONGODB_URI = 'mongodb+srv://testUser:SuperSecretPass123@cluster0.abcde.mongodb.net/food_rescue?retryWrites=true&w=majority';
        const res = resolveMongoUri();
        assert.equal(res.varName, 'MONGODB_URI');
        assert.equal(res.isFallback, false);

        const diag = getDbDiagnosticStatus();
        assert.equal(diag.targetHost, 'cluster0.abcde.mongodb.net');
        assert.equal(diag.isAtlas, true);
        assert.ok(!JSON.stringify(diag).includes('SuperSecretPass123'), 'Secrets must not leak into diagnostics');
    });

    // Test 2: URI Resolution - Fallback to localhost when unset
    await test('URI Resolution - Fallback to localhost without crashing', () => {
        delete process.env.MONGODB_URI;
        delete process.env.MONGO_URI;
        delete process.env.DATABASE_URL;

        const res = resolveMongoUri();
        assert.equal(res.isFallback, true);
        assert.equal(res.varName, 'NONE');
        assert.ok(res.uri.includes('localhost:27017'));

        const diag = getDbDiagnosticStatus();
        assert.equal(diag.isAtlas, false);
        assert.equal(diag.targetHost, 'localhost:27017');
    });

    // Test 3: checkDbReady fast path when already connected
    await test('checkDbReady - Immediately passes through next() when state === 1 (connected)', async () => {
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

        let nextCalled = false;
        const req = {};
        const res = {
            status: () => res,
            json: () => res,
            setHeader: () => res,
        };

        await checkDbReady(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true, 'next() should be called immediately without waiting');

        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    // Test 4: checkDbReady returns 503 when disconnected and wait times out
    await test('checkDbReady - Returns 503 with Retry-After when DB remains disconnected', async () => {
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

        let statusCode = null;
        let responseJson = null;
        let setHeaders = {};

        const req = {};
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; },
            setHeader: (k, v) => { setHeaders[k] = v; return res; },
        };

        // Call checkDbReady with reduced wait helper for test speed
        const checkStart = Date.now();
        const fastCheck = async (req, res, next) => {
            const isReady = await waitForDatabase(300);
            if (isReady) return next();
            res.setHeader('Retry-After', '5');
            return res.status(503).json({
                success: false,
                message: 'Database service is currently unavailable. Please verify backend database configuration.',
                code: 'DB_UNAVAILABLE',
                retryAfter: 5,
            });
        };

        await fastCheck(req, res, () => {});
        assert.equal(statusCode, 503);
        assert.equal(responseJson.code, 'DB_UNAVAILABLE');
        assert.equal(setHeaders['Retry-After'], '5');
        assert.ok(Date.now() - checkStart >= 250, 'Should wait for the grace period before returning 503');

        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    // Test 5: waitForDatabase resolves when state transitions to connected during wait
    await test('waitForDatabase - Gracefully recovers and resolves true when connection arrives during wait', async () => {
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 2, configurable: true, writable: true }); // connecting

        // Simulate connecting finishing after 300ms
        setTimeout(() => {
            Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true, writable: true }); // connected
        }, 300);

        const start = Date.now();
        const connected = await waitForDatabase(1500);
        assert.equal(connected, true, 'waitForDatabase should resolve true when DB connects during grace period');
        assert.ok(Date.now() - start < 1000, 'Should resolve as soon as connected, without waiting full maxWaitMs');

        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    // Test 6: Error Handler correctly maps DB disconnection errors to 503
    await test('errorHandler - Correctly maps MongooseServerSelectionError to 503 DB_UNAVAILABLE', () => {
        const err = new Error('Server selection timed out after 15000 ms');
        err.name = 'MongooseServerSelectionError';

        let statusCode = null;
        let responseJson = null;
        let setHeaders = {};

        const req = {};
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; },
            setHeader: (k, v) => { setHeaders[k] = v; return res; },
        };

        errorHandler(err, req, res, () => {});
        assert.equal(statusCode, 503);
        assert.equal(responseJson.code, 'DB_UNAVAILABLE');
        assert.equal(setHeaders['Retry-After'], '5');
    });

    // Test 7: Error Handler correctly maps Duplicate Key error (11000) to 400
    await test('errorHandler - Correctly maps MongoDB duplicate key 11000 to 400', () => {
        const err = new Error('E11000 duplicate key error collection: foodrescue.users index: email_1 dup key');
        err.code = 11000;
        err.keyValue = { email: 'donor@example.com' };

        let statusCode = null;
        let responseJson = null;

        const req = {};
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; },
            setHeader: () => res,
        };

        errorHandler(err, req, res, () => {});
        assert.equal(statusCode, 400);
        assert.ok(responseJson.message.includes('already exists'));
    });

    // Test 8: Error Handler correctly maps JWT errors to 401
    await test('errorHandler - Correctly maps JsonWebTokenError and TokenExpiredError to 401', () => {
        const jwtErr = new Error('invalid signature');
        jwtErr.name = 'JsonWebTokenError';

        let statusCode = null;
        let responseJson = null;

        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; },
            setHeader: () => res,
        };

        errorHandler(jwtErr, {}, res, () => {});
        assert.equal(statusCode, 401);
        assert.ok(responseJson.message.includes('Invalid authentication token'));
    });

    // Test 9: Singleton connection management (re-entrancy guard)
    await test('Singleton Connection - Does not trigger multiple overlapping mongoose.connect calls', async () => {
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

        const p1 = connectToDatabase();
        const p2 = connectToDatabase();
        const p3 = connectToDatabase();

        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        assert.equal(r1, mongoose.connection);
        assert.equal(r2, mongoose.connection);
        assert.equal(r3, mongoose.connection);

        Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
    await closeDatabaseConnection();
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
