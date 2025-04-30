const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

/**
 * NX Pack Executor
 * 
 * This executor handles the packaging of TerraFusion components and bundles
 * including validation, file copying, checksum generation, and SBOM creation.
 */
async function packExecutor(options, context) {
  console.log('Executing TerraFusion Pack Executor');
  
  try {
    const projectRoot = context.workspace.projects[context.projectName].root;
    const projectName = context.projectName;
    
    // Process and validate options
    const normalizedOptions = normalizeOptions(options, context);
    console.log(`Packaging ${projectName} with options:`, normalizedOptions);
    
    // Validate terra.json if required
    if (normalizedOptions.validateSchema) {
      const valid = await validateTerraJson(projectRoot);
      if (!valid) {
        console.error('Terra.json validation failed');
        return { success: false };
      }
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(normalizedOptions.outputPath, projectName);
    ensureDirExists(outputDir);
    
    // Collect files to package
    const files = await collectFiles(projectRoot, normalizedOptions);
    console.log(`Found ${files.length} files to package`);
    
    // Copy files to output directory
    await copyFiles(files, projectRoot, outputDir);
    
    // Generate checksums if required
    if (normalizedOptions.generateChecksums) {
      await generateChecksums(outputDir);
    }
    
    // Generate SBOM if required
    if (normalizedOptions.generateSBOM) {
      await generateSBOM(outputDir, normalizedOptions.sbomFormat, projectRoot);
    }
    
    // Sign package if required
    if (normalizedOptions.signPackage && normalizedOptions.keyId) {
      await signPackage(outputDir, normalizedOptions.keyId);
    }
    
    // Compress package if required
    if (normalizedOptions.compress) {
      await compressPackage(outputDir, normalizedOptions.compressFormat);
    }
    
    console.log(`Successfully packaged ${projectName} to ${outputDir}`);
    return { success: true };
  } catch (error) {
    console.error('Error during packaging:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Normalize options with defaults
 */
function normalizeOptions(options, context) {
  return {
    outputPath: options.outputPath || 'dist/pack',
    includeFiles: options.includeFiles || ['terra.json', 'README.md', 'LICENSE'],
    excludeFiles: options.excludeFiles || ['node_modules/**/*', '**/*.test.ts', '**/*.spec.ts'],
    validateSchema: options.validateSchema !== false,
    generateChecksums: options.generateChecksums !== false,
    generateSBOM: options.generateSBOM !== false,
    sbomFormat: options.sbomFormat || 'cyclonedx',
    signPackage: options.signPackage || false,
    keyId: options.keyId || '',
    compress: options.compress || false,
    compressFormat: options.compressFormat || 'tgz'
  };
}

/**
 * Validate terra.json against schema
 */
async function validateTerraJson(projectRoot) {
  const terraJsonPath = path.join(projectRoot, 'terra.json');
  const schemaPath = path.join(__dirname, '../../schemas/terra.json');
  
  if (!fs.existsSync(terraJsonPath)) {
    console.error(`Terra.json not found at ${terraJsonPath}`);
    return false;
  }
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema not found at ${schemaPath}`);
    return false;
  }
  
  try {
    const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    
    const valid = validate(terraJson);
    
    if (!valid) {
      console.error('Terra.json validation errors:');
      console.error(validate.errors);
      return false;
    }
    
    console.log('Terra.json validation successful');
    return true;
  } catch (error) {
    console.error('Error validating terra.json:', error);
    return false;
  }
}

/**
 * Ensure directory exists
 */
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Collect files to package based on include/exclude patterns
 */
async function collectFiles(projectRoot, options) {
  const includePatterns = options.includeFiles.map(pattern => 
    path.join(projectRoot, pattern)
  );
  
  const excludePatterns = options.excludeFiles.map(pattern => 
    path.join(projectRoot, pattern)
  );
  
  const files = await glob(includePatterns, {
    ignore: excludePatterns,
    nodir: false,
    dot: true
  });
  
  return files;
}

/**
 * Copy files to output directory
 */
async function copyFiles(files, projectRoot, outputDir) {
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file);
    const targetPath = path.join(outputDir, relativePath);
    
    // Create directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    ensureDirExists(targetDir);
    
    // Check if the file is a directory
    const stats = fs.statSync(file);
    if (stats.isDirectory()) {
      ensureDirExists(targetPath);
    } else {
      // Copy file
      fs.copyFileSync(file, targetPath);
      console.log(`Copied: ${relativePath}`);
    }
  }
}

/**
 * Generate checksums for all files in the output directory
 */
async function generateChecksums(outputDir) {
  console.log('Generating checksums...');
  
  const files = await glob(`${outputDir}/**/*`, {
    nodir: true,
    dot: true
  });
  
  const checksums = {};
  
  for (const file of files) {
    // Skip the checksum file itself
    if (file.endsWith('checksums.json')) {
      continue;
    }
    
    const relativePath = path.relative(outputDir, file);
    const fileBuffer = fs.readFileSync(file);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    
    checksums[relativePath] = hex;
  }
  
  const checksumFile = path.join(outputDir, 'checksums.json');
  fs.writeFileSync(checksumFile, JSON.stringify(checksums, null, 2));
  
  console.log(`Generated checksums for ${Object.keys(checksums).length} files`);
}

/**
 * Generate Software Bill of Materials (SBOM)
 */
async function generateSBOM(outputDir, format, projectRoot) {
  console.log(`Generating SBOM in ${format} format...`);
  
  // Read terra.json for component info
  const terraJsonPath = path.join(projectRoot, 'terra.json');
  const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
  
  // Create a simple SBOM structure
  const sbom = {
    bomFormat: format,
    specVersion: "1.4",
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "TerraFusion",
          name: "nx-pack",
          version: "1.0.0"
        }
      ],
      component: {
        type: "application",
        name: terraJson.name,
        version: terraJson.version,
        description: terraJson.description,
        licenses: terraJson.license ? [{ license: { id: terraJson.license } }] : []
      }
    },
    components: []
  };
  
  // Add dependencies if available
  if (terraJson.dependencies && Array.isArray(terraJson.dependencies)) {
    terraJson.dependencies.forEach(dep => {
      const parts = dep.split('@');
      const name = parts[0];
      const version = parts[1] || 'latest';
      
      sbom.components.push({
        type: "library",
        name,
        version
      });
    });
  }
  
  // Write SBOM to file
  const sbomFile = path.join(outputDir, `sbom.${format === 'cyclonedx' ? 'json' : 'spdx'}`);
  fs.writeFileSync(sbomFile, JSON.stringify(sbom, null, 2));
  
  console.log(`Generated SBOM at ${sbomFile}`);
}

/**
 * Sign package with GPG
 */
async function signPackage(outputDir, keyId) {
  console.log('Package signing not yet implemented');
  // This would use child_process.exec to call GPG for signing
}

/**
 * Compress package into an archive
 */
async function compressPackage(outputDir, format) {
  console.log('Package compression not yet implemented');
  // This would use a library like tar or archiver to create the archive
}

module.exports = packExecutor;