import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  plugins, type Plugin, type InsertPlugin,
  jobs, type Job, type InsertJob,
  systemLogs, type SystemLog, type InsertLog,
  aiProviders, type AiProvider, type InsertAiProvider,
  systemMetrics, type SystemMetric, type InsertMetric,
  snapshotMetadata, type SnapshotMetadata
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// Storage interface with all necessary CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
