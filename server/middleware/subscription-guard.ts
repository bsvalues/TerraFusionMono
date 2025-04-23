import { Request, Response, NextFunction } from "express";
import { billingService } from "../services/billing";

/**
 * Middleware to verify if a user has access to a product (subscription or one-time purchase)
 * @param productId The Stripe product ID to check access for
 */
export function subscriptionGuard(productId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized: Please login first' });
      }
      
      const user = req.user as any;
      
      // Verify if the user has access to the product
      const hasAccess = await billingService.verifyAccess(user.id, productId);
      
      if (hasAccess) {
        return next();
      } else {
        // If user doesn't have access, redirect to the upgrade page
        return res.status(403).json({ 
          message: 'Access denied: Premium feature',
          upgradeUrl: `/upgrade?feature=${productId}`,
          productId
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: `Error verifying subscription: ${error.message}` });
    }
  };
}

/**
 * Middleware to check if a user has admin access
 */
export function adminGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: Please login first' });
  }
  
  const user = req.user as any;
  
  if (user?.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
}