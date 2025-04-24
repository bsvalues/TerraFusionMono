/**
 * TerraFusion Marketplace Contract Protocol (MCP) v1.0
 * 
 * This defines the interface contract that all TerraFusion plugins
 * must implement to be compatible with the marketplace.
 */

export enum PluginType {
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
}

export enum PluginCategory {
  VALUATION = 'valuation',
  GIS = 'gis',
  VISUALIZATION = 'visualization',
  DATA_QUALITY = 'data-quality',
  WORKFLOW = 'workflow',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
}

export enum PluginPermission {
  READ_PARCELS = 'read:parcels',
  WRITE_PARCELS = 'write:parcels',
  READ_VALUATIONS = 'read:valuations',
  WRITE_VALUATIONS = 'write:valuations',
  READ_GIS_DATA = 'read:gis',
  WRITE_GIS_DATA = 'write:gis',
  ADMIN_ACCESS = 'admin:access',
}

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  type: PluginType;
  category: PluginCategory;
  entryPoint: string;
  dependencies: Record<string, string>;
  permissions: PluginPermission[];
  configSchema?: Record<string, any>;
  minCoreVersion: string;
  maxCoreVersion?: string;
  tags: string[];
  icon?: string;
}

export interface PluginContext {
  tenant: {
    id: string;
    name: string;
    settings: Record<string, any>;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  config: Record<string, any>;
  storage: PluginStorage;
  api: CoreApiClient;
  events: EventBus;
  logger: Logger;
}

export interface PluginStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getKeys(): Promise<string[]>;
}

export interface CoreApiClient {
  parcels: ParcelApi;
  valuations: ValuationApi;
  gis: GisApi;
  users: UserApi;
  system: SystemApi;
}

export interface ParcelApi {
  getAll(options?: QueryOptions): Promise<Parcel[]>;
  getById(id: string): Promise<Parcel>;
  create(parcel: Partial<Parcel>): Promise<Parcel>;
  update(id: string, updates: Partial<Parcel>): Promise<Parcel>;
  delete(id: string): Promise<void>;
}

export interface ValuationApi {
  getAll(options?: QueryOptions): Promise<Valuation[]>;
  getById(id: string): Promise<Valuation>;
  getByParcelId(parcelId: string): Promise<Valuation[]>;
  create(valuation: Partial<Valuation>): Promise<Valuation>;
  update(id: string, updates: Partial<Valuation>): Promise<Valuation>;
  delete(id: string): Promise<void>;
}

export interface GisApi {
  getLayers(): Promise<GisLayer[]>;
  getLayerData(layerId: string, bounds?: GeoBounds): Promise<GeoFeature[]>;
  saveFeature(layerId: string, feature: GeoFeature): Promise<GeoFeature>;
  deleteFeature(layerId: string, featureId: string): Promise<void>;
  runSpatialQuery(query: SpatialQuery): Promise<GeoFeature[]>;
}

export interface UserApi {
  getCurrent(): Promise<User>;
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User>;
}

export interface SystemApi {
  getInfo(): Promise<SystemInfo>;
  getMetrics(): Promise<SystemMetrics>;
  getLogs(options?: LogQueryOptions): Promise<LogEntry[]>;
}

export interface EventBus {
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  emit(event: string, data: any): void;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Basic data types

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface LogQueryOptions extends QueryOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  startDate?: string;
  endDate?: string;
}

export interface Parcel {
  id: string;
  externalId?: string;
  address: string;
  owner: string;
  areaM2: number;
  geoJson: any;
  attributes: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Valuation {
  id: string;
  parcelId: string;
  assessmentYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  method: string;
  notes?: string;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GisLayer {
  id: string;
  name: string;
  description: string;
  type: 'vector' | 'raster';
  source: string;
  visible: boolean;
  zIndex: number;
  style?: any;
}

export interface GeoBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface GeoFeature {
  id: string;
  type: string;
  geometry: any;
  properties: Record<string, any>;
}

export interface SpatialQuery {
  type: 'within' | 'contains' | 'intersects' | 'distance';
  geometry: any;
  options?: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface SystemInfo {
  name: string;
  version: string;
  environment: string;
  uptime: number;
  plugins: PluginMetadata[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  activeUsers: number;
  requestsPerMinute: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
  metadata: Record<string, any>;
}

// Plugin lifecycle methods

export interface PluginLifecycle {
  onInstall(context: PluginContext): Promise<void>;
  onActivate(context: PluginContext): Promise<void>;
  onDeactivate(context: PluginContext): Promise<void>;
  onUninstall(context: PluginContext): Promise<void>;
  onUpgrade(context: PluginContext, fromVersion: string): Promise<void>;
}

// Plugin module definition

export interface PluginModule extends Partial<PluginLifecycle> {
  metadata: PluginMetadata;
  
  // Custom entry points can be defined by the plugin
  [key: string]: any;
}

// Helper function for plugin validation
export function validatePlugin(pluginModule: any): pluginModule is PluginModule {
  // Check if the plugin has the required metadata
  if (!pluginModule.metadata) {
    return false;
  }

  const metadata = pluginModule.metadata;
  
  // Validate required metadata fields
  return Boolean(
    metadata.id &&
    metadata.name &&
    metadata.description &&
    metadata.version &&
    metadata.author &&
    metadata.license &&
    metadata.type &&
    metadata.category &&
    metadata.entryPoint &&
    metadata.permissions &&
    metadata.minCoreVersion &&
    metadata.tags
  );
}