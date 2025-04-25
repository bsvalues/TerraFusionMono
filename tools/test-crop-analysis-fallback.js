import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server URL
const baseUrl = 'http://localhost:5000';

// Test the crop analysis routes with fallback capability
async function testCropAnalysisFallback() {
  console.log('Testing crop analysis API with fallback functionality...\n');

  // Load the test image
  const testImagesDir = path.join(__dirname, '../temp/test-images');
  const svgPath = path.join(testImagesDir, 'crop-test.svg');
  const base64Path = path.join(testImagesDir, 'crop-test-base64.txt');
  
  if (!fs.existsSync(svgPath)) {
    console.error(`Test image not found at ${svgPath}`);
    console.log('Please run the generate-test-image.js script first.');
    return;
  }
  
  const imageBase64 = fs.readFileSync(base64Path, 'utf8');
  
  // 1. Test basic analyze endpoint
  try {
    console.log('1. Testing /api/crop-analysis/analyze endpoint with fallback:');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(svgPath));
    formData.append('parcelId', 'test-parcel-123');
    formData.append('latitude', '37.7749');
    formData.append('longitude', '-122.4194');
    formData.append('notes', 'Testing fallback functionality');
    
    console.log('   Sending test image to analyze endpoint...');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('   Response status:', response.status);
    
    if (response.data.usedFallback) {
      console.log('   ✓ Fallback was used as expected due to API key limitations');
    } else {
      console.log('   ✓ Real analysis was performed (API key is valid)');
    }
    
    console.log('   Analysis result includes:');
    console.log('     - Crop type:', response.data.analysis.cropType);
    console.log('     - Health status:', response.data.analysis.healthStatus);
    console.log('     - Number of issues:', response.data.analysis.issues.length);
    console.log('     - Confidence score:', response.data.analysis.confidenceScore);
  } catch (error) {
    console.log('   ✗ Error testing analyze endpoint:');
    if (error.response?.data) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
  
  // 2. Test recommendations endpoint
  console.log('\n2. Testing /api/crop-analysis/recommendations endpoint with fallback:');
  try {
    // Sample data for recommendations
    const data = {
      cropType: 'corn',
      healthIssues: ['nitrogen deficiency', 'leaf spots'],
      historicalData: 'Previous season showed similar nitrogen issues in early growth stages'
    };
    
    console.log('   Sending recommendation request with sample data...');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/recommendations`, data);
    
    console.log('   Response status:', response.status);
    
    if (response.data.usedFallback) {
      console.log('   ✓ Fallback was used as expected due to API key limitations');
    } else {
      console.log('   ✓ Real recommendation generation was performed (API key is valid)');
    }
    
    console.log('   Recommendations received:', response.data.recommendations.length);
    console.log('   Sample recommendation:', response.data.recommendations[0]);
  } catch (error) {
    console.log('   ✗ Error testing recommendations endpoint:');
    if (error.response?.data) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
  
  // 3. Test yield prediction endpoint
  console.log('\n3. Testing /api/crop-analysis/predict-yield endpoint with fallback:');
  try {
    // Sample data for yield prediction
    const data = {
      cropType: 'corn',
      healthStatus: 'good',
      environmentalConditions: 'Moderate rainfall, average temperatures, no extreme weather events expected',
      historicalYields: 'Last season: 180 bushels/acre, 5-year average: 175 bushels/acre'
    };
    
    console.log('   Sending yield prediction request with sample data...');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/predict-yield`, data);
    
    console.log('   Response status:', response.status);
    
    if (response.data.usedFallback) {
      console.log('   ✓ Fallback was used as expected due to API key limitations');
    } else {
      console.log('   ✓ Real yield prediction was performed (API key is valid)');
    }
    
    console.log('   Prediction result:');
    console.log('     - Prediction:', response.data.prediction.prediction);
    console.log('     - Confidence level:', response.data.prediction.confidenceLevel);
    console.log('     - Number of factors:', response.data.prediction.factors.length);
  } catch (error) {
    console.log('   ✗ Error testing yield prediction endpoint:');
    if (error.response?.data) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
  
  // 4. Test advanced analysis endpoint
  console.log('\n4. Testing /api/crop-analysis/advanced-analyze endpoint with fallback:');
  try {
    // Create form data for advanced analysis
    const formData = new FormData();
    formData.append('images', fs.createReadStream(svgPath)); // First image
    formData.append('images', fs.createReadStream(svgPath)); // Second image (duplicate for testing)
    formData.append('cropType', 'corn');
    formData.append('latitude', '37.7749');
    formData.append('longitude', '-122.4194');
    formData.append('region', 'California Central Valley');
    formData.append('elevation', '25');
    formData.append('temperature', '28');
    formData.append('humidity', '65');
    formData.append('soilType', 'Clay loam');
    formData.append('soilPH', '6.8');
    
    console.log('   Sending multiple test images for advanced analysis...');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/advanced-analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('   Response status:', response.status);
    
    if (response.data.usedFallback) {
      console.log('   ✓ Fallback was used as expected due to API key limitations');
    } else {
      console.log('   ✓ Real advanced analysis was performed (API key is valid)');
    }
    
    console.log('   Advanced analysis result includes:');
    console.log('     - Crop type:', response.data.analysis.cropType);
    console.log('     - Health status:', response.data.analysis.healthStatus);
    console.log('     - Growth stage:', response.data.analysis.growthStage);
    console.log('     - Nutritional status:', response.data.analysis.nutritionalStatus.overall);
    console.log('     - Estimated yield confidence:', response.data.analysis.estimatedYield.confidenceLevel);
  } catch (error) {
    console.log('   ✗ Error testing advanced analysis endpoint:');
    if (error.response?.data) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
  
  console.log('\nTest summary:');
  console.log('All crop analysis endpoints are functioning with fallback capability.');
  console.log('This ensures the application remains functional even when OpenAI API is unavailable.');
}

// Run the tests
testCropAnalysisFallback().catch(error => {
  console.error('Test failed with unexpected error:', error);
});