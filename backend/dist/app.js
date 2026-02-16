"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const donationRoutes_1 = __importDefault(require("./routes/donationRoutes"));
const ngoRoutes_1 = __importDefault(require("./routes/ngoRoutes"));
const volunteerRoutes_1 = __importDefault(require("./routes/volunteerRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const passport_1 = __importDefault(require("./config/passport"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/donations', donationRoutes_1.default);
app.use('/api/v1/ngos', ngoRoutes_1.default);
app.use('/api/v1/volunteers', volunteerRoutes_1.default);
app.use('/api/v1/admin', adminRoutes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Food Rescue API is healthy' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
