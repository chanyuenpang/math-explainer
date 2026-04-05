import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,  // Retry failed tests once
  workers: 2,  // Use only 2 workers to reduce resource contention
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/test-results' }]
  ],
  use: {
    baseURL: 'http://localhost:4321/math-explainer/',  // Added trailing slash to match Astro config
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/math-explainer/',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});