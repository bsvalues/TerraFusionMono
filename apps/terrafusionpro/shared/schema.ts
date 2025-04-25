import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
export type Json = Record<string, any>;

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  company: text("company"),
  licenseNumber: text("license_number"),
  email: text("email").unique(),
  phoneNumber: text("phone_number"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  company: true,
  licenseNumber: true,
  email: true,
  phoneNumber: true,
});

// Property model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county"),
  legalDescription: text("legal_description"),
  taxParcelId: text("tax_parcel_id"),
  propertyType: text("property_type").notNull(),
  yearBuilt: integer("year_built"),
  effectiveAge: integer("effective_age"),
  grossLivingArea: numeric("gross_living_area"),
  lotSize: numeric("lot_size"),
  bedrooms: numeric("bedrooms"),
  bathrooms: numeric("bathrooms"),
  basement: text("basement"),
  garage: text("garage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  userId: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  county: true,
  legalDescription: true,
  taxParcelId: true,
  propertyType: true,
  yearBuilt: true,
  effectiveAge: true,
  grossLivingArea: true,
  lotSize: true,
  bedrooms: true,
  bathrooms: true,
  basement: true,
  garage: true,
});

// Appraisal Report model
export const appraisalReports = pgTable("appraisal_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  reportType: text("report_type").notNull(),
  formType: text("form_type").notNull(),
  status: text("status").notNull().default("draft"),
  purpose: text("purpose"),
  effectiveDate: timestamp("effective_date"),
  reportDate: timestamp("report_date"),
  clientName: text("client_name"),
  clientAddress: text("client_address"),
  lenderName: text("lender_name"),
  lenderAddress: text("lender_address"),
  borrowerName: text("borrower_name"),
  occupancy: text("occupancy"),
  salesPrice: numeric("sales_price"),
  marketValue: numeric("market_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create base schema
const baseAppraisalReportSchema = createInsertSchema(appraisalReports).pick({
  userId: true,
  propertyId: true,
  reportType: true,
  formType: true,
  status: true,
  purpose: true,
  effectiveDate: true,
  reportDate: true,
  clientName: true,
  clientAddress: true,
  lenderName: true,
  lenderAddress: true,
  borrowerName: true,
  occupancy: true,
  salesPrice: true,
  marketValue: true,
});

// Override date fields to accept string ISO dates
export const insertAppraisalReportSchema = baseAppraisalReportSchema.extend({
  effectiveDate: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  reportDate: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
});

// Comparable model
export const comparables = pgTable("comparables", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  compType: text("comp_type").notNull(), // e.g., "sale", "listing", "rental"
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  proximityToSubject: text("proximity_to_subject"),
  salePrice: numeric("sale_price"),
  pricePerSqFt: numeric("price_per_sqft"),
  saleDate: timestamp("sale_date"),
  saleOrFinancingConcessions: text("sale_or_financing_concessions"),
  locationRating: text("location_rating"),
  siteSize: numeric("site_size"),
  siteUnit: text("site_unit").default("sq ft"),
  view: text("view"),
  design: text("design"),
  quality: text("quality"),
  age: integer("age"),
  condition: text("condition"),
  aboveGradeRooms: integer("above_grade_rooms"),
  bedrooms: numeric("bedrooms"),
  bathrooms: numeric("bathrooms"),
  grossLivingArea: numeric("gross_living_area"),
  basement: text("basement"),
  basementFinished: text("basement_finished"),
  functionalUtility: text("functional_utility"),
  heatingCooling: text("heating_cooling"),
  garage: text("garage"),
  porchPatiosDeck: text("porch_patios_deck"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComparableSchema = createInsertSchema(comparables).pick({
  reportId: true,
  compType: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  proximityToSubject: true,
  salePrice: true,
  pricePerSqFt: true,
  saleDate: true,
  saleOrFinancingConcessions: true,
  locationRating: true,
  siteSize: true,
  siteUnit: true,
  view: true,
  design: true,
  quality: true,
  age: true,
  condition: true,
  aboveGradeRooms: true,
  bedrooms: true,
  bathrooms: true,
  grossLivingArea: true,
  basement: true,
  basementFinished: true,
  functionalUtility: true,
  heatingCooling: true,
  garage: true,
  porchPatiosDeck: true,
});

// Adjustments model
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  adjustmentType: text("adjustment_type").notNull(), // e.g., "sale_concessions", "time", "location", etc.
  description: text("description"),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentSchema = createInsertSchema(adjustments).pick({
  reportId: true,
  comparableId: true,
  adjustmentType: true,
  description: true,
  amount: true,
});

// Photos model
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  photoType: text("photo_type").notNull(), // e.g., "subject_front", "subject_rear", "street_scene", etc.
  url: text("url").notNull(),
  caption: text("caption"),
  dateTaken: timestamp("date_taken"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  metadata: jsonb("metadata"), // Added metadata field for CRDT synchronization
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  reportId: true,
  photoType: true,
  url: true,
  caption: true,
  dateTaken: true,
  latitude: true,
  longitude: true,
  metadata: true,
});

// Sketches model
export const sketches = pgTable("sketches", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  sketchType: text("sketch_type").notNull(), // e.g., "floor_plan", "site_plan", etc.
  data: jsonb("data").notNull(), // Store sketch data as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSketchSchema = createInsertSchema(sketches).pick({
  reportId: true,
  sketchType: true,
  data: true,
});

// Adjustment Models
export const adjustmentModels = pgTable("adjustment_models", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  name: text("name").notNull(),
  description: text("description"),
  modelType: text("model_type").notNull(), // manual, ai-generated, market-derived, hybrid
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentModelSchema = createInsertSchema(adjustmentModels).pick({
  reportId: true,
  name: true,
  description: true,
  modelType: true,
  metadata: true,
});

// Model Adjustments - adjustments that are part of specific adjustment models
export const modelAdjustments = pgTable("model_adjustments", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => adjustmentModels.id),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  adjustmentType: text("adjustment_type").notNull(),
  description: text("description"),
  amount: numeric("amount").notNull(),
  confidence: numeric("confidence"), // For AI-generated adjustments
  reasoning: text("reasoning"), // Explanation for the adjustment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertModelAdjustmentSchema = createInsertSchema(modelAdjustments).pick({
  modelId: true,
  comparableId: true,
  adjustmentType: true,
  description: true,
  amount: true,
  confidence: true,
  reasoning: true,
});

// Market Analysis Data
export const marketAnalysis = pgTable("market_analysis", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  analysisType: text("analysis_type").notNull(), // regression, paired_sales, trend
  description: text("description"),
  data: jsonb("data").notNull(), // Store analysis data as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketAnalysisSchema = createInsertSchema(marketAnalysis).pick({
  reportId: true,
  analysisType: true,
  description: true,
  data: true,
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferenceName: text("preference_name").notNull(),
  preferenceValue: jsonb("preference_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  preferenceName: true,
  preferenceValue: true,
});

// Adjustment templates
export const adjustmentTemplates = pgTable("adjustment_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(),
  isPublic: boolean("is_public").default(false),
  templateData: jsonb("template_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentTemplateSchema = createInsertSchema(adjustmentTemplates).pick({
  userId: true,
  name: true,
  description: true,
  propertyType: true,
  isPublic: true,
  templateData: true,
});

// Adjustment rules (condition-based)
export const adjustmentRules = pgTable("adjustment_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  modelId: integer("model_id").references(() => adjustmentModels.id),
  name: text("name").notNull(),
  description: text("description"),
  condition: jsonb("condition").notNull(), // JSON representation of the condition
  adjustmentType: text("adjustment_type").notNull(),
  calculationMethod: text("calculation_method").notNull(), // fixed, percentage, formula
  value: text("value").notNull(), // Could be a fixed amount, percentage, or formula
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentRuleSchema = createInsertSchema(adjustmentRules).pick({
  userId: true,
  modelId: true,
  name: true,
  description: true,
  condition: true,
  adjustmentType: true,
  calculationMethod: true,
  value: true,
  isActive: true,
});

// Historical adjustments for tracking and auditing
export const adjustmentHistory = pgTable("adjustment_history", {
  id: serial("id").primaryKey(),
  adjustmentId: integer("adjustment_id").references(() => adjustments.id),
  modelAdjustmentId: integer("model_adjustment_id").references(() => modelAdjustments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // created, updated, deleted
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAdjustmentHistorySchema = createInsertSchema(adjustmentHistory).pick({
  adjustmentId: true,
  modelAdjustmentId: true,
  userId: true,
  actionType: true,
  previousValue: true,
  newValue: true,
  reason: true,
});

// Collaboration and comments
export const collaborationComments = pgTable("collaboration_comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  comparableId: integer("comparable_id").references(() => comparables.id),
  adjustmentId: integer("adjustment_id").references(() => adjustments.id),
  modelId: integer("model_id").references(() => adjustmentModels.id),
  modelAdjustmentId: integer("model_adjustment_id").references(() => modelAdjustments.id),
  commentText: text("comment_text").notNull(),
  status: text("status").default("open"), // open, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollaborationCommentSchema = createInsertSchema(collaborationComments).pick({
  userId: true,
  reportId: true,
  comparableId: true,
  adjustmentId: true,
  modelId: true,
  modelAdjustmentId: true,
  commentText: true,
  status: true,
});

// Real-time market data
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(), // Could be city, county, zip code, etc.
  dataType: text("data_type").notNull(), // median_price, days_on_market, inventory, etc.
  value: numeric("value").notNull(),
  unit: text("unit").notNull(), // $, days, count, etc.
  datePoint: date("date_point").notNull(),
  source: text("source").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketDataSchema = createInsertSchema(marketData).pick({
  region: true,
  dataType: true,
  value: true,
  unit: true,
  datePoint: true,
  source: true,
  metadata: true,
});

// Compliance model
export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  checkType: text("check_type").notNull(), // e.g., "UAD", "USPAP", "client-specific"
  status: text("status").notNull(), // e.g., "pass", "fail", "warning"
  message: text("message"),
  severity: text("severity").notNull(), // e.g., "critical", "high", "medium", "low"
  field: text("field"), // The field that triggered the compliance issue
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).pick({
  reportId: true,
  checkType: true,
  status: true,
  message: true,
  severity: true,
  field: true,
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  properties: many(properties),
  appraisalReports: many(appraisalReports),
  userPreferences: many(userPreferences),
  adjustmentTemplates: many(adjustmentTemplates),
  adjustmentRules: many(adjustmentRules),
  collaborationComments: many(collaborationComments),
  achievements: many(userAchievements),
  challenges: many(userChallenges),
  notifications: many(userNotifications),
  progress: one(userProgress),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  appraisalReports: many(appraisalReports),
}));

export const appraisalReportsRelations = relations(appraisalReports, ({ one, many }) => ({
  user: one(users, {
    fields: [appraisalReports.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [appraisalReports.propertyId],
    references: [properties.id],
  }),
  comparables: many(comparables),
  adjustments: many(adjustments),
  photos: many(photos),
  sketches: many(sketches),
  complianceChecks: many(complianceChecks),
  adjustmentModels: many(adjustmentModels),
  marketAnalysis: many(marketAnalysis),
  collaborationComments: many(collaborationComments),
}));

export const comparablesRelations = relations(comparables, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [comparables.reportId],
    references: [appraisalReports.id],
  }),
  adjustments: many(adjustments),
  modelAdjustments: many(modelAdjustments),
}));

export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [adjustments.reportId],
    references: [appraisalReports.id],
  }),
  comparable: one(comparables, {
    fields: [adjustments.comparableId],
    references: [comparables.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [photos.reportId],
    references: [appraisalReports.id],
  }),
}));

export const sketchesRelations = relations(sketches, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [sketches.reportId],
    references: [appraisalReports.id],
  }),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [complianceChecks.reportId],
    references: [appraisalReports.id],
  }),
}));

// Relations for adjustment models
export const adjustmentModelsRelations = relations(adjustmentModels, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [adjustmentModels.reportId],
    references: [appraisalReports.id],
  }),
  modelAdjustments: many(modelAdjustments),
}));

// Relations for model adjustments
export const modelAdjustmentsRelations = relations(modelAdjustments, ({ one }) => ({
  model: one(adjustmentModels, {
    fields: [modelAdjustments.modelId],
    references: [adjustmentModels.id],
  }),
  comparable: one(comparables, {
    fields: [modelAdjustments.comparableId],
    references: [comparables.id],
  }),
}));

// Relations for market analysis
export const marketAnalysisRelations = relations(marketAnalysis, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [marketAnalysis.reportId],
    references: [appraisalReports.id],
  }),
}));

// Relations for user preferences
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Relations for adjustment templates
export const adjustmentTemplatesRelations = relations(adjustmentTemplates, ({ one }) => ({
  user: one(users, {
    fields: [adjustmentTemplates.userId],
    references: [users.id],
  }),
}));

// Relations for adjustment rules
export const adjustmentRulesRelations = relations(adjustmentRules, ({ one }) => ({
  user: one(users, {
    fields: [adjustmentRules.userId],
    references: [users.id],
  }),
  model: one(adjustmentModels, {
    fields: [adjustmentRules.modelId],
    references: [adjustmentModels.id],
  }),
}));

// Relations for adjustment history
export const adjustmentHistoryRelations = relations(adjustmentHistory, ({ one }) => ({
  user: one(users, {
    fields: [adjustmentHistory.userId],
    references: [users.id],
  }),
  adjustment: one(adjustments, {
    fields: [adjustmentHistory.adjustmentId],
    references: [adjustments.id],
  }),
  modelAdjustment: one(modelAdjustments, {
    fields: [adjustmentHistory.modelAdjustmentId],
    references: [modelAdjustments.id],
  }),
}));

// Relations for collaboration comments
export const collaborationCommentsRelations = relations(collaborationComments, ({ one }) => ({
  user: one(users, {
    fields: [collaborationComments.userId],
    references: [users.id],
  }),
  report: one(appraisalReports, {
    fields: [collaborationComments.reportId],
    references: [appraisalReports.id],
  }),
  comparable: one(comparables, {
    fields: [collaborationComments.comparableId],
    references: [comparables.id],
  }),
  adjustment: one(adjustments, {
    fields: [collaborationComments.adjustmentId],
    references: [adjustments.id],
  }),
  model: one(adjustmentModels, {
    fields: [collaborationComments.modelId],
    references: [adjustmentModels.id],
  }),
  modelAdjustment: one(modelAdjustments, {
    fields: [collaborationComments.modelAdjustmentId],
    references: [modelAdjustments.id],
  }),
}));

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type AppraisalReport = typeof appraisalReports.$inferSelect;
export type InsertAppraisalReport = z.infer<typeof insertAppraisalReportSchema>;

export type Comparable = typeof comparables.$inferSelect;
export type InsertComparable = z.infer<typeof insertComparableSchema>;

export type Adjustment = typeof adjustments.$inferSelect;
export type InsertAdjustment = z.infer<typeof insertAdjustmentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Sketch = typeof sketches.$inferSelect;
export type InsertSketch = z.infer<typeof insertSketchSchema>;

export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

// New types for adjustment models
export type AdjustmentModel = typeof adjustmentModels.$inferSelect;
export type InsertAdjustmentModel = z.infer<typeof insertAdjustmentModelSchema>;

export type ModelAdjustment = typeof modelAdjustments.$inferSelect;
export type InsertModelAdjustment = z.infer<typeof insertModelAdjustmentSchema>;

export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = z.infer<typeof insertMarketAnalysisSchema>;

// New types for user preferences and templates
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

export type AdjustmentTemplate = typeof adjustmentTemplates.$inferSelect;
export type InsertAdjustmentTemplate = z.infer<typeof insertAdjustmentTemplateSchema>;

export type AdjustmentRule = typeof adjustmentRules.$inferSelect;
export type InsertAdjustmentRule = z.infer<typeof insertAdjustmentRuleSchema>;

export type AdjustmentHistory = typeof adjustmentHistory.$inferSelect;
export type InsertAdjustmentHistory = z.infer<typeof insertAdjustmentHistorySchema>;

export type CollaborationComment = typeof collaborationComments.$inferSelect;
export type InsertCollaborationComment = z.infer<typeof insertCollaborationCommentSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

// Gamification system entities
export const achievementDefinitions = pgTable("achievement_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "appraisal", "comparable", "adjustment", "certification"
  type: text("type").notNull(), // e.g., "count", "milestone", "accuracy", "streak"
  pointValue: integer("point_value").notNull(),
  icon: text("icon"),
  requiredCount: integer("required_count"), // For count-based achievements
  thresholdValue: numeric("threshold_value"), // For threshold-based achievements
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAchievementDefinitionSchema = createInsertSchema(achievementDefinitions).pick({
  name: true,
  description: true,
  category: true,
  type: true,
  pointValue: true,
  icon: true,
  requiredCount: true,
  thresholdValue: true,
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievementDefinitions.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: integer("progress").default(0), // For tracking partial progress
  completedCount: integer("completed_count").default(0), // For repeatable achievements
  metadata: jsonb("metadata"), // For storing achievement-specific data
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "locked"
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
  completedCount: true,
  metadata: true,
  status: true,
});

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointThreshold: integer("point_threshold").notNull(),
  icon: text("icon"),
  rewards: jsonb("rewards"), // JSON describing rewards unlocked at this level
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLevelSchema = createInsertSchema(levels).pick({
  name: true,
  description: true,
  pointThreshold: true,
  icon: true,
  rewards: true,
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  currentLevel: integer("current_level").references(() => levels.id),
  nextLevel: integer("next_level").references(() => levels.id),
  pointsToNextLevel: integer("points_to_next_level"),
  streakDays: integer("streak_days").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  completedAchievements: integer("completed_achievements").default(0),
  completedReports: integer("completed_reports").default(0),
  completedAdjustments: integer("completed_adjustments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  totalPoints: true,
  currentLevel: true,
  nextLevel: true,
  pointsToNextLevel: true,
  streakDays: true,
  lastActive: true,
  completedAchievements: true,
  completedReports: true,
  completedAdjustments: true,
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "daily", "weekly", "monthly", "special"
  goal: integer("goal").notNull(),
  progress: integer("progress").default(0),
  pointReward: integer("point_reward").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // "active", "completed", "expired", "claimed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).pick({
  userId: true,
  name: true,
  description: true,
  type: true,
  goal: true,
  progress: true,
  pointReward: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "achievement", "level_up", "challenge", "streak", "reminder"
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  iconClass: text("icon_class"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  actionUrl: true,
  iconClass: true,
});

export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;
export type InsertAchievementDefinition = z.infer<typeof insertAchievementDefinitionSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

// Real estate terms glossary for AI tooltip explanations
export const realEstateTerms = pgTable("real_estate_terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(), // The real estate term or phrase
  category: text("category").notNull(), // Category (appraisal, finance, legal, construction, etc.)
  shortDefinition: text("short_definition").notNull(), // Brief definition for tooltips
  longDefinition: text("long_definition").notNull(), // Detailed explanation
  examples: jsonb("examples").$type<string[]>().default([]), // Usage examples
  relatedTerms: jsonb("related_terms").$type<string[]>().default([]), // Related terms
  metadata: jsonb("metadata").$type<Json>().default({}), // Additional metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertRealEstateTermSchema = createInsertSchema(realEstateTerms).pick({
  term: true,
  category: true,
  shortDefinition: true,
  longDefinition: true,
  examples: true,
  relatedTerms: true,
  metadata: true
});

export type RealEstateTerm = typeof realEstateTerms.$inferSelect;
export type InsertRealEstateTerm = z.infer<typeof insertRealEstateTermSchema>;

// Gamification system relations
export const achievementDefinitionsRelations = relations(achievementDefinitions, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievementDefinitions, {
    fields: [userAchievements.achievementId],
    references: [achievementDefinitions.id],
  }),
}));

export const levelsRelations = relations(levels, ({ many }) => ({
  currentLevelUsers: many(userProgress, { relationName: "currentLevelRelation" }),
  nextLevelUsers: many(userProgress, { relationName: "nextLevelRelation" }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  currentLevelRelation: one(levels, {
    fields: [userProgress.currentLevel],
    references: [levels.id],
    relationName: "currentLevelRelation",
  }),
  nextLevelRelation: one(levels, {
    fields: [userProgress.nextLevel],
    references: [levels.id],
    relationName: "nextLevelRelation",
  }),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
}));

// File Import Results model
export const fileImportResults = pgTable("file_import_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  status: text("status").notNull(), // 'processing', 'completed', 'failed'
  dateImported: timestamp("date_imported").defaultNow(),
  entitiesExtracted: integer("entities_extracted").default(0),
  errors: jsonb("errors").default([]),
  warnings: jsonb("warnings").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFileImportResultSchema = createInsertSchema(fileImportResults).pick({
  id: true,
  userId: true,
  filename: true,
  fileType: true,
  status: true,
  dateImported: true,
  entitiesExtracted: true,
  errors: true,
  warnings: true,
});

export type FileImportResult = typeof fileImportResults.$inferSelect;
export type InsertFileImportResult = z.infer<typeof insertFileImportResultSchema>;
