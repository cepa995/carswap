import { defineConfig, devices } from "@playwright/test";

const PORT = 3211;

/**
 * End-to-end tests run against a production build on a phone-sized, touch
 * viewport, because the deck is built for thumbs.
 *
 * First run: `pnpm exec playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Lets a machine reuse a Chromium it already has instead of downloading one.
    launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/swipe`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
