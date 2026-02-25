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

test("@quick smoke flujo base", async ({ page, diagnostics }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("Bike & Coffee");
  await expect(page.locator("#status")).toContainText(/Cargando|Cargados/);
  await waitForUiSettled(page, { timeout: 30_000 });

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

      const beforeRoadLabelOpacity = await page.evaluate(() =>
        window.__COFFEEMAP_MAP__.getPaintProperty("road-label", "text-opacity")
      );
      await page.locator("#baseLabelOpacity").evaluate((element) => {
        element.value = "35";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const afterRoadLabelOpacity = await page.evaluate(() =>
        window.__COFFEEMAP_MAP__.getPaintProperty("road-label", "text-opacity")
      );
      expect(afterRoadLabelOpacity).toEqual(0.35);
      expect(afterRoadLabelOpacity).not.toEqual(beforeRoadLabelOpacity);
    }
  }

  assertNoRuntimeErrors(diagnostics);
});
