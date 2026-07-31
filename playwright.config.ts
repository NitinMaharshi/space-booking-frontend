import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    navigationTimeout: 45_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Production preview serves pre-built static files, avoiding Vite dev
  // server's cold-compile latency on the first navigation to a lazy-loaded
  // route (which otherwise can exceed a 30s navigation timeout in CI).
  webServer: {
    command: process.env.CI
      ? 'npm run build && npm run preview -- --port 5173'
      : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
