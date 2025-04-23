/**
 * TerraField Mobile API Tests
 * Tests for the mobile app API endpoints
 */

// Import required dependencies
const request = require('supertest');
const express = require('express');

// Mock storage and services
jest.mock('../storage', () => ({
  storage: {
    getParcels: jest.fn(),
    getParcel: jest.fn(),
    getParcelNoteByParcelId: jest.fn(),
    updateParcelNote: jest.fn(),
    createParcelNote: jest.fn(),
    createLog: jest.fn(),
  }
}));

jest.mock('../services/mobile-sync', () => ({
  mobileSyncService: {
    syncParcelNote: jest.fn(),
    getParcelNote: jest.fn(),
  }
}));

// Import storage, services, and routes
const { storage } = require('../storage');
const { mobileSyncService } = require('../services/mobile-sync');
const mobileRoutes = require('../routes/mobile').default;

// Mock middleware
const mockVerifyToken = (req, res, next) => {
  req.user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
  next();
};

jest.mock('../routes/auth', () => ({
  verifyToken: mockVerifyToken
}));

// Set up test app
const app = express();
app.use(express.json());
app.use('/api/mobile', mobileRoutes);

describe('Mobile API', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /ping', () => {
    it('should return status ok and version information', async () => {
      const response = await request(app).get('/api/mobile/ping');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /config', () => {
    it('should return app configuration', async () => {
      const response = await request(app).get('/api/mobile/config');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('config');
      expect(response.body.config).toHaveProperty('syncInterval');
      expect(response.body.config).toHaveProperty('features');
      expect(response.body.config).toHaveProperty('version');
    });
  });

  describe('GET /parcels', () => {
    it('should return parcels for the authenticated user', async () => {
      const mockParcels = [
        { id: 'parcel1', address: '123 Main St', latitude: 37.7749, longitude: -122.4194 },
        { id: 'parcel2', address: '456 Market St', latitude: 37.7941, longitude: -122.3962 }
      ];
      
      storage.getParcels.mockResolvedValueOnce(mockParcels);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app).get('/api/mobile/parcels');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(storage.getParcels).toHaveBeenCalledWith({ userId: 1, limit: 50 });
    });

    it('should handle errors when fetching parcels', async () => {
      storage.getParcels.mockRejectedValueOnce(new Error('Database error'));
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app).get('/api/mobile/parcels');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(storage.createLog).toHaveBeenCalled();
    });
  });

  describe('GET /parcels/:id', () => {
    it('should return a specific parcel', async () => {
      const mockParcel = { 
        id: 'parcel1', 
        address: '123 Main St', 
        latitude: 37.7749, 
        longitude: -122.4194 
      };
      
      storage.getParcel.mockResolvedValueOnce(mockParcel);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app).get('/api/mobile/parcels/parcel1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockParcel);
      expect(storage.getParcel).toHaveBeenCalledWith('parcel1');
    });

    it('should return 404 if parcel is not found', async () => {
      storage.getParcel.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/mobile/parcels/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /parcels/:parcelId/notes', () => {
    it('should return notes for a specific parcel', async () => {
      const mockNote = { 
        id: 1, 
        parcelId: 'parcel1', 
        content: 'Test note', 
        yDocData: 'base64data',
        syncCount: 5,
        updatedAt: new Date()
      };
      
      storage.getParcelNoteByParcelId.mockResolvedValueOnce(mockNote);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app).get('/api/mobile/parcels/parcel1/notes');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockNote);
      expect(storage.getParcelNoteByParcelId).toHaveBeenCalledWith('parcel1');
    });

    it('should return empty structure if note is not found', async () => {
      storage.getParcelNoteByParcelId.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/mobile/parcels/parcel1/notes');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('parcelId', 'parcel1');
      expect(response.body.data).toHaveProperty('content', '');
      expect(response.body.data).toHaveProperty('yDocData', '');
      expect(response.body.data).toHaveProperty('syncCount', 0);
    });
  });

  describe('PUT /parcels/:parcelId/notes', () => {
    it('should update note for a specific parcel', async () => {
      const mockParcel = { id: 'parcel1' };
      const mockNote = { 
        id: 1, 
        parcelId: 'parcel1', 
        content: 'Updated note',
        yDocData: 'newbase64data',
        syncCount: 6,
        updatedAt: new Date()
      };
      
      storage.getParcel.mockResolvedValueOnce(mockParcel);
      storage.getParcelNoteByParcelId.mockResolvedValueOnce({ id: 1, syncCount: 5 });
      storage.updateParcelNote.mockResolvedValueOnce(mockNote);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .put('/api/mobile/parcels/parcel1/notes')
        .send({ content: 'Updated note', yDocData: 'newbase64data' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockNote);
    });

    it('should create note if it does not exist', async () => {
      const mockParcel = { id: 'parcel1' };
      const mockNote = { 
        id: 1, 
        parcelId: 'parcel1', 
        content: 'New note',
        yDocData: 'base64data',
        syncCount: 1,
        updatedAt: new Date()
      };
      
      storage.getParcel.mockResolvedValueOnce(mockParcel);
      storage.getParcelNoteByParcelId.mockResolvedValueOnce(null);
      storage.createParcelNote.mockResolvedValueOnce(mockNote);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .put('/api/mobile/parcels/parcel1/notes')
        .send({ content: 'New note', yDocData: 'base64data' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockNote);
    });
  });

  describe('POST /sync', () => {
    it('should sync notes with CRDT updates', async () => {
      const syncResult = {
        update: 'mergedupdate',
        timestamp: new Date().toISOString()
      };
      
      mobileSyncService.syncParcelNote.mockResolvedValueOnce(syncResult);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/mobile/sync')
        .send({ parcelId: 'parcel1', update: 'clientupdate' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('syncedAt');
      expect(response.body).toHaveProperty('update', 'mergedupdate');
      expect(response.body).toHaveProperty('timestamp');
      expect(mobileSyncService.syncParcelNote).toHaveBeenCalledWith('parcel1', 'clientupdate', 1);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/mobile/sync')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /batch-sync', () => {
    it('should handle batch sync of multiple notes', async () => {
      const syncResult1 = {
        update: 'mergedupdate1',
        timestamp: new Date().toISOString()
      };
      
      const syncResult2 = {
        update: 'mergedupdate2',
        timestamp: new Date().toISOString()
      };
      
      mobileSyncService.syncParcelNote
        .mockResolvedValueOnce(syncResult1)
        .mockResolvedValueOnce(syncResult2);
      
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/mobile/batch-sync')
        .send({ 
          updates: [
            { parcelId: 'parcel1', update: 'clientupdate1' },
            { parcelId: 'parcel2', update: 'clientupdate2' }
          ] 
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('syncedAt');
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(2);
      expect(mobileSyncService.syncParcelNote).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if updates array is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/batch-sync')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle partial failures in batch updates', async () => {
      mobileSyncService.syncParcelNote
        .mockResolvedValueOnce({ update: 'success' })
        .mockRejectedValueOnce(new Error('Sync error'));
      
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/mobile/batch-sync')
        .send({ 
          updates: [
            { parcelId: 'parcel1', update: 'update1' },
            { parcelId: 'parcel2', update: 'update2' } // This will fail
          ] 
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[1].error).toBeDefined();
    });
  });
});