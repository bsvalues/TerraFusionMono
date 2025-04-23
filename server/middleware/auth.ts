import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Please login to access this resource' });
  }
}

/**
 * Middleware to check if the user has admin role
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
}

/**
 * Middleware to check if the user has a specific role
 */
export function hasRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user?.role === role) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden - ${role} access required` });
    }
  };
}