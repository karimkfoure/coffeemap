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
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#status")).toContainText("Cargados", { timeout: 30_000 });
  await waitForUiSettled(page, { timeout: 30_000 });
}

async function waitForUiSettled(page, options = {}) {
  const timeout = options.timeout ?? 12_000;
  await expect(page.locator("#map .maplibregl-canvas")).toBeVisible({ timeout });
  await expect(page.locator("#loadingOverlay")).toHaveClass(/is-hidden/, { timeout });
}

async function runUiAction(page, action, options = {}) {
  await action();
  await waitForUiSettled(page, options);
}

async function applyPreset(page, presetName, options = {}) {
  await runUiAction(
    page,
    async () => {
      await page.selectOption("#presetSelect", presetName);
      await page.click("#applyPresetBtn");
    },
    options
  );
}

async function switchBasemap(page, basemap, options = {}) {
  await runUiAction(
    page,
    async () => {
      await page.selectOption("#basemapSelect", basemap);
    },
    options
  );
}

async function getSelectOptionValues(page, selector) {
  return page.$$eval(`${selector} option`, (options) =>
    options.map((option) => option.value).filter((value) => Boolean(value))
  );
}

async function assertBasemapSwitchStable(page) {
  await expect(page.locator("#loadingOverlay")).toHaveClass(/is-hidden/);
  await expect(page.locator("#status")).not.toContainText("Error importando");
}

async function assertCafeLayersVisible(page) {
  const snapshot = await page.evaluate(() => {
    const map = window.__COFFEEMAP_MAP__;
    if (!map) {
      return { hasMap: false };
    }

    const hasSource = Boolean(map.getSource("cafes-source"));
    const hasLayer = Boolean(map.getLayer("cafes-core"));
    const layerVisibility = hasLayer ? map.getLayoutProperty("cafes-core", "visibility") : null;
    const source = hasSource ? map.getSource("cafes-source") : null;
    const sourceFeatureCount = Array.isArray(source?._data?.features) ? source._data.features.length : 0;

    let renderedCount = 0;
    if (hasLayer) {
      try {
        renderedCount = map.queryRenderedFeatures(undefined, { layers: ["cafes-core"] }).length;
      } catch {
        renderedCount = 0;
      }
    }

    return {
      hasMap: true,
      hasSource,
      hasLayer,
      layerVisibility,
      sourceFeatureCount,
      renderedCount
    };
  });

  expect(snapshot.hasMap).toBe(true);
  expect(snapshot.hasSource).toBe(true);
  expect(snapshot.hasLayer).toBe(true);
  expect(snapshot.layerVisibility === "none").toBe(false);
  expect(snapshot.sourceFeatureCount).toBeGreaterThan(0);
}

function assertNoRuntimeErrors(diagnostics) {
  const consoleErrors = diagnostics.console.filter((entry) => {
    if (entry.type !== "error") {
      return false;
    }

    const isBenignMaplibreAbort =
      entry.text.includes("AbortError: signal is aborted without reason") &&
      String(entry.location?.url || "").includes("maplibre-gl");

    return !isBenignMaplibreAbort;
  });
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
  applyPreset,
  assertBasemapSwitchStable,
  assertCafeLayersVisible,
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  getSelectOptionValues,
  mockDefaultKml,
  runUiAction,
  switchBasemap,
  waitForUiSettled,
  expect,
  test
};
