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
  userPlugins, type UserPlugin, type InsertUserPlugin
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// Storage interface with all necessary CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  // Parcel Note operations
  getParcelNotes(limit?: number): Promise<ParcelNote[]>;
  getParcelNote(id: number): Promise<ParcelNote | undefined>;
  getParcelNoteByParcelId(parcelId: string): Promise<ParcelNote | undefined>;
  createParcelNote(parcelNote: InsertParcelNote): Promise<ParcelNote>;
  updateParcelNote(id: number, updates: Partial<ParcelNote>): Promise<ParcelNote | undefined>;
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
  
  // Parcel Note operations
  async getParcelNotes(limit: number = 50): Promise<ParcelNote[]> {
    return await db
      .select()
      .from(parcelNotes)
      .orderBy(desc(parcelNotes.updatedAt))
      .limit(limit);
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
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
