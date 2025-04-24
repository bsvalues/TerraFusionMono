import { db } from '../../db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { 
  cropHealthAnalyses, 
  diseaseDetections, 
  soilAnalyses, 
  yieldPredictions,
  cropHealthImages,
  weatherData,
  InsertCropHealthAnalysis,
  InsertDiseaseDetection,
  InsertSoilAnalysis,
  InsertYieldPrediction,
  InsertCropHealthImage,
  InsertWeatherData
} from 'shared/schema';
import { logger } from '../utils/logger';

/**
 * Crop Health Data Access
 * 
 * Handles all database operations for crop health data
 */
export class CropHealthDataAccess {
  /**
   * Save a crop health analysis to the database
   */
  async saveAnalysis(analysis: InsertCropHealthAnalysis) {
    try {
      const [result] = await db.insert(cropHealthAnalyses)
        .values(analysis)
        .returning();
      
      logger.info(`Saved crop health analysis for parcel ${analysis.parcelId}`);
      return result;
    } catch (error) {
      logger.error('Error saving crop health analysis', error);
      throw error;
    }
  }
  
  /**
   * Get latest crop health analysis for a parcel
   */
  async getLatestAnalysis(parcelId: string) {
    try {
      const [result] = await db.select()
        .from(cropHealthAnalyses)
        .where(eq(cropHealthAnalyses.parcelId, parcelId))
        .orderBy(desc(cropHealthAnalyses.timestamp))
        .limit(1);
      
      return result;
    } catch (error) {
      logger.error(`Error getting latest crop health analysis for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all crop health analyses for a parcel within a time range
   */
  async getAnalysesForParcel(parcelId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = db.select()
        .from(cropHealthAnalyses)
        .where(eq(cropHealthAnalyses.parcelId, parcelId));
      
      if (startDate) {
        query = query.where(gte(cropHealthAnalyses.timestamp, startDate));
      }
      
      if (endDate) {
        query = query.where(lte(cropHealthAnalyses.timestamp, endDate));
      }
      
      const results = await query.orderBy(desc(cropHealthAnalyses.timestamp));
      return results;
    } catch (error) {
      logger.error(`Error getting crop health analyses for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Save a disease detection to the database
   */
  async saveDiseaseDetection(detection: InsertDiseaseDetection) {
    try {
      const [result] = await db.insert(diseaseDetections)
        .values(detection)
        .returning();
      
      logger.info(`Saved disease detection for analysis ${detection.analysisId}`);
      return result;
    } catch (error) {
      logger.error('Error saving disease detection', error);
      throw error;
    }
  }
  
  /**
   * Get disease detections for an analysis
   */
  async getDiseaseDetectionsForAnalysis(analysisId: number) {
    try {
      const results = await db.select()
        .from(diseaseDetections)
        .where(eq(diseaseDetections.analysisId, analysisId));
      
      return results;
    } catch (error) {
      logger.error(`Error getting disease detections for analysis ${analysisId}`, error);
      throw error;
    }
  }
  
  /**
   * Save soil analysis to the database
   */
  async saveSoilAnalysis(analysis: InsertSoilAnalysis) {
    try {
      const [result] = await db.insert(soilAnalyses)
        .values(analysis)
        .returning();
      
      logger.info(`Saved soil analysis for parcel ${analysis.parcelId}`);
      return result;
    } catch (error) {
      logger.error('Error saving soil analysis', error);
      throw error;
    }
  }
  
  /**
   * Get latest soil analysis for a parcel
   */
  async getLatestSoilAnalysis(parcelId: string) {
    try {
      const [result] = await db.select()
        .from(soilAnalyses)
        .where(eq(soilAnalyses.parcelId, parcelId))
        .orderBy(desc(soilAnalyses.timestamp))
        .limit(1);
      
      return result;
    } catch (error) {
      logger.error(`Error getting latest soil analysis for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Get soil analyses history for a parcel
   */
  async getSoilAnalysesForParcel(parcelId: string, limit: number = 10) {
    try {
      const results = await db.select()
        .from(soilAnalyses)
        .where(eq(soilAnalyses.parcelId, parcelId))
        .orderBy(desc(soilAnalyses.timestamp))
        .limit(limit);
      
      return results;
    } catch (error) {
      logger.error(`Error getting soil analyses for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Save yield prediction to the database
   */
  async saveYieldPrediction(prediction: InsertYieldPrediction) {
    try {
      const [result] = await db.insert(yieldPredictions)
        .values(prediction)
        .returning();
      
      logger.info(`Saved yield prediction for parcel ${prediction.parcelId}`);
      return result;
    } catch (error) {
      logger.error('Error saving yield prediction', error);
      throw error;
    }
  }
  
  /**
   * Get latest yield prediction for a parcel
   */
  async getLatestYieldPrediction(parcelId: string) {
    try {
      const [result] = await db.select()
        .from(yieldPredictions)
        .where(eq(yieldPredictions.parcelId, parcelId))
        .orderBy(desc(yieldPredictions.timestamp))
        .limit(1);
      
      return result;
    } catch (error) {
      logger.error(`Error getting latest yield prediction for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Get yield scenarios for a parcel
   */
  async getYieldScenariosForParcel(parcelId: string) {
    try {
      const results = await db.select()
        .from(yieldPredictions)
        .where(
          and(
            eq(yieldPredictions.parcelId, parcelId),
            // Only get scenarios from the latest prediction date
            gte(yieldPredictions.timestamp, new Date(new Date().setDate(new Date().getDate() - 7)))
          )
        )
        .orderBy(desc(yieldPredictions.timestamp));
      
      return results;
    } catch (error) {
      logger.error(`Error getting yield scenarios for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Save crop health image to the database
   */
  async saveCropHealthImage(image: InsertCropHealthImage) {
    try {
      const [result] = await db.insert(cropHealthImages)
        .values(image)
        .returning();
      
      logger.info(`Saved crop health image for parcel ${image.parcelId}`);
      return result;
    } catch (error) {
      logger.error('Error saving crop health image', error);
      throw error;
    }
  }
  
  /**
   * Get crop health images for a parcel
   */
  async getCropHealthImagesForParcel(parcelId: string, limit: number = 10) {
    try {
      const results = await db.select()
        .from(cropHealthImages)
        .where(eq(cropHealthImages.parcelId, parcelId))
        .orderBy(desc(cropHealthImages.timestamp))
        .limit(limit);
      
      return results;
    } catch (error) {
      logger.error(`Error getting crop health images for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Save weather data to the database
   */
  async saveWeatherData(data: InsertWeatherData) {
    try {
      const [result] = await db.insert(weatherData)
        .values(data)
        .returning();
      
      logger.info(`Saved weather data for parcel ${data.parcelId}`);
      return result;
    } catch (error) {
      logger.error('Error saving weather data', error);
      throw error;
    }
  }
  
  /**
   * Get latest weather data for a parcel
   */
  async getLatestWeatherData(parcelId: string, dataType: string = 'current') {
    try {
      const [result] = await db.select()
        .from(weatherData)
        .where(
          and(
            eq(weatherData.parcelId, parcelId),
            eq(weatherData.dataType, dataType)
          )
        )
        .orderBy(desc(weatherData.timestamp))
        .limit(1);
      
      return result;
    } catch (error) {
      logger.error(`Error getting latest weather data for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Get weather forecast for a parcel
   */
  async getWeatherForecastForParcel(parcelId: string) {
    try {
      const results = await db.select()
        .from(weatherData)
        .where(
          and(
            eq(weatherData.parcelId, parcelId),
            eq(weatherData.dataType, 'forecast')
          )
        )
        .orderBy(desc(weatherData.timestamp));
      
      return results;
    } catch (error) {
      logger.error(`Error getting weather forecast for parcel ${parcelId}`, error);
      throw error;
    }
  }
}