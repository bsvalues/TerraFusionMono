import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { cropAnalysisRequests } from '../../shared/schema';
import { analyzeImages, generateRecommendations, advancedAnalyze } from '../../shared/ai/crop-health-analysis';
import { 
  getBasicAnalysisFallback, 
  getAdvancedAnalysisFallback, 
  getRecommendationsFallback,
  getYieldPredictionFallback
} from '../../shared/ai/fallbacks';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const cropAnalysisRoutes = Router();

export default cropAnalysisRoutes;

// Function to broadcast progress updates via WebSocket
const broadcastAnalysisProgress = (analysisId: string, status: 'processing' | 'completed' | 'error', data: any = {}) => {
  // Check if broadcastWebSocketMessage function is available globally
  if (typeof (global as any).broadcastWebSocketMessage === 'function') {
    const message = {
      type: 'crop_analysis_update',
      status,
      analysisId,
      ...data,
      timestamp: new Date().toISOString()
    };
    
    (global as any).broadcastWebSocketMessage(message);
    console.log(`Broadcasting crop analysis update for ${analysisId}: ${status}`);
  } else {
    console.warn('WebSocket broadcast function not available');
  }
};

// Basic Crop Analysis Endpoint
cropAnalysisRoutes.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { cropType, location } = req.body;
    
    if (!cropType) {
      return res.status(400).json({ error: 'Crop type is required' });
    }

    const filePath = req.file.path;
    
    // Generate a unique ID for this analysis request
    const analysisId = uuidv4();
    
    // Log the request to the database
    await db.insert(cropAnalysisRequests).values({
      requestType: 'basic',
      cropType,
      location: location || null,
      timestamp: new Date(),
      filePath: filePath,
      metadata: JSON.stringify({ analysisId })
    });
    
    // For quick responses (e.g. in development), we can respond immediately to the client
    // with just the analysis ID, then process in the background and notify via WebSocket
    res.json({
      success: true,
      analysisId,
      message: 'Analysis started. You will receive updates via WebSocket.'
    });
    
    // Process analysis in the background
    (async () => {
      try {
        // Initial progress update
        broadcastAnalysisProgress(analysisId, 'processing', { progress: 10 });
        
        // Convert image to base64
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Progress update - image processing complete
        broadcastAnalysisProgress(analysisId, 'processing', { progress: 30 });
        
        // Call the OpenAI API for analysis - this may take some time
        broadcastAnalysisProgress(analysisId, 'processing', { progress: 50, message: 'AI analysis in progress...' });
        const result = await analyzeImages(openai, base64Image, cropType, location);
        
        // Progress update - AI analysis complete
        broadcastAnalysisProgress(analysisId, 'processing', { progress: 90, message: 'Finalizing results...' });
        
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
        
        // Send final result via WebSocket
        broadcastAnalysisProgress(analysisId, 'completed', { 
          progress: 100,
          result: {
            success: true,
            analysis: result,
            usedFallback: false,
            analysisId
          }
        });
      } catch (aiError) {
        console.error('Error calling AI service:', aiError);
        
        // Use fallback data if AI service fails
        const fallbackResult = getBasicAnalysisFallback(cropType);
        
        // Send fallback result via WebSocket
        broadcastAnalysisProgress(analysisId, 'completed', { 
          progress: 100,
          result: {
            success: true,
            analysis: fallbackResult,
            usedFallback: true,
            analysisId
          }
        });
      }
    })().catch(error => {
      console.error('Error in background crop analysis process:', error);
      broadcastAnalysisProgress(analysisId, 'error', { 
        error: 'Failed to process crop analysis',
        details: error.message
      });
    });
  } catch (error) {
    console.error('Error processing crop analysis:', error);
    return res.status(500).json({ error: 'Failed to process crop analysis' });
  }
});

// Advanced Crop Analysis Endpoint
cropAnalysisRoutes.post('/advanced-analyze', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const { 
      cropType, 
      location, 
      soilType, 
      weather, 
      plantingDate, 
      previousIssues 
    } = req.body;
    
    if (!cropType) {
      return res.status(400).json({ error: 'Crop type is required' });
    }

    // Generate a unique ID for this analysis request
    const analysisId = uuidv4();
    
    // Log the request to the database
    await db.insert(cropAnalysisRequests).values({
      requestType: 'advanced',
      cropType,
      location: location || null,
      timestamp: new Date(),
      filePath: files[0].path, // Store the path of at least one file
      metadata: JSON.stringify({
        analysisId,
        soilType,
        weather,
        plantingDate,
        previousIssues,
        totalImages: files.length
      })
    });
    
    // Respond immediately with the analysis ID for WebSocket updates
    res.json({
      success: true,
      analysisId,
      message: 'Advanced analysis started. You will receive updates via WebSocket.'
    });
    
    // Process analysis in the background
    (async () => {
      try {
        // Initial progress update
        broadcastAnalysisProgress(analysisId, 'processing', { 
          progress: 10,
          message: 'Initializing advanced analysis...'
        });
        
        // Convert images to base64 - this could take some time for multiple large images
        broadcastAnalysisProgress(analysisId, 'processing', { 
          progress: 20, 
          message: `Processing ${files.length} images...`
        });
        
        const base64Images = files.map(file => {
          const imageBuffer = fs.readFileSync(file.path);
          return imageBuffer.toString('base64');
        });
        
        // Progress update - image processing complete
        broadcastAnalysisProgress(analysisId, 'processing', { 
          progress: 30, 
          message: 'Images processed successfully'
        });
        
        // Call the OpenAI API for advanced analysis - this takes even longer
        broadcastAnalysisProgress(analysisId, 'processing', { 
          progress: 40, 
          message: 'AI analysis in progress...'
        });
        
        const result = await advancedAnalyze(
          openai,
          base64Images,
          cropType,
          location,
          soilType,
          weather,
          plantingDate,
          previousIssues
        );
        
        // Progress update - AI analysis complete
        broadcastAnalysisProgress(analysisId, 'processing', { 
          progress: 90, 
          message: 'Finalizing advanced analysis results...'
        });
        
        // Clean up the uploaded files
        files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        
        // Send final result via WebSocket
        broadcastAnalysisProgress(analysisId, 'completed', { 
          progress: 100,
          result: {
            success: true,
            analysis: result,
            usedFallback: false,
            analysisId
          }
        });
      } catch (aiError) {
        console.error('Error calling AI service for advanced analysis:', aiError);
        
        // Use fallback data if AI service fails
        const fallbackResult = getAdvancedAnalysisFallback(cropType);
        
        // Clean up the uploaded files
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error removing uploaded file:', unlinkError);
          }
        });
        
        // Send fallback result via WebSocket
        broadcastAnalysisProgress(analysisId, 'completed', { 
          progress: 100,
          result: {
            success: true,
            analysis: fallbackResult,
            usedFallback: true,
            analysisId
          }
        });
      }
    })().catch(error => {
      console.error('Error in background crop advanced analysis process:', error);
      
      // Clean up the uploaded files on error
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error removing uploaded file:', unlinkError);
        }
      });
      
      // Send error message via WebSocket
      broadcastAnalysisProgress(analysisId, 'error', { 
        error: 'Failed to process advanced crop analysis',
        details: error.message
      });
    });
  } catch (error) {
    console.error('Error processing advanced crop analysis:', error);
    return res.status(500).json({ error: 'Failed to process advanced crop analysis' });
  }
});

// Recommendations Endpoint
cropAnalysisRoutes.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { cropType, issues, severity, growthStage } = req.body;
    
    if (!cropType || !issues) {
      return res.status(400).json({ error: 'Crop type and issues are required' });
    }

    try {
      // Call the OpenAI API for recommendations
      const result = await generateRecommendations(
        openai,
        cropType,
        issues,
        severity,
        growthStage
      );
      
      return res.json({
        success: true,
        recommendations: result,
        usedFallback: false
      });
    } catch (aiError) {
      console.error('Error calling AI service for recommendations:', aiError);
      
      // Use fallback data if AI service fails
      const fallbackResult = getRecommendationsFallback(cropType, issues);
      
      return res.json({
        success: true,
        recommendations: fallbackResult,
        usedFallback: true
      });
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Yield Prediction Endpoint
cropAnalysisRoutes.post('/predict-yield', async (req: Request, res: Response) => {
  try {
    const { cropType, healthStatus, environmentalConditions, historicalYields } = req.body;
    
    if (!cropType || !healthStatus) {
      return res.status(400).json({ error: 'Crop type and health status are required' });
    }

    try {
      // Call OpenAI for yield prediction
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: 
              "You are an agricultural expert specializing in crop yield prediction. Analyze the provided information and generate a detailed yield prediction. Respond with JSON in this format: { 'prediction': string, 'confidenceLevel': number, 'factors': string[] }",
          },
          {
            role: "user",
            content: `Predict the yield for ${cropType} with current health status: ${healthStatus}.\n` +
                    `${environmentalConditions ? `Environmental conditions: ${environmentalConditions}\n` : ''}` +
                    `${historicalYields ? `Historical yields: ${historicalYields}` : ''}`
          },
        ],
        response_format: { type: "json_object" },
      });

      // Handle null content (unlikely but possible)
      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content);
      
      return res.json({
        success: true,
        prediction: {
          prediction: result.prediction,
          confidenceLevel: Math.max(0, Math.min(1, result.confidenceLevel)),
          factors: result.factors,
        },
        usedFallback: false
      });
    } catch (aiError) {
      console.error('Error calling AI service for yield prediction:', aiError);
      
      // Use fallback data if AI service fails
      const fallbackResult = getYieldPredictionFallback(cropType, healthStatus);
      
      return res.json({
        success: true,
        prediction: fallbackResult,
        usedFallback: true
      });
    }
  } catch (error) {
    console.error('Error predicting yield:', error);
    return res.status(500).json({ error: 'Failed to predict yield' });
  }
});