import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { initDatabase } from './database';
import { authRoutes } from './routes/auth';
import { telegramRoutes } from './routes/telegram';
import { toiletRoutes } from './routes/toilets';
import { adminRoutes } from './routes/admin';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Cache for API responses
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем CSP для Telegram WebApp
}));

app.use(compression()); // gzip compression

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
        /^https:\/\/.*\.telegram\.app$/,
        'tg://resolve'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Cache middleware
const cacheMiddleware = (req: any, res: any, next: any) => {
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
app.use('/api/auth', authRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/toilets', cacheMiddleware, toiletRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('frontend/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(__dirname + '/../frontend/build/index.html');
  });
}

// Initialize database and start server
initDatabase().then(() => {
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