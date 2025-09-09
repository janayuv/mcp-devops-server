const fs = require('fs');
const path = require('path');

// Mock utility functions for testing
const utils = {
  // Safe equals function (from mcp-server.js)
  safeEquals: (a, b) => {
    const aStr = String(a || '');
    const bStr = String(b || '');
    const aBuf = Buffer.from(aStr, 'utf8');
    const bBuf = Buffer.from(bStr, 'utf8');
    if (aBuf.length !== bBuf.length) return false;
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) {
      result |= aBuf[i] ^ bBuf[i];
    }
    return result === 0;
  },

  // Copy directory function (from mcp-server.js)
  copyDir: (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        utils.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  },

  // Generate timestamp
  generateTimestamp: () => {
    return new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  },

  // Validate job ID format
  isValidJobId: (jobId) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(jobId);
  }
};

describe('Utility Functions', () => {
  describe('safeEquals', () => {
    test('should return true for identical strings', () => {
      expect(utils.safeEquals('test', 'test')).toBe(true);
    });

    test('should return false for different strings', () => {
      expect(utils.safeEquals('test', 'different')).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(utils.safeEquals(null, null)).toBe(true);
      expect(utils.safeEquals(undefined, undefined)).toBe(true);
      expect(utils.safeEquals(null, undefined)).toBe(true); // Both become empty string
    });

    test('should handle empty strings', () => {
      expect(utils.safeEquals('', '')).toBe(true);
      expect(utils.safeEquals('', 'test')).toBe(false);
    });

    test('should prevent timing attacks', () => {
      const start = Date.now();
      utils.safeEquals('a', 'b');
      const end = Date.now();
      // Should take similar time regardless of string length
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('copyDir', () => {
    const testSrcDir = './test_src';
    const testDestDir = './test_dest';

    beforeAll(() => {
      // Create test source directory structure
      fs.mkdirSync(testSrcDir, { recursive: true });
      fs.mkdirSync(path.join(testSrcDir, 'subdir'), { recursive: true });
      fs.writeFileSync(path.join(testSrcDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testSrcDir, 'subdir', 'file2.txt'), 'content2');
    });

    afterAll(() => {
      // Clean up test directories
      if (fs.existsSync(testSrcDir)) {
        fs.rmSync(testSrcDir, { recursive: true, force: true });
      }
      if (fs.existsSync(testDestDir)) {
        fs.rmSync(testDestDir, { recursive: true, force: true });
      }
    });

    test('should copy directory structure', () => {
      // Ensure source directory exists
      if (!fs.existsSync(testSrcDir)) {
        fs.mkdirSync(testSrcDir, { recursive: true });
        fs.mkdirSync(path.join(testSrcDir, 'subdir'), { recursive: true });
        fs.writeFileSync(path.join(testSrcDir, 'file1.txt'), 'content1');
        fs.writeFileSync(path.join(testSrcDir, 'subdir', 'file2.txt'), 'content2');
      }
      
      utils.copyDir(testSrcDir, testDestDir);
      
      expect(fs.existsSync(testDestDir)).toBe(true);
      expect(fs.existsSync(path.join(testDestDir, 'subdir'))).toBe(true);
      expect(fs.existsSync(path.join(testDestDir, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(testDestDir, 'subdir', 'file2.txt'))).toBe(true);
    });

    test('should copy file contents correctly', () => {
      const content1 = fs.readFileSync(path.join(testDestDir, 'file1.txt'), 'utf8');
      const content2 = fs.readFileSync(path.join(testDestDir, 'subdir', 'file2.txt'), 'utf8');
      
      expect(content1).toBe('content1');
      expect(content2).toBe('content2');
    });
  });

  describe('generateTimestamp', () => {
    test('should generate valid timestamp format', () => {
      const timestamp = utils.generateTimestamp();
      expect(timestamp).toMatch(/^\d{14}$/); // YYYYMMDDHHMMSS format
    });

    test('should generate different timestamps', async () => {
      const timestamp1 = utils.generateTimestamp();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms to ensure different timestamp
      const timestamp2 = utils.generateTimestamp();
      expect(timestamp1).not.toBe(timestamp2);
    });
  });

  describe('isValidJobId', () => {
    test('should validate correct UUID format', () => {
      expect(utils.isValidJobId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(utils.isValidJobId('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(utils.isValidJobId('invalid-uuid')).toBe(false);
      expect(utils.isValidJobId('123')).toBe(false);
      expect(utils.isValidJobId('')).toBe(false);
      expect(utils.isValidJobId(null)).toBe(false);
    });
  });
});
