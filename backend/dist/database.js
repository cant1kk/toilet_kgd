"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDb = getDb;
exports.runQuery = runQuery;
exports.getQuery = getQuery;
exports.getSingle = getSingle;
const sqlite3_1 = __importDefault(require("sqlite3"));
let db;
async function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3_1.default.Database('./toilets.db', (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
            // Создаем таблицы
            createTables()
                .then(() => {
                console.log('Database tables initialized');
                resolve();
            })
                .catch(reject);
        });
    });
}
async function createTables() {
    // Таблица администраторов
    await runQuery(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Таблица туалетов
    await runQuery(`
    CREATE TABLE IF NOT EXISTS toilets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('free', 'paid', 'purchase_required')),
      price TEXT,
      description TEXT,
      approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Таблица пользователей Telegram
    await runQuery(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      username TEXT,
      language_code TEXT DEFAULT 'ru',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Таблица связи администраторов с Telegram
    await runQuery(`
    CREATE TABLE IF NOT EXISTS admin_telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Индексы для оптимизации
    await runQuery('CREATE INDEX IF NOT EXISTS idx_toilets_location ON toilets(latitude, longitude)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_toilets_approved ON toilets(approved)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_telegram_users_id ON telegram_users(telegram_id)');
}
function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}
async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve(this);
        });
    });
}
async function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}
async function getSingle(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
}
