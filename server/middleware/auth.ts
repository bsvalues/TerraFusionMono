import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import jwt from 'jsonwebtoken';

// Secret for JWT signing - in a real app, use an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusion-secret-key';

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    if (!decoded?.id) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    // Get user from database
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};