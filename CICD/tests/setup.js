// Jest setup file
// This file runs before all tests

// Set test timeout
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestJob: () => ({
    id: 'test-job-id',
    status: 'running',
    startedAt: new Date().toISOString(),
    branch: 'test-branch',
    environment: 'test'
  }),
  
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock Express request
  createMockRequest: (overrides = {}) => ({
    params: {},
    query: {},
    headers: {},
    body: {},
    ...overrides
  }),
  
  // Helper to create mock Express response
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnThis()
    };
    return res;
  }
};

// Console suppression for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console after tests
afterAll(() => {
  global.console = originalConsole;
});
