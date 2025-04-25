/**
 * CSV Parser
 * 
 * Parses CSV format appraisal data and extracts relevant entities.
 * This parser is designed to handle CSV exports of comparable property data.
 */

import * as papa from 'papaparse';
import { DataEntity, FileParser, ParsingResult, PropertyData, ReportData, ComparableData } from "./types";

/**
 * Parser for CSV format appraisal data
 */
export class CSVParser implements FileParser {
  name = "CSVParser";
  
  /**
   * Determines if this parser can handle the given content
   */
  canParse(content: string): boolean {
    // Check if it looks like a CSV file with headers and data rows
    const lines = content.trim().split('\n');
    if (lines.length < 2) return false; // Need at least header + one data row
    
    // Check for comma or tab delimiters
    const firstLine = lines[0];
    const hasCommas = firstLine.includes(',');
    const hasTabs = firstLine.includes('\t');
    
    if (!hasCommas && !hasTabs) return false;
    
    // Check if first line might be a header with property or comparable related terms
    const headerTerms = ['address', 'property', 'city', 'state', 'zip', 'price', 'sale', 'beds', 'baths', 'area'];
    
    let headerCount = 0;
    for (const term of headerTerms) {
      if (firstLine.toLowerCase().includes(term)) {
        headerCount++;
      }
    }
    
    // If we found multiple property-related terms in the header, it's likely a valid CSV
    return headerCount >= 3;
  }
  
  /**
   * Parse CSV content and extract appraisal data
   */
  async parse(content: string): Promise<ParsingResult> {
    const entities: DataEntity[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Parse the CSV content
      const parseResult = papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
      });
      
      const rows = parseResult.data;
      
      // Check if parsing succeeded
      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach(err => {
          warnings.push(`CSV parsing error at row ${err.row}: ${err.message}`);
        });
      }
      
      if (rows.length === 0) {
        warnings.push("No data rows found in CSV");
        return { entities, length: 0, warnings };
      }
      
      // Determine the type of data in the CSV based on headers
      const headers = Object.keys(rows[0]).map(h => h.toLowerCase());
      
      if (this.isComparablesData(headers)) {
        // Process as comparables data
        this.extractComparables(rows, entities, warnings);
      } else if (this.isPropertyData(headers)) {
        // Process as property data
        this.extractPropertyData(rows, entities, warnings);
      } else {
        warnings.push("Could not determine data type from CSV headers. Using generic extraction.");
        this.extractGeneric(rows, entities, warnings);
      }
      
      return {
        entities,
        length: entities.length,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(`Error parsing CSV: ${error instanceof Error ? error.message : String(error)}`);
      return { entities, length: 0, errors };
    }
  }
  
  /**
   * Determine if the CSV contains comparable properties data
   */
  private isComparablesData(headers: string[]): boolean {
    const comparableTerms = ['comp', 'comparable', 'sale_price', 'sale_date', 'comp_address'];
    return this.hasRequiredFields(headers, ['address', 'city', 'state', 'zip']) &&
           this.hasAtLeastOne(headers, comparableTerms);
  }
  
  /**
   * Determine if the CSV contains subject property data
   */
  private isPropertyData(headers: string[]): boolean {
    const propertyTerms = ['subject', 'property_type', 'year_built', 'lot_size'];
    return this.hasRequiredFields(headers, ['address', 'city', 'state', 'zip']) &&
           this.hasAtLeastOne(headers, propertyTerms);
  }
  
  /**
   * Check if headers contain all required fields
   */
  private hasRequiredFields(headers: string[], required: string[]): boolean {
    return required.every(field => 
      headers.some(h => h.includes(field))
    );
  }
  
  /**
   * Check if headers contain at least one of the specified terms
   */
  private hasAtLeastOne(headers: string[], terms: string[]): boolean {
    return terms.some(term => 
      headers.some(h => h.includes(term))
    );
  }
  
  /**
   * Extract comparables from CSV rows
   */
  private extractComparables(rows: any[], entities: DataEntity[], warnings: string[]): void {
    rows.forEach((row, index) => {
      try {
        // Map CSV column names to ComparableData properties
        const comp: Partial<ComparableData> = {
          address: this.getFieldValue(row, ['address', 'comp_address', 'street_address']),
          city: this.getFieldValue(row, ['city', 'comp_city']),
          state: this.getFieldValue(row, ['state', 'comp_state']),
          zipCode: this.getFieldValue(row, ['zip', 'zipcode', 'postal_code', 'zip_code']),
          compType: "Sale",
          propertyType: this.getFieldValue(row, ['property_type', 'type']),
          salePrice: this.getFieldValue(row, ['sale_price', 'price', 'sold_price']),
          saleDate: this.getFieldValue(row, ['sale_date', 'date_sold', 'sold_date']),
          bedrooms: this.getFieldValue(row, ['bedrooms', 'beds', 'br']),
          bathrooms: this.getFieldValue(row, ['bathrooms', 'baths', 'ba']),
          grossLivingArea: this.getFieldValue(row, ['gross_living_area', 'gla', 'area', 'square_feet', 'sqft']),
          yearBuilt: this.getFieldValue(row, ['year_built', 'year']),
          lotSize: this.getFieldValue(row, ['lot_size', 'lot']),
          condition: this.getFieldValue(row, ['condition', 'cond']),
          quality: this.getFieldValue(row, ['quality', 'qual'])
        };
        
        // Verify address exists
        if (!comp.address) {
          warnings.push(`Row ${index + 1}: Missing address, skipping comparable`);
          return;
        }
        
        // Add the comparable to entities
        entities.push({
          type: 'comparable',
          data: {
            address: comp.address,
            city: comp.city || "Unknown",
            state: comp.state || "Unknown",
            zipCode: comp.zipCode || "Unknown",
            compType: comp.compType || "Sale",
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
        warnings.push(`Error processing row ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Extract property data from CSV rows
   */
  private extractPropertyData(rows: any[], entities: DataEntity[], warnings: string[]): void {
    // Usually just the first row contains the subject property
    const row = rows[0];
    
    try {
      // Map CSV column names to PropertyData properties
      const property: Partial<PropertyData> = {
        address: this.getFieldValue(row, ['address', 'property_address', 'subject_address', 'street_address']),
        city: this.getFieldValue(row, ['city', 'property_city', 'subject_city']),
        state: this.getFieldValue(row, ['state', 'property_state', 'subject_state']),
        zipCode: this.getFieldValue(row, ['zip', 'zipcode', 'postal_code', 'zip_code']),
        propertyType: this.getFieldValue(row, ['property_type', 'type']),
        county: this.getFieldValue(row, ['county']),
        legalDescription: this.getFieldValue(row, ['legal_description', 'legal']),
        taxParcelId: this.getFieldValue(row, ['tax_parcel_id', 'parcel_id', 'apn']),
        yearBuilt: this.getFieldValue(row, ['year_built', 'year']),
        lotSize: this.getFieldValue(row, ['lot_size', 'lot']),
        bedrooms: this.getNumericValue(row, ['bedrooms', 'beds', 'br']),
        bathrooms: this.getNumericValue(row, ['bathrooms', 'baths', 'ba']),
        grossLivingArea: this.getNumericValue(row, ['gross_living_area', 'gla', 'area', 'square_feet', 'sqft']),
        stories: this.getNumericValue(row, ['stories', 'floors']),
        basement: this.getFieldValue(row, ['basement', 'bsmt']),
        garage: this.getFieldValue(row, ['garage', 'gar'])
      };
      
      // Verify address exists
      if (!property.address) {
        warnings.push("Missing address, cannot extract property data");
        return;
      }
      
      // Add property to entities
      entities.push({
        type: 'property',
        data: {
          address: property.address,
          city: property.city || "Unknown",
          state: property.state || "Unknown",
          zipCode: property.zipCode || "Unknown",
          propertyType: property.propertyType || "Single Family",
          county: property.county,
          legalDescription: property.legalDescription,
          taxParcelId: property.taxParcelId,
          yearBuilt: property.yearBuilt ? parseInt(property.yearBuilt.toString()) : null,
          lotSize: property.lotSize,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          grossLivingArea: property.grossLivingArea,
          stories: property.stories,
          basement: property.basement,
          garage: property.garage
        } as PropertyData
      });
      
      // Create a basic report entity
      entities.push({
        type: 'report',
        data: {
          reportType: "CSV Import",
          formType: "Data Import",
          status: "Completed"
        } as ReportData
      });
      
      // Process remaining rows as comparables
      if (rows.length > 1) {
        this.extractComparables(rows.slice(1), entities, warnings);
      }
    } catch (error) {
      warnings.push(`Error processing property data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract generic data when the type is not clear
   */
  private extractGeneric(rows: any[], entities: DataEntity[], warnings: string[]): void {
    // Check if any row has address info
    for (const row of rows) {
      const hasAddress = this.getFieldValue(row, ['address', 'street_address']);
      
      if (hasAddress) {
        // Process all rows as comparables
        this.extractComparables(rows, entities, warnings);
        return;
      }
    }
    
    warnings.push("Could not identify address information in CSV");
  }
  
  /**
   * Get a value from a row, checking multiple possible field names
   */
  private getFieldValue(row: any, fieldNames: string[]): string | null {
    for (const field of fieldNames) {
      if (row[field] && row[field].toString().trim() !== '') {
        return row[field].toString().trim();
      }
    }
    return null;
  }
  
  /**
   * Get a numeric value from a row, checking multiple possible field names
   */
  private getNumericValue(row: any, fieldNames: string[]): number | null {
    const value = this.getFieldValue(row, fieldNames);
    if (value === null) return null;
    
    // Convert to number
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }
}