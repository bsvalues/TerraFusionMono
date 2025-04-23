import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'terrafield-secret-key';
const TOKEN_EXPIRY = '30d';

// Middleware to verify JWT token
export const verifyToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from storage
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }
    
    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    
    // Get user from storage
    let user;
    if (isEmail) {
      user = await storage.getUserByEmail(usernameOrEmail);
    } else {
      user = await storage.getUserByUsername(usernameOrEmail);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    // Return user info and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      ...userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      role: 'user',
      createdAt: new Date()
    });
    
    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    // Return user info and token (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      ...userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Validate token endpoint
router.get('/validate', verifyToken, (req, res) => {
  // If this route is reached, the token is valid (verifyToken middleware)
  const { password: _, ...userWithoutPassword } = req.user as any;
  res.json({ valid: true, user: userWithoutPassword });
});

// Export router
export default router;