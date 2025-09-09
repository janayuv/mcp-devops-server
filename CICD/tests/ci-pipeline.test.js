const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('CI Pipeline', () => {
  const artifactsDir = './artifacts';
  const distDir = './dist';

  beforeAll(() => {
    // Clean up before tests
    if (fs.existsSync(artifactsDir)) {
      fs.rmSync(artifactsDir, { recursive: true, force: true });
    }
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Clean up after tests
    if (fs.existsSync(artifactsDir)) {
      fs.rmSync(artifactsDir, { recursive: true, force: true });
    }
  });

  describe('Build Process', () => {
    test('should create dist directory', () => {
      execSync('npm run build', { stdio: 'pipe' });
      expect(fs.existsSync(distDir)).toBe(true);
    });

    test('should create index.js in dist', () => {
      const indexPath = path.join(distDir, 'index.js');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    test('should have correct content in index.js', () => {
      const indexPath = path.join(distDir, 'index.js');
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content.trim()).toBe("'built'");
    });
  });

  describe('CI Pipeline Execution', () => {
    test('should run lint step', () => {
      const output = execSync('npm run lint', { encoding: 'utf8' });
      expect(output).toContain('linting');
    });

    test('should run test step', () => {
      const output = execSync('npm run test', { encoding: 'utf8' });
      expect(output).toContain('testing');
    });

    test('should create artifacts directory', () => {
      execSync('npm run ci:local', { stdio: 'pipe' });
      expect(fs.existsSync(artifactsDir)).toBe(true);
    });

    test('should create timestamped artifact', () => {
      execSync('npm run ci:local', { stdio: 'pipe' });
      const files = fs.readdirSync(artifactsDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/^app-\d{14}\.zip$/);
    });
  });

  describe('Deployment Process', () => {
    test('should create deployment directory', () => {
      execSync('npm run deploy:local', { stdio: 'pipe' });
      expect(fs.existsSync('C:\\deploy\\myapp')).toBe(true);
    });

    test('should copy files to deployment directory', () => {
      const deployPath = 'C:\\deploy\\myapp\\index.js';
      expect(fs.existsSync(deployPath)).toBe(true);
    });
  });
});
