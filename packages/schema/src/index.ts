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
});

export const insertPluginSchema = createInsertSchema(plugins).pick({
  name: true,
  version: true,
  description: true,
  status: true,
  peerVersion: true,
  config: true,
});

// Background jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").default("pending").notNull(), // pending, running, completed, failed
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  data: json("data"),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  name: true,
  status: true,
  data: true,
});

// System logs
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").notNull(), // debug, info, warn, error
  source: text("source").notNull(),
  message: text("message").notNull(),
  metadata: json("metadata"),
});

export const insertLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  source: true,
  message: true,
  metadata: true,
});

// Snapshot metadata for point-in-time recovery
export const snapshotMetadata = pgTable("snapshot_metadata", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  lsn: text("lsn").notNull(), // Log Sequence Number 
  checksum: text("checksum").notNull(),
  size: integer("size"),
  status: text("status").default("completed").notNull(), // completed, failed, in-progress
});

// AI Providers
export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").default("active").notNull(), // active, disabled, maintenance
  models: json("models").notNull(),
  tokenMapping: json("token_mapping"),
  usageMetrics: json("usage_metrics"),
  config: json("config"),
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).pick({
  name: true,
  status: true,
  models: true,
  tokenMapping: true,
  config: true,
});

// System metrics
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  service: text("service"),
  name: text("name").notNull(),
  value: decimal("value").notNull(),
  unit: text("unit"),
  metadata: json("metadata"),
});

export const insertMetricSchema = createInsertSchema(systemMetrics).pick({
  service: true,
  name: true,
  value: true,
  unit: true,
  metadata: true,
});

// Plugin products in the marketplace
export const pluginProducts = pgTable("plugin_products", {
  id: serial("id").primaryKey(),
  pluginId: integer("plugin_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price"),
  currency: text("currency").default("USD"),
  billingType: text("billing_type").default("one-time"), // one-time, subscription, usage-based
  billingPeriod: text("billing_period"), // monthly, yearly - for subscription
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
  metadata: json("metadata"),
});

export const insertPluginProductSchema = createInsertSchema(pluginProducts).pick({
  pluginId: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  billingType: true,
  billingPeriod: true,
  stripeProductId: true,
  stripePriceId: true,
  isPublic: true,
  metadata: true,
});

// User-Plugin relationships
export const userPlugins = pgTable("user_plugins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pluginId: integer("plugin_id").notNull(),
  status: text("status").default("active").notNull(), // active, suspended, expired
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  config: json("config"),
});

export const insertUserPluginSchema = createInsertSchema(userPlugins).pick({
  userId: true,
  pluginId: true,
  status: true,
  expiresAt: true,
  config: true,
});

// Geocoding API call tracking
export const geocodeCalls = pgTable("geocode_calls", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(), // maps to user ID for multi-tenancy
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  address: text("address").notNull(),
  success: boolean("success").default(true),
  responseTime: integer("response_time"), // in milliseconds
  chargeStatus: text("charge_status").default("pending"), // pending, charged, failed, waived
});

export const insertGeocodeCallSchema = createInsertSchema(geocodeCalls).pick({
  tenantId: true,
  address: true,
  success: true,
  responseTime: true,
});

// Parcel data
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  tenantId: integer("tenant_id").notNull(), // maps to user ID for multi-tenancy
  name: text("name").notNull(),
  status: text("status").default("active").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  coordinates: json("coordinates").notNull(), // GeoJSON format
  areaHectares: decimal("area_hectares").notNull(),
  currentCrop: text("current_crop"),
  soilType: text("soil_type"),
  attributes: json("attributes"),
  plantingDate: timestamp("planting_date"),
  harvestDate: timestamp("harvest_date"),
  irrigationType: text("irrigation_type"),
  waterSource: text("water_source"),
  soilPh: decimal("soil_ph"),
  soilOrganicMatter: decimal("soil_organic_matter"),
  lastVisited: timestamp("last_visited"),
});

export const insertParcelSchema = createInsertSchema(parcels)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Parcel notes
export const parcelNotes = pgTable("parcel_notes", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  type: text("type").default("general"), // general, issue, observation
  status: text("status").default("active"), // active, resolved, archived
  attachments: json("attachments"),
});

export const insertParcelNoteSchema = createInsertSchema(parcelNotes)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Parcel measurements
export const parcelMeasurements = pgTable("parcel_measurements", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").notNull(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  measurementType: text("measurement_type").notNull(), // soil, crop, water, etc.
  value: decimal("value").notNull(),
  unit: text("unit").notNull(),
  coordinates: json("coordinates"), // GeoJSON Point where measurement was taken
  metadata: json("metadata"),
});

export const insertParcelMeasurementSchema = createInsertSchema(parcelMeasurements)
  .omit({ id: true });

// Export the types
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

export type GeocodeCall = typeof geocodeCalls.$inferSelect;
export type InsertGeocodeCall = z.infer<typeof insertGeocodeCallSchema>;

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type ParcelNote = typeof parcelNotes.$inferSelect;
export type InsertParcelNote = z.infer<typeof insertParcelNoteSchema>;

export type ParcelMeasurement = typeof parcelMeasurements.$inferSelect;
export type InsertParcelMeasurement = z.infer<typeof insertParcelMeasurementSchema>;