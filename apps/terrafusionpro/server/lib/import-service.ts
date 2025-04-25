/**
 * Import Service for Appraisal Data
 * 
 * Handles the process of importing appraisal data from different file formats.
 * Coordinates file parsing, data extraction, and database storage.
 */

import { v4 as uuidv4 } from "uuid";
import { storage, FileImportResultUpdate } from "../storage";
import { ParserRegistry } from "./file-parsers";
import { PropertyData, ReportData, ComparableData, AdjustmentData } from "./file-parsers/types";
import fs from "fs";
import path from "path";

/**
 * Import request interface
 */
interface ImportRequest {
  userId: number;
  filename: string;
  originalFilename: string;
  mimeType: string;
}

/**
 * Import result interface
 */
interface ImportResult {
  importId: string;
  warnings: string[];
}

/**
 * Service for importing and processing appraisal files
 */
export class ImportService {
  private parserRegistry: ParserRegistry;

  constructor() {
    this.parserRegistry = new ParserRegistry();
  }

  /**
   * Process a file upload request
   */
  async processFile(request: ImportRequest): Promise<ImportResult> {
    const { userId, filename, originalFilename, mimeType } = request;
    const warnings: string[] = [];
    
    // Create an import record to track progress
    const importId = uuidv4();
    const importResult = await storage.createFileImportResult({
      id: importId,
      userId,
      filename: path.basename(originalFilename),
      status: "processing",
      fileType: this.determineFileType(originalFilename, mimeType),
      entitiesExtracted: 0,
      errors: [],
      warnings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      // Determine the file type and get the appropriate parser
      const fileContent = fs.readFileSync(filename, "utf8");
      const parser = this.parserRegistry.getParserForFile(originalFilename, fileContent);
      
      if (!parser) {
        throw new Error(`Unsupported file format: ${originalFilename}`);
      }

      // Parse the file
      console.log(`Parsing file ${originalFilename} with ${parser.name} parser`);
      const parseResults = await parser.parse(fileContent);
      
      // Update import record with initial parsing results
      await this.updateImportStatus(importId, {
        entitiesExtracted: parseResults.length,
        warnings: parseResults.warnings || []
      });

      // Process each extracted entity
      let entitiesProcessed = 0;
      for (const entity of parseResults.entities) {
        try {
          if (entity.type === "property") {
            // Process property data
            const propertyData = entity.data as PropertyData;
            const property = await storage.createProperty({
              userId,
              ...propertyData
            });
            
            entitiesProcessed++;
            console.log(`Created property: ${property.address}`);
          } 
          else if (entity.type === "report") {
            // Process report data
            const reportData = entity.data as ReportData;
            // Ensure we have required fields
            if (!reportData.propertyId) {
              warnings.push(`Report data missing propertyId, skipping: ${JSON.stringify(reportData)}`);
              continue;
            }
            
            const report = await storage.createAppraisalReport({
              userId,
              ...reportData
            });
            
            entitiesProcessed++;
            console.log(`Created report: ${report.id}`);
          }
          else if (entity.type === "comparable") {
            // Process comparable data
            const comparableData = entity.data as ComparableData;
            // Ensure we have required fields
            if (!comparableData.reportId) {
              warnings.push(`Comparable data missing reportId, skipping: ${JSON.stringify(comparableData)}`);
              continue;
            }
            
            const comparable = await storage.createComparable({
              ...comparableData
            });
            
            entitiesProcessed++;
            console.log(`Created comparable: ${comparable.address}`);
          }
          else if (entity.type === "adjustment") {
            // Process adjustment data
            const adjustmentData = entity.data as AdjustmentData;
            // Ensure we have required fields
            if (!adjustmentData.reportId || !adjustmentData.comparableId) {
              warnings.push(`Adjustment data missing reportId or comparableId, skipping: ${JSON.stringify(adjustmentData)}`);
              continue;
            }
            
            const adjustment = await storage.createAdjustment({
              ...adjustmentData
            });
            
            entitiesProcessed++;
            console.log(`Created adjustment: ${adjustment.adjustmentType}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          warnings.push(`Error processing entity: ${errorMessage}`);
          console.error("Error processing entity:", error);
        }
      }

      // Update the import result record
      await this.updateImportStatus(importId, {
        status: "completed",
        entitiesExtracted: entitiesProcessed,
        warnings
      });

      return {
        importId,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error processing file:", error);
      
      // Update the import result record with the error
      await this.updateImportStatus(importId, {
        status: "failed",
        errors: [errorMessage]
      });
      
      // Rethrow to be caught by the caller
      throw error;
    } finally {
      // Clean up the temp file
      try {
        fs.unlinkSync(filename);
      } catch (error) {
        console.error("Error removing temp file:", error);
      }
    }
  }

  /**
   * Determine the file type based on the filename and MIME type
   */
  private determineFileType(filename: string, mimeType: string): string {
    const extension = path.extname(filename).toLowerCase();
    
    if (extension === ".pdf" || mimeType === "application/pdf") {
      return "pdf";
    } else if (extension === ".xml" || mimeType === "application/xml" || mimeType === "text/xml") {
      return "xml";
    } else if (extension === ".csv" || mimeType === "text/csv") {
      return "csv";
    } else if (extension === ".json" || mimeType === "application/json") {
      return "json";
    } else if (extension === ".zap" || extension === ".aci" || extension === ".apr") {
      return "workfile";
    } else {
      return "unknown";
    }
  }

  /**
   * Update the status of an import
   */
  private async updateImportStatus(importId: string, update: FileImportResultUpdate): Promise<void> {
    await storage.updateFileImportResult(importId, update);
  }

  /**
   * Get all import results for a user
   */
  async getImportResults(userId: number, limit?: number, offset?: number): Promise<any[]> {
    return await storage.getFileImportResultsByUserId(userId);
  }

  /**
   * Get a specific import result
   */
  async getImportResult(id: string): Promise<any> {
    return await storage.getFileImportResult(id);
  }
}