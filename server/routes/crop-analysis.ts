import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  analyzeCropHealth,
  performAdvancedCropAnalysis,
  generateCropCareRecommendations,
  predictCropYield,
  type EnhancedLocationData
} from '@shared/ai/crop-health-analysis';

const router = Router();

// Setup multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Flag to track if the OpenAI API key is working
let openAIApiKeyValid = true;

// Define validation schemas
const analyzeRequestSchema = z.object({
  parcelId: z.string().optional(),
  latitude: z.string().transform(Number).optional(),
  longitude: z.string().transform(Number).optional(),
  previousAnalysisId: z.string().optional(),
  notes: z.string().optional(),
});

const recommendationsRequestSchema = z.object({
  cropType: z.string(),
  healthIssues: z.array(z.string()),
  historicalData: z.string().optional(),
});

const yieldPredictionRequestSchema = z.object({
  cropType: z.string(),
  healthStatus: z.string(),
  environmentalConditions: z.string().optional(),
  historicalYields: z.string().optional(),
});

const advancedAnalyzeRequestSchema = z.object({
  cropType: z.string().optional(),
  latitude: z.string().transform(Number).optional(),
  longitude: z.string().transform(Number).optional(),
  elevation: z.string().transform(Number).optional(),
  region: z.string().optional(),
  temperature: z.string().transform(Number).optional(),
  humidity: z.string().transform(Number).optional(),
  rainfall: z.string().transform(Number).optional(),
  recentRainfall: z.string().optional(),
  soilType: z.string().optional(),
  soilPH: z.string().transform(Number).optional(),
  soilOrganicMatter: z.string().transform(Number).optional(),
  previousAnalysisId: z.string().optional(),
});

// Basic crop health analysis endpoint
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }
    
    const { 
      parcelId,
      latitude,
      longitude,
      previousAnalysisId,
      notes
    } = validationResult.data;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Missing image file',
        details: 'An image file is required for analysis'
      });
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Optional location data if provided
    const locationData = (latitude && longitude) ? {
      latitude,
      longitude
    } : undefined;
    
    // Retrieve previous analysis if provided
    let previousAnalysis;
    if (previousAnalysisId) {
      // TODO: Get previous analysis from database
      // previousAnalysis = await storage.getCropAnalysis(previousAnalysisId);
    }
    
    // Perform crop health analysis
    try {
      const analysis = await analyzeCropHealth(
        imageBase64,
        locationData,
        previousAnalysis
      );
      
      // Check if this was a fallback response
      const usedFallback = analysis.confidenceScore <= 0.1;
      
      // Store analysis results in database
      // TODO: Save analysis to database
      // const savedAnalysis = await storage.saveCropAnalysis({
      //   parcelId,
      //   analysis,
      //   imageId: req.file.filename,
      //   notes: notes || '',
      //   latitude,
      //   longitude
      // });
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.status(200).json({
        success: true,
        analysis,
        parcelId,
        usedFallback
      });
    } catch (error: any) {
      console.error("Error analyzing crop health:", error);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.status(500).json({
        error: 'Error analyzing crop health',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error("Unexpected error in /analyze endpoint:", error);
    
    // Clean up the uploaded file if it exists
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

// Advanced crop health analysis with multiple images and context data
router.post('/advanced-analyze', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = advancedAnalyzeRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }
    
    const { 
      cropType,
      latitude,
      longitude,
      elevation,
      region,
      temperature,
      humidity,
      rainfall,
      recentRainfall,
      soilType,
      soilPH,
      soilOrganicMatter,
      previousAnalysisId
    } = validationResult.data;
    
    // Check if files were uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'Missing image files',
        details: 'At least one image file is required for analysis'
      });
    }
    
    // Read the image files
    const imageBase64Array = req.files.map(file => {
      const imageBuffer = fs.readFileSync(file.path);
      return imageBuffer.toString('base64');
    });
    
    // Build enhanced location data if provided
    const locationData: EnhancedLocationData | undefined = (latitude && longitude) ? {
      latitude,
      longitude,
      elevation,
      region,
      weatherConditions: temperature || humidity || rainfall || recentRainfall ? {
        temperature,
        humidity,
        rainfall,
        recentRainfall
      } : undefined,
      soilProperties: soilType || soilPH || soilOrganicMatter ? {
        type: soilType,
        ph: soilPH,
        organicMatter: soilOrganicMatter
      } : undefined
    } : undefined;
    
    // Retrieve previous analysis if provided
    let previousAnalysis;
    if (previousAnalysisId) {
      // TODO: Get previous analysis from database
      // previousAnalysis = await storage.getAdvancedCropAnalysis(previousAnalysisId);
    }
    
    // Perform advanced crop health analysis
    try {
      const analysis = await performAdvancedCropAnalysis(
        imageBase64Array,
        cropType,
        locationData,
        previousAnalysis
      );
      
      // Check if this was a fallback response
      const usedFallback = analysis.confidenceScore <= 0.1;
      
      // Store analysis results in database
      // TODO: Save analysis to database
      // const savedAnalysis = await storage.saveAdvancedCropAnalysis({
      //   analysis,
      //   imageIds: req.files.map(f => f.filename),
      //   locationData
      // });
      
      // Clean up the uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(200).json({
        success: true,
        analysis,
        usedFallback
      });
    } catch (error: any) {
      console.error("Error performing advanced crop analysis:", error);
      
      // Clean up the uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(500).json({
        error: 'Error performing advanced crop analysis',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error("Unexpected error in /advanced-analyze endpoint:", error);
    
    // Clean up the uploaded files if they exist
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

// Generate care recommendations based on crop type and health issues
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = recommendationsRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }
    
    const { 
      cropType,
      healthIssues,
      historicalData
    } = validationResult.data;
    
    try {
      const recommendations = await generateCropCareRecommendations(
        cropType,
        healthIssues,
        historicalData
      );
      
      // Check if this was a fallback response
      const usedFallback = recommendations.length > 0 && recommendations[0].includes('fallback');
      
      return res.status(200).json({
        success: true,
        recommendations,
        usedFallback
      });
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      
      return res.status(500).json({
        error: 'Error generating recommendations',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error("Unexpected error in /recommendations endpoint:", error);
    
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

// Predict crop yield based on health status and environmental conditions
router.post('/predict-yield', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = yieldPredictionRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }
    
    const { 
      cropType,
      healthStatus,
      environmentalConditions,
      historicalYields
    } = validationResult.data;
    
    try {
      const prediction = await predictCropYield(
        cropType,
        healthStatus,
        environmentalConditions,
        historicalYields
      );
      
      // Check if this was a fallback response
      const usedFallback = prediction.confidenceLevel <= 0.3;
      
      return res.status(200).json({
        success: true,
        prediction,
        usedFallback
      });
    } catch (error: any) {
      console.error("Error predicting yield:", error);
      
      return res.status(500).json({
        error: 'Error predicting yield',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error("Unexpected error in /predict-yield endpoint:", error);
    
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

export default router;