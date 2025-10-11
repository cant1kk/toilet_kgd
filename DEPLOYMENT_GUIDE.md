# Руководство по развертыванию Telegram WebApp

## Проблема
Telegram WebApp требует HTTPS URL, а локальная разработка идет по HTTP.

## Решения

### Вариант 1: GitHub Pages (Рекомендуется)

1. **Собрать фронтенд для production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Настроить API URL для production:**
   Создать файл `.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

3. **Развернуть на GitHub Pages:**
   ```bash
   npm install --save-dev gh-pages
   # Добавить в package.json:
   # "homepage": "https://yourusername.github.io/toilet-finder-kaliningrad",
   # "scripts": { "predeploy": "npm run build", "deploy": "gh-pages -d build" }
   npm run deploy
   ```

4. **Настроить Telegram бота:**
   - BotFather → Bot Settings → Menu Button
   - URL: `https://yourusername.github.io/toilet-finder-kaliningrad`

### Вариант 2: Vercel/Netlify

1. **Загрузить папку `build` на Vercel или Netlify**
2. **Настроить переменные окружения:**
   - `REACT_APP_API_URL=https://your-backend-url.com/api`
3. **Получить URL и настроить в Telegram боте**

### Вариант 3: Railway/Heroku (Full-stack)

1. **Настроить бэкенд на Railway/Heroku**
2. **Собрать фронтенд и скопировать в бэкенд:**
   ```bash
   cd frontend
   npm run build
   cp -r build ../backend/public
   ```
3. **Настроить Telegram бота на URL Railway/Heroku**

### Вариант 4: Cloudflare Pages

1. **Создать репозиторий на GitHub**
2. **Подключить к Cloudflare Pages**
3. **Автоматический деплой при push**

## Backend развертывание

### Railway (Просто)
1. Залить код на GitHub
2. Создать новый проект на Railway
3. Настроить переменные окружения:
   - `TELEGRAM_BOT_TOKEN`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### Heroku
1. Установить Heroku CLI
2. Создать приложение
3. Задеплоить код

## Тестирование локально

Для тестирования без HTTPS:
1. Использовать тестовую страницу: `http://localhost:8080/test-telegram.html`
2. Или открыть `http://localhost:3000` в браузере

## Проверка работы

После развертывания:
1. Открыть URL в Telegram боте
2. Проверить консоль на ошибки
3. Проверить API запросы через Network таб