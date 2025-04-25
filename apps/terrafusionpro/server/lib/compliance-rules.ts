import { AppraisalReport, Property, Comparable, Adjustment } from '@shared/schema';

// Define types for compliance checking
interface ComplianceRule {
  id: string;
  description: string;
  checkType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  check: (
    report: AppraisalReport,
    property: Property,
    comparables: Comparable[],
    adjustments: Adjustment[]
  ) => Promise<boolean>;
  message: string;
  field?: string;
}

interface ComplianceResult {
  checkType: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field?: string;
}

/**
 * Define UAD (Uniform Appraisal Dataset) rules
 */
const uadRules: ComplianceRule[] = [
  {
    id: 'UAD001',
    description: 'Property address must be complete',
    checkType: 'UAD',
    severity: 'critical',
    check: async (_, property) => {
      return !!(property.address && property.city && property.state && property.zipCode);
    },
    message: 'Property address is incomplete. UAD requires complete property address.',
    field: 'property.address'
  },
  {
    id: 'UAD002',
    description: 'Property must have a valid year built',
    checkType: 'UAD',
    severity: 'medium',
    check: async (_, property) => {
      if (!property.yearBuilt) return false;
      const year = parseInt(property.yearBuilt.toString());
      return !isNaN(year) && year > 1700 && year <= new Date().getFullYear();
    },
    message: 'Year built is missing or invalid. UAD requires a valid year built.',
    field: 'property.yearBuilt'
  },
  {
    id: 'UAD003',
    description: 'Gross Living Area must be provided',
    checkType: 'UAD',
    severity: 'high',
    check: async (_, property) => {
      return !!property.grossLivingArea && Number(property.grossLivingArea) > 0;
    },
    message: 'Gross Living Area is missing or invalid. UAD requires a valid GLA.',
    field: 'property.grossLivingArea'
  },
  {
    id: 'UAD004',
    description: 'Comparable properties must have sales price',
    checkType: 'UAD',
    severity: 'high',
    check: async (_, __, comparables) => {
      for (const comp of comparables) {
        if (comp.compType === 'sale' && (!comp.salePrice || Number(comp.salePrice) <= 0)) {
          return false;
        }
      }
      return true;
    },
    message: 'One or more comparable properties are missing a sales price. UAD requires sales prices for all comparables.',
    field: 'comparables.salePrice'
  },
  {
    id: 'UAD005',
    description: 'At least three closed comparable sales are required',
    checkType: 'UAD',
    severity: 'critical',
    check: async (_, __, comparables) => {
      const closedSales = comparables.filter(comp => comp.compType === 'sale');
      return closedSales.length >= 3;
    },
    message: 'Less than three closed comparable sales. UAD requires at least three closed sales.',
    field: 'comparables'
  },
  {
    id: 'UAD006',
    description: 'Market value must be provided',
    checkType: 'UAD',
    severity: 'critical',
    check: async (report) => {
      return !!report.marketValue && Number(report.marketValue) > 0;
    },
    message: 'Market value is missing or invalid. UAD requires a valid market value.',
    field: 'report.marketValue'
  }
];

/**
 * Define USPAP (Uniform Standards of Professional Appraisal Practice) rules
 */
const uspapRules: ComplianceRule[] = [
  {
    id: 'USPAP001',
    description: 'Effective date must be provided',
    checkType: 'USPAP',
    severity: 'high',
    check: async (report) => {
      return !!report.effectiveDate;
    },
    message: 'Effective date is missing. USPAP requires an effective date of value.',
    field: 'report.effectiveDate'
  },
  {
    id: 'USPAP002',
    description: 'Report date must be provided',
    checkType: 'USPAP',
    severity: 'medium',
    check: async (report) => {
      return !!report.reportDate;
    },
    message: 'Report date is missing. USPAP requires a report date.',
    field: 'report.reportDate'
  },
  {
    id: 'USPAP003',
    description: 'Report purpose must be provided',
    checkType: 'USPAP',
    severity: 'medium',
    check: async (report) => {
      return !!report.purpose;
    },
    message: 'Purpose of appraisal is missing. USPAP requires a stated purpose.',
    field: 'report.purpose'
  },
  {
    id: 'USPAP004',
    description: 'Client name must be provided',
    checkType: 'USPAP',
    severity: 'high',
    check: async (report) => {
      return !!report.clientName;
    },
    message: 'Client name is missing. USPAP requires identification of the client.',
    field: 'report.clientName'
  },
  {
    id: 'USPAP005',
    description: 'Property legal description should be provided',
    checkType: 'USPAP',
    severity: 'medium',
    check: async (_, property) => {
      return !!property.legalDescription;
    },
    message: 'Legal description is missing. USPAP recommends including the legal description.',
    field: 'property.legalDescription'
  }
];

/**
 * Define client-specific rules
 */
const clientRules: ComplianceRule[] = [
  {
    id: 'CLIENT001',
    description: 'Adjustment percentages should be within reasonable range',
    checkType: 'Client-Specific',
    severity: 'medium',
    check: async (_, __, comparables, adjustments) => {
      for (const comp of comparables) {
        if (!comp.salePrice) continue;
        
        const compAdjustments = adjustments.filter(adj => adj.comparableId === comp.id);
        if (compAdjustments.length === 0) continue;
        
        const netAdjustment = compAdjustments.reduce(
          (sum, adj) => sum + Number(adj.amount), 
          0
        );
        
        const netAdjustmentPercentage = Math.abs(netAdjustment / Number(comp.salePrice) * 100);
        
        if (netAdjustmentPercentage > 15) {
          return false;
        }
        
        const grossAdjustment = compAdjustments.reduce(
          (sum, adj) => sum + Math.abs(Number(adj.amount)), 
          0
        );
        
        const grossAdjustmentPercentage = grossAdjustment / Number(comp.salePrice) * 100;
        
        if (grossAdjustmentPercentage > 25) {
          return false;
        }
      }
      
      return true;
    },
    message: 'Adjustment percentages exceed acceptable limits. Net adjustments should be within 15% and gross adjustments within 25%.',
    field: 'adjustments'
  },
  {
    id: 'CLIENT002',
    description: 'Comparable sales should be within the last 6 months',
    checkType: 'Client-Specific',
    severity: 'medium',
    check: async (report, _, comparables) => {
      if (!report.effectiveDate) return true; // Skip if no effective date
      
      const effectiveDate = new Date(report.effectiveDate);
      const sixMonthsAgo = new Date(effectiveDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      for (const comp of comparables) {
        if (comp.compType !== 'sale' || !comp.saleDate) continue;
        
        const saleDate = new Date(comp.saleDate);
        if (saleDate < sixMonthsAgo) {
          return false;
        }
      }
      
      return true;
    },
    message: 'One or more comparable sales are older than 6 months from the effective date.',
    field: 'comparables.saleDate'
  },
  {
    id: 'CLIENT003',
    description: 'Comparable properties should be within 1 mile of subject',
    checkType: 'Client-Specific',
    severity: 'low',
    check: async (_, __, comparables) => {
      for (const comp of comparables) {
        if (!comp.proximityToSubject) continue;
        
        // Simple check for "miles" text and number greater than 1
        if (comp.proximityToSubject.includes('mile')) {
          const milesMatch = comp.proximityToSubject.match(/(\d+(\.\d+)?)/);
          if (milesMatch) {
            const miles = parseFloat(milesMatch[0]);
            if (miles > 1) {
              return false;
            }
          }
        }
      }
      
      return true;
    },
    message: 'One or more comparable properties are located more than 1 mile from the subject property.',
    field: 'comparables.proximityToSubject'
  }
];

/**
 * Validate compliance for an appraisal report
 */
export async function validateCompliance(
  report: AppraisalReport,
  property: Property,
  comparables: Comparable[],
  adjustments: Adjustment[],
  ruleTypes: string[] = ['UAD', 'USPAP', 'Client-Specific']
): Promise<ComplianceResult[]> {
  const results: ComplianceResult[] = [];
  
  // Collect all rules that apply based on rule types
  const rulesToCheck: ComplianceRule[] = [];
  
  if (ruleTypes.includes('UAD')) {
    rulesToCheck.push(...uadRules);
  }
  
  if (ruleTypes.includes('USPAP')) {
    rulesToCheck.push(...uspapRules);
  }
  
  if (ruleTypes.includes('Client-Specific')) {
    rulesToCheck.push(...clientRules);
  }
  
  // Check each rule
  for (const rule of rulesToCheck) {
    try {
      const passed = await rule.check(report, property, comparables, adjustments);
      
      results.push({
        checkType: rule.checkType,
        status: passed ? 'pass' : 'fail',
        message: passed ? `Passed: ${rule.description}` : rule.message,
        severity: rule.severity,
        field: rule.field
      });
    } catch (error) {
      // If a rule check throws an exception, treat it as a fail
      results.push({
        checkType: rule.checkType,
        status: 'fail',
        message: `Error checking rule: ${rule.description}. Error: ${error}`,
        severity: rule.severity,
        field: rule.field
      });
    }
  }
  
  return results;
}
