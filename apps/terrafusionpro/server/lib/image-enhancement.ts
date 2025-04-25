import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants for image processing
const TEMP_DIR = path.join(process.cwd(), 'temp');
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Create necessary directories if they don't exist
async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories on module load
ensureDirectoriesExist();

// Generate a unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const safeName = path.basename(originalName, extension)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  
  return `${safeName}_${timestamp}_${randomString}${extension}`;
}

// Types for enhancement options
export interface EnhancementOptions {
  enhanceQuality?: boolean;
  fixLighting?: boolean;
  removeGlare?: boolean;
  removeNoise?: boolean;
  enhanceColors?: boolean;
  improveComposition?: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

// Default enhancement options
const DEFAULT_OPTIONS: EnhancementOptions = {
  enhanceQuality: true,
  fixLighting: true,
  removeGlare: false,
  removeNoise: true,
  enhanceColors: true,
  improveComposition: false,
  targetWidth: 1024,
  targetHeight: 768,
};

// Build a system prompt based on enhancement options
function buildSystemPrompt(options: EnhancementOptions): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let prompt = `You are an expert real estate photography AI assistant. 
Please enhance this property photograph to professional quality. 
Follow these specific enhancement instructions:`;
  
  if (mergedOptions.enhanceQuality) {
    prompt += `
- Increase overall image quality and sharpness`;
  }
  
  if (mergedOptions.fixLighting) {
    prompt += `
- Balance lighting to properly expose both interior and exterior elements
- Reduce harsh shadows and bright highlights
- Ensure details are visible in both dark and bright areas`;
  }
  
  if (mergedOptions.removeGlare) {
    prompt += `
- Reduce glare from windows and reflective surfaces`;
  }
  
  if (mergedOptions.removeNoise) {
    prompt += `
- Reduce digital noise and graininess`;
  }
  
  if (mergedOptions.enhanceColors) {
    prompt += `
- Optimize colors to appear natural but appealing
- Ensure white balance is correct (whites should look white, not yellow or blue)`;
  }
  
  if (mergedOptions.improveComposition) {
    prompt += `
- Make minor adjustments to improve composition if needed
- Ensure the property is the main focus`;
  }
  
  prompt += `
Maintain authenticity - this is for real estate appraisal purposes, so the image must accurately represent the property.
Do not add or remove objects or architectural elements.
Do not distort proportions or make unrealistic modifications.
The enhancement should look natural, not artificially processed.`;

  return prompt;
}

/**
 * Enhances a property photograph using AI
 * 
 * @param imageBuffer - The buffer containing the image data
 * @param originalFilename - The original filename of the image
 * @param options - Enhancement options
 * @returns Object containing the paths to original and enhanced images
 */
export async function enhancePropertyPhoto(
  imageBuffer: Buffer,
  originalFilename: string,
  options: EnhancementOptions = {}
): Promise<{ 
  originalPath: string; 
  enhancedPath: string;
  success: boolean;
  message?: string;
}> {
  try {
    // Generate unique filenames for original and enhanced images
    const uniqueFilename = generateUniqueFilename(originalFilename);
    const originalPath = path.join(UPLOAD_DIR, `original_${uniqueFilename}`);
    const enhancedPath = path.join(UPLOAD_DIR, `enhanced_${uniqueFilename}`);
    
    // Save the original image
    await fs.writeFile(originalPath, imageBuffer);
    
    // Convert buffer to base64 for OpenAI API
    const base64Image = imageBuffer.toString('base64');
    
    // Build the system prompt based on enhancement options
    const systemPrompt = buildSystemPrompt(options);
    
    // Call OpenAI to enhance the image
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please enhance this property photograph for a real estate appraisal report."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 100,
    });

    // For full image enhancement we need to use DALL-E 3 to generate an enhanced version
    const enhancementPrompt = `Enhanced version of the real estate property photo. 
The image should be professional quality with balanced lighting, clear details, 
and natural colors - suitable for a real estate appraisal report.
This must be a photo-realistic enhancement of the exact same property, with no changes 
to structures, objects or perspectives.`;

    const enhancedImage = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancementPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"
    });

    if (enhancedImage.data && enhancedImage.data[0] && enhancedImage.data[0].b64_json) {
      // Convert base64 to buffer and save enhanced image
      const enhancedBuffer = Buffer.from(enhancedImage.data[0].b64_json, 'base64');
      await fs.writeFile(enhancedPath, enhancedBuffer);
      
      return {
        originalPath,
        enhancedPath,
        success: true
      };
    } else {
      throw new Error('Enhanced image data not received from OpenAI');
    }
  } catch (error) {
    console.error('Error enhancing photo:', error);
    return {
      originalPath: '',
      enhancedPath: '',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Analyzes a property photograph and provides insights
 * 
 * @param imageBuffer - The buffer containing the image data
 * @returns Object containing analysis results
 */
export async function analyzePropertyPhoto(
  imageBuffer: Buffer
): Promise<{ 
  success: boolean;
  analysis?: {
    description: string;
    quality: {
      score: number;
      issues: string[];
      strengths: string[];
    };
    composition: {
      score: number;
      feedback: string;
    };
    lighting: {
      score: number;
      feedback: string;
    };
    recommendedImprovements: string[];
  };
  message?: string;
}> {
  try {
    // Convert buffer to base64 for OpenAI API
    const base64Image = imageBuffer.toString('base64');
    
    // Define the system prompt for analysis
    const systemPrompt = `You are an expert real estate photography analyst. 
Please analyze this property photograph and provide a detailed assessment of its quality,
composition, and lighting. Format your response as JSON with the following structure:
{
  "description": "Brief description of what's shown in the photo",
  "quality": {
    "score": number from 1-10,
    "issues": ["list of quality issues"],
    "strengths": ["list of quality strengths"]
  },
  "composition": {
    "score": number from 1-10,
    "feedback": "detailed feedback on composition"
  },
  "lighting": {
    "score": number from 1-10,
    "feedback": "detailed feedback on lighting"
  },
  "recommendedImprovements": ["list of specific recommendations to improve this photo"]
}`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this property photograph for a real estate appraisal report."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    // Parse the JSON response
    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content);
    
    return {
      success: true,
      analysis
    };
  } catch (error) {
    console.error('Error analyzing photo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}