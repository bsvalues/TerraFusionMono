import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { cropIdentificationService } from '../services/cropIdentification';

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

// Create router
const router = Router();

// Identify a crop from an uploaded image
router.post('/crop-identification', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get user ID from session or request
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Read the uploaded file and convert to base64
    const filePath = req.file.path;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    // Call the identification service
    const identificationResult = await cropIdentificationService.identifyCrop(base64Image);

    // Extract optional parcel ID if provided
    const parcelId = req.body.parcelId;

    // Save the identification to database
    const savedIdentification = await cropIdentificationService.saveCropIdentification({
      userId,
      parcelId,
      cropName: identificationResult.cropName,
      scientificName: identificationResult.scientificName,
      confidence: identificationResult.confidence,
      estimatedGrowthStage: identificationResult.estimatedGrowthStage,
      details: identificationResult.details,
      characteristics: identificationResult.characteristics,
      possibleAlternatives: identificationResult.possibleAlternatives,
      imageUrl: req.file.path,
      rawResponse: identificationResult,
    });

    // Return the identification result
    res.status(200).json({
      success: true,
      identification: savedIdentification
    });
  } catch (error) {
    console.error('Error identifying crop:', error);
    res.status(500).json({ 
      error: 'Failed to identify crop', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get all crop identifications for a user
router.get('/crop-identifications', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const parcelId = req.query.parcelId as string | undefined;

    const identifications = await cropIdentificationService.getCropIdentifications({
      userId,
      limit,
      parcelId
    });

    res.status(200).json({
      success: true,
      identifications
    });
  } catch (error) {
    console.error('Error fetching crop identifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crop identifications', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get a single crop identification by ID
router.get('/crop-identifications/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const identificationId = parseInt(req.params.id);
    if (isNaN(identificationId)) {
      return res.status(400).json({ error: 'Invalid identification ID' });
    }

    const identification = await cropIdentificationService.getCropIdentification(identificationId);
    
    if (!identification) {
      return res.status(404).json({ error: 'Crop identification not found' });
    }

    // Check if the user has permission to access this identification
    if (identification.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      identification
    });
  } catch (error) {
    console.error('Error fetching crop identification:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crop identification', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update a crop identification with verification or feedback
router.patch('/crop-identifications/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const identificationId = parseInt(req.params.id);
    if (isNaN(identificationId)) {
      return res.status(400).json({ error: 'Invalid identification ID' });
    }

    const identification = await cropIdentificationService.getCropIdentification(identificationId);
    
    if (!identification) {
      return res.status(404).json({ error: 'Crop identification not found' });
    }

    // Check if the user has permission to update this identification
    if (identification.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get updates from request body
    const { verified, feedback } = req.body;
    
    // Update the identification
    const updatedIdentification = await cropIdentificationService.updateCropIdentification(
      identificationId, 
      { verified, feedback }
    );

    res.status(200).json({
      success: true,
      identification: updatedIdentification
    });
  } catch (error) {
    console.error('Error updating crop identification:', error);
    res.status(500).json({ 
      error: 'Failed to update crop identification', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;