import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { globSync } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { PackExecutorSchema } from './schema';

interface PackExecutorContext {
  root: string;
  projectName: string;
  workspace: {
    projects: Record<string, { root: string }>;
  };
  isVerbose: boolean;
}

/**
 * Validates a terra.json file against the schema
 * @param terraJsonPath Path to the terra.json file
 * @returns True if valid, false if invalid
 */
async function validateTerraJson(terraJsonPath: string): Promise<boolean> {
  try {
    // Read the terra.json file
    const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
    
    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../../schemas/terra.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Initialize Ajv
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    
    // Validate the terra.json against the schema
    const validate = ajv.compile(schema);
    const valid = validate(terraJson);
    
    if (!valid) {
      console.error('terra.json validation failed:');
      console.error(validate.errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating terra.json:', error);
    return false;
  }
}

/**
 * Generate a checksum for a file
 * @param filePath Path to the file
 * @returns SHA256 hash of the file
 */
function generateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Generate a Software Bill of Materials (SBOM)
 * @param projectRoot Path to the project root
 * @param outputPath Path to write the SBOM
 * @param format Format to use (cyclonedx or spdx)
 * @param componentName Name of the component
 * @param componentVersion Version of the component
 */
async function generateSBOM(
  projectRoot: string, 
  outputPath: string, 
  format: 'cyclonedx' | 'spdx',
  componentName: string,
  componentVersion: string
): Promise<void> {
  const sbomFilePath = path.join(outputPath, `${componentName}.sbom.json`);
  
  try {
    // Read package.json for dependencies
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const dependencies: Record<string, string> = {};
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      Object.assign(dependencies, packageJson.dependencies || {});
      // Only include production dependencies, not dev dependencies
    }
    
    // Generate CycloneDX SBOM
    if (format === 'cyclonedx') {
      const sbom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        serialNumber: 'urn:uuid:' + Math.random().toString(36).substring(2, 15),
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
            name: componentName,
            version: componentVersion
          }
        },
        components: Object.entries(dependencies).map(([name, version]) => ({
          type: 'library',
          name,
          version: version.replace(/^[~^]/, '')
        }))
      };
      
      fs.writeFileSync(sbomFilePath, JSON.stringify(sbom, null, 2));
      
    } 
    // Generate SPDX SBOM (simplified version)
    else if (format === 'spdx') {
      const sbom = {
        spdxVersion: 'SPDX-2.2',
        dataLicense: 'CC0-1.0',
        SPDXID: 'SPDXRef-DOCUMENT',
        name: `${componentName}-${componentVersion}-sbom`,
        documentNamespace: `https://terrafusion.io/spdx/${componentName}/${componentVersion}`,
        creationInfo: {
          created: new Date().toISOString(),
          creators: ['Tool: @terrafusion/nx-pack-1.0.0']
        },
        packages: [
          {
            name: componentName,
            SPDXID: `SPDXRef-Package-${componentName}`,
            versionInfo: componentVersion,
            downloadLocation: 'NOASSERTION',
            filesAnalyzed: false,
            licenseConcluded: 'NOASSERTION'
          },
          ...Object.entries(dependencies).map(([name, version]) => ({
            name,
            SPDXID: `SPDXRef-Package-${name}`,
            versionInfo: version.replace(/^[~^]/, ''),
            downloadLocation: 'NOASSERTION',
            filesAnalyzed: false,
            licenseConcluded: 'NOASSERTION'
          }))
        ],
        relationships: [
          {
            spdxElementId: 'SPDXRef-DOCUMENT',
            relatedSpdxElement: `SPDXRef-Package-${componentName}`,
            relationshipType: 'DESCRIBES'
          },
          ...Object.keys(dependencies).map(name => ({
            spdxElementId: `SPDXRef-Package-${componentName}`,
            relatedSpdxElement: `SPDXRef-Package-${name}`,
            relationshipType: 'DEPENDS_ON'
          }))
        ]
      };
      
      fs.writeFileSync(sbomFilePath, JSON.stringify(sbom, null, 2));
    }
    
    console.log(`Generated SBOM in ${format} format at ${sbomFilePath}`);
  } catch (error) {
    console.error('Error generating SBOM:', error);
  }
}

/**
 * The Pack executor function
 */
export default async function runExecutor(
  options: PackExecutorSchema,
  context: PackExecutorContext
): Promise<{ success: boolean }> {
  const {
    outputPath = 'dist/pack',
    includeFiles = [
      'terra.json', 
      'README.md', 
      'LICENSE', 
      'bin/**/*', 
      'lib/**/*', 
      'scripts/**/*', 
      'charts/**/*'
    ],
    excludeFiles = [
      'node_modules/**/*', 
      '**/*.test.ts', 
      '**/*.spec.ts', 
      '**/*.stories.tsx'
    ],
    generateChecksums = true,
    validateSchema = true,
    generateSBOM = true,
    sbomFormat = 'cyclonedx'
  } = options;
  
  console.log(`Packaging ${context.projectName}...`);
  
  // Get project root
  const projectRoot = context.workspace.projects[context.projectName].root;
  
  // Check for terra.json
  const terraJsonPath = path.join(projectRoot, 'terra.json');
  if (!fs.existsSync(terraJsonPath)) {
    console.error(`Error: terra.json not found at ${terraJsonPath}`);
    return { success: false };
  }
  
  // Validate terra.json
  if (validateSchema) {
    console.log('Validating terra.json...');
    const isValid = await validateTerraJson(terraJsonPath);
    if (!isValid) {
      console.error('terra.json validation failed');
      return { success: false };
    }
    console.log('terra.json validation passed');
  }
  
  // Read terra.json for component metadata
  const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
  const componentName = terraJson.id;
  const componentVersion = terraJson.version;
  
  // Create output directory
  const componentOutputPath = path.join(outputPath, context.projectName);
  fs.mkdirSync(componentOutputPath, { recursive: true });
  
  // Copy files
  console.log('Copying files...');
  const checksums: Record<string, string> = {};
  
  for (const pattern of includeFiles) {
    const files = globSync(pattern, { 
      cwd: projectRoot, 
      nodir: false 
    });
    
    for (const file of files) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(componentOutputPath, file);
      
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      
      // Skip excluded files
      const isExcluded = excludeFiles.some(excludePattern => {
        const excludedFiles = globSync(excludePattern, { 
          cwd: projectRoot, 
          nodir: false 
        });
        return excludedFiles.includes(file);
      });
      
      if (isExcluded) {
        if (context.isVerbose) {
          console.log(`Skipping excluded file: ${file}`);
        }
        continue;
      }
      
      // Copy file
      try {
        // Check if it's a directory
        if (fs.statSync(sourcePath).isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
        } else {
          fs.copyFileSync(sourcePath, destPath);
          
          // Generate checksum
          if (generateChecksums) {
            checksums[file] = generateChecksum(sourcePath);
          }
        }
        
        if (context.isVerbose) {
          console.log(`Copied: ${file}`);
        }
      } catch (error) {
        console.error(`Error copying ${file}:`, error);
      }
    }
  }
  
  // Write checksums
  if (generateChecksums) {
    const checksumPath = path.join(componentOutputPath, 'checksums.json');
    fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));
    console.log(`Generated checksums at ${checksumPath}`);
  }
  
  // Generate SBOM
  if (generateSBOM) {
    console.log('Generating SBOM...');
    await generateSBOM(
      projectRoot, 
      componentOutputPath, 
      sbomFormat,
      componentName,
      componentVersion
    );
  }
  
  console.log(`${context.projectName} packaged successfully to ${componentOutputPath}`);
  return { success: true };
}