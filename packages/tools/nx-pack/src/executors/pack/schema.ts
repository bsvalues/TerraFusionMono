/**
 * Schema for the pack executor
 */

export interface PackExecutorSchema {
  /**
   * Output directory for packaged components
   * @default "dist/pack"
   */
  outputPath?: string;
  
  /**
   * Files to include in the package (globs supported)
   * @default ["terra.json", "README.md", "LICENSE", "bin/**/*", "lib/**/*", "scripts/**/*", "charts/**/*"]
   */
  includeFiles?: string[];
  
  /**
   * Files to exclude from the package (globs supported)
   * @default ["node_modules/**/*", "**/*.test.ts", "**/*.spec.ts", "**/*.stories.tsx"]
   */
  excludeFiles?: string[];
  
  /**
   * Generate checksums for package files
   * @default true
   */
  generateChecksums?: boolean;
  
  /**
   * Validate terra.json against schema
   * @default true
   */
  validateSchema?: boolean;
  
  /**
   * Generate Software Bill of Materials
   * @default true
   */
  generateSBOM?: boolean;
  
  /**
   * Format for Software Bill of Materials
   * @default "cyclonedx"
   */
  sbomFormat?: 'cyclonedx' | 'spdx';
}