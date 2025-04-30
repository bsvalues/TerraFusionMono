export interface PackExecutorSchema {
  /**
   * The output path for packaged artifacts.
   */
  outputPath: string;

  /**
   * List of files and folders to include in the package. Supports glob patterns.
   */
  includeFiles?: string[];

  /**
   * List of files and folders to exclude from the package. Supports glob patterns.
   */
  excludeFiles?: string[];

  /**
   * Generate checksums for packaged files
   */
  generateChecksums?: boolean;

  /**
   * Validate terra.json against the schema
   */
  validateSchema?: boolean;

  /**
   * Generate Software Bill of Materials (SBOM)
   */
  generateSBOM?: boolean;

  /**
   * SBOM format to generate
   */
  sbomFormat?: 'cyclonedx' | 'spdx';

  /**
   * Sign the package with a GPG key
   */
  signPackage?: boolean;

  /**
   * GPG key ID to use for signing
   */
  keyId?: string;

  /**
   * Compress the package into an archive
   */
  compress?: boolean;

  /**
   * Archive format to use for compression
   */
  compressFormat?: 'zip' | 'tar.gz' | 'tar.xz';
}