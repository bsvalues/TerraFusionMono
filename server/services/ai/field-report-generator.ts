import OpenAI from "openai";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { fieldReports, parcels, fieldObservations, sensorReadings, insertFieldReportSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user
const AI_MODEL = "gpt-4o";
const PROMPT_VERSION = "1.0.0";

interface FieldReportInput {
  parcelId: string; 
  userId: number;
  title: string;
  reportType: 'crop_health' | 'pest_disease' | 'irrigation' | 'soil_quality' | 'yield_estimate' | 'comprehensive';
  mediaUrls?: string[];
  observations?: number[];
}

interface FieldReportProgress {
  reportId: string;
  stage: 'gathering_data' | 'analyzing' | 'generating_summary' | 'creating_recommendations' | 'finalizing' | 'complete';
  progress: number; // 0-100
  message: string;
  error?: string;
}

/**
 * WebSocket broadcast function for field report progress updates
 */
export function broadcastFieldReportProgress(wss: WebSocketServer, progress: FieldReportProgress) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'field_report_progress',
        data: progress
      }));
    }
  });
}

/**
 * Generate a field report with AI summary
 */
export async function generateFieldReport(
  input: FieldReportInput, 
  wss: WebSocketServer
): Promise<string> {
  const reportId = uuidv4();
  let progress: FieldReportProgress = {
    reportId,
    stage: 'gathering_data',
    progress: 0,
    message: 'Starting field report generation'
  };

  try {
    // Broadcast initial progress
    broadcastFieldReportProgress(wss, progress);
    
    // Step 1: Gather parcel data
    progress = { ...progress, progress: 10, message: 'Gathering parcel data' };
    broadcastFieldReportProgress(wss, progress);

    const [parcel] = await db.select().from(parcels).where(eq(parcels.externalId, input.parcelId));
    
    if (!parcel) {
      throw new Error(`Parcel with ID ${input.parcelId} not found`);
    }

    // Step 2: Gather observations if any
    progress = { ...progress, progress: 20, stage: 'gathering_data', message: 'Gathering field observations' };
    broadcastFieldReportProgress(wss, progress);

    const observations = input.observations?.length 
      ? await db.select().from(fieldObservations).where(eq(fieldObservations.parcelId, input.parcelId))
      : [];

    // Step 3: Gather sensor readings if available
    progress = { ...progress, progress: 30, message: 'Gathering sensor data' };
    broadcastFieldReportProgress(wss, progress);

    const sensorData = await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.parcelId, input.parcelId))
      .orderBy(sensorReadings.timestamp)
      .limit(50); // Limit to recent readings

    // Step 4: Start AI analysis
    progress = { ...progress, progress: 40, stage: 'analyzing', message: 'Analyzing field data with AI' };
    broadcastFieldReportProgress(wss, progress);

    // Prepare data for AI
    const reportContext = {
      parcelName: parcel.name,
      parcelDescription: parcel.description,
      location: {
        centerLat: parcel.centerLat,
        centerLng: parcel.centerLng,
        areaHectares: parcel.areaHectares
      },
      soilData: {
        soilType: parcel.soilType,
        soilPh: parcel.soilPh,
        organicMatter: parcel.soilOrganicMatter
      },
      cropData: {
        currentCrop: parcel.currentCrop,
        previousCrop: parcel.previousCrop,
        plantingDate: parcel.plantingDate,
        harvestDate: parcel.harvestDate
      },
      irrigationData: {
        type: parcel.irrigationType,
        waterSource: parcel.waterSource
      },
      observations: observations.map(obs => ({
        type: obs.observationType,
        timestamp: obs.timestamp,
        title: obs.title,
        description: obs.description,
        tags: obs.tags
      })),
      sensorReadings: sensorData.map(reading => ({
        type: reading.readingType,
        value: reading.value,
        unit: reading.unit,
        timestamp: reading.timestamp
      })),
      reportType: input.reportType,
      mediaCount: input.mediaUrls?.length || 0
    };

    // Generate AI summary with OpenAI
    progress = { ...progress, progress: 60, stage: 'generating_summary', message: 'Generating AI summary' };
    broadcastFieldReportProgress(wss, progress);

    const aiPrompt = generateAIPrompt(reportContext, input.reportType);
    const aiResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert agricultural analyst specializing in ${input.reportType} analysis. 
          Provide accurate, data-driven summaries and actionable recommendations based on field data.
          Always format your response as JSON with the following structure: 
          { 
            "summary": "Comprehensive summary of the field status", 
            "details": { [structured detailed analysis] }, 
            "recommendations": ["Specific actionable recommendations"]
          }`
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse AI response
    const aiContent = aiResponse.choices[0].message.content;
    const aiResult = JSON.parse(aiContent);

    // Step 5: Generate recommendations
    progress = { ...progress, progress: 80, stage: 'creating_recommendations', message: 'Creating recommendations' };
    broadcastFieldReportProgress(wss, progress);

    // Step 6: Finalize report
    progress = { ...progress, progress: 90, stage: 'finalizing', message: 'Finalizing report' };
    broadcastFieldReportProgress(wss, progress);

    // Insert into database
    const [fieldReport] = await db.insert(fieldReports).values({
      reportId,
      parcelId: input.parcelId,
      userId: input.userId,
      title: input.title,
      reportType: input.reportType,
      summary: aiResult.summary,
      details: aiResult.details,
      recommendations: aiResult.recommendations.join('\n\n'),
      mediaUrls: input.mediaUrls || [],
      observations: input.observations || [],
      weatherData: {}, // Would be populated with actual weather data in production
      cropData: reportContext.cropData,
      soilData: reportContext.soilData,
      aiModel: AI_MODEL,
      promptVersion: PROMPT_VERSION,
      status: 'completed',
      locationData: {
        centerLat: parcel.centerLat,
        centerLng: parcel.centerLng,
        areaHectares: parcel.areaHectares
      }
    }).returning();

    // Complete
    progress = { ...progress, progress: 100, stage: 'complete', message: 'Field report generated successfully' };
    broadcastFieldReportProgress(wss, progress);

    return reportId;

  } catch (error) {
    console.error("Error generating field report:", error);
    progress = { 
      ...progress, 
      progress: 100, 
      stage: 'complete', 
      message: 'Field report generation failed', 
      error: error.message 
    };
    broadcastFieldReportProgress(wss, progress);
    throw error;
  }
}

/**
 * Generate the prompt for OpenAI based on the report type and field data
 */
function generateAIPrompt(context: any, reportType: string): string {
  // Base prompt with field info
  let prompt = `Generate a comprehensive ${reportType} report for the field named "${context.parcelName}".

FIELD INFORMATION:
- Description: ${context.parcelDescription || 'No description provided'}
- Area: ${context.location.areaHectares} hectares
- Current crop: ${context.cropData.currentCrop || 'Unknown'}
- Previous crop: ${context.cropData.previousCrop || 'Unknown'}
- Soil type: ${context.soilData.soilType || 'Unknown'}
- Soil pH: ${context.soilData.soilPh || 'Unknown'}
- Soil organic matter: ${context.soilData.organicMatter || 'Unknown'}
- Irrigation type: ${context.irrigationData.type || 'Unknown'}
- Water source: ${context.irrigationData.waterSource || 'Unknown'}
- Planting date: ${context.cropData.plantingDate ? new Date(context.cropData.plantingDate).toLocaleDateString() : 'Unknown'}
- Expected harvest date: ${context.cropData.harvestDate ? new Date(context.cropData.harvestDate).toLocaleDateString() : 'Unknown'}
`;

  // Add observations if available
  if (context.observations.length > 0) {
    prompt += `\nFIELD OBSERVATIONS (${context.observations.length}):\n`;
    context.observations.forEach((obs, index) => {
      prompt += `- ${index + 1}. [${obs.type}] ${obs.title}: ${obs.description || 'No description'}\n`;
    });
  }

  // Add sensor readings if available
  if (context.sensorReadings.length > 0) {
    // Group by reading type
    const groupedReadings = context.sensorReadings.reduce((acc, reading) => {
      if (!acc[reading.type]) {
        acc[reading.type] = [];
      }
      acc[reading.type].push(reading);
      return acc;
    }, {});

    prompt += `\nSENSOR READINGS:\n`;
    
    for (const [type, readings] of Object.entries(groupedReadings)) {
      const recentReadings = readings.slice(-5); // Get 5 most recent
      const avgValue = recentReadings.reduce((sum, r) => sum + r.value, 0) / recentReadings.length;
      prompt += `- ${type}: Avg: ${avgValue.toFixed(2)} ${recentReadings[0].unit}, Recent: ${recentReadings.map(r => r.value.toFixed(2)).join(', ')}\n`;
    }
  }

  // Report type specific instructions
  switch (reportType) {
    case 'crop_health':
      prompt += `\nFocus on the current health status of ${context.cropData.currentCrop || 'the crop'}, identifying any signs of stress, disease, or nutrient deficiencies. Provide a NDVI-like health score and recommendations for improvement.`;
      break;
    case 'pest_disease':
      prompt += `\nAnalyze any indications of pest infestations or disease presence in ${context.cropData.currentCrop || 'the crop'}. Identify probable pests or pathogens and suggest appropriate control measures.`;
      break;
    case 'irrigation':
      prompt += `\nEvaluate the irrigation efficiency and water management practices. Assess if the current ${context.irrigationData.type || 'irrigation system'} is optimal for the crop and soil type, and suggest improvements.`;
      break;
    case 'soil_quality':
      prompt += `\nProvide a detailed analysis of soil health, including fertility, structure, and potential issues. Consider the pH level of ${context.soilData.soilPh || 'unknown'} and organic matter content of ${context.soilData.organicMatter || 'unknown'}.`;
      break;
    case 'yield_estimate':
      prompt += `\nEstimate the potential yield for ${context.cropData.currentCrop || 'the current crop'} based on all available information. Identify factors that may limit yield and suggest ways to address them.`;
      break;
    case 'comprehensive':
      prompt += `\nProvide a complete analysis covering crop health, pest/disease status, irrigation efficiency, soil quality, and yield potential. Include a holistic set of recommendations to optimize overall field management.`;
      break;
  }

  // Instructions for response format
  prompt += `\nFormat your response as structured JSON with three main sections:
1. "summary": A concise paragraph summarizing the overall status of the field and key findings
2. "details": Detailed analysis organized as a JSON object with relevant subsections
3. "recommendations": Array of 3-5 specific, actionable recommendations

The output should be valid JSON and ready for machine processing.`;

  return prompt;
}