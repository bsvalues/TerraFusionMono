import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { users, insertUserSchema } from '@terrafusion/schema';
import { logger } from '../utils/logger';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT Secret should be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusion-dev-secret';
const JWT_EXPIRY = '24h';

// Define type for authenticated request
interface AuthenticatedRequest extends FastifyRequest {
  user?: any;
}

/**
 * Authentication routes
 */
const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register authorization hook for protected routes
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    // Skip auth for login and register routes
    if (request.routeOptions.url === '/api/auth/login' ||
        request.routeOptions.url === '/api/auth/register') {
      return;
    }
    
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return; // No auth token, will be handled by protected routes
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user to request
      request.user = decoded;
    } catch (err) {
      // Invalid token, will be handled by protected routes
      logger.warn('Invalid authentication token', err);
    }
  });

  // Register a new user
  fastify.post('/register', async (request, reply) => {
    const schema = insertUserSchema.extend({
      password: z.string().min(8),
      email: z.string().email(),
    }).safeParse(request.body);
    
    if (!schema.success) {
      return reply.status(400).send({
        error: 'Invalid registration data',
        details: schema.error.format(),
      });
    }
    
    try {
      // Check if username already exists
      const existingUser = await fastify.db
        .select()
        .from(users)
        .where(eq(users.username, schema.data.username))
        .limit(1);
      
      if (existingUser.length > 0) {
        return reply.status(409).send({ error: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await hash(schema.data.password, 10);
      
      // Create user
      const [newUser] = await fastify.db
        .insert(users)
        .values({
          ...schema.data,
          password: hashedPassword,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
      
      return {
        user: newUser,
        token,
      };
    } catch (err) {
      logger.error('Error registering user', err);
      return reply.status(500).send({ error: 'Failed to register user' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      username: z.string(),
      password: z.string(),
    }).safeParse(request.body);
    
    if (!loginSchema.success) {
      return reply.status(400).send({
        error: 'Invalid login data',
        details: loginSchema.error.format(),
      });
    }
    
    try {
      // Find user
      const [user] = await fastify.db
        .select()
        .from(users)
        .where(eq(users.username, loginSchema.data.username))
        .limit(1);
      
      if (!user) {
        return reply.status(401).send({ error: 'Invalid username or password' });
      }
      
      // Check password
      const passwordValid = await compare(loginSchema.data.password, user.password);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Invalid username or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (err) {
      logger.error('Error logging in', err);
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  // Get current user profile
  fastify.get('/profile', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    try {
      const [user] = await fastify.db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          stripeCustomerId: users.stripeCustomerId,
        })
        .from(users)
        .where(eq(users.id, request.user.id))
        .limit(1);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return user;
    } catch (err) {
      logger.error('Error fetching user profile', err);
      return reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // Logout (client-side only - just for completion)
  fastify.post('/logout', async () => {
    return { success: true, message: 'Logged out successfully' };
  });

  // Change password
  fastify.post('/change-password', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }).safeParse(request.body);
    
    if (!passwordSchema.success) {
      return reply.status(400).send({
        error: 'Invalid password data',
        details: passwordSchema.error.format(),
      });
    }
    
    try {
      // Get current user
      const [user] = await fastify.db
        .select()
        .from(users)
        .where(eq(users.id, request.user.id))
        .limit(1);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      // Verify current password
      const passwordValid = await compare(passwordSchema.data.currentPassword, user.password);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const hashedPassword = await hash(passwordSchema.data.newPassword, 10);
      
      // Update password
      await fastify.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, request.user.id));
      
      return { success: true, message: 'Password changed successfully' };
    } catch (err) {
      logger.error('Error changing password', err);
      return reply.status(500).send({ error: 'Failed to change password' });
    }
  });
};

export default authRoutes;