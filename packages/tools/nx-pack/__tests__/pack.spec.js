const executor = require('../src/executors/pack/executor');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('glob');
jest.mock('crypto');
jest.mock('ajv');
jest.mock('ajv-formats');

describe('Pack Executor', () => {
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Setup common mock behaviors
    path.join.mockImplementation((...args) => args.join('/'));
    path.relative.mockImplementation((from, to) => {
      return to.replace(from, '').replace(/^\//, '');
    });
    path.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
    
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.endsWith('terra.json')) {
        return JSON.stringify({
          id: 'test-component',
          type: 'service',
          name: 'Test Component',
          version: '1.0.0',
          description: 'Test component for unit tests',
          maintainer: 'Test Team <test@example.com>',
          license: 'MIT',
          dependencies: ['dep1@1.0.0', 'dep2@2.0.0'],
          infra: {
            requirements: {
              cpu: '1',
              memory: '1Gi'
            }
          }
        });
      }
      return '';
    });
    
    // Mock workspace context
    global.context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/project/root'
          }
        }
      }
    };
  });
  
  it('should execute successfully with default options', async () => {
    const options = {
      outputPath: 'dist/pack'
    };
    
    const result = await executor(options, global.context);
    
    expect(result.success).toBe(true);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('test-component'), expect.any(Object));
  });
  
  it('should fail if terra.json is missing', async () => {
    fs.existsSync.mockReturnValueOnce(false);
    
    const options = {
      outputPath: 'dist/pack'
    };
    
    const result = await executor(options, global.context);
    
    expect(result.success).toBe(false);
  });
  
  it('should generate checksums when enabled', async () => {
    const options = {
      outputPath: 'dist/pack',
      generateChecksums: true,
      includeFiles: ['terra.json', 'README.md']
    };
    
    const result = await executor(options, global.context);
    
    expect(result.success).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('checksums.json'),
      expect.any(String)
    );
  });
  
  it('should generate SBOM when enabled', async () => {
    const options = {
      outputPath: 'dist/pack',
      generateSBOM: true,
      sbomFormat: 'cyclonedx'
    };
    
    const result = await executor(options, global.context);
    
    expect(result.success).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('sbom.json'),
      expect.any(String)
    );
  });
  
  it('should handle errors gracefully', async () => {
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    const options = {
      outputPath: 'dist/pack'
    };
    
    const result = await executor(options, global.context);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});