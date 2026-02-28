import { defaultMyMapsUrl, defaultPresetName, presets, startupConfig, styleUrls } from "./core/constants.js";
import { inputs } from "./core/inputs.js";
import { state } from "./core/state.js";
import { setLoading, setStatus } from "./core/ui-state.js";
import { loadDefaultMapData } from "./modules/data-source.js";
import { bindEvents } from "./modules/events.js";
import {
  captureBaseFeaturePaint,
  captureBaseLabelSizes,
  captureStyleSnapshot,
  classifyMapLayers,
  applyLayerVisibility,
  applyMapCanvasFilter,
  applyStyleEntityVisibilityPatch,
  renderStyleEntityEditor,
  syncComponentStyleControlAvailability,
  syncLayerControlAvailability
} from "./modules/map-style.js";
import { initMap } from "./modules/map-init.js";
import {
  applyAllStyleControls,
  applyAtmosphereStyles,
  applyCanvasLayout,
  applyCreativeDistortion,
  applyManualView,
  applyPosterStyles,
  applyPreset
} from "./modules/studio-ui.js";
import { buildConfigFromPreset, buildConfigFromStyleSnapshot, renderInputsFromConfig, replaceConfig } from "./modules/config-state.js";
import { applyCafeStyles, ensureCafeLayers, updateCafeSource } from "./modules/cafe-layers.js";

let styleSwitchTimeoutId = null;
let pendingBasemapKey = null;
let activeStyleLoadToken = 0;
let activeBasemapKey = state.currentBasemap;
let currentStyleContext = { mode: "startup" };

function clearStyleSwitchTimeout() {
  if (styleSwitchTimeoutId) {
    clearTimeout(styleSwitchTimeoutId);
    styleSwitchTimeoutId = null;
  }
}

function finishStyleSwitch() {
  if (!state.styleSwitching) {
    return;
  }

  const hasQueuedBasemap = Boolean(pendingBasemapKey);
  state.styleSwitching = false;
  clearStyleSwitchTimeout();
  setLoading(false);

  if (hasQueuedBasemap) {
    startQueuedBasemapSwitch();
  }
}

function scheduleStyleSwitchFailsafe() {
  clearStyleSwitchTimeout();
  styleSwitchTimeoutId = setTimeout(() => {
    finishStyleSwitch();
  }, 15000);
}

function buildStartupConfig(snapshot) {
  const nextConfig = buildConfigFromStyleSnapshot(snapshot, {
    preserveCamera: startupConfig.camera,
    cafeStyles: startupConfig.cafeStyles,
    poster: startupConfig.poster,
    canvas: startupConfig.canvas,
    atmosphere: startupConfig.atmosphere,
    creative: startupConfig.creative,
    styleEntityVisibility: startupConfig.styleEntityVisibility
  });

  nextConfig.basemap = startupConfig.basemap;
  nextConfig.layerVisibility = {
    ...nextConfig.layerVisibility,
    ...startupConfig.layerVisibility
  };

  return nextConfig;
}

function buildVisibilityOnlyEntityPatch(entries = {}) {
  const nextEntries = {};

  for (const [entityKey, entry] of Object.entries(entries || {})) {
    if (typeof entry?.visible !== "boolean") {
      continue;
    }
    nextEntries[entityKey] = { visible: entry.visible };
  }

  return nextEntries;
}

function buildManualBasemapConfig(snapshot) {
  return buildConfigFromStyleSnapshot(snapshot, {
    preserveCamera: state.config.camera,
    cafeStyles: state.config.cafeStyles,
    canvas: state.config.canvas,
    styleEntityVisibility: buildVisibilityOnlyEntityPatch(state.config.styleEntityVisibility)
  });
}

function buildNextConfig(snapshot) {
  if (currentStyleContext.mode === "preset") {
    const preset = presets[currentStyleContext.presetName];
    if (preset) {
      return buildConfigFromPreset(preset, snapshot);
    }
  }

  if (currentStyleContext.mode === "manual") {
    return buildManualBasemapConfig(snapshot);
  }

  return buildStartupConfig(snapshot);
}

function applyRehydratedStyleSession() {
  applyLayerVisibility();
  applyStyleEntityVisibilityPatch(state.config.styleEntityVisibility);
  applyMapCanvasFilter();
  applyCreativeDistortion();
  applyAtmosphereStyles();
  applyPosterStyles();
  applyCanvasLayout();
  applyCafeStyles();
}

function startQueuedBasemapSwitch() {
  if (!pendingBasemapKey || !state.map) {
    return;
  }

  const { styleKey, context } = pendingBasemapKey;
  pendingBasemapKey = null;
  state.styleReady = false;
  state.styleSnapshot = null;
  state.styleEntitiesByKey.clear();

  if (!state.styleSwitching) {
    state.styleSwitching = true;
    setLoading(true, "Cambiando estilo base...");
  }

  ++activeStyleLoadToken;
  activeBasemapKey = styleKey;
  currentStyleContext = context || { mode: "manual" };
  scheduleStyleSwitchFailsafe();
  state.map.setStyle(styleUrls[styleKey], { diff: false });
}

function onStyleReady(styleLoadToken = activeStyleLoadToken) {
  if (styleLoadToken !== activeStyleLoadToken || state.styleReady) {
    return;
  }

  state.styleReady = true;
  state.currentBasemap = activeBasemapKey;

  classifyMapLayers();
  syncLayerControlAvailability();
  captureBaseLabelSizes();
  captureBaseFeaturePaint();
  state.styleSnapshot = captureStyleSnapshot();

  replaceConfig(buildNextConfig(state.styleSnapshot));
  renderInputsFromConfig(state.config);
  syncComponentStyleControlAvailability();

  ensureCafeLayers();
  renderStyleEntityEditor();
  if (currentStyleContext.mode === "preset") {
    applyAllStyleControls();
  } else {
    applyRehydratedStyleSession();
  }
  updateCafeSource(false);
  applyManualView();

  if (inputs.basemapSelect.value !== state.currentBasemap) {
    inputs.basemapSelect.value = state.currentBasemap;
  }

  if (currentStyleContext.mode === "preset" && currentStyleContext.presetName) {
    inputs.presetSelect.value = currentStyleContext.presetName;
    setStatus(`Preset aplicado: ${currentStyleContext.presetName}.`);
  }

  if (pendingBasemapKey) {
    startQueuedBasemapSwitch();
    return;
  }

  finishStyleSwitch();
}

function switchBasemap(styleKey, context = { mode: "manual" }) {
  if (!styleUrls[styleKey]) {
    return;
  }
  if (styleKey === state.currentBasemap && !pendingBasemapKey && !state.styleSwitching) {
    return;
  }

  pendingBasemapKey = { styleKey, context };

  if (!state.styleSwitching) {
    startQueuedBasemapSwitch();
  }
}

function init() {
  inputs.sourceLink.href = defaultMyMapsUrl;
  inputs.sourceLink.textContent = "Abrir fuente";
  inputs.presetSelect.value = defaultPresetName;
  window.__COFFEEMAP_STATE__ = state;

  renderInputsFromConfig(state.config);
  applyAtmosphereStyles();
  applyPosterStyles();
  applyCanvasLayout();

  bindEvents({
    switchBasemap,
    applyPreset: (presetName) => applyPreset(presetName, switchBasemap)
  });

  initMap({
    onStyleLoad: () => onStyleReady(activeStyleLoadToken),
    onInitialLoad: async () => {
      applyCanvasLayout();
      await loadDefaultMapData({ shouldFit: false });
    }
  });
}

init();
