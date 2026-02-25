import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { applyCafeStyles, fitToData, updateCafeSource } from "./cafe-layers.js";
import { loadDefaultMapData, applyLayerFilter } from "./data-source.js";
import {
  applyCreativeFeatureAmplification,
  applySingleBaseLabelStyle,
  applySingleComponentStyle,
  applyLayerVisibility,
  applyMapCanvasFilter
} from "./map-style.js";
import {
  applyCreativeControls,
  applyCreativeDistortion,
  applyCreativeProfile,
  applyAtmosphereStyles,
  applyCanvasLayout,
  applyManualView,
  applyPosterStyles,
  resetCamera,
  resetCreativeControls,
  resetGlobalFilters
} from "./studio-ui.js";

export function bindEvents({ switchBasemap, applyPreset }) {
  document.addEventListener("dblclick", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "range") {
      return;
    }
    if (target.value === target.defaultValue) {
      return;
    }
    target.value = target.defaultValue;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  });

  inputs.reloadDataBtn.addEventListener("click", async () => {
    await loadDefaultMapData();
  });

  inputs.layerFilter.addEventListener("change", applyLayerFilter);

  inputs.applyPresetBtn.addEventListener("click", () => {
    applyPreset(inputs.presetSelect.value);
  });

  inputs.basemapSelect.addEventListener("change", () => {
    switchBasemap(inputs.basemapSelect.value);
  });

  inputs.applyCreativeProfileBtn?.addEventListener("click", () => {
    applyCreativeProfile(inputs.creativeProfileSelect.value);
  });
  inputs.resetCreativeControlsBtn?.addEventListener("click", () => {
    resetCreativeControls();
  });

  [
    inputs.showWater,
    inputs.showParks,
    inputs.showLanduse,
    inputs.showRoadsMajor,
    inputs.showRoadsMinor,
    inputs.showBuildings,
    inputs.showBoundaries,
    inputs.showRoadLabels,
    inputs.showPlaceLabels,
    inputs.showPoiLabels,
    inputs.showWaterLabels
  ].forEach((el) => {
    el.addEventListener("change", applyLayerVisibility);
  });

  [
    ["bgColor", inputs.bgColor],
    ["waterColor", inputs.waterColor],
    ["waterOpacity", inputs.waterOpacity],
    ["parkColor", inputs.parkColor],
    ["parkOpacity", inputs.parkOpacity],
    ["landuseColor", inputs.landuseColor],
    ["landuseOpacity", inputs.landuseOpacity],
    ["roadMajorColor", inputs.roadMajorColor],
    ["roadMajorOpacity", inputs.roadMajorOpacity],
    ["roadMinorColor", inputs.roadMinorColor],
    ["roadMinorOpacity", inputs.roadMinorOpacity],
    ["buildingColor", inputs.buildingColor],
    ["buildingOpacity", inputs.buildingOpacity],
    ["boundaryColor", inputs.boundaryColor],
    ["boundaryOpacity", inputs.boundaryOpacity]
  ].forEach(([key, el]) => {
    el.addEventListener("input", () => {
      state.componentStyleOverridesEnabled = true;
      applySingleComponentStyle(key);
      applyCreativeFeatureAmplification();
    });
    el.addEventListener("change", () => {
      state.componentStyleOverridesEnabled = true;
      applySingleComponentStyle(key);
      applyCreativeFeatureAmplification();
    });
  });

  [inputs.mapBrightness, inputs.mapContrast, inputs.mapSaturation, inputs.mapGrayscale, inputs.mapHue].forEach((el) => {
    el.addEventListener("input", applyMapCanvasFilter);
    el.addEventListener("change", applyMapCanvasFilter);
  });

  inputs.resetGlobalFiltersBtn.addEventListener("click", resetGlobalFilters);

  [
    inputs.labelDensityPreset,
    inputs.accentTarget,
    inputs.accentStrength,
    inputs.inkBoost,
    inputs.riverBoost,
    inputs.featureFocus,
    inputs.featureFocusStrength,
    inputs.paletteBgColor,
    inputs.paletteInkColor,
    inputs.paletteAccentColor
  ].forEach((el) => {
    el?.addEventListener("input", applyCreativeControls);
    el?.addEventListener("change", applyCreativeControls);
  });

  [
    inputs.distortRotate,
    inputs.distortSkewX,
    inputs.distortSkewY,
    inputs.distortScaleX,
    inputs.distortScaleY
  ].forEach((el) => {
    el?.addEventListener("input", applyCreativeDistortion);
    el?.addEventListener("change", applyCreativeDistortion);
  });

  [
    ["baseLabelColor", inputs.baseLabelColor],
    ["baseLabelOpacity", inputs.baseLabelOpacity],
    ["baseLabelHaloColor", inputs.baseLabelHaloColor],
    ["baseLabelHaloWidth", inputs.baseLabelHaloWidth],
    ["baseLabelSizeScale", inputs.baseLabelSizeScale],
    ["baseLabelTransform", inputs.baseLabelTransform]
  ].forEach(([key, el]) => {
    el.addEventListener("input", () => {
      state.baseLabelStyleOverridesEnabled = true;
      applySingleBaseLabelStyle(key);
    });
    el.addEventListener("change", () => {
      state.baseLabelStyleOverridesEnabled = true;
      applySingleBaseLabelStyle(key);
    });
  });

  [
    inputs.markerColor,
    inputs.markerStroke,
    inputs.markerRadius,
    inputs.markerOpacity,
    inputs.strokeWeight,
    inputs.haloColor,
    inputs.haloSize,
    inputs.haloOpacity,
    inputs.shadowColor,
    inputs.shadowOpacity,
    inputs.shadowBlur,
    inputs.shadowOffsetX,
    inputs.shadowOffsetY,
    inputs.showLabels,
    inputs.labelColor,
    inputs.labelSize,
    inputs.labelHaloColor,
    inputs.labelHaloWidth,
    inputs.labelLetterSpacing,
    inputs.labelOffsetY
  ].forEach((el) => {
    el.addEventListener("input", applyCafeStyles);
    el.addEventListener("change", applyCafeStyles);
  });

  [inputs.jitterMeters, inputs.labelMode, inputs.labelTransform].forEach((el) => {
    el.addEventListener("input", () => updateCafeSource(false));
    el.addEventListener("change", () => updateCafeSource(false));
  });

  [
    inputs.tintColor,
    inputs.tintOpacity,
    inputs.vignetteOpacity,
    inputs.grainOpacity,
    inputs.frameColor,
    inputs.frameWidth,
    inputs.frameRadius,
    inputs.frameShadow
  ].forEach((el) => {
    el.addEventListener("input", applyAtmosphereStyles);
    el.addEventListener("change", applyAtmosphereStyles);
  });

  [
    inputs.showPoster,
    inputs.posterTitle,
    inputs.posterSubtitle,
    inputs.posterPosition,
    inputs.posterColor,
    inputs.posterSize,
    inputs.posterSubtitleSize,
    inputs.posterBgColor,
    inputs.posterBgOpacity,
    inputs.posterPadding
  ].forEach((el) => {
    el.addEventListener("input", applyPosterStyles);
    el.addEventListener("change", applyPosterStyles);
  });

  [inputs.canvasRatio, inputs.canvasPadding].forEach((el) => {
    el.addEventListener("input", applyCanvasLayout);
    el.addEventListener("change", applyCanvasLayout);
  });

  inputs.fitPadding.addEventListener("input", () => fitToData());
  inputs.fitPadding.addEventListener("change", () => fitToData());

  inputs.pitchInput.addEventListener("input", () => {
    if (state.mapReady) {
      state.map.setPitch(Number(inputs.pitchInput.value));
    }
  });

  inputs.bearingInput.addEventListener("input", () => {
    if (state.mapReady) {
      state.map.setBearing(Number(inputs.bearingInput.value));
    }
  });

  inputs.applyViewBtn.addEventListener("click", applyManualView);
  inputs.fitBtn.addEventListener("click", fitToData);
  inputs.resetCameraBtn.addEventListener("click", resetCamera);

  inputs.togglePanelBtn.addEventListener("click", () => {
    inputs.appShell.classList.toggle("panel-hidden");
    setTimeout(() => {
      applyCanvasLayout();
      state.map?.resize();
    }, 120);
  });

  window.addEventListener("resize", () => {
    applyCanvasLayout();
  });
}
