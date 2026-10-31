import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the /agency platform against a production build.
// Build first with forms open:  NEXT_PUBLIC_AGENCY_SUBMISSIONS=open npm run build
const port = Number(process.env.E2E_PORT ?? 3300);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/agency/e2e",
  timeout: 60_000,
  // Navigations hit a real server; allow for a loaded CI machine.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx next start -p ${port} -H 127.0.0.1`,
    url: `${baseURL}/agency`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AGENCY_DEPLOYMENT_ENV: "development",
      AGENCY_CORE_API_MODE: "dev-file",
      AGENCY_DEV_STORE_PATH: ".data/agency-e2e-store.json",
      AGENCY_RATE_LIMIT_MAX: "200",
    },
  },
});
