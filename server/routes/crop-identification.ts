import { Router, Request, Response } from "express";
import { cropIdentificationService } from "../services/cropIdentification";
import { logsService } from "../services/logs";
import multer from "multer";
import fs from "fs";
import { promisify } from "util";

const router = Router();

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
});

// Upload and identify crop from image
router.post("/identify", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    
    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");
    
    // Get location data if provided
    const location = req.body.latitude && req.body.longitude 
      ? { lat: parseFloat(req.body.latitude), lng: parseFloat(req.body.longitude) }
      : undefined;
    
    // Log the request
    await logsService.createLog({
      level: "INFO",
      service: "crop-identification-api",
      message: `Crop identification requested${location ? ` with location data (${location.lat}, ${location.lng})` : ''}`
    });
    
    // Process the image with OpenAI
    const result = await cropIdentificationService.identifyCrop(base64Image, location);
    
    // Log the result
    await logsService.createLog({
      level: "INFO",
      service: "crop-identification-api",
      message: `Crop identified as ${result.cropName} with ${(result.confidence * 100).toFixed(1)}% confidence`
    });
    
    // Return the identification results
    res.json(result);
  } catch (error: any) {
    // Log the error
    await logsService.createLog({
      level: "ERROR",
      service: "crop-identification-api",
      message: `Error identifying crop: ${error.message}`
    });
    
    res.status(500).json({ error: error.message });
  }
});

export default router;