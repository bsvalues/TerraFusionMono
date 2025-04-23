import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { generateToken, isAuthenticated } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

// Validation schemas
const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = RegisterSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: result.error.format() 
      });
    }
    
    const { username, email, password } = result.data;
    
    // Check if username or email already exists
    const existingUsername = await storage.getUserByUsername(username);
    
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingEmail = await storage.getUserByEmail(email);
    
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error: any) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user and get token
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = LoginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: result.error.format() 
      });
    }
    
    const { usernameOrEmail, password } = result.data;
    
    // Find user by username or email
    const isEmail = usernameOrEmail.includes('@');
    let user;
    
    if (isEmail) {
      user = await storage.getUserByEmail(usernameOrEmail);
    } else {
      user = await storage.getUserByUsername(usernameOrEmail);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error: any) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  // User is attached to request by isAuthenticated middleware
  const user = req.user;
  
  res.json({
    id: user?.id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
  });
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side only)
 * @access Private
 */
router.post('/logout', isAuthenticated, (req: Request, res: Response) => {
  // JWT tokens are stateless, so we can't invalidate them server-side
  // In a real application, you would use a token blacklist or short expiration times
  res.json({ message: 'Logged out successfully' });
});

export default router;