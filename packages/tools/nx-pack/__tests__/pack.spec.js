const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const packExecutor = require('../src/executors/pack/executor');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('glob');
jest.mock('ajv');
jest.mock('ajv-formats');
jest.mock('crypto');

describe('Pack Executor', () => {
  let context;
  let options;
  
  beforeEach(() => {
    // Setup test context
    context = {
      projectName: 'test-project',
      workspace: {
        projects: {
          'test-project': {
            root: '/test/root'
          }
        }
      }
    };
    
    // Setup test options
    options = {
      outputPath: 'dist/pack',
      includeFiles: ['terra.json', 'README.md'],
      excludeFiles: ['node_modules/**/*'],
      validateSchema: true,
      generateChecksums: true
    };
    
    // Mock filesystem
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('terra.json')) return true;
      if (path === 'dist/pack') return false;
      if (path === 'dist/pack/test-project') return false;
      return true;
    });
    
    fs.mkdirSync.mockImplementation(() => undefined);
    fs.readFileSync.mockImplementation((path) => {
      if (path.includes('terra.json')) {
        return JSON.stringify({
          id: 'test-project',
          type: 'service',
          name: 'Test Project',
          version: '1.0.0',
          description: 'Test project for unit testing'
        });
      }
      if (path.includes('schema.json')) {
        return JSON.stringify({
          type: 'object',
          required: ['id', 'type', 'name', 'version', 'description'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' }
          }
        });
      }
      return '';
    });
    
    // Mock path functions
    path.join.mockImplementation((...args) => args.join('/'));
    path.resolve.mockImplementation((...args) => args.join('/'));
    path.relative.mockImplementation((from, to) => {
      return to.replace(from, '').replace(/^\//, '');
    });
    path.dirname.mockImplementation((p) => {
      return p.split('/').slice(0, -1).join('/');
    });
    path.basename.mockImplementation((p) => {
      return p.split('/').pop();
    });
    
    // Mock Ajv
    const mockAjv = require('ajv');
    mockAjv.mockImplementation(() => ({
      compile: () => {
        return (data) => true; // Always validate successfully in test
      }
    }));
    
    // Mock crypto
    const mockCrypto = require('crypto');
    mockCrypto.createHash.mockImplementation(() => ({
      update: () => ({
        digest: () => 'mock-hash-123456'
      })
    }));
    mockCrypto.randomUUID.mockImplementation(() => 'mock-uuid-123456');
    
    // Mock glob
    const mockGlob = require('glob');
    mockGlob.glob.mockImplementation(async () => ['file1.js', 'file2.js']);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create output directories if they do not exist', async () => {
    await packExecutor(options, context);
    
    expect(fs.mkdirSync).toHaveBeenCalledWith('dist/pack', { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith('dist/pack/test-project', { recursive: true });
  });
  
  it('should validate terra.json against schema', async () => {
    await packExecutor(options, context);
    
    expect(fs.readFileSync).toHaveBeenCalledWith('/test/root/terra.json', 'utf8');
    expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('schemas/terra.json'), 'utf8');
  });
  
  it('should return error if terra.json is not found', async () => {
    fs.existsSync.mockImplementationOnce((path) => false);
    
    const result = await packExecutor(options, context);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('terra.json not found');
  });
  
  it('should copy files to output directory', async () => {
    await packExecutor(options, context);
    
    // Should have called copyFileSync for each file
    expect(fs.copyFileSync).toHaveBeenCalled();
  });
  
  it('should generate checksums when option is enabled', async () => {
    await packExecutor(options, context);
    
    // Should have written checksums file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('checksums.json'),
      expect.any(String)
    );
  });
  
  it('should skip generating checksums when option is disabled', async () => {
    options.generateChecksums = false;
    await packExecutor(options, context);
    
    // Should not have written checksums file
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('checksums.json'),
      expect.any(String)
    );
  });
  
  it('should generate SBOM when option is enabled', async () => {
    options.generateSBOM = true;
    options.sbomFormat = 'cyclonedx';
    
    await packExecutor(options, context);
    
    // Should have written SBOM file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('sbom.json'),
      expect.any(String)
    );
  });
  
  it('should compress package when option is enabled', async () => {
    options.compress = true;
    options.compressFormat = 'tgz';
    
    await packExecutor(options, context);
    
    // Should have written compression info file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.tgz.info'),
      expect.any(String)
    );
  });
  
  it('should return success true when execution completes', async () => {
    const result = await packExecutor(options, context);
    
    expect(result.success).toBe(true);
  });
  
  it('should handle errors and return success false', async () => {
    // Force an error by making readFileSync throw
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    const result = await packExecutor(options, context);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Test error');
  });
});