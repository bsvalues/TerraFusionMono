import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to handle API versioning via headers
 * Adds version information to the request object
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get the API version from the header, default to '1'
  const version = req.header('x-terrafusion-api-version') || '1';
  
  // Add version to the request object for route handlers to use
  (req as any).apiVersion = version;
  
  next();
}

/**
 * Middleware to warn about deprecated API versions
 * Adds a Deprecation header to responses for old versions
 */
export function warnDeprecatedMiddleware(req: Request, res: Response, next: NextFunction) {
  const version = (req as any).apiVersion;
  
  // Version '0' is deprecated
  if (version === '0') {
    // Add Deprecation header
    res.setHeader('Deprecation', 'version="0"');
    res.setHeader('Sunset', 'Sat, 31 Dec 2025 23:59:59 GMT');
    res.setHeader('Link', '</api/docs>; rel="deprecation"; type="text/html"');
    
    // Log the usage of deprecated API
    storage.createLog({
      level: 'WARN',
      service: 'api-gateway',
      message: `Deprecated API version ${version} accessed: ${req.method} ${req.path}`
    }).catch(err => console.error('Failed to log deprecated API usage:', err));
    
    // Continue processing the request, but with a 299 status code
    // Note: Using 299 as a custom status code for "Deprecated but still functional"
    const originalStatus = res.statusCode;
    const originalEnd = res.end;
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Only override 2xx successful responses
    if (originalStatus >= 200 && originalStatus < 300) {
      res.status(299);
    }
    
    // Override response methods to ensure status code is preserved
    res.end = function(chunk?: any, encoding?: any, callback?: any) {
      return originalEnd.call(this, chunk, encoding, callback);
    };
    
    res.send = function(body?: any) {
      return originalSend.call(this, body);
    };
    
    res.json = function(body?: any) {
      return originalJson.call(this, body);
    };
  }
  
  next();
}

/**
 * Factory function to create a middleware that restricts access to specific API versions
 * @param versions List of supported versions
 */
export function versionGuard(versions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion;
    
    if (!versions.includes(version)) {
      return res.status(400).json({
        error: `API version ${version} is not supported for this endpoint. Supported versions: ${versions.join(', ')}`
      });
    }
    
    next();
  };
}