import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { verifyToken } from './auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'terrafield-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'terrafield-refresh-secret';
const TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_EXPIRY = '30d'; // 30 days

/**
 * Mobile authentication routes
 * Provides endpoints for mobile-specific auth operations with refresh token support
 */

// Login endpoint for mobile clients
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }
    
    // Get user from storage
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      REFRESH_SECRET, 
      { expiresIn: REFRESH_EXPIRY }
    );
    
    // Return user info and tokens (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    // Log successful login
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-auth',
      message: `Mobile login successful: ${username}`
    });
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });
  } catch (error: any) {
    console.error('Mobile login error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-auth',
      message: `Mobile login error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Register endpoint for mobile clients
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, email, and password are required' 
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      role: 'user'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: newUser.id, type: 'refresh' }, 
      REFRESH_SECRET, 
      { expiresIn: REFRESH_EXPIRY }
    );
    
    // Return user info and tokens (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Log successful registration
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-auth',
      message: `Mobile registration successful: ${username}`
    });
    
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });
  } catch (error: any) {
    console.error('Mobile registration error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-auth',
      message: `Mobile registration error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Refresh token is required' 
      });
    }
    
    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      
      // Check if this is a refresh token
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid refresh token' 
        });
      }
      
      // Get user from storage
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      // Generate new JWT token
      const newToken = jwt.sign(
        { userId: user.id }, 
        JWT_SECRET, 
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' }, 
        REFRESH_SECRET, 
        { expiresIn: REFRESH_EXPIRY }
      );
      
      // Return new tokens
      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      });
      
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired refresh token' 
      });
    }
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-auth',
      message: `Token refresh error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Logout endpoint
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = req.user as any;
    
    // In a real application, you would invalidate the token here
    // For now, we just log the logout
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-auth',
      message: `Mobile logout: User ID ${user.id}`
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Validate token endpoint
router.get('/validate', verifyToken, (req, res) => {
  // If this route is reached, the token is valid (verifyToken middleware)
  const { password: _, ...userWithoutPassword } = req.user as any;
  res.json({ 
    success: true,
    valid: true, 
    user: userWithoutPassword 
  });
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Export router
export default router;