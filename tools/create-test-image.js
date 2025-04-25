import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory if needed
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create test images with colors that suggest crops
function createWheatImage() {
  const wheat = {
    width: 400,
    height: 300,
    data: Buffer.alloc(400 * 300 * 3),
  };

  // Fill with golden yellow color (for wheat field)
  for (let i = 0; i < wheat.data.length; i += 3) {
    // Golden yellow (RGB: 218, 165, 32)
    wheat.data[i] = 218;     // Red
    wheat.data[i + 1] = 165; // Green
    wheat.data[i + 2] = 32;  // Blue
  }

  // Add some vertical lines for wheat stalks
  for (let x = 20; x < wheat.width; x += 15) {
    for (let y = 50; y < wheat.height; y++) {
      const i = (y * wheat.width + x) * 3;
      // Darker yellow-brown
      wheat.data[i] = 139;     // Red
      wheat.data[i + 1] = 101; // Green
      wheat.data[i + 2] = 8;   // Blue
    }
  }

  // Write to a raw PPM file (a simple image format)
  const ppmHeader = `P6
${wheat.width} ${wheat.height}
255
`;
  
  const wheatFile = path.join(tempDir, 'test-crop.ppm');
  fs.writeFileSync(wheatFile, ppmHeader);
  fs.appendFileSync(wheatFile, wheat.data);
  
  console.log(`Created wheat test image at ${wheatFile}`);
  return wheatFile;
}

function createCornImage() {
  const corn = {
    width: 400,
    height: 300,
    data: Buffer.alloc(400 * 300 * 3),
  };

  // Fill with green color (for corn field)
  for (let i = 0; i < corn.data.length; i += 3) {
    // Green (RGB: 76, 153, 0)
    corn.data[i] = 76;      // Red
    corn.data[i + 1] = 153;  // Green
    corn.data[i + 2] = 0;    // Blue
  }

  // Add some vertical lines for corn stalks
  for (let x = 30; x < corn.width; x += 25) {
    for (let y = 30; y < corn.height; y++) {
      const i = (y * corn.width + x) * 3;
      // Darker green
      corn.data[i] = 0;       // Red
      corn.data[i + 1] = 100; // Green
      corn.data[i + 2] = 0;   // Blue
    }
  }

  // Write to a raw PPM file
  const ppmHeader = `P6
${corn.width} ${corn.height}
255
`;
  
  const cornFile = path.join(tempDir, 'test-crop-1.ppm');
  fs.writeFileSync(cornFile, ppmHeader);
  fs.appendFileSync(cornFile, corn.data);
  
  console.log(`Created corn test image at ${cornFile}`);
  return cornFile;
}

// Create sample images
try {
  createWheatImage();
  createCornImage();
  console.log('Test images created successfully');
} catch (error) {
  console.error('Error creating test images:', error);
}