/**
 * Type definitions for the file import and parser modules
 */

import { InsertProperty, InsertComparable, InsertAppraisalReport, InsertAdjustment, Json } from "@shared/schema";

/**
 * Represents the result of a file parsing operation
 */
export interface ParseResult {
  properties: Partial<InsertProperty>[];
  comparables: Partial<InsertComparable>[];
  reports: Partial<InsertAppraisalReport>[];
  adjustments?: Partial<InsertAdjustment>[];
  errors: string[];
  warnings: string[];
  format: string;
}

/**
 * Represents a file parser
 */
export interface FileParser {
  canParse: (fileName: string, mimeType: string) => boolean;
  parse: (fileBuffer: Buffer, fileName: string) => Promise<ParseResult>;
}

/**
 * Represents the metadata for a file upload
 */
export interface FileUploadMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}

/**
 * Represents the result of a file import operation including related entities
 */
export interface ImportResult {
  fileId: string;
  fileName: string;
  format: string;
  status: 'success' | 'partial' | 'failed';
  dateProcessed: Date;
  importedEntities: {
    properties: number[];
    comparables: number[];
    reports: number[];
    adjustments: number[];
  };
  errors: string[];
  warnings: string[];
}

/**
 * Property data extracted from a file
 */
export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  grossLivingArea?: number;
  lotSize?: number;
  quality?: string;
  condition?: string;
  features?: string[];
  // Additional property fields can be added as needed
}

/**
 * Report data extracted from a file
 */
export interface ReportData {
  reportType: string;
  formType: string;
  purpose: string;
  effectiveDate?: Date;
  marketValue?: number;
  // Additional report fields can be added as needed
}

/**
 * Comparable property data extracted from a file
 */
export interface ComparableData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  salePrice?: number;
  saleDate?: Date;
  grossLivingArea?: number;
  lotSize?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  quality?: string;
  condition?: string;
  // Additional comparable fields can be added as needed
}

/**
 * Adjustment data extracted from a file
 */
export interface AdjustmentData {
  adjustmentType: string;
  amount: string;
  description?: string;
  // Additional adjustment fields can be added as needed
}