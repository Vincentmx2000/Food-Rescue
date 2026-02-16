import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User, { UserRole } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
            callbackURL: '/api/v1/auth/google/callback',
            passReqToCallback: true,
        },
        async (req: any, accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Check if user exists with same email
                    user = await User.findOne({ email: profile.emails?.[0].value });

                    if (user) {
                        user.googleId = profile.id;
                        await user.save();
                    } else {
                        // Get role from state if possible, default to DONOR
                        const role = (req.query.state as UserRole) || UserRole.DONOR;

                        user = await User.create({
                            name: profile.displayName,
                            email: profile.emails?.[0].value,
                            googleId: profile.id,
                            role: role,
                            isVerified: true,
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID || 'dummy',
            clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy',
            callbackURL: '/api/v1/auth/facebook/callback',
            profileFields: ['id', 'displayName', 'emails'],
            passReqToCallback: true,
        },
        async (req: any, accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ facebookId: profile.id });

                if (!user) {
                    user = await User.findOne({ email: profile.emails?.[0].value });

                    if (user) {
                        user.facebookId = profile.id;
                        await user.save();
                    } else {
                        const role = (req.query.state as UserRole) || UserRole.DONOR;

                        user = await User.create({
                            name: profile.displayName,
                            email: profile.emails?.[0].value,
                            facebookId: profile.id,
                            role: role,
                            isVerified: true,
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
