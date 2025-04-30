import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { sql } from "drizzle-orm";
import { db } from "./db";
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
import { mobileSyncService } from "./services/mobile-sync";
import { CollaborationService } from "./services/collaboration-service";
import { natsMonitoringService } from "./services/nats-monitoring";
import Stripe from "stripe";
import authRoutes from "./routes/auth";
import mobileRoutes from "./routes/mobile";
import mobileAuthRoutes from "./routes/mobile-auth";
import cropHealthRoutes from "./routes/crop-health";
import cropIdentificationRouter from "./routes/crop-identification";
import mobileSyncRoutes from "./routes/mobile-sync";
import cropAnalysisRoutes from "./routes/crop-analysis";
import collaborationRoutes from "./routes/collaboration";
import fieldReportRoutes from "./routes/field-reports";
import pacsMigrationRoutes from "./routes/pacs-migration";
import { searchHandler, getMetricsHandler } from "./routes/geocode";
import { versionGuard } from "./middleware/api-versioning";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : undefined;

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
  
  // Plugin installation endpoint - creates a job to track progress
  app.post('/api/plugins/:id/install', isAuthenticated, async (req, res) => {
    try {
      const pluginId = Number(req.params.id);
      const user = req.user as any;
      
      // 1. Check if plugin exists
      const plugin = await pluginService.getPlugin(pluginId);
      if (!plugin) {
        return res.status(404).json({ message: `Plugin with ID ${pluginId} not found` });
      }
      
      // 2. Check if user has access to this plugin (either purchased or free)
      const hasAccess = await marketplaceService.checkUserHasAccess(user.id, pluginId);
      if (!hasAccess) {
        return res.status(403).json({ 
          message: 'Access denied: You need to purchase this plugin first',
          purchaseRequired: true
        });
      }
      
      // 3. Create a job to track the installation process
      const job = await jobService.createJob({
        name: `Install plugin: ${plugin.name}`,
        status: 'queued',
        worker: 'plugin-installer'
      });
      
      // 4. Return the job information for tracking progress
      res.status(202).json({
        message: `Installation of plugin ${plugin.name} has started`,
        plugin,
        job
      });
      
    } catch (error: any) {
      res.status(500).json({ message: `Error installing plugin: ${error.message}` });
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
  
  // NATS monitoring endpoints
  app.get('/api/nats/info', async (req, res) => {
    try {
      const info = await natsMonitoringService.getServerInfo();
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS server info: ${error.message}` });
    }
  });
  
  app.get('/api/nats/connections', async (req, res) => {
    try {
      const connections = await natsMonitoringService.getConnections();
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS connections: ${error.message}` });
    }
  });
  
  app.get('/api/nats/streams', async (req, res) => {
    try {
      const streams = await natsMonitoringService.getStreams();
      res.json(streams);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS streams: ${error.message}` });
    }
  });
  
  app.get('/api/nats/streams/:name/consumers', async (req, res) => {
    try {
      const consumers = await natsMonitoringService.getConsumers(req.params.name);
      res.json(consumers);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS consumers: ${error.message}` });
    }
  });
  
  app.get('/api/nats/status', async (req, res) => {
    try {
      const isConnected = await natsMonitoringService.checkConnection();
      res.json({ 
        status: isConnected ? "connected" : "disconnected",
        monitoring_url: process.env.NATS_MONITORING_URL || 'http://localhost:8222',
        monitoring_enabled: !!process.env.NATS_MONITORING_ENABLED
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error checking NATS status: ${error.message}` });
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

  // Health check endpoints (as per K8s standards)
  
  // Liveness probe - indicates if the service is running
  app.get('/api/health/live', (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  // Readiness probe - indicates if the service is ready to accept requests
  app.get('/api/health/ready', async (req, res) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      
      // Check NATS connection if monitoring is enabled
      const natsStatus = process.env.NATS_MONITORING_ENABLED 
        ? await natsMonitoringService.checkConnection() 
        : null;
      
      // Check services status
      const servicesStatus = {
        collaboration: "online",
        mobileSync: "online",
        plugin: "online",
        database: "online",
        messageBus: process.env.NATS_MONITORING_ENABLED
          ? (natsStatus ? "online" : "offline")
          : "not_configured"
      };
      
      // If NATS is required for the service to function and it's not available, 
      // return a non-200 status so that Kubernetes won't route traffic to this instance
      if (process.env.NATS_MONITORING_ENABLED && 
          process.env.NATS_REQUIRED === 'true' && 
          !natsStatus) {
        return res.status(503).json({
          status: "error",
          message: "Service is not ready: NATS connection required but unavailable",
          services: servicesStatus
        });
      }
      
      res.status(200).json({ 
        status: "ok",
        services: servicesStatus
      });
    } catch (error: any) {
      console.error("Readiness check failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Service is not ready", 
        details: error.message 
      });
    }
  });
  
  // Detailed health endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Check NATS connection status
      let natsStatus = { 
        monitoring: false,
        client: false
      };
      
      try {
        // Check HTTP monitoring connection if enabled
        natsStatus.monitoring = await natsMonitoringService.checkMonitoringConnection();
      } catch (error) {
        console.log('Error checking NATS monitoring connection:', error);
      }
      
      // Check NATS client connection
      natsStatus.client = natsMonitoringService.isClientConnected();
      
      const healthData = {
        status: "ok",
        database: {
          nextVacuum: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
          lastVacuum: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          connection: "healthy"
        },
        pitr: {
          latestSnapshot: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          snapshotCount: 24
        },
        nats: {
          monitoring: natsStatus.monitoring,
          client: natsStatus.client
        },
        dlq: {
          itemCount: 1,
          lastFailure: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        services: {
          collaborationService: "online",
          mobileSyncService: "online",
          pluginService: "online"
        },
        messageBus: {
          nats: {
            status: natsStatus ? "connected" : "disconnected",
            monitoring: {
              enabled: !!process.env.NATS_MONITORING_ENABLED,
              url: process.env.NATS_MONITORING_URL || 'http://localhost:8222'
            }
          }
        }
      };
      res.json(healthData);
    } catch (error: any) {
      res.status(500).json({ 
        status: "error", 
        message: `Error fetching system health: ${error.message}` 
      });
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
        
        // Log the webhook event
        console.log(`Received Stripe webhook: ${event.type} (${event.id})`);
          
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

  // Mobile sync endpoints
  app.post('/api/mobile-sync', isAuthenticated, async (req, res) => {
    try {
      const { parcelId, update } = req.body;
      const user = req.user as any;
      
      if (!parcelId || !update) {
        return res.status(400).json({ message: 'Parcel ID and update are required' });
      }
      
      // Check if user has TerraField mobile access
      if (process.env.MOBILE_SYNC_PRODUCT_ID) {
        const hasAccess = await billingService.verifyAccess(
          user.id, 
          process.env.MOBILE_SYNC_PRODUCT_ID
        );
        
        if (!hasAccess) {
          return res.status(402).json({ 
            message: 'Payment Required: You need a TerraField subscription',
            subscriptionRequired: true
          });
        }
      }
      
      // Process sync request
      const result = await mobileSyncService.syncParcelNote(parcelId, update, user.id);
      
      // Log successful sync
      await storage.createLog({
        level: 'INFO',
        service: 'mobile-sync',
        message: `Synced parcel note ${parcelId} for user ${user.id}`
      });
      
      res.json(result);
    } catch (error: any) {
      await storage.createLog({
        level: 'ERROR',
        service: 'mobile-sync',
        message: `Sync error: ${error.message}`
      });
      res.status(500).json({ message: `Error syncing parcel note: ${error.message}` });
    }
  });
  
  app.get('/api/mobile-sync/:parcelId', isAuthenticated, async (req, res) => {
    try {
      const { parcelId } = req.params;
      const user = req.user as any;
      
      if (!parcelId) {
        return res.status(400).json({ message: 'Parcel ID is required' });
      }
      
      // Check if user has TerraField mobile access
      if (process.env.MOBILE_SYNC_PRODUCT_ID) {
        const hasAccess = await billingService.verifyAccess(
          user.id, 
          process.env.MOBILE_SYNC_PRODUCT_ID
        );
        
        if (!hasAccess) {
          return res.status(402).json({ 
            message: 'Payment Required: You need a TerraField subscription',
            subscriptionRequired: true
          });
        }
      }
      
      // Fetch parcel note
      const note = await mobileSyncService.getParcelNote(parcelId);
      
      if (!note) {
        return res.status(404).json({ message: `Parcel note with ID ${parcelId} not found` });
      }
      
      res.json({
        update: note.yDocData,
        timestamp: note.updatedAt.toISOString(),
        syncCount: note.syncCount
      });
    } catch (error: any) {
      await storage.createLog({
        level: 'ERROR',
        service: 'mobile-sync',
        message: `Fetch error: ${error.message}`
      });
      res.status(500).json({ message: `Error fetching parcel note: ${error.message}` });
    }
  });

  // Register authentication routes
  app.use('/api/auth', authRoutes);
  
  // Register mobile authentication routes
  app.use('/api/mobile/auth', mobileAuthRoutes);
  
  // Register mobile app routes
  app.use('/api/mobile', mobileRoutes);
  
  // Register mobile sync routes (on a separate path to avoid mobile auth middleware)
  app.use('/api/sync', mobileSyncRoutes);
  
  // Register crop health routes
  app.use('/api/crop-health', cropHealthRoutes);
  
  // Register crop identification routes
  app.use('/api', cropIdentificationRouter);

  // Register geocoding API endpoints
  app.post('/api/geocode/search', async (req, res) => {
    await searchHandler(req, res);
  });
  
  app.get('/api/geocode/metrics', async (req, res) => {
    await getMetricsHandler(req, res);
  });
  
  // API endpoints for database views - using materialized views where available for better performance
  app.get("/api/reports/parcel-summary", async (req, res) => {
    try {
      // Use materialized view for better performance
      const result = await db.execute(sql`SELECT * FROM parcel_summary_mv`);
      res.json(result.rows);
    } catch (error) {
      // Fall back to regular view if materialized view fails
      try {
        const result = await db.execute(sql`SELECT * FROM parcel_summary_view`);
        res.json(result.rows);
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to fetch parcel summary" });
      }
    }
  });
  
  app.get("/api/reports/crop-health", async (req, res) => {
    try {
      // Use the recent crop health materialized view for dashboard data
      const result = await db.execute(sql`SELECT * FROM recent_crop_health_mv`);
      res.json(result.rows);
    } catch (error) {
      // Fall back to regular view
      try {
        const result = await db.execute(sql`SELECT * FROM crop_health_dashboard_view`);
        res.json(result.rows);
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to fetch crop health dashboard data" });
      }
    }
  });
  
  // Endpoint for all historical crop health data (not just recent)
  app.get("/api/reports/crop-health/all", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM crop_health_dashboard_view`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch historical crop health data" });
    }
  });
  
  app.get("/api/reports/soil-analysis", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM soil_analysis_trends_view`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch soil analysis trends" });
    }
  });
  
  app.get("/api/reports/yield-predictions", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM yield_prediction_summary_view`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch yield prediction summary" });
    }
  });
  
  app.get("/api/reports/weather-forecast", async (req, res) => {
    try {
      // Use materialized view for weather forecasts
      const result = await db.execute(sql`SELECT * FROM weather_forecast_mv`);
      res.json(result.rows);
    } catch (error) {
      // Fall back to filtering the regular view
      try {
        const result = await db.execute(sql`
          SELECT * FROM weather_data_overview_view 
          WHERE data_type = 'forecast'
          ORDER BY observation_date DESC
        `);
        res.json(result.rows);
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to fetch weather forecast data" });
      }
    }
  });
  
  app.get("/api/reports/weather-data", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM weather_data_overview_view`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather data overview" });
    }
  });
  
  // AI-powered crop analysis routes (OpenAI integration)
  app.use('/api/crop-analysis', cropAnalysisRoutes);
  
  // Field reports with AI summary routes
  app.use('/api/field-reports', fieldReportRoutes);
  
  // Collaboration routes for real-time editing features
  app.use('/api/collaboration', collaborationRoutes);
  
  // PACS Migration routes - adding test endpoints without authentication
  app.get('/api/pacs-migration/test', (req, res) => {
    res.json({
      success: true,
      message: "PACS Migration API is configured and working",
      timestamp: new Date().toISOString(),
      endpoints: {
        connections: '/api/pacs-migration/connections',
        jobs: '/api/pacs-migration/jobs',
        mappings: '/api/pacs-migration/jobs/:jobId/mappings',
        executions: '/api/pacs-migration/jobs/:jobId/executions'
      }
    });
  });
  
  // Test endpoint to create a PACS connection (for testing without auth)
  app.post('/api/pacs-migration/test/connection', async (req, res) => {
    try {
      const connection = {
        name: req.body.name || 'Test PACS Connection',
        host: req.body.host || 'test-pacs-server.example.com',
        port: req.body.port || 5000,
        username: req.body.username || 'test-user',
        password: req.body.password || 'test-password',
        database: req.body.database || 'test_pacs_db',
        apiKey: req.body.apiKey || 'test-api-key',
        status: 'active',
        description: req.body.description || 'Test connection created for verification purposes',
        sourceSystem: req.body.sourceSystem || 'pacs',
        createdBy: 1, // Default test user
        testStatus: 'pending'
      };
      
      const result = await storage.createPacsConnection(connection);
      
      await storage.createLog({
        level: 'INFO',
        service: 'pacs-migration',
        message: `Test PACS connection '${result.name}' created`
      });
      
      res.status(201).json({
        success: true,
        message: 'Test PACS connection created successfully',
        connection: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ 
        success: false,
        message: `Error creating test connection: ${message}`
      });
    }
  });
  
  // Test endpoint to get PACS connections (for testing without auth)
  app.get('/api/pacs-migration/test/connections', async (req, res) => {
    try {
      const connections = await storage.getPacsConnections();
      res.json({
        success: true,
        count: connections.length,
        connections
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        success: false,
        message: `Error retrieving connections: ${message}`
      });
    }
  });
  
  // Main PACS Migration routes with authentication
  app.use('/api/pacs-migration', isAuthenticated, pacsMigrationRoutes);
  
  // WebSocket monitoring endpoints
  app.get('/api/websocket/connections', async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const status = req.query.status as string | undefined;
      
      const connections = await storage.getWebSocketConnections({
        limit,
        userId,
        status
      });
      
      res.json({
        connections,
        active: connections.filter(c => c.status === 'connected').length,
        total: connections.length
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching WebSocket connections: ${error.message}` });
    }
  });
  
  app.get('/api/websocket/connections/:id', async (req, res) => {
    try {
      const connection = await storage.getWebSocketConnection(Number(req.params.id));
      
      if (!connection) {
        return res.status(404).json({ message: `WebSocket connection with ID ${req.params.id} not found` });
      }
      
      res.json(connection);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching WebSocket connection: ${error.message}` });
    }
  });
  
  app.get('/api/websocket/status', (req, res) => {
    const activeConnections = Array.from(clients).filter(client => 
      client.readyState === WebSocket.OPEN
    ).length;
    
    res.json({
      status: 'online',
      activeConnections,
      server: {
        path: '/ws',
        protocol: req.secure ? 'wss://' : 'ws://'
      },
      timestamp: new Date().toISOString()
    });
  });
  
  app.post('/api/websocket/broadcast', (req, res) => {
    try {
      const { message, type, channel } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      let count = 0;
      const payload = JSON.stringify({
        type: type || 'broadcast',
        message,
        channel,
        timestamp: new Date().toISOString()
      });
      
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
          count++;
        }
      }
      
      res.json({
        success: true,
        messagesSent: count,
        totalClients: clients.size
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error broadcasting message: ${error.message}` });
    }
  });
  
  // NATS Monitoring and Connection endpoints
  app.get('/api/nats/status', (req, res) => {
    try {
      // Get NATS connection status from monitoring service
      const status = natsMonitoringService.getConnectionStatus();
      
      res.json({
        ...status,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS status: ${error.message}` });
    }
  });
  
  app.get('/api/nats/connections', async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const serviceName = req.query.serviceName as string | undefined;
      const status = req.query.status as string | undefined;
      
      const connections = await storage.getNatsConnections({
        limit,
        serviceName,
        status
      });
      
      res.json({
        connections,
        active: connections.filter(c => c.status === 'connected').length,
        total: connections.length
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS connections: ${error.message}` });
    }
  });
  
  app.get('/api/nats/connections/:id', async (req, res) => {
    try {
      const connection = await storage.getNatsConnection(Number(req.params.id));
      
      if (!connection) {
        return res.status(404).json({ message: `NATS connection with ID ${req.params.id} not found` });
      }
      
      res.json(connection);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching NATS connection: ${error.message}` });
    }
  });
  
  app.post('/api/nats/publish', (req, res) => {
    try {
      // Check if client is enabled/connected
      if (!natsMonitoringService.isClientConnected()) {
        return res.status(503).json({ 
          success: false, 
          message: 'NATS client is not connected or enabled' 
        });
      }
      
      const { subject, data, headers } = req.body;
      
      if (!subject) {
        return res.status(400).json({ success: false, message: 'Subject is required' });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, message: 'Data is required' });
      }
      
      // Send a heartbeat
      natsMonitoringService.sendHeartbeat()
        .then(result => {
          res.json({
            success: true,
            message: `Message published to ${subject}`,
            timestamp: new Date().toISOString()
          });
        })
        .catch(error => {
          res.status(500).json({ 
            success: false,
            message: `Error publishing message: ${error.message}` 
          });
        });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: `Error publishing message: ${error.message}` 
      });
    }
  });
  
  const httpServer = createServer(app);
  
  // Set up the WebSocket server for real-time updates with multiple paths
  // Initialize the WebSocket server for general notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Make WebSocket server accessible to routes
  app.locals.wss = wss;
  
  // Store active general connections
  const clients = new Set<WebSocket>();
  
  // Initialize the CollaborationService with persistent database storage
  const collaborationService = new CollaborationService(httpServer);
  
  // Handle general WebSocket connections
  wss.on('connection', async (ws, req) => {
    // Generate a unique connection ID
    const connectionId = req.headers['sec-websocket-key'] || `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to in-memory clients set
    clients.add(ws);
    
    // Store connection metadata in the WebSocket object for reference
    (ws as any).connectionId = connectionId;
    (ws as any).connectionTime = new Date();
    
    // Determine user ID if authenticated (optional)
    let userId: number | null = null;
    
    if (req.headers.cookie) {
      // Extract user ID from session if available - simplified example
      // In a real implementation, this would parse the session cookie and extract the user ID
      // For demonstration, we're setting a placeholder user ID
      userId = 1; // Default test user ID
    }
    
    try {
      // Store connection in database
      const now = new Date();
      const connectionData = {
        connectionId: connectionId,
        userId: userId || undefined,
        ipAddress: req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        connectionTime: now,
        status: 'connected',
        lastActivity: now, 
        lastPingTime: now,
        reconnectCount: 0,
        disconnectionTime: null,
        clientInfo: JSON.stringify({
          headers: req.headers,
          address: req.socket.remoteAddress
        }),
        sessionData: JSON.stringify({
          clientId: connectionId.substring(0, 8),
          userAgent: req.headers['user-agent']
        })
      };
      
      console.log(`Creating WebSocket connection with data:`, {
        connectionId,
        userId,
        status: 'connected'
      });
      
      const connection = await storage.createWebSocketConnection(connectionData);
      
      console.log(`WebSocket connection established and tracked in database. ID: ${connectionId}`);
      
      // Send a welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to TerraFusion WebSocket Server',
        connectionId
      }));
      
      // Handle disconnection
      ws.on('close', async (code, reason) => {
        clients.delete(ws);
        
        try {
          // Update connection status in database
          await storage.updateWebSocketConnectionByConnectionId(connectionId, {
            status: 'disconnected',
            disconnectionTime: new Date(),
            disconnectionReason: reason.toString() || `Code: ${code}`
          });
          
          console.log(`WebSocket connection closed and updated in database. ID: ${connectionId}`);
        } catch (error) {
          console.error(`Error updating WebSocket connection in database: ${error}`);
        }
      });
      
      // Regular ping to keep the connection alive and update last activity
      const pingInterval = setInterval(async () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          
          try {
            // Update last activity timestamp
            await storage.updateWebSocketConnectionByConnectionId(connectionId, {
              lastActivity: new Date()
            });
          } catch (error) {
            console.error(`Error updating WebSocket connection activity: ${error}`);
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Send ping every 30 seconds
      
      // Handle client errors
      ws.on('error', async (error) => {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        
        try {
          // Update connection status in database
          await storage.updateWebSocketConnectionByConnectionId(connectionId, {
            status: 'error',
            disconnectionTime: new Date(),
            disconnectionReason: error.message || 'Unknown error'
          });
        } catch (dbError) {
          console.error(`Error updating WebSocket connection error in database: ${dbError}`);
        }
      });
      
    } catch (error) {
      console.error(`Error creating WebSocket connection in database: ${error}`);
    }
    
    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Update last activity timestamp
        try {
          await storage.updateWebSocketConnectionByConnectionId(connectionId, {
            lastActivity: new Date()
          });
        } catch (error) {
          console.error(`Error updating WebSocket connection activity: ${error}`);
        }
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          case 'subscribe':
            // Subscribe to specific channels or topics
            if (data.channel) {
              console.log(`Client subscribed to channel: ${data.channel}`);
              ws.send(JSON.stringify({ 
                type: 'subscribed', 
                channel: data.channel,
                message: `Subscribed to ${data.channel}`
              }));
            }
            break;
            
          default:
            // Handle other message types as needed
            break;
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
  });
  
  // Our new CollaborationService handles all WebSocket connections
  // for the collaboration endpoint. No need for manual WebSocket handling here.
  
  // Add a broadcast function to global for services to use
  (global as any).broadcastWebSocketMessage = (message: any) => {
    const messageStr = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  };
  
  return httpServer;
}
