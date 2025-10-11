const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

async function resetPassword() {
  const username = 'admin'; // Измените если нужно
  const newPassword = 'mediakotais1547@'; // Ваш новый пароль
  
  try {
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем в базе данных
    db.run('UPDATE admins SET password = ? WHERE username = ?', [hashedPassword, username], function(err) {
      if (err) {
        console.error('Ошибка:', err);
      } else {
        console.log(`✅ Пароль для "${username}" успешно изменен на "${newPassword}"`);
        console.log(`Изменено строк: ${this.changes}`);
      }
      db.close();
    });
  } catch (error) {
    console.error('Ошибка хеширования:', error);
    db.close();
  }
}

resetPassword();