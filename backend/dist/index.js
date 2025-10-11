"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_cache_1 = __importDefault(require("node-cache"));
const database_1 = require("./database");
const auth_1 = require("./routes/auth");
const telegram_1 = require("./routes/telegram");
const toilets_1 = require("./routes/toilets");
const admin_1 = require("./routes/admin");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// Cache for API responses
const cache = new node_cache_1.default({ stdTTL: 300 }); // 5 minutes cache
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP' }
});
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Отключаем CSP для Telegram WebApp
}));
app.use((0, compression_1.default)()); // gzip compression
// CORS для Telegram WebApp и обычных запросов
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://yourdomain.com',
            /^https:\/\/.*\.telegram\.app$/,
            /^https:\/\/.*\.web\.app$/,
            'tg://resolve'
        ]
        : [
            'http://localhost:3000',
            /^http:\/\/192\.168\.\d+\.\d+:3000$/,
            /^http:\/\/10\.0\.\d+\.\d+:3000$/,
            'tg://resolve'
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(limiter);
// Cache middleware
const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
        return res.json(cachedResponse);
    }
    res.locals.cache = cache;
    res.locals.cacheKey = key;
    next();
};
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/telegram', telegram_1.telegramRoutes);
app.use('/api/toilets', cacheMiddleware, toilets_1.toiletRoutes);
app.use('/api/admin', admin_1.adminRoutes);
// Serve static files for production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static('frontend/build'));
    app.get('*', (req, res) => {
        res.sendFile(__dirname + '/../frontend/build/index.html');
    });
}
// Initialize database and start server
(0, database_1.initDatabase)().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Available on: http://localhost:${PORT}`);
        console.log(`Available on network: http://0.0.0.0:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
