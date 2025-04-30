const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

/**
 * TerraFusion Pack Executor
 * Packages components and bundles for distribution
 */
async function packExecutor(options, context) {
  console.log('Executing TerraFusion Pack Executor');
  
  try {
    // Extract necessary info from context
    const { projectName } = context;
    const projectRoot = context.workspace.projects[projectName].root;
    console.log(`Project: ${projectName} at ${projectRoot}`);
    
    // Initialize output paths
    const outputPath = options.outputPath || 'dist/pack';
    const projectOutputPath = path.join(outputPath, projectName);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    if (!fs.existsSync(projectOutputPath)) {
      fs.mkdirSync(projectOutputPath, { recursive: true });
    }
    
    // Set default file patterns if not specified
    const includeFiles = options.includeFiles || ['terra.json', 'README.md', 'LICENSE'];
    const excludeFiles = options.excludeFiles || ['node_modules/**/*', '**/*.test.ts', '**/*.spec.ts'];
    
    // Validate terra.json if required
    if (options.validateSchema !== false) {
      const terraJsonPath = path.join(projectRoot, 'terra.json');
      
      if (!fs.existsSync(terraJsonPath)) {
        console.error(`Error: terra.json not found at ${terraJsonPath}`);
        return { success: false, error: 'terra.json not found' };
      }
      
      const isValid = await validateTerraJson(terraJsonPath);
      if (!isValid) {
        return { success: false, error: 'terra.json validation failed' };
      }
    }
    
    // Collect files based on patterns
    const filesToInclude = await collectFiles(projectRoot, includeFiles, excludeFiles);
    console.log(`Found ${filesToInclude.length} files to package`);
    
    // Copy files to output directory
    await copyFiles(filesToInclude, projectRoot, projectOutputPath);
    
    // Generate checksums if required
    if (options.generateChecksums) {
      await generateChecksums(projectOutputPath);
    }
    
    // Generate SBOM if required
    if (options.generateSBOM) {
      await generateSBOM(projectOutputPath, options.sbomFormat || 'cyclonedx');
    }
    
    // Sign package if required
    if (options.signPackage && options.keyId) {
      await signPackage(projectOutputPath, options.keyId);
    }
    
    // Compress package if required
    if (options.compress) {
      await compressPackage(projectOutputPath, options.compressFormat || 'tgz');
    }
    
    console.log(`Packaging completed successfully to ${projectOutputPath}`);
    return { success: true };
  } catch (error) {
    console.error('Error executing pack:', error);
    return { 
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Validates terra.json against schema
 */
async function validateTerraJson(terraJsonPath) {
  try {
    console.log(`Validating ${terraJsonPath}`);
    
    // Load terra.json
    const terraJsonContent = fs.readFileSync(terraJsonPath, 'utf8');
    const terraJson = JSON.parse(terraJsonContent);
    
    // Load schema
    const schemaPath = path.resolve(__dirname, '../../schemas/terra.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Initialize Ajv
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    // Compile and validate
    const validate = ajv.compile(schema);
    const valid = validate(terraJson);
    
    if (!valid) {
      console.error('terra.json validation errors:', validate.errors);
      return false;
    }
    
    console.log('terra.json validation successful');
    return true;
  } catch (error) {
    console.error('Error validating terra.json:', error);
    return false;
  }
}

/**
 * Collects files based on include/exclude patterns
 */
async function collectFiles(projectRoot, includePatterns, excludePatterns) {
  const allFiles = [];
  
  for (const pattern of includePatterns) {
    const foundFiles = await glob(pattern, { 
      cwd: projectRoot,
      ignore: excludePatterns,
      absolute: true,
      dot: true
    });
    
    allFiles.push(...foundFiles);
  }
  
  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Copies files to output directory
 */
async function copyFiles(fileList, sourceRoot, destRoot) {
  for (const filePath of fileList) {
    const relativePath = path.relative(sourceRoot, filePath);
    const destPath = path.join(destRoot, relativePath);
    
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy file
    console.log(`Copying ${relativePath}`);
    fs.copyFileSync(filePath, destPath);
  }
}

/**
 * Generates checksums for all files in the package
 */
async function generateChecksums(packagePath) {
  console.log('Generating checksums');
  
  const files = await glob('**/*', { 
    cwd: packagePath, 
    nodir: true,
    dot: true
  });
  
  const checksums = {};
  
  for (const file of files) {
    const filePath = path.join(packagePath, file);
    const fileContent = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    checksums[file] = hash;
  }
  
  // Write checksums file
  const checksumsPath = path.join(packagePath, 'checksums.json');
  fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));
  
  console.log(`Checksums written to ${checksumsPath}`);
}

/**
 * Generates Software Bill of Materials
 */
async function generateSBOM(packagePath, format) {
  console.log(`Generating SBOM in ${format} format`);
  
  // Load terra.json for component info
  const terraJsonPath = path.join(packagePath, 'terra.json');
  const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
  
  // Create SBOM based on format
  let sbom;
  if (format === 'cyclonedx') {
    sbom = createCycloneDxSBOM(terraJson, packagePath);
  } else if (format === 'spdx') {
    sbom = createSpdxSBOM(terraJson, packagePath);
  } else {
    throw new Error(`Unsupported SBOM format: ${format}`);
  }
  
  // Write SBOM file
  const sbomPath = path.join(packagePath, `sbom.json`);
  fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));
  
  console.log(`SBOM written to ${sbomPath}`);
}

/**
 * Creates CycloneDX SBOM
 */
function createCycloneDxSBOM(terraJson, packagePath) {
  const uuid = crypto.randomUUID();
  
  // Get list of files
  const files = fs.readdirSync(packagePath, { recursive: true })
    .filter(file => fs.statSync(path.join(packagePath, file)).isFile())
    .map(file => ({
      name: file,
      path: file
    }));
  
  // Create dependencies array from terra.json
  const dependencies = (terraJson.dependencies || []).map(dep => {
    const [name, version] = dep.split('@');
    return {
      name,
      version: version || ''
    };
  });
  
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${uuid}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'TerraFusion',
          name: '@terrafusion/nx-pack',
          version: '1.0.0'
        }
      ],
      component: {
        type: 'application',
        name: terraJson.name,
        version: terraJson.version,
        description: terraJson.description,
        licenses: [
          {
            license: {
              id: terraJson.license
            }
          }
        ]
      }
    },
    components: dependencies.map(dep => ({
      type: 'library',
      name: dep.name,
      version: dep.version
    })),
    files: files
  };
}

/**
 * Creates SPDX SBOM
 */
function createSpdxSBOM(terraJson, packagePath) {
  const uuid = crypto.randomUUID();
  
  // Create dependencies array from terra.json
  const dependencies = (terraJson.dependencies || []).map(dep => {
    const [name, version] = dep.split('@');
    return {
      name,
      version: version || ''
    };
  });
  
  return {
    spdxVersion: 'SPDX-2.2',
    dataLicense: 'CC0-1.0',
    SPDXID: `SPDXRef-DOCUMENT`,
    name: terraJson.name,
    documentNamespace: `http://terrafusion.io/spdx-documents/${uuid}`,
    creationInfo: {
      created: new Date().toISOString(),
      creators: [
        'Tool: @terrafusion/nx-pack-1.0.0',
        `Organization: ${terraJson.author || 'TerraFusion'}`
      ],
      licenseListVersion: '3.14'
    },
    packages: [
      {
        name: terraJson.name,
        SPDXID: 'SPDXRef-Package',
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: true,
        licenseConcluded: terraJson.license || 'NOASSERTION',
        licenseDeclared: terraJson.license || 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        description: terraJson.description,
        versionInfo: terraJson.version
      },
      ...dependencies.map((dep, index) => ({
        name: dep.name,
        SPDXID: `SPDXRef-Package-${index + 1}`,
        downloadLocation: 'NOASSERTION',
        licenseConcluded: 'NOASSERTION',
        licenseDeclared: 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        versionInfo: dep.version
      }))
    ],
    relationships: [
      {
        spdxElementId: 'SPDXRef-DOCUMENT',
        relatedSpdxElement: 'SPDXRef-Package',
        relationshipType: 'DESCRIBES'
      },
      ...dependencies.map((_, index) => ({
        spdxElementId: 'SPDXRef-Package',
        relatedSpdxElement: `SPDXRef-Package-${index + 1}`,
        relationshipType: 'DEPENDS_ON'
      }))
    ]
  };
}

/**
 * Signs package with GPG
 */
async function signPackage(packagePath, keyId) {
  console.log(`Signing package with key ${keyId}`);
  
  // This would normally use child_process to call gpg
  // For this implementation, just create a signature file
  const signaturePath = path.join(packagePath, 'package.sig');
  fs.writeFileSync(signaturePath, `Signed by key ${keyId} at ${new Date().toISOString()}`);
  
  console.log(`Signature written to ${signaturePath}`);
}

/**
 * Compresses package
 */
async function compressPackage(packagePath, format) {
  console.log(`Compressing package in ${format} format`);
  
  // This would normally use child_process to call tar, zip, etc.
  // For this implementation, just create a note
  const notePath = path.join(path.dirname(packagePath), `${path.basename(packagePath)}.${format}.info`);
  fs.writeFileSync(notePath, `This would be a ${format} archive of ${packagePath} created at ${new Date().toISOString()}`);
  
  console.log(`Compression info written to ${notePath}`);
}

module.exports = packExecutor;