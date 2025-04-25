import { BaseAgent } from './base-agent';
import { AgentTask, AgentTaskTypes } from './types';
import { analyzeDocument } from '../anthropic';
import { z } from 'zod';

// Schema for USPAP compliance check task data
const USPAPComplianceTaskSchema = z.object({
  reportText: z.string(),
  section: z.enum([
    'entire_report',
    'certification',
    'scope_of_work',
    'assumptions_limiting_conditions',
    'reconciliation',
    'approach_to_value'
  ]).optional(),
  severityThreshold: z.enum(['low', 'medium', 'high']).optional()
});

type USPAPComplianceTask = z.infer<typeof USPAPComplianceTaskSchema>;

// Schema for UAD compliance check task data
const UADComplianceTaskSchema = z.object({
  reportData: z.record(z.string(), z.any()),
  formType: z.enum(['1004', '1073', '1025', '2055']),
  checkAll: z.boolean().optional()
});

type UADComplianceTask = z.infer<typeof UADComplianceTaskSchema>;

// Schema for general report validation task data
const ReportValidationTaskSchema = z.object({
  reportText: z.string(),
  checkType: z.enum([
    'completeness',
    'consistency',
    'reasonableness',
    'all'
  ])
});

type ReportValidationTask = z.infer<typeof ReportValidationTaskSchema>;

/**
 * Compliance Agent
 * 
 * Specialized agent for checking compliance with USPAP standards,
 * UAD requirements, and validating appraisal reports.
 */
export class ComplianceAgent extends BaseAgent {
  /**
   * Create a new ComplianceAgent
   */
  constructor() {
    super(
      'compliance-agent',
      'Compliance Agent',
      'Checks compliance with appraisal standards and validates reports',
      [
        AgentTaskTypes.CHECK_USPAP_COMPLIANCE,
        AgentTaskTypes.CHECK_UAD_COMPLIANCE,
        AgentTaskTypes.VALIDATE_REPORT
      ]
    );
  }
  
  /**
   * Handle a task based on its type
   * @param task - Task to handle
   * @returns Compliance check results
   */
  protected async handleTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.taskType) {
      case AgentTaskTypes.CHECK_USPAP_COMPLIANCE:
        return this.checkUSPAPCompliance(task as AgentTask<USPAPComplianceTask>) as unknown as R;
        
      case AgentTaskTypes.CHECK_UAD_COMPLIANCE:
        return this.checkUADCompliance(task as AgentTask<UADComplianceTask>) as unknown as R;
        
      case AgentTaskTypes.VALIDATE_REPORT:
        return this.validateReport(task as AgentTask<ReportValidationTask>) as unknown as R;
        
      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }
  }
  
  /**
   * Check compliance with USPAP standards
   * @param task - USPAP compliance task
   * @returns Compliance check results
   */
  private async checkUSPAPCompliance(task: AgentTask<USPAPComplianceTask>): Promise<{
    compliant: boolean;
    issues: Array<{
      standard: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      location?: string;
      recommendation?: string;
    }>;
    overallScore: number;
  }> {
    console.log(`[${this.name}] Checking USPAP compliance`);
    
    try {
      // Validate the task data
      const taskData = USPAPComplianceTaskSchema.parse(task.data);
      
      // Determine which section to analyze
      const sectionName = taskData.section || 'entire_report';
      const severityThreshold = taskData.severityThreshold || 'low';
      
      // Use the Anthropic service to analyze the document
      const documentAnalysis = await analyzeDocument(
        taskData.reportText,
        `appraisal report ${sectionName}`
      );
      
      // Extract compliance issues from the analysis
      const issues = documentAnalysis.potentialIssues
        .filter(issue => {
          // Filter based on severity threshold
          const severityRank = { low: 1, medium: 2, high: 3 };
          const issueSeverityRank = severityRank[issue.severity];
          const thresholdRank = severityRank[severityThreshold];
          return issueSeverityRank >= thresholdRank;
        })
        .map(issue => ({
          standard: 'USPAP',
          description: issue.issue,
          severity: issue.severity,
          recommendation: issue.description
        }));
      
      // Determine overall compliance
      const compliant = issues.length === 0 || issues.every(issue => issue.severity === 'low');
      
      // Calculate overall score (100 = perfect, deduct points based on severity)
      let overallScore = 100;
      issues.forEach(issue => {
        if (issue.severity === 'high') {
          overallScore -= 15;
        } else if (issue.severity === 'medium') {
          overallScore -= 8;
        } else {
          overallScore -= 3;
        }
      });
      
      // Ensure score doesn't go below 0
      overallScore = Math.max(0, overallScore);
      
      return {
        compliant,
        issues,
        overallScore
      };
    } catch (error) {
      console.error(`[${this.name}] Error checking USPAP compliance: ${error}`);
      throw error;
    }
  }
  
  /**
   * Check compliance with UAD requirements
   * @param task - UAD compliance task
   * @returns Compliance check results
   */
  private async checkUADCompliance(task: AgentTask<UADComplianceTask>): Promise<{
    compliant: boolean;
    issues: Array<{
      field: string;
      requirement: string;
      actual: string;
      severity: 'low' | 'medium' | 'high';
      recommendation?: string;
    }>;
    overallScore: number;
  }> {
    console.log(`[${this.name}] Checking UAD compliance for form ${task.data.formType}`);
    
    try {
      // Validate the task data
      const taskData = UADComplianceTaskSchema.parse(task.data);
      
      // This would be a detailed implementation checking specific UAD requirements
      // For now, we'll use a simplified version that checks a few key fields
      
      const issues = [];
      
      // Check property condition rating
      if (taskData.reportData.conditionRating) {
        const validRatings = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
        const condition = taskData.reportData.conditionRating;
        
        if (!validRatings.includes(condition)) {
          issues.push({
            field: 'Condition Rating',
            requirement: 'Must be one of: C1, C2, C3, C4, C5, C6',
            actual: condition,
            severity: 'high',
            recommendation: 'Update condition rating to use UAD standardized format'
          });
        }
      }
      
      // Check quality rating
      if (taskData.reportData.qualityRating) {
        const validRatings = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
        const quality = taskData.reportData.qualityRating;
        
        if (!validRatings.includes(quality)) {
          issues.push({
            field: 'Quality Rating',
            requirement: 'Must be one of: Q1, Q2, Q3, Q4, Q5, Q6',
            actual: quality,
            severity: 'high',
            recommendation: 'Update quality rating to use UAD standardized format'
          });
        }
      }
      
      // Check date format
      if (taskData.reportData.effectiveDate) {
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        const date = taskData.reportData.effectiveDate;
        
        if (!dateRegex.test(date)) {
          issues.push({
            field: 'Effective Date',
            requirement: 'Must be in MM/DD/YYYY format',
            actual: date,
            severity: 'medium',
            recommendation: 'Update date to use UAD standardized format MM/DD/YYYY'
          });
        }
      }
      
      // Check view factor
      if (taskData.reportData.viewFactor) {
        const validFactors = ['N', 'B', 'A', 'G', 'F', 'P'];
        const view = taskData.reportData.viewFactor;
        
        if (!validFactors.includes(view)) {
          issues.push({
            field: 'View Factor',
            requirement: 'Must be one of: N, B, A, G, F, P',
            actual: view,
            severity: 'medium',
            recommendation: 'Update view factor to use UAD standardized format'
          });
        }
      }
      
      // Determine overall compliance
      const compliant = issues.length === 0;
      
      // Calculate overall score (100 = perfect, deduct points based on severity and number of issues)
      let overallScore = 100;
      issues.forEach(issue => {
        if (issue.severity === 'high') {
          overallScore -= 15;
        } else if (issue.severity === 'medium') {
          overallScore -= 8;
        } else {
          overallScore -= 3;
        }
      });
      
      // Ensure score doesn't go below 0
      overallScore = Math.max(0, overallScore);
      
      return {
        compliant,
        issues,
        overallScore
      };
    } catch (error) {
      console.error(`[${this.name}] Error checking UAD compliance: ${error}`);
      throw error;
    }
  }
  
  /**
   * Validate an appraisal report
   * @param task - Report validation task
   * @returns Validation results
   */
  private async validateReport(task: AgentTask<ReportValidationTask>): Promise<{
    valid: boolean;
    issues: Array<{
      category: 'completeness' | 'consistency' | 'reasonableness';
      description: string;
      severity: 'low' | 'medium' | 'high';
      recommendation?: string;
    }>;
    overallScore: number;
  }> {
    console.log(`[${this.name}] Validating appraisal report`);
    
    try {
      // Validate the task data
      const taskData = ReportValidationTaskSchema.parse(task.data);
      
      // Use the Anthropic service to analyze the document
      const documentAnalysis = await analyzeDocument(
        taskData.reportText,
        'appraisal report validation'
      );
      
      // Determine which aspects to check
      const checkTypes = taskData.checkType === 'all' 
        ? ['completeness', 'consistency', 'reasonableness'] 
        : [taskData.checkType];
      
      // Extract validation issues from the analysis
      const issues = [];
      
      // Check for completeness issues (missing required elements)
      if (checkTypes.includes('completeness')) {
        documentAnalysis.missingFields.forEach(field => {
          issues.push({
            category: 'completeness' as const,
            description: `Missing required field: ${field}`,
            severity: 'high',
            recommendation: `Add the missing ${field} information to the report`
          });
        });
      }
      
      // Check for consistency issues (contradictory information)
      if (checkTypes.includes('consistency')) {
        // This would typically look for contradictions in the data
        // For now, we'll use the potential issues identified by the LLM
        documentAnalysis.potentialIssues
          .filter(issue => issue.issue.toLowerCase().includes('inconsistent') || 
                          issue.issue.toLowerCase().includes('contradiction') ||
                          issue.issue.toLowerCase().includes('mismatch'))
          .forEach(issue => {
            issues.push({
              category: 'consistency' as const,
              description: issue.issue,
              severity: issue.severity,
              recommendation: issue.description
            });
          });
      }
      
      // Check for reasonableness issues (values or conclusions that seem implausible)
      if (checkTypes.includes('reasonableness')) {
        documentAnalysis.potentialIssues
          .filter(issue => issue.issue.toLowerCase().includes('unreasonable') || 
                          issue.issue.toLowerCase().includes('implausible') ||
                          issue.issue.toLowerCase().includes('unlikely'))
          .forEach(issue => {
            issues.push({
              category: 'reasonableness' as const,
              description: issue.issue,
              severity: issue.severity,
              recommendation: issue.description
            });
          });
      }
      
      // Determine overall validity
      const valid = issues.length === 0 || !issues.some(issue => issue.severity === 'high');
      
      // Calculate overall score (100 = perfect, deduct points based on severity and type)
      let overallScore = 100;
      issues.forEach(issue => {
        const categorySeverity = {
          completeness: 1.5, // Completeness issues are more critical
          consistency: 1.2,
          reasonableness: 1.0
        };
        
        const severityDeduction = {
          high: 15,
          medium: 8,
          low: 3
        };
        
        overallScore -= severityDeduction[issue.severity] * categorySeverity[issue.category];
      });
      
      // Ensure score doesn't go below 0
      overallScore = Math.max(0, Math.round(overallScore));
      
      return {
        valid,
        issues,
        overallScore
      };
    } catch (error) {
      console.error(`[${this.name}] Error validating report: ${error}`);
      throw error;
    }
  }
}