import { pgTable, text, serial, integer, timestamp, json, boolean, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status").default("inactive"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// Services in the system
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").default("stopped").notNull(), // running, stopped, error
  startedAt: timestamp("started_at"),
  memory: integer("memory"),
  cpu: integer("cpu"),
  config: json("config"),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  status: true,
  config: true,
});

// Plugins for the system
export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  version: text("version").notNull(),
  description: text("description"),
  status: text("status").default("disabled").notNull(), // active, disabled, beta
  peerVersion: text("peer_version").notNull(), // core version compatibility
  config: json("config"),
  installed: timestamp("installed").defaultNow().notNull(),
  entryPoint: text("entry_point").default("index.js").notNull(),
  quotas: json("quotas").default({ cpuMs: 1000, memKb: 128000 }),
});

export const insertPluginSchema = createInsertSchema(plugins).pick({
  name: true,
  version: true,
  description: true,
  status: true,
  peerVersion: true,
  config: true,
  entryPoint: true,
  quotas: true,
});

// Background jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").default("queued").notNull(), // queued, processing, completed, failed
  worker: text("worker"),
  progress: integer("progress").default(0),
  result: json("result"),
  error: text("error"),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  name: true,
  status: true,
  worker: true,
});

// System logs
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").notNull(), // INFO, WARN, ERROR, DEBUG
  service: text("service").notNull(),
  message: text("message").notNull(),
});

export const insertLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  service: true,
  message: true,
});

// PITR snapshot metadata
export const snapshotMetadata = pgTable("snapshot_metadata", {
  lsn: text("lsn").primaryKey(),
  checksum: text("checksum"),
  timestamp: timestamp("ts").defaultNow().notNull(),
});

// AI provider status
export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").default("active").notNull(), // active, standby, error
  apiRate: integer("api_rate").default(100),
  lastCheck: timestamp("last_check").defaultNow().notNull(),
  config: json("config"),
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).pick({
  name: true,
  status: true,
  apiRate: true,
  config: true,
});

// System metrics
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  service: text("service").notNull(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  unit: text("unit"),
});

export const insertMetricSchema = createInsertSchema(systemMetrics).pick({
  service: true,
  name: true,
  value: true,
  unit: true,
});

// Plugin Marketplace
export const pluginProducts = pgTable("plugin_products", {
  id: serial("id").primaryKey(),
  pluginId: integer("plugin_id").notNull(), // Reference to the plugin
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  type: text("type").default("one-time").notNull(), // one-time, subscription
  active: boolean("active").default(true).notNull(),
  features: json("features"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPluginProductSchema = createInsertSchema(pluginProducts).pick({
  pluginId: true,
  name: true,
  description: true,
  price: true,
  stripePriceId: true,
  stripeProductId: true,
  type: true,
  active: true,
  features: true,
});

// User plugin purchases
export const userPlugins = pgTable("user_plugins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pluginId: integer("plugin_id").notNull(),
  productId: integer("product_id").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"), // For subscriptions
  active: boolean("active").default(true).notNull(),
  stripePaymentId: text("stripe_payment_id"),
  stripeProductId: text("stripe_product_id"),
});

export const insertUserPluginSchema = createInsertSchema(userPlugins).pick({
  userId: true,
  pluginId: true,
  productId: true,
  expiryDate: true,
  active: true,
  stripePaymentId: true,
  stripeProductId: true,
});

// Types for database models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type SnapshotMetadata = typeof snapshotMetadata.$inferSelect;

export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type PluginProduct = typeof pluginProducts.$inferSelect;
export type InsertPluginProduct = z.infer<typeof insertPluginProductSchema>;

export type UserPlugin = typeof userPlugins.$inferSelect;
export type InsertUserPlugin = z.infer<typeof insertUserPluginSchema>;

// Geocode call tracking for metered billing
export const geocodeCalls = pgTable("geocode_calls", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(), // The customer/tenant ID
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  address: text("address"),
  success: boolean("success").default(true),
  responseTime: integer("response_time_ms"), // Response time in milliseconds
  chargeStatus: text("charge_status").default("pending"), // pending, charged, failed
});

export const insertGeocodeCallSchema = createInsertSchema(geocodeCalls).pick({
  tenantId: true,
  address: true,
  success: true,
  responseTime: true,
  chargeStatus: true,
});

export type GeocodeCall = typeof geocodeCalls.$inferSelect;
export type InsertGeocodeCall = z.infer<typeof insertGeocodeCallSchema>;

// Land parcels (fields) data
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 50 }).notNull().unique(), // External reference ID
  name: text("name").notNull(),
  description: text("description"),
  // Geospatial data
  boundary: json("boundary"), // GeoJSON polygon of the property boundary
  centerLat: decimal("center_lat", { precision: 10, scale: 6 }),
  centerLng: decimal("center_lng", { precision: 10, scale: 6 }),
  areaHectares: decimal("area_hectares", { precision: 10, scale: 2 }),
  // Agricultural data
  soilType: text("soil_type"),
  soilPh: decimal("soil_ph", { precision: 4, scale: 2 }),
  soilOrganicMatter: decimal("soil_organic_matter", { precision: 5, scale: 2 }), // Percentage
  currentCrop: text("current_crop"),
  previousCrop: text("previous_crop"),
  plantingDate: timestamp("planting_date"),
  harvestDate: timestamp("harvest_date"),
  // Irrigation data
  irrigationType: text("irrigation_type"), // drip, sprinkler, flood, none
  irrigationSchedule: json("irrigation_schedule"),
  waterSource: text("water_source"),
  // Management data
  ownerId: integer("owner_id").notNull(), // Reference to user
  accessRights: json("access_rights"), // Who can see/edit this parcel
  status: text("status").default("active").notNull(), // active, inactive, archived
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastVisited: timestamp("last_visited"),
  // Mobile sync data
  syncStatus: text("sync_status").default("pending"),
  lastSynced: timestamp("last_synced"),
  version: integer("version").default(1).notNull(),
});

export const insertParcelSchema = createInsertSchema(parcels)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    boundary: z.any().optional(),
    accessRights: z.any().optional(),
    irrigationSchedule: z.any().optional(),
  });

// Parcel notes for mobile sync
export const parcelNotes = pgTable("parcel_notes", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().unique(),
  content: text("content").default(""), // Plain text content
  yDocData: text("y_doc_data"), // Base64 encoded Y.Doc update (CRDT)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").notNull(), // User who last updated
  syncCount: integer("sync_count").default(0), // Number of times synced
  // Additional note fields
  category: text("category").default("general"), // general, soil, irrigation, pest, harvest, etc.
  weatherConditions: json("weather_conditions"), // Temperature, humidity, etc. at time of note
  attachments: json("attachments"), // References to photos, documents, etc.
  location: json("location"), // GPS coordinates where note was taken (might differ from parcel center)
  isImportant: boolean("is_important").default(false),
});

export const insertParcelNoteSchema = createInsertSchema(parcelNotes)
  .pick({
    parcelId: true,
    content: true,
    yDocData: true,
    userId: true,
    category: true,
    weatherConditions: true,
    attachments: true,
    location: true,
    isImportant: true,
  })
  .extend({
    weatherConditions: z.any().optional(),
    attachments: z.any().optional(),
    location: z.any().optional(),
  });

// Parcel measurements for tracking field data
export const parcelMeasurements = pgTable("parcel_measurements", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
  measurementType: text("measurement_type").notNull(), // soil, crop, water, pest, etc.
  value: decimal("value", { precision: 10, scale: 2 }),
  unit: text("unit").notNull(),
  location: json("location"), // Specific location within the parcel
  notes: text("notes"),
  deviceId: text("device_id"), // ID of the device used for measurement
  syncStatus: text("sync_status").default("pending"),
});

export const insertParcelMeasurementSchema = createInsertSchema(parcelMeasurements)
  .omit({ id: true })
  .extend({
    location: z.any().optional(),
  });

// Export types for all new schemas
export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type ParcelNote = typeof parcelNotes.$inferSelect;
export type InsertParcelNote = z.infer<typeof insertParcelNoteSchema>;

export type ParcelMeasurement = typeof parcelMeasurements.$inferSelect;
export type InsertParcelMeasurement = z.infer<typeof insertParcelMeasurementSchema>;
