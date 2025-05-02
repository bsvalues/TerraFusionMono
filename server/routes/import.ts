import express from 'express';
import { importController, upload } from '../import-controller';

const router = express.Router();

// Route for uploading and validating import files
router.post('/:type/upload', upload.single('file'), importController.uploadFile);

// Route for finalizing the import after validation
router.post('/:type/import', importController.importData);

export default router;