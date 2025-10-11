"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramRoutes = void 0;
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.telegramRoutes = router;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
// Проверка initData от Telegram
function validateTelegramInitData(initData) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('TELEGRAM_BOT_TOKEN not set, skipping validation');
        return true; // В разработке можно пропустить валидацию
    }
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        if (!hash)
            return false;
        // Удаляем hash из параметров для проверки
        urlParams.delete('hash');
        // Создаем строку для проверки
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        // Создаем секретный ключ
        const secretKey = crypto_1.default
            .createHmac('sha256', 'WebAppData')
            .update(TELEGRAM_BOT_TOKEN)
            .digest();
        // Проверяем хеш
        const expectedHash = crypto_1.default
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        return hash === expectedHash;
    }
    catch (error) {
        console.error('Error validating Telegram init data:', error);
        return false;
    }
}
// Telegram аутентификация
router.post('/auth', async (req, res) => {
    try {
        const { initData } = req.body;
        if (!initData) {
            return res.status(400).json({ error: 'Telegram init data is required' });
        }
        // Валидация данных от Telegram
        if (!validateTelegramInitData(initData)) {
            return res.status(401).json({ error: 'Invalid Telegram init data' });
        }
        // Парсим данные пользователя
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        if (!userStr) {
            return res.status(400).json({ error: 'User data not found in init data' });
        }
        const user = JSON.parse(decodeURIComponent(userStr));
        // Проверяем, есть ли пользователь в базе
        let dbUser = await (0, database_1.getSingle)('SELECT * FROM telegram_users WHERE telegram_id = ?', [user.id]);
        // Если пользователя нет, создаем его
        if (!dbUser) {
            const result = await (0, database_1.runQuery)('INSERT INTO telegram_users (telegram_id, first_name, last_name, username, language_code) VALUES (?, ?, ?, ?, ?)', [user.id, user.first_name, user.last_name || '', user.username || '', user.language_code || 'ru']);
            dbUser = {
                id: result.lastID,
                telegram_id: user.id,
                first_name: user.first_name,
                last_name: user.last_name || '',
                username: user.username || '',
                language_code: user.language_code || 'ru',
                created_at: new Date().toISOString()
            };
        }
        // Проверяем, является ли пользователь администратором
        const isAdmin = await (0, database_1.getSingle)('SELECT telegram_id FROM admin_telegram_users WHERE telegram_id = ?', [user.id]);
        // Генерируем JWT токен
        const token = jsonwebtoken_1.default.sign({
            id: dbUser.id,
            telegram_id: user.id,
            username: user.username,
            isAdmin: !!isAdmin
        }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Telegram authentication successful',
            token,
            user: {
                id: dbUser.id,
                telegram_id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                isAdmin: !!isAdmin
            }
        });
    }
    catch (error) {
        console.error('Telegram auth error:', error);
        res.status(500).json({ error: 'Telegram authentication failed' });
    }
});
// Получение информации о пользователе
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token is required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await (0, database_1.getSingle)('SELECT * FROM telegram_users WHERE telegram_id = ?', [decoded.telegram_id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isAdmin = await (0, database_1.getSingle)('SELECT telegram_id FROM admin_telegram_users WHERE telegram_id = ?', [decoded.telegram_id]);
        res.json({
            id: user.id,
            telegram_id: user.telegram_id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code,
            isAdmin: !!isAdmin
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});
