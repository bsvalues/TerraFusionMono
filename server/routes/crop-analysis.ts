import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { analyzeCropHealth, generateCropCareRecommendations, predictCropYield } from '../../shared/ai/crop-health-analysis';
import { storage } from '../storage';

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
            .map(i => `Date: ${new Date(i.timestamp).toLocaleDateString()}, Health: ${i.healthStatus}, Issues: ${i.issues}`)
            .join('. ');
        }
      } catch (err) {
        console.error('Error fetching previous identifications:', err);
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
          cropType: analysisResult.cropType,
          healthStatus: analysisResult.healthStatus,
          confidence: analysisResult.confidenceScore,
          issues: issuesText,
          assessment: analysisResult.overallAssessment,
          imageUrl: file.path, // Store the file path
          notes: notes || '',
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Error saving crop identification:', err);
        // Continue the process even if saving fails
      }
    }

    // Delete the temporary file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    // Return the analysis results
    return res.status(200).json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Error in crop analysis:', error);
    return res.status(500).json({ error: 'Error processing crop analysis', details: error.message });
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
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Error generating recommendations', details: error.message });
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
  } catch (error) {
    console.error('Error predicting yield:', error);
    return res.status(500).json({ error: 'Error predicting yield', details: error.message });
  }
});

export default router;