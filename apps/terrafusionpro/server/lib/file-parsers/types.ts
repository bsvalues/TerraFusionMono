/**
 * File Parser Types
 * 
 * This module defines the common interfaces and types used by the file parsers.
 */

/**
 * Base interface for all file parsers
 */
export interface FileParser {
  /**
   * The name of the parser
   */
  name: string;

  /**
   * Determines if this parser can parse the given content
   * 
   * @param content The content to check
   * @returns True if this parser can parse the content, false otherwise
   */
  canParse(content: string): boolean;

  /**
   * Parses the content and extracts the data entities
   * 
   * @param content The content to parse
   * @returns The parsing results with the extracted entities and any warnings or errors
   */
  parse(content: string): Promise<ParsingResult>;
}

/**
 * Represents a generic data entity
 */
export interface DataEntity {
  type: 'property' | 'report' | 'comparable' | 'adjustment' | 'photo' | 'sketch';
  data: PropertyData | ReportData | ComparableData | AdjustmentData | PhotoData | SketchData;
}

/**
 * Results of parsing a file
 */
export interface ParsingResult {
  /**
   * The entities extracted from the file
   */
  entities: DataEntity[];
  
  /**
   * The number of entities found
   */
  length: number;
  
  /**
   * Any warnings that occurred during parsing
   */
  warnings?: string[];
  
  /**
   * Any errors that occurred during parsing
   */
  errors?: string[];
}

/**
 * Property data structure
 */
export interface PropertyData {
  id?: number;
  userId?: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  county?: string | null;
  legalDescription?: string | null;
  taxParcelId?: string | null;
  lotSize?: string | number | null;
  yearBuilt?: string | number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  grossLivingArea?: number | null;
  stories?: number | null;
  basement?: string | null;
  garage?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Appraisal report data structure
 */
export interface ReportData {
  id?: number;
  userId?: number;
  propertyId?: number;
  reportType: string;
  formType: string;
  status?: string;
  purpose?: string | null;
  effectiveDate?: string | Date | null;
  reportDate?: string | Date | null;
  valueApproach?: string | null;
  appraisalMethod?: string | null;
  clientName?: string | null;
  lenderName?: string | null;
  borrowerName?: string | null;
  marketValue?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Comparable property data structure
 */
export interface ComparableData {
  id?: number;
  reportId?: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  compType: string;
  propertyType?: string;
  salePrice?: string | number | null;
  saleDate?: string | Date | null;
  grossLivingArea?: string | number | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  basement?: string | null;
  garage?: string | null;
  condition?: string | null;
  quality?: string | null;
  yearBuilt?: string | number | null;
  lotSize?: string | number | null;
  stories?: string | number | null;
  roomCount?: string | number | null;
  livingArea?: string | number | null;
  kitchenCount?: string | number | null;
  exteriorMaterial?: string | null;
  foundation?: string | null;
  roof?: string | null;
  heating?: string | null;
  cooling?: string | null;
  porchPatiosDeck?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Adjustment data structure
 */
export interface AdjustmentData {
  id?: number;
  reportId?: number;
  comparableId?: number;
  adjustmentType?: string;
  amount?: string;
  description?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Photo data structure
 */
export interface PhotoData {
  id?: number;
  reportId?: number;
  photoType?: string;
  url?: string;
  caption?: string | null;
  dateTaken?: Date | null;
  latitude?: string | null;
  longitude?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Sketch data structure
 */
export interface SketchData {
  id?: number;
  reportId?: number;
  sketchType?: string;
  url?: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  dateTaken?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}