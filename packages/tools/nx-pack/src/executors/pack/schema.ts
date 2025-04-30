export interface PackExecutorSchema {
  outputPath: string;
  includeFiles: string[];
  generateChecksums?: boolean;
}