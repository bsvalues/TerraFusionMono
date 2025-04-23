import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { coreService } from "./services/core";
import { jobService } from "./services/jobs";
import { pluginService } from "./services/plugins";
import { metricsService } from "./services/metrics";
import { logsService } from "./services/logs";
import Stripe from "stripe";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_KEY ? new Stripe(process.env.STRIPE_KEY, {
  apiVersion: "2023-10-16",
}) : undefined;

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
        
        if (event.type === 'invoice.paid') {
          // Enable plugin by id
          // Implementation would go here
        }
        
        res.sendStatus(200);
      } catch (error: any) {
        res.status(400).json({ message: `Webhook error: ${error.message}` });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
