export enum ImportType {
  PACS = 'pacs',
  SOIL = 'soil',
  SENSOR = 'sensor',
  WEATHER = 'weather',
  CUSTOM = 'custom'
}

export type ImportColumn = {
  sourceIndex: number;
  sourceName: string;
  targetName: string;
  required: boolean;
  mapped: boolean;
  dataType: string;
  sampleData?: string;
};

export type MappingConfig = {
  sourceColumns: string[];
  targetColumns: Record<string, ImportColumn>;
  autoMapped: boolean;
};

export type ValidationIssue = {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
};

export type ValidationResult = {
  valid: boolean;
  totalRows: number;
  processedRows: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
};

export type ImportFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  preview?: string[][];
};

export type ImportWizardState = {
  activeStep: number;
  importType: ImportType;
  files: ImportFile[];
  mapping: MappingConfig | null;
  validationResult: ValidationResult | null;
  importInProgress: boolean;
  importComplete: boolean;
};

export type ImportWizardProps = {
  onComplete: (result: any) => void;
  onCancel: () => void;
  importType?: ImportType;
  initialData?: Partial<ImportWizardState>;
};