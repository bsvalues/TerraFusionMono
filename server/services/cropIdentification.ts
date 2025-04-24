import OpenAI from 'openai';
import { log } from '../vite';
import { storage } from '../storage';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Crop identification service using OpenAI's vision capabilities
export class CropIdentificationService {
  
  /**
   * Identify a crop from an image
   * @param imageBase64 - Base64 encoded image data
   * @param location - Optional location data to provide context
   * @returns The identified crop information
   */
  async identifyCrop(imageBase64: string, location?: { lat: number, lng: number }): Promise<CropIdentificationResult> {
    try {
      log('Analyzing image for crop identification');
      
      // Prepare the location context if provided
      let locationContext = '';
      if (location) {
        locationContext = `The image was taken at coordinates: ${location.lat}, ${location.lng}.`;
      }
      
      // Call OpenAI's vision model to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a crop identification expert. Analyze the image and identify the crop or plant species visible. 
            Consider the visible features like leaf shape, plant structure, growth pattern, and any visible fruits or flowers.
            If multiple crops are visible, identify the most prominent one.
            ${locationContext}
            
            Respond with a JSON object with the following structure:
            {
              "cropName": "The identified crop name",
              "scientificName": "Scientific name if identifiable",
              "confidence": 0.95, // confidence level between 0-1
              "estimatedGrowthStage": "vegetative, flowering, fruiting, etc.",
              "details": "Brief description of the crop and its characteristics",
              "characteristics": ["key characteristic 1", "key characteristic 2"],
              "possibleAlternatives": ["alternative crop 1", "alternative crop 2"]
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please identify this crop or plant."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const content = response.choices[0].message.content || "{}";
      const result = JSON.parse(content) as CropIdentificationResult;
      
      // Log the identification to the database
      await this.logIdentification(result, imageBase64, location);
      
      return result;
    } catch (error) {
      log(`Error identifying crop: ${error}`, 'error');
      throw new Error(`Failed to identify crop: ${error}`);
    }
  }
  
  /**
   * Log the crop identification result to the database
   */
  private async logIdentification(
    result: CropIdentificationResult, 
    imageBase64: string, 
    location?: { lat: number, lng: number }
  ): Promise<void> {
    try {
      // Create thumbnail for storage
      const thumbnailBase64 = await this.createThumbnail(imageBase64);
      
      // Store the image and result in the database
      // For now, just log the action until we implement full storage
      log(`Crop identified as ${result.cropName} with ${(result.confidence * 100).toFixed(1)}% confidence`);
      
      // In a real implementation, we would save to the database
      // await storage.saveCropIdentification({...});
    } catch (error) {
      log(`Error logging crop identification: ${error}`, 'error');
    }
  }
  
  /**
   * Create a thumbnail from the original image
   * This is a placeholder implementation - in production you would use
   * an actual image processing library
   */
  private async createThumbnail(imageBase64: string): Promise<string> {
    // For simplicity, we're just returning the original image
    // In a real implementation, you would resize the image
    return imageBase64;
  }
}

// Type for crop identification results
export interface CropIdentificationResult {
  cropName: string;
  scientificName: string;
  confidence: number; // 0-1
  estimatedGrowthStage: string;
  details: string;
  characteristics: string[];
  possibleAlternatives: string[];
}

// Export singleton instance
export const cropIdentificationService = new CropIdentificationService();