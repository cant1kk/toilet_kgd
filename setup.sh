#!/bin/bash

# Скрипт автоматической настройки проекта Toilet Finder Kaliningrad
# для развертывания в Telegram WebApp

set -e

echo "🚀 Начинаю настройку Toilet Finder Kaliningrad..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 18+"
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm"
    exit 1
fi

# Установка зависимостей бэкенда
echo "📦 Установка зависимостей бэкенда..."
cd backend
npm install

# Создание .env файла
if [ ! -f .env ]; then
    echo "⚙️ Создание .env файла..."
    cp .env.example .env
    echo "✅ .env файл создан. Пожалуйста, отредактируйте его:"
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - JWT_SECRET"
    echo "   - FRONTEND_URL"
fi

# Инициализация базы данных
echo "🗄️ Инициализация базы данных..."
npm run build
node dist/index.js &
BACKEND_PID=$!
sleep 3
kill $BACKEND_PID 2>/dev/null || true

# Установка зависимостей фронтенда
echo "📦 Установка зависимостей фронтенда..."
cd ../frontend
npm install

# Сборка фронтенда
echo "🔨 Сборка фронтенда..."
npm run build

# Копирование сборки в бэкенд
echo "📋 Копирование фронтенда в бэкенд..."
rm -rf ../backend/frontend-build
cp -r build ../backend/frontend-build

cd ..

# Создание скрипта запуска
echo "🚀 Создание скрипта запуска..."
cat > start.sh << 'EOF'
#!/bin/bash

# Скрипт запуска Toilet Finder Kaliningrad

echo "🚀 Запуск Toilet Finder Kaliningrad..."

# Переход в директорию бэкенда
cd backend

# Сборка проекта
npm run build

# Запуск сервера
echo "🌐 Сервер запускается на порту 5000..."
echo "📱 Telegram WebApp будет доступен через вашего бота"
echo "🔍 API доступен по адресу: http://localhost:5000/api"
echo "📄 Приложение доступно по адресу: http://localhost:5000"

npm start
EOF

chmod +x start.sh

# Создание скрипта разработки
echo "🛠️ Создание скрипта разработки..."
cat > dev.sh << 'EOF'
#!/bin/bash

# Скрипт запуска в режиме разработки

echo "🛠️ Запуск в режиме разработки..."

# Запуск бэкенда
cd backend
npm run dev &
BACKEND_PID=$!

# Запуск фронтенда
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "🚀 Серверы запущены:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Ожидание сигналов для остановки
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" INT TERM

wait
EOF

chmod +x dev.sh

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте backend/.env файл:"
echo "   - Добавьте TELEGRAM_BOT_TOKEN"
echo "   - Установите JWT_SECRET"
echo "   - Настройте FRONTEND_URL"
echo ""
echo "2. Создайте Telegram бота:"
echo "   - Найдите @BotFather в Telegram"
echo "   - Создайте нового бота"
echo "   - Получите токен и добавьте в .env"
echo ""
echo "3. Настройте администратора:"
echo "   - Узнайте свой Telegram ID (@userinfobot)"
echo "   - Выполните: cd backend && sqlite3 toilets.db < scripts/setup-telegram-admin.sql"
echo "   - Замените ID в скрипте на свой"
echo ""
echo "4. Запустите приложение:"
echo "   - Для разработки: ./dev.sh"
echo "   - Для production: ./start.sh"
echo ""
echo "📖 Подробная инструкция: TELEGRAM_SETUP.md"
echo ""
echo "🎉 Готово к работе!"