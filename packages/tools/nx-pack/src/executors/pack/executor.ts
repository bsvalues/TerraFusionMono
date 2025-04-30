import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as child_process from 'child_process';
import * as Ajv from 'ajv';
import terraSchema from '../../schemas/terra.json';
import { PackExecutorSchema } from './schema';

// Initialize Ajv for schema validation
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
});
const validateTerraJson = ajv.compile(terraSchema);

// SBOM Generation function
async function generateSBOM(projectRoot: string, outputPath: string, projectName: string): Promise<string> {
  const sbomFilePath = path.join(outputPath, `${projectName}.sbom.json`);
  
  console.log(`Generating SBOM for ${projectName}...`);
  
  try {
    // Use cyclonedx-node-module to generate SBOM if available
    // Falling back to a simpler implementation if not available
    const deps = getDependencies(projectRoot);
    
    const sbom = {
      bomFormat: "CycloneDX",
      specVersion: "1.4",
      serialNumber: "urn:uuid:" + crypto.randomUUID(),
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: "TerraFusion",
            name: "@terrafusion/nx-pack",
            version: "1.0.0"
          }
        ],
        component: {
          type: "application",
          name: projectName,
          version: getPackageVersion(projectRoot)
        }
      },
      components: deps.map(dep => ({
        type: "library",
        name: dep.name,
        version: dep.version
      }))
    };

    fs.writeFileSync(sbomFilePath, JSON.stringify(sbom, null, 2));
    console.log(`✅ SBOM generated at ${sbomFilePath}`);
    return sbomFilePath;
  } catch (error) {
    console.error(`Error generating SBOM: ${error}`);
    throw error;
  }
}

// Get package dependencies
function getDependencies(projectRoot: string): Array<{name: string, version: string}> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = [];
  
  // Include dependencies and devDependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      deps.push({ name, version: version as string });
    }
  }
  
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      deps.push({ name, version: version as string });
    }
  }
  
  return deps;
}

// Get package version
function getPackageVersion(projectRoot: string): string {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return '0.0.0';
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version || '0.0.0';
}

// Validate terra.json against schema
function validateTerraConfig(projectRoot: string): boolean {
  const terraJsonPath = path.join(projectRoot, 'terra.json');
  
  if (!fs.existsSync(terraJsonPath)) {
    console.error(`Error: terra.json not found in ${projectRoot}`);
    return false;
  }
  
  const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));
  const valid = validateTerraJson(terraJson);
  
  if (!valid) {
    console.error('Terra.json validation errors:');
    console.error(validateTerraJson.errors);
    return false;
  }
  
  return true;
}

// Generate checksums for all files in a directory
function generateChecksums(directory: string, outputFile: string): void {
  console.log(`Generating checksums for files in ${directory}...`);
  
  const checksums = {};
  const filesToHash = [];
  
  function traverseDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverseDirectory(fullPath);
      } else {
        // Skip checksums file itself if it exists
        if (fullPath !== outputFile) {
          filesToHash.push(fullPath);
        }
      }
    }
  }
  
  traverseDirectory(directory);
  
  // Sort files for consistent output
  filesToHash.sort();
  
  for (const file of filesToHash) {
    const relPath = path.relative(directory, file);
    const fileBuffer = fs.readFileSync(file);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    checksums[relPath] = hash;
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(checksums, null, 2));
  console.log(`✅ Checksums written to ${outputFile}`);
}

export default async function runExecutor(
  options: PackExecutorSchema,
  context: ExecutorContext
) {
  console.log('Executing pack...');
  
  // Extract project information
  const projectName = context.projectName;
  const projectRoot = context.workspace.projects[projectName].root;
  
  // Validate configuration
  if (!validateTerraConfig(projectRoot)) {
    return { success: false };
  }

  // Create output directory
  const outputDir = path.join(options.outputPath, projectName);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy specified files to output
  for (const pattern of options.includeFiles) {
    try {
      // Use glob pattern matching to copy files
      const { globSync } = await import('glob');
      const files = globSync(pattern, { cwd: projectRoot, nodir: false });
      
      for (const file of files) {
        const src = path.join(projectRoot, file);
        const dest = path.join(outputDir, file);
        
        // Create directory structure
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy file or directory
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    } catch (error) {
      console.error(`Error copying files for pattern ${pattern}: ${error}`);
      return { success: false };
    }
  }
  
  // Generate SBOM
  try {
    await generateSBOM(projectRoot, outputDir, projectName);
  } catch (error) {
    console.error(`Error generating SBOM: ${error}`);
    // Continue despite SBOM generation error
  }
  
  // Generate checksums if requested
  if (options.generateChecksums) {
    try {
      const checksumFile = path.join(outputDir, 'checksums.json');
      generateChecksums(outputDir, checksumFile);
    } catch (error) {
      console.error(`Error generating checksums: ${error}`);
      return { success: false };
    }
  }

  console.log(`✅ Package created at ${outputDir}`);
  
  return {
    success: true,
  };
}