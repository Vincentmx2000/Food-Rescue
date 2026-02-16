"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidator = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required').trim(),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role')
        .customSanitizer(value => value ? value.toUpperCase() : value)
        .isIn(['DONOR', 'NGO', 'VOLUNTEER', 'ADMIN']).withMessage('Invalid role'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone number is required'),
];
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
