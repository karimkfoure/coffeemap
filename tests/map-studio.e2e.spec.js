const {
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  mockDefaultKml,
  expect,
  test
} = require("./helpers/e2e");

test.beforeEach(async ({ page }) => {
  await mockDefaultKml(page);
});

test("carga inicial y filtro por layer", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await expect(page.locator("#layerFilter option")).toHaveCount(3);
  await page.selectOption("#layerFilter", "Centro");
  await expect(page.locator("#status")).toContainText("Layer activo: Centro.");
  await expect(page.locator("#status")).toContainText("Cafes visibles: 3.");

  await page.selectOption("#layerFilter", "");
  await expect(page.locator("#status")).toContainText("Mostrando todas las capas.");
  await expect(page.locator("#status")).toContainText("Cafes visibles: 6.");

  assertNoRuntimeErrors(diagnostics);
});

test("preset night y ajustes de refinado", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await page.selectOption("#presetSelect", "night");
  await page.click("#applyPresetBtn");
  await expect(page.locator("#status")).toContainText("Preset aplicado: night.");
  await expect(page.locator("#basemapSelect")).toHaveValue("dark");

  await page.locator("#showPoiLabels").check();
  await expect(page.locator("#showPoiLabels")).toBeChecked();

  await page.locator("#mapBrightness").evaluate((element) => {
    element.value = "130";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const mapFilter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--map-filter")
  );
  expect(mapFilter).toContain("brightness(130%)");

  assertNoRuntimeErrors(diagnostics);
});

test("modo captura y poster", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await page.evaluate(() => {
    const posterToggle = document.getElementById("showPoster");
    let current = posterToggle ? posterToggle.closest("details") : null;
    while (current) {
      if (!current.open) {
        current.open = true;
      }
      current = current.parentElement ? current.parentElement.closest("details") : null;
    }
  });

  await page.locator("#showPoster").check();
  await page.fill("#posterTitle", "Ruta de cafe");
  await page.fill("#posterSubtitle", "Sabado 8:30");
  await page.selectOption("#posterPosition", "bottom-right");

  await expect(page.locator("#posterOverlay")).toHaveClass(/is-visible/);
  await expect(page.locator("#posterOverlay")).toHaveAttribute("data-position", "bottom-right");
  await expect(page.locator("#posterTitleNode")).toHaveText("Ruta de cafe");
  await expect(page.locator("#posterSubtitleNode")).toHaveText("Sabado 8:30");

  await page.click("#togglePanelBtn");
  await expect(page.locator("#appShell")).toHaveClass(/panel-hidden/);

  assertNoRuntimeErrors(diagnostics);
});

test("encuadre manual, reset de camara y ratio", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await page.fill("#centerLat", "-31.430000");
  await page.fill("#centerLng", "-64.190000");
  await page.fill("#zoomInput", "12.5");
  await page.click("#applyViewBtn");

  await page.waitForTimeout(250);
  expect(Number(await page.inputValue("#centerLat"))).toBeCloseTo(-31.43, 2);
  expect(Number(await page.inputValue("#centerLng"))).toBeCloseTo(-64.19, 2);
  expect(Number(await page.inputValue("#zoomInput"))).toBeCloseTo(12.5, 1);

  await page.click("#resetCameraBtn");
  await page.waitForTimeout(250);
  expect(Number(await page.inputValue("#centerLat"))).toBeCloseTo(-31.42048, 3);
  expect(Number(await page.inputValue("#centerLng"))).toBeCloseTo(-64.18262, 3);
  expect(Number(await page.inputValue("#zoomInput"))).toBeCloseTo(13, 1);

  await page.selectOption("#canvasRatio", "1:1");
  await page.waitForTimeout(100);

  const ratio = await page.locator("#mapFrame").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.width / bounds.height;
  });
  expect(ratio).toBeGreaterThan(0.98);
  expect(ratio).toBeLessThan(1.02);

  assertNoRuntimeErrors(diagnostics);
});
