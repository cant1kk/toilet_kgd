# Настройка Telegram WebApp

## Инструкция по настройке бота и развертыванию

### 1. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Туалеты Калининграда")
4. Введите юзернейм бота (например: `kaliningrad_toilets_bot`)
5. Сохраните полученный токен бота

### 2. Настройка WebApp

1. Отправьте ботику команду `/mybots`
2. Выберите вашего бота
3. Перейдите в "Bot Settings" → "Menu Button"
4. Включите "Menu Button"
5. Настройте кнопку меню:
   - Текст: "Открыть карту"
   - URL: `https://yourdomain.com` (ваш домен)

### 3. Настройка переменных окружения

Добавьте в `.env` файл в директории `backend`:

```env
# Токен вашего Telegram бота
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Секретный ключ для JWT
JWT_SECRET=your_super_secret_key_here

# URL вашего приложения в production
REACT_APP_API_URL=https://yourdomain.com/api

# Порт для бэкенда
PORT=5000

# Режим работы
NODE_ENV=production
```

### 4. Настройка администраторов

1. Узнайте свой Telegram ID у бота [@userinfobot](https://t.me/userinfobot)
2. Выполните SQL скрипт для добавления администратора:

```bash
cd backend
sqlite3 toilets.db < scripts/setup-telegram-admin.sql
```

3. Замените `123456789` в скрипте на ваш реальный Telegram ID

### 5. Развертывание

#### Вариант 1: Vercel + Railway/Heroku

1. **Frontend (Vercel)**:
   ```bash
   cd frontend
   npm run build
   # Разверните папку build на Vercel
   ```

2. **Backend (Railway/Heroku)**:
   ```bash
   cd backend
   npm install
   # Разверните на Railway/Heroku с переменными окружения
   ```

#### Вариант 2: Единый сервер

1. Соберите frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Скопируйте папку `build` в `backend`:
   ```bash
   cp -r build ../backend/frontend-build
   ```

3. Запустите бэкенд:
   ```bash
   cd backend
   npm install
   npm start
   ```

### 6. Проверка работы

1. Откройте вашего бота в Telegram
2. Нажмите на меню бота
3. Приложение должно открыться в Telegram WebApp
4. Проверьте функциональность:
   - Геолокация
   - Карта
   - Добавление точек
   - Админ-панель (если вы администратор)

### 7. Оптимизация для Telegram

Для лучшей производительности:

1. **Кэширование**: Бэкенд кэширует запросы на 5 минут
2. **Сжатие**: GZIP сжатие включено
3. **Безопасность**: CSRF защита и rate limiting
4. **Адаптивность**: Полная поддержка мобильных устройств

### 8. Возможные проблемы

#### Проблема: "Invalid Telegram init data"
**Решение**: Проверьте `TELEGRAM_BOT_TOKEN` в переменных окружения

#### Проблема: CORS ошибки
**Решение**: Убедитесь, что домен добавлен в CORS whitelist

#### Проблема: Карта не загружается
**Решение**: Проверьте, что OpenStreetMap тайлы доступны в вашем регионе

### 9. Дополнительные настройки

#### Кастомизация темы
Приложение автоматически адаптируется под тему Telegram пользователя

#### Push уведомления
Для push уведомлений настройте Telegram Bot API

#### Аналитика
Добавьте Google Analytics или Яндекс.Метрику в `public/index.html`

### 10. Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что все переменные окружения настроены
3. Проверьте доступность API endpoints

## Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp документация](https://core.telegram.org/bots/webapps)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [React Leaflet](https://react-leaflet.js.org/)