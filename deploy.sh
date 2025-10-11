#!/bin/bash

echo "🚀 Начинаем деплой Telegram WebApp..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Убедитесь, что вы в директории frontend"
    exit 1
fi

# Устанавливаем зависимости, если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Устанавливаем gh-pages, если нет
if ! npm list gh-pages > /dev/null 2>&1; then
    echo "📦 Установка gh-pages..."
    npm install --save-dev gh-pages
fi

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build

# Проверяем, что сборка успешна
if [ ! -d "build" ]; then
    echo "❌ Ошибка: Сборка не удалась. Папка build не создана."
    exit 1
fi

# Деплой на GitHub Pages
echo "🚀 Деплой на GitHub Pages..."
npm run deploy

echo "✅ Деплой завершен!"
echo "🌐 Ваше приложение доступно по адресу: https://$(git config remote.origin.url | sed -e 's/.*:\/\/github.com\///' -e 's/\.git$//').github.io/$(basename $(pwd))"
echo ""
echo "📝 Не забудьте обновить URL в настройках Telegram бота:"