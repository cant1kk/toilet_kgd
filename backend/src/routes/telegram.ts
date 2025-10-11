import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { runQuery, getSingle } from '../database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Проверка initData от Telegram
function validateTelegramInitData(initData: string): boolean {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping validation');
    return true; // В разработке можно пропустить валидацию
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) return false;

    // Удаляем hash из параметров для проверки
    urlParams.delete('hash');
    
    // Создаем строку для проверки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    // Проверяем хеш
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === expectedHash;
  } catch (error) {
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
    let dbUser = await getSingle(
      'SELECT * FROM telegram_users WHERE telegram_id = ?',
      [user.id]
    );

    // Если пользователя нет, создаем его
    if (!dbUser) {
      const result = await runQuery(
        'INSERT INTO telegram_users (telegram_id, first_name, last_name, username, language_code) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.first_name, user.last_name || '', user.username || '', user.language_code || 'ru']
      );

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
    const isAdmin = await getSingle(
      'SELECT telegram_id FROM admin_telegram_users WHERE telegram_id = ?',
      [user.id]
    );

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        id: dbUser.id, 
        telegram_id: user.id,
        username: user.username,
        isAdmin: !!isAdmin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await getSingle(
      'SELECT * FROM telegram_users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdmin = await getSingle(
      'SELECT telegram_id FROM admin_telegram_users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    res.json({
      id: user.id,
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      isAdmin: !!isAdmin
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export { router as telegramRoutes };