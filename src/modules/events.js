import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { setStatus } from "../core/ui-state.js";
import { applyCafeStyles, fitToData, updateCafeSource } from "./cafe-layers.js";
import { loadDefaultMapData, applyLayerFilter } from "./data-source.js";
import { exportViewportPng } from "./export-image.js";
import {
  applySingleBaseLabelStyle,
  applySingleComponentStyle,
  applyLayerVisibility,
  applyMapCanvasFilter
} from "./map-style.js";
import {
  applyCreativeFeatureControls,
  applyCreativeToneControls,
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
import { buildConfigFromDefaults, getInputBinding, getConfigValueByInput, renderInputsFromConfig, updateConfigFromInput } from "./config-state.js";

function bindConfigInputs(inputKeys, apply) {
  for (const inputKey of inputKeys) {
    const element = inputs[inputKey];
    if (!element) {
      continue;
    }

    const applyInput = () => {
      const rawValue = element.type === "checkbox" ? element.checked : element.value;
      updateConfigFromInput(inputKey, rawValue);
      apply(inputKey);
    };

    element.addEventListener("input", applyInput);
    element.addEventListener("change", applyInput);
  }
}

export function bindEvents({ switchBasemap, applyPreset }) {
  document.addEventListener("dblclick", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "range") {
      return;
    }

    if (target.dataset.entityAction) {
      if (target.value === target.defaultValue) {
        return;
      }
      target.value = target.defaultValue;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const inputKey = target.id;
    const binding = getInputBinding(inputKey);
    if (!binding) {
      return;
    }

    const defaultValue = getConfigValueByInput(inputKey, buildConfigFromDefaults());
    if (String(getConfigValueByInput(inputKey)) === String(defaultValue)) {
      return;
    }

    updateConfigFromInput(inputKey, defaultValue);
    renderInputsFromConfig(state.config);
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
    switchBasemap(inputs.basemapSelect.value, { mode: "manual" });
  });

  inputs.applyCreativeProfileBtn?.addEventListener("click", () => {
    applyCreativeProfile(inputs.creativeProfileSelect.value);
  });
  inputs.resetCreativeControlsBtn?.addEventListener("click", () => {
    resetCreativeControls();
  });

  bindConfigInputs(
    [
      "showWater",
      "showParks",
      "showLanduse",
      "showRoadsMajor",
      "showRoadsMinor",
      "showBuildings",
      "showBoundaries",
      "showRoadLabels",
      "showPlaceLabels",
      "showPoiLabels",
      "showWaterLabels"
    ],
    () => {
      applyLayerVisibility();
    }
  );

  bindConfigInputs(
    [
      "bgColor",
      "waterColor",
      "waterOpacity",
      "parkColor",
      "parkOpacity",
      "landuseColor",
      "landuseOpacity",
      "roadMajorColor",
      "roadMajorOpacity",
      "roadMinorColor",
      "roadMinorOpacity",
      "buildingColor",
      "buildingOpacity",
      "boundaryColor",
      "boundaryOpacity"
    ],
    (inputKey) => {
      applySingleComponentStyle(inputKey);
    }
  );

  bindConfigInputs(["mapBrightness", "mapContrast", "mapSaturation", "mapGrayscale", "mapHue"], () => {
    applyMapCanvasFilter();
  });

  inputs.resetGlobalFiltersBtn.addEventListener("click", resetGlobalFilters);

  bindConfigInputs(
    ["labelDensityPreset", "accentTarget", "accentStrength", "paletteBgColor", "paletteInkColor", "paletteAccentColor"],
    () => {
      applyCreativeToneControls();
    }
  );

  bindConfigInputs(["inkBoost", "riverBoost", "featureFocus", "featureFocusStrength"], () => {
    applyCreativeFeatureControls();
  });

  bindConfigInputs(["distortRotate", "distortSkewX", "distortSkewY", "distortScaleX", "distortScaleY"], () => {
    applyCreativeDistortion();
  });

  bindConfigInputs(
    [
      "baseLabelColor",
      "baseLabelOpacity",
      "baseLabelHaloColor",
      "baseLabelHaloWidth",
      "baseLabelSizeScale",
      "baseLabelTransform"
    ],
    (inputKey) => {
      applySingleBaseLabelStyle(inputKey);
    }
  );

  bindConfigInputs(
    [
      "markerVariant",
      "showMarkerIndex",
      "markerColor",
      "markerStroke",
      "markerRadius",
      "markerOpacity",
      "strokeWeight",
      "haloColor",
      "haloSize",
      "haloOpacity",
      "shadowColor",
      "shadowOpacity",
      "shadowBlur",
      "shadowOffsetX",
      "shadowOffsetY",
      "showLabels",
      "labelColor",
      "labelSize",
      "labelHaloColor",
      "labelHaloWidth",
      "labelLetterSpacing",
      "labelOffsetX",
      "labelOffsetY"
    ],
    () => {
      applyCafeStyles();
    }
  );

  bindConfigInputs(["jitterMeters", "labelMode", "labelTransform"], () => {
    updateCafeSource(false);
  });

  bindConfigInputs(
    ["tintColor", "tintOpacity", "vignetteOpacity", "grainOpacity", "frameColor", "frameWidth", "frameRadius", "frameShadow"],
    () => {
      applyAtmosphereStyles();
    }
  );

  bindConfigInputs(
    [
      "showPoster",
      "posterTitle",
      "posterSubtitle",
      "posterPosition",
      "posterColor",
      "posterSize",
      "posterSubtitleSize",
      "posterBgColor",
      "posterBgOpacity",
      "posterPadding"
    ],
    () => {
      applyPosterStyles();
    }
  );

  bindConfigInputs(["canvasRatio", "canvasPadding"], () => {
    applyCanvasLayout();
  });

  bindConfigInputs(["fitPadding"], () => {
    fitToData();
  });

  bindConfigInputs(["pitchInput"], () => {
    if (state.mapReady) {
      state.map.setPitch(Number(state.config.camera.pitch));
    }
  });

  bindConfigInputs(["bearingInput"], () => {
    if (state.mapReady) {
      state.map.setBearing(Number(state.config.camera.bearing));
    }
  });

  bindConfigInputs(["centerLat", "centerLng", "zoomInput"], () => {});

  inputs.applyViewBtn.addEventListener("click", applyManualView);
  inputs.fitBtn.addEventListener("click", fitToData);
  inputs.resetCameraBtn.addEventListener("click", resetCamera);
  inputs.downloadViewportBtn.addEventListener("click", () => {
    exportViewportPng();
  });

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

  if (!getInputBinding("centerLat")) {
    setStatus("Bindings de config incompletos.");
  }
}
