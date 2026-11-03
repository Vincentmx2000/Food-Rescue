import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../src/utils/token.js';
import { UserRole } from '../src/models/User.js';

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
    console.log('=== RUNNING AUTHENTICATION & ROLE VALIDATION TESTS ===\n');

    // Test 1: Supported User Roles
    await test('Supported Roles - DONOR, NGO, VOLUNTEER, ADMIN are all valid enums', () => {
        assert.equal(UserRole.DONOR, 'DONOR');
        assert.equal(UserRole.NGO, 'NGO');
        assert.equal(UserRole.VOLUNTEER, 'VOLUNTEER');
        assert.equal(UserRole.ADMIN, 'ADMIN');
        assert.equal(Object.keys(UserRole).length, 4);
    });

    // Test 2: Token Generation and Expiry
    await test('Token Generation - Produces valid JWT containing userId and role', () => {
        const dummyId = '660000000000000000000001';
        const role = 'DONOR';
        const token = generateAccessToken(dummyId, role);
        assert.ok(typeof token === 'string' && token.length > 20);

        const decoded = jwt.decode(token);
        assert.equal(decoded.id, dummyId);
        assert.equal(decoded.role, role);
        assert.ok(decoded.exp > decoded.iat, 'Token should have future expiration');
    });

    // Test 3: Refresh Token Generation
    await test('Refresh Token - Produces valid JWT containing userId', () => {
        const dummyId = '660000000000000000000002';
        const token = generateRefreshToken(dummyId);
        const decoded = jwt.decode(token);
        assert.equal(decoded.id, dummyId);
        assert.ok(decoded.exp > decoded.iat);
    });

    // Test 4: Password Hashing and Comparison
    await test('Password Security - Hashes passwords with salt and verifies candidate', async () => {
        const plainPassword = 'CorrectHorseBatteryStaple!2026';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainPassword, salt);

        assert.notEqual(plainPassword, hash);
        const match = await bcrypt.compare(plainPassword, hash);
        assert.equal(match, true);

        const wrongMatch = await bcrypt.compare('WrongPasswordHere', hash);
        assert.equal(wrongMatch, false);
    });

    // Test 5: Role Authorization Middleware simulation
    await test('Role Authorization - Allows matching roles and blocks disallowed roles', () => {
        const mockAuthorize = (...allowed) => (userRole) => allowed.map(r => r.toLowerCase()).includes(userRole.toLowerCase());

        const ngoAuth = mockAuthorize('NGO', 'ADMIN');
        assert.equal(ngoAuth('NGO'), true);
        assert.equal(ngoAuth('ngo'), true);
        assert.equal(ngoAuth('admin'), true);
        assert.equal(ngoAuth('donor'), false);
        assert.equal(ngoAuth('volunteer'), false);

        const donorAuth = mockAuthorize('DONOR');
        assert.equal(donorAuth('donor'), true);
        assert.equal(donorAuth('ngo'), false);
    });

    console.log(`\n=== AUTH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error('Fatal auth test error:', err);
    process.exit(1);
});

