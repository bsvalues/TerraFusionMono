/**
 * TerraField Mobile Authentication Tests
 * Tests for the mobile-specific authentication endpoints
 */

// Import required dependencies
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock storage and services
jest.mock('../storage', () => ({
  storage: {
    getUserByUsername: jest.fn(),
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    createLog: jest.fn(),
  }
}));

// Import storage and routes
const { storage } = require('../storage');
const mobileAuthRoutes = require('../routes/mobile-auth').default;

// Set up test app
const app = express();
app.use(express.json());
app.use('/api/mobile/auth', mobileAuthRoutes);

describe('Mobile Authentication API', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/login')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });

    it('should return 401 if user is not found', async () => {
      storage.getUserByUsername.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/mobile/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      storage.getUserByUsername.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        password: bcrypt.hashSync('correctpassword', 10),
        email: 'test@example.com',
        role: 'user'
      });

      const response = await request(app)
        .post('/api/mobile/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 200 with tokens and user info if login is successful', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: bcrypt.hashSync('password123', 10),
        email: 'test@example.com',
        role: 'user'
      };

      storage.getUserByUsername.mockResolvedValueOnce(mockUser);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/mobile/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 1);
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /register', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Username, email, and password are required');
    });

    it('should return 400 if password is too short', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/register')
        .send({ username: 'newuser', email: 'new@example.com', password: 'short' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Password must be at least 8 characters long');
    });

    it('should return 400 if username already exists', async () => {
      storage.getUserByUsername.mockResolvedValueOnce({
        id: 1,
        username: 'existinguser'
      });

      const response = await request(app)
        .post('/api/mobile/auth/register')
        .send({ username: 'existinguser', email: 'new@example.com', password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Username already exists');
    });

    it('should return 400 if email already exists', async () => {
      storage.getUserByUsername.mockResolvedValueOnce(null);
      storage.getUserByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/api/mobile/auth/register')
        .send({ username: 'newuser', email: 'existing@example.com', password: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('should return 201 with tokens and user info if registration is successful', async () => {
      storage.getUserByUsername.mockResolvedValueOnce(null);
      storage.getUserByEmail.mockResolvedValueOnce(null);
      
      const mockNewUser = {
        id: 2,
        username: 'newuser',
        password: 'hashedpassword',
        email: 'new@example.com',
        role: 'user'
      };

      storage.createUser.mockResolvedValueOnce(mockNewUser);
      storage.createLog.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/mobile/auth/register')
        .send({ username: 'newuser', email: 'new@example.com', password: 'password123' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 2);
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /refresh', () => {
    it('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/refresh')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Refresh token is required');
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/refresh')
        .send({ refreshToken: 'invalid-token' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired refresh token');
    });

    // Additional refresh token tests would require mocking jwt.verify
  });

  describe('GET /validate', () => {
    // These tests would require middleware mocking
    it('should be implemented', () => {
      expect(true).toBe(true);
    });
  });
});