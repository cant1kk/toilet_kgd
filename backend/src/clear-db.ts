import { runQuery } from './database';

const clearDatabase = async () => {
  console.log('Clearing all user-submitted toilets...');

  try {
    // Удаляем все записи из таблицы toilets
    await runQuery('DELETE FROM toilets');
    console.log('All toilets cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  const { initDatabase } = require('./database');
  
  initDatabase().then(() => {
    clearDatabase().then(() => {
      console.log('Database cleared successfully');
      process.exit(0);
    }).catch((err: Error) => {
      console.error('Error clearing database:', err);
      process.exit(1);
    });
  }).catch((err: Error) => {
    console.error('Error initializing database:', err);
    process.exit(1);
  });
}

export { clearDatabase };