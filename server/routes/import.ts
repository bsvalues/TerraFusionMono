import { Router } from 'express';
import { upload, importController } from '../import-controller';

const router = Router();

// Route for uploading files
router.post('/:type/upload', upload.single('file'), importController.uploadFile);

// Route for importing validated data
router.post('/:type/import', importController.importData);

// Test route to verify the API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Import API is working',
    endpoints: {
      upload: '/api/import/:type/upload',
      import: '/api/import/:type/import'
    }
  });
});

export default router;