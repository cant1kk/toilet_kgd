"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Verify admin exists in database
        const admin = await (0, database_1.getSingle)('SELECT id, username FROM admins WHERE id = ?', [decoded.id]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        req.user = admin;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};
exports.authenticateAdmin = authenticateAdmin;
