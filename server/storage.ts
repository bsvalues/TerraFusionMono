import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  plugins, type Plugin, type InsertPlugin,
  jobs, type Job, type InsertJob,
  systemLogs, type SystemLog, type InsertLog,
  aiProviders, type AiProvider, type InsertAiProvider,
  systemMetrics, type SystemMetric, type InsertMetric,
  snapshotMetadata, type SnapshotMetadata,
  pluginProducts, type PluginProduct, type InsertPluginProduct,
  userPlugins, type UserPlugin, type InsertUserPlugin,
  parcels, type Parcel, type InsertParcel,
  parcelNotes, type ParcelNote, type InsertParcelNote,
  parcelMeasurements, type ParcelMeasurement, type InsertParcelMeasurement,
  cropIdentifications, type CropIdentification, type InsertCropIdentification,
  // WebSocket Collaboration
  collaborationSessions, sessionParticipants, documentVersions, collaborationEvents,
  type CollaborationSession, type SessionParticipant, type DocumentVersion, type CollaborationEvent,
  type InsertCollaborationSession, type InsertSessionParticipant, type InsertDocumentVersion, type InsertCollaborationEvent,
  // Field Data Collection
  fieldObservations, sensorReadings,
  type FieldObservation, type SensorReading,
  type InsertFieldObservation, type InsertSensorReading,
  // Plugin Marketplace
  pluginReviews, pluginCategories, pluginCategoryRelations,
  type PluginReview, type PluginCategory, type PluginCategoryRelation,
  type InsertPluginReview, type InsertPluginCategory, type InsertPluginCategoryRelation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, gt, inArray } from "drizzle-orm";

// Storage interface with all necessary CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  
  // Plugin operations
  getPlugins(): Promise<Plugin[]>;
  getPlugin(id: number): Promise<Plugin | undefined>;
  getPluginByName(name: string): Promise<Plugin | undefined>;
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(id: number, updates: Partial<Plugin>): Promise<Plugin | undefined>;
  
  // Job operations
  getJobs(limit?: number): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<Job>): Promise<Job | undefined>;
  
  // Log operations
  getLogs(limit?: number, service?: string, level?: string): Promise<SystemLog[]>;
  createLog(log: InsertLog): Promise<SystemLog>;
  
  // AI Provider operations
  getAiProviders(): Promise<AiProvider[]>;
  getAiProvider(id: number): Promise<AiProvider | undefined>;
  getAiProviderByName(name: string): Promise<AiProvider | undefined>;
  createAiProvider(provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(id: number, updates: Partial<AiProvider>): Promise<AiProvider | undefined>;
  
  // System Metrics operations
  getMetrics(service?: string, name?: string, timeRange?: { start: Date, end: Date }): Promise<SystemMetric[]>;
  createMetric(metric: InsertMetric): Promise<SystemMetric>;
  
  // Snapshot operations
  getSnapshots(limit?: number): Promise<SnapshotMetadata[]>;
  createSnapshot(lsn: string, checksum: string): Promise<SnapshotMetadata>;
  
  // Plugin Marketplace operations
  getPluginProducts(): Promise<PluginProduct[]>;
  getPluginProduct(id: number): Promise<PluginProduct | undefined>;
  getPluginProductsByPluginId(pluginId: number): Promise<PluginProduct[]>;
  createPluginProduct(product: InsertPluginProduct): Promise<PluginProduct>;
  updatePluginProduct(id: number, updates: Partial<PluginProduct>): Promise<PluginProduct | undefined>;
  
  // User Plugin operations
  getUserPlugins(userId: number): Promise<UserPlugin[]>;
  getUserPlugin(id: number): Promise<UserPlugin | undefined>;
  checkUserHasPlugin(userId: number, pluginId: number): Promise<boolean>;
  createUserPlugin(userPlugin: InsertUserPlugin): Promise<UserPlugin>;
  updateUserPlugin(id: number, updates: Partial<UserPlugin>): Promise<UserPlugin | undefined>;
  
  // Stripe specific operations
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: number, stripeSubscriptionId: string): Promise<User | undefined>;
  updateStripeSubscriptionStatus(userId: number, stripeSubscriptionStatus: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User[]>;
  
  // Parcel operations
  getParcels(options?: { limit?: number, userId?: number, status?: string, updatedSince?: Date }): Promise<Parcel[]>;
  getParcel(id: number): Promise<Parcel | undefined>;
  getParcelByExternalId(externalId: string): Promise<Parcel | undefined>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;
  updateParcel(id: number, updates: Partial<Parcel>): Promise<Parcel | undefined>;
  updateParcelByExternalId(externalId: string, updates: Partial<Parcel>): Promise<Parcel | undefined>;
  deleteParcel(id: number): Promise<boolean>;
  
  // Parcel Measurement operations
  getParcelMeasurements(options?: { parcelId?: string, userId?: number, measurementType?: string, limit?: number, since?: Date }): Promise<ParcelMeasurement[]>;
  createParcelMeasurement(measurement: InsertParcelMeasurement): Promise<ParcelMeasurement>;
  updateParcelMeasurement(id: number, updates: Partial<ParcelMeasurement>): Promise<ParcelMeasurement | undefined>;
  deleteParcelMeasurement(id: number): Promise<boolean>;
  
  // Parcel Note operations
  getParcelNotes(options?: { limit?: number, userId?: number, updatedSince?: Date }): Promise<ParcelNote[]>;
  getParcelNote(id: number): Promise<ParcelNote | undefined>;
  getParcelNoteByParcelId(parcelId: string): Promise<ParcelNote | undefined>;
  createParcelNote(parcelNote: InsertParcelNote): Promise<ParcelNote>;
  updateParcelNote(id: number, updates: Partial<ParcelNote>): Promise<ParcelNote | undefined>;
  
  // Crop Identification operations
  getCropIdentifications(options?: { limit?: number, userId?: number, parcelId?: string }): Promise<CropIdentification[]>;
  getCropIdentification(id: number): Promise<CropIdentification | undefined>;
  createCropIdentification(identification: InsertCropIdentification): Promise<CropIdentification>;
  updateCropIdentification(id: number, updates: Partial<CropIdentification>): Promise<CropIdentification | undefined>;
  
  // ==== WebSocket Collaboration operations ====
  
  // Collaboration Session operations
  getCollaborationSessions(options?: { limit?: number, ownerId?: number, status?: string, documentType?: string, documentId?: string }): Promise<CollaborationSession[]>;
  getCollaborationSession(id: number): Promise<CollaborationSession | undefined>;
  getCollaborationSessionBySessionId(sessionId: string): Promise<CollaborationSession | undefined>;
  createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  updateCollaborationSession(id: number, updates: Partial<CollaborationSession>): Promise<CollaborationSession | undefined>;
  
  // Session Participant operations
  getSessionParticipants(sessionId: string): Promise<SessionParticipant[]>;
  getSessionParticipant(id: number): Promise<SessionParticipant | undefined>;
  getActiveSessionParticipant(sessionId: string, userId: number): Promise<SessionParticipant | undefined>;
  createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant>;
  updateSessionParticipant(id: number, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined>;
  
  // Document Version operations
  getDocumentVersions(options: { sessionId?: string, documentType?: string, documentId?: string, limit?: number }): Promise<DocumentVersion[]>;
  getLatestDocumentVersion(documentType: string, documentId: string): Promise<DocumentVersion | undefined>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  
  // Collaboration Event operations
  getCollaborationEvents(options: { sessionId: string, limit?: number, since?: Date }): Promise<CollaborationEvent[]>;
  createCollaborationEvent(event: InsertCollaborationEvent): Promise<CollaborationEvent>;
  
  // ==== Field Data Collection operations ====
  
  // Field Observation operations
  getFieldObservations(options?: { limit?: number, userId?: number, parcelId?: string, observationType?: string, since?: Date }): Promise<FieldObservation[]>;
  getFieldObservation(id: number): Promise<FieldObservation | undefined>;
  getFieldObservationByObservationId(observationId: string): Promise<FieldObservation | undefined>;
  createFieldObservation(observation: InsertFieldObservation): Promise<FieldObservation>;
  updateFieldObservation(id: number, updates: Partial<FieldObservation>): Promise<FieldObservation | undefined>;
  
  // Sensor Reading operations
  getSensorReadings(options?: { limit?: number, sensorId?: string, parcelId?: string, readingType?: string, since?: Date }): Promise<SensorReading[]>;
  getSensorReading(id: number): Promise<SensorReading | undefined>;
  getSensorReadingByReadingId(readingId: string): Promise<SensorReading | undefined>;
  createSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  updateSensorReading(id: number, updates: Partial<SensorReading>): Promise<SensorReading | undefined>;
  
  // ==== Plugin Marketplace operations ====
  
  // Plugin Review operations
  getPluginReviews(options?: { limit?: number, pluginId?: number, status?: string }): Promise<PluginReview[]>;
  getPluginReview(id: number): Promise<PluginReview | undefined>;
  getUserPluginReview(userId: number, pluginId: number): Promise<PluginReview | undefined>;
  createPluginReview(review: InsertPluginReview): Promise<PluginReview>;
  updatePluginReview(id: number, updates: Partial<PluginReview>): Promise<PluginReview | undefined>;
  
  // Plugin Category operations
  getPluginCategories(includeInactive?: boolean): Promise<PluginCategory[]>;
  getPluginCategory(id: number): Promise<PluginCategory | undefined>;
  getPluginCategoryBySlug(slug: string): Promise<PluginCategory | undefined>;
  createPluginCategory(category: InsertPluginCategory): Promise<PluginCategory>;
  updatePluginCategory(id: number, updates: Partial<PluginCategory>): Promise<PluginCategory | undefined>;
  
  // Plugin Category Relation operations
  getPluginCategoryRelations(pluginId: number): Promise<PluginCategoryRelation[]>;
  createPluginCategoryRelation(relation: InsertPluginCategoryRelation): Promise<PluginCategoryRelation>;
  deletePluginCategoryRelation(pluginId: number, categoryId: number): Promise<boolean>;
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }
  
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async getServiceByName(name: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.name, name));
    return service;
  }
  
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }
  
  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  // Plugin operations
  async getPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins);
  }
  
  async getPlugin(id: number): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins).where(eq(plugins.id, id));
    return plugin;
  }
  
  async getPluginByName(name: string): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins).where(eq(plugins.name, name));
    return plugin;
  }
  
  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    const [newPlugin] = await db
      .insert(plugins)
      .values(plugin)
      .returning();
    return newPlugin;
  }
  
  async updatePlugin(id: number, updates: Partial<Plugin>): Promise<Plugin | undefined> {
    const [updatedPlugin] = await db
      .update(plugins)
      .set(updates)
      .where(eq(plugins.id, id))
      .returning();
    return updatedPlugin;
  }
  
  // Job operations
  async getJobs(limit: number = 50): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.queuedAt))
      .limit(limit);
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }
  
  async updateJob(id: number, updates: Partial<Job>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }
  
  // Log operations
  async getLogs(limit: number = 100, service?: string, level?: string): Promise<SystemLog[]> {
    let query = db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.timestamp));
    
    if (service) {
      query = query.where(eq(systemLogs.service, service));
    }
    
    if (level) {
      query = query.where(eq(systemLogs.level, level));
    }
    
    return await query.limit(limit);
  }
  
  async createLog(log: InsertLog): Promise<SystemLog> {
    const [newLog] = await db
      .insert(systemLogs)
      .values(log)
      .returning();
    return newLog;
  }
  
  // AI Provider operations
  async getAiProviders(): Promise<AiProvider[]> {
    return await db.select().from(aiProviders);
  }
  
  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id));
    return provider;
  }
  
  async getAiProviderByName(name: string): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.name, name));
    return provider;
  }
  
  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const [newProvider] = await db
      .insert(aiProviders)
      .values(provider)
      .returning();
    return newProvider;
  }
  
  async updateAiProvider(id: number, updates: Partial<AiProvider>): Promise<AiProvider | undefined> {
    const [updatedProvider] = await db
      .update(aiProviders)
      .set(updates)
      .where(eq(aiProviders.id, id))
      .returning();
    return updatedProvider;
  }
  
  // System Metrics operations
  async getMetrics(
    service?: string, 
    name?: string, 
    timeRange?: { start: Date, end: Date }
  ): Promise<SystemMetric[]> {
    let query = db.select().from(systemMetrics);
    
    if (service) {
      query = query.where(eq(systemMetrics.service, service));
    }
    
    if (name) {
      query = query.where(eq(systemMetrics.name, name));
    }
    
    if (timeRange) {
      query = query.where(
        and(
          gte(systemMetrics.timestamp, timeRange.start),
          lte(systemMetrics.timestamp, timeRange.end)
        )
      );
    }
    
    return await query.orderBy(desc(systemMetrics.timestamp));
  }
  
  async createMetric(metric: InsertMetric): Promise<SystemMetric> {
    const [newMetric] = await db
      .insert(systemMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }
  
  // Snapshot operations
  async getSnapshots(limit: number = 50): Promise<SnapshotMetadata[]> {
    return await db
      .select()
      .from(snapshotMetadata)
      .orderBy(desc(snapshotMetadata.timestamp))
      .limit(limit);
  }
  
  async createSnapshot(lsn: string, checksum: string): Promise<SnapshotMetadata> {
    const [snapshot] = await db
      .insert(snapshotMetadata)
      .values({ lsn, checksum })
      .returning();
    return snapshot;
  }
  
  // User methods
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Plugin Product operations
  async getPluginProducts(): Promise<PluginProduct[]> {
    return await db.select().from(pluginProducts);
  }
  
  async getPluginProduct(id: number): Promise<PluginProduct | undefined> {
    const [product] = await db.select().from(pluginProducts).where(eq(pluginProducts.id, id));
    return product;
  }
  
  async getPluginProductsByPluginId(pluginId: number): Promise<PluginProduct[]> {
    return await db.select().from(pluginProducts).where(eq(pluginProducts.pluginId, pluginId));
  }
  
  async getPluginProductByStripeProductId(stripeProductId: string): Promise<PluginProduct | undefined> {
    const [product] = await db.select().from(pluginProducts).where(eq(pluginProducts.stripeProductId, stripeProductId));
    return product;
  }
  
  async createPluginProduct(product: InsertPluginProduct): Promise<PluginProduct> {
    const [newProduct] = await db
      .insert(pluginProducts)
      .values(product)
      .returning();
    return newProduct;
  }
  
  async updatePluginProduct(id: number, updates: Partial<PluginProduct>): Promise<PluginProduct | undefined> {
    const [updatedProduct] = await db
      .update(pluginProducts)
      .set(updates)
      .where(eq(pluginProducts.id, id))
      .returning();
    return updatedProduct;
  }
  
  // User Plugin operations
  async getUserPlugins(userId: number): Promise<UserPlugin[]> {
    return await db.select().from(userPlugins).where(eq(userPlugins.userId, userId));
  }
  
  async getUserPlugin(id: number): Promise<UserPlugin | undefined> {
    const [userPlugin] = await db.select().from(userPlugins).where(eq(userPlugins.id, id));
    return userPlugin;
  }
  
  async checkUserHasPlugin(userId: number, pluginId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(userPlugins)
      .where(
        and(
          eq(userPlugins.userId, userId),
          eq(userPlugins.pluginId, pluginId),
          eq(userPlugins.active, true)
        )
      );
    return result.length > 0;
  }
  
  async createUserPlugin(userPlugin: InsertUserPlugin): Promise<UserPlugin> {
    const [newUserPlugin] = await db
      .insert(userPlugins)
      .values(userPlugin)
      .returning();
    return newUserPlugin;
  }
  
  async updateUserPlugin(id: number, updates: Partial<UserPlugin>): Promise<UserPlugin | undefined> {
    const [updatedUserPlugin] = await db
      .update(userPlugins)
      .set(updates)
      .where(eq(userPlugins.id, id))
      .returning();
    return updatedUserPlugin;
  }
  
  // Stripe specific operations
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }
  
  async updateStripeSubscriptionId(userId: number, stripeSubscriptionId: string | null): Promise<User | undefined> {
    return this.updateUser(userId, { stripeSubscriptionId });
  }
  
  async updateStripeSubscriptionStatus(userId: number, stripeSubscriptionStatus: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeSubscriptionStatus });
  }
  
  async getUserIdByStripeSubscriptionId(stripeSubscriptionId: string): Promise<number | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
    return user?.id;
  }
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
  }
  
  // Parcel operations
  async getParcels(options?: { 
    limit?: number; 
    userId?: number; 
    status?: string;
    updatedSince?: Date;
  }): Promise<Parcel[]> {
    let query = db.select().from(parcels);
    
    if (options?.userId) {
      query = query.where(eq(parcels.ownerId, options.userId));
    }
    
    if (options?.status) {
      query = query.where(eq(parcels.status, options.status));
    }
    
    if (options?.updatedSince) {
      query = query.where(gt(parcels.updatedAt, options.updatedSince));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return query.orderBy(desc(parcels.updatedAt));
  }

  async getParcel(id: number): Promise<Parcel | undefined> {
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id));
    return parcel;
  }
  
  async getParcelByExternalId(externalId: string): Promise<Parcel | undefined> {
    const [parcel] = await db.select().from(parcels).where(eq(parcels.externalId, externalId));
    return parcel;
  }

  async createParcel(parcel: InsertParcel): Promise<Parcel> {
    const [newParcel] = await db.insert(parcels).values(parcel).returning();
    return newParcel;
  }

  async updateParcel(id: number, updates: Partial<Parcel>): Promise<Parcel | undefined> {
    const [updated] = await db
      .update(parcels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(parcels.id, id))
      .returning();
    return updated;
  }
  
  async updateParcelByExternalId(externalId: string, updates: Partial<Parcel>): Promise<Parcel | undefined> {
    const [updated] = await db
      .update(parcels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(parcels.externalId, externalId))
      .returning();
    return updated;
  }
  
  async deleteParcel(id: number): Promise<boolean> {
    const result = await db.delete(parcels).where(eq(parcels.id, id));
    return result.rowCount > 0;
  }
  
  // Methods for parcel measurements
  async getParcelMeasurements(options?: { 
    parcelId?: string; 
    userId?: number; 
    measurementType?: string;
    limit?: number;
    since?: Date;
  }): Promise<ParcelMeasurement[]> {
    let query = db.select().from(parcelMeasurements);
    
    if (options?.parcelId) {
      query = query.where(eq(parcelMeasurements.parcelId, options.parcelId));
    }
    
    if (options?.userId) {
      query = query.where(eq(parcelMeasurements.userId, options.userId));
    }
    
    if (options?.measurementType) {
      query = query.where(eq(parcelMeasurements.measurementType, options.measurementType));
    }
    
    if (options?.since) {
      query = query.where(gt(parcelMeasurements.timestamp, options.since));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return query.orderBy(desc(parcelMeasurements.timestamp));
  }
  
  async createParcelMeasurement(measurement: InsertParcelMeasurement): Promise<ParcelMeasurement> {
    const [newMeasurement] = await db.insert(parcelMeasurements).values(measurement).returning();
    return newMeasurement;
  }
  
  async updateParcelMeasurement(id: number, updates: Partial<ParcelMeasurement>): Promise<ParcelMeasurement | undefined> {
    const [updated] = await db
      .update(parcelMeasurements)
      .set(updates)
      .where(eq(parcelMeasurements.id, id))
      .returning();
    return updated;
  }
  
  async deleteParcelMeasurement(id: number): Promise<boolean> {
    const result = await db.delete(parcelMeasurements).where(eq(parcelMeasurements.id, id));
    return result.rowCount > 0;
  }
  
  // Parcel Note operations
  async getParcelNotes(options?: { limit?: number, userId?: number, updatedSince?: Date }): Promise<ParcelNote[]> {
    let query = db
      .select()
      .from(parcelNotes)
      .orderBy(desc(parcelNotes.updatedAt));
    
    if (options?.userId) {
      query = query.where(eq(parcelNotes.userId, options.userId));
    }
    
    if (options?.updatedSince) {
      query = query.where(gte(parcelNotes.updatedAt, options.updatedSince));
    }
    
    return await query.limit(options?.limit || 50);
  }
  
  async getParcelNote(id: number): Promise<ParcelNote | undefined> {
    const [note] = await db.select().from(parcelNotes).where(eq(parcelNotes.id, id));
    return note;
  }
  
  async getParcelNoteByParcelId(parcelId: string): Promise<ParcelNote | undefined> {
    const [note] = await db.select().from(parcelNotes).where(eq(parcelNotes.parcelId, parcelId));
    return note;
  }
  
  async createParcelNote(note: InsertParcelNote): Promise<ParcelNote> {
    const [newNote] = await db
      .insert(parcelNotes)
      .values(note)
      .returning();
    return newNote;
  }
  
  async updateParcelNote(id: number, updates: Partial<ParcelNote>): Promise<ParcelNote | undefined> {
    const [updatedNote] = await db
      .update(parcelNotes)
      .set(updates)
      .where(eq(parcelNotes.id, id))
      .returning();
    return updatedNote;
  }
  
  // Crop Identification operations
  async getCropIdentifications(options?: { limit?: number, userId?: number, parcelId?: string }): Promise<CropIdentification[]> {
    let query = db
      .select()
      .from(cropIdentifications)
      .orderBy(desc(cropIdentifications.timestamp));
    
    if (options?.userId) {
      query = query.where(eq(cropIdentifications.userId, options.userId));
    }
    
    if (options?.parcelId) {
      query = query.where(eq(cropIdentifications.parcelId, options.parcelId));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  async getCropIdentification(id: number): Promise<CropIdentification | undefined> {
    const [identification] = await db
      .select()
      .from(cropIdentifications)
      .where(eq(cropIdentifications.id, id));
    return identification;
  }
  
  async createCropIdentification(identification: InsertCropIdentification): Promise<CropIdentification> {
    const [newIdentification] = await db
      .insert(cropIdentifications)
      .values(identification)
      .returning();
    return newIdentification;
  }
  
  async updateCropIdentification(id: number, updates: Partial<CropIdentification>): Promise<CropIdentification | undefined> {
    const [updatedIdentification] = await db
      .update(cropIdentifications)
      .set(updates)
      .where(eq(cropIdentifications.id, id))
      .returning();
    return updatedIdentification;
  }
  
  // ==== WebSocket Collaboration operations ====
  
  // Collaboration Session operations
  async getCollaborationSessions(options?: { limit?: number, ownerId?: number, status?: string, documentType?: string, documentId?: string }): Promise<CollaborationSession[]> {
    let query = db.select().from(collaborationSessions);
    
    if (options?.ownerId) {
      query = query.where(eq(collaborationSessions.ownerId, options.ownerId));
    }
    
    if (options?.status) {
      query = query.where(eq(collaborationSessions.status, options.status));
    }
    
    if (options?.documentType) {
      query = query.where(eq(collaborationSessions.documentType, options.documentType));
    }
    
    if (options?.documentId) {
      query = query.where(eq(collaborationSessions.documentId, options.documentId));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(collaborationSessions.createdAt));
  }
  
  async getCollaborationSession(id: number): Promise<CollaborationSession | undefined> {
    const [session] = await db
      .select()
      .from(collaborationSessions)
      .where(eq(collaborationSessions.id, id));
    return session;
  }
  
  async getCollaborationSessionBySessionId(sessionId: string): Promise<CollaborationSession | undefined> {
    const [session] = await db
      .select()
      .from(collaborationSessions)
      .where(eq(collaborationSessions.sessionId, sessionId));
    return session;
  }
  
  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [newSession] = await db
      .insert(collaborationSessions)
      .values(session)
      .returning();
    return newSession;
  }
  
  async updateCollaborationSession(id: number, updates: Partial<CollaborationSession>): Promise<CollaborationSession | undefined> {
    const [updatedSession] = await db
      .update(collaborationSessions)
      .set(updates)
      .where(eq(collaborationSessions.id, id))
      .returning();
    return updatedSession;
  }
  
  // Session Participant operations
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId))
      .orderBy(desc(sessionParticipants.joinedAt));
  }
  
  async getSessionParticipant(id: number): Promise<SessionParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.id, id));
    return participant;
  }
  
  async getActiveSessionParticipant(sessionId: string, userId: number): Promise<SessionParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId)
        )
      );
    return participant;
  }
  
  async createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    const [newParticipant] = await db
      .insert(sessionParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }
  
  async updateSessionParticipant(id: number, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined> {
    const [updatedParticipant] = await db
      .update(sessionParticipants)
      .set(updates)
      .where(eq(sessionParticipants.id, id))
      .returning();
    return updatedParticipant;
  }
  
  // Document Version operations
  async getDocumentVersions(options: { sessionId?: string, documentType?: string, documentId?: string, limit?: number }): Promise<DocumentVersion[]> {
    let query = db.select().from(documentVersions);
    
    if (options.sessionId) {
      query = query.where(eq(documentVersions.sessionId, options.sessionId));
    }
    
    if (options.documentType && options.documentId) {
      query = query.where(
        and(
          eq(documentVersions.documentType, options.documentType),
          eq(documentVersions.documentId, options.documentId)
        )
      );
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(documentVersions.createdAt), desc(documentVersions.version));
  }
  
  async getLatestDocumentVersion(documentType: string, documentId: string): Promise<DocumentVersion | undefined> {
    const [version] = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentType, documentType),
          eq(documentVersions.documentId, documentId)
        )
      )
      .orderBy(desc(documentVersions.version))
      .limit(1);
    return version;
  }
  
  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [newVersion] = await db
      .insert(documentVersions)
      .values(version)
      .returning();
    return newVersion;
  }
  
  // Collaboration Event operations
  async getCollaborationEvents(options: { sessionId: string, limit?: number, since?: Date }): Promise<CollaborationEvent[]> {
    let query = db
      .select()
      .from(collaborationEvents)
      .where(eq(collaborationEvents.sessionId, options.sessionId));
    
    if (options.since) {
      query = query.where(gte(collaborationEvents.timestamp, options.since));
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(collaborationEvents.timestamp));
  }
  
  async createCollaborationEvent(event: InsertCollaborationEvent): Promise<CollaborationEvent> {
    const [newEvent] = await db
      .insert(collaborationEvents)
      .values(event)
      .returning();
    return newEvent;
  }
  
  // ==== Field Data Collection operations ====
  
  // Field Observation operations
  async getFieldObservations(options?: { limit?: number, userId?: number, parcelId?: string, observationType?: string, since?: Date }): Promise<FieldObservation[]> {
    let query = db.select().from(fieldObservations);
    
    if (options?.userId) {
      query = query.where(eq(fieldObservations.userId, options.userId));
    }
    
    if (options?.parcelId) {
      query = query.where(eq(fieldObservations.parcelId, options.parcelId));
    }
    
    if (options?.observationType) {
      query = query.where(eq(fieldObservations.observationType, options.observationType));
    }
    
    if (options?.since) {
      query = query.where(gte(fieldObservations.timestamp, options.since));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(fieldObservations.timestamp));
  }
  
  async getFieldObservation(id: number): Promise<FieldObservation | undefined> {
    const [observation] = await db
      .select()
      .from(fieldObservations)
      .where(eq(fieldObservations.id, id));
    return observation;
  }
  
  async getFieldObservationByObservationId(observationId: string): Promise<FieldObservation | undefined> {
    const [observation] = await db
      .select()
      .from(fieldObservations)
      .where(eq(fieldObservations.observationId, observationId));
    return observation;
  }
  
  async createFieldObservation(observation: InsertFieldObservation): Promise<FieldObservation> {
    const [newObservation] = await db
      .insert(fieldObservations)
      .values(observation)
      .returning();
    return newObservation;
  }
  
  async updateFieldObservation(id: number, updates: Partial<FieldObservation>): Promise<FieldObservation | undefined> {
    const [updatedObservation] = await db
      .update(fieldObservations)
      .set(updates)
      .where(eq(fieldObservations.id, id))
      .returning();
    return updatedObservation;
  }
  
  // Sensor Reading operations
  async getSensorReadings(options?: { limit?: number, sensorId?: string, parcelId?: string, readingType?: string, since?: Date }): Promise<SensorReading[]> {
    let query = db.select().from(sensorReadings);
    
    if (options?.sensorId) {
      query = query.where(eq(sensorReadings.sensorId, options.sensorId));
    }
    
    if (options?.parcelId) {
      query = query.where(eq(sensorReadings.parcelId, options.parcelId));
    }
    
    if (options?.readingType) {
      query = query.where(eq(sensorReadings.readingType, options.readingType));
    }
    
    if (options?.since) {
      query = query.where(gte(sensorReadings.timestamp, options.since));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(sensorReadings.timestamp));
  }
  
  async getSensorReading(id: number): Promise<SensorReading | undefined> {
    const [reading] = await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.id, id));
    return reading;
  }
  
  async getSensorReadingByReadingId(readingId: string): Promise<SensorReading | undefined> {
    const [reading] = await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.readingId, readingId));
    return reading;
  }
  
  async createSensorReading(reading: InsertSensorReading): Promise<SensorReading> {
    const [newReading] = await db
      .insert(sensorReadings)
      .values(reading)
      .returning();
    return newReading;
  }
  
  async updateSensorReading(id: number, updates: Partial<SensorReading>): Promise<SensorReading | undefined> {
    const [updatedReading] = await db
      .update(sensorReadings)
      .set(updates)
      .where(eq(sensorReadings.id, id))
      .returning();
    return updatedReading;
  }
  
  // ==== Plugin Marketplace operations ====
  
  // Plugin Review operations
  async getPluginReviews(options?: { limit?: number, pluginId?: number, status?: string }): Promise<PluginReview[]> {
    let query = db.select().from(pluginReviews);
    
    if (options?.pluginId) {
      query = query.where(eq(pluginReviews.pluginId, options.pluginId));
    }
    
    if (options?.status) {
      query = query.where(eq(pluginReviews.status, options.status));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.orderBy(desc(pluginReviews.createdAt));
  }
  
  async getPluginReview(id: number): Promise<PluginReview | undefined> {
    const [review] = await db
      .select()
      .from(pluginReviews)
      .where(eq(pluginReviews.id, id));
    return review;
  }
  
  async getUserPluginReview(userId: number, pluginId: number): Promise<PluginReview | undefined> {
    const [review] = await db
      .select()
      .from(pluginReviews)
      .where(
        and(
          eq(pluginReviews.userId, userId),
          eq(pluginReviews.pluginId, pluginId)
        )
      );
    return review;
  }
  
  async createPluginReview(review: InsertPluginReview): Promise<PluginReview> {
    const [newReview] = await db
      .insert(pluginReviews)
      .values(review)
      .returning();
    return newReview;
  }
  
  async updatePluginReview(id: number, updates: Partial<PluginReview>): Promise<PluginReview | undefined> {
    const [updatedReview] = await db
      .update(pluginReviews)
      .set(updates)
      .where(eq(pluginReviews.id, id))
      .returning();
    return updatedReview;
  }
  
  // Plugin Category operations
  async getPluginCategories(includeInactive?: boolean): Promise<PluginCategory[]> {
    let query = db.select().from(pluginCategories);
    
    if (!includeInactive) {
      query = query.where(eq(pluginCategories.isActive, true));
    }
    
    return await query.orderBy(asc(pluginCategories.displayOrder), asc(pluginCategories.name));
  }
  
  async getPluginCategory(id: number): Promise<PluginCategory | undefined> {
    const [category] = await db
      .select()
      .from(pluginCategories)
      .where(eq(pluginCategories.id, id));
    return category;
  }
  
  async getPluginCategoryBySlug(slug: string): Promise<PluginCategory | undefined> {
    const [category] = await db
      .select()
      .from(pluginCategories)
      .where(eq(pluginCategories.slug, slug));
    return category;
  }
  
  async createPluginCategory(category: InsertPluginCategory): Promise<PluginCategory> {
    const [newCategory] = await db
      .insert(pluginCategories)
      .values(category)
      .returning();
    return newCategory;
  }
  
  async updatePluginCategory(id: number, updates: Partial<PluginCategory>): Promise<PluginCategory | undefined> {
    const [updatedCategory] = await db
      .update(pluginCategories)
      .set(updates)
      .where(eq(pluginCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  // Plugin Category Relation operations
  async getPluginCategoryRelations(pluginId: number): Promise<PluginCategoryRelation[]> {
    return await db
      .select()
      .from(pluginCategoryRelations)
      .where(eq(pluginCategoryRelations.pluginId, pluginId));
  }
  
  async createPluginCategoryRelation(relation: InsertPluginCategoryRelation): Promise<PluginCategoryRelation> {
    const [newRelation] = await db
      .insert(pluginCategoryRelations)
      .values(relation)
      .returning();
    return newRelation;
  }
  
  async deletePluginCategoryRelation(pluginId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .delete(pluginCategoryRelations)
      .where(
        and(
          eq(pluginCategoryRelations.pluginId, pluginId),
          eq(pluginCategoryRelations.categoryId, categoryId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
