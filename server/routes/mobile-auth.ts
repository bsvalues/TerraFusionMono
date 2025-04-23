import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { insertUserSchema } from '../../shared/schema';
import { z } from 'zod';

const router = Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'terrafield-dev-secret';
const TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(8),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * Generate access and refresh tokens for a user
 */
function generateTokens(userId: number, username: string) {
  const accessToken = jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId, username, tokenType: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return {
    token: accessToken,
    refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

/**
 * @route POST /api/mobile/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const tokens = generateTokens(user.id, user.username);
    
    // Return tokens and user data (excluding sensitive info)
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({
      ...tokens,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/auth/register
 * @desc Register new user and get tokens
 * @access Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password, ...rest } = validatedData;
    
    // Check if username or email already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await storage.createUser({
      username,
      email,
      passwordHash,
      role: 'user',
      ...rest,
    });
    
    // Generate tokens
    const tokens = generateTokens(user.id, user.username);
    
    // Return tokens and user data (excluding sensitive info)
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({
      ...tokens,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number; username: string; tokenType?: string };
    
    // Check if it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Find user
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user.id, user.username);
    
    // Return new tokens
    res.json(tokens);
  } catch (error) {
    console.error('Token refresh error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/auth/reset-password
 * @desc Request password reset
 * @access Public
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // Always return success for security reasons, even if user not found
    // In a real implementation, this would send an email with reset instructions
    res.json({ message: 'If this email exists in our system, you will receive password reset instructions' });
  } catch (error) {
    console.error('Password reset error:', error);
    // Always return success for security reasons
    res.json({ message: 'If this email exists in our system, you will receive password reset instructions' });
  }
});

/**
 * @route POST /api/mobile/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    // Find user
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    await storage.updateUser(user.id, { passwordHash });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;