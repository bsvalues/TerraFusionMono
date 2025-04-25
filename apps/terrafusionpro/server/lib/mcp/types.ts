/**
 * Modal Content Protocol (MCP) Type Definitions
 * 
 * This file contains the core type definitions for the Modal Content Protocol,
 * which standardizes how data is exchanged between different components of the system.
 */

// Basic message interface
export interface MCPMessage<T = unknown> {
  messageId: string;
  timestamp: number;
  sender: string;
  recipient: string;
  contentType: string;
  content: T;
  metadata: Record<string, any>;
}

// Response message interface
export interface MCPResponseMessage<T = unknown> extends MCPMessage<T> {
  inResponseTo: string;
  status: 'success' | 'error' | 'partial';
  errorDetails?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Message handler type
export type MCPMessageHandler<T = unknown, R = unknown> = 
  (message: MCPMessage<T>) => Promise<R>;

// Standard content types for real estate appraisal domain
export enum MCPContentTypes {
  // Property data
  PROPERTY_DATA_REQUEST = 'mcp.property.data.request',
  PROPERTY_DATA_RESPONSE = 'mcp.property.data.response',
  
  // Valuation
  VALUATION_REQUEST = 'mcp.valuation.request',
  VALUATION_RESPONSE = 'mcp.valuation.response',
  
  // Comparables
  COMPARABLES_REQUEST = 'mcp.comparables.request',
  COMPARABLES_RESPONSE = 'mcp.comparables.response',
  
  // Market analysis
  MARKET_ANALYSIS_REQUEST = 'mcp.market.analysis.request',
  MARKET_ANALYSIS_RESPONSE = 'mcp.market.analysis.response',
  
  // Document extraction
  DOCUMENT_EXTRACTION_REQUEST = 'mcp.document.extraction.request',
  DOCUMENT_EXTRACTION_RESPONSE = 'mcp.document.extraction.response',
  
  // Compliance
  COMPLIANCE_CHECK_REQUEST = 'mcp.compliance.check.request',
  COMPLIANCE_CHECK_RESPONSE = 'mcp.compliance.check.response',
  
  // Narrative generation
  NARRATIVE_GENERATION_REQUEST = 'mcp.narrative.generation.request',
  NARRATIVE_GENERATION_RESPONSE = 'mcp.narrative.generation.response',
  
  // Errors
  ERROR = 'mcp.error'
}

// Common data structures used across the MCP

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  lotSize?: string;
  stories?: number;
  garage?: string;
  basement?: string;
  [key: string]: any; // Allow for additional properties
}

export interface ValuationRequest {
  property: PropertyData;
  approachType: 'sales_comparison' | 'cost' | 'income' | 'all';
  includeAdjustments?: boolean;
  includeRationale?: boolean;
}

export interface ValuationResponse {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange?: {
    min: number;
    max: number;
  };
  adjustments?: Array<{
    factor: string;
    description: string;
    amount: number;
    reasoning: string;
  }>;
  approachResults?: {
    salesComparison?: number;
    cost?: number;
    income?: number;
  };
  reconciliation?: string;
}

export interface DocumentExtractionRequest {
  documentText: string;
  documentType: string;
  extractionTarget?: string[];
}

export interface DocumentExtractionResponse {
  extractedData: Record<string, any>;
  confidence: number;
  missingFields?: string[];
}

export interface ComplianceCheckRequest {
  reportText: string;
  complianceStandards: string[];
  severityThreshold?: 'low' | 'medium' | 'high';
}

export interface ComplianceCheckResponse {
  compliant: boolean;
  issues: Array<{
    standard: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    location?: string;
    recommendation?: string;
  }>;
  overallScore?: number;
}

export interface NarrativeGenerationRequest {
  section: 'neighborhood' | 'improvements' | 'site' | 'market_conditions' | 'approach_to_value' | 'reconciliation';
  propertyData: PropertyData;
  additionalContext?: string;
  length?: 'brief' | 'standard' | 'detailed';
}

export interface NarrativeGenerationResponse {
  narrative: string;
  wordCount: number;
}

// Utility types for content validation
export type MCPContentTypeMap = {
  [MCPContentTypes.PROPERTY_DATA_REQUEST]: { propertyId: number } | { address: string };
  [MCPContentTypes.PROPERTY_DATA_RESPONSE]: PropertyData;
  [MCPContentTypes.VALUATION_REQUEST]: ValuationRequest;
  [MCPContentTypes.VALUATION_RESPONSE]: ValuationResponse;
  [MCPContentTypes.DOCUMENT_EXTRACTION_REQUEST]: DocumentExtractionRequest;
  [MCPContentTypes.DOCUMENT_EXTRACTION_RESPONSE]: DocumentExtractionResponse;
  [MCPContentTypes.COMPLIANCE_CHECK_REQUEST]: ComplianceCheckRequest;
  [MCPContentTypes.COMPLIANCE_CHECK_RESPONSE]: ComplianceCheckResponse;
  [MCPContentTypes.NARRATIVE_GENERATION_REQUEST]: NarrativeGenerationRequest;
  [MCPContentTypes.NARRATIVE_GENERATION_RESPONSE]: NarrativeGenerationResponse;
}

// Type-safe message creator
export function createMCPMessage<T extends MCPContentTypes>(
  contentType: T,
  content: MCPContentTypeMap[T],
  sender: string,
  recipient: string,
  metadata: Record<string, any> = {}
): MCPMessage<MCPContentTypeMap[T]> {
  return {
    messageId: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: Date.now(),
    sender,
    recipient,
    contentType,
    content,
    metadata
  };
}

// Type-safe response creator
export function createMCPResponse<T extends MCPContentTypes>(
  originalMessage: MCPMessage,
  contentType: T,
  content: MCPContentTypeMap[T],
  status: 'success' | 'error' | 'partial' = 'success',
  errorDetails?: { code: string; message: string; details?: any }
): MCPResponseMessage<MCPContentTypeMap[T]> {
  return {
    messageId: `response-${originalMessage.messageId}-${Date.now()}`,
    inResponseTo: originalMessage.messageId,
    timestamp: Date.now(),
    sender: originalMessage.recipient,
    recipient: originalMessage.sender,
    contentType,
    content,
    metadata: {},
    status,
    errorDetails
  };
}