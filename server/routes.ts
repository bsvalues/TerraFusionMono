import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { coreService } from "./services/core";
import { jobService } from "./services/jobs";
import { pluginService } from "./services/plugins";
import { metricsService } from "./services/metrics";
import { logsService } from "./services/logs";
import { marketplaceService } from "./services/marketplace";
import { billingService } from "./services/billing";
import { geocodeService } from "./services/geocode";
import { usageService } from "./services/metering/usage";
import Stripe from "stripe";
import { versionGuard } from "./middleware/api-versioning";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : undefined;

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized: Please login first' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize service endpoints
  app.get('/api/services', async (req, res) => {
    try {
      const services = await coreService.getServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching services: ${error.message}` });
    }
  });

  app.post('/api/services/:id/restart', async (req, res) => {
    try {
      const result = await coreService.restartService(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Error restarting service: ${error.message}` });
    }
  });

  app.post('/api/services/:id/stop', async (req, res) => {
    try {
      const result = await coreService.stopService(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Error stopping service: ${error.message}` });
    }
  });

  app.post('/api/services/restart-all', async (req, res) => {
    try {
      const result = await coreService.restartAllServices();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Error restarting all services: ${error.message}` });
    }
  });

  // Jobs endpoints
  app.get('/api/jobs', async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const jobs = await jobService.getJobs(limit);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching jobs: ${error.message}` });
    }
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const job = await jobService.createJob(req.body);
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating job: ${error.message}` });
    }
  });

  // Plugins endpoints
  app.get('/api/plugins', async (req, res) => {
    try {
      const plugins = await pluginService.getPlugins();
      res.json(plugins);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching plugins: ${error.message}` });
    }
  });

  app.post('/api/plugins/:id/enable', async (req, res) => {
    try {
      const plugin = await pluginService.enablePlugin(Number(req.params.id));
      res.json(plugin);
    } catch (error: any) {
      res.status(500).json({ message: `Error enabling plugin: ${error.message}` });
    }
  });

  app.post('/api/plugins/:id/disable', async (req, res) => {
    try {
      const plugin = await pluginService.disablePlugin(Number(req.params.id));
      res.json(plugin);
    } catch (error: any) {
      res.status(500).json({ message: `Error disabling plugin: ${error.message}` });
    }
  });

  app.post('/api/plugins/:id/update', async (req, res) => {
    try {
      const plugin = await pluginService.updatePlugin(Number(req.params.id));
      res.json(plugin);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating plugin: ${error.message}` });
    }
  });

  // Metrics endpoints
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await metricsService.getSystemMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching metrics: ${error.message}` });
    }
  });

  // Prometheus metrics endpoint
  app.get('/api/metrics/prometheus', async (req, res) => {
    try {
      const metrics = await metricsService.getPrometheusMetrics();
      res.setHeader('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching Prometheus metrics: ${error.message}` });
    }
  });

  // Logs endpoints
  app.get('/api/logs', async (req, res) => {
    try {
      const service = req.query.service as string | undefined;
      const level = req.query.level as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await logsService.getLogs(limit, service, level);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching logs: ${error.message}` });
    }
  });

  // AI Provider endpoints
  app.get('/api/ai-providers', async (req, res) => {
    try {
      const providerData = {
        providers: await storage.getAiProviders(),
        currentPriority: process.env.AI_PROVIDER_PRIORITY || "openai,anthropic",
        recentOperations: [
          { name: "Property valuation batch", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
          { name: "Parcel description generation", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
          { name: "Document analysis", timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString() }
        ]
      };
      res.json(providerData);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching AI providers: ${error.message}` });
    }
  });

  // System health endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const healthData = {
        database: {
          nextVacuum: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
          lastVacuum: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        },
        pitr: {
          latestSnapshot: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          snapshotCount: 24
        },
        dlq: {
          itemCount: 1,
          lastFailure: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        }
      };
      res.json(healthData);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching system health: ${error.message}` });
    }
  });

  // Marketplace plugin products endpoints
  app.get('/api/marketplace/products', async (req, res) => {
    try {
      const products = await marketplaceService.getPluginProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching plugin products: ${error.message}` });
    }
  });

  app.get('/api/marketplace/products/:id', async (req, res) => {
    try {
      const product = await marketplaceService.getPluginProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${req.params.id} not found` });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching plugin product: ${error.message}` });
    }
  });

  app.get('/api/marketplace/plugins/:pluginId/products', async (req, res) => {
    try {
      const products = await marketplaceService.getPluginProductsByPluginId(Number(req.params.pluginId));
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching plugin products: ${error.message}` });
    }
  });

  app.post('/api/marketplace/products', isAuthenticated, async (req, res) => {
    try {
      // Only admin can create products
      const user = req.user as any;
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const product = await marketplaceService.createPluginProduct(req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating plugin product: ${error.message}` });
    }
  });

  app.put('/api/marketplace/products/:id', isAuthenticated, async (req, res) => {
    try {
      // Only admin can update products
      const user = req.user as any;
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const product = await marketplaceService.updatePluginProduct(Number(req.params.id), req.body);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${req.params.id} not found` });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating plugin product: ${error.message}` });
    }
  });

  // User plugin endpoints
  app.get('/api/user/plugins', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userPlugins = await marketplaceService.getUserPlugins(user.id);
      res.json(userPlugins);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching user plugins: ${error.message}` });
    }
  });

  // Create payment intent for purchasing a plugin
  app.post('/api/marketplace/create-payment-intent', isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.body;
      const user = req.user as any;
      
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
      
      const paymentIntent = await marketplaceService.createPaymentIntent(Number(productId), user.id);
      res.json(paymentIntent);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating payment intent: ${error.message}` });
    }
  });
  
  // Create checkout session for purchasing a plugin
  app.post('/api/billing/create-checkout-session', isAuthenticated, async (req, res) => {
    try {
      const { priceId, mode = 'payment' } = req.body;
      const user = req.user as any;
      
      if (!priceId) {
        return res.status(400).json({ message: 'Price ID is required' });
      }
      
      const checkoutSession = await billingService.createCheckoutSession(
        user.id, 
        priceId, 
        mode as 'payment' | 'subscription'
      );
      
      res.json(checkoutSession);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating checkout session: ${error.message}` });
    }
  });
  
  // Create a Stripe billing portal session for managing subscriptions
  app.post('/api/billing/create-portal-session', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const portalSession = await billingService.createBillingPortalSession(user.id);
      res.json(portalSession);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating billing portal session: ${error.message}` });
    }
  });
  
  // Verify if a user has access to a product
  app.get('/api/billing/verify-access/:productId', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { productId } = req.params;
      
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
      
      const hasAccess = await billingService.verifyAccess(user.id, productId);
      res.json({ hasAccess });
    } catch (error: any) {
      res.status(500).json({ message: `Error verifying access: ${error.message}` });
    }
  });

  // Complete a plugin purchase after successful payment
  app.post('/api/marketplace/complete-purchase', isAuthenticated, async (req, res) => {
    try {
      const { productId, stripePaymentId } = req.body;
      const user = req.user as any;
      
      if (!productId || !stripePaymentId) {
        return res.status(400).json({ message: 'Product ID and Stripe payment ID are required' });
      }
      
      const purchase = await marketplaceService.completePurchase(user.id, Number(productId), stripePaymentId);
      res.status(201).json(purchase);
    } catch (error: any) {
      res.status(500).json({ message: `Error completing purchase: ${error.message}` });
    }
  });
  
  // Stripe webhook endpoint
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    app.post('/api/webhook/stripe', async (req, res) => {
      try {
        const sig = req.headers['stripe-signature'] as string;
        const event = stripe.webhooks.constructEvent(
          await req.text(),
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        
        // Use the billing service to handle all webhook events
        await billingService.processWebhookEvent(event);
        
        // Return a 200 response to acknowledge receipt of the event
        res.sendStatus(200);
      } catch (error: any) {
        await storage.createLog({
          level: 'ERROR',
          service: 'stripe-webhook',
          message: `Webhook error: ${error.message}`
        });
        res.status(400).json({ message: `Webhook error: ${error.message}` });
      }
    });
  }

  // Geocoding API endpoints with versioning
  app.post('/api/geocode', isAuthenticated, versionGuard(['1']), async (req, res) => {
    try {
      const { address } = req.body;
      const user = req.user as any;
      
      if (!address) {
        return res.status(400).json({ message: 'Address is required' });
      }
      
      // Check if user has access to geocoding service
      if (!process.env.GEOCODE_PRODUCT_ID) {
        console.warn('GEOCODE_PRODUCT_ID environment variable is not set');
      } else {
        const hasAccess = await billingService.verifyAccess(
          user.id, 
          process.env.GEOCODE_PRODUCT_ID
        );
        
        if (!hasAccess) {
          return res.status(403).json({ 
            message: 'Access denied: You need to subscribe to the geocoding service',
            subscriptionRequired: true
          });
        }
      }
      
      // Process the geocoding request
      const result = await geocodeService.geocodeAddress(user.id, address);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Error geocoding address: ${error.message}` });
    }
  });
  
  // Route for accessing geocoding usage statistics (admin only)
  app.get('/api/admin/geocode/usage', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only admin can access usage statistics
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const tenantId = req.query.tenantId ? Number(req.query.tenantId) : undefined;
      
      if (tenantId) {
        // Get usage for a specific tenant
        const usage = await usageService.getTenantUsageStats(tenantId);
        res.json(usage);
      } else {
        // Run aggregation in dry-run mode to get usage stats without recording
        const aggregation = await usageService.aggregateGeocodeUsage(true);
        res.json(aggregation);
      }
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching geocode usage: ${error.message}` });
    }
  });
  
  // Route for running the usage aggregation (admin only)
  app.post('/api/admin/geocode/aggregate-usage', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only admin can run usage aggregation
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const dryRun = req.query.dry_run === 'true';
      const result = await usageService.aggregateGeocodeUsage(dryRun);
      
      res.json({
        ...result,
        timestamp: new Date().toISOString(),
        dryRun
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error aggregating geocode usage: ${error.message}` });
    }
  });

  // Legacy geocoding endpoint with deprecation warning
  app.post('/api/geocode-legacy', isAuthenticated, versionGuard(['0']), async (req, res) => {
    try {
      const { address } = req.body;
      const user = req.user as any;
      
      if (!address) {
        return res.status(400).json({ message: 'Address is required' });
      }
      
      // Process the geocoding request
      const result = await geocodeService.geocodeAddress(user.id, address);
      
      // Add deprecation notice in the response
      const response = {
        ...result,
        deprecationNotice: 'This endpoint is deprecated and will be removed on December 31, 2025. Please use /api/geocode with the x-terrafusion-api-version header set to "1".'
      };
      
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ message: `Error geocoding address: ${error.message}` });
    }
  });

  // Subscription management endpoint
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const user = req.user as any;
      
      // If user already has a subscription, return its details
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Check if there's a payment intent associated with this subscription
          const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
          
          res.json({
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
            status: subscription.status,
          });
          return;
        } catch (err) {
          // Subscription may be deleted or invalid, continue to create a new one
          console.warn(`Failed to retrieve subscription ${user.stripeSubscriptionId}:`, err);
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'User email is required for subscription' });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: String(user.id)
          }
        });
        customerId = customer.id;
        
        // Update user with customer ID
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // For this demo, we'll use a hard-coded price ID
      // In production, this would be fetched from a product configuration
      const priceId = process.env.STRIPE_PRICE_ID || 'price_1234567890';

      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update the user's subscription ID
      await storage.updateStripeSubscriptionId(user.id, subscription.id);
      
      // Return the subscription details with the client secret
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      res.status(500).json({ message: `Error creating subscription: ${error.message}` });
    }
  });

  // Payment Intent for one-time payments
  app.post('/api/create-payment-intent', isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const { amount } = req.body;
      
      if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent error:', error);
      res.status(500).json({ message: `Error creating payment intent: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
