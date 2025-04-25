/**
 * MISMO XML Parser
 * 
 * Parses MISMO XML format appraisal files and extracts relevant data.
 * MISMO (Mortgage Industry Standards Maintenance Organization) XML
 * is commonly used for standardized appraisal data exchange.
 */

import { XMLParser } from "fast-xml-parser";
import { DataEntity, FileParser, ParsingResult, PropertyData, ReportData, ComparableData, AdjustmentData } from "./types";

/**
 * Parser for MISMO XML appraisal format
 */
export class MISMOXMLParser implements FileParser {
  name = "MISMOXMLParser";
  
  /**
   * Determines if this parser can handle the given content
   */
  canParse(content: string): boolean {
    // Check if it's an XML document with MISMO elements
    return content.includes("<MISMO_") || 
           content.includes("<MISMO:") || 
           (content.includes("<") && 
            content.includes("xmlns:MISMO") && 
            content.includes("AppraisalReport"));
  }
  
  /**
   * Parse MISMO XML document and extract appraisal data
   */
  async parse(content: string): Promise<ParsingResult> {
    const entities: DataEntity[] = [];
    const warnings: string[] = [];
    
    try {
      // Configure XML parser options
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
        parseAttributeValue: true
      });
      
      // Parse the XML content
      const result = parser.parse(content);
      
      // Extract the MISMO document
      const mismoDoc = this.findMISMOElement(result);
      
      if (!mismoDoc) {
        warnings.push("Could not find MISMO document structure");
        return { entities, length: 0, warnings };
      }
      
      // Extract subject property data
      const propertyData = this.extractSubjectProperty(mismoDoc);
      if (propertyData) {
        entities.push({
          type: 'property',
          data: propertyData
        });
      } else {
        warnings.push("No subject property data found");
      }
      
      // Extract appraisal report information
      const reportData = this.extractReportInfo(mismoDoc);
      if (reportData) {
        entities.push({
          type: 'report',
          data: reportData
        });
      } else {
        warnings.push("No appraisal report data found");
      }
      
      // Extract comparable properties
      const comparables = this.extractComparables(mismoDoc);
      if (comparables.length > 0) {
        comparables.forEach(comp => {
          entities.push({
            type: 'comparable',
            data: comp
          });
        });
      } else {
        warnings.push("No comparable properties found");
      }
      
      // Extract adjustments
      const adjustments = this.extractAdjustments(mismoDoc);
      if (adjustments.length > 0) {
        adjustments.forEach(adj => {
          entities.push({
            type: 'adjustment',
            data: adj
          });
        });
      }
      
      return {
        entities,
        length: entities.length,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      warnings.push(`Error parsing MISMO XML: ${error instanceof Error ? error.message : String(error)}`);
      return { entities, length: 0, warnings };
    }
  }
  
  /**
   * Locate the MISMO document structure
   */
  private findMISMOElement(obj: any): any {
    if (!obj) return null;
    
    // Check if this object has MISMO data
    if (obj.MISMO_AppraisalReport || 
        obj["MISMO:AppraisalReport"] || 
        obj.AppraisalReport) {
      return obj.MISMO_AppraisalReport || 
             obj["MISMO:AppraisalReport"] || 
             obj.AppraisalReport;
    }
    
    // Recursively check child objects
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const result = this.findMISMOElement(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  /**
   * Extract subject property data
   */
  private extractSubjectProperty(mismoDoc: any): PropertyData | null {
    try {
      let property: any = null;
      
      // Navigate the MISMO structure to find the subject property
      if (mismoDoc.SubjectProperty) {
        property = mismoDoc.SubjectProperty;
      } else if (mismoDoc.PROPERTY) {
        property = mismoDoc.PROPERTY;
      } else if (mismoDoc.Property) {
        property = mismoDoc.Property;
      }
      
      if (!property) {
        return null;
      }
      
      // Extract address data
      let address = "";
      let city = "";
      let state = "";
      let zipCode = "";
      let county = null;
      
      if (property.PropertyAddress) {
        const addr = property.PropertyAddress;
        address = addr.StreetAddress || addr.AddressLine1 || "";
        city = addr.City || "";
        state = addr.State || "";
        zipCode = addr.PostalCode || addr.ZipCode || "";
        county = addr.County || null;
      } else if (property.Address) {
        const addr = property.Address;
        address = addr.StreetAddress || addr.AddressLine1 || "";
        city = addr.City || "";
        state = addr.State || "";
        zipCode = addr.PostalCode || addr.ZipCode || "";
        county = addr.County || null;
      }
      
      // Extract property characteristics
      const propertyType = this.extractPropertyType(property);
      const yearBuilt = property.YearBuilt || property.ConstructionYear || null;
      const lotSize = property.LotSize || null;
      const bedrooms = property.Bedrooms || property.RoomCount?.Bedrooms || null;
      const bathrooms = property.Bathrooms || property.RoomCount?.Bathrooms || null;
      const grossLivingArea = property.GrossLivingArea || property.GLA || null;
      
      return {
        address,
        city,
        state,
        zipCode,
        propertyType,
        county,
        yearBuilt,
        lotSize,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        grossLivingArea: grossLivingArea ? Number(grossLivingArea) : null
      };
    } catch (error) {
      console.error("Error extracting subject property:", error);
      return null;
    }
  }
  
  /**
   * Extract appraisal report information
   */
  private extractReportInfo(mismoDoc: any): ReportData | null {
    try {
      // Find report elements
      const report = mismoDoc.Form || mismoDoc.AppraisalForm || mismoDoc.Report || mismoDoc;
      
      if (!report) {
        return null;
      }
      
      // Extract form type
      let formType = "Unknown";
      if (report.FormType) {
        formType = report.FormType;
      } else if (report.AppraisalFormType) {
        formType = report.AppraisalFormType;
      } else if (report["@_FormType"]) {
        formType = report["@_FormType"];
      } else if (mismoDoc["@_FormType"]) {
        formType = mismoDoc["@_FormType"];
      }
      
      // Extract effective date
      let effectiveDate = null;
      if (report.EffectiveDate) {
        effectiveDate = new Date(report.EffectiveDate);
      } else if (mismoDoc.EffectiveDate) {
        effectiveDate = new Date(mismoDoc.EffectiveDate);
      } else if (report.AppraisalInfo?.EffectiveDate) {
        effectiveDate = new Date(report.AppraisalInfo.EffectiveDate);
      }
      
      // Extract report date
      let reportDate = null;
      if (report.ReportDate) {
        reportDate = new Date(report.ReportDate);
      } else if (mismoDoc.ReportDate) {
        reportDate = new Date(mismoDoc.ReportDate);
      } else if (report.AppraisalInfo?.ReportDate) {
        reportDate = new Date(report.AppraisalInfo.ReportDate);
      }
      
      // Extract purpose
      const purpose = report.Purpose || report.AppraisalPurpose || null;
      
      // Extract value
      let marketValue = null;
      if (report.Value) {
        marketValue = report.Value;
      } else if (report.AppraisedValue) {
        marketValue = report.AppraisedValue;
      } else if (mismoDoc.Value) {
        marketValue = mismoDoc.Value;
      }
      
      return {
        reportType: "MISMO XML",
        formType,
        status: "Completed",
        purpose,
        effectiveDate,
        reportDate,
        marketValue
      };
    } catch (error) {
      console.error("Error extracting report info:", error);
      return null;
    }
  }
  
  /**
   * Extract comparable properties
   */
  private extractComparables(mismoDoc: any): ComparableData[] {
    const comparables: ComparableData[] = [];
    
    try {
      // Find where comparables might be stored
      let compArray = null;
      if (mismoDoc.Comparables) {
        compArray = Array.isArray(mismoDoc.Comparables) 
          ? mismoDoc.Comparables 
          : [mismoDoc.Comparables];
      } else if (mismoDoc.SalesComparables) {
        compArray = Array.isArray(mismoDoc.SalesComparables.Comparable) 
          ? mismoDoc.SalesComparables.Comparable 
          : [mismoDoc.SalesComparables.Comparable];
      } else if (mismoDoc.ComparableSales) {
        compArray = Array.isArray(mismoDoc.ComparableSales) 
          ? mismoDoc.ComparableSales 
          : [mismoDoc.ComparableSales];
      }
      
      if (!compArray || compArray.length === 0) {
        return [];
      }
      
      // Process each comparable
      compArray.forEach((comp: any) => {
        // Extract address info
        let address = "";
        let city = "";
        let state = "";
        let zipCode = "";
        
        if (comp.PropertyAddress) {
          const addr = comp.PropertyAddress;
          address = addr.StreetAddress || addr.AddressLine1 || "";
          city = addr.City || "";
          state = addr.State || "";
          zipCode = addr.PostalCode || addr.ZipCode || "";
        } else if (comp.Address) {
          const addr = comp.Address;
          address = addr.StreetAddress || addr.AddressLine1 || "";
          city = addr.City || "";
          state = addr.State || "";
          zipCode = addr.PostalCode || addr.ZipCode || "";
        }
        
        if (!address) return; // Skip if no address found
        
        // Extract property characteristics
        const propertyType = this.extractPropertyType(comp);
        const salePrice = comp.SalePrice || comp.Price || null;
        const saleDate = comp.SaleDate || comp.DateOfSale || null;
        const yearBuilt = comp.YearBuilt || comp.ConstructionYear || null;
        const bedrooms = comp.Bedrooms || comp.RoomCount?.Bedrooms || null;
        const bathrooms = comp.Bathrooms || comp.RoomCount?.Bathrooms || null;
        const grossLivingArea = comp.GrossLivingArea || comp.GLA || null;
        
        comparables.push({
          address,
          city,
          state,
          zipCode,
          compType: "Sale",
          propertyType,
          salePrice,
          saleDate,
          yearBuilt,
          bedrooms,
          bathrooms,
          grossLivingArea
        });
      });
      
      return comparables;
    } catch (error) {
      console.error("Error extracting comparables:", error);
      return [];
    }
  }
  
  /**
   * Extract adjustments between subject and comparable properties
   */
  private extractAdjustments(mismoDoc: any): AdjustmentData[] {
    const adjustments: AdjustmentData[] = [];
    
    try {
      // Find adjustment data
      let adjSection = null;
      if (mismoDoc.Adjustments) {
        adjSection = mismoDoc.Adjustments;
      } else if (mismoDoc.SalesAdjustments) {
        adjSection = mismoDoc.SalesAdjustments;
      }
      
      if (!adjSection) {
        return [];
      }
      
      // Process adjustments - this varies widely between MISMO implementations
      // so we use a more generic approach
      
      // For each key that looks like an adjustment
      Object.keys(adjSection).forEach(key => {
        const value = adjSection[key];
        
        // Skip non-adjustments
        if (typeof value !== 'object' || !value) return;
        
        // Try to find the comparable ID and adjustment amount
        let compId = null;
        if (value.ComparableID) {
          compId = value.ComparableID;
        } else if (value["@_comparableId"]) {
          compId = value["@_comparableId"];
        }
        
        // Skip if we can't associate with a comparable
        if (!compId) return;
        
        // Extract adjustment details
        let adjType = key;
        let amount = null;
        
        if (typeof value === 'object' && value.Amount) {
          amount = value.Amount;
        } else if (value.AdjustmentAmount) {
          amount = value.AdjustmentAmount;
        } else if (typeof value === 'string' || typeof value === 'number') {
          amount = value.toString();
        }
        
        if (amount !== null) {
          adjustments.push({
            comparableId: compId,
            adjustmentType: adjType,
            amount: amount.toString(),
            description: `${adjType} adjustment`
          });
        }
      });
      
      return adjustments;
    } catch (error) {
      console.error("Error extracting adjustments:", error);
      return [];
    }
  }
  
  /**
   * Extract property type from various MISMO formats
   */
  private extractPropertyType(property: any): string {
    if (!property) return "Unknown";
    
    if (property.PropertyType) {
      return property.PropertyType;
    } else if (property.PropertyCharacteristics?.PropertyType) {
      return property.PropertyCharacteristics.PropertyType;
    } else if (property.ConstructionType) {
      return property.ConstructionType;
    } else if (property["@_type"]) {
      return property["@_type"];
    }
    
    return "Single Family";
  }
}