const {
  applyPreset,
  assertBasemapSwitchStable,
  assertCafeLayersVisible,
  runUiAction,
  switchBasemap,
  assertNoRuntimeErrors,
  gotoAndWaitForReady,
  getSelectOptionValues,
  mockDefaultKml,
  waitForUiSettled,
  expect,
  test
} = require("./helpers/e2e");

test.beforeEach(async ({ page }) => {
  await mockDefaultKml(page);
});

test("flujo completo: carga, estilo, poster y encuadre", async ({ page, diagnostics }) => {
  await gotoAndWaitForReady(page);

  await test.step("carga inicial y filtro por layer", async () => {
    await expect(page.locator("#layerFilter option")).toHaveCount(3);
    await runUiAction(page, async () => {
      await page.selectOption("#layerFilter", "Centro");
    });
    await expect(page.locator("#status")).toContainText("Layer activo: Centro.");
    await expect(page.locator("#status")).toContainText("Cafes visibles: 3.");

    await runUiAction(page, async () => {
      await page.selectOption("#layerFilter", "");
    });
    await expect(page.locator("#status")).toContainText("Mostrando todas las capas.");
    await expect(page.locator("#status")).toContainText("Cafes visibles: 6.");
  });

  await test.step("preset night y ajustes de refinado", async () => {
    await applyPreset(page, "night");
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
  });

  await test.step("switch manual de basemap limpia overrides conflictivos", async () => {
    await switchBasemap(page, "bright");

    await expect(page.locator("#mapBrightness")).toHaveValue("100");
    await expect(page.locator("#mapContrast")).toHaveValue("100");
    await expect(page.locator("#mapSaturation")).toHaveValue("100");
    await expect(page.locator("#mapGrayscale")).toHaveValue("0");
    await expect(page.locator("#mapHue")).toHaveValue("0");
    await expect(page.locator("#tintOpacity")).toHaveValue("0");
    await expect(page.locator("#vignetteOpacity")).toHaveValue("12");
    await expect(page.locator("#grainOpacity")).toHaveValue("0");
    await expect(page.locator("#frameWidth")).toHaveValue("0");

    const visualVars = await page.evaluate(() => ({
      mapFilter: getComputedStyle(document.documentElement).getPropertyValue("--map-filter"),
      tintOpacity: getComputedStyle(document.documentElement).getPropertyValue("--tint-opacity"),
      vignetteOpacity: getComputedStyle(document.documentElement).getPropertyValue("--vignette-opacity"),
      frameWidth: getComputedStyle(document.documentElement).getPropertyValue("--frame-width")
    }));

    expect(visualVars.mapFilter).toContain("brightness(100%)");
    expect(visualVars.mapFilter).toContain("contrast(100%)");
    expect(visualVars.tintOpacity).toBe("0");
    expect(visualVars.vignetteOpacity).toBe("0.12");
    expect(visualVars.frameWidth).toBe("0px");
  });

  await test.step("encuadre manual, reset de camara y ratio", async () => {
    await page.fill("#centerLat", "-31.430000");
    await page.fill("#centerLng", "-64.190000");
    await page.fill("#zoomInput", "12.5");
    await runUiAction(page, async () => {
      await page.click("#applyViewBtn");
    });

    expect(Number(await page.inputValue("#centerLat"))).toBeCloseTo(-31.43, 2);
    expect(Number(await page.inputValue("#centerLng"))).toBeCloseTo(-64.19, 2);
    expect(Number(await page.inputValue("#zoomInput"))).toBeCloseTo(12.5, 1);

    await runUiAction(page, async () => {
      await page.click("#resetCameraBtn");
    });
    expect(Number(await page.inputValue("#centerLat"))).toBeCloseTo(-31.42048, 3);
    expect(Number(await page.inputValue("#centerLng"))).toBeCloseTo(-64.18262, 3);
    expect(Number(await page.inputValue("#zoomInput"))).toBeCloseTo(13, 1);

    await runUiAction(page, async () => {
      await page.selectOption("#canvasRatio", "1:1");
    });

    const ratio = await page.locator("#mapFrame").evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width / bounds.height;
    });
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  });

  await test.step("contrato generico: cambios consecutivos no dejan UI bloqueada", async () => {
    await applyPreset(page, "park");
    await applyPreset(page, "mono");
    await switchBasemap(page, "bright");
    await switchBasemap(page, "liberty");
    await waitForUiSettled(page, { timeout: 4_000 });
  });

  await test.step("modo captura y poster", async () => {
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

    await runUiAction(page, async () => {
      await page.click("#togglePanelBtn");
    });
    await expect(page.locator("#appShell")).toHaveClass(/panel-hidden/);
  });

  assertNoRuntimeErrors(diagnostics);
});

test("@full recorre catalogo completo de basemaps y presets", async ({ page, diagnostics }) => {
  test.setTimeout(240_000);
  await gotoAndWaitForReady(page);

  await test.step("basemaps: recorrido completo sin bloqueo", async () => {
    const basemapValues = await getSelectOptionValues(page, "#basemapSelect");
    expect(basemapValues.length).toBeGreaterThanOrEqual(20);

    await runUiAction(page, async () => {
      await page.selectOption("#layerFilter", "Centro");
    });
    await expect(page.locator("#status")).toContainText("Cafes visibles: 3.");

    for (const basemap of basemapValues) {
      await switchBasemap(page, basemap, { timeout: 30_000 });
      await expect(page.locator("#basemapSelect")).toHaveValue(basemap);
      await assertBasemapSwitchStable(page);
      await assertCafeLayersVisible(page);
    }
  });

  await test.step("presets: recorrido completo y combinacion import -> preset -> basemap -> captura", async () => {
    const presetValues = await getSelectOptionValues(page, "#presetSelect");
    expect(presetValues.length).toBeGreaterThanOrEqual(12);

    for (const preset of presetValues) {
      await applyPreset(page, preset, { timeout: 30_000 });
      await expect(page.locator("#status")).toContainText(`Preset aplicado: ${preset}.`);
      await assertBasemapSwitchStable(page);
      await assertCafeLayersVisible(page);
    }

    await runUiAction(page, async () => {
      await page.click("#reloadDataBtn");
    }, { timeout: 30_000 });
    await expect(page.locator("#status")).toContainText("Cargados");

    await applyPreset(page, "toner-bold", { timeout: 30_000 });
    await switchBasemap(page, "cartoPositronNoLabels", { timeout: 30_000 });
    await assertCafeLayersVisible(page);

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
    await page.fill("#posterTitle", "Catalogo completo");
    await page.fill("#posterSubtitle", "Switch estable");
    await runUiAction(page, async () => {
      await page.click("#togglePanelBtn");
    });
    await expect(page.locator("#appShell")).toHaveClass(/panel-hidden/);
  });

  assertNoRuntimeErrors(diagnostics);
});
