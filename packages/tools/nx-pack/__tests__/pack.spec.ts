import { vi, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import runExecutor from '../src/executors/pack/executor';

// Mock dependencies
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(() => ({
    isDirectory: vi.fn().mockReturnValue(false)
  })),
  copyFileSync: vi.fn()
}));

vi.mock('glob', () => ({
  glob: vi.fn(),
  globSync: vi.fn()
}));

vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'mockedHash')
    }))
  })),
  randomUUID: vi.fn(() => 'mocked-uuid')
}));

// Test context setup
const mockContext = {
  root: '/workspace',
  projectName: 'test-project',
  workspace: {
    projects: {
      'test-project': {
        root: '/workspace/test-project'
      }
    }
  },
  isVerbose: false
};

// Test options setup
const mockOptions = {
  outputPath: 'dist/pack',
  includeFiles: ['terra.json', 'README.md', 'LICENSE'],
  generateChecksums: true
};

// Setup mock filesystem data
const mockTerraJson = {
  id: 'test-project',
  type: 'service',
  name: 'Test Project',
  version: '1.0.0',
  description: 'Test project for unit tests'
};

const mockPackageJson = {
  name: 'test-project',
  version: '1.0.0',
  dependencies: {
    'dependency1': '1.0.0',
    'dependency2': '2.0.0'
  },
  devDependencies: {
    'dev-dependency1': '1.0.0'
  }
};

describe('pack executor', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup fs mocks
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('terra.json') || path.includes('package.json')) {
        return true;
      }
      return false;
    });
    
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('terra.json')) {
        return JSON.stringify(mockTerraJson);
      } else if (path.includes('package.json')) {
        return JSON.stringify(mockPackageJson);
      }
      return '';
    });
    
    // Setup glob mock
    const { globSync } = require('glob');
    (globSync as jest.Mock).mockReturnValue(['terra.json', 'README.md', 'LICENSE']);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should validate the terra.json file', async () => {
    const result = await runExecutor(mockOptions, mockContext as any);
    
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join(mockContext.workspace.projects['test-project'].root, 'terra.json')
    );
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
  
  it('should create output directory if it does not exist', async () => {
    await runExecutor(mockOptions, mockContext as any);
    
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(mockOptions.outputPath, mockContext.projectName),
      { recursive: true }
    );
  });
  
  it('should copy files according to the include patterns', async () => {
    await runExecutor(mockOptions, mockContext as any);
    
    const { globSync } = require('glob');
    expect(globSync).toHaveBeenCalledWith(
      'terra.json',
      { cwd: mockContext.workspace.projects['test-project'].root, nodir: false }
    );
    expect(fs.copyFileSync).toHaveBeenCalled();
  });
  
  it('should generate an SBOM file', async () => {
    await runExecutor(mockOptions, mockContext as any);
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(`${mockContext.projectName}.sbom.json`),
      expect.stringContaining('CycloneDX')
    );
  });
  
  it('should generate checksums if enabled', async () => {
    await runExecutor(mockOptions, mockContext as any);
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('checksums.json'),
      expect.any(String)
    );
  });
  
  it('should fail if terra.json is missing', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    const result = await runExecutor(mockOptions, mockContext as any);
    
    expect(result.success).toBe(false);
  });
});