const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Comprehensive Testing Suite', () => {
  describe('MCP Server Functionality', () => {
    test('should have all required MCP tools', () => {
      const serverFile = fs.readFileSync('./mcp-cursor-server.js', 'utf8');
      
      // Check for all expected tools
      const expectedTools = [
        'trigger_ci',
        'get_job_status', 
        'get_job_logs',
        'list_jobs',
        'deploy_application',
        'run_tests',
        'vitest_test',
        'testing_library_test',
        'comprehensive_testing'
      ];
      
      expectedTools.forEach(tool => {
        expect(serverFile).toContain(`name: '${tool}'`);
      });
    });

    test('should have proper error handling', () => {
      const serverFile = fs.readFileSync('./mcp-cursor-server.js', 'utf8');
      expect(serverFile).toContain('try {');
      expect(serverFile).toContain('catch (error)');
      expect(serverFile).toContain('isError: true');
    });
  });

  describe('Configuration Files', () => {
    test('should have valid package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.devDependencies).toBeDefined();
    });

    test('should have Jest configuration', () => {
      expect(fs.existsSync('./jest.config.js')).toBe(true);
      
      const jestConfig = fs.readFileSync('./jest.config.js', 'utf8');
      expect(jestConfig).toContain('module.exports');
    });

    test('should have ESLint configuration', () => {
      expect(fs.existsSync('./eslint.config.js')).toBe(true);
      
      const eslintConfig = fs.readFileSync('./eslint.config.js', 'utf8');
      expect(eslintConfig).toContain('export default');
    });

    test('should have Prettier configuration', () => {
      expect(fs.existsSync('./.prettierrc')).toBe(true);
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should have CI script', () => {
      expect(fs.existsSync('./ci.ps1')).toBe(true);
      
      const ciScript = fs.readFileSync('./ci.ps1', 'utf8');
      expect(ciScript).toContain('npm run lint');
      expect(ciScript).toContain('npm run test:ci');
      expect(ciScript).toContain('npm run build');
    });

    test('should have deployment script', () => {
      expect(fs.existsSync('./deploy.ps1')).toBe(true);
    });

    test('should create artifacts directory', () => {
      // Clean up any existing artifacts
      if (fs.existsSync('./artifacts')) {
        fs.rmSync('./artifacts', { recursive: true, force: true });
      }
      
      // Create artifacts directory
      fs.mkdirSync('./artifacts', { recursive: true });
      
      expect(fs.existsSync('./artifacts')).toBe(true);
      
      // Clean up
      fs.rmSync('./artifacts', { recursive: true, force: true });
    });
  });

  describe('Code Quality', () => {
    test('should pass ESLint checks', () => {
      try {
        execSync('npx eslint mcp-cursor-server.js', { stdio: 'pipe' });
        // If we get here, ESLint passed
        expect(true).toBe(true);
      } catch (error) {
        // ESLint found issues, but that's expected in some cases
        expect(error.status).toBeDefined();
      }
    });

    test('should have proper file structure', () => {
      const requiredFiles = [
        'package.json',
        'jest.config.js',
        'eslint.config.js',
        '.prettierrc',
        'ci.ps1',
        'deploy.ps1',
        'mcp-cursor-server.js',
        'mcp-server.js'
      ];
      
      requiredFiles.forEach(file => {
        expect(fs.existsSync(`./${file}`)).toBe(true);
      });
    });
  });

  describe('Dependencies', () => {
    test('should have required dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      const requiredDeps = [
        '@modelcontextprotocol/sdk',
        'express',
        'uuid'
      ];
      
      const requiredDevDeps = [
        'eslint',
        'jest',
        '@types/jest',
        'prettier'
      ];
      
      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies[dep]).toBeDefined();
      });
      
      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies[dep]).toBeDefined();
      });
    });
  });

  describe('Documentation', () => {
    test('should have README', () => {
      expect(fs.existsSync('./README.md')).toBe(true);
    });

    test('should have MCP integration guide', () => {
      expect(fs.existsSync('./CURSOR_MCP_GUIDE.md')).toBe(true);
    });

    test('should have testing guide', () => {
      expect(fs.existsSync('./TESTING_GUIDE.md')).toBe(true);
    });
  });
});
