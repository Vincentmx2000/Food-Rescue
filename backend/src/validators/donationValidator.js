import { body } from 'express-validator';

export const createDonationValidator = [
    body('foodType').notEmpty().withMessage('Food type is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('unit').notEmpty().withMessage('Unit is required'),
    body('expiryTime').isISO8601().withMessage('Valid expiry time is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
];
