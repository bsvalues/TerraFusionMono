import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server URL
const baseUrl = 'http://localhost:5000';

// Function to validate that routes exist and receive requests properly
async function validateRoutes() {
  console.log('Validating crop analysis API routes...');
  
  // Array to track results
  const results = [];
  
  // 1. Validate basic analyze endpoint
  try {
    const imagePath = path.join(__dirname, '../temp/test-crop.jpg');
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Test image not found at ${imagePath}`);
    }
    
    // Create form data - only testing basic required fields
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    
    // Send a HEAD request to verify route exists
    await axios.options(`${baseUrl}/api/crop-analysis/analyze`);
    results.push({ route: '/api/crop-analysis/analyze', status: 'Available' });
  } catch (error) {
    const status = error.response?.status || 'Unknown error';
    results.push({ 
      route: '/api/crop-analysis/analyze', 
      status: `Failed: ${status}`, 
      message: error.message 
    });
  }
  
  // 2. Validate advanced analyze endpoint
  try {
    // Send a HEAD request to verify route exists
    await axios.options(`${baseUrl}/api/crop-analysis/advanced-analyze`);
    results.push({ route: '/api/crop-analysis/advanced-analyze', status: 'Available' });
  } catch (error) {
    const status = error.response?.status || 'Unknown error';
    results.push({ 
      route: '/api/crop-analysis/advanced-analyze', 
      status: `Failed: ${status}`, 
      message: error.message 
    });
  }
  
  // 3. Validate recommendations endpoint
  try {
    // Send a HEAD request to verify route exists 
    await axios.options(`${baseUrl}/api/crop-analysis/recommendations`);
    results.push({ route: '/api/crop-analysis/recommendations', status: 'Available' });
  } catch (error) {
    const status = error.response?.status || 'Unknown error';
    results.push({ 
      route: '/api/crop-analysis/recommendations', 
      status: `Failed: ${status}`, 
      message: error.message 
    });
  }
  
  // 4. Validate predict-yield endpoint
  try {
    // Send a HEAD request to verify route exists
    await axios.options(`${baseUrl}/api/crop-analysis/predict-yield`);
    results.push({ route: '/api/crop-analysis/predict-yield', status: 'Available' });
  } catch (error) {
    const status = error.response?.status || 'Unknown error';
    results.push({ 
      route: '/api/crop-analysis/predict-yield', 
      status: `Failed: ${status}`, 
      message: error.message 
    });
  }
  
  // Print results
  console.log('\nRoute Validation Results:');
  console.table(results);
  
  // Summary
  const available = results.filter(r => r.status === 'Available').length;
  const failed = results.length - available;
  
  console.log(`\nSummary: ${available} routes available, ${failed} failed`);
  if (failed === 0) {
    console.log('✅ All crop analysis routes are properly registered and accessible');
  } else {
    console.log('❌ Some routes are not accessible. Check implementation.');
  }
}

// Run validation
validateRoutes().catch(error => {
  console.error('Validation failed with error:', error);
});