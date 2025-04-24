import OpenAI from "openai";
import { storage } from "../storage";
import { logsService } from "./logs";
import { InsertCropIdentification } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

interface CropIdentificationResult {
  cropName: string;
  scientificName: string;
  confidence: number; // 0-1 value
  estimatedGrowthStage: string;
  details: string;
  characteristics: string[];
  possibleAlternatives: string[];
  [key: string]: any; // Allow for additional properties
}

class CropIdentificationService {
  /**
   * Identifies a crop from an image
   * @param base64Image Base64 encoded image data
   * @returns Crop identification result object
   */
  async identifyCrop(base64Image: string): Promise<CropIdentificationResult> {
    try {
      // Log the request
      await logsService.createLog({
        level: "INFO",
        service: "crop-identification",
        message: "Processing crop identification request"
      });

      // Make sure we have an API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured");
      }

      // Make the API request to OpenAI
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an agricultural expert specialized in crop identification. 
            Analyze the image and identify the crop shown. Provide detailed information about the crop 
            including its common name, scientific name, estimated growth stage, and key characteristics. 
            If you're uncertain, provide your best guess along with possible alternatives.
            Format your response as a JSON object with the following structure:
            {
              "cropName": "Common name of the crop",
              "scientificName": "Scientific name (genus and species)",
              "confidence": 0.95, // Confidence score between 0 and 1
              "estimatedGrowthStage": "Current growth stage (e.g., seedling, vegetative, flowering, etc.)",
              "details": "A paragraph with detailed information about the crop",
              "characteristics": ["Key characteristic 1", "Key characteristic 2", ...],
              "possibleAlternatives": ["Alternative crop 1", "Alternative crop 2", ...] // Only if confidence < 0.9
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please identify this crop and provide detailed information about it."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse and return the result
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Log successful response
      await logsService.createLog({
        level: "INFO",
        service: "crop-identification",
        message: `Successfully identified crop: ${result.cropName} (${result.scientificName})`
      });

      return result;

    } catch (error) {
      // Log the error
      await logsService.createLog({
        level: "ERROR",
        service: "crop-identification",
        message: `Error identifying crop: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }

  /**
   * Save a crop identification to the database
   * @param identification Crop identification data
   * @returns Saved crop identification
   */
  async saveCropIdentification(identification: Omit<InsertCropIdentification, "timestamp">): Promise<any> {
    try {
      // Add current timestamp
      const identificationWithTimestamp: InsertCropIdentification = {
        ...identification,
        timestamp: new Date(),
      };

      // Save to database
      const savedIdentification = await storage.createCropIdentification(identificationWithTimestamp);
      
      // Log success
      await logsService.createLog({
        level: "INFO",
        service: "crop-identification",
        message: `Saved crop identification with ID: ${savedIdentification.id}`
      });

      return savedIdentification;
    } catch (error) {
      // Log error
      await logsService.createLog({
        level: "ERROR",
        service: "crop-identification",
        message: `Error saving crop identification: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }

  /**
   * Get a list of crop identifications
   * @param options Options for filtering identifications
   * @returns Array of crop identifications
   */
  async getCropIdentifications(options: { userId: number, limit?: number, parcelId?: string }): Promise<any[]> {
    try {
      const identifications = await storage.getCropIdentifications(options);
      return identifications;
    } catch (error) {
      // Log error
      await logsService.createLog({
        level: "ERROR",
        service: "crop-identification",
        message: `Error retrieving crop identifications: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }

  /**
   * Get a single crop identification by ID
   * @param id Identification ID
   * @returns Crop identification or undefined if not found
   */
  async getCropIdentification(id: number): Promise<any> {
    try {
      return await storage.getCropIdentification(id);
    } catch (error) {
      // Log error
      await logsService.createLog({
        level: "ERROR",
        service: "crop-identification",
        message: `Error retrieving crop identification with ID ${id}: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }

  /**
   * Update a crop identification
   * @param id Identification ID
   * @param updates Updates to apply
   * @returns Updated crop identification
   */
  async updateCropIdentification(id: number, updates: Partial<any>): Promise<any> {
    try {
      const updatedIdentification = await storage.updateCropIdentification(id, updates);
      
      // Log success
      await logsService.createLog({
        level: "INFO",
        service: "crop-identification",
        message: `Updated crop identification with ID: ${id}`
      });

      return updatedIdentification;
    } catch (error) {
      // Log error
      await logsService.createLog({
        level: "ERROR",
        service: "crop-identification",
        message: `Error updating crop identification with ID ${id}: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }
}

// Export the service
export const cropIdentificationService = new CropIdentificationService();