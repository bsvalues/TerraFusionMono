import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server URL
const baseUrl = 'http://localhost:5000';

// Test basic crop analysis
async function testBasicAnalysis() {
  console.log('Testing basic crop analysis...');
  
  try {
    // Path to test image - replace with a valid image path
    const imagePath = path.join(__dirname, '../temp/test-crop.jpg');
    
    // Check if the image exists
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found. Creating a placeholder...');
      // Create placeholder if needed for testing
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create empty file for test
      const sampleImagePath = path.join(__dirname, '../client/assets/sample-crop.jpg');
      if (fs.existsSync(sampleImagePath)) {
        fs.copyFileSync(sampleImagePath, imagePath);
      } else {
        console.log('No sample image found. Please provide a test image at:', imagePath);
        return;
      }
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('parcelId', 'test-parcel-1');
    formData.append('latitude', 37.7749);
    formData.append('longitude', -122.4194);
    formData.append('notes', 'Test crop analysis with OpenAI integration');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('Analysis result:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing crop analysis:', error.response?.data || error.message);
  }
}

// Test advanced multi-image analysis
async function testAdvancedAnalysis() {
  console.log('\nTesting advanced multi-image analysis...');
  
  try {
    // Paths to test images
    const imagePath1 = path.join(__dirname, '../temp/test-crop-1.jpg');
    const imagePath2 = path.join(__dirname, '../temp/test-crop-2.jpg');
    
    // Check if images exist
    if (!fs.existsSync(imagePath1) || !fs.existsSync(imagePath2)) {
      console.error('Test images not found. Please provide test images at:', 
        imagePath1, 'and', imagePath2);
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('images', fs.createReadStream(imagePath1));
    formData.append('images', fs.createReadStream(imagePath2));
    formData.append('parcelId', 'test-parcel-1');
    formData.append('cropType', 'corn');
    formData.append('region', 'Central Valley');
    formData.append('elevation', 100);
    formData.append('latitude', 37.7749);
    formData.append('longitude', -122.4194);
    formData.append('temperature', 25);
    formData.append('humidity', 60);
    formData.append('rainfall', 25.4);
    formData.append('recentRainfall', 'Light rain in the past week');
    formData.append('soilType', 'loamy');
    formData.append('soilPh', 6.5);
    formData.append('soilOrganicMatter', 3.2);
    formData.append('notes', 'Advanced test with multiple images and soil data');
    
    // Send request
    const response = await axios.post(`${baseUrl}/api/crop-analysis/advanced-analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('Advanced analysis result:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing advanced analysis:', error.response?.data || error.message);
  }
}

// Test recommendations
async function testRecommendations() {
  console.log('\nTesting crop care recommendations...');
  
  try {
    const data = {
      cropType: 'corn',
      healthIssues: ['nitrogen deficiency', 'leaf spots'],
      historicalData: 'Previous season showed similar nitrogen issues in early growth stages'
    };
    
    const response = await axios.post(`${baseUrl}/api/crop-analysis/recommendations`, data);
    
    console.log('Recommendations:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing recommendations:', error.response?.data || error.message);
  }
}

// Test yield prediction
async function testYieldPrediction() {
  console.log('\nTesting yield prediction...');
  
  try {
    const data = {
      cropType: 'corn',
      healthStatus: 'good',
      environmentalConditions: 'Moderate rainfall, average temperatures, no extreme weather events expected',
      historicalYields: 'Last season: 180 bushels/acre, 5-year average: 175 bushels/acre'
    };
    
    const response = await axios.post(`${baseUrl}/api/crop-analysis/predict-yield`, data);
    
    console.log('Yield prediction:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing yield prediction:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  // Test basic analysis
  await testBasicAnalysis();
  
  // Uncomment to run other tests
  // await testAdvancedAnalysis();
  await testRecommendations();
  await testYieldPrediction();
}

runTests();