"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./database");
const changePassword = async (username, newPassword) => {
    try {
        console.log(`Searching for admin: ${username}`);
        // Find admin by username
        const admin = await (0, database_1.getSingle)('SELECT id, username FROM admins WHERE username = ?', [username]);
        if (!admin) {
            console.log('Admin not found!');
            return;
        }
        console.log(`Admin found: ${admin.username} (ID: ${admin.id})`);
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password
        await (0, database_1.runQuery)('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
        console.log(`✅ Password successfully changed for admin: ${username}`);
        console.log(`New password: ${newPassword}`);
    }
    catch (error) {
        console.error('Error changing password:', error);
    }
};
exports.changePassword = changePassword;
