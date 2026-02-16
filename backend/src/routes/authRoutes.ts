import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController';
import { registerValidator, loginValidator } from '../validators/authValidator';
import { validate } from '../middlewares/validate';
import passport from 'passport';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Social Auth - Google
router.get('/google', (req, res, next) => {
    const { role } = req.query;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: role as string
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=social_failed' }),
    async (req: any, res) => {
        const user = req.user;
        const accessToken = generateAccessToken(user._id.toString(), user.role);
        const refreshToken = generateRefreshToken(user._id.toString());

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
    }
);

// Social Auth - Facebook
router.get('/facebook', (req, res, next) => {
    const { role } = req.query;
    passport.authenticate('facebook', {
        scope: ['email'],
        state: role as string
    })(req, res, next);
});

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=social_failed' }),
    async (req: any, res) => {
        const user = req.user;
        const accessToken = generateAccessToken(user._id.toString(), user.role);
        const refreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.CORS_ORIGIN}/social-success?token=${accessToken}&role=${user.role}&name=${encodeURIComponent(user.name)}`);
    }
);

export default router;
