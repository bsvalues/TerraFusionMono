#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to encode an image file to base64
function encodeImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error(`Error reading image file: ${error.message}`);
    process.exit(1);
  }
}

// Function to analyze crop health using the API
async function analyzeCropHealthDirectly(base64Image) {
  console.log('Analyzing crop health directly with OpenAI API...');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model as of May 2024
      messages: [
        {
          role: "system",
          content: `You are an expert agricultural analyst. Analyze the provided crop image and return a detailed analysis in JSON format with the following structure:
          {
            "cropType": "crop name",
            "healthStatus": "excellent|good|moderate|poor|critical",
            "issues": [
              {
                "name": "issue name",
                "description": "detailed description",
                "severity": 0-10 (scale),
                "recommendedActions": ["action 1", "action 2"]
              }
            ],
            "overallAssessment": "summary of findings",
            "confidenceScore": 0.0-1.0
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this crop image and provide a detailed health assessment:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse and print the analysis result
    const analysisResult = JSON.parse(response.choices[0].message.content);
    console.log('Analysis Result:');
    console.log(JSON.stringify(analysisResult, null, 2));
    
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing crop health:', error);
  }
}

// Function to test our API endpoint
async function testCropAnalysisEndpoint(imagePath) {
  console.log('Testing crop analysis endpoint...');
  
  try {
    // Create form data with the image
    const FormData = require('form-data');
    const axios = require('axios');
    
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('notes', 'Test notes for crop analysis');
    
    // Call our API endpoint
    const response = await axios.post('http://localhost:5000/api/crop-analysis/analyze', form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing crop analysis endpoint:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  // Check if an image path was provided
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('Please provide an image path.');
    console.log('Usage: node test-openai.js <path-to-image>');
    process.exit(1);
  }
  
  // Resolve the image path
  const resolvedImagePath = path.resolve(imagePath);
  
  // Check if the file exists
  if (!fs.existsSync(resolvedImagePath)) {
    console.error(`Image file not found: ${resolvedImagePath}`);
    process.exit(1);
  }
  
  console.log(`Using image: ${resolvedImagePath}`);
  
  // Encode the image to base64
  const base64Image = encodeImageToBase64(resolvedImagePath);
  
  // Test options
  const useApiEndpoint = process.argv.includes('--api');
  
  if (useApiEndpoint) {
    // Test our API endpoint
    await testCropAnalysisEndpoint(resolvedImagePath);
  } else {
    // Analyze crop health directly
    await analyzeCropHealthDirectly(base64Image);
  }
}

// Run the main function
main().catch(console.error);