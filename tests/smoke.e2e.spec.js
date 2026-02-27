const fs = require("node:fs/promises");

const {
  assertBasemapSwitchStable,
  assertCafeLayersVisible,
  waitForUiSettled,
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  mockDefaultKml,
  runUiAction,
  switchBasemap,
  expect,
  test
} = require("./helpers/e2e");

test.beforeEach(async ({ page }) => {
  await mockDefaultKml(page);
});

test("@quick smoke flujo base", async ({ page, diagnostics }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("Bike & Coffee");
  await expect(page.locator("#status")).toContainText(/Cargando|Cargados/);
  await waitForUiSettled(page, { timeout: 30_000 });
  await expect(page.locator("#presetSelect")).toHaveValue("default-toner-lite");
  await expect(page.locator("#basemapSelect")).toHaveValue("stadiaTonerLite");
  await expect(page.locator("#zoomInput")).toHaveValue("11.99");
  await expect(page.locator("#labelHaloWidth")).toHaveValue("4");
  await expect(page.locator("#labelOffsetY")).toHaveValue("21");
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Place" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Water Name" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Poi" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Transportation Name" }).locator('input[type="checkbox"]').first()).not.toBeChecked();

  const mapFrameBox = await page.locator("#mapFrame").boundingBox();
  expect(mapFrameBox).not.toBeNull();

  const downloadPromise = page.waitForEvent("download");
  await page.click("#downloadViewportBtn");
  const download = await downloadPromise;
  const downloadPath = testInfo.outputPath("viewport-export.png");
  await download.saveAs(downloadPath);
  const downloadBuffer = await fs.readFile(downloadPath);
  expect(download.suggestedFilename()).toMatch(/^coffeemap-\d{8}-\d{6}\.png$/);
  expect(downloadBuffer.length).toBeGreaterThan(1024);
  expect(downloadBuffer.toString("ascii", 1, 4)).toBe("PNG");
  expect(downloadBuffer.readUInt32BE(16)).toBe(Math.round(mapFrameBox.width * 2));
  expect(downloadBuffer.readUInt32BE(20)).toBe(Math.round(mapFrameBox.height * 2));
  await expect(page.locator("#status")).toContainText("PNG exportado");

  await page.locator("#mapBrightness").evaluate((element) => {
    element.value = "115";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#mapBrightness").evaluate((element) => {
    element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  });
  await expect(page.locator("#mapBrightness")).toHaveValue("100");
  const mapFilter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--map-filter")
  );
  expect(mapFilter).toContain("brightness(100%)");

  await page.click("#togglePanelBtn");
  await expect(page.locator("#appShell")).toHaveClass(/panel-hidden/);

  await waitForUiSettled(page);

  assertNoRuntimeErrors(diagnostics);
});

test("@quick switch representativo de basemaps mantiene capas visibles", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await runUiAction(page, async () => {
    await page.selectOption("#layerFilter", "Centro");
  });
  await expect(page.locator("#status")).toContainText("Cafes visibles: 3.");

  const representativeBasemaps = [
    "bright",
    "cartoVoyagerNoLabels",
    "stadiaToner",
    "stadiaWatercolor",
    "stadiaAlidadeSatellite",
    "cartoDarkMatterNoLabels"
  ];

  for (const basemap of representativeBasemaps) {
    await switchBasemap(page, basemap, { timeout: 30_000 });
    await expect(page.locator("#basemapSelect")).toHaveValue(basemap);
    await assertBasemapSwitchStable(page);
    await assertCafeLayersVisible(page);

    if (basemap === "stadiaToner") {
      await expect(page.locator("#styleEntityEditor .style-entity-row").first()).toBeVisible();

      await runUiAction(page, async () => {
        await page.locator("#showRoadLabels").uncheck();
      });
      const hiddenRoadLabels = await page.evaluate(() => window.__COFFEEMAP_MAP__.getLayoutProperty("road-label", "visibility"));
      expect(hiddenRoadLabels).toBe("none");

      await runUiAction(page, async () => {
        await page.locator("#showRoadLabels").check();
      });
      const visibleRoadLabels = await page.evaluate(
        () => window.__COFFEEMAP_MAP__.getLayoutProperty("road-label", "visibility") || "visible"
      );
      expect(visibleRoadLabels).toBe("visible");

      const beforeRoadStreetColor = await page.evaluate(() =>
        window.__COFFEEMAP_MAP__.getPaintProperty("road-street", "line-color")
      );
      await page.locator("#waterOpacity").evaluate((element) => {
        element.value = "31";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const afterRoadStreetColor = await page.evaluate(() =>
        window.__COFFEEMAP_MAP__.getPaintProperty("road-street", "line-color")
      );
      expect(afterRoadStreetColor).toEqual(beforeRoadStreetColor);

      const beforeRoadLabelColor = await page.evaluate(() =>
        window.__COFFEEMAP_MAP__.getPaintProperty("road-label", "text-color")
      );
      await page.locator("#baseLabelOpacity").evaluate((element) => {
        element.value = "35";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const afterRoadLabelState = await page.evaluate(() => ({
        opacity: window.__COFFEEMAP_MAP__.getPaintProperty("road-label", "text-opacity"),
        color: window.__COFFEEMAP_MAP__.getPaintProperty("road-label", "text-color")
      }));
      expect(afterRoadLabelState.opacity).toEqual(1);
      expect(String(afterRoadLabelState.color)).toContain("0.35");
      expect(String(afterRoadLabelState.color)).not.toEqual(String(beforeRoadLabelColor));
    }
  }

  assertNoRuntimeErrors(diagnostics);
});
