import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../temp/uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only accept CSV and Excel files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'));
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

export const importController = {
  // Handler for the file upload
  uploadFile: async (req: Request, res: Response) => {
    try {
      const importType = req.params.type;
      const file = req.file;
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
      
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      // This would be where the actual file processing occurs
      // For now, we'll simulate a successful validation
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation result - in a real app, this would be based on actual file analysis
      const validationResult = {
        valid: true,
        totalRows: 250,
        processedRows: 250,
        issues: [
          {
            row: 12,
            column: 'date',
            value: '2023-13-45',
            message: 'Invalid date format. Expected YYYY-MM-DD.',
            severity: 'error'
          },
          {
            row: 45,
            column: 'soil_ph',
            value: '14.2',
            message: 'Value out of valid range (0-14).',
            severity: 'error'
          },
          {
            row: 78,
            column: 'latitude',
            value: '91.5',
            message: 'Latitude must be between -90 and 90.',
            severity: 'error'
          },
          {
            row: 98,
            column: 'crop_type',
            value: 'wheat2',
            message: 'Unknown crop type. Did you mean "wheat"?',
            severity: 'warning'
          },
          {
            row: 112,
            column: 'field_name',
            value: 'North Field',
            message: 'Duplicate field name.',
            severity: 'warning'
          }
        ],
        summary: {
          errors: 3,
          warnings: 2,
          info: 0
        }
      };
      
      return res.status(200).json(validationResult);
    } catch (error) {
      console.error('Error processing upload:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing file upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Handler for importing validated data
  importData: async (req: Request, res: Response) => {
    try {
      const importType = req.params.type;
      const { validationId } = req.body;
      
      if (!validationId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation ID is required' 
        });
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock import result - in a real app, this would involve database operations
      const importResult = {
        success: true,
        importType,
        recordsImported: 250,
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(importResult);
    } catch (error) {
      console.error('Error importing data:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error importing data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};