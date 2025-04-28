import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { apiVersionMiddleware, warnDeprecatedMiddleware } from "./middleware/api-versioning";
import { createViews } from "@shared/views";
import { runMigrations } from "./db-migrations";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable API versioning
app.use(apiVersionMiddleware);
app.use(warnDeprecatedMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Import service initializers
import { coreService } from "./services/core";
import { jobService } from "./services/jobs";
import { pluginService } from "./services/plugins";
import { metricsService } from "./services/metrics";
import { logsService } from "./services/logs";
import { marketplaceService } from "./services/marketplace";
import { natsMonitoringService } from "./services/nats-monitoring";
import { initializeJobs } from "./jobs";

(async () => {
  const server = await registerRoutes(app);

  // Initialize default data for services
  try {
    // Run database migrations first
    await runMigrations();
    
    // Then initialize plugins and core services
    await pluginService.initializeDefaultPlugins();
    await coreService.initializeDefaultServices();
    
    // Then initialize dependent services
    await jobService.initializeDefaultJobs();
    await logsService.initializeSampleLogs();
    await metricsService.initializeAiProviders();
    await natsMonitoringService.initialize();
    
    // Initialize marketplace products based on available plugins
    await marketplaceService.initializeSampleProducts();
    
    // Create database views for reporting and analytics
    await createViews();
    
    // Initialize scheduled jobs (including materialized view refresh)
    await initializeJobs();
    
    log("Services initialized successfully");
  } catch (error) {
    log(`Error initializing services: ${error}`, "error");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
