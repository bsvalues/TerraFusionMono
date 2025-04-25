/**
 * JSON Parser
 * 
 * Parses JSON format appraisal data and extracts relevant entities.
 * This parser handles various JSON structures commonly used for property data.
 */

import { DataEntity, FileParser, ParsingResult, PropertyData, ReportData, ComparableData, AdjustmentData } from "./types";

/**
 * Parser for JSON format appraisal data
 */
export class JSONParser implements FileParser {
  name = "JSONParser";
  
  /**
   * Determines if this parser can handle the given content
   */
  canParse(content: string): boolean {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      
      // Verify it's an object or array
      return (typeof parsed === 'object' && parsed !== null);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Parse JSON content and extract appraisal data
   */
  async parse(content: string): Promise<ParsingResult> {
    const entities: DataEntity[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Parse the JSON content
      const parsed = JSON.parse(content);
      
      // Determine the structure and extract accordingly
      if (Array.isArray(parsed)) {
        // Array of items - determine what they are
        if (parsed.length === 0) {
          warnings.push("Empty JSON array");
          return { entities, length: 0, warnings };
        }
        
        const sample = parsed[0];
        
        if (this.looksLikeProperty(sample)) {
          this.extractProperties(parsed, entities, warnings);
        } else if (this.looksLikeComparable(sample)) {
          this.extractComparables(parsed, entities, warnings);
        } else if (this.looksLikeReport(sample)) {
          this.extractReports(parsed, entities, warnings);
        } else {
          warnings.push("Unknown JSON array structure, attempting generic extraction");
          this.extractGeneric(parsed, entities, warnings);
        }
      } else {
        // Single object
        if (this.looksLikeAppraisalData(parsed)) {
          this.extractAppraisalData(parsed, entities, warnings);
        } else if (this.looksLikeProperty(parsed)) {
          this.extractProperty(parsed, entities, warnings);
        } else if (this.looksLikeReport(parsed)) {
          this.extractReport(parsed, entities, warnings);
        } else {
          warnings.push("Unknown JSON structure, attempting generic extraction");
          this.extractGeneric([parsed], entities, warnings);
        }
      }
      
      return {
        entities,
        length: entities.length,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(`Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`);
      return { entities, length: 0, errors };
    }
  }
  
  /**
   * Check if object looks like an appraisal data container
   */
  private looksLikeAppraisalData(obj: any): boolean {
    // Check for common structures in appraisal JSON exports
    return (
      (obj.property || obj.subject || obj.subjectProperty) &&
      (obj.comparables || obj.comps || obj.report || obj.appraisal)
    );
  }
  
  /**
   * Check if object looks like a property
   */
  private looksLikeProperty(obj: any): boolean {
    // Look for property-related fields
    const requiredFields = ['address', 'propertyType', 'city', 'state', 'zipCode'];
    const optionalFields = ['yearBuilt', 'bedrooms', 'bathrooms', 'grossLivingArea', 'lotSize'];
    
    // Must have most of the required fields
    let requiredCount = 0;
    for (const field of requiredFields) {
      if (obj[field] !== undefined) requiredCount++;
    }
    
    // And some optional fields
    let optionalCount = 0;
    for (const field of optionalFields) {
      if (obj[field] !== undefined) optionalCount++;
    }
    
    return requiredCount >= 3 && optionalCount >= 1;
  }
  
  /**
   * Check if object looks like a comparable
   */
  private looksLikeComparable(obj: any): boolean {
    // Look for comparable-specific fields
    const hasComparableFields = 
      (obj.compType !== undefined || obj.comparableType !== undefined) ||
      (obj.salePrice !== undefined || obj.price !== undefined) ||
      (obj.saleDate !== undefined || obj.dateOfSale !== undefined);
    
    // It should also have address info
    const hasAddressInfo = 
      (obj.address !== undefined) &&
      (obj.city !== undefined || obj.state !== undefined);
    
    return hasComparableFields && hasAddressInfo;
  }
  
  /**
   * Check if object looks like a report
   */
  private looksLikeReport(obj: any): boolean {
    // Look for report-specific fields
    const reportFields = [
      'reportType', 'formType', 'effectiveDate', 'reportDate', 
      'purpose', 'marketValue', 'status', 'appraiser'
    ];
    
    let fieldCount = 0;
    for (const field of reportFields) {
      if (obj[field] !== undefined) fieldCount++;
    }
    
    return fieldCount >= 3;
  }
  
  /**
   * Extract comprehensive appraisal data from a single object
   */
  private extractAppraisalData(data: any, entities: DataEntity[], warnings: string[]): void {
    // Extract property data
    const propertyData = data.property || data.subject || data.subjectProperty;
    if (propertyData) {
      this.extractProperty(propertyData, entities, warnings);
    } else {
      warnings.push("No property data found in JSON");
    }
    
    // Extract report data
    const reportData = data.report || data.appraisal;
    if (reportData) {
      this.extractReport(reportData, entities, warnings);
    } else {
      warnings.push("No report data found in JSON");
    }
    
    // Extract comparables
    const comparablesData = data.comparables || data.comps;
    if (comparablesData && Array.isArray(comparablesData)) {
      this.extractComparables(comparablesData, entities, warnings);
    } else {
      warnings.push("No comparables data found in JSON");
    }
    
    // Extract adjustments
    const adjustmentsData = data.adjustments;
    if (adjustmentsData && Array.isArray(adjustmentsData)) {
      this.extractAdjustments(adjustmentsData, entities, warnings);
    }
  }
  
  /**
   * Extract a subject property
   */
  private extractProperty(data: any, entities: DataEntity[], warnings: string[]): void {
    try {
      // Normalize property data
      const property: Partial<PropertyData> = {
        address: this.getStringValue(data, ['address', 'propertyAddress', 'streetAddress']),
        city: this.getStringValue(data, ['city']),
        state: this.getStringValue(data, ['state']),
        zipCode: this.getStringValue(data, ['zipCode', 'zip', 'postalCode']),
        propertyType: this.getStringValue(data, ['propertyType', 'type']),
        county: this.getStringValue(data, ['county']),
        legalDescription: this.getStringValue(data, ['legalDescription', 'legal']),
        taxParcelId: this.getStringValue(data, ['taxParcelId', 'parcelId', 'apn']),
        yearBuilt: this.getNumberValue(data, ['yearBuilt', 'year']),
        lotSize: this.getStringValue(data, ['lotSize', 'lot']),
        bedrooms: this.getNumberValue(data, ['bedrooms', 'beds', 'br']),
        bathrooms: this.getNumberValue(data, ['bathrooms', 'baths', 'ba']),
        grossLivingArea: this.getNumberValue(data, ['grossLivingArea', 'gla', 'area', 'squareFeet', 'sqft']),
        stories: this.getNumberValue(data, ['stories', 'numStories']),
        basement: this.getStringValue(data, ['basement', 'basementType']),
        garage: this.getStringValue(data, ['garage', 'garageType'])
      };
      
      // Verify we have required fields
      if (!property.address || !property.city || !property.state || !property.zipCode) {
        warnings.push("Missing required property address information");
        return;
      }
      
      entities.push({
        type: 'property',
        data: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode,
          propertyType: property.propertyType || "Single Family",
          county: property.county || null,
          legalDescription: property.legalDescription || null,
          taxParcelId: property.taxParcelId || null,
          yearBuilt: property.yearBuilt,
          lotSize: property.lotSize || null,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          grossLivingArea: property.grossLivingArea,
          stories: property.stories,
          basement: property.basement || null,
          garage: property.garage || null
        } as PropertyData
      });
    } catch (error) {
      warnings.push(`Error extracting property: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract a report
   */
  private extractReport(data: any, entities: DataEntity[], warnings: string[]): void {
    try {
      // Normalize report data
      const report: Partial<ReportData> = {
        reportType: this.getStringValue(data, ['reportType', 'type']),
        formType: this.getStringValue(data, ['formType', 'form']),
        status: this.getStringValue(data, ['status', 'reportStatus']),
        purpose: this.getStringValue(data, ['purpose', 'appraisalPurpose']),
        effectiveDate: this.getDateValue(data, ['effectiveDate', 'dateOfValue']),
        reportDate: this.getDateValue(data, ['reportDate', 'date']),
        marketValue: this.getStringValue(data, ['marketValue', 'value', 'appraisedValue']),
      };
      
      // Set defaults for required fields
      if (!report.reportType) report.reportType = "JSON Import";
      if (!report.formType) report.formType = "Unknown";
      if (!report.status) report.status = "Completed";
      
      entities.push({
        type: 'report',
        data: {
          reportType: report.reportType,
          formType: report.formType,
          status: report.status,
          purpose: report.purpose || null,
          effectiveDate: report.effectiveDate,
          reportDate: report.reportDate,
          marketValue: report.marketValue || null
        } as ReportData
      });
    } catch (error) {
      warnings.push(`Error extracting report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract an array of properties
   */
  private extractProperties(data: any[], entities: DataEntity[], warnings: string[]): void {
    data.forEach((item, index) => {
      try {
        this.extractProperty(item, entities, warnings);
      } catch (error) {
        warnings.push(`Error extracting property at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Extract an array of comparables
   */
  private extractComparables(data: any[], entities: DataEntity[], warnings: string[]): void {
    data.forEach((item, index) => {
      try {
        // Normalize comparable data
        const comp: Partial<ComparableData> = {
          address: this.getStringValue(item, ['address', 'comparableAddress', 'streetAddress']),
          city: this.getStringValue(item, ['city']),
          state: this.getStringValue(item, ['state']),
          zipCode: this.getStringValue(item, ['zipCode', 'zip', 'postalCode']),
          compType: this.getStringValue(item, ['compType', 'comparableType']) || "Sale",
          propertyType: this.getStringValue(item, ['propertyType', 'type']),
          salePrice: this.getStringValue(item, ['salePrice', 'price', 'soldPrice']),
          saleDate: this.getStringValue(item, ['saleDate', 'dateSold', 'dateOfSale']),
          bedrooms: this.getStringValue(item, ['bedrooms', 'beds', 'br']),
          bathrooms: this.getStringValue(item, ['bathrooms', 'baths', 'ba']),
          grossLivingArea: this.getStringValue(item, ['grossLivingArea', 'gla', 'area', 'squareFeet', 'sqft']),
          yearBuilt: this.getStringValue(item, ['yearBuilt', 'year']),
          lotSize: this.getStringValue(item, ['lotSize', 'lot']),
          condition: this.getStringValue(item, ['condition', 'cond']),
          quality: this.getStringValue(item, ['quality', 'qual'])
        };
        
        // Verify we have required fields
        if (!comp.address) {
          warnings.push(`Missing address for comparable at index ${index}`);
          return;
        }
        
        entities.push({
          type: 'comparable',
          data: {
            address: comp.address,
            city: comp.city || "Unknown",
            state: comp.state || "Unknown",
            zipCode: comp.zipCode || "Unknown",
            compType: comp.compType,
            propertyType: comp.propertyType || "Single Family",
            salePrice: comp.salePrice,
            saleDate: comp.saleDate,
            bedrooms: comp.bedrooms,
            bathrooms: comp.bathrooms,
            grossLivingArea: comp.grossLivingArea,
            yearBuilt: comp.yearBuilt,
            lotSize: comp.lotSize,
            condition: comp.condition,
            quality: comp.quality
          } as ComparableData
        });
      } catch (error) {
        warnings.push(`Error extracting comparable at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Extract an array of reports
   */
  private extractReports(data: any[], entities: DataEntity[], warnings: string[]): void {
    data.forEach((item, index) => {
      try {
        this.extractReport(item, entities, warnings);
      } catch (error) {
        warnings.push(`Error extracting report at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Extract adjustment data
   */
  private extractAdjustments(data: any[], entities: DataEntity[], warnings: string[]): void {
    data.forEach((item, index) => {
      try {
        const adjustment: Partial<AdjustmentData> = {
          comparableId: this.getNumberValue(item, ['comparableId', 'compId']),
          adjustmentType: this.getStringValue(item, ['adjustmentType', 'type', 'name']),
          amount: this.getStringValue(item, ['amount', 'value']),
          description: this.getStringValue(item, ['description', 'desc'])
        };
        
        // Verify we have required fields
        if (!adjustment.adjustmentType || !adjustment.amount) {
          warnings.push(`Missing required fields for adjustment at index ${index}`);
          return;
        }
        
        // Set a default comparable ID if missing
        if (!adjustment.comparableId) {
          adjustment.comparableId = index + 1;
        }
        
        entities.push({
          type: 'adjustment',
          data: {
            comparableId: adjustment.comparableId,
            adjustmentType: adjustment.adjustmentType,
            amount: adjustment.amount,
            description: adjustment.description || null
          } as AdjustmentData
        });
      } catch (error) {
        warnings.push(`Error extracting adjustment at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Attempt to extract data from generic JSON
   */
  private extractGeneric(data: any[], entities: DataEntity[], warnings: string[]): void {
    // Try to intelligently handle unknown structures
    for (const item of data) {
      try {
        // Check for address-like fields
        const hasAddress = this.getStringValue(item, ['address', 'propertyAddress', 'streetAddress', 'location']);
        
        if (hasAddress) {
          // Determine if it's more likely a property or comparable
          const hasSalePrice = this.getStringValue(item, ['salePrice', 'price', 'soldPrice']);
          const hasSaleDate = this.getStringValue(item, ['saleDate', 'dateSold', 'dateOfSale']);
          
          if (hasSalePrice || hasSaleDate) {
            this.extractComparables([item], entities, warnings);
          } else {
            this.extractProperty(item, entities, warnings);
          }
        } else if (this.getStringValue(item, ['reportType', 'formType', 'appraisalType'])) {
          this.extractReport(item, entities, warnings);
        }
      } catch (error) {
        warnings.push(`Error in generic extraction: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (entities.length === 0) {
      warnings.push("Could not extract any meaningful data from the JSON structure");
    }
  }
  
  /**
   * Get a string value from multiple possible keys
   */
  private getStringValue(obj: any, keys: string[]): string | null {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return String(obj[key]);
      }
    }
    return null;
  }
  
  /**
   * Get a number value from multiple possible keys
   */
  private getNumberValue(obj: any, keys: string[]): number | null {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        const num = Number(obj[key]);
        return isNaN(num) ? null : num;
      }
    }
    return null;
  }
  
  /**
   * Get a date value from multiple possible keys
   */
  private getDateValue(obj: any, keys: string[]): Date | null {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        try {
          return new Date(obj[key]);
        } catch (error) {
          // Invalid date format, try next key
        }
      }
    }
    return null;
  }
}