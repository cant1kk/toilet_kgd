-- SQL скрипт для настройки администратора Telegram
-- Выполните этот скрипт в базе данных SQLite для привязки Telegram пользователя к роли администратора

-- Замените YOUR_TELEGRAM_USER_ID на реальный ID пользователя Telegram
-- Узнать свой ID можно у бота @userinfobot в Telegram

-- Пример привязки администратора:
INSERT OR IGNORE INTO admin_telegram_users (telegram_id) VALUES (247655510);

-- Если нужно привязать существующего администратора к Telegram:
-- UPDATE admin_telegram_users SET telegram_id = 123456789 WHERE id = 1;

-- Проверка списка администраторов Telegram:
-- SELECT * FROM admin_telegram_users;

-- Проверка пользователей Telegram:
-- SELECT * FROM telegram_users WHERE telegram_id = 123456789;