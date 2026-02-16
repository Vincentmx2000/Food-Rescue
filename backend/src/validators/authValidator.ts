import { body } from 'express-validator';

export const registerValidator = [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .customSanitizer(value => value ? value.toUpperCase() : value)
        .isIn(['DONOR', 'NGO', 'VOLUNTEER', 'ADMIN']).withMessage('Invalid role'),
    body('phone').notEmpty().withMessage('Phone number is required'),
];

export const loginValidator = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];
