"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonationValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createDonationValidator = [
    (0, express_validator_1.body)('foodType').notEmpty().withMessage('Food type is required'),
    (0, express_validator_1.body)('quantity').isNumeric().withMessage('Quantity must be a number'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit is required'),
    (0, express_validator_1.body)('expiryTime').isISO8601().withMessage('Valid expiry time is required'),
    (0, express_validator_1.body)('address').notEmpty().withMessage('Address is required'),
    (0, express_validator_1.body)('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    (0, express_validator_1.body)('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
];
