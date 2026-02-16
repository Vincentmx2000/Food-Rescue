"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = require("../utils/AppError");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map(err => err.msg).join(', ');
        console.log('Validation Errors:', errors.array());
        return next(new AppError_1.AppError(message, 400));
    }
    next();
};
exports.validate = validate;
