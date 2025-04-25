import { BaseAgent } from './base-agent';
import { AgentTask, AgentTaskTypes } from './types';
import { extractPropertyData } from '../anthropic';
import { PropertyExtractionSchema, PropertyExtraction } from '../anthropic';
import { z } from 'zod';

// Schema for email extraction task data
const EmailExtractionTaskSchema = z.object({
  emailContent: z.string(),
  emailSubject: z.string().optional(),
  senderEmail: z.string().optional()
});

type EmailExtractionTask = z.infer<typeof EmailExtractionTaskSchema>;

// Schema for document extraction task data
const DocumentExtractionTaskSchema = z.object({
  documentContent: z.string(),
  documentType: z.string(),
  extractionTarget: z.array(z.string()).optional()
});

type DocumentExtractionTask = z.infer<typeof DocumentExtractionTaskSchema>;

/**
 * Data Extraction Agent
 * 
 * Specialized agent for extracting structured data from various documents
 * and text sources related to real estate appraisals.
 */
export class DataExtractionAgent extends BaseAgent {
  /**
   * Create a new DataExtractionAgent
   */
  constructor() {
    super(
      'data-extraction-agent',
      'Data Extraction Agent',
      'Extracts structured property data from emails, PDFs, and other documents',
      [
        AgentTaskTypes.EXTRACT_PROPERTY_DATA,
        AgentTaskTypes.EXTRACT_DOCUMENT_DATA,
        AgentTaskTypes.EXTRACT_EMAIL_ORDER
      ]
    );
  }
  
  /**
   * Handle a task based on its type
   * @param task - Task to handle
   * @returns Extracted data from the document
   */
  protected async handleTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.taskType) {
      case AgentTaskTypes.EXTRACT_EMAIL_ORDER:
        return this.extractEmailOrder(task as AgentTask<EmailExtractionTask>) as unknown as R;
        
      case AgentTaskTypes.EXTRACT_DOCUMENT_DATA:
        return this.extractDocumentData(task as AgentTask<DocumentExtractionTask>) as unknown as R;
        
      case AgentTaskTypes.EXTRACT_PROPERTY_DATA:
        return this.extractPropertyData(task) as unknown as R;
        
      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }
  }
  
  /**
   * Extract property data from an email order
   * @param task - Email extraction task
   * @returns Extracted property data
   */
  private async extractEmailOrder(task: AgentTask<EmailExtractionTask>): Promise<PropertyExtraction> {
    console.log(`[${this.name}] Extracting property data from email`);
    
    try {
      // Validate the task data
      const taskData = EmailExtractionTaskSchema.parse(task.data);
      
      // Construct the email text including subject and sender if available
      let fullEmailText = '';
      
      if (taskData.emailSubject) {
        fullEmailText += `Subject: ${taskData.emailSubject}\n\n`;
      }
      
      if (taskData.senderEmail) {
        fullEmailText += `From: ${taskData.senderEmail}\n\n`;
      }
      
      fullEmailText += taskData.emailContent;
      
      // Use the Anthropic service to extract property data
      const extractedData = await extractPropertyData(fullEmailText);
      
      return extractedData;
    } catch (error) {
      console.error(`[${this.name}] Error extracting email order: ${error}`);
      throw error;
    }
  }
  
  /**
   * Extract data from a document
   * @param task - Document extraction task
   * @returns Extracted document data
   */
  private async extractDocumentData(task: AgentTask<DocumentExtractionTask>): Promise<any> {
    console.log(`[${this.name}] Extracting data from ${task.data.documentType} document`);
    
    try {
      // Validate the task data
      const taskData = DocumentExtractionTaskSchema.parse(task.data);
      
      // Use the Anthropic service to extract property data
      const extractedData = await extractPropertyData(taskData.documentContent);
      
      return extractedData;
    } catch (error) {
      console.error(`[${this.name}] Error extracting document data: ${error}`);
      throw error;
    }
  }
  
  /**
   * Extract general property data
   * @param task - Generic property data extraction task
   * @returns Extracted property data
   */
  private async extractPropertyData(task: AgentTask<any>): Promise<PropertyExtraction> {
    console.log(`[${this.name}] Extracting general property data`);
    
    try {
      // The task data should contain the text to extract from
      if (!task.data.text) {
        throw new Error('Task data must contain a "text" field');
      }
      
      // Use the Anthropic service to extract property data
      const extractedData = await extractPropertyData(task.data.text);
      
      return extractedData;
    } catch (error) {
      console.error(`[${this.name}] Error extracting property data: ${error}`);
      throw error;
    }
  }
}