const fs = require("node:fs/promises");

const {
  assertCafeLayersVisible,
  waitForUiSettled,
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  mockDefaultKml,
  readGroupPaint,
  readRuntimeConfig,
  runUiAction,
  switchBasemap,
  expect,
  test
} = require("./helpers/e2e");

test.beforeEach(async ({ page }) => {
  await mockDefaultKml(page);
});

test("@quick startup config limpio y export estable", async ({ page, diagnostics }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("Bike & Coffee");
  await expect(page.locator("#status")).toContainText(/Cargando|Cargados/);
  await waitForUiSettled(page, { timeout: 30_000 });

  await expect(page.locator("#presetSelect")).toHaveValue("default-toner-lite");
  await expect(page.locator("#basemapSelect")).toHaveValue("stadiaTonerLite");
  await expect(page.locator("#zoomInput")).toHaveValue("11.99");
  await expect(page.locator("#markerRadius")).toHaveValue("6");
  await expect(page.locator("#labelHaloWidth")).toHaveValue("3.6");
  await expect(page.locator("#labelOffsetY")).toHaveValue("20");
  await expect(page.locator("#showPlaceLabels")).not.toBeChecked();
  await expect(page.locator("#showPoiLabels")).not.toBeChecked();
  await expect(page.locator("#showWaterLabels")).not.toBeChecked();
  await expect(page.locator("#waterColor")).not.toBeDisabled();
  await expect(page.locator("#roadMajorColor")).not.toBeDisabled();
  await expect(page.locator("#parkColor")).toBeDisabled();
  await expect(page.locator("#parkOpacity")).toBeDisabled();
  await expect(page.locator("#landuseColor")).toBeDisabled();
  await expect(page.locator("#landuseOpacity")).toBeDisabled();
  await expect(page.locator("#buildingColor")).toBeDisabled();
  await expect(page.locator("#buildingOpacity")).toBeDisabled();

  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Place" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Water Name" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Poi" }).locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(page.locator("#styleEntityEditor .style-entity-row", { hasText: "Transportation Name" }).locator('input[type="checkbox"]').first()).not.toBeChecked();

  const runtimeConfig = await readRuntimeConfig(page);
  expect(runtimeConfig.basemap).toBe("stadiaTonerLite");
  expect(runtimeConfig.camera.zoom).toBeCloseTo(11.99, 2);
  expect(runtimeConfig.cafeStyles.markerRadius).toBe(6);
  expect(runtimeConfig.cafeStyles.labelHaloWidth).toBe(3.6);
  expect(runtimeConfig.cafeStyles.labelOffsetY).toBe(20);
  expect(runtimeConfig.layerVisibility.showPlaceLabels).toBe(false);
  expect(runtimeConfig.styleEntityVisibility.place.visible).toBe(false);

  const startupPaints = {
    background: await readGroupPaint(page, "background", ["background-color"]),
    water: await readGroupPaint(page, "water", ["fill-color", "line-color"]),
    roadsMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    boundaries: await readGroupPaint(page, "boundaries", ["line-color"])
  };

  expect(startupPaints.background?.value).toBe(runtimeConfig.componentStyles.bgColor);
  expect(startupPaints.water?.value).toBe(runtimeConfig.componentStyles.waterColor);
  expect(startupPaints.roadsMajor?.value).toBe(runtimeConfig.componentStyles.roadMajorColor);
  expect(startupPaints.boundaries?.value).toBe(runtimeConfig.componentStyles.boundaryColor);

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

  assertNoRuntimeErrors(diagnostics);
});

test("@quick cambio de basemap rehidrata panel y un patch puntual no reinyecta stale defaults", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  const beforeSwitch = await readRuntimeConfig(page);
  await switchBasemap(page, "bright", { timeout: 30_000 });
  await expect(page.locator("#basemapSelect")).toHaveValue("bright");
  await assertCafeLayersVisible(page);

  const afterSwitch = await readRuntimeConfig(page);
  expect(afterSwitch.basemap).toBe("bright");
  expect(afterSwitch.componentStyles.waterColor).not.toBe(beforeSwitch.componentStyles.waterColor);
  expect(afterSwitch.componentStyles.roadMajorColor).not.toBe(beforeSwitch.componentStyles.roadMajorColor);
  expect(await page.inputValue("#waterColor")).toBe(afterSwitch.componentStyles.waterColor);
  expect(await page.inputValue("#roadMajorColor")).toBe(afterSwitch.componentStyles.roadMajorColor);

  const beforePatch = {
    water: await readGroupPaint(page, "water", ["fill-color", "line-color"]),
    roadMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    building: await readGroupPaint(page, "buildings", ["fill-color", "line-color"])
  };

  await page.locator("#waterColor").evaluate((element) => {
    element.value = "#335577";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const afterPatch = {
    water: await readGroupPaint(page, "water", ["fill-color", "line-color"]),
    roadMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    building: await readGroupPaint(page, "buildings", ["fill-color", "line-color"])
  };

  expect(afterPatch.water.value).toBe("#335577");
  expect(afterPatch.roadMajor.value).toEqual(beforePatch.roadMajor.value);
  expect(afterPatch.building.value).toEqual(beforePatch.building.value);

  const runtimeConfig = await readRuntimeConfig(page);
  expect(runtimeConfig.componentStyles.waterColor).toBe("#335577");
  expect(runtimeConfig.componentStyles.roadMajorColor).toBe(afterSwitch.componentStyles.roadMajorColor);

  assertNoRuntimeErrors(diagnostics);
});
