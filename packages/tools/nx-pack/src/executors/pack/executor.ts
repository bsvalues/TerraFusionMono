import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PackExecutorOptions {
  outputPath: string;
  generateHash: boolean;
}

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export default async function packExecutor(
  options: PackExecutorOptions,
  context: ExecutorContext
) {
  const { projectName } = context;
  const { outputPath = 'dist/pack', generateHash = true } = options;

  if (!projectName) {
    console.error('No project name provided');
    return { success: false };
  }

  // Get the project configuration
  const projectConfig = context.workspace?.projects?.[projectName];
  if (!projectConfig) {
    console.error(`Cannot find project configuration for ${projectName}`);
    return { success: false };
  }

  const projectRoot = projectConfig.root;
  const terraJsonPath = path.join(projectRoot, 'terra.json');

  // Check if terra.json exists
  if (!fs.existsSync(terraJsonPath)) {
    console.error(`No terra.json found at ${terraJsonPath}`);
    return { success: false };
  }

  // Create the output directory
  const projectOutputPath = path.join(outputPath, projectName);
  const fullOutputPath = path.join(context.root, projectOutputPath);
  
  if (!fs.existsSync(fullOutputPath)) {
    fs.mkdirSync(fullOutputPath, { recursive: true });
  }

  // Copy terra.json to the output directory
  const outputTerraJsonPath = path.join(fullOutputPath, 'terra.json');
  fs.copyFileSync(terraJsonPath, outputTerraJsonPath);

  console.log(`Copied ${terraJsonPath} to ${outputTerraJsonPath}`);

  // Generate SHA256 hash if requested
  if (generateHash) {
    const hash = computeSha256(outputTerraJsonPath);
    const hashFilePath = path.join(fullOutputPath, `${projectName}.sha256`);
    fs.writeFileSync(hashFilePath, hash);
    console.log(`Generated hash and wrote to ${hashFilePath}`);
  }

  console.log(`📦 packed ${projectName}`);

  return {
    success: true
  };
}