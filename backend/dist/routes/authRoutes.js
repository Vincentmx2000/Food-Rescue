"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authValidator_1 = require("../validators/authValidator");
const validate_1 = require("../middlewares/validate");
const passport_1 = __importDefault(require("passport"));
const token_1 = require("../utils/token");
const router = (0, express_1.Router)();
router.post('/register', authValidator_1.registerValidator, validate_1.validate, authController_1.register);
router.post('/login', authValidator_1.loginValidator, validate_1.validate, authController_1.login);
router.post('/refresh-token', authController_1.refreshToken);
router.post('/logout', authController_1.logout);
// Social Auth - Google
router.get('/google', (req, res, next) => {
    const { role } = req.query;
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        state: role
    })(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login?error=social_failed' }), async (req, res) => {
    const user = req.user;
    const accessToken = (0, token_1.generateAccessToken)(user._id.toString(), user.role);
    const refreshToken = (0, token_1.generateRefreshToken)(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Redirect to frontend with access token in URL (or handled via cookie)
    // For simplicity, redirecting to a success page that handles the token
    res.redirect(`${process.env.CORS_ORIGIN}/social-success?token=${accessToken}&role=${user.role}&name=${encodeURIComponent(user.name)}`);
});
// Social Auth - Facebook
router.get('/facebook', (req, res, next) => {
    const { role } = req.query;
    passport_1.default.authenticate('facebook', {
        scope: ['email'],
        state: role
    })(req, res, next);
});
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false, failureRedirect: '/login?error=social_failed' }), async (req, res) => {
    const user = req.user;
    const accessToken = (0, token_1.generateAccessToken)(user._id.toString(), user.role);
    const refreshToken = (0, token_1.generateRefreshToken)(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.CORS_ORIGIN}/social-success?token=${accessToken}&role=${user.role}&name=${encodeURIComponent(user.name)}`);
});
exports.default = router;
