const { defineConfig } = require("@playwright/test");

const localBaseUrl = "http://127.0.0.1:4173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localBaseUrl;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000
  },
  reporter: [["line"]],
  use: {
    channel: "chromium",
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      args: ["--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    }
  },
  webServer:
    process.env.PLAYWRIGHT_MANAGED_SERVER === "0"
      ? undefined
      : {
          command: "python3 -m http.server 4173",
          url: localBaseUrl,
          reuseExistingServer: true,
          timeout: 120_000
        }
});
