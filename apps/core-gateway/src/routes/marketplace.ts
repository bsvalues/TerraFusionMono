import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { pluginProducts, userPlugins, insertUserPluginSchema, plugins } from '@terrafusion/schema';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

// Initialize Stripe if API key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
} else {
  logger.warn('STRIPE_SECRET_KEY not provided. Marketplace payment processing will not work.');
}

// Define type for authenticated request
interface AuthenticatedRequest extends FastifyRequest {
  user?: any;
}

/**
 * Marketplace routes for plugin distribution
 */
const marketplaceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

  // Get all available plugin products
  fastify.get('/products', async (request, reply) => {
    try {
      const products = await fastify.db
        .select({
          id: pluginProducts.id,
          pluginId: pluginProducts.pluginId,
          name: pluginProducts.name,
          description: pluginProducts.description,
          price: pluginProducts.price,
          currency: pluginProducts.currency,
          billingType: pluginProducts.billingType,
          billingPeriod: pluginProducts.billingPeriod,
          isPublic: pluginProducts.isPublic,
          stripeProductId: pluginProducts.stripeProductId,
          stripePriceId: pluginProducts.stripePriceId,
          createdAt: pluginProducts.createdAt,
          updatedAt: pluginProducts.updatedAt,
        })
        .from(pluginProducts)
        .where(eq(pluginProducts.isPublic, true));
      
      // Enhance products with plugin information
      const enhancedProducts = await Promise.all(products.map(async (product) => {
        const [plugin] = await fastify.db
          .select({
            name: plugins.name,
            version: plugins.version,
            description: plugins.description,
            status: plugins.status,
          })
          .from(plugins)
          .where(eq(plugins.id, product.pluginId));
        
        return {
          ...product,
          plugin,
        };
      }));
      
      return enhancedProducts;
    } catch (err) {
      logger.error('Error fetching marketplace products', err);
      return reply.status(500).send({ error: 'Failed to fetch marketplace products' });
    }
  });

  // Get product details by ID
  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const [product] = await fastify.db
        .select()
        .from(pluginProducts)
        .where(eq(pluginProducts.id, parseInt(id, 10)));
      
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      // Get plugin details
      const [plugin] = await fastify.db
        .select()
        .from(plugins)
        .where(eq(plugins.id, product.pluginId));
      
      return {
        ...product,
        plugin,
      };
    } catch (err) {
      logger.error(`Error fetching product with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to fetch product details' });
    }
  });

  // Create Stripe payment intent for plugin purchase
  fastify.post('/create-payment-intent', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    if (!stripe) {
      return reply.status(503).send({ error: 'Payment processing is currently unavailable' });
    }
    
    const paymentSchema = z.object({
      productId: z.number(),
    }).safeParse(request.body);
    
    if (!paymentSchema.success) {
      return reply.status(400).send({
        error: 'Invalid payment data',
        details: paymentSchema.error.format(),
      });
    }
    
    try {
      // Get product information
      const [product] = await fastify.db
        .select()
        .from(pluginProducts)
        .where(eq(pluginProducts.id, paymentSchema.data.productId));
      
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(product.price) * 100), // Convert to cents
        currency: product.currency.toLowerCase(),
        metadata: {
          productId: product.id,
          userId: request.user.id,
          productName: product.name,
        },
      });
      
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (err) {
      logger.error('Error creating payment intent', err);
      return reply.status(500).send({ error: 'Failed to create payment intent' });
    }
  });

  // Create or update Stripe subscription
  fastify.post('/create-subscription', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    if (!stripe) {
      return reply.status(503).send({ error: 'Subscription processing is currently unavailable' });
    }
    
    const subscriptionSchema = z.object({
      productId: z.number(),
      paymentMethodId: z.string(),
    }).safeParse(request.body);
    
    if (!subscriptionSchema.success) {
      return reply.status(400).send({
        error: 'Invalid subscription data',
        details: subscriptionSchema.error.format(),
      });
    }
    
    try {
      // Get product details
      const [product] = await fastify.db
        .select()
        .from(pluginProducts)
        .where(eq(pluginProducts.id, subscriptionSchema.data.productId));
      
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      if (product.billingType !== 'subscription') {
        return reply.status(400).send({ error: 'Product is not a subscription' });
      }
      
      // Get user
      const [user] = await fastify.db
        .select()
        .from(fastify.db.users) // Type safety is missing, but this would be the users table
        .where(eq(fastify.db.users.id, request.user.id));
      
      let customerId = user.stripeCustomerId;
      
      // Create or get Stripe customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          payment_method: subscriptionSchema.data.paymentMethodId,
          invoice_settings: {
            default_payment_method: subscriptionSchema.data.paymentMethodId,
          },
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await fastify.db
          .update(fastify.db.users)
          .set({ stripeCustomerId: customerId })
          .where(eq(fastify.db.users.id, request.user.id));
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: product.stripePriceId,
          },
        ],
        metadata: {
          productId: product.id,
          userId: request.user.id,
          productName: product.name,
        },
      });
      
      // Grant user access to plugin
      await fastify.db
        .insert(userPlugins)
        .values({
          userId: request.user.id,
          pluginId: product.pluginId,
          status: 'active',
          // Set expiration date based on billing period
          expiresAt: product.billingPeriod === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });
      
      return {
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (err) {
      logger.error('Error creating subscription', err);
      return reply.status(500).send({ error: 'Failed to create subscription' });
    }
  });

  // Payment webhook (for handling Stripe events)
  fastify.post('/webhook', async (request, reply) => {
    if (!stripe) {
      return reply.status(503).send({ error: 'Payment processing is currently unavailable' });
    }
    
    const signature = request.headers['stripe-signature'];
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(400).send({ error: 'Missing Stripe signature' });
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        request.body as string,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handleSuccessfulPayment(event.data.object, fastify);
          break;
        case 'invoice.payment_succeeded':
          await handleSubscriptionRenewal(event.data.object, fastify);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionCancellation(event.data.object, fastify);
          break;
        // Add other event types as needed
      }
      
      return { received: true };
    } catch (err) {
      logger.error('Error processing webhook event', err);
      return reply.status(400).send({ error: 'Webhook error' });
    }
  });

  // Get user's plugins
  fastify.get('/user-plugins', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    try {
      const userPluginsList = await fastify.db
        .select()
        .from(userPlugins)
        .where(eq(userPlugins.userId, request.user.id));
      
      // Enhance with plugin details
      const enhancedUserPlugins = await Promise.all(userPluginsList.map(async (userPlugin) => {
        const [plugin] = await fastify.db
          .select()
          .from(plugins)
          .where(eq(plugins.id, userPlugin.pluginId));
        
        return {
          ...userPlugin,
          plugin,
        };
      }));
      
      return enhancedUserPlugins;
    } catch (err) {
      logger.error('Error fetching user plugins', err);
      return reply.status(500).send({ error: 'Failed to fetch user plugins' });
    }
  });

  // Check if user has access to a plugin
  fastify.get('/check-access/:pluginId', async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { pluginId } = request.params as { pluginId: string };
    
    try {
      const [userPlugin] = await fastify.db
        .select()
        .from(userPlugins)
        .where(
          and(
            eq(userPlugins.userId, request.user.id),
            eq(userPlugins.pluginId, parseInt(pluginId, 10))
          )
        );
      
      const hasAccess = !!userPlugin && userPlugin.status === 'active';
      
      return {
        hasAccess,
        status: userPlugin?.status || 'none',
        expiresAt: userPlugin?.expiresAt,
      };
    } catch (err) {
      logger.error(`Error checking access for plugin ${pluginId}`, err);
      return reply.status(500).send({ error: 'Failed to check plugin access' });
    }
  });
};

// Helper functions for payment webhooks

async function handleSuccessfulPayment(paymentIntent: any, fastify: FastifyInstance) {
  const { productId, userId } = paymentIntent.metadata;
  
  if (!productId || !userId) {
    logger.warn('Payment intent missing metadata', paymentIntent);
    return;
  }
  
  try {
    const [product] = await fastify.db
      .select()
      .from(pluginProducts)
      .where(eq(pluginProducts.id, parseInt(productId, 10)));
    
    if (!product) {
      logger.error(`Product not found: ${productId}`);
      return;
    }
    
    // Check if user already has access
    const [existingAccess] = await fastify.db
      .select()
      .from(userPlugins)
      .where(
        and(
          eq(userPlugins.userId, parseInt(userId, 10)),
          eq(userPlugins.pluginId, product.pluginId)
        )
      );
    
    if (existingAccess) {
      // Update existing access
      await fastify.db
        .update(userPlugins)
        .set({
          status: 'active',
          // Set expiration based on product type
          expiresAt: product.billingType === 'one-time'
            ? null // No expiration for one-time purchases
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for subscriptions
        })
        .where(eq(userPlugins.id, existingAccess.id));
    } else {
      // Grant new access
      await fastify.db
        .insert(userPlugins)
        .values({
          userId: parseInt(userId, 10),
          pluginId: product.pluginId,
          status: 'active',
          expiresAt: product.billingType === 'one-time'
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    }
    
    logger.info(`Access granted for user ${userId} to plugin ${product.pluginId}`);
  } catch (err) {
    logger.error('Error processing successful payment', err);
  }
}

async function handleSubscriptionRenewal(invoice: any, fastify: FastifyInstance) {
  // Implementation for subscription renewal
  logger.info('Subscription renewed', invoice);
}

async function handleSubscriptionCancellation(subscription: any, fastify: FastifyInstance) {
  // Implementation for subscription cancellation
  logger.info('Subscription cancelled', subscription);
}

export default marketplaceRoutes;