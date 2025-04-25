import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { storage } from "../storage";
import { analyzeProperty } from "./openai";
import { aiOrchestrator } from "./ai-orchestrator";
import { AIProvider } from "./ai-orchestrator";

// Types for email processing
export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface OrderEmail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  htmlBody?: string;
  receivedDate: Date;
  attachments: EmailAttachment[];
}

export interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
}

export interface LenderInfo {
  name: string;
  address: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface OrderDetails {
  orderNumber: string;
  orderDate: Date;
  dueDate: Date;
  feeAmount?: number;
  reportType: string;
  propertyType: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  borrowerName?: string;
  occupancyStatus?: string;
  loanType?: string;
  specialInstructions?: string;
}

// Extract property data from email and attachments
async function extractPropertyDataFromEmail(email: OrderEmail): Promise<{
  clientInfo: ClientInfo;
  lenderInfo: LenderInfo;
  orderDetails: OrderDetails;
}> {
  try {
    console.log(`Processing email order with subject: ${email.subject}`);
    
    // Use AI orchestrator to extract data from the email content
    const extractedData = await aiOrchestrator.processEmailOrder(
      email.body,
      email.subject,
      email.from
    );
    
    // Extract address from extracted data or fallback to regex extraction from subject
    let address = extractedData.propertyAddress || "";
    
    if (!address) {
      // Fallback to regex if AI extraction didn't find an address
      const addressMatch = email.subject.match(/(\d+\s+[\w\s]+(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Place|Court|Circle))/i);
      address = addressMatch ? addressMatch[1] : "123 Main St";
    }
    
    // Map the extracted data to our interfaces
    return {
      clientInfo: {
        name: extractedData.clientName || "Unknown Client",
        company: extractedData.clientCompany || "Unknown Company",
        email: extractedData.clientEmail || "unknown@example.com",
        phone: extractedData.clientPhone || "Unknown",
        address: extractedData.clientAddress
      },
      lenderInfo: {
        name: extractedData.lenderName || "Unknown Lender",
        address: extractedData.lenderAddress || "Unknown Address",
        contactPerson: extractedData.lenderContactPerson,
        contactEmail: extractedData.lenderContactEmail,
        contactPhone: extractedData.lenderContactPhone
      },
      orderDetails: {
        orderNumber: extractedData.orderNumber || `ORD-${Date.now()}`,
        orderDate: extractedData.orderDate ? new Date(extractedData.orderDate) : new Date(),
        dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        feeAmount: extractedData.feeAmount,
        reportType: extractedData.reportType || "URAR",
        propertyType: extractedData.propertyType || "Single Family",
        propertyAddress: address,
        propertyCity: extractedData.city || "Unknown City",
        propertyState: extractedData.state || "CA",
        propertyZip: extractedData.zipCode || "00000",
        borrowerName: extractedData.borrowerName,
        occupancyStatus: extractedData.occupancyStatus,
        loanType: extractedData.loanType,
        specialInstructions: extractedData.specialInstructions
      }
    };
  } catch (error) {
    console.error("Error extracting data from email:", error);
    
    // Return default values if extraction fails
    return {
      clientInfo: {
        name: "Unknown Client",
        company: "Unknown Company",
        email: "unknown@example.com",
        phone: "Unknown"
      },
      lenderInfo: {
        name: "Unknown Lender",
        address: "Unknown Address"
      },
      orderDetails: {
        orderNumber: `ORD-${Date.now()}`,
        orderDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reportType: "URAR",
        propertyType: "Single Family",
        propertyAddress: "123 Unknown St",
        propertyCity: "Unknown City",
        propertyState: "CA",
        propertyZip: "00000"
      }
    };
  }
}

// Process an incoming order email
export async function processOrderEmail(email: OrderEmail, userId: number): Promise<number | null> {
  try {
    // Extract data from email and attachments
    const { clientInfo, lenderInfo, orderDetails } = await extractPropertyDataFromEmail(email);
    
    // Create property record
    const propertyData = {
      address: orderDetails.propertyAddress,
      city: orderDetails.propertyCity,
      state: orderDetails.propertyState,
      zipCode: orderDetails.propertyZip,
      propertyType: orderDetails.propertyType,
      // Default values for required fields that might not be in the email
      yearBuilt: 0, // Will be updated by public data
      grossLivingArea: '0', // Will be updated by public data (stored as string in DB)
      bedrooms: '0', // Will be updated by public data (stored as string in DB)
      bathrooms: '0', // Will be updated by public data (stored as string in DB)
    };
    
    const property = await storage.createProperty({
      ...propertyData,
      userId
    });
    
    // Create appraisal report
    const report = await storage.createAppraisalReport({
      propertyId: property.id,
      userId,
      reportType: orderDetails.reportType,
      formType: "URAR", // Default to URAR
      status: "in_progress",
      purpose: "Purchase", // Default, can be updated
      effectiveDate: new Date(),
      reportDate: new Date(),
      clientName: clientInfo.name,
      clientAddress: clientInfo.address || "",
      lenderName: lenderInfo.name,
      lenderAddress: lenderInfo.address,
      borrowerName: orderDetails.borrowerName || "",
      occupancy: orderDetails.occupancyStatus || "Unknown",
      salesPrice: null,
      marketValue: null
    });
    
    // Trigger public data retrieval
    initiateDataRetrieval(propertyData, report.id);
    
    return report.id;
  } catch (error) {
    console.error("Error processing order email:", error);
    return null;
  }
}

// Start the public data retrieval process
export async function initiateDataRetrieval(propertyData: any, reportId: number): Promise<void> {
  try {
    // Log the start of the process
    console.log(`Starting public data retrieval for property at ${propertyData.address}, ${propertyData.city}, ${propertyData.state}`);
    
    // This will be an asynchronous process, potentially using a job queue in production
    setTimeout(async () => {
      await retrievePublicData(propertyData, reportId);
    }, 100);
  } catch (error) {
    console.error("Error initiating data retrieval:", error);
  }
}

// Retrieve public data from various sources
export async function retrievePublicData(propertyData: any, reportId: number): Promise<void> {
  try {
    // In a production environment, this would connect to real public data APIs
    // For now, we'll log the intent and use AI to generate realistic data
    
    console.log(`Retrieving public data for ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`);
    
    // Get the current report and property data
    const report = await storage.getAppraisalReport(reportId);
    const property = report ? await storage.getProperty(report.propertyId) : null;
    
    if (!report || !property) {
      console.error("Could not find report or property for data retrieval");
      return;
    }
    
    // Use the AI to generate property data based on the address
    const enhancedData = await retrievePropertyPublicData(propertyData);
    
    console.log(`Retrieved property data with yearBuilt: ${enhancedData.yearBuilt}, sqft: ${enhancedData.grossLivingArea}`);
    
    // Create an update object with the enhanced data
    const propertyUpdate: any = {
      yearBuilt: enhancedData.yearBuilt,
      grossLivingArea: String(enhancedData.grossLivingArea),
      bedrooms: String(enhancedData.bedrooms),
      bathrooms: String(enhancedData.bathrooms)
    };
    
    // Add optional fields if they exist
    if (enhancedData.lotSize) {
      propertyUpdate.lotSize = String(enhancedData.lotSize);
    }
    
    if (enhancedData.propertyType) {
      propertyUpdate.propertyType = enhancedData.propertyType;
    }
    
    if (enhancedData.condition) {
      propertyUpdate.condition = enhancedData.condition;
    }
    
    if (enhancedData.constructionQuality) {
      propertyUpdate.constructionQuality = enhancedData.constructionQuality;
    }
    
    if (enhancedData.garageSize) {
      propertyUpdate.garageSize = String(enhancedData.garageSize);
    }
    
    if (enhancedData.floodZone) {
      propertyUpdate.floodZone = enhancedData.floodZone;
    }
    
    if (enhancedData.zoning) {
      propertyUpdate.zoning = enhancedData.zoning;
    }
    
    // Update the property with all the enhanced data
    await storage.updateProperty(property.id, propertyUpdate);
    
    // If we have additional features, we could store them in a separate table
    if (enhancedData.additionalFeatures && enhancedData.additionalFeatures.length > 0) {
      console.log(`Property has ${enhancedData.additionalFeatures.length} additional features`);
      // In a real implementation, we would store these in a related features table
    }
    
    // If we have tax assessment or last sale information, update the report
    const reportUpdate: any = {};
    
    if (enhancedData.taxAssessment) {
      reportUpdate.assessedValue = enhancedData.taxAssessment;
      console.log(`Updated tax assessment value: ${enhancedData.taxAssessment}`);
    }
    
    if (enhancedData.lastSalePrice) {
      reportUpdate.priorSalePrice = enhancedData.lastSalePrice;
      console.log(`Updated prior sale price: ${enhancedData.lastSalePrice}`);
    }
    
    if (enhancedData.lastSaleDate) {
      reportUpdate.priorSaleDate = new Date(enhancedData.lastSaleDate);
      console.log(`Updated prior sale date: ${enhancedData.lastSaleDate}`);
    }
    
    // If we have report updates, apply them
    if (Object.keys(reportUpdate).length > 0) {
      await storage.updateAppraisalReport(report.id, reportUpdate);
    }
    
    console.log(`Completed enhanced public data retrieval for report #${reportId}`);
  } catch (error) {
    console.error("Error retrieving public data:", error);
  }
}

// Generate property data based on address using AI
// In production, this would connect to real property data APIs
async function retrievePropertyPublicData(propertyData: any): Promise<{
  yearBuilt: number;
  grossLivingArea: number;
  bedrooms: number;
  bathrooms: number;
  lotSize?: number;
  garageSize?: number;
  propertyType?: string;
  constructionQuality?: string;
  condition?: string;
  additionalFeatures?: string[];
  taxAssessment?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  floodZone?: string;
  zoning?: string;
}> {
  try {
    // Get the location from the property data
    const location = {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode
    };
    
    console.log(`Retrieving public data for ${location.address}, ${location.city}, ${location.state}`);
    
    // First try using the AI orchestrator to analyze the property with parallel requests
    // for better performance and more comprehensive data
    try {
      // Create promises for parallel execution
      const marketAnalysisPromise = aiOrchestrator.generateMarketAnalysis(
        `${location.city}, ${location.state}`,
        propertyData.propertyType || "Single Family",
        AIProvider.AUTO // Let the system decide the best AI for this task
      );
      
      const valuationPromise = aiOrchestrator.automatedValuation(
        {
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          propertyType: propertyData.propertyType || "Single Family"
        },
        undefined,
        AIProvider.AUTO
      );
      
      // Execute both in parallel for better performance
      const [marketAnalysis, valuationData] = await Promise.all([
        marketAnalysisPromise, 
        valuationPromise
      ]);
      
      // Extract property details from the valuation data with improved parsing
      const propertyDetails = {
        yearBuilt: parseInt(valuationData.yearBuilt) || undefined,
        grossLivingArea: parseInt(valuationData.squareFeet || valuationData.grossLivingArea) || undefined,
        bedrooms: parseInt(valuationData.bedrooms) || undefined,
        bathrooms: parseFloat(valuationData.bathrooms) || undefined,
        lotSize: parseFloat(valuationData.lotSize) || undefined,
        garageSize: parseInt(valuationData.garageSize) || undefined,
        propertyType: valuationData.propertyType || propertyData.propertyType || "Single Family",
        constructionQuality: valuationData.constructionQuality || undefined,
        condition: valuationData.condition || undefined,
        additionalFeatures: valuationData.features || [],
        taxAssessment: parseInt(valuationData.taxAssessment) || undefined,
        lastSaleDate: valuationData.lastSaleDate || undefined,
        lastSalePrice: parseInt(valuationData.lastSalePrice) || undefined,
        floodZone: valuationData.floodZone || undefined,
        zoning: valuationData.zoning || undefined
      };
      
      // Validate the data and set reasonable defaults for critical fields if missing
      return {
        yearBuilt: propertyDetails.yearBuilt || calculateEstimatedYearBuilt(location.city, location.state),
        grossLivingArea: propertyDetails.grossLivingArea || estimateSquareFootage(propertyData.propertyType),
        bedrooms: propertyDetails.bedrooms || 3,
        bathrooms: propertyDetails.bathrooms || 2,
        lotSize: propertyDetails.lotSize,
        garageSize: propertyDetails.garageSize,
        propertyType: propertyDetails.propertyType,
        constructionQuality: propertyDetails.constructionQuality,
        condition: propertyDetails.condition,
        additionalFeatures: propertyDetails.additionalFeatures,
        taxAssessment: propertyDetails.taxAssessment,
        lastSaleDate: propertyDetails.lastSaleDate,
        lastSalePrice: propertyDetails.lastSalePrice,
        floodZone: propertyDetails.floodZone,
        zoning: propertyDetails.zoning
      };
    } catch (aiOrchestratorError) {
      console.error("Error using AI orchestrator for property data:", aiOrchestratorError);
      
      // Fallback to using OpenAI directly with enhanced prompt
      console.log("Falling back to direct OpenAI analysis");
      
      // Analyze the property using OpenAI with a more detailed prompt
      const analysis = await analyzeProperty({
        propertyType: propertyData.propertyType || "Single Family",
        location: location,
        requestType: "detailed_property_data"
      });
      
      // Enhanced pattern matching for more robust extraction
      const yearBuiltMatch = analysis.valuationInsights.match(/(?:built|constructed|year built:?|construction year:?)\s+(?:in\s+)?(\d{4})/i);
      const yearBuilt = yearBuiltMatch ? parseInt(yearBuiltMatch[1]) : calculateEstimatedYearBuilt(location.city, location.state);
      
      const sqftMatch = analysis.valuationInsights.match(/(\d{3,5})\s+(?:sq\.?\s*ft\.?|square\s+feet|sqft)/i);
      const grossLivingArea = sqftMatch ? parseInt(sqftMatch[1]) : estimateSquareFootage(propertyData.propertyType);
      
      const bedroomsMatch = analysis.valuationInsights.match(/(\d+)\s+(?:bed|bedroom|br)/i);
      const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : 3;
      
      const bathroomsMatch = analysis.valuationInsights.match(/(\d+(?:\.\d+)?)\s+(?:bath|bathroom|ba)/i);
      const bathrooms = bathroomsMatch ? parseFloat(bathroomsMatch[1]) : 2;
      
      // Additional patterns for extracting more details
      const lotSizeMatch = analysis.valuationInsights.match(/(?:lot size|lot area|land area)(?:\s+is)?(?:\s+approximately)?\s+(\d+(?:\.\d+)?)\s+(?:acre|acres|sq\.?\s*ft\.?|square\s+feet)/i);
      const lotSize = lotSizeMatch ? parseFloat(lotSizeMatch[1]) : undefined;
      
      // Extract property details from the analysis if available
      let propertyDetails = {};
      if (analysis.propertyDetails) {
        // Add only the properties that exist in the propertyDetails object
        if (analysis.propertyDetails.lotSize) {
          propertyDetails = { ...propertyDetails, lotSize: analysis.propertyDetails.lotSize };
        }
        if ('squareFeet' in analysis.propertyDetails) {
          propertyDetails = { ...propertyDetails, garageSize: analysis.propertyDetails.squareFeet };
        }
        if (analysis.propertyDetails.propertyType) {
          propertyDetails = { ...propertyDetails, propertyType: analysis.propertyDetails.propertyType };
        }
        if (analysis.propertyDetails.qualityRating) {
          propertyDetails = { ...propertyDetails, constructionQuality: analysis.propertyDetails.qualityRating };
        }
        if (analysis.propertyDetails.condition) {
          propertyDetails = { ...propertyDetails, condition: analysis.propertyDetails.condition };
        }
        if (analysis.propertyDetails.features) {
          propertyDetails = { ...propertyDetails, additionalFeatures: analysis.propertyDetails.features };
        }
      }
      
      return {
        yearBuilt,
        grossLivingArea,
        bedrooms,
        bathrooms,
        lotSize,
        ...propertyDetails
      };
    }
  } catch (error) {
    console.error("Error retrieving property public data:", error);
    
    // Return sensible values if all methods fail
    return {
      yearBuilt: calculateEstimatedYearBuilt(propertyData.city, propertyData.state),
      grossLivingArea: estimateSquareFootage(propertyData.propertyType),
      bedrooms: 3,
      bathrooms: 2
    };
  }
}

// Helper function to estimate year built based on location
function calculateEstimatedYearBuilt(city: string, state: string): number {
  // In a real implementation, this would use actual data about median home age by location
  // For now, use a sensible approach based on general U.S. housing stock data
  
  // Default to 1985 (median U.S. home age is around 37 years)
  let estimatedYear = 1985;
  
  // Adjust based on region if we can determine it
  if (state) {
    const northeast = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'];
    const midwest = ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'];
    const south = ['DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA', 'OK', 'TX'];
    const west = ['MT', 'ID', 'WY', 'CO', 'NM', 'AZ', 'UT', 'NV', 'CA', 'OR', 'WA', 'AK', 'HI'];
    
    if (northeast.includes(state)) {
      estimatedYear = 1965; // Northeast has older housing stock
    } else if (midwest.includes(state)) {
      estimatedYear = 1975;
    } else if (south.includes(state)) {
      estimatedYear = 1995; // South has newer housing stock
    } else if (west.includes(state)) {
      estimatedYear = 1990;
    }
  }
  
  // Further adjust based on major city names if present
  if (city) {
    const cityLower = city.toLowerCase();
    
    // Older cities
    if (['boston', 'new york', 'philadelphia', 'baltimore', 'chicago', 'detroit', 'san francisco'].some(c => cityLower.includes(c))) {
      estimatedYear -= 20; // Much older housing stock
    }
    
    // Newer cities/suburbs
    if (['las vegas', 'phoenix', 'austin', 'orlando', 'tampa', 'houston', 'dallas', 'denver'].some(c => cityLower.includes(c))) {
      estimatedYear += 15; // Newer housing stock
    }
  }
  
  return estimatedYear;
}

// Helper function to estimate square footage based on property type
function estimateSquareFootage(propertyType: string = 'Single Family'): number {
  // In a real implementation, this would use actual data about median square footage by property type and location
  const propertyTypeLower = propertyType?.toLowerCase() || 'single family';
  
  if (propertyTypeLower.includes('condo') || propertyTypeLower.includes('apartment')) {
    return 1100;
  } else if (propertyTypeLower.includes('townhouse') || propertyTypeLower.includes('townhome')) {
    return 1600;
  } else if (propertyTypeLower.includes('duplex') || propertyTypeLower.includes('multi')) {
    return 2200;
  } else if (propertyTypeLower.includes('luxury') || propertyTypeLower.includes('executive')) {
    return 3800;
  } else {
    // Standard single family
    return 2000;
  }
}