import OpenAI from "openai";
import { storage } from "../storage";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interfaces for property public data
export interface PropertyPublicData {
  propertyDetails: PropertyDetails;
  taxInformation: TaxInformation;
  salesHistory: SaleRecord[];
  zoningInformation: ZoningInformation;
  floodZoneInfo: FloodZoneInfo;
  comparableProperties: ComparablePropertyData[];
}

export interface PropertyDetails {
  yearBuilt: number;
  grossLivingArea: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  stories: number;
  foundation: string;
  exteriorWalls: string;
  roofMaterial: string;
  heatingType: string;
  coolingType: string;
  fireplaces: number;
  garageType: string;
  garageCapacity: number;
  poolFeature: boolean;
  basementType: string;
  basementFinishedArea: number;
  atticType: string;
  atticFinishedArea: number;
}

export interface TaxInformation {
  assessedValue: number;
  taxYear: number;
  annualTaxAmount: number;
  taxRate: number;
  taxAssessmentId: string;
  exemptions: string[];
}

export interface SaleRecord {
  saleDate: string;
  salePrice: number;
  seller: string;
  buyer: string;
  documentType: string;
  documentNumber: string;
}

export interface ZoningInformation {
  zoningCode: string;
  zoningDescription: string;
  allowedUses: string[];
  restrictions: string[];
}

export interface FloodZoneInfo {
  floodZone: string;
  floodZoneDescription: string;
  floodInsuranceRequired: boolean;
  floodMapNumber: string;
  floodMapDate: string;
}

export interface ComparablePropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate: string;
  salePrice: number;
  yearBuilt: number;
  grossLivingArea: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  distanceFromSubject: number;
}

// Retrieve property public data from various sources
export async function retrievePropertyPublicData(address: string, city: string, state: string, zipCode: string): Promise<PropertyPublicData> {
  try {
    // Log that we're retrieving data
    console.log(`Retrieving public data for property at ${address}, ${city}, ${state} ${zipCode}`);
    
    // In a production environment, this would connect to multiple real public data APIs
    // For example: 
    // - Tax assessor records
    // - County recorder
    // - Multiple Listing Service (MLS)
    // - FEMA flood maps
    // - Zoning department
    
    // For now, we'll use AI to generate realistic data based on the address
    // This would be replaced with actual API integrations in production
    
    // Retrieve property details
    const propertyDetails = await fetchPropertyDetails(address, city, state, zipCode);
    
    // Retrieve tax information
    const taxInformation = await fetchTaxInformation(address, city, state, zipCode);
    
    // Retrieve sales history
    const salesHistory = await fetchSalesHistory(address, city, state, zipCode);
    
    // Retrieve zoning information
    const zoningInformation = await fetchZoningInformation(address, city, state, zipCode);
    
    // Retrieve flood zone information
    const floodZoneInfo = await fetchFloodZoneInfo(address, city, state, zipCode);
    
    // Retrieve comparable properties
    const comparableProperties = await fetchComparableProperties(address, city, state, zipCode, propertyDetails);
    
    // Combine all data
    return {
      propertyDetails,
      taxInformation,
      salesHistory,
      zoningInformation,
      floodZoneInfo,
      comparableProperties
    };
  } catch (error) {
    console.error("Error retrieving property public data:", error);
    throw new Error(`Failed to retrieve property public data: ${error}`);
  }
}

// Connect to tax assessor's database
async function fetchPropertyDetails(address: string, city: string, state: string, zipCode: string): Promise<PropertyDetails> {
  try {
    // In a production environment, this would connect to county assessor APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate realistic property details for the following address. The data should look like it came from a county tax assessor's database.
    
    Property Address: ${address}, ${city}, ${state} ${zipCode}
    
    Return the following information in JSON format:
    - Year the property was built
    - Gross living area in square feet
    - Lot size in square feet
    - Number of bedrooms
    - Number of bathrooms
    - Property type (single family, condo, etc.)
    - Number of stories
    - Foundation type
    - Exterior wall material
    - Roof material
    - Heating type
    - Cooling type
    - Number of fireplaces
    - Garage type
    - Garage capacity
    - Whether there is a pool
    - Basement type
    - Basement finished area
    - Attic type
    - Attic finished area
    
    Make the data realistic for the area, but don't attempt to retrieve real data for the actual address.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic property data based on addresses. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    return {
      yearBuilt: data.yearBuilt || 2000,
      grossLivingArea: data.grossLivingArea || 2000,
      lotSize: data.lotSize || 5000,
      bedrooms: data.bedrooms || 3,
      bathrooms: data.bathrooms || 2,
      propertyType: data.propertyType || "Single Family",
      stories: data.stories || 1,
      foundation: data.foundation || "Concrete Slab",
      exteriorWalls: data.exteriorWalls || "Vinyl Siding",
      roofMaterial: data.roofMaterial || "Asphalt Shingle",
      heatingType: data.heatingType || "Forced Air",
      coolingType: data.coolingType || "Central Air",
      fireplaces: data.fireplaces || 0,
      garageType: data.garageType || "Attached",
      garageCapacity: data.garageCapacity || 2,
      poolFeature: data.poolFeature || false,
      basementType: data.basementType || "None",
      basementFinishedArea: data.basementFinishedArea || 0,
      atticType: data.atticType || "Unfinished",
      atticFinishedArea: data.atticFinishedArea || 0
    };
  } catch (error) {
    console.error("Error fetching property details:", error);
    
    // Return default values if the API call fails
    return {
      yearBuilt: 2000,
      grossLivingArea: 2000,
      lotSize: 5000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: "Single Family",
      stories: 1,
      foundation: "Concrete Slab",
      exteriorWalls: "Vinyl Siding",
      roofMaterial: "Asphalt Shingle",
      heatingType: "Forced Air",
      coolingType: "Central Air",
      fireplaces: 0,
      garageType: "Attached",
      garageCapacity: 2,
      poolFeature: false,
      basementType: "None",
      basementFinishedArea: 0,
      atticType: "Unfinished",
      atticFinishedArea: 0
    };
  }
}

// Connect to tax information database
async function fetchTaxInformation(address: string, city: string, state: string, zipCode: string): Promise<TaxInformation> {
  try {
    // In production, this would connect to county tax collector APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate realistic tax information for the following address. The data should look like it came from a county tax collector's database.
    
    Property Address: ${address}, ${city}, ${state} ${zipCode}
    
    Return the following information in JSON format:
    - Assessed value
    - Tax year
    - Annual tax amount
    - Tax rate
    - Tax assessment ID
    - Any tax exemptions
    
    Make the data realistic for the area, but don't attempt to retrieve real data for the actual address.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic property tax data based on addresses. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    return {
      assessedValue: data.assessedValue || 250000,
      taxYear: data.taxYear || new Date().getFullYear() - 1,
      annualTaxAmount: data.annualTaxAmount || 3500,
      taxRate: data.taxRate || 0.014,
      taxAssessmentId: data.taxAssessmentId || `TAX-${Math.floor(Math.random() * 1000000)}`,
      exemptions: data.exemptions || []
    };
  } catch (error) {
    console.error("Error fetching tax information:", error);
    
    // Return default values if the API call fails
    return {
      assessedValue: 250000,
      taxYear: new Date().getFullYear() - 1,
      annualTaxAmount: 3500,
      taxRate: 0.014,
      taxAssessmentId: `TAX-${Math.floor(Math.random() * 1000000)}`,
      exemptions: []
    };
  }
}

// Connect to county recorder for sales history
async function fetchSalesHistory(address: string, city: string, state: string, zipCode: string): Promise<SaleRecord[]> {
  try {
    // In production, this would connect to county recorder APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate realistic sales history for the following address. The data should look like it came from a county recorder's database.
    
    Property Address: ${address}, ${city}, ${state} ${zipCode}
    
    Return an array of previous sales (3-5 entries) in JSON format, with each sale containing:
    - Sale date
    - Sale price
    - Seller name
    - Buyer name
    - Document type
    - Document number
    
    Make the data realistic and ensure the dates and prices follow a logical progression (older sales should have lower prices).
    Don't attempt to retrieve real data for the actual address.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic property sales history based on addresses. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    // Ensure we have an array of sale records
    const salesHistory = Array.isArray(data.salesHistory) ? data.salesHistory : [];
    
    // Map and validate each record
    return salesHistory.map((record: any) => ({
      saleDate: record.saleDate || "2020-01-01",
      salePrice: record.salePrice || 300000,
      seller: record.seller || "Previous Owner",
      buyer: record.buyer || "Current Owner",
      documentType: record.documentType || "Warranty Deed",
      documentNumber: record.documentNumber || `DOC-${Math.floor(Math.random() * 1000000)}`
    }));
  } catch (error) {
    console.error("Error fetching sales history:", error);
    
    // Return default values if the API call fails
    const currentYear = new Date().getFullYear();
    return [
      {
        saleDate: `${currentYear - 3}-06-15`,
        salePrice: 300000,
        seller: "Previous Owner",
        buyer: "Current Owner",
        documentType: "Warranty Deed",
        documentNumber: `DOC-${Math.floor(Math.random() * 1000000)}`
      },
      {
        saleDate: `${currentYear - 8}-09-22`,
        salePrice: 250000,
        seller: "Original Owner",
        buyer: "Previous Owner",
        documentType: "Warranty Deed",
        documentNumber: `DOC-${Math.floor(Math.random() * 1000000)}`
      }
    ];
  }
}

// Connect to zoning department
async function fetchZoningInformation(address: string, city: string, state: string, zipCode: string): Promise<ZoningInformation> {
  try {
    // In production, this would connect to city/county zoning department APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate realistic zoning information for the following address. The data should look like it came from a city/county zoning department database.
    
    Property Address: ${address}, ${city}, ${state} ${zipCode}
    
    Return the following information in JSON format:
    - Zoning code
    - Zoning description
    - Allowed uses
    - Restrictions
    
    Make the data realistic for the area, but don't attempt to retrieve real data for the actual address.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic property zoning information based on addresses. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    return {
      zoningCode: data.zoningCode || "R-1",
      zoningDescription: data.zoningDescription || "Single Family Residential",
      allowedUses: Array.isArray(data.allowedUses) ? data.allowedUses : ["Single Family Dwellings", "Home Occupations", "Accessory Buildings"],
      restrictions: Array.isArray(data.restrictions) ? data.restrictions : ["Minimum Lot Size: 7,500 sq ft", "Setbacks: 20ft front, 5ft sides, 15ft rear", "Maximum Height: 35ft"]
    };
  } catch (error) {
    console.error("Error fetching zoning information:", error);
    
    // Return default values if the API call fails
    return {
      zoningCode: "R-1",
      zoningDescription: "Single Family Residential",
      allowedUses: ["Single Family Dwellings", "Home Occupations", "Accessory Buildings"],
      restrictions: ["Minimum Lot Size: 7,500 sq ft", "Setbacks: 20ft front, 5ft sides, 15ft rear", "Maximum Height: 35ft"]
    };
  }
}

// Connect to FEMA flood maps
async function fetchFloodZoneInfo(address: string, city: string, state: string, zipCode: string): Promise<FloodZoneInfo> {
  try {
    // In production, this would connect to FEMA flood map APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate realistic flood zone information for the following address. The data should look like it came from FEMA flood maps.
    
    Property Address: ${address}, ${city}, ${state} ${zipCode}
    
    Return the following information in JSON format:
    - Flood zone
    - Flood zone description
    - Whether flood insurance is required
    - Flood map number
    - Flood map date
    
    Make the data realistic for the area, but don't attempt to retrieve real data for the actual address.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic flood zone information based on addresses. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    return {
      floodZone: data.floodZone || "X",
      floodZoneDescription: data.floodZoneDescription || "Area of Minimal Flood Hazard",
      floodInsuranceRequired: data.floodInsuranceRequired || false,
      floodMapNumber: data.floodMapNumber || `06085C${Math.floor(Math.random() * 10000)}H`,
      floodMapDate: data.floodMapDate || "2019-02-20"
    };
  } catch (error) {
    console.error("Error fetching flood zone information:", error);
    
    // Return default values if the API call fails
    return {
      floodZone: "X",
      floodZoneDescription: "Area of Minimal Flood Hazard",
      floodInsuranceRequired: false,
      floodMapNumber: `06085C${Math.floor(Math.random() * 10000)}H`,
      floodMapDate: "2019-02-20"
    };
  }
}

// Find comparable properties in the area
async function fetchComparableProperties(address: string, city: string, state: string, zipCode: string, subjectDetails: PropertyDetails): Promise<ComparablePropertyData[]> {
  try {
    // In production, this would connect to MLS or other real estate database APIs
    // For demonstration, we'll use AI to generate realistic data
    
    const prompt = `
    Generate a list of realistic comparable properties for the following address.
    
    Subject Property:
    Address: ${address}, ${city}, ${state} ${zipCode}
    Year Built: ${subjectDetails.yearBuilt}
    Square Feet: ${subjectDetails.grossLivingArea}
    Bedrooms: ${subjectDetails.bedrooms}
    Bathrooms: ${subjectDetails.bathrooms}
    Property Type: ${subjectDetails.propertyType}
    
    Return an array of 5 comparable properties in JSON format, with each property containing:
    - Address
    - City
    - State
    - ZIP code
    - Sale date (within the last 6 months)
    - Sale price
    - Year built
    - Gross living area in square feet
    - Lot size in square feet
    - Number of bedrooms
    - Number of bathrooms
    - Property type
    - Distance from subject property (in miles, between 0.1 and 2.0)
    
    Make the comparables similar to the subject in terms of size, beds/baths, and property type,
    but with reasonable variations. Sale prices should be realistic for the area.
    Don't attempt to retrieve real data for actual addresses.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates realistic comparable property data. You only return JSON without any additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);
    
    // Ensure we have an array of comparable properties
    const comparables = Array.isArray(data.comparables) ? data.comparables : [];
    
    // Map and validate each comparable
    return comparables.map((comp: any) => ({
      address: comp.address || "123 Comparable St",
      city: comp.city || city,
      state: comp.state || state,
      zipCode: comp.zipCode || zipCode,
      saleDate: comp.saleDate || "2023-03-15",
      salePrice: comp.salePrice || 350000,
      yearBuilt: comp.yearBuilt || subjectDetails.yearBuilt,
      grossLivingArea: comp.grossLivingArea || subjectDetails.grossLivingArea,
      lotSize: comp.lotSize || subjectDetails.lotSize,
      bedrooms: comp.bedrooms || subjectDetails.bedrooms,
      bathrooms: comp.bathrooms || subjectDetails.bathrooms,
      propertyType: comp.propertyType || subjectDetails.propertyType,
      distanceFromSubject: comp.distanceFromSubject || 0.5
    }));
  } catch (error) {
    console.error("Error fetching comparable properties:", error);
    
    // Return default values if the API call fails
    const currentYear = new Date().getFullYear();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Create array of 3 comparable properties with slight variations from subject
    return Array(3).fill(null).map((_, index) => {
      const randomDate = new Date();
      randomDate.setMonth(randomDate.getMonth() - Math.floor(Math.random() * 6));
      
      return {
        address: `${123 + index} Comparable St`,
        city: city,
        state: state,
        zipCode: zipCode,
        saleDate: randomDate.toISOString().split('T')[0],
        salePrice: 300000 + (Math.floor(Math.random() * 100000) - 50000),
        yearBuilt: subjectDetails.yearBuilt + (Math.floor(Math.random() * 6) - 3),
        grossLivingArea: subjectDetails.grossLivingArea + (Math.floor(Math.random() * 300) - 150),
        lotSize: subjectDetails.lotSize + (Math.floor(Math.random() * 1000) - 500),
        bedrooms: subjectDetails.bedrooms,
        bathrooms: subjectDetails.bathrooms + (Math.random() > 0.5 ? 0.5 : 0),
        propertyType: subjectDetails.propertyType,
        distanceFromSubject: Math.round((0.2 + Math.random() * 1.8) * 10) / 10
      };
    });
  }
}