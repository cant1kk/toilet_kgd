"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.authRoutes = router;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Register admin (only first admin can register)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Check if any admin already exists
        const existingAdmin = await (0, database_1.getSingle)('SELECT id FROM admins LIMIT 1');
        if (existingAdmin) {
            return res.status(403).json({ error: 'Admin already registered' });
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create admin
        const result = await (0, database_1.runQuery)('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword]);
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            admin: { id: result.lastID, username }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login admin
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Find admin
        const admin = await (0, database_1.getSingle)('SELECT * FROM admins WHERE username = ?', [username]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            admin: { id: admin.id, username: admin.username }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
