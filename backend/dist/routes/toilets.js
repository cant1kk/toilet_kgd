"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toiletRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.toiletRoutes = router;
// Get all approved toilets with pagination and caching
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const type = req.query.type;
        let whereClause = 'WHERE approved = 1';
        let params = [];
        if (type && ['free', 'paid', 'purchase_required'].includes(type)) {
            whereClause += ' AND type = ?';
            params.push(type);
        }
        // Get paginated results
        const toilets = await (0, database_1.getQuery)(`SELECT * FROM toilets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        // Get total count for pagination
        const totalCount = await (0, database_1.getSingle)(`SELECT COUNT(*) as count FROM toilets ${whereClause}`, params);
        const response = {
            data: toilets,
            pagination: {
                page,
                limit,
                total: totalCount?.count || 0,
                totalPages: Math.ceil((totalCount?.count || 0) / limit)
            }
        };
        // Cache response
        if (res.locals.cache && res.locals.cacheKey) {
            res.locals.cache.set(res.locals.cacheKey, response);
        }
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching toilets:', error);
        res.status(500).json({ error: 'Failed to fetch toilets' });
    }
});
// Add new toilet (public submission)
router.post('/', async (req, res) => {
    try {
        const { name, address, latitude, longitude, type, price, description } = req.body;
        // Validation
        if (!name || !address || !latitude || !longitude || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!['free', 'paid', 'purchase_required'].includes(type)) {
            return res.status(400).json({ error: 'Invalid toilet type' });
        }
        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }
        // Validate Kaliningrad region (approximate bounds)
        if (latitude < 54.6 || latitude > 54.8 || longitude < 20.3 || longitude > 20.6) {
            return res.status(400).json({ error: 'Coordinates must be within Kaliningrad region' });
        }
        // Basic address validation
        if (address.length < 5 || !/\d/.test(address)) {
            return res.status(400).json({ error: 'Invalid address format. Please include street name and number' });
        }
        const result = await (0, database_1.runQuery)(`INSERT INTO toilets (name, address, latitude, longitude, type, price, description, approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`, [name, address, latitude, longitude, type, price || null, description || null]);
        res.status(201).json({
            message: 'Toilet submitted for review',
            id: result.lastID
        });
    }
    catch (error) {
        console.error('Error adding toilet:', error);
        res.status(500).json({ error: 'Failed to submit toilet' });
    }
});
// Get toilet by ID with caching
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID
        if (!/^[0-9]+$/.test(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const toilet = await (0, database_1.getSingle)('SELECT * FROM toilets WHERE id = ? AND approved = 1', [id]);
        if (!toilet) {
            return res.status(404).json({ error: 'Toilet not found' });
        }
        // Cache response
        if (res.locals.cache && res.locals.cacheKey) {
            res.locals.cache.set(res.locals.cacheKey, toilet);
        }
        res.json(toilet);
    }
    catch (error) {
        console.error('Error fetching toilet:', error);
        res.status(500).json({ error: 'Failed to fetch toilet' });
    }
});
