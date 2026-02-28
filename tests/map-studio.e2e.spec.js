const {
  applyPreset,
  assertCafeLayersVisible,
  runUiAction,
  switchBasemap,
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  getSelectOptionValues,
  mockDefaultKml,
  readGroupPaint,
  readMapValue,
  readRuntimeConfig,
  waitForUiSettled,
  expect,
  test
} = require("./helpers/e2e");

test.beforeEach(async ({ page }) => {
  await mockDefaultKml(page);
});

test("preset deja panel y mapa alineados", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await applyPreset(page, "editorial", { timeout: 30_000 });
  await expect(page.locator("#basemapSelect")).toHaveValue("cartoPositron");
  await expect(page.locator("#waterColor")).toHaveValue("#b4cfdd");
  await expect(page.locator("#roadMajorColor")).toHaveValue("#d69f63");

  const presetState = await readRuntimeConfig(page);
  expect(presetState.basemap).toBe("cartoPositron");
  expect(presetState.componentStyles.bgColor).toBe("#f2ece2");
  expect(presetState.componentStyles.waterColor).toBe("#b4cfdd");
  expect(presetState.componentStyles.roadMajorColor).toBe("#d69f63");
  expect(presetState.baseLabelStyles.baseLabelColor).toBe("#4a4036");
  expect(presetState.cafeStyles.labelMode).toBe("indexName");

  const presetPaint = {
    background: await readGroupPaint(page, "background", ["background-color"]),
    water: await readGroupPaint(page, "water", ["fill-color", "line-color"]),
    roadMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    label: await readGroupPaint(page, "labelsPlace", ["text-color"]),
    cafeLabel: await readMapValue(page, () => window.__COFFEEMAP_MAP__.getLayoutProperty("cafes-label", "text-field"))
  };
  expect(presetPaint.background.value).toBe(presetState.componentStyles.bgColor);
  expect(presetPaint.water.value).toBe(presetState.componentStyles.waterColor);
  expect(presetPaint.roadMajor.value).toBe(presetState.componentStyles.roadMajorColor);
  expect(presetPaint.water).not.toBeNull();
  expect(presetPaint.label).not.toBeNull();
  expect(presetPaint.cafeLabel).toEqual(["get", "label"]);

  const beforeSinglePatch = {
    roadMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    building: await readGroupPaint(page, "buildings", ["fill-color", "line-color"])
  };

  await page.locator("#waterColor").evaluate((element) => {
    element.value = "#224466";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const afterSinglePatch = {
    water: await readGroupPaint(page, "water", ["fill-color", "line-color"]),
    roadMajor: await readGroupPaint(page, "roadsMajor", ["line-color"]),
    building: await readGroupPaint(page, "buildings", ["fill-color", "line-color"])
  };

  expect(afterSinglePatch.water.value).toBe("#224466");
  expect(afterSinglePatch.roadMajor.value).toEqual(beforeSinglePatch.roadMajor.value);
  expect(afterSinglePatch.building.value).toEqual(beforeSinglePatch.building.value);

  assertNoRuntimeErrors(diagnostics);
});

test("variantes de marcador e indice interno renderizan sin romper capas", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await runUiAction(page, async () => {
    await page.selectOption("#markerVariant", "ring");
  });
  await runUiAction(page, async () => {
    await page.locator("#showMarkerIndex").check();
  });

  const ringState = await readRuntimeConfig(page);
  expect(ringState.cafeStyles.markerVariant).toBe("ring");
  expect(ringState.cafeStyles.showMarkerIndex).toBe(true);

  const ringSnapshot = await readMapValue(page, () => {
    const map = window.__COFFEEMAP_MAP__;
    const source = map.getSource("cafes-source");
    const firstFeature = source?._data?.features?.[0]?.properties || null;
    return {
      firstFeature,
      coreStrokeWidth: map.getPaintProperty("cafes-core", "circle-stroke-width"),
      markerIndexVisibility: map.getLayoutProperty("cafes-marker-index", "visibility"),
      markerIndexField: map.getLayoutProperty("cafes-marker-index", "text-field"),
      markerIndexSize: map.getLayoutProperty("cafes-marker-index", "text-size"),
      renderedMarkers: map.queryRenderedFeatures({ layers: ["cafes-core"] }).length
    };
  });

  expect(ringSnapshot.firstFeature.markerIndex).toBe("1");
  expect(ringSnapshot.coreStrokeWidth).toBeGreaterThanOrEqual(3);
  expect(ringSnapshot.markerIndexVisibility).toBe("visible");
  expect(ringSnapshot.markerIndexField).toEqual(["get", "markerIndex"]);
  expect(ringSnapshot.markerIndexSize).toBeGreaterThan(0);
  expect(ringSnapshot.renderedMarkers).toBeGreaterThan(0);

  await runUiAction(page, async () => {
    await page.selectOption("#markerVariant", "target");
  });

  const targetSnapshot = await readMapValue(page, () => {
    const map = window.__COFFEEMAP_MAP__;
    return {
      accentVisibility: map.getLayoutProperty("cafes-accent", "visibility"),
      accentOpacity: map.getPaintProperty("cafes-accent", "circle-opacity")
    };
  });

  expect(targetSnapshot.accentVisibility).toBe("visible");
  expect(targetSnapshot.accentOpacity).toBeGreaterThan(0);

  assertNoRuntimeErrors(diagnostics);
});

test("neutralidad creativa y flujo visual complementario", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  const baseWidths = await readMapValue(page, () => {
    const map = window.__COFFEEMAP_MAP__;
    const appState = window.__COFFEEMAP_STATE__;
    const roadMajorLayer = appState.layerGroups.roadsMajor.find((id) => map.getPaintProperty(id, "line-width") != null);
    const roadMinorLayer = appState.layerGroups.roadsMinor.find((id) => map.getPaintProperty(id, "line-width") != null);
    const waterLayer = appState.layerGroups.water.find((id) => map.getLayer(id)?.type === "line");
    return {
      roadMajor: appState.baseFeaturePaint.get(`${roadMajorLayer}:line-width`),
      roadMinor: appState.baseFeaturePaint.get(`${roadMinorLayer}:line-width`),
      water: waterLayer ? appState.baseFeaturePaint.get(`${waterLayer}:line-width`) : null
    };
  });

  await page.locator("#inkBoost").evaluate((element) => {
    element.value = "140";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#riverBoost").evaluate((element) => {
    element.value = "170";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#inkBoost").evaluate((element) => {
    element.value = "100";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#riverBoost").evaluate((element) => {
    element.value = "100";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const neutralWidths = await readMapValue(page, () => {
    const map = window.__COFFEEMAP_MAP__;
    const appState = window.__COFFEEMAP_STATE__;
    const roadMajorLayer = appState.layerGroups.roadsMajor.find((id) => map.getPaintProperty(id, "line-width") != null);
    const roadMinorLayer = appState.layerGroups.roadsMinor.find((id) => map.getPaintProperty(id, "line-width") != null);
    const waterLayer = appState.layerGroups.water.find((id) => map.getLayer(id)?.type === "line");
    return {
      roadMajor: map.getPaintProperty(roadMajorLayer, "line-width"),
      roadMinor: map.getPaintProperty(roadMinorLayer, "line-width"),
      water: waterLayer ? map.getPaintProperty(waterLayer, "line-width") : null
    };
  });

  expect(neutralWidths.roadMajor).toEqual(baseWidths.roadMajor);
  expect(neutralWidths.roadMinor).toEqual(baseWidths.roadMinor);
  expect(neutralWidths.water).toEqual(baseWidths.water);

  const creativeState = await readRuntimeConfig(page);
  expect(creativeState.creative.inkBoost).toBe(100);
  expect(creativeState.creative.riverBoost).toBe(100);

  await runUiAction(page, async () => {
    await page.selectOption("#layerFilter", "Centro");
  });
  await expect(page.locator("#status")).toContainText("Cafes visibles: 3.");

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

  await runUiAction(page, async () => {
    await page.click("#togglePanelBtn");
  });
  await expect(page.locator("#appShell")).toHaveClass(/panel-hidden/);

  assertNoRuntimeErrors(diagnostics);
});

test("@full recorre catalogo completo de basemaps y presets", async ({ page, diagnostics }) => {
  test.setTimeout(240_000);
  await gotoAndWaitForReady(page);

  const basemapValues = await getSelectOptionValues(page, "#basemapSelect");
  expect(basemapValues.length).toBeGreaterThanOrEqual(20);

  for (const basemap of basemapValues) {
    await switchBasemap(page, basemap, { timeout: 30_000 });
    await expect(page.locator("#basemapSelect")).toHaveValue(basemap);
    await assertCafeLayersVisible(page);
    const runtimeConfig = await readRuntimeConfig(page);
    expect(runtimeConfig.basemap).toBe(basemap);
  }

  const presetValues = await getSelectOptionValues(page, "#presetSelect");
  expect(presetValues.length).toBeGreaterThanOrEqual(13);

  for (const preset of presetValues) {
    await applyPreset(page, preset, { timeout: 30_000 });
    await expect(page.locator("#status")).toContainText(`Preset aplicado: ${preset}.`);
    await assertCafeLayersVisible(page);
  }

  await runUiAction(page, async () => {
    await page.click("#reloadDataBtn");
  }, { timeout: 30_000 });
  await expect(page.locator("#status")).toContainText("Cargados");

  await applyPreset(page, "toner-bold", { timeout: 30_000 });
  await switchBasemap(page, "cartoPositronNoLabels", { timeout: 30_000 });
  await assertCafeLayersVisible(page);
  await waitForUiSettled(page, { timeout: 4_000 });

  assertNoRuntimeErrors(diagnostics);
});
