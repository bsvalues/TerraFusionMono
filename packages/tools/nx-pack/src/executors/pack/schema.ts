export interface PackExecutorSchema {
  /**
   * The path to output the packaged files to
   */
  outputPath: string;
  
  /**
   * Glob patterns for files to include in the package
   */
  includeFiles?: string[];
  
  /**
   * Glob patterns for files to exclude from the package
   */
  excludeFiles?: string[];
  
  /**
   * Validate terra.json against schema
   */
  validateSchema?: boolean;
  
  /**
   * Generate checksums for packaged files
   */
  generateChecksums?: boolean;
  
  /**
   * Generate Software Bill of Materials
   */
  generateSBOM?: boolean;
  
  /**
   * Format for Software Bill of Materials
   */
  sbomFormat?: 'cyclonedx' | 'spdx';
  
  /**
   * Sign package with GPG
   */
  signPackage?: boolean;
  
  /**
   * GPG key ID to sign package with
   */
  keyId?: string;
  
  /**
   * Compress package into an archive
   */
  compress?: boolean;
  
  /**
   * Format for package compression
   */
  compressFormat?: 'tar' | 'zip' | 'tgz';
}