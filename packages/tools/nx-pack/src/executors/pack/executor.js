const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const crypto = require('crypto');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const childProcess = require('child_process');

/**
 * NX Pack Executor for TerraFusion components and bundles
 * Packages components and bundles for distribution with validation and SBOM generation
 */
module.exports = async function packExecutor(options, context) {
  try {
    console.log(`Packaging ${context.projectName}...`);
    
    // Default options
    const defaultOptions = {
      outputPath: 'dist/pack',
      includeFiles: ['terra.json', 'README.md', 'LICENSE'],
      excludeFiles: ['node_modules/**/*', '**/*.test.ts', '**/*.spec.ts'],
      validateSchema: true,
      generateChecksums: true,
      generateSBOM: false,
      sbomFormat: 'cyclonedx',
      signPackage: false,
      compress: false,
      compressFormat: 'tgz'
    };
    
    // Merge options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Get project root
    const projectRoot = context.workspace.projects[context.projectName].root;
    
    // Check if terra.json exists
    const terraJsonPath = path.join(projectRoot, 'terra.json');
    if (!fs.existsSync(terraJsonPath)) {
      return { success: false, error: 'terra.json not found' };
    }
    
    // Validate terra.json against schema if enabled
    if (mergedOptions.validateSchema) {
      console.log('Validating terra.json against schema...');
      const validationResult = await validateTerraJson(terraJsonPath);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }
    }
    
    // Create output directories
    const outputDir = mergedOptions.outputPath;
    const projectOutputDir = path.join(outputDir, context.projectName);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(projectOutputDir)) {
      fs.mkdirSync(projectOutputDir, { recursive: true });
    }
    
    // Read terra.json
    const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
    
    // Copy files
    console.log('Copying files...');
    const includedFiles = await findFiles(projectRoot, mergedOptions.includeFiles, mergedOptions.excludeFiles);
    
    // Generate checksums if enabled
    const checksums = {};
    
    // Copy files
    for (const file of includedFiles) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(projectOutputDir, file);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, destPath);
      
      // Generate checksum if enabled
      if (mergedOptions.generateChecksums) {
        const fileContent = fs.readFileSync(sourcePath);
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        checksums[file] = hash;
      }
    }
    
    // Write checksums file if enabled
    if (mergedOptions.generateChecksums) {
      console.log('Generating checksums...');
      fs.writeFileSync(
        path.join(projectOutputDir, 'checksums.json'),
        JSON.stringify({
          format: 'sha256',
          generated: new Date().toISOString(),
          files: checksums
        }, null, 2)
      );
    }
    
    // Generate SBOM if enabled
    if (mergedOptions.generateSBOM) {
      console.log('Generating Software Bill of Materials...');
      await generateSBOM(terraJson, projectOutputDir, mergedOptions.sbomFormat);
    }
    
    // Sign package if enabled
    if (mergedOptions.signPackage) {
      console.log('Signing package...');
      await signPackage(projectOutputDir, mergedOptions.keyId);
    }
    
    // Compress package if enabled
    if (mergedOptions.compress) {
      console.log('Compressing package...');
      await compressPackage(projectOutputDir, mergedOptions.compressFormat);
    }
    
    console.log(`Successfully packaged ${context.projectName} to ${projectOutputDir}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error packaging component:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate terra.json against the schema
 */
async function validateTerraJson(terraJsonPath) {
  try {
    const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
    const schemaPath = path.resolve(__dirname, '../../schemas/terra.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const ajv = new Ajv();
    addFormats(ajv);
    
    const validate = ajv.compile(schema);
    const valid = validate(terraJson);
    
    if (!valid) {
      return {
        valid: false,
        error: `terra.json validation failed: ${JSON.stringify(validate.errors)}`
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Failed to validate terra.json: ${error.message}` };
  }
}

/**
 * Find files to include in package
 */
async function findFiles(projectRoot, includePatterns, excludePatterns) {
  // Gather all files that match include patterns
  let includedFiles = [];
  
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: projectRoot, nodir: true });
    includedFiles = [...includedFiles, ...matches];
  }
  
  // Filter out files that match exclude patterns
  if (excludePatterns && excludePatterns.length > 0) {
    const excludedFiles = new Set();
    
    for (const pattern of excludePatterns) {
      const matches = await glob(pattern, { cwd: projectRoot, nodir: true });
      matches.forEach(file => excludedFiles.add(file));
    }
    
    includedFiles = includedFiles.filter(file => !excludedFiles.has(file));
  }
  
  // Remove duplicates and sort
  return [...new Set(includedFiles)].sort();
}

/**
 * Generate Software Bill of Materials (SBOM)
 */
async function generateSBOM(terraJson, outputDir, format) {
  try {
    // Create a simple SBOM based on terra.json
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
          licenses: terraJson.license ? [{ license: { id: terraJson.license } }] : [],
          supplier: terraJson.author ? { name: terraJson.author } : undefined,
          purl: `pkg:${terraJson.type}/${terraJson.id}@${terraJson.version}`
        }
      },
      components: []
    };
    
    // Add dependencies from terra.json
    if (terraJson.dependencies && terraJson.dependencies.length > 0) {
      terraJson.dependencies.forEach(dependency => {
        const [name, version] = dependency.split('@');
        sbom.components.push({
          type: "library",
          name: name,
          version: version,
          purl: `pkg:${terraJson.type}/${name}@${version}`
        });
      });
    }
    
    // Write SBOM file
    fs.writeFileSync(
      path.join(outputDir, 'sbom.json'),
      JSON.stringify(sbom, null, 2)
    );
    
    return true;
  } catch (error) {
    console.error('Error generating SBOM:', error);
    return false;
  }
}

/**
 * Sign package with GPG
 */
async function signPackage(outputDir, keyId) {
  try {
    const checksumFile = path.join(outputDir, 'checksums.json');
    if (!fs.existsSync(checksumFile)) {
      console.warn('checksums.json not found, skipping signing');
      return false;
    }
    
    // Create signature file
    const signatureFile = path.join(outputDir, 'checksums.json.sig');
    
    // Sign using GPG
    let command = 'gpg --detach-sign --armor ';
    if (keyId) {
      command += `--local-user ${keyId} `;
    }
    command += checksumFile;
    
    childProcess.execSync(command);
    
    return true;
  } catch (error) {
    console.error('Error signing package:', error);
    return false;
  }
}

/**
 * Compress package
 */
async function compressPackage(outputDir, format) {
  try {
    const parentDir = path.dirname(outputDir);
    const packageName = path.basename(outputDir);
    const originalDir = process.cwd();
    
    // Change to parent directory to ensure relative paths are correct
    process.chdir(parentDir);
    
    let command = '';
    let outputFile = '';
    
    switch (format) {
      case 'tar':
        outputFile = `${packageName}.tar`;
        command = `tar -cf ${outputFile} ${packageName}`;
        break;
      case 'tgz':
        outputFile = `${packageName}.tgz`;
        command = `tar -czf ${outputFile} ${packageName}`;
        break;
      case 'zip':
        outputFile = `${packageName}.zip`;
        command = `zip -r ${outputFile} ${packageName}`;
        break;
      default:
        throw new Error(`Unsupported compression format: ${format}`);
    }
    
    // Execute compression command
    childProcess.execSync(command);
    
    // Create info file
    const infoFile = path.join(parentDir, `${outputFile}.info`);
    const info = {
      name: packageName,
      format: format,
      timestamp: new Date().toISOString(),
      size: fs.statSync(path.join(parentDir, outputFile)).size
    };
    
    fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
    
    // Restore original directory
    process.chdir(originalDir);
    
    return true;
  } catch (error) {
    console.error('Error compressing package:', error);
    return false;
  }
}