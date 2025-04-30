const { test, expect, describe, jest: jestObj } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const packExecutor = require('../src/executors/pack/executor');

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  copyFileSync: jest.fn()
}));

jest.mock('glob', () => ({
  glob: jest.fn()
}));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mockhash')
  })),
  randomUUID: jest.fn().mockReturnValue('mocked-uuid')
}));

// Setup mocks for each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Default mock implementations
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockImplementation((filePath) => {
    if (filePath.endsWith('terra.json')) {
      return JSON.stringify({
        id: 'test-component',
        type: 'service',
        name: 'Test Component',
        version: '1.0.0',
        description: 'Test component for testing',
        license: 'MIT',
        dependencies: ['dep1@1.0.0', 'dep2@2.0.0']
      });
    } else if (filePath.endsWith('schema.json')) {
      return JSON.stringify({
        type: 'object',
        required: ['id', 'type', 'name', 'version', 'description'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['service', 'bundle', 'plugin', 'library'] },
          name: { type: 'string' },
          version: { type: 'string' },
          description: { type: 'string' }
        }
      });
    }
    return '';
  });
  
  fs.statSync.mockReturnValue({
    isDirectory: () => false
  });
  
  require('glob').glob.mockResolvedValue([
    '/project/test-project/terra.json',
    '/project/test-project/README.md',
    '/project/test-project/src/index.js'
  ]);
});

describe('Pack Executor', () => {
  test('should validate terra.json successfully', async () => {
    // Setup test context
    const options = {
      outputPath: 'dist/pack',
      validateSchema: true
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('/project/test-project/terra.json');
    expect(fs.readFileSync).toHaveBeenCalledWith('/project/test-project/terra.json', 'utf8');
  });
  
  test('should fail if terra.json is invalid', async () => {
    // Setup invalid terra.json
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.endsWith('terra.json')) {
        return JSON.stringify({
          // Missing required fields
          id: 'test-component',
          type: 'invalid-type'
        });
      } else if (filePath.endsWith('schema.json')) {
        return JSON.stringify({
          type: 'object',
          required: ['id', 'type', 'name', 'version', 'description'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['service', 'bundle', 'plugin', 'library'] },
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' }
          }
        });
      }
      return '';
    });
    
    const options = {
      outputPath: 'dist/pack',
      validateSchema: true
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(false);
  });
  
  test('should collect and copy files', async () => {
    const options = {
      outputPath: 'dist/pack',
      includeFiles: ['terra.json', 'README.md', 'src/**/*.js'],
      excludeFiles: ['**/*.test.js']
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(true);
    expect(require('glob').glob).toHaveBeenCalled();
    expect(fs.copyFileSync).toHaveBeenCalledTimes(3); // 3 files from the mock glob result
  });
  
  test('should generate checksums', async () => {
    const options = {
      outputPath: 'dist/pack',
      generateChecksums: true
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    require('glob').glob.mockImplementation((pattern) => {
      if (pattern.includes('dist/pack/test-project/**/*')) {
        return Promise.resolve([
          'dist/pack/test-project/terra.json',
          'dist/pack/test-project/README.md',
          'dist/pack/test-project/src/index.js'
        ]);
      }
      return Promise.resolve([
        '/project/test-project/terra.json',
        '/project/test-project/README.md',
        '/project/test-project/src/index.js'
      ]);
    });
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('checksums.json'),
      expect.any(String)
    );
  });
  
  test('should generate SBOM', async () => {
    const options = {
      outputPath: 'dist/pack',
      generateSBOM: true,
      sbomFormat: 'cyclonedx'
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('sbom.json'),
      expect.any(String)
    );
  });
  
  test('should handle errors gracefully', async () => {
    // Simulate an error
    fs.existsSync.mockImplementation(() => {
      throw new Error('Simulated error');
    });
    
    const options = {
      outputPath: 'dist/pack'
    };
    
    const context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/test-project'
          }
        }
      }
    };
    
    // Execute the executor
    const result = await packExecutor(options, context);
    
    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('Simulated error');
  });
});