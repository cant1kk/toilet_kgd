"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDatabase = void 0;
const database_1 = require("./database");
const clearDatabase = async () => {
    console.log('Clearing all user-submitted toilets...');
    try {
        // Удаляем все записи из таблицы toilets
        await (0, database_1.runQuery)('DELETE FROM toilets');
        console.log('All toilets cleared successfully!');
    }
    catch (error) {
        console.error('Error clearing database:', error);
    }
};
exports.clearDatabase = clearDatabase;
// Run if this file is executed directly
if (require.main === module) {
    const { initDatabase } = require('./database');
    initDatabase().then(() => {
        clearDatabase().then(() => {
            console.log('Database cleared successfully');
            process.exit(0);
        }).catch((err) => {
            console.error('Error clearing database:', err);
            process.exit(1);
        });
    }).catch((err) => {
        console.error('Error initializing database:', err);
        process.exit(1);
    });
}
