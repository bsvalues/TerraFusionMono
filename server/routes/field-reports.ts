import { Router, Request, Response } from "express";
import { db } from "../db";
import { v4 as uuidv4 } from "uuid";
import { fieldReports, fieldReportTypeEnum, insertFieldReportSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateFieldReport } from "../services/ai/field-report-generator";

// Define session extension for Express Request type
declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: number;
      }
    }
  }
}

const router = Router();

// Validation schema for field report creation
const createFieldReportSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  title: z.string().min(1, "Title is required"),
  reportType: z.enum([
    'crop_health', 
    'pest_disease', 
    'irrigation', 
    'soil_quality', 
    'yield_estimate', 
    'comprehensive'
  ]).default('comprehensive'),
  mediaUrls: z.array(z.string()).optional(),
  observations: z.array(z.number()).optional(),
});

/**
 * Get all field reports for a user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reports = await db
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.userId, req.session.userId))
      .orderBy(fieldReports.createdAt);

    return res.json({ reports });
  } catch (error) {
    console.error("Error fetching field reports:", error);
    return res.status(500).json({ message: "Failed to fetch field reports" });
  }
});

/**
 * Get field reports for a specific parcel
 */
router.get("/parcel/:parcelId", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { parcelId } = req.params;
    
    const reports = await db
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.parcelId, parcelId))
      .orderBy(fieldReports.createdAt);
    
    return res.json({ reports });
  } catch (error) {
    console.error("Error fetching parcel field reports:", error);
    return res.status(500).json({ message: "Failed to fetch field reports for the parcel" });
  }
});

/**
 * Get a specific field report by ID
 */
router.get("/:reportId", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { reportId } = req.params;
    
    const [report] = await db
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.reportId, reportId));
    
    if (!report) {
      return res.status(404).json({ message: "Field report not found" });
    }
    
    return res.json({ report });
  } catch (error) {
    console.error("Error fetching field report:", error);
    return res.status(500).json({ message: "Failed to fetch field report" });
  }
});

/**
 * Create a new field report with AI summary (one-tap generation)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate request data
    const validationResult = createFieldReportSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }
    
    const { parcelId, title, reportType, mediaUrls, observations } = validationResult.data;

    // Generate a unique reportId
    const reportId = uuidv4();

    // For immediate response (the real processing will happen asynchronously)
    const initialReport = {
      reportId,
      parcelId,
      userId: req.session.userId,
      title,
      reportType,
      status: 'in_progress',
      createdAt: new Date().toISOString()
    };

    // Start the AI report generation process asynchronously
    generateFieldReport({
      parcelId,
      userId: req.session.userId,
      title,
      reportType,
      mediaUrls,
      observations
    }, req.app.locals.wss).catch(err => {
      console.error("Error in async field report generation:", err);
    });

    return res.status(202).json({ 
      message: "Field report generation initiated", 
      report: initialReport
    });
  } catch (error) {
    console.error("Error creating field report:", error);
    return res.status(500).json({ message: "Failed to create field report" });
  }
});

/**
 * Update an existing field report
 */
router.patch("/:reportId", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { reportId } = req.params;
    
    // Fetch the report to check ownership
    const [existingReport] = await db
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.reportId, reportId));
    
    if (!existingReport) {
      return res.status(404).json({ message: "Field report not found" });
    }
    
    if (existingReport.userId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to update this report" });
    }
    
    // Validate update data
    const updateFieldReportSchema = z.object({
      title: z.string().optional(),
      isPublic: z.boolean().optional(),
      yDocData: z.string().optional()
    });
    
    const validationResult = updateFieldReportSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid update data", 
        errors: validationResult.error.errors 
      });
    }
    
    // Update the report
    const [updatedReport] = await db
      .update(fieldReports)
      .set({
        ...validationResult.data,
        updatedAt: new Date()
      })
      .where(eq(fieldReports.reportId, reportId))
      .returning();
    
    return res.json({ report: updatedReport });
  } catch (error) {
    console.error("Error updating field report:", error);
    return res.status(500).json({ message: "Failed to update field report" });
  }
});

/**
 * Delete a field report
 */
router.delete("/:reportId", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { reportId } = req.params;
    
    // Fetch the report to check ownership
    const [existingReport] = await db
      .select()
      .from(fieldReports)
      .where(eq(fieldReports.reportId, reportId));
    
    if (!existingReport) {
      return res.status(404).json({ message: "Field report not found" });
    }
    
    if (existingReport.userId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to delete this report" });
    }
    
    // Delete the report
    await db
      .delete(fieldReports)
      .where(eq(fieldReports.reportId, reportId));
    
    return res.json({ message: "Field report deleted successfully" });
  } catch (error) {
    console.error("Error deleting field report:", error);
    return res.status(500).json({ message: "Failed to delete field report" });
  }
});

export default router;