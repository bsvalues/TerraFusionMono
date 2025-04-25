/**
 * Work File Parser
 * 
 * Parses proprietary appraisal software work files (*.zap, *.aci, *.apr, etc.)
 * and extracts standardized data entities.
 */

import { DataEntity, FileParser, ParsingResult, PropertyData, ReportData, ComparableData, AdjustmentData } from "./types";

/**
 * Parser for proprietary appraisal software work files
 */
export class WorkFileParser implements FileParser {
  name = "WorkFileParser";
  
  /**
   * Determines if this parser can handle the given content
   */
  canParse(content: string): boolean {
    // Check for common proprietary file signatures
    return (
      content.includes("ZAPFILE") || 
      content.includes("ACI-XML") || 
      content.includes("ACIFORM") || 
      content.includes("ALAMODE") || 
      content.includes("APPRAISAL") || 
      content.includes("FORMDATA")
    );
  }
  
  /**
   * Parse work file content and extract appraisal data
   */
  async parse(content: string): Promise<ParsingResult> {
    const entities: DataEntity[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Attempt to detect the format type
      const formatType = this.detectFormatType(content);
      
      if (formatType === "unknown") {
        warnings.push("Could not identify specific work file format. Using generic extraction.");
        this.extractGeneric(content, entities, warnings);
      } else {
        warnings.push(`Detected ${formatType} format. Extracting data.`);
        
        // Extract based on format type
        switch (formatType) {
          case "zap":
            this.extractZap(content, entities, warnings);
            break;
          case "aci":
            this.extractAci(content, entities, warnings);
            break;
          case "alamode":
            this.extractAlamode(content, entities, warnings);
            break;
          case "formxml":
            this.extractFormXml(content, entities, warnings);
            break;
          default:
            this.extractGeneric(content, entities, warnings);
            break;
        }
      }
      
      return {
        entities,
        length: entities.length,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(`Error parsing work file: ${error instanceof Error ? error.message : String(error)}`);
      return { entities, length: 0, errors };
    }
  }
  
  /**
   * Detect the specific format of the work file
   */
  private detectFormatType(content: string): string {
    if (content.includes("ZAPFILE") || content.includes("<ZAP>")) {
      return "zap";
    } else if (content.includes("ACI-XML") || content.includes("ACIFORM")) {
      return "aci";
    } else if (content.includes("ALAMODE") || content.includes("<ALAMODE>")) {
      return "alamode";
    } else if (content.includes("<FORMDATA>") || content.includes("<APPRAISAL>")) {
      return "formxml";
    } else {
      return "unknown";
    }
  }
  
  /**
   * Extract data from a.la mode work files
   */
  private extractAlamode(content: string, entities: DataEntity[], warnings: string[]): void {
    // For demonstration purposes, using the generic extraction
    // In a real implementation, this would have specialized parsing for a.la mode format
    this.extractGeneric(content, entities, warnings);
  }
  
  /**
   * Extract data from ACI work files
   */
  private extractAci(content: string, entities: DataEntity[], warnings: string[]): void {
    // For demonstration purposes, using the generic extraction
    // In a real implementation, this would have specialized parsing for ACI format
    this.extractGeneric(content, entities, warnings);
  }
  
  /**
   * Extract data from ZAP work files
   */
  private extractZap(content: string, entities: DataEntity[], warnings: string[]): void {
    // For demonstration purposes, using the generic extraction
    // In a real implementation, this would have specialized parsing for ZAP format
    this.extractGeneric(content, entities, warnings);
  }
  
  /**
   * Extract data from Form XML files
   */
  private extractFormXml(content: string, entities: DataEntity[], warnings: string[]): void {
    try {
      // Extract property data
      const propertyData = this.extractPropertyFromFormXml(content);
      if (propertyData) {
        entities.push({
          type: 'property',
          data: propertyData
        });
      } else {
        warnings.push("Could not extract property data from Form XML");
      }
      
      // Extract comparable data
      const comparables = this.extractComparablesFromFormXml(content);
      if (comparables.length > 0) {
        comparables.forEach(comp => {
          entities.push({
            type: 'comparable',
            data: comp
          });
        });
      } else {
        warnings.push("No comparable properties found in Form XML");
      }
      
      // Extract report data
      const reportData = this.extractReportFromFormXml(content);
      if (reportData) {
        entities.push({
          type: 'report',
          data: reportData
        });
      } else {
        warnings.push("Could not extract report data from Form XML");
      }
      
      // Extract adjustments
      const adjustments = this.extractAdjustmentsFromFormXml(content);
      if (adjustments.length > 0) {
        adjustments.forEach(adj => {
          entities.push({
            type: 'adjustment',
            data: adj
          });
        });
      }
    } catch (error) {
      warnings.push(`Error extracting data from Form XML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract property data from Form XML
   */
  private extractPropertyFromFormXml(content: string): PropertyData | null {
    // Extract property address
    const addressMatch = content.match(/<PropertyAddress>(.*?)<\/PropertyAddress>/s) ||
                        content.match(/<SubjectAddress>(.*?)<\/SubjectAddress>/s);
    
    if (!addressMatch) return null;
    
    // Extract various address components
    const streetMatch = content.match(/<Street>(.*?)<\/Street>/s) ||
                       content.match(/<StreetAddress>(.*?)<\/StreetAddress>/s);
    
    const cityMatch = content.match(/<City>(.*?)<\/City>/s);
    const stateMatch = content.match(/<State>(.*?)<\/State>/s);
    const zipMatch = content.match(/<ZipCode>(.*?)<\/ZipCode>/s) ||
                     content.match(/<PostalCode>(.*?)<\/PostalCode>/s);
    
    // Extract property characteristics
    const propertyTypeMatch = content.match(/<PropertyType>(.*?)<\/PropertyType>/s) ||
                             content.match(/<Type>(.*?)<\/Type>/s);
    
    const yearBuiltMatch = content.match(/<YearBuilt>(.*?)<\/YearBuilt>/s);
    const bedroomsMatch = content.match(/<Bedrooms>(.*?)<\/Bedrooms>/s) ||
                          content.match(/<TotalBedrooms>(.*?)<\/TotalBedrooms>/s);
    
    const bathroomsMatch = content.match(/<Bathrooms>(.*?)<\/Bathrooms>/s) ||
                           content.match(/<TotalBathrooms>(.*?)<\/TotalBathrooms>/s);
    
    const glaMatch = content.match(/<GLA>(.*?)<\/GLA>/s) ||
                     content.match(/<GrossLivingArea>(.*?)<\/GrossLivingArea>/s) ||
                     content.match(/<SquareFeet>(.*?)<\/SquareFeet>/s);
    
    // Construct property data
    return {
      address: streetMatch ? streetMatch[1].trim() : addressMatch[1].trim(),
      city: cityMatch ? cityMatch[1].trim() : "Unknown",
      state: stateMatch ? stateMatch[1].trim() : "Unknown",
      zipCode: zipMatch ? zipMatch[1].trim() : "Unknown",
      propertyType: propertyTypeMatch ? propertyTypeMatch[1].trim() : "Single Family",
      yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch[1]) : null,
      bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : null,
      bathrooms: bathroomsMatch ? parseFloat(bathroomsMatch[1]) : null,
      grossLivingArea: glaMatch ? parseInt(glaMatch[1].replace(/,/g, '')) : null
    };
  }
  
  /**
   * Extract comparable data from Form XML
   */
  private extractComparablesFromFormXml(content: string): ComparableData[] {
    const comparables: ComparableData[] = [];
    
    // Find comparable sections
    const compSections = content.match(/<Comparable[^>]*>(.*?)<\/Comparable>/sg) ||
                         content.match(/<Sale[^>]*>(.*?)<\/Sale>/sg);
    
    if (!compSections) return [];
    
    // Process each comparable
    compSections.forEach((section, index) => {
      // Extract address info
      const streetMatch = section.match(/<Street>(.*?)<\/Street>/s) ||
                         section.match(/<Address>(.*?)<\/Address>/s);
      
      if (!streetMatch) return; // Skip if no address
      
      const cityMatch = section.match(/<City>(.*?)<\/City>/s);
      const stateMatch = section.match(/<State>(.*?)<\/State>/s);
      const zipMatch = section.match(/<ZipCode>(.*?)<\/ZipCode>/s) ||
                       section.match(/<PostalCode>(.*?)<\/PostalCode>/s);
      
      // Extract sale info
      const salePriceMatch = section.match(/<SalePrice>(.*?)<\/SalePrice>/s) ||
                            section.match(/<Price>(.*?)<\/Price>/s);
      
      const saleDateMatch = section.match(/<SaleDate>(.*?)<\/SaleDate>/s) ||
                           section.match(/<DateOfSale>(.*?)<\/DateOfSale>/s);
      
      // Extract property characteristics
      const yearBuiltMatch = section.match(/<YearBuilt>(.*?)<\/YearBuilt>/s);
      const bedroomsMatch = section.match(/<Bedrooms>(.*?)<\/Bedrooms>/s);
      const bathroomsMatch = section.match(/<Bathrooms>(.*?)<\/Bathrooms>/s);
      const glaMatch = section.match(/<GLA>(.*?)<\/GLA>/s) ||
                       section.match(/<GrossLivingArea>(.*?)<\/GrossLivingArea>/s);
      
      // Add comparable to list
      comparables.push({
        address: streetMatch[1].trim(),
        city: cityMatch ? cityMatch[1].trim() : "Unknown",
        state: stateMatch ? stateMatch[1].trim() : "Unknown",
        zipCode: zipMatch ? zipMatch[1].trim() : "Unknown",
        compType: "Sale",
        propertyType: "Single Family",
        salePrice: salePriceMatch ? salePriceMatch[1].replace(/[$,]/g, '') : null,
        saleDate: saleDateMatch ? saleDateMatch[1] : null,
        bedrooms: bedroomsMatch ? bedroomsMatch[1] : null,
        bathrooms: bathroomsMatch ? bathroomsMatch[1] : null,
        grossLivingArea: glaMatch ? glaMatch[1].replace(/,/g, '') : null,
        yearBuilt: yearBuiltMatch ? yearBuiltMatch[1] : null
      });
    });
    
    return comparables;
  }
  
  /**
   * Extract report data from Form XML
   */
  private extractReportFromFormXml(content: string): ReportData | null {
    // Extract form type
    const formTypeMatch = content.match(/<FormType>(.*?)<\/FormType>/s) ||
                         content.match(/<Form>(.*?)<\/Form>/s) ||
                         content.match(/<ReportType>(.*?)<\/ReportType>/s);
    
    if (!formTypeMatch) return null;
    
    // Extract dates
    const effectiveDateMatch = content.match(/<EffectiveDate>(.*?)<\/EffectiveDate>/s) ||
                              content.match(/<DateOfValue>(.*?)<\/DateOfValue>/s);
    
    const reportDateMatch = content.match(/<ReportDate>(.*?)<\/ReportDate>/s) ||
                           content.match(/<DateOfReport>(.*?)<\/DateOfReport>/s);
    
    // Extract purpose
    const purposeMatch = content.match(/<Purpose>(.*?)<\/Purpose>/s) ||
                        content.match(/<AppraisalPurpose>(.*?)<\/AppraisalPurpose>/s);
    
    // Extract value
    const valueMatch = content.match(/<MarketValue>(.*?)<\/MarketValue>/s) ||
                      content.match(/<Value>(.*?)<\/Value>/s) ||
                      content.match(/<AppraisedValue>(.*?)<\/AppraisedValue>/s);
    
    return {
      reportType: "Work File",
      formType: formTypeMatch[1].trim(),
      status: "Completed",
      purpose: purposeMatch ? purposeMatch[1].trim() : null,
      effectiveDate: effectiveDateMatch ? new Date(effectiveDateMatch[1]) : null,
      reportDate: reportDateMatch ? new Date(reportDateMatch[1]) : null,
      marketValue: valueMatch ? valueMatch[1].replace(/[$,]/g, '') : null
    };
  }
  
  /**
   * Extract adjustment data from Form XML
   */
  private extractAdjustmentsFromFormXml(content: string): AdjustmentData[] {
    const adjustments: AdjustmentData[] = [];
    
    // Find adjustment sections
    const adjSections = content.match(/<Adjustments>(.*?)<\/Adjustments>/sg) ||
                        content.match(/<SalesAdjustments>(.*?)<\/SalesAdjustments>/sg);
    
    if (!adjSections) return [];
    
    // Process each adjustment section
    adjSections.forEach(section => {
      // Try to find the comparable ID
      const compIdMatch = section.match(/<ComparableId>(.*?)<\/ComparableId>/s) ||
                         section.match(/<CompId>(.*?)<\/CompId>/s);
      
      const compId = compIdMatch ? parseInt(compIdMatch[1]) : 1;
      
      // Extract individual adjustments
      const adjItems = section.match(/<Adjustment[^>]*>(.*?)<\/Adjustment>/sg);
      
      if (adjItems) {
        adjItems.forEach(adjItem => {
          // Extract adjustment details
          const typeMatch = adjItem.match(/<Type>(.*?)<\/Type>/s) ||
                           adjItem.match(/<Name>(.*?)<\/Name>/s) ||
                           adjItem.match(/<AdjustmentType>(.*?)<\/AdjustmentType>/s);
          
          const amountMatch = adjItem.match(/<Amount>(.*?)<\/Amount>/s) ||
                             adjItem.match(/<Value>(.*?)<\/Value>/s);
          
          const descMatch = adjItem.match(/<Description>(.*?)<\/Description>/s) ||
                           adjItem.match(/<Desc>(.*?)<\/Desc>/s);
          
          if (typeMatch && amountMatch) {
            adjustments.push({
              comparableId: compId,
              adjustmentType: typeMatch[1].trim(),
              amount: amountMatch[1].replace(/[$,]/g, ''),
              description: descMatch ? descMatch[1].trim() : null
            });
          }
        });
      } else {
        // Try alternative format
        const lineItems = section.split(/\n|\r/);
        
        lineItems.forEach(line => {
          const adjMatch = line.match(/([A-Za-z\s]+)\s*[:=]\s*([$-]?[\d,.]+)/);
          
          if (adjMatch) {
            adjustments.push({
              comparableId: compId,
              adjustmentType: adjMatch[1].trim(),
              amount: adjMatch[2].replace(/[$,]/g, ''),
              description: `${adjMatch[1].trim()} adjustment`
            });
          }
        });
      }
    });
    
    return adjustments;
  }
  
  /**
   * Extract data using generic pattern matching
   */
  private extractGeneric(content: string, entities: DataEntity[], warnings: string[]): void {
    try {
      // Look for common field patterns regardless of specific format
      
      // Property data
      const addressMatch = this.findFieldValue(content, ["PropertyAddress", "SubjectAddress", "Address", "SUBJECT_ADDRESS"]);
      const cityMatch = this.findFieldValue(content, ["City", "CITY", "PropertyCity"]);
      const stateMatch = this.findFieldValue(content, ["State", "STATE", "PropertyState"]);
      const zipMatch = this.findFieldValue(content, ["ZipCode", "Zip", "ZIP", "PostalCode"]);
      
      if (addressMatch) {
        // Extract other property data
        const propertyTypeMatch = this.findFieldValue(content, ["PropertyType", "Type", "PROPERTY_TYPE"]);
        const yearBuiltMatch = this.findFieldValue(content, ["YearBuilt", "YEAR_BUILT"]);
        const bedroomsMatch = this.findFieldValue(content, ["Bedrooms", "Beds", "BR"]);
        const bathroomsMatch = this.findFieldValue(content, ["Bathrooms", "Baths", "BA"]);
        const glaMatch = this.findFieldValue(content, ["GrossLivingArea", "GLA", "SqFt", "GROSS_AREA"]);
        
        // Create property entity
        const property: PropertyData = {
          address: addressMatch,
          city: cityMatch || "Unknown",
          state: stateMatch || "Unknown",
          zipCode: zipMatch || "Unknown",
          propertyType: propertyTypeMatch || "Single Family",
          yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch) : null,
          bedrooms: bedroomsMatch ? parseInt(bedroomsMatch) : null,
          bathrooms: bathroomsMatch ? parseFloat(bathroomsMatch) : null,
          grossLivingArea: glaMatch ? parseInt(glaMatch.replace(/,/g, '')) : null
        };
        
        entities.push({
          type: 'property',
          data: property
        });
        
        // Look for report data
        const formTypeMatch = this.findFieldValue(content, ["FormType", "Form", "ReportType", "FORM_TYPE"]);
        const purposeMatch = this.findFieldValue(content, ["Purpose", "AppraisalPurpose", "APPRAISAL_PURPOSE"]);
        const valueMatch = this.findFieldValue(content, ["MarketValue", "Value", "AppraisedValue", "MARKET_VALUE"]);
        
        if (formTypeMatch) {
          // Create report entity
          entities.push({
            type: 'report',
            data: {
              reportType: "Work File",
              formType: formTypeMatch,
              status: "Completed",
              purpose: purposeMatch || null,
              marketValue: valueMatch ? valueMatch.replace(/[$,]/g, '') : null
            } as ReportData
          });
        }
        
        // Look for comparables
        const compMatches = this.findComparables(content);
        
        if (compMatches.length > 0) {
          compMatches.forEach(comp => {
            entities.push({
              type: 'comparable',
              data: comp
            });
          });
        }
      } else {
        warnings.push("Could not find property address in work file");
      }
    } catch (error) {
      warnings.push(`Error in generic extraction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Find field value using multiple possible field names
   */
  private findFieldValue(content: string, fieldNames: string[]): string | null {
    for (const field of fieldNames) {
      // Try XML-style tag
      const xmlMatch = content.match(new RegExp(`<${field}>(.*?)</${field}>`, 's'));
      if (xmlMatch) return xmlMatch[1].trim();
      
      // Try name-value pair
      const nvpMatch = content.match(new RegExp(`${field}\\s*[:=]\\s*["']?(.*?)["']?(?:\\s|$|,)`, 's'));
      if (nvpMatch) return nvpMatch[1].trim();
      
      // Try field name followed by value
      const labelMatch = content.match(new RegExp(`${field}\\s+(.*?)(?:\\n|\\r|$)`, 's'));
      if (labelMatch) return labelMatch[1].trim();
    }
    
    return null;
  }
  
  /**
   * Find comparable properties in generic content
   */
  private findComparables(content: string): ComparableData[] {
    const comparables: ComparableData[] = [];
    
    // Try to identify comparable sections
    const compSections = content.match(/Comparable\s*\d+[\s\S]*?(?=Comparable\s*\d+|$)/gi) ||
                        content.match(/Comp\s*\d+[\s\S]*?(?=Comp\s*\d+|$)/gi) ||
                        content.match(/Sale\s*\d+[\s\S]*?(?=Sale\s*\d+|$)/gi);
    
    if (!compSections || compSections.length === 0) {
      return comparables;
    }
    
    // Process each comparable section
    compSections.forEach((section, index) => {
      const address = this.findFieldValue(section, ["Address", "CompAddress", "StreetAddress"]);
      
      if (!address) return; // Skip if no address
      
      const city = this.findFieldValue(section, ["City", "CompCity"]);
      const state = this.findFieldValue(section, ["State", "CompState"]);
      const zipCode = this.findFieldValue(section, ["ZipCode", "Zip", "PostalCode"]);
      const salePrice = this.findFieldValue(section, ["SalePrice", "Price", "Value"]);
      const saleDate = this.findFieldValue(section, ["SaleDate", "DateOfSale", "Date"]);
      
      comparables.push({
        address,
        city: city || "Unknown",
        state: state || "Unknown",
        zipCode: zipCode || "Unknown",
        compType: "Sale",
        propertyType: "Single Family",
        salePrice: salePrice ? salePrice.replace(/[$,]/g, '') : null,
        saleDate: saleDate || null,
        bedrooms: this.findFieldValue(section, ["Bedrooms", "Beds", "BR"]),
        bathrooms: this.findFieldValue(section, ["Bathrooms", "Baths", "BA"]),
        grossLivingArea: this.findFieldValue(section, ["GrossLivingArea", "GLA", "SqFt"]),
        yearBuilt: this.findFieldValue(section, ["YearBuilt", "Year"])
      });
    });
    
    return comparables;
  }
}