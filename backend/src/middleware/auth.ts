import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSingle } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    
    // Verify admin exists in database
    const admin = await getSingle<{ id: number; username: string }>(
      'SELECT id, username FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};