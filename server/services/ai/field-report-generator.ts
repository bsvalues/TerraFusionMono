import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import { db } from '../../db';
import { fieldReports, insertFieldReportSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// Create a field report in the database
async function createFieldReportInDb(reportId: string, input: FieldReportInput): Promise<string> {
  const { parcelId, userId, title, reportType } = input;

  try {
    const [report] = await db.insert(fieldReports)
      .values({
        reportId,
        parcelId,
        userId,
        title,
        reportType,
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return report.reportId;
  } catch (error) {
    console.error('Error creating field report in database:', error);
    throw new Error('Failed to create field report in database');
  }
}

/**
 * WebSocket broadcast function for field report progress updates
 */
export function broadcastFieldReportProgress(wss: WebSocketServer, progress: FieldReportProgress): void {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'field_report_progress',
    data: progress
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Update field report in the database
 */
async function updateFieldReport(reportId: string, data: any): Promise<void> {
  try {
    await db.update(fieldReports)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(fieldReports.reportId, reportId));
  } catch (error) {
    console.error('Error updating field report:', error);
  }
}

/**
 * Generate a field report with AI summary
 */
export async function generateFieldReport(
  input: FieldReportInput, 
  wss: WebSocketServer
): Promise<void> {
  // Generate a unique reportId if not already provided
  const reportId = uuidv4();
  
  // Initial progress state
  let progress: FieldReportProgress = {
    reportId,
    stage: 'gathering_data',
    progress: 0,
    message: 'Starting field report generation'
  };
  
  // Broadcast initial progress
  broadcastFieldReportProgress(wss, progress);
  
  try {
    // Create initial field report in the database
    await createFieldReportInDb(reportId, input);
    
    // Step 1: Gather data
    progress = {
      ...progress,
      progress: 10,
      message: 'Gathering field data...'
    };
    broadcastFieldReportProgress(wss, progress);
    
    // Fetch parcel data
    const parcelData = await fetchParcelData(input.parcelId);
    
    // Step 2: Gather observation data
    progress = {
      ...progress,
      progress: 20,
      stage: 'analyzing',
      message: 'Analyzing field observations...'
    };
    broadcastFieldReportProgress(wss, progress);
    
    // Fetch field observations if observation IDs were provided
    let observationData = null;
    if (input.observations && input.observations.length > 0) {
      observationData = await fetchFieldObservations(input.observations);
    }
    
    // Step 3: Generate AI summary
    progress = {
      ...progress, 
      progress: 40,
      stage: 'generating_summary',
      message: 'Generating AI summary...'
    };
    broadcastFieldReportProgress(wss, progress);
    
    // Prepare context for OpenAI
    const context = {
      parcel: parcelData,
      observations: observationData,
      reportType: input.reportType,
      mediaUrls: input.mediaUrls || []
    };
    
    // Generate the AI summary and analysis using OpenAI
    const prompt = generateAIPrompt(context, input.reportType);
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an agricultural expert providing field reports. Your analysis should be thorough, accurate, and presented in a professional format that's easy to understand. Use markdown formatting for structure." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const aiSummary = completion.choices[0].message.content;
    
    // Step 4: Create recommendations
    progress = {
      ...progress,
      progress: 70,
      stage: 'creating_recommendations',
      message: 'Creating recommendations...'
    };
    broadcastFieldReportProgress(wss, progress);
    
    // Generate recommendations based on the analysis
    const recommendationsCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an agricultural expert providing actionable recommendations based on field analysis. Provide practical, specific recommendations that farmers can implement." },
        { role: "user", content: `Based on the following field analysis, provide 3-5 specific, actionable recommendations for the farmer. Format each recommendation with a clear action title and a brief explanation of why it's important and how to implement it.\n\nField Analysis:\n${aiSummary}` }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const recommendations = recommendationsCompletion.choices[0].message.content;
    
    // Step 5: Finalize report
    progress = {
      ...progress,
      progress: 90,
      stage: 'finalizing',
      message: 'Finalizing report...'
    };
    broadcastFieldReportProgress(wss, progress);
    
    // Combine everything into the final report
    const finalReport = {
      summary: aiSummary,
      recommendations,
      status: 'completed',
      generatedAt: new Date().toISOString(),
      metadata: {
        parcelData: parcelData.name,
        observationCount: observationData ? observationData.length : 0,
        mediaCount: input.mediaUrls ? input.mediaUrls.length : 0,
        reportType: input.reportType
      }
    };
    
    // Update the report in the database
    await updateFieldReport(reportId, {
      summary: aiSummary,
      recommendations: recommendations,
      status: 'completed',
      aiGeneratedContent: JSON.stringify(finalReport),
      completedAt: new Date()
    });
    
    // Step 6: Complete
    progress = {
      ...progress,
      progress: 100,
      stage: 'complete',
      message: 'Field report completed successfully'
    };
    broadcastFieldReportProgress(wss, progress);
    
  } catch (error: unknown) {
    // Handle errors
    console.error('Error generating field report:', error);
    
    // Update progress with error
    progress = {
      ...progress,
      progress: 100,
      stage: 'complete',
      message: 'Error generating field report',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    broadcastFieldReportProgress(wss, progress);
    
    // Update the report in the database with error status
    await updateFieldReport(reportId, {
      status: 'failed',
      completedAt: new Date()
    });
  }
}

/**
 * Fetch parcel data from the database
 */
async function fetchParcelData(parcelId: string): Promise<any> {
  try {
    // Implement actual database fetch
    // For demonstration, return mock data
    return {
      id: parcelId,
      name: `Parcel ${parcelId}`,
      area: 120, // acres
      crop: "Corn",
      soilType: "Sandy loam",
      lastRainfall: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      location: {
        latitude: 40.12345,
        longitude: -95.67890
      },
      plantingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
    };
  } catch (error) {
    console.error('Error fetching parcel data:', error);
    throw new Error('Failed to fetch parcel data');
  }
}

/**
 * Fetch field observations from the database
 */
async function fetchFieldObservations(observationIds: number[]): Promise<any[]> {
  try {
    // Map observations with index for demonstration
    const observations = observationIds.map((obs, index) => ({
      id: obs,
      type: index % 2 === 0 ? 'soil_sample' : 'visual_inspection',
      notes: `Observation #${obs} for field inspection`,
      timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      data: {
        moisture: 35 + (index % 10),
        nitrogen: 45 - (index % 5),
        phosphorus: 20 + (index % 8),
        potassium: 30 + (index % 7)
      }
    }));

    // Aggregate sensor readings by type
    const sensorReadings = observations.reduce((acc, reading) => {
      const type = reading.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(reading);
      return acc;
    }, {});

    // Calculate averages for sensor readings
    let averages = {};
    for (const type in sensorReadings) {
      const readings = sensorReadings[type];
      if (readings.length > 0) {
        const avgData = Object.keys(readings[0].data).reduce((sum, r) => {
          sum[r] = readings.reduce((total, reading) => total + reading.data[r], 0) / readings.length;
          return sum;
        }, {});
        
        averages[type] = {
          count: readings.length,
          averages: avgData
        };
      }
    }

    return observations;
  } catch (error) {
    console.error('Error fetching field observations:', error);
    throw new Error('Failed to fetch field observations');
  }
}

/**
 * Generate the prompt for OpenAI based on the report type and field data
 */
function generateAIPrompt(context: any, reportType: string): string {
  const basePrompt = `
  Generate a detailed agricultural field report based on the following data:
  
  Parcel Information:
  - Name: ${context.parcel.name}
  - Area: ${context.parcel.area} acres
  - Crop: ${context.parcel.crop}
  - Soil Type: ${context.parcel.soilType}
  - Last Rainfall: ${context.parcel.lastRainfall}
  - Planting Date: ${context.parcel.plantingDate}
  
  ${context.observations ? `
  Field Observations:
  ${context.observations.map(obs => 
    `- ${obs.type} (${obs.timestamp}): ${obs.notes}
     Data: Moisture: ${obs.data.moisture}%, Nitrogen: ${obs.data.nitrogen}ppm, Phosphorus: ${obs.data.phosphorus}ppm, Potassium: ${obs.data.potassium}ppm`
  ).join('\n')}` : 'No field observations available.'}
  
  ${context.mediaUrls && context.mediaUrls.length > 0 ? 
    `Media analysis: ${context.mediaUrls.length} images or videos were provided showing the field conditions.` : 
    'No media was provided for analysis.'}
  `;
  
  // Customize the prompt based on the report type
  let specificPrompt = '';
  
  switch (reportType) {
    case 'crop_health':
      specificPrompt = `
        Focus your analysis on the overall health of the ${context.parcel.crop} crop:
        1. Assess the current growth stage and compare to expected progress
        2. Identify any signs of stress or nutrient deficiencies
        3. Evaluate the plant population and uniformity
        4. Analyze the soil moisture conditions and their impact on crop development
      `;
      break;
      
    case 'pest_disease':
      specificPrompt = `
        Focus your analysis on potential pest and disease issues:
        1. Identify any signs of insect damage or presence
        2. Assess disease risk based on current conditions
        3. Evaluate whether any preventative measures should be taken
        4. Recommend monitoring protocols for the coming weeks
      `;
      break;
      
    case 'irrigation':
      specificPrompt = `
        Focus your analysis on irrigation needs and water management:
        1. Evaluate current soil moisture conditions
        2. Estimate crop water use and needs for the coming week
        3. Assess irrigation system efficiency if mentioned
        4. Recommend optimal irrigation scheduling
      `;
      break;
      
    case 'soil_quality':
      specificPrompt = `
        Focus your analysis on soil health and fertility:
        1. Evaluate soil nutrient levels based on test results
        2. Assess soil structure, compaction, and biological activity
        3. Identify any soil-related limitations to crop growth
        4. Recommend soil management practices for improvement
      `;
      break;
      
    case 'yield_estimate':
      specificPrompt = `
        Focus your analysis on yield potential and forecasting:
        1. Estimate current yield potential based on crop conditions
        2. Identify factors that may limit yield
        3. Project final yield range if current conditions continue
        4. Suggest management adjustments to maximize yield
      `;
      break;
      
    case 'comprehensive':
    default:
      specificPrompt = `
        Provide a comprehensive analysis covering all aspects of field management:
        1. Crop health and development stage
        2. Pest and disease risk assessment
        3. Soil fertility and moisture status
        4. Irrigation recommendations
        5. Projected yield potential
        6. Critical management actions needed in the next 7-14 days
      `;
      break;
  }
  
  return `${basePrompt}
  
  ${specificPrompt}
  
  Format your report with the following sections, using markdown formatting:
  1. Summary - Brief overview of field conditions and key findings (2-3 sentences)
  2. Detailed Analysis - In-depth assessment based on the requested report type
  3. Risk Factors - Any concerns or issues that require attention
  4. Action Items - Prioritized list of management actions needed
  
  The farmer needs practical, actionable information they can use to make management decisions.`;
}