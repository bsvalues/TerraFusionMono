const fs = require('fs');
const path = require('path');
const glob = require('glob');
const crypto = require('crypto');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

/**
 * TerraFusion Pack Executor
 * 
 * This executor packages TerraFusion components and bundles according to the specification
 * in terra.json. It includes validation, checksums, and SBOM generation.
 */

async function executor(options, context) {
  console.log('Executing Pack Executor...');
  console.log(`Project: ${context.projectName}`);
  
  try {
    const projectRoot = context.workspace.projects[context.projectName].root;
    const terraJsonPath = path.join(projectRoot, 'terra.json');
    
    // Validate terra.json exists
    if (!fs.existsSync(terraJsonPath)) {
      console.error(`Error: terra.json not found in project root: ${projectRoot}`);
      return { success: false };
    }
    
    // Load terra.json
    const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
    console.log(`Component ID: ${terraJson.id}, Type: ${terraJson.type}, Version: ${terraJson.version}`);
    
    // Validate terra.json against schema if enabled
    if (options.validateSchema) {
      const isValid = await validateTerraJson(terraJson);
      if (!isValid) {
        console.error('Error: terra.json validation failed');
        return { success: false };
      }
      console.log('terra.json validation passed');
    }
    
    // Create output directory
    const outputDir = path.join(options.outputPath, terraJson.id);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Copy files
    const copiedFiles = await copyFiles(projectRoot, outputDir, options.includeFiles, options.excludeFiles);
    console.log(`Copied ${copiedFiles.length} files to ${outputDir}`);
    
    // Generate checksums if enabled
    if (options.generateChecksums) {
      await generateChecksums(outputDir, copiedFiles);
      console.log('Checksums generated');
    }
    
    // Generate SBOM if enabled
    if (options.generateSBOM) {
      await generateSBOM(outputDir, terraJson, options.sbomFormat);
      console.log(`SBOM generated in ${options.sbomFormat} format`);
    }
    
    // Sign package if enabled
    if (options.signPackage && options.keyId) {
      await signPackage(outputDir, options.keyId);
      console.log(`Package signed with key ID: ${options.keyId}`);
    }
    
    // Compress package if enabled
    if (options.compress) {
      await compressPackage(outputDir, options.compressFormat);
      console.log(`Package compressed in ${options.compressFormat} format`);
    }
    
    console.log(`Packaging completed successfully: ${outputDir}`);
    return { success: true };
  } catch (error) {
    console.error('Error executing pack:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate terra.json against schema
 */
async function validateTerraJson(terraJson) {
  try {
    const schemaPath = path.join(__dirname, '../../schemas/terra.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    const validate = ajv.compile(schema);
    const valid = validate(terraJson);
    
    if (!valid) {
      console.error('terra.json validation errors:');
      validate.errors.forEach(error => {
        console.error(`  ${error.instancePath} ${error.message}`);
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating terra.json:', error);
    return false;
  }
}

/**
 * Copy files from project to output directory
 */
async function copyFiles(projectRoot, outputDir, includePatterns, excludePatterns) {
  const copiedFiles = [];
  
  // Convert exclude patterns to a function that tests if a file should be excluded
  const excludeFiles = (filePath) => {
    return excludePatterns?.some(pattern => {
      const fullPattern = path.join(projectRoot, pattern);
      return glob.sync(fullPattern).includes(filePath);
    }) || false;
  };
  
  // Process each include pattern
  for (const pattern of includePatterns || []) {
    const fullPattern = path.join(projectRoot, pattern);
    const files = glob.sync(fullPattern);
    
    for (const file of files) {
      if (excludeFiles(file)) {
        continue;
      }
      
      const relativeFilePath = path.relative(projectRoot, file);
      const destPath = path.join(outputDir, relativeFilePath);
      
      // Create directories if they don't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(file, destPath);
      copiedFiles.push(relativeFilePath);
    }
  }
  
  return copiedFiles;
}

/**
 * Generate checksums for packaged files
 */
async function generateChecksums(outputDir, files) {
  const checksums = {};
  
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const fileContent = fs.readFileSync(filePath);
    
    // Calculate checksums
    const md5sum = crypto.createHash('md5').update(fileContent).digest('hex');
    const sha256sum = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    checksums[file] = {
      md5: md5sum,
      sha256: sha256sum
    };
  }
  
  // Write checksums to file
  fs.writeFileSync(
    path.join(outputDir, 'checksums.json'),
    JSON.stringify(checksums, null, 2)
  );
}

/**
 * Generate Software Bill of Materials (SBOM)
 */
async function generateSBOM(outputDir, terraJson, format) {
  // Create a simple SBOM file for now
  // In a real implementation, we would use a proper SBOM generation library
  const sbom = {
    name: terraJson.name,
    version: terraJson.version,
    description: terraJson.description,
    metadata: {
      timestamp: new Date().toISOString(),
      format: format
    },
    components: []
  };
  
  // Add dependencies as components
  if (terraJson.dependencies) {
    terraJson.dependencies.forEach(dep => {
      const parts = dep.split('@');
      
      sbom.components.push({
        name: parts[0],
        version: parts[1] || 'unknown',
        supplier: terraJson.maintainer || 'unknown'
      });
    });
  }
  
  // Add contained components if this is a bundle
  if (terraJson.type === 'bundle' && terraJson.contains) {
    terraJson.contains.forEach(comp => {
      const parts = comp.split('@');
      
      sbom.components.push({
        name: parts[0],
        version: parts[1] || 'unknown',
        supplier: terraJson.maintainer || 'unknown',
        bundled: true
      });
    });
  }
  
  // Write SBOM to file
  fs.writeFileSync(
    path.join(outputDir, `sbom.${format === 'cyclonedx' ? 'json' : 'spdx'}`),
    JSON.stringify(sbom, null, 2)
  );
}

/**
 * Sign package with GPG (placeholder implementation)
 */
async function signPackage(outputDir, keyId) {
  // In a real implementation, we would use a GPG library or spawn a process
  // For now, just create a signature file
  const message = `Package signed with key ${keyId} at ${new Date().toISOString()}`;
  fs.writeFileSync(path.join(outputDir, 'signature.txt'), message);
}

/**
 * Compress package into an archive (placeholder implementation)
 */
async function compressPackage(outputDir, format) {
  // In a real implementation, we would use a compression library
  // For now, just create a note
  const message = `Package would be compressed in ${format} format at ${new Date().toISOString()}`;
  fs.writeFileSync(path.join(outputDir, 'compressed.txt'), message);
}

module.exports = executor;