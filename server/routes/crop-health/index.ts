import { Router, Request, Response } from "express";
import { cropHealthService } from "../../services/crop-health";
import { logsService } from "../../services/logs";

const router = Router();

// Get overall crop health data for a parcel
router.get("/:parcelId", async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.parcelId;
    
    // Log request
    await logsService.createLog({
      level: "INFO",
      service: "crop-health-api",
      message: `GET /api/crop-health/${parcelId} request received`
    });
    
    const healthData = await cropHealthService.getCropHealthData(parcelId);
    res.json(healthData);
  } catch (error: any) {
    await logsService.createLog({
      level: "ERROR",
      service: "crop-health-api",
      message: `Error handling GET /api/crop-health/${req.params.parcelId}: ${error.message}`
    });
    res.status(500).json({ error: error.message });
  }
});

// Get soil analysis for a parcel
router.get("/soil/:parcelId", async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.parcelId;
    
    // Log request
    await logsService.createLog({
      level: "INFO",
      service: "crop-health-api",
      message: `GET /api/crop-health/soil/${parcelId} request received`
    });
    
    const soilAnalysis = await cropHealthService.getSoilAnalysis(parcelId);
    res.json(soilAnalysis);
  } catch (error: any) {
    await logsService.createLog({
      level: "ERROR",
      service: "crop-health-api",
      message: `Error handling GET /api/crop-health/soil/${req.params.parcelId}: ${error.message}`
    });
    res.status(500).json({ error: error.message });
  }
});

// Get disease detections for a parcel
router.get("/diseases/:parcelId", async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.parcelId;
    
    // Log request
    await logsService.createLog({
      level: "INFO",
      service: "crop-health-api",
      message: `GET /api/crop-health/diseases/${parcelId} request received`
    });
    
    const diseaseData = await cropHealthService.getDiseaseDetections(parcelId);
    res.json(diseaseData);
  } catch (error: any) {
    await logsService.createLog({
      level: "ERROR",
      service: "crop-health-api",
      message: `Error handling GET /api/crop-health/diseases/${req.params.parcelId}: ${error.message}`
    });
    res.status(500).json({ error: error.message });
  }
});

// Get yield prediction for a parcel
router.get("/yield/:parcelId", async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.parcelId;
    
    // Log request
    await logsService.createLog({
      level: "INFO",
      service: "crop-health-api",
      message: `GET /api/crop-health/yield/${parcelId} request received`
    });
    
    const yieldData = await cropHealthService.getYieldPrediction(parcelId);
    res.json(yieldData);
  } catch (error: any) {
    await logsService.createLog({
      level: "ERROR",
      service: "crop-health-api",
      message: `Error handling GET /api/crop-health/yield/${req.params.parcelId}: ${error.message}`
    });
    res.status(500).json({ error: error.message });
  }
});

// Get weather data for a parcel
router.get("/weather/:parcelId", async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.parcelId;
    
    // Log request
    await logsService.createLog({
      level: "INFO",
      service: "crop-health-api",
      message: `GET /api/crop-health/weather/${parcelId} request received`
    });
    
    const weatherData = await cropHealthService.getWeatherData(parcelId);
    res.json(weatherData);
  } catch (error: any) {
    await logsService.createLog({
      level: "ERROR",
      service: "crop-health-api",
      message: `Error handling GET /api/crop-health/weather/${req.params.parcelId}: ${error.message}`
    });
    res.status(500).json({ error: error.message });
  }
});

export default router;