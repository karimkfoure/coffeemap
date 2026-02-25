import { defaultMyMapsUrl, styleUrls } from "./core/constants.js";
import { inputs } from "./core/inputs.js";
import { state } from "./core/state.js";
import { setLoading } from "./core/ui-state.js";
import { ensureCafeLayers, updateCafeSource } from "./modules/cafe-layers.js";
import { loadDefaultMapData } from "./modules/data-source.js";
import { bindEvents } from "./modules/events.js";
import {
  applyBaseLabelStyles,
  applyComponentColors,
  applyLayerVisibility,
  applyMapCanvasFilter,
  renderStyleEntityEditor,
  captureBaseFeaturePaint,
  captureBaseLabelSizes,
  classifyMapLayers
} from "./modules/map-style.js";
import { initMap } from "./modules/map-init.js";
import {
  applyAllStyleControls,
  applyAtmosphereStyles,
  applyCanvasLayout,
  applyPosterStyles,
  applyPreset,
  resetStyleConflictsForBasemapSwitch
} from "./modules/studio-ui.js";

let styleSwitchTimeoutId = null;
let pendingBasemapKey = null;
let activeStyleLoadToken = 0;
let activeBasemapKey = state.currentBasemap;

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

function startQueuedBasemapSwitch() {
  if (!pendingBasemapKey || !state.map) {
    return;
  }

  const styleKey = pendingBasemapKey;
  pendingBasemapKey = null;
  state.styleReady = false;

  if (!state.styleSwitching) {
    state.styleSwitching = true;
    setLoading(true, "Cambiando estilo base...");
  }

  ++activeStyleLoadToken;
  activeBasemapKey = styleKey;
  scheduleStyleSwitchFailsafe();
  state.map.setStyle(styleUrls[styleKey], { diff: false });
}

function onStyleReady(styleLoadToken = activeStyleLoadToken) {
  if (styleLoadToken !== activeStyleLoadToken || state.styleReady) {
    return;
  }
  state.styleReady = true;
  state.currentBasemap = activeBasemapKey;
  if (inputs.basemapSelect.value !== state.currentBasemap) {
    inputs.basemapSelect.value = state.currentBasemap;
  }
  classifyMapLayers();
  captureBaseLabelSizes();
  captureBaseFeaturePaint();
  ensureCafeLayers();
  updateCafeSource(false);
  applyAllStyleControls();
  renderStyleEntityEditor();

  if (pendingBasemapKey) {
    startQueuedBasemapSwitch();
    return;
  }

  finishStyleSwitch();
}

function switchBasemap(styleKey, options = {}) {
  if (!styleUrls[styleKey]) {
    return;
  }
  if (styleKey === state.currentBasemap && !pendingBasemapKey && !state.styleSwitching) {
    return;
  }
  if (!options.preserveStyleOverrides) {
    resetStyleConflictsForBasemapSwitch();
  }

  pendingBasemapKey = styleKey;

  if (!state.styleSwitching) {
    startQueuedBasemapSwitch();
  }
}

function init() {
  inputs.sourceLink.href = defaultMyMapsUrl;
  inputs.sourceLink.textContent = "Abrir fuente";

  bindEvents({
    switchBasemap,
    applyPreset: (presetName) => applyPreset(presetName, switchBasemap)
  });

  applyLayerVisibility();
  applyComponentColors();
  applyBaseLabelStyles();
  applyMapCanvasFilter();
  applyAtmosphereStyles();
  applyPosterStyles();

  initMap({
    onStyleLoad: () => onStyleReady(activeStyleLoadToken),
    onInitialLoad: async () => {
      applyCanvasLayout();
      await loadDefaultMapData();
    }
  });
}

init();
