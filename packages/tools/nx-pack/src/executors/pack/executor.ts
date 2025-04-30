import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface PackExecutorOptions {
  outputPath: string;
  includeFiles?: string[];
  excludeFiles?: string[];
  generateChecksums?: boolean;
}

function computeHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export default async function packExecutor(
  options: PackExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  console.log('Executing Pack...');

  const projectName = context.projectName;
  if (!projectName) {
    console.error('No project name provided');
    return { success: false };
  }

  console.log(`Packaging project: ${projectName}`);

  const projectRoot = context.workspace.projects[projectName]?.root;
  if (!projectRoot) {
    console.error(`Could not find root for project ${projectName}`);
    return { success: false };
  }

  // Load terra.json if exists
  let terraConfig = null;
  const terraConfigPath = path.join(projectRoot, 'terra.json');
  if (fs.existsSync(terraConfigPath)) {
    try {
      terraConfig = JSON.parse(fs.readFileSync(terraConfigPath, 'utf8'));
      console.log(`Found terra.json for ${projectName}`);
    } catch (e) {
      console.error(`Error parsing terra.json: ${e}`);
    }
  }

  // Determine the output directory
  const packageId = terraConfig?.id || projectName;
  const outputDir = path.join(options.outputPath, packageId);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  // Define default include and exclude patterns
  const includeFiles = options.includeFiles || ['terra.json', 'README.md', 'LICENSE'];
  const excludeFiles = options.excludeFiles || ['node_modules', '.git', 'dist'];

  // Copy included files to the output directory
  const copiedFiles: string[] = [];

  for (const includePattern of includeFiles) {
    const sourcePath = path.join(projectRoot, includePattern);
    if (fs.existsSync(sourcePath)) {
      const targetPath = path.join(outputDir, includePattern);
      
      // Create directory if it doesn't exist
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      copiedFiles.push(includePattern);
      console.log(`Copied ${includePattern} to ${targetPath}`);
    } else {
      console.warn(`Warning: File not found: ${sourcePath}`);
    }
  }

  // Generate checksums if required
  if (options.generateChecksums) {
    const checksumFile = path.join(outputDir, `${packageId}.sha256`);
    const checksumContent = copiedFiles
      .map(file => {
        const filePath = path.join(outputDir, file);
        const hash = computeHash(filePath);
        return `${hash}  ${file}`;
      })
      .join('\n');
    
    fs.writeFileSync(checksumFile, checksumContent);
    console.log(`Generated checksums: ${checksumFile}`);
  }

  console.log(`Package created successfully at: ${outputDir}`);
  return { success: true };
}