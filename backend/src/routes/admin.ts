import express from 'express';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { Toilet, runQuery, getQuery, getSingle } from '../database';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateAdmin);

// Get all toilets (including unapproved)
router.get('/toilets', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM toilets';
    let params: any[] = [];

    if (status === 'pending') {
      query += ' WHERE approved = 0';
    } else if (status === 'approved') {
      query += ' WHERE approved = 1';
    }

    query += ' ORDER BY created_at DESC';

    const toilets = await getQuery<Toilet>(query, params);
    res.json(toilets);
  } catch (error) {
    console.error('Error fetching admin toilets:', error);
    res.status(500).json({ error: 'Failed to fetch toilets' });
  }
});

// Approve toilet
router.put('/toilets/:id/approve', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await runQuery('UPDATE toilets SET approved = 1 WHERE id = ?', [id]);
    
    res.json({ message: 'Toilet approved successfully' });
  } catch (error) {
    console.error('Error approving toilet:', error);
    res.status(500).json({ error: 'Failed to approve toilet' });
  }
});

// Reject/delete toilet
router.delete('/toilets/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await runQuery('DELETE FROM toilets WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Toilet not found' });
    }
    
    res.json({ message: 'Toilet deleted successfully' });
  } catch (error) {
    console.error('Error deleting toilet:', error);
    res.status(500).json({ error: 'Failed to delete toilet' });
  }
});

// Update toilet
router.put('/toilets/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
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

    const result = await runQuery(
      `UPDATE toilets 
       SET name = ?, address = ?, latitude = ?, longitude = ?, type = ?, price = ?, description = ?
       WHERE id = ?`,
      [name, address, latitude, longitude, type, price || null, description || null, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Toilet not found' });
    }

    res.json({ message: 'Toilet updated successfully' });
  } catch (error) {
    console.error('Error updating toilet:', error);
    res.status(500).json({ error: 'Failed to update toilet' });
  }
});

// Get admin profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export { router as adminRoutes };