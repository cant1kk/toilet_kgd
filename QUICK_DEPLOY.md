# 🚀 Быстрый деплой за 5 минут

## Шаг 1: Backend (Railway)

1. **Загрузите код на GitHub**
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git push origin main
   ```

2. **Создайте проект на Railway**
   - Перейдите на [railway.app](https://railway.app)
   - Connect GitHub repository
   - Выберите репозиторий `toilet-finder-kaliningrad`
   - В настройках проекта установите переменные окружения:
     ```
     TELEGRAM_BOT_TOKEN=7608527643:AAEFNgqn7nYUKTZ8kuSr6t3qfiogi5AS9tM
     JWT_SECRET=your_super_secret_key_here_change_this_in_production
     NODE_ENV=production
     ```

3. **Получите URL бэкенда** (например: `https://toilet-finder.up.railway.app`)

## Шаг 2: Frontend (GitHub Pages)

1. **Настройте production URL**
   ```bash
   cd frontend
   # Создайте .env.production
   echo "REACT_APP_API_URL=https://toilet-finder.up.railway.app/api" > .env.production
   ```

2. **Добавьте homepage в package.json**
   ```json
   "homepage": "https://yourusername.github.io/toilet-finder-kaliningrad"
   ```

3. **Установите gh-pages и задеплойте**
   ```bash
   npm install --save-dev gh-pages
   npm run deploy
   ```

4. **Получите URL фронтенда** (например: `https://yourusername.github.io/toilet-finder-kaliningrad`)

## Шаг 3: Настройка Telegram бота

1. **Откройте @BotFather**
2. **Команда**: `/mybots`
3. **Выберите бота** → Bot Settings → Menu Button
4. **Включите**: Menu Button
5. **Настройте**:
   - Текст: "🚽 Найти туалет"
   - URL: `https://yourusername.github.io/toilet-finder-kaliningrad`

## Шаг 4: Тестирование

1. **Откройте бота в Telegram**
2. **Нажмите на меню**
3. **Проверьте функциональность**:
   - ✅ Загрузка карты
   - ✅ Геолокация
   - ✅ Добавление точек
   - ✅ Telegram аутентификация

## Готово! 🎉

Ваше Telegram WebApp приложение теперь доступно всем пользователям!