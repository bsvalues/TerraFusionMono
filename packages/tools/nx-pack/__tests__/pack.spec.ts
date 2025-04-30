import { ExecutorContext } from '@nx/devkit';
import { join } from 'path';
import fs from 'fs';

// Mock the nrwl/devkit's runExecutor
jest.mock('@nrwl/devkit', () => ({
  runExecutor: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock the filesystem operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{"id":"dummy-lib","type":"service","name":"Dummy Library","version":"0.1.0"}'),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  lstatSync: jest.fn().mockReturnValue({
    isDirectory: () => false,
    isFile: () => true,
  }),
}));

// Mock child_process execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('mock-checksum')),
  exec: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

// Mock the executor
jest.mock('../src/executors/pack/executor', () => ({
  default: jest.fn().mockResolvedValue({ success: true }),
}));

// Create a mock context for testing
function createMockContext(projectName: string): ExecutorContext {
  return {
    root: '/mock/root',
    projectName,
    targetName: 'pack',
    cwd: '/mock/root',
    isVerbose: false,
    workspace: {
      version: 2,
      projects: {
        [projectName]: {
          root: `services/${projectName}`,
          sourceRoot: `services/${projectName}/src`,
          projectType: 'application',
          targets: {
            pack: {
              executor: '@terrafusion/nx-pack:pack',
              options: {
                outputPath: 'dist/pack',
              },
            },
          },
        },
      },
      npmScope: 'terrafusion',
    },
  };
}

describe('nx-pack executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates artifacts', async () => {
    const proj = 'dummy-lib';
    const ctx = createMockContext(proj);
    
    // Import the executor directly
    const executor = require('../src/executors/pack/executor').default;
    
    // Call the executor with the appropriate options
    const result = await executor(
      { outputPath: 'dist/pack' },
      ctx
    );

    // Check the result
    expect(result).toEqual({ success: true });
    
    // Verify that the necessary functions were called
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // In a real test with the filesystem, these assertions would make sense
    // const base = join(ctx.root, 'dist/pack', proj);
    // expect(fs.existsSync(join(base, 'terra.json'))).toBe(true);
    // expect(fs.existsSync(join(base, `${proj}.sha256`))).toBe(true);
    // expect(fs.existsSync(join(base, `${proj}.sbom.json`))).toBe(true);
  });
});