import { defineConfig } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.(spec|test)\.tsx?$/,
  snapshotDir: './__snapshots__',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  timeout: 60000,
  use: {
    ctPort: 3100,
    viewport: { width: 800, height: 600 },
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000
  }
});


