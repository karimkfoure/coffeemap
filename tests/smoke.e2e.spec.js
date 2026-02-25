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
  const mapFilter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--map-filter")
  );
  expect(mapFilter).toContain("brightness(115%)");

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
  }

  assertNoRuntimeErrors(diagnostics);
});
