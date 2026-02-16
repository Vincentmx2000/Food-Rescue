"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const User_1 = __importStar(require("../models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    callbackURL: '/api/v1/auth/google/callback',
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User_1.default.findOne({ googleId: profile.id });
        if (!user) {
            // Check if user exists with same email
            user = await User_1.default.findOne({ email: profile.emails?.[0].value });
            if (user) {
                user.googleId = profile.id;
                await user.save();
            }
            else {
                // Get role from state if possible, default to DONOR
                const role = req.query.state || User_1.UserRole.DONOR;
                user = await User_1.default.create({
                    name: profile.displayName,
                    email: profile.emails?.[0].value,
                    googleId: profile.id,
                    role: role,
                    isVerified: true,
                });
            }
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID || 'dummy',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy',
    callbackURL: '/api/v1/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'],
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User_1.default.findOne({ facebookId: profile.id });
        if (!user) {
            user = await User_1.default.findOne({ email: profile.emails?.[0].value });
            if (user) {
                user.facebookId = profile.id;
                await user.save();
            }
            else {
                const role = req.query.state || User_1.UserRole.DONOR;
                user = await User_1.default.create({
                    name: profile.displayName,
                    email: profile.emails?.[0].value,
                    facebookId: profile.id,
                    role: role,
                    isVerified: true,
                });
            }
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
