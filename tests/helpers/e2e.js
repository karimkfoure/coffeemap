const fs = require("node:fs/promises");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");

const kmlFixturePath = path.join(__dirname, "..", "fixtures", "cafes-sample.kml");
const maxEntries = 120;
const maxMessageChars = 500;

function trimText(value, limit = maxMessageChars) {
  const text = String(value ?? "");
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

function pushLimited(array, value) {
  if (array.length >= maxEntries) {
    return;
  }
  array.push(value);
}

const test = base.extend({
  diagnostics: async ({ page }, use, testInfo) => {
    const diagnostics = {
      console: [],
      pageErrors: [],
      requestFailures: []
    };

    page.on("console", (msg) => {
      const type = msg.type();
      if (type !== "error" && type !== "warning") {
        return;
      }
      pushLimited(diagnostics.console, {
        type,
        text: trimText(msg.text()),
        location: msg.location()
      });
    });

    page.on("pageerror", (error) => {
      const stack = error && (error.stack || error.message);
      pushLimited(diagnostics.pageErrors, trimText(stack || String(error), 2000));
    });

    page.on("requestfailed", (request) => {
      pushLimited(diagnostics.requestFailures, {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        failureText: request.failure()?.errorText || "unknown"
      });
    });

    await use(diagnostics);

    if (testInfo.status !== testInfo.expectedStatus) {
      const diagnosticsPath = testInfo.outputPath("diagnostics.json");
      await fs.writeFile(diagnosticsPath, JSON.stringify(diagnostics, null, 2), "utf8");
      await testInfo.attach("diagnostics", {
        path: diagnosticsPath,
        contentType: "application/json"
      });
    }
  }
});

async function mockDefaultKml(page) {
  const kml = await fs.readFile(kmlFixturePath, "utf8");

  const fulfillKml = (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": "application/vnd.google-earth.kml+xml; charset=utf-8"
      },
      body: kml
    });

  await page.route("https://www.google.com/maps/d/kml?**", fulfillKml);
  await page.route("https://api.allorigins.win/raw?**", fulfillKml);
}

async function gotoAndWaitForReady(page) {
  await page.goto("/");
  await expect(page.locator("#map .maplibregl-canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#status")).toContainText("Cargados", { timeout: 30_000 });
  await expect(page.locator("#loadingOverlay")).toHaveClass(/is-hidden/, { timeout: 30_000 });
}

function assertNoRuntimeErrors(diagnostics) {
  const consoleErrors = diagnostics.console.filter((entry) => entry.type === "error");
  const formattedConsoleErrors = JSON.stringify(consoleErrors.slice(0, 5), null, 2);

  expect(
    consoleErrors,
    `Se detectaron errores de consola:\n${formattedConsoleErrors}`
  ).toEqual([]);

  expect(
    diagnostics.pageErrors,
    `Se detectaron excepciones JS:\n${diagnostics.pageErrors.slice(0, 3).join("\n\n")}`
  ).toEqual([]);
}

module.exports = {
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  mockDefaultKml,
  expect,
  test
};
