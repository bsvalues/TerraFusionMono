import { db } from './db';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema';
import type { 
  IStorage, 
  FileImportResult,
  FileImportResultUpdate,
  InsertFileImportResult
} from './storage';

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(userData: schema.InsertUser) {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  // Property methods
  async createProperty(propertyData: schema.InsertProperty) {
    const [property] = await db.insert(schema.properties).values(propertyData).returning();
    return property;
  }

  async getProperty(id: number) {
    const [property] = await db.select().from(schema.properties).where(eq(schema.properties.id, id));
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<schema.InsertProperty>) {
    const [updatedProperty] = await db
      .update(schema.properties)
      .set(propertyData)
      .where(eq(schema.properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number) {
    await db.delete(schema.properties).where(eq(schema.properties.id, id));
  }

  async getPropertiesByUserId(userId: number) {
    return await db.select().from(schema.properties).where(eq(schema.properties.userId, userId));
  }

  // Appraisal report methods
  async createAppraisalReport(reportData: schema.InsertAppraisalReport) {
    const [report] = await db.insert(schema.appraisalReports).values(reportData).returning();
    return report;
  }

  async getAppraisalReport(id: number) {
    const [report] = await db.select().from(schema.appraisalReports).where(eq(schema.appraisalReports.id, id));
    return report;
  }

  async updateAppraisalReport(id: number, reportData: Partial<schema.InsertAppraisalReport>) {
    const [updatedReport] = await db
      .update(schema.appraisalReports)
      .set(reportData)
      .where(eq(schema.appraisalReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteAppraisalReport(id: number) {
    await db.delete(schema.appraisalReports).where(eq(schema.appraisalReports.id, id));
  }

  async getAppraisalReportsByUserId(userId: number) {
    return await db.select().from(schema.appraisalReports).where(eq(schema.appraisalReports.userId, userId));
  }

  async getAppraisalReportsByPropertyId(propertyId: number) {
    return await db.select().from(schema.appraisalReports).where(eq(schema.appraisalReports.propertyId, propertyId));
  }

  // Comparable methods
  async createComparable(comparableData: schema.InsertComparable) {
    const [comparable] = await db.insert(schema.comparables).values(comparableData).returning();
    return comparable;
  }

  async getComparable(id: number) {
    const [comparable] = await db.select().from(schema.comparables).where(eq(schema.comparables.id, id));
    return comparable;
  }

  async updateComparable(id: number, comparableData: Partial<schema.InsertComparable>) {
    const [updatedComparable] = await db
      .update(schema.comparables)
      .set(comparableData)
      .where(eq(schema.comparables.id, id))
      .returning();
    return updatedComparable;
  }

  async deleteComparable(id: number) {
    await db.delete(schema.comparables).where(eq(schema.comparables.id, id));
  }

  async getComparablesByReportId(reportId: number) {
    return await db.select().from(schema.comparables).where(eq(schema.comparables.reportId, reportId));
  }

  // Adjustment methods
  async createAdjustment(adjustmentData: schema.InsertAdjustment) {
    const [adjustment] = await db.insert(schema.adjustments).values(adjustmentData).returning();
    return adjustment;
  }

  async getAdjustment(id: number) {
    const [adjustment] = await db.select().from(schema.adjustments).where(eq(schema.adjustments.id, id));
    return adjustment;
  }

  async updateAdjustment(id: number, adjustmentData: Partial<schema.InsertAdjustment>) {
    const [updatedAdjustment] = await db
      .update(schema.adjustments)
      .set(adjustmentData)
      .where(eq(schema.adjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number) {
    await db.delete(schema.adjustments).where(eq(schema.adjustments.id, id));
  }

  async getAdjustmentsByReportId(reportId: number) {
    return await db.select().from(schema.adjustments).where(eq(schema.adjustments.reportId, reportId));
  }

  async getAdjustmentsByComparableId(comparableId: number) {
    return await db.select().from(schema.adjustments).where(eq(schema.adjustments.comparableId, comparableId));
  }

  // Photo methods
  async createPhoto(photoData: schema.InsertPhoto) {
    const [photo] = await db.insert(schema.photos).values(photoData).returning();
    return photo;
  }

  async getPhoto(id: number) {
    const [photo] = await db.select().from(schema.photos).where(eq(schema.photos.id, id));
    return photo;
  }

  async deletePhoto(id: number) {
    await db.delete(schema.photos).where(eq(schema.photos.id, id));
  }

  async getPhotosByReportId(reportId: number) {
    return await db.select().from(schema.photos).where(eq(schema.photos.reportId, reportId));
  }
  
  // Alias for getPhotosByReportId to match storage interface
  async getPhotosByReport(reportId: number) {
    return this.getPhotosByReportId(reportId);
  }
  
  // Add updatePhoto method
  async updatePhoto(id: number, photoData: Partial<schema.InsertPhoto>) {
    const [updatedPhoto] = await db
      .update(schema.photos)
      .set(photoData)
      .where(eq(schema.photos.id, id))
      .returning();
    return updatedPhoto;
  }

  // Sketch methods
  async createSketch(sketchData: schema.InsertSketch) {
    const [sketch] = await db.insert(schema.sketches).values(sketchData).returning();
    return sketch;
  }

  async getSketch(id: number) {
    const [sketch] = await db.select().from(schema.sketches).where(eq(schema.sketches.id, id));
    return sketch;
  }

  async updateSketch(id: number, sketchData: Partial<schema.InsertSketch>) {
    const [updatedSketch] = await db
      .update(schema.sketches)
      .set(sketchData)
      .where(eq(schema.sketches.id, id))
      .returning();
    return updatedSketch;
  }

  async deleteSketch(id: number) {
    await db.delete(schema.sketches).where(eq(schema.sketches.id, id));
  }

  async getSketchesByReportId(reportId: number) {
    return await db.select().from(schema.sketches).where(eq(schema.sketches.reportId, reportId));
  }

  // Compliance check methods
  async createComplianceCheck(checkData: schema.InsertComplianceCheck) {
    const [check] = await db.insert(schema.complianceChecks).values(checkData).returning();
    return check;
  }

  async getComplianceCheck(id: number) {
    const [check] = await db.select().from(schema.complianceChecks).where(eq(schema.complianceChecks.id, id));
    return check;
  }

  async deleteComplianceCheck(id: number) {
    await db.delete(schema.complianceChecks).where(eq(schema.complianceChecks.id, id));
  }

  async getComplianceChecksByReportId(reportId: number) {
    return await db.select().from(schema.complianceChecks).where(eq(schema.complianceChecks.reportId, reportId));
  }

  // Adjustment model methods
  async createAdjustmentModel(modelData: schema.InsertAdjustmentModel) {
    const [model] = await db.insert(schema.adjustmentModels).values(modelData).returning();
    return model;
  }

  async getAdjustmentModel(id: number) {
    const [model] = await db.select().from(schema.adjustmentModels).where(eq(schema.adjustmentModels.id, id));
    return model;
  }

  async updateAdjustmentModel(id: number, modelData: Partial<schema.InsertAdjustmentModel>) {
    const [updatedModel] = await db
      .update(schema.adjustmentModels)
      .set(modelData)
      .where(eq(schema.adjustmentModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteAdjustmentModel(id: number) {
    await db.delete(schema.adjustmentModels).where(eq(schema.adjustmentModels.id, id));
  }

  async getAdjustmentModelsByReportId(reportId: number) {
    return await db.select().from(schema.adjustmentModels).where(eq(schema.adjustmentModels.reportId, reportId));
  }

  // Model adjustment methods
  async createModelAdjustment(adjustmentData: schema.InsertModelAdjustment) {
    const [adjustment] = await db.insert(schema.modelAdjustments).values(adjustmentData).returning();
    return adjustment;
  }

  async getModelAdjustment(id: number) {
    const [adjustment] = await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.id, id));
    return adjustment;
  }

  async updateModelAdjustment(id: number, adjustmentData: Partial<schema.InsertModelAdjustment>) {
    const [updatedAdjustment] = await db
      .update(schema.modelAdjustments)
      .set(adjustmentData)
      .where(eq(schema.modelAdjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteModelAdjustment(id: number) {
    await db.delete(schema.modelAdjustments).where(eq(schema.modelAdjustments.id, id));
  }

  async getModelAdjustmentsByModelId(modelId: number) {
    return await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.modelId, modelId));
  }

  async getModelAdjustmentsByComparableId(comparableId: number) {
    return await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.comparableId, comparableId));
  }

  // File import methods
  async createFileImportResult(importData: InsertFileImportResult): Promise<FileImportResult> {
    const [result] = await db.insert(schema.fileImportResults).values(importData).returning();
    return result;
  }

  async getFileImportResult(id: string): Promise<FileImportResult | undefined> {
    const [result] = await db.select().from(schema.fileImportResults).where(eq(schema.fileImportResults.id, id));
    return result;
  }

  async updateFileImportResult(id: string, updateData: FileImportResultUpdate): Promise<FileImportResult> {
    const [result] = await db
      .update(schema.fileImportResults)
      .set(updateData)
      .where(eq(schema.fileImportResults.id, id))
      .returning();
    return result;
  }

  async getFileImportResults(limit?: number, offset?: number): Promise<FileImportResult[]> {
    let query = db.select().from(schema.fileImportResults).orderBy(schema.fileImportResults.dateImported);
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    if (offset !== undefined) {
      query = query.offset(offset);
    }
    
    return await query;
  }
  
  async getFileImportResultsByUserId(userId: number): Promise<FileImportResult[]> {
    return await db
      .select()
      .from(schema.fileImportResults)
      .where(eq(schema.fileImportResults.userId, userId))
      .orderBy(schema.fileImportResults.dateImported);
  }
}