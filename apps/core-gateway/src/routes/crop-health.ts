import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { CropHealthAnalysisService, SoilAnalyzer, DiseaseDetector, YieldPredictor } from '@terrafusion/crop-health';
import { logger } from '../utils/logger';

/**
 * Routes for predictive crop health AI insights
 */
const cropHealthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize services
  const cropHealthService = new CropHealthAnalysisService();
  const soilAnalyzer = new SoilAnalyzer();
  const diseaseDetector = new DiseaseDetector();
  const yieldPredictor = new YieldPredictor();
  
  // Get comprehensive crop health analysis
  fastify.post('/analyze', async (request, reply) => {
    try {
      const { parcelId, detailLevel = 'standard' } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const insights = await cropHealthService.analyzeParcelHealth({
        parcelId,
        detailLevel: detailLevel as any
      });
      
      return insights;
    } catch (error) {
      logger.error('Error analyzing crop health', error);
      return reply.status(500).send({ error: 'Failed to analyze crop health', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Perform a quick health check
  fastify.post('/quick-check', async (request, reply) => {
    try {
      const quickCheckData = request.body as any;
      
      if (!quickCheckData.parcelId || !quickCheckData.cropType) {
        return reply.status(400).send({ error: 'Missing required parameters: parcelId and cropType' });
      }
      
      const insights = await cropHealthService.quickHealthCheck(quickCheckData);
      
      return insights;
    } catch (error) {
      logger.error('Error performing quick health check', error);
      return reply.status(500).send({ error: 'Failed to perform quick health check', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Analyze soil health
  fastify.post('/soil', async (request, reply) => {
    try {
      const { parcelId, cropType } = request.body as any;
      
      if (!parcelId || !cropType) {
        return reply.status(400).send({ error: 'Missing required parameters: parcelId and cropType' });
      }
      
      const soilAnalysis = await soilAnalyzer.analyzeSoil(parcelId, cropType);
      
      return soilAnalysis;
    } catch (error) {
      logger.error('Error analyzing soil', error);
      return reply.status(500).send({ error: 'Failed to analyze soil', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Detect diseases
  fastify.post('/diseases', async (request, reply) => {
    try {
      const { parcelId, reportedSymptoms } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const diseaseAnalysis = await diseaseDetector.detectDiseases(parcelId, reportedSymptoms);
      
      return diseaseAnalysis;
    } catch (error) {
      logger.error('Error detecting diseases', error);
      return reply.status(500).send({ error: 'Failed to detect diseases', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Analyze image for disease detection
  fastify.post('/analyze-image', async (request, reply) => {
    try {
      const { base64Image, cropType } = request.body as any;
      
      if (!base64Image || !cropType) {
        return reply.status(400).send({ error: 'Missing required parameters: base64Image and cropType' });
      }
      
      const imageAnalysis = await diseaseDetector.analyzeImage(base64Image, cropType);
      
      return imageAnalysis;
    } catch (error) {
      logger.error('Error analyzing image', error);
      return reply.status(500).send({ error: 'Failed to analyze image', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Predict yield
  fastify.post('/yield', async (request, reply) => {
    try {
      const { parcelId } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const yieldPrediction = await yieldPredictor.predictYield(parcelId);
      
      return yieldPrediction;
    } catch (error) {
      logger.error('Error predicting yield', error);
      return reply.status(500).send({ error: 'Failed to predict yield', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Predict growth stages
  fastify.post('/growth-stages', async (request, reply) => {
    try {
      const { parcelId } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const growthPrediction = await yieldPredictor.predictGrowthStages(parcelId);
      
      return growthPrediction;
    } catch (error) {
      logger.error('Error predicting growth stages', error);
      return reply.status(500).send({ error: 'Failed to predict growth stages', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Analyze scenarios
  fastify.post('/scenarios', async (request, reply) => {
    try {
      const { parcelId } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const scenarioAnalysis = await yieldPredictor.analyzeScenarios(parcelId);
      
      return scenarioAnalysis;
    } catch (error) {
      logger.error('Error analyzing scenarios', error);
      return reply.status(500).send({ error: 'Failed to analyze scenarios', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate a seasonal forecast
  fastify.post('/seasonal-forecast', async (request, reply) => {
    try {
      const { parcelId } = request.body as any;
      
      if (!parcelId) {
        return reply.status(400).send({ error: 'Missing required parameter: parcelId' });
      }
      
      const forecast = await cropHealthService.generateSeasonalForecast(parcelId);
      
      return forecast;
    } catch (error) {
      logger.error('Error generating seasonal forecast', error);
      return reply.status(500).send({ error: 'Failed to generate seasonal forecast', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get optimal growing conditions
  fastify.get('/optimal-conditions/:parcelId/:cropType', async (request, reply) => {
    try {
      const { parcelId, cropType } = request.params as any;
      
      if (!parcelId || !cropType) {
        return reply.status(400).send({ error: 'Missing required parameters: parcelId and cropType' });
      }
      
      const conditions = await cropHealthService.getOptimalGrowingConditions(
        parseInt(parcelId, 10),
        cropType
      );
      
      return conditions;
    } catch (error) {
      logger.error('Error fetching optimal growing conditions', error);
      return reply.status(500).send({ error: 'Failed to fetch optimal growing conditions', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};

export default cropHealthRoutes;