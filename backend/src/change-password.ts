import bcrypt from 'bcryptjs';
import { runQuery, getSingle } from './database';

const changePassword = async (username: string, newPassword: string) => {
  try {
    console.log(`Searching for admin: ${username}`);
    
    // Find admin by username
    const admin = await getSingle<{ id: number; username: string }>(
      'SELECT id, username FROM admins WHERE username = ?',
      [username]
    );

    if (!admin) {
      console.log('Admin not found!');
      return;
    }

    console.log(`Admin found: ${admin.username} (ID: ${admin.id})`);

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await runQuery(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, admin.id]
    );

    console.log(`✅ Password successfully changed for admin: ${username}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error('Error changing password:', error);
  }
};

// Usage examples:
// changePassword('admin', 'newPassword123');
// changePassword('your-username', 'your-new-password');

export { changePassword };