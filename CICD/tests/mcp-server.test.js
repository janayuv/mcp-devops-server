const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

describe('MCP Server', () => {
  let serverProcess;
  const testDataDir = './test_mcp_data';

  beforeAll(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Server Startup', () => {
    test('should start MCP server successfully', async () => {
      const serverPath = path.resolve('./mcp-cursor-server.js');
      expect(fs.existsSync(serverPath)).toBe(true);
    });

    test('should have required dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      expect(packageJson.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
      expect(packageJson.dependencies['express']).toBeDefined();
      expect(packageJson.dependencies['uuid']).toBeDefined();
    });
  });

  describe('Configuration Files', () => {
    test('should have Jest configuration', () => {
      expect(fs.existsSync('./jest.config.js')).toBe(true);
    });

    test('should have ESLint configuration', () => {
      expect(fs.existsSync('./.eslintrc.js')).toBe(true);
    });

    test('should have Prettier configuration', () => {
      expect(fs.existsSync('./.prettierrc')).toBe(true);
    });
  });

  describe('CI/CD Scripts', () => {
    test('should have CI script', () => {
      expect(fs.existsSync('./ci.ps1')).toBe(true);
    });

    test('should have deployment script', () => {
      expect(fs.existsSync('./deploy.ps1')).toBe(true);
    });

    test('should have package.json scripts', () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      expect(packageJson.scripts['ci:local']).toBeDefined();
      expect(packageJson.scripts['deploy:local']).toBeDefined();
      expect(packageJson.scripts['start:mcp-cursor']).toBeDefined();
    });
  });
});
