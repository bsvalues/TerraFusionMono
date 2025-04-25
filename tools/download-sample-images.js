import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URLs for sample crop images (public domain)
const SAMPLE_IMAGES = [
  {
    url: 'https://www.publicdomainpictures.net/pictures/60000/velka/wheat-field-1378919120jTY.jpg',
    path: '../temp/test-crop.jpg',
    name: 'wheat field'
  },
  {
    url: 'https://www.publicdomainpictures.net/pictures/250000/velka/corn-field-1515965627Iqa.jpg',
    path: '../temp/test-crop-1.jpg',
    name: 'corn field 1'
  },
  {
    url: 'https://www.publicdomainpictures.net/pictures/270000/velka/corn-field-1536755090WtB.jpg',
    path: '../temp/test-crop-2.jpg',
    name: 'corn field 2'
  }
];

async function downloadImages() {
  console.log('Downloading sample crop images for testing...');
  
  // Create temp directory if needed
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Download each image
  for (const image of SAMPLE_IMAGES) {
    try {
      const imagePath = path.join(__dirname, image.path);
      console.log(`Downloading ${image.name} to ${imagePath}...`);
      
      const response = await axios({
        method: 'GET',
        url: image.url,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`Successfully downloaded ${image.name}`);
    } catch (error) {
      console.error(`Error downloading ${image.name}:`, error.message);
    }
  }
  
  console.log('Finished downloading sample images.');
}

downloadImages();