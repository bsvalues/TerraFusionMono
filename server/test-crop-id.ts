import { cropIdentificationService } from './services/cropIdentification';
import fs from 'fs';
import path from 'path';

// A simple test script to verify the crop identification service works

async function testCropIdentification() {
  try {
    // Replace this with the path to a test image
    const imagePath = process.argv[2] || path.join(__dirname, '../test-crop-image.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: Test image not found at ${imagePath}`);
      console.log('Usage: tsx server/test-crop-id.ts [path-to-image]');
      return;
    }
    
    console.log(`Reading image from ${imagePath}`);
    
    // Read the image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Identifying crop...');
    
    // Call the identification service
    const result = await cropIdentificationService.identifyCrop(base64Image);
    
    console.log('\nIdentification Result:');
    console.log('====================');
    console.log(`Crop: ${result.cropName}`);
    console.log(`Scientific Name: ${result.scientificName}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Growth Stage: ${result.estimatedGrowthStage}`);
    console.log(`Details: ${result.details}`);
    console.log('Characteristics:');
    result.characteristics.forEach(char => console.log(`- ${char}`));
    if (result.possibleAlternatives.length > 0) {
      console.log('Possible Alternatives:');
      result.possibleAlternatives.forEach(alt => console.log(`- ${alt}`));
    }
    
  } catch (error) {
    console.error('Error testing crop identification:');
    console.error(error);
  }
}

// Run the test
testCropIdentification();