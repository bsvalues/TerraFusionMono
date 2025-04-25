import { pgTable, text, serial, integer, timestamp, json, boolean, varchar, decimal, pgEnum, index, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for crop health
export const cropHealthStatusEnum = pgEnum('crop_health_status', [
  'excellent', 'good', 'fair', 'poor', 'critical'
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low', 'medium', 'high', 'severe'
]);

export const growthStageEnum = pgEnum('growth_stage', [
  'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'senescence'
]);

export const weatherRiskTypeEnum = pgEnum('weather_risk_type', [
  'drought', 'frost', 'flood', 'heat_stress', 'wind_damage', 'hail'
]);

export const pestRiskTypeEnum = pgEnum('pest_risk_type', [
  'insect', 'fungal', 'bacterial', 'viral', 'weed'
]);

export const nutritionalDeficiencyTypeEnum = pgEnum('nutritional_deficiency_type', [
  'nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium', 
  'sulfur', 'iron', 'zinc', 'manganese', 'boron'
]);

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

// Define the relations between users and other tables with foreign keys
// For userPlugins: userId references users.id
// For parcels: ownerId references users.id

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

// Define the relations between plugins and other tables with foreign keys
// For pluginProducts: pluginId references plugins.id
// For userPlugins: pluginId references plugins.id

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
  pluginId: integer("plugin_id").notNull().references(() => plugins.id), // Reference to the plugin
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
  userId: integer("user_id").notNull().references(() => users.id),
  pluginId: integer("plugin_id").notNull().references(() => plugins.id),
  productId: integer("product_id").notNull().references(() => pluginProducts.id),
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
  tenantId: integer("tenant_id").notNull().references(() => users.id), // The customer/tenant ID references users
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
  ownerId: integer("owner_id").notNull().references(() => users.id), // Reference to user
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
}, (table) => {
  return {
    ownerIdIdx: index("parcels_owner_id_idx").on(table.ownerId),
    statusIdx: index("parcels_status_idx").on(table.status),
    createdAtIdx: index("parcels_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("parcels_updated_at_idx").on(table.updatedAt),
    currentCropIdx: index("parcels_current_crop_idx").on(table.currentCrop),
  };
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
  parcelId: varchar("parcel_id", { length: 50 }).notNull().unique().references(() => parcels.externalId, { onDelete: 'cascade' }),
  content: text("content").default(""), // Plain text content
  yDocData: text("y_doc_data"), // Base64 encoded Y.Doc update (CRDT)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id), // User who last updated
  syncCount: integer("sync_count").default(0), // Number of times synced
  // Additional note fields
  category: text("category").default("general"), // general, soil, irrigation, pest, harvest, etc.
  weatherConditions: json("weather_conditions"), // Temperature, humidity, etc. at time of note
  attachments: json("attachments"), // References to photos, documents, etc.
  location: json("location"), // GPS coordinates where note was taken (might differ from parcel center)
  isImportant: boolean("is_important").default(false),
}, (table) => {
  return {
    userIdIdx: index("parcel_notes_user_id_idx").on(table.userId),
    createdAtIdx: index("parcel_notes_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("parcel_notes_updated_at_idx").on(table.updatedAt),
    categoryIdx: index("parcel_notes_category_idx").on(table.category),
    importantIdx: index("parcel_notes_important_idx").on(table.isImportant),
  };
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
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  measurementType: text("measurement_type").notNull(), // soil, crop, water, pest, etc.
  value: decimal("value", { precision: 10, scale: 2 }),
  unit: text("unit").notNull(),
  location: json("location"), // Specific location within the parcel
  notes: text("notes"),
  deviceId: text("device_id"), // ID of the device used for measurement
  syncStatus: text("sync_status").default("pending"),
}, (table) => {
  return {
    parcelIdIdx: index("parcel_measurements_parcel_id_idx").on(table.parcelId),
    userIdIdx: index("parcel_measurements_user_id_idx").on(table.userId),
    timestampIdx: index("parcel_measurements_timestamp_idx").on(table.timestamp),
    measurementTypeIdx: index("parcel_measurements_type_idx").on(table.measurementType),
    deviceIdIdx: index("parcel_measurements_device_id_idx").on(table.deviceId),
    syncStatusIdx: index("parcel_measurements_sync_status_idx").on(table.syncStatus),
  };
});

export const insertParcelMeasurementSchema = createInsertSchema(parcelMeasurements)
  .omit({ id: true })
  .extend({
    location: z.any().optional(),
  });

// Crop Health Analysis tables
export const cropHealthAnalyses = pgTable("crop_health_analyses", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  cropType: text("crop_type").notNull(),
  overallHealth: cropHealthStatusEnum("overall_health").notNull(),
  healthScore: integer("health_score").notNull(), // 0-100
  confidenceLevel: decimal("confidence_level", { precision: 4, scale: 3 }).notNull(), // 0-1
  growthStage: growthStageEnum("growth_stage").notNull(),
  growthProgress: decimal("growth_progress", { precision: 5, scale: 2 }).notNull(), // 0-100
  estimatedHarvestDate: timestamp("estimated_harvest_date"),
  aiModel: text("ai_model").notNull(),
  rawResponse: json("raw_response"),
  recommendations: json("recommendations"),
  images: json("images"), // Array of image references
}, (table) => {
  return {
    parcelIdIdx: index("crop_health_analyses_parcel_id_idx").on(table.parcelId),
    userIdIdx: index("crop_health_analyses_user_id_idx").on(table.userId),
    timestampIdx: index("crop_health_analyses_timestamp_idx").on(table.timestamp),
    cropTypeIdx: index("crop_health_analyses_crop_type_idx").on(table.cropType),
    healthScoreIdx: index("crop_health_analyses_health_score_idx").on(table.healthScore),
    overallHealthIdx: index("crop_health_analyses_overall_health_idx").on(table.overallHealth),
    growthStageIdx: index("crop_health_analyses_growth_stage_idx").on(table.growthStage),
  };
});

export const insertCropHealthAnalysisSchema = createInsertSchema(cropHealthAnalyses)
  .omit({ id: true })
  .extend({
    recommendations: z.any().optional(),
    images: z.any().optional(),
    rawResponse: z.any().optional()
  });

// Disease detections
export const diseaseDetections = pgTable("disease_detections", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").notNull().references(() => cropHealthAnalyses.id, { onDelete: 'cascade' }), // Reference to crop_health_analyses
  diseaseName: text("disease_name").notNull(),
  diseaseType: pestRiskTypeEnum("disease_type").notNull(),
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(), // 0-1
  severity: riskLevelEnum("severity").notNull(),
  affectedArea: decimal("affected_area", { precision: 5, scale: 2 }), // percentage
  symptoms: json("symptoms"), // Array of symptom descriptions
  progression: text("progression"), // early, developing, advanced
  recommendations: json("recommendations"), // Array of treatment recommendations
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  images: json("images"), // Array of image references
}, (table) => {
  return {
    analysisIdIdx: index("disease_detections_analysis_id_idx").on(table.analysisId),
    diseaseNameIdx: index("disease_detections_disease_name_idx").on(table.diseaseName),
    diseaseTypeIdx: index("disease_detections_disease_type_idx").on(table.diseaseType),
    severityIdx: index("disease_detections_severity_idx").on(table.severity),
    progressionIdx: index("disease_detections_progression_idx").on(table.progression),
    detectedAtIdx: index("disease_detections_detected_at_idx").on(table.detectedAt),
  };
});

export const insertDiseaseDetectionSchema = createInsertSchema(diseaseDetections)
  .omit({ id: true, detectedAt: true, updatedAt: true })
  .extend({
    symptoms: z.any().optional(),
    recommendations: z.any().optional(),
    images: z.any().optional()
  });

// Soil analysis results
export const soilAnalyses = pgTable("soil_analyses", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  soilType: text("soil_type"),
  ph: decimal("ph", { precision: 4, scale: 2 }),
  organicMatter: decimal("organic_matter", { precision: 5, scale: 2 }),
  nitrogenLevel: decimal("nitrogen_level", { precision: 6, scale: 2 }),
  phosphorusLevel: decimal("phosphorus_level", { precision: 6, scale: 2 }),
  potassiumLevel: decimal("potassium_level", { precision: 6, scale: 2 }),
  otherNutrients: json("other_nutrients"),
  waterRetention: text("water_retention"),
  texture: json("texture"), // sand/silt/clay percentages
  suitabilityScore: integer("suitability_score"), // 0-100
  deficiencies: json("deficiencies"), // Array of deficiency objects
  recommendations: json("recommendations"), // Array of recommendation strings
  aiGenerated: boolean("ai_generated").default(false),
  labVerified: boolean("lab_verified").default(false),
}, (table) => {
  return {
    parcelIdIdx: index("soil_analyses_parcel_id_idx").on(table.parcelId),
    userIdIdx: index("soil_analyses_user_id_idx").on(table.userId),
    timestampIdx: index("soil_analyses_timestamp_idx").on(table.timestamp),
    soilTypeIdx: index("soil_analyses_soil_type_idx").on(table.soilType),
    aiGeneratedIdx: index("soil_analyses_ai_generated_idx").on(table.aiGenerated),
    labVerifiedIdx: index("soil_analyses_lab_verified_idx").on(table.labVerified),
  };
});

export const insertSoilAnalysisSchema = createInsertSchema(soilAnalyses)
  .omit({ id: true })
  .extend({
    otherNutrients: z.any().optional(),
    texture: z.any().optional(),
    deficiencies: z.any().optional(),
    recommendations: z.any().optional()
  });

// Yield predictions
export const yieldPredictions = pgTable("yield_predictions", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  cropType: text("crop_type").notNull(),
  predictedYieldValue: decimal("predicted_yield_value", { precision: 10, scale: 2 }).notNull(),
  predictedYieldUnit: text("predicted_yield_unit").notNull(),
  yieldPerHectare: decimal("yield_per_hectare", { precision: 10, scale: 2 }),
  confidenceLow: decimal("confidence_low", { precision: 10, scale: 2 }),
  confidenceHigh: decimal("confidence_high", { precision: 10, scale: 2 }),
  confidenceLevel: decimal("confidence_level", { precision: 4, scale: 3 }),
  factorsAffecting: json("factors_affecting"),
  comparisonToAverage: integer("comparison_to_average"), // percentage +/-
  harvestDateEstimate: timestamp("harvest_date_estimate"),
  marketValuePerUnit: decimal("market_value_per_unit", { precision: 10, scale: 2 }),
  marketValueTotal: decimal("market_value_total", { precision: 12, scale: 2 }),
  qualityPrediction: json("quality_prediction"),
  aiModel: text("ai_model").notNull(),
  scenario: text("scenario").default("baseline"), // baseline, drought, excess_rain, etc.
}, (table) => {
  return {
    parcelIdIdx: index("yield_predictions_parcel_id_idx").on(table.parcelId),
    userIdIdx: index("yield_predictions_user_id_idx").on(table.userId),
    timestampIdx: index("yield_predictions_timestamp_idx").on(table.timestamp),
    cropTypeIdx: index("yield_predictions_crop_type_idx").on(table.cropType),
    scenarioIdx: index("yield_predictions_scenario_idx").on(table.scenario),
    harvestDateIdx: index("yield_predictions_harvest_date_idx").on(table.harvestDateEstimate),
  };
});

export const insertYieldPredictionSchema = createInsertSchema(yieldPredictions)
  .omit({ id: true })
  .extend({
    factorsAffecting: z.any().optional(),
    qualityPrediction: z.any().optional()
  });

// Crop health images
export const cropHealthImages = pgTable("crop_health_images", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull(), // satellite, drone, mobile, etc.
  category: text("category").notNull(), // general, disease, soil, crop
  aiAnalyzed: boolean("ai_analyzed").default(false),
  analysisResults: json("analysis_results"),
  location: json("location"), // Geolocation where the image was taken
  tags: json("tags"), // Array of tags
}, (table) => {
  return {
    parcelIdIdx: index("crop_health_images_parcel_id_idx").on(table.parcelId),
    userIdIdx: index("crop_health_images_user_id_idx").on(table.userId),
    timestampIdx: index("crop_health_images_timestamp_idx").on(table.timestamp),
    typeIdx: index("crop_health_images_type_idx").on(table.type),
    categoryIdx: index("crop_health_images_category_idx").on(table.category),
    aiAnalyzedIdx: index("crop_health_images_ai_analyzed_idx").on(table.aiAnalyzed),
  };
});

export const insertCropHealthImageSchema = createInsertSchema(cropHealthImages)
  .omit({ id: true })
  .extend({
    analysisResults: z.any().optional(),
    location: z.any().optional(),
    tags: z.any().optional()
  });

// Weather data for crop health analysis
export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  dataType: text("data_type").notNull(), // forecast, historical, current
  source: text("source").notNull(), // weather service name
  temperatureMin: decimal("temperature_min", { precision: 5, scale: 2 }),
  temperatureMax: decimal("temperature_max", { precision: 5, scale: 2 }),
  temperatureAvg: decimal("temperature_avg", { precision: 5, scale: 2 }),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  precipitation: decimal("precipitation", { precision: 6, scale: 2 }),
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  windDirection: integer("wind_direction"),
  conditions: text("conditions"), // clear, cloudy, rain, etc.
  additionalData: json("additional_data"),
}, (table) => {
  return {
    parcelIdIdx: index("weather_data_parcel_id_idx").on(table.parcelId),
    timestampIdx: index("weather_data_timestamp_idx").on(table.timestamp),
    dataTypeIdx: index("weather_data_data_type_idx").on(table.dataType),
    sourceIdx: index("weather_data_source_idx").on(table.source),
    conditionsIdx: index("weather_data_conditions_idx").on(table.conditions),
  };
});

export const insertWeatherDataSchema = createInsertSchema(weatherData)
  .omit({ id: true })
  .extend({
    additionalData: z.any().optional()
  });

// Export types for all schemas
export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type ParcelNote = typeof parcelNotes.$inferSelect;
export type InsertParcelNote = z.infer<typeof insertParcelNoteSchema>;

export type ParcelMeasurement = typeof parcelMeasurements.$inferSelect;
export type InsertParcelMeasurement = z.infer<typeof insertParcelMeasurementSchema>;

// Export types for crop health schemas
export type CropHealthAnalysis = typeof cropHealthAnalyses.$inferSelect;
export type InsertCropHealthAnalysis = z.infer<typeof insertCropHealthAnalysisSchema>;

export type DiseaseDetection = typeof diseaseDetections.$inferSelect;
export type InsertDiseaseDetection = z.infer<typeof insertDiseaseDetectionSchema>;

export type SoilAnalysis = typeof soilAnalyses.$inferSelect;
export type InsertSoilAnalysis = z.infer<typeof insertSoilAnalysisSchema>;

export type YieldPrediction = typeof yieldPredictions.$inferSelect;
export type InsertYieldPrediction = z.infer<typeof insertYieldPredictionSchema>;

export type CropHealthImage = typeof cropHealthImages.$inferSelect;
export type InsertCropHealthImage = z.infer<typeof insertCropHealthImageSchema>;

export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;

// Crop Identification results (from AR tool)
// Crop Analysis Requests table for tracking crop analysis API requests
export const cropAnalysisRequests = pgTable("crop_analysis_requests", {
  id: serial("id").primaryKey(),
  requestType: varchar("request_type", { length: 50 }).notNull(), // basic, advanced, recommendation, yield-prediction
  cropType: varchar("crop_type", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  filePath: varchar("file_path", { length: 255 }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  metadata: json("metadata") // For additional data like soil type, weather, etc.
}, (table) => {
  return {
    requestTypeIdx: index("crop_analysis_requests_type_idx").on(table.requestType),
    cropTypeIdx: index("crop_analysis_requests_crop_type_idx").on(table.cropType),
    timestampIdx: index("crop_analysis_requests_timestamp_idx").on(table.timestamp),
    userIdIdx: index("crop_analysis_requests_user_id_idx").on(table.userId),
  };
});

export const insertCropAnalysisRequestSchema = createInsertSchema(cropAnalysisRequests).omit({
  id: true,
});

export type CropAnalysisRequest = typeof cropAnalysisRequests.$inferSelect;
export type InsertCropAnalysisRequest = z.infer<typeof insertCropAnalysisRequestSchema>;

export const cropIdentifications = pgTable("crop_identifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  parcelId: varchar("parcel_id", { length: 50 }).references(() => parcels.externalId),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  cropName: text("crop_name").notNull(),
  scientificName: text("scientific_name"),
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(), // 0-1
  estimatedGrowthStage: text("estimated_growth_stage"),
  details: text("details"),
  characteristics: text("characteristics").array(),
  possibleAlternatives: text("possible_alternatives").array(),
  imageUrl: text("image_url"), // URL or path to the image
  thumbnailUrl: text("thumbnail_url"), // URL or path to thumbnail
  locationLat: decimal("location_lat", { precision: 10, scale: 6 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 6 }),
  rawResponse: json("raw_response"),
  verified: boolean("verified").default(false),
  feedback: text("feedback"), // positive, negative, or specific feedback text
}, (table) => {
  return {
    userIdIdx: index("crop_identifications_user_id_idx").on(table.userId),
    parcelIdIdx: index("crop_identifications_parcel_id_idx").on(table.parcelId),
    timestampIdx: index("crop_identifications_timestamp_idx").on(table.timestamp),
    cropNameIdx: index("crop_identifications_crop_name_idx").on(table.cropName),
    confidenceIdx: index("crop_identifications_confidence_idx").on(table.confidence),
  };
});

export const insertCropIdentificationSchema = createInsertSchema(cropIdentifications)
  .omit({ id: true, timestamp: true })
  .extend({
    rawResponse: z.any().optional()
  });

export type CropIdentification = typeof cropIdentifications.$inferSelect;
export type InsertCropIdentification = z.infer<typeof insertCropIdentificationSchema>;

// ====== WEBSOCKET COLLABORATION SYSTEM ======

// New enum for collaboration event types
export const collaborationEventTypeEnum = pgEnum('collaboration_event_type', [
  'update', 'presence', 'cursor', 'join', 'leave', 'comment', 'sync', 'error'
]);

// Collaboration session status
export const collaborationStatusEnum = pgEnum('collaboration_status', [
  'active', 'paused', 'completed', 'archived'
]);

// Collaboration sessions for real-time editing
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().unique(), // UUID for the session
  name: text("name").notNull(),
  documentType: text("document_type").notNull(), // parcel_note, field_report, soil_analysis, etc.
  documentId: text("document_id").notNull(), // ID of the document being edited
  ownerId: integer("owner_id").notNull().references(() => users.id),
  status: collaborationStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  metadata: json("metadata"), // Additional session metadata
  config: json("config"), // Session configuration
}, (table) => {
  return {
    documentIdx: index("collab_sessions_document_idx").on(table.documentType, table.documentId),
    ownerIdx: index("collab_sessions_owner_idx").on(table.ownerId),
    statusIdx: index("collab_sessions_status_idx").on(table.status),
    lastActivityIdx: index("collab_sessions_activity_idx").on(table.lastActivity),
  };
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions)
  .omit({ id: true, createdAt: true, updatedAt: true, lastActivity: true })
  .extend({
    metadata: z.any().optional(),
    config: z.any().optional(),
  });

// Session participants
export const sessionParticipants = pgTable("session_participants", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => collaborationSessions.sessionId, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true).notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  cursorPosition: json("cursor_position"), // Current cursor position
  selection: json("selection"), // Current text selection
  color: text("color"), // User's display color in the session
  presence: json("presence"), // Additional presence data
}, (table) => {
  return {
    sessionUserIdx: uniqueIndex("session_participant_unique_idx").on(table.sessionId, table.userId),
    activeIdx: index("session_participant_active_idx").on(table.isActive),
    activityIdx: index("session_participant_activity_idx").on(table.lastActivity),
  };
});

export const insertSessionParticipantSchema = createInsertSchema(sessionParticipants)
  .omit({ id: true, joinedAt: true, lastActivity: true })
  .extend({
    cursorPosition: z.any().optional(),
    selection: z.any().optional(),
    presence: z.any().optional(),
  });

// Document versions for collaborative editing
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => collaborationSessions.sessionId, { onDelete: 'cascade' }),
  documentType: text("document_type").notNull(),
  documentId: text("document_id").notNull(),
  version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(), // Base64 encoded Y.js document
  yState: text("y_state").notNull(), // Base64 encoded Y.js document state
  userId: integer("user_id").notNull().references(() => users.id), // User who created this version
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"), // Version metadata
}, (table) => {
  return {
    sessionIdx: index("doc_versions_session_idx").on(table.sessionId),
    documentIdx: index("doc_versions_document_idx").on(table.documentType, table.documentId),
    versionIdx: index("doc_versions_version_idx").on(table.version),
    timestampIdx: index("doc_versions_timestamp_idx").on(table.timestamp),
  };
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions)
  .omit({ id: true, timestamp: true })
  .extend({
    metadata: z.any().optional(),
  });

// Collaboration events for auditing and replay
export const collaborationEvents = pgTable("collaboration_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => collaborationSessions.sessionId, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  eventType: collaborationEventTypeEnum("event_type").notNull(),
  data: json("data"), // Event-specific data
  clientId: text("client_id"), // ID of the client that generated the event
  metadata: json("metadata"), // Additional event metadata
}, (table) => {
  return {
    sessionIdx: index("collab_events_session_idx").on(table.sessionId),
    userIdx: index("collab_events_user_idx").on(table.userId),
    timestampIdx: index("collab_events_timestamp_idx").on(table.timestamp),
    typeIdx: index("collab_events_type_idx").on(table.eventType),
  };
});

export const insertCollaborationEventSchema = createInsertSchema(collaborationEvents)
  .omit({ id: true, timestamp: true })
  .extend({
    data: z.any().optional(),
    metadata: z.any().optional(),
  });

// ====== FIELD DATA COLLECTION SYSTEM ======

// Enum for observation types
export const observationTypeEnum = pgEnum('observation_type', [
  'soil', 'plant', 'pest', 'disease', 'weather', 'irrigation', 'harvest', 'general'
]);

// Enum for data collection methods
export const collectionMethodEnum = pgEnum('collection_method', [
  'manual', 'sensor', 'photo', 'satellite', 'drone', 'lab', 'survey'
]);

// Enum for data validation status
export const validationStatusEnum = pgEnum('validation_status', [
  'pending', 'valid', 'suspect', 'invalid', 'verified'
]);

// Field observations
export const fieldObservations = pgTable("field_observations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  observationId: varchar("observation_id", { length: 36 }).notNull().unique(), // UUID for sync
  observationType: observationTypeEnum("observation_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  location: json("location"), // GeoJSON point
  weather: json("weather"), // Weather conditions during observation
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  data: json("data"), // Flexible JSON data specific to the observation type
  mediaUrls: text("media_urls").array(), // Array of URLs to photos/videos
  collectionMethod: collectionMethodEnum("collection_method").default('manual').notNull(),
  validationStatus: validationStatusEnum("validation_status").default('pending').notNull(),
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  syncStatus: text("sync_status").default("pending"), // pending, synced, failed
  lastSynced: timestamp("last_synced"),
  version: integer("version").default(1).notNull(),
  deviceId: text("device_id"), // ID of the device used for data collection
}, (table) => {
  return {
    userIdx: index("field_observations_user_idx").on(table.userId),
    parcelIdx: index("field_observations_parcel_idx").on(table.parcelId),
    typeIdx: index("field_observations_type_idx").on(table.observationType),
    timestampIdx: index("field_observations_timestamp_idx").on(table.timestamp),
    validationIdx: index("field_observations_validation_idx").on(table.validationStatus),
    syncStatusIdx: index("field_observations_sync_idx").on(table.syncStatus),
    deviceIdx: index("field_observations_device_idx").on(table.deviceId),
  };
});

export const insertFieldObservationSchema = createInsertSchema(fieldObservations)
  .omit({ id: true, createdAt: true, updatedAt: true, lastSynced: true })
  .extend({
    location: z.any().optional(),
    weather: z.any().optional(),
    data: z.any().optional(),
    mediaUrls: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  });

// Sensor readings for field monitoring
export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  sensorId: text("sensor_id").notNull(), // ID of the sensor device
  parcelId: varchar("parcel_id", { length: 50 }).notNull().references(() => parcels.externalId, { onDelete: 'cascade' }),
  readingId: varchar("reading_id", { length: 36 }).notNull().unique(), // UUID for sync
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  readingType: text("reading_type").notNull(), // temperature, humidity, soil_moisture, etc.
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  location: json("location"), // GeoJSON point of sensor location
  battery: integer("battery"), // Battery level as percentage
  signalStrength: integer("signal_strength"), // Signal strength in dBm
  metadata: json("metadata"), // Additional sensor metadata
  validationStatus: validationStatusEnum("validation_status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  syncStatus: text("sync_status").default("pending"), // pending, synced, failed
  lastSynced: timestamp("last_synced"),
}, (table) => {
  return {
    sensorIdx: index("sensor_readings_sensor_idx").on(table.sensorId),
    parcelIdx: index("sensor_readings_parcel_idx").on(table.parcelId),
    typeIdx: index("sensor_readings_type_idx").on(table.readingType),
    timestampIdx: index("sensor_readings_timestamp_idx").on(table.timestamp),
    validationIdx: index("sensor_readings_validation_idx").on(table.validationStatus),
    syncStatusIdx: index("sensor_readings_sync_idx").on(table.syncStatus),
  };
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings)
  .omit({ id: true, createdAt: true, lastSynced: true })
  .extend({
    location: z.any().optional(),
    metadata: z.any().optional(),
  });

// ====== PLUGIN MARKETPLACE SYSTEM ======

// Enum for plugin review status
export const reviewStatusEnum = pgEnum('review_status', [
  'pending', 'approved', 'rejected', 'flagged'
]);

// Plugin reviews from users
export const pluginReviews = pgTable("plugin_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pluginId: integer("plugin_id").notNull().references(() => plugins.id),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content"),
  status: reviewStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  verifiedPurchase: boolean("verified_purchase").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  responseId: integer("response_id").references(() => pluginReviews.id), // For developer responses
  versionUsed: text("version_used"), // Plugin version used during review
}, (table) => {
  return {
    userPluginIdx: uniqueIndex("plugin_reviews_user_plugin_idx").on(table.userId, table.pluginId),
    pluginIdx: index("plugin_reviews_plugin_idx").on(table.pluginId),
    ratingIdx: index("plugin_reviews_rating_idx").on(table.rating),
    statusIdx: index("plugin_reviews_status_idx").on(table.status),
    createdAtIdx: index("plugin_reviews_created_at_idx").on(table.createdAt),
  };
});

export const insertPluginReviewSchema = createInsertSchema(pluginReviews)
  .omit({ id: true, createdAt: true, updatedAt: true, helpfulCount: true });

// Plugin categories for marketplace organization
export const pluginCategories = pgTable("plugin_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  parentId: integer("parent_id").references(() => pluginCategories.id), // For hierarchical categories
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPluginCategorySchema = createInsertSchema(pluginCategories)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Many-to-many relationship between plugins and categories
export const pluginCategoryRelations = pgTable("plugin_category_relations", {
  id: serial("id").primaryKey(),
  pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  categoryId: integer("category_id").notNull().references(() => pluginCategories.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pluginCategoryIdx: uniqueIndex("plugin_category_unique_idx").on(table.pluginId, table.categoryId),
  };
});

export const insertPluginCategoryRelationSchema = createInsertSchema(pluginCategoryRelations)
  .omit({ id: true });

// =======================================================================
// Types for the new models
// =======================================================================

// WebSocket Collaboration types
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type InsertSessionParticipant = z.infer<typeof insertSessionParticipantSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type CollaborationEvent = typeof collaborationEvents.$inferSelect;
export type InsertCollaborationEvent = z.infer<typeof insertCollaborationEventSchema>;

// Field Data Collection types
export type FieldObservation = typeof fieldObservations.$inferSelect;
export type InsertFieldObservation = z.infer<typeof insertFieldObservationSchema>;

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;

// Plugin Marketplace types
export type PluginReview = typeof pluginReviews.$inferSelect;
export type InsertPluginReview = z.infer<typeof insertPluginReviewSchema>;

export type PluginCategory = typeof pluginCategories.$inferSelect;
export type InsertPluginCategory = z.infer<typeof insertPluginCategorySchema>;

export type PluginCategoryRelation = typeof pluginCategoryRelations.$inferSelect;
export type InsertPluginCategoryRelation = z.infer<typeof insertPluginCategoryRelationSchema>;

// Type exports are already defined above
