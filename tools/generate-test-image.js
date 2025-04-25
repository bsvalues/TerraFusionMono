import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a simple test image for crop analysis testing
 */
function generateTestImage() {
  // Create a simple SVG image as a placeholder for crop images
  const svgContent = `
  <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <!-- Background representing soil -->
    <rect width="800" height="600" fill="#8B4513" />
    
    <!-- Sky -->
    <rect width="800" height="200" fill="#87CEEB" />
    
    <!-- Sun -->
    <circle cx="700" cy="100" r="60" fill="#FFD700" />
    
    <!-- Grass field -->
    <rect width="800" height="400" y="200" fill="#228B22" />
    
    <!-- Crop rows -->
    <g fill="#006400">
      ${Array.from({ length: 8 }).map((_, i) => 
        `<rect x="50" y="${250 + i * 40}" width="700" height="20" />`
      ).join('')}
    </g>
    
    <!-- Individual crop plants -->
    <g fill="#32CD32">
      ${Array.from({ length: 30 }).map((_, i) => {
        const x = 80 + (i % 10) * 70;
        const y = 260 + Math.floor(i / 10) * 120;
        return `
          <circle cx="${x}" cy="${y}" r="15" />
          <line x1="${x}" y1="${y-15}" x2="${x}" y2="${y-35}" stroke="#32CD32" stroke-width="3" />
          <line x1="${x-10}" y1="${y-20}" x2="${x+10}" y2="${y-30}" stroke="#32CD32" stroke-width="2" />
          <line x1="${x+10}" y1="${y-20}" x2="${x-10}" y2="${y-30}" stroke="#32CD32" stroke-width="2" />
        `;
      }).join('')}
    </g>
    
    <!-- Add a yellow spot to simulate disease on one plant -->
    <circle cx="220" cy="380" r="8" fill="#FFD700" />
    
    <!-- Add brown spots to simulate drought stress -->
    <g fill="#8B4513" opacity="0.7">
      <circle cx="430" cy="260" r="5" />
      <circle cx="440" cy="270" r="4" />
      <circle cx="420" cy="265" r="3" />
    </g>
    
    <!-- Add text label -->
    <text x="400" y="550" font-family="Arial" font-size="24" text-anchor="middle" fill="white">
      Test Crop Image for TerraFusion Analysis
    </text>
  </svg>
  `;
  
  // Convert SVG to buffer
  const svgBuffer = Buffer.from(svgContent);
  
  // Create test images directory if it doesn't exist
  const testImagesDir = path.join(__dirname, '../temp/test-images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }
  
  // Save as crop-test.svg
  const svgPath = path.join(testImagesDir, 'crop-test.svg');
  fs.writeFileSync(svgPath, svgBuffer);
  
  // Also create a simple sample crop image for testing
  const svgPath2 = path.join(testImagesDir, 'test-crop.svg');
  fs.writeFileSync(svgPath2, svgBuffer);
  
  // Convert to base64 for API testing
  const svgBase64 = svgBuffer.toString('base64');
  
  // Save base64 version to a file for easy access in tests
  const base64Path = path.join(testImagesDir, 'crop-test-base64.txt');
  fs.writeFileSync(base64Path, svgBase64);
  
  console.log(`Generated test images at ${testImagesDir}`);
  console.log(`  - SVG image: ${svgPath}`);
  console.log(`  - Sample crop image: ${svgPath2}`);
  console.log(`  - Base64 representation: ${base64Path}`);
  
  return {
    svgPath,
    svgPath2,
    base64Path,
    base64: svgBase64
  };
}

// Generate the test image
generateTestImage();