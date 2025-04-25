import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { 
  analyzeCropHealth, 
  generateCropCareRecommendations, 
  predictCropYield,
  performAdvancedCropAnalysis,
  EnhancedLocationData
} from '../../shared/ai/crop-health-analysis';
import { storage } from '../storage';

// Use the built-in console for logging until we have a proper logger
const logger = {
  debug: (message: string, metadata?: any) => console.debug(message, metadata),
  info: (message: string, metadata?: any) => console.info(message, metadata),
  warn: (message: string, metadata?: any) => console.warn(message, metadata),
  error: (message: string, metadata?: any) => console.error(message, metadata)
};

// Helper function to map growth stages to our enum values
function mapGrowthStage(stage: string): 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'senescence' {
  const stageMap: Record<string, 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'senescence'> = {
    'germination': 'germination',
    'seedling': 'seedling',
    'vegetative': 'vegetative',
    'vegetative growth': 'vegetative',
    'flowering': 'flowering',
    'fruiting': 'fruiting',
    'fruit development': 'fruiting',
    'maturity': 'maturity',
    'mature': 'maturity',
    'senescence': 'senescence',
    'dying': 'senescence'
  };
  
  // Default to vegetative if unknown
  return stageMap[stage.toLowerCase()] || 'vegetative';
};

// Create a multer instance for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'temp/uploads');
      // Ensure the upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Validation schema
const analyzeRequestSchema = z.object({
  parcelId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional()
});

const recommendationRequestSchema = z.object({
  cropType: z.string(),
  healthIssues: z.array(z.string()),
  historicalData: z.string().optional()
});

const yieldPredictionRequestSchema = z.object({
  cropType: z.string(),
  healthStatus: z.string(),
  environmentalConditions: z.string().optional(),
  historicalYields: z.string().optional()
});

// Create router
const router = Router();

// Route for analyzing crop health from an image
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Validate request data
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }

    const { parcelId, latitude, longitude, notes } = validationResult.data;

    // Read the image file as base64
    const imageBuffer = fs.readFileSync(file.path);
    const base64Image = imageBuffer.toString('base64');

    // Get previous history if parcelId is provided
    let previousHistory: string | undefined;
    if (parcelId) {
      try {
        const identifications = await storage.getCropIdentifications({ parcelId });
        if (identifications.length > 0) {
          // Format previous history data
          previousHistory = identifications
            .map(i => {
              let text = `Date: ${new Date(i.timestamp).toLocaleDateString()}, Crop: ${i.cropName}`;
              
              // Add identification details if available
              if (i.scientificName) {
                text += `, Scientific Name: ${i.scientificName}`;
              }
              
              // Add custom properties that may not be in the schema
              const customProps = i as any;
              if (customProps.healthStatus) {
                text += `, Health: ${customProps.healthStatus}`;
              }
              
              if (customProps.issues) {
                text += `, Issues: ${customProps.issues}`;
              }
              
              return text;
            })
            .join('. ');
        }
      } catch (err) {
        logger.error('Error fetching previous identifications:', err);
      }
    }

    // Analyze the crop health
    const analysisResult = await analyzeCropHealth(
      base64Image,
      latitude && longitude ? { latitude, longitude } : undefined,
      previousHistory
    );

    // Save the identification to database if parcelId is provided
    if (parcelId) {
      try {
        const issuesText = analysisResult.issues.map(i => i.name).join(', ');
        
        await storage.createCropIdentification({
          parcelId,
          userId: req.user?.id || 1, // Use authenticated user ID or default
          cropName: analysisResult.cropType,
          scientificName: null, // We don't have scientific name from basic analysis
          confidence: analysisResult.confidenceScore.toString(), // Convert to string
          // Store additional data in custom props
          rawResponse: {
            healthStatus: analysisResult.healthStatus,
            issues: issuesText,
            assessment: analysisResult.overallAssessment
          },
          imageUrl: file.path, // Store the file path
          notes: notes || '',
          timestamp: new Date()
        });
      } catch (err) {
        logger.error('Error saving crop identification:', err);
        // Continue the process even if saving fails
      }
    }

    // Delete the temporary file
    fs.unlink(file.path, (err) => {
      if (err) logger.error('Error deleting temporary file:', err);
    });

    // Return the analysis results
    return res.status(200).json({
      success: true,
      analysis: analysisResult
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in crop analysis:', { error });
    return res.status(500).json({ error: 'Error processing crop analysis', details: errorMessage });
  }
});

// Advanced multi-image analysis validation schema
const advancedAnalysisRequestSchema = z.object({
  parcelId: z.string().optional(),
  cropType: z.string().optional(),
  region: z.string().optional(),
  elevation: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  rainfall: z.number().optional(),
  recentRainfall: z.string().optional(),
  soilType: z.string().optional(),
  soilPh: z.number().optional(),
  soilOrganicMatter: z.number().optional(),
  notes: z.string().optional()
});

// Route for advanced multi-image crop health analysis
router.post('/advanced-analyze', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    // Validate request data
    const validationResult = advancedAnalysisRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }

    const { 
      parcelId, cropType, region, elevation, latitude, longitude,
      temperature, humidity, rainfall, recentRainfall,
      soilType, soilPh, soilOrganicMatter, notes 
    } = validationResult.data;

    // Convert images to base64
    const base64Images: string[] = [];
    for (const file of files) {
      const imageBuffer = fs.readFileSync(file.path);
      base64Images.push(imageBuffer.toString('base64'));
    }

    // Get previous analysis if parcelId is provided
    let previousAnalysis: any = undefined;
    if (parcelId) {
      try {
        const analyses = await storage.getCropHealthAnalyses({ parcelId });
        if (analyses && analyses.length > 0) {
          // Get the most recent analysis
          const latestAnalysis = analyses[0];
          if (latestAnalysis.rawResponse) {
            previousAnalysis = latestAnalysis.rawResponse;
          }
        }
      } catch (err) {
        logger.error('Error fetching previous crop health analyses:', err);
      }
    }

    // Prepare location data
    const locationData: EnhancedLocationData | undefined = latitude && longitude ? {
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
      soilProperties: soilType || soilPh || soilOrganicMatter ? {
        type: soilType,
        ph: soilPh,
        organicMatter: soilOrganicMatter
      } : undefined
    } : undefined;

    // Perform advanced analysis
    const analysisResult = await performAdvancedCropAnalysis(
      base64Images,
      cropType,
      locationData,
      previousAnalysis
    );

    // Save the analysis results to database if parcelId is provided
    if (parcelId) {
      try {
        // Store the analysis in crop_health_analyses table
        await storage.createCropHealthAnalysis({
          parcelId,
          timestamp: new Date(),
          userId: req.user?.id || 1,
          cropType: analysisResult.cropType,
          overallHealth: analysisResult.healthStatus === 'moderate' ? 'fair' : analysisResult.healthStatus,
          healthScore: Math.round(analysisResult.confidenceScore * 100), // Convert 0-1 to 0-100
          confidenceLevel: analysisResult.confidenceScore.toString(),
          growthStage: mapGrowthStage(analysisResult.growthStage),
          growthProgress: 0, // This would need to be calculated based on crop type and growth stage
          estimatedHarvestDate: null, // Would need additional calculation
          aiModel: "gpt-4o",
          rawResponse: analysisResult,
          recommendations: analysisResult.issues.flatMap(issue => issue.recommendedActions),
          images: files.map(file => file.path)
        });

        // Save disease detections if any
        if (analysisResult.diseaseRisk && analysisResult.diseaseRisk.currentRisks.length > 0) {
          // Code to save disease detections would go here
          // Requires relationship between crop_health_analyses and disease_detections
        }
      } catch (err) {
        logger.error('Error saving crop health analysis:', err);
        // Continue the process even if saving fails
      }
    }

    // Delete temporary files
    for (const file of files) {
      fs.unlink(file.path, (err) => {
        if (err) logger.error(`Error deleting temporary file ${file.path}:`, err);
      });
    }

    // Return the analysis results
    return res.status(200).json({
      success: true,
      analysis: analysisResult
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in advanced crop analysis:', { error });
    return res.status(500).json({ error: 'Error performing advanced crop analysis', details: errorMessage });
  }
});

// Route for generating crop care recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = recommendationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }

    const { cropType, healthIssues, historicalData } = validationResult.data;

    // Generate recommendations
    const recommendations = await generateCropCareRecommendations(
      cropType,
      healthIssues,
      historicalData
    );

    return res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error generating recommendations:', { error });
    return res.status(500).json({ error: 'Error generating recommendations', details: errorMessage });
  }
});

// Route for predicting crop yields
router.post('/predict-yield', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = yieldPredictionRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }

    const { cropType, healthStatus, environmentalConditions, historicalYields } = validationResult.data;

    // Predict yield
    const prediction = await predictCropYield(
      cropType,
      healthStatus,
      environmentalConditions,
      historicalYields
    );

    return res.status(200).json({
      success: true,
      prediction
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error predicting yield:', { error });
    return res.status(500).json({ error: 'Error predicting yield', details: errorMessage });
  }
});

export default router;