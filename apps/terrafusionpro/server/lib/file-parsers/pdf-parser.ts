/**
 * PDF Parser
 * 
 * Parses PDF format appraisal reports and extracts relevant data.
 * This parser uses pdfjs-dist for PDF parsing and extraction.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { DataEntity, FileParser, ParsingResult, PropertyData, ReportData, ComparableData, AdjustmentData } from "./types";

/**
 * Parser for PDF appraisal reports
 */
export class PDFParser implements FileParser {
  name = "PDFParser";
  
  /**
   * Determines if this parser can handle the given content
   */
  canParse(content: string): boolean {
    // Check for PDF file signature
    return content.startsWith("%PDF-");
  }
  
  /**
   * Parse PDF document and extract appraisal data
   */
  async parse(content: string): Promise<ParsingResult> {
    const entities: DataEntity[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Convert string content to ArrayBuffer for pdfjs
      const contentBuffer = new Uint8Array(content.split('').map(c => c.charCodeAt(0)));
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: contentBuffer });
      const pdfDocument = await loadingTask.promise;
      
      // Extract text content from all pages
      let fullText = '';
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }
      
      // Extract data based on the PDF content
      this.extractDataFromText(fullText, entities, warnings);
      
      return {
        entities,
        length: entities.length,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(`Error parsing PDF: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        entities, 
        length: 0, 
        errors 
      };
    }
  }
  
  /**
   * Extract structured data from the PDF text content
   */
  private extractDataFromText(text: string, entities: DataEntity[], warnings: string[]): void {
    try {
      // Extract property data
      const propertyData = this.extractPropertyData(text);
      if (propertyData) {
        entities.push({
          type: 'property',
          data: propertyData
        });
      } else {
        warnings.push("Could not extract property data from PDF");
      }
      
      // Extract comparables
      const comparables = this.extractComparables(text);
      comparables.forEach(comp => {
        entities.push({
          type: 'comparable',
          data: comp
        });
      });
      
      if (comparables.length === 0) {
        warnings.push("No comparable properties found in PDF");
      }
      
      // Extract report data
      const reportData = this.extractReportData(text);
      if (reportData) {
        entities.push({
          type: 'report',
          data: reportData
        });
      } else {
        warnings.push("Could not extract report data from PDF");
      }
      
      // Extract adjustments
      const adjustments = this.extractAdjustments(text);
      adjustments.forEach(adj => {
        entities.push({
          type: 'adjustment',
          data: adj
        });
      });
    } catch (error) {
      warnings.push(`Error extracting data from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract property data from text content
   */
  private extractPropertyData(text: string): PropertyData | null {
    // Extract property address
    const addressMatch = text.match(/Property Address\s*[:\.]\s*([^\n\r]+)/i) ||
                        text.match(/Subject Address\s*[:\.]\s*([^\n\r]+)/i) ||
                        text.match(/Address\s*[:\.]\s*([^\n\r]+)/i);
    
    const cityMatch = text.match(/City\s*[:\.]\s*([^\n\r]+)/i);
    const stateMatch = text.match(/State\s*[:\.]\s*([^\n\r]+)/i) ||
                        text.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
    
    const zipMatch = text.match(/Zip\s*[:\.]\s*(\d{5}(?:-\d{4})?)/i) ||
                     text.match(/\b\d{5}(?:-\d{4})?\b/);
    
    // If we couldn't extract essential address info, return null
    if (!addressMatch) {
      return null;
    }
    
    // Extract other property characteristics
    const bedroomsMatch = text.match(/Bedrooms\s*[:\.]\s*(\d+)/i) ||
                          text.match(/Total Bedrooms\s*[:\.]\s*(\d+)/i) ||
                          text.match(/No\. of Bedrooms\s*[:\.]\s*(\d+)/i);
    
    const bathroomsMatch = text.match(/Bathrooms\s*[:\.]\s*(\d+(?:\.\d+)?)/i) ||
                           text.match(/Total Bathrooms\s*[:\.]\s*(\d+(?:\.\d+)?)/i) ||
                           text.match(/No\. of Bathrooms\s*[:\.]\s*(\d+(?:\.\d+)?)/i);
    
    const grossLivingAreaMatch = text.match(/Gross Living Area\s*[:\.]\s*([\d,]+)/i) ||
                                text.match(/GLA\s*[:\.]\s*([\d,]+)/i) ||
                                text.match(/Square Feet\s*[:\.]\s*([\d,]+)/i);
    
    // Extract year built
    const yearBuiltMatch = text.match(/Year Built\s*[:\.]\s*(\d{4})/i) ||
                           text.match(/Built in\s*[:\.]\s*(\d{4})/i);
    
    // Extract property type
    const propertyTypeMatch = text.match(/Property Type\s*[:\.]\s*([^\n\r]+)/i) ||
                             text.match(/Type\s*[:\.]\s*([^\n\r]+)/i);
    
    // Construct property data object
    return {
      address: addressMatch[1].trim(),
      city: cityMatch ? cityMatch[1].trim() : "Unknown",
      state: stateMatch ? stateMatch[1].trim() : "Unknown",
      zipCode: zipMatch ? zipMatch[1].trim() : "Unknown",
      propertyType: propertyTypeMatch ? propertyTypeMatch[1].trim() : "Single Family",
      bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : null,
      bathrooms: bathroomsMatch ? parseFloat(bathroomsMatch[1]) : null,
      grossLivingArea: grossLivingAreaMatch ? 
        parseInt(grossLivingAreaMatch[1].replace(/,/g, '')) : null,
      yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch[1]) : null
    };
  }
  
  /**
   * Extract comparable properties from PDF content
   */
  private extractComparables(text: string): ComparableData[] {
    const comparables: ComparableData[] = [];
    
    // Look for comparable section indicators
    const comparableTexts = this.extractComparableSections(text);
    
    // Process each comparable section
    comparableTexts.forEach((compText, index) => {
      const addressMatch = compText.match(/Address\s*[:\.]\s*([^\n\r]+)/i) ||
                          compText.match(/Comp\s*\d+\s*Address\s*[:\.]\s*([^\n\r]+)/i);
      
      if (!addressMatch) return; // Skip if no address found
      
      // Extract city, state, zip
      const cityMatch = compText.match(/City\s*[:\.]\s*([^\n\r]+)/i);
      const stateMatch = compText.match(/State\s*[:\.]\s*([^\n\r]+)/i) ||
                        compText.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
      
      const zipMatch = compText.match(/Zip\s*[:\.]\s*(\d{5}(?:-\d{4})?)/i) ||
                      compText.match(/\b\d{5}(?:-\d{4})?\b/);
      
      // Extract sale information
      const salePriceMatch = compText.match(/Sale Price\s*[:\.]\s*\$?([\d,]+)/i) ||
                            compText.match(/Price\s*[:\.]\s*\$?([\d,]+)/i);
      
      const saleDateMatch = compText.match(/Sale Date\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                           compText.match(/Date of Sale\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      
      // Extract property characteristics
      const bedroomsMatch = compText.match(/Bedrooms\s*[:\.]\s*(\d+)/i) ||
                            compText.match(/Total Bedrooms\s*[:\.]\s*(\d+)/i);
      
      const bathroomsMatch = compText.match(/Bathrooms\s*[:\.]\s*(\d+(?:\.\d+)?)/i) ||
                            compText.match(/Total Bathrooms\s*[:\.]\s*(\d+(?:\.\d+)?)/i);
      
      const grossLivingAreaMatch = compText.match(/Gross Living Area\s*[:\.]\s*([\d,]+)/i) ||
                                  compText.match(/GLA\s*[:\.]\s*([\d,]+)/i) ||
                                  compText.match(/Square Feet\s*[:\.]\s*([\d,]+)/i);
      
      // Construct comparable object
      comparables.push({
        address: addressMatch[1].trim(),
        city: cityMatch ? cityMatch[1].trim() : "Unknown",
        state: stateMatch ? stateMatch[1].trim() : "Unknown",
        zipCode: zipMatch ? zipMatch[1].trim() : "Unknown",
        compType: "Sale",
        propertyType: "Single Family",
        salePrice: salePriceMatch ? salePriceMatch[1].replace(/,/g, '') : null,
        saleDate: saleDateMatch ? saleDateMatch[1] : null,
        bedrooms: bedroomsMatch ? bedroomsMatch[1] : null,
        bathrooms: bathroomsMatch ? bathroomsMatch[1] : null,
        grossLivingArea: grossLivingAreaMatch ? grossLivingAreaMatch[1].replace(/,/g, '') : null
      });
    });
    
    return comparables;
  }
  
  /**
   * Extract report data from PDF content
   */
  private extractReportData(text: string): ReportData | null {
    // Extract form type
    const formTypeMatch = text.match(/Form\s*[:\.]\s*([^\n\r]+)/i) ||
                         text.match(/Appraisal Form\s*[:\.]\s*([^\n\r]+)/i) ||
                         text.match(/\b(URAR|Uniform Residential Appraisal Report|1004|1073|2055|1025)\b/i);
    
    // Extract purpose
    const purposeMatch = text.match(/Purpose of the Appraisal\s*[:\.]\s*([^\n\r]+)/i) ||
                        text.match(/Purpose\s*[:\.]\s*([^\n\r]+)/i);
    
    // Extract effective date
    const effectiveDateMatch = text.match(/Effective Date\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                              text.match(/Date of Value\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    
    // Extract report date
    const reportDateMatch = text.match(/Report Date\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                           text.match(/Date of Report\s*[:\.]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    
    // Extract market value
    const valueMatch = text.match(/Market Value\s*[:\.]\s*\$?([\d,]+)/i) ||
                      text.match(/Appraised Value\s*[:\.]\s*\$?([\d,]+)/i) ||
                      text.match(/Value\s*[:\.]\s*\$?([\d,]+)/i);
    
    // If we couldn't extract essential information, return null
    if (!formTypeMatch) {
      return null;
    }
    
    // Construct report data object
    return {
      reportType: "PDF",
      formType: formTypeMatch[1].trim(),
      status: "Completed",
      purpose: purposeMatch ? purposeMatch[1].trim() : null,
      effectiveDate: effectiveDateMatch ? new Date(effectiveDateMatch[1]) : null,
      reportDate: reportDateMatch ? new Date(reportDateMatch[1]) : null,
      marketValue: valueMatch ? valueMatch[1].replace(/,/g, '') : null
    };
  }
  
  /**
   * Extract adjustment data from PDF content
   */
  private extractAdjustments(text: string): AdjustmentData[] {
    const adjustments: AdjustmentData[] = [];
    
    // Look for adjustment sections in the text
    const adjustmentSections = this.extractAdjustmentSections(text);
    
    // Process each adjustment section
    let compId = 1; // Default comparable ID
    
    adjustmentSections.forEach(section => {
      // Extract adjustment types and amounts
      const lines = section.split(/\n|\r/);
      
      lines.forEach(line => {
        // Match common adjustment patterns
        const adjustmentMatch = line.match(/([A-Za-z\s]+)\s*[-:]\s*\$?([\d,]+)/);
        
        if (adjustmentMatch) {
          const adjustmentType = adjustmentMatch[1].trim();
          const amount = adjustmentMatch[2].replace(/,/g, '');
          
          adjustments.push({
            comparableId: compId,
            adjustmentType,
            amount,
            description: `${adjustmentType} adjustment`
          });
        }
      });
      
      compId++; // Move to next comparable
    });
    
    return adjustments;
  }
  
  /**
   * Extract the text sections containing comparable property data
   */
  private extractComparableSections(text: string): string[] {
    const sections: string[] = [];
    
    // Look for common comparable section patterns
    const comparableSectionMatches = text.match(/Comparable\s*Sale\s*\#\s*\d+[\s\S]*?(?=Comparable\s*Sale\s*\#\s*\d+|$)/gi);
    
    if (comparableSectionMatches) {
      return comparableSectionMatches;
    }
    
    // Try alternative pattern
    const altMatches = text.match(/Comp\s*\d+[\s\S]*?(?=Comp\s*\d+|$)/gi);
    
    if (altMatches) {
      return altMatches;
    }
    
    // Try to find comparable table
    const tableMatch = text.match(/COMPARABLE SALE \# 1[\s\S]*?COMPARABLE SALE \# 6|$/i);
    
    if (tableMatch) {
      // Split the table into separate comparable sections
      const tableText = tableMatch[0];
      const compMatches = tableText.match(/COMPARABLE SALE \# \d[\s\S]*?(?=COMPARABLE SALE \# \d|$)/gi);
      
      if (compMatches) {
        return compMatches;
      }
    }
    
    return sections;
  }
  
  /**
   * Extract the text sections containing adjustment data
   */
  private extractAdjustmentSections(text: string): string[] {
    const sections: string[] = [];
    
    // Look for common adjustment section patterns
    const sectionMatches = text.match(/Adjustments[\s\S]*?(?=Summary|Reconciliation|Analysis|$)/i);
    
    if (sectionMatches) {
      sections.push(sectionMatches[0]);
    }
    
    // Look for adjustment tables
    const tableMatches = text.match(/\+\s*\$?[\d,]+\s*[A-Za-z\s]+\s*[-]\s*\$?[\d,]+/g);
    
    if (tableMatches) {
      sections.push(tableMatches.join('\n'));
    }
    
    return sections;
  }
}