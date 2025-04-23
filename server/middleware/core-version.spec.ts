import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { apiVersionMiddleware, warnDeprecatedMiddleware, versionGuard } from './api-versioning';
import { storage } from '../storage';

// Mock the storage object
jest.mock('../storage', () => ({
  storage: {
    createLog: jest.fn().mockResolvedValue({})
  }
}));

describe('API Versioning Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      header: jest.fn().mockImplementation((name) => {
        if (name === 'x-terrafusion-api-version') return null;
        return null;
      }),
      method: 'GET',
      path: '/parcels'
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
      send: jest.fn(),
      statusCode: 200
    };
    next = jest.fn();
  });

  describe('apiVersionMiddleware', () => {
    it('should set default version to 1 if no header provided', () => {
      apiVersionMiddleware(req as Request, res as Response, next);
      expect((req as any).apiVersion).toBe('1');
      expect(next).toHaveBeenCalled();
    });

    it('should use the version from header if provided', () => {
      req.header = jest.fn().mockImplementation((name) => {
        if (name === 'x-terrafusion-api-version') return '0';
        return null;
      });
      
      apiVersionMiddleware(req as Request, res as Response, next);
      expect((req as any).apiVersion).toBe('0');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('warnDeprecatedMiddleware', () => {
    it('should add deprecation headers for version 0', () => {
      (req as any).apiVersion = '0';
      
      warnDeprecatedMiddleware(req as Request, res as Response, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('Deprecation', 'version="0"');
      expect(res.setHeader).toHaveBeenCalledWith('Sunset', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('Link', expect.stringContaining('deprecation'));
      expect(res.status).toHaveBeenCalledWith(299);
      expect(storage.createLog).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not add deprecation headers for version 1', () => {
      (req as any).apiVersion = '1';
      
      warnDeprecatedMiddleware(req as Request, res as Response, next);
      
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(storage.createLog).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('versionGuard', () => {
    it('should allow access to supported versions', () => {
      (req as any).apiVersion = '1';
      const guard = versionGuard(['1', '2']);
      
      guard(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should block access to unsupported versions', () => {
      (req as any).apiVersion = '0';
      const guard = versionGuard(['1', '2']);
      
      guard(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});