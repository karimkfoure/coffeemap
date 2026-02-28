import { configDefaults } from "../core/constants.js";
import { cloneValue } from "../core/helpers.js";
import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { setInputValue } from "../core/ui-state.js";

const inputBindings = {
  basemapSelect: {
    get: (config) => config.basemap,
    set: (config, value) => {
      config.basemap = String(value);
    }
  },
  showWater: createBinding("layerVisibility.showWater"),
  showParks: createBinding("layerVisibility.showParks"),
  showLanduse: createBinding("layerVisibility.showLanduse"),
  showRoadsMajor: createBinding("layerVisibility.showRoadsMajor"),
  showRoadsMinor: createBinding("layerVisibility.showRoadsMinor"),
  showBuildings: createBinding("layerVisibility.showBuildings"),
  showBoundaries: createBinding("layerVisibility.showBoundaries"),
  showRoadLabels: createBinding("layerVisibility.showRoadLabels"),
  showPlaceLabels: createBinding("layerVisibility.showPlaceLabels"),
  showPoiLabels: createBinding("layerVisibility.showPoiLabels"),
  showWaterLabels: createBinding("layerVisibility.showWaterLabels"),
  bgColor: createBinding("componentStyles.bgColor"),
  waterColor: createBinding("componentStyles.waterColor"),
  waterOpacity: createBinding("componentStyles.waterOpacity"),
  parkColor: createBinding("componentStyles.parkColor"),
  parkOpacity: createBinding("componentStyles.parkOpacity"),
  landuseColor: createBinding("componentStyles.landuseColor"),
  landuseOpacity: createBinding("componentStyles.landuseOpacity"),
  roadMajorColor: createBinding("componentStyles.roadMajorColor"),
  roadMajorOpacity: createBinding("componentStyles.roadMajorOpacity"),
  roadMinorColor: createBinding("componentStyles.roadMinorColor"),
  roadMinorOpacity: createBinding("componentStyles.roadMinorOpacity"),
  buildingColor: createBinding("componentStyles.buildingColor"),
  buildingOpacity: createBinding("componentStyles.buildingOpacity"),
  boundaryColor: createBinding("componentStyles.boundaryColor"),
  boundaryOpacity: createBinding("componentStyles.boundaryOpacity"),
  mapBrightness: createBinding("atmosphere.mapBrightness"),
  mapContrast: createBinding("atmosphere.mapContrast"),
  mapSaturation: createBinding("atmosphere.mapSaturation"),
  mapGrayscale: createBinding("atmosphere.mapGrayscale"),
  mapHue: createBinding("atmosphere.mapHue"),
  baseLabelColor: createBinding("baseLabelStyles.baseLabelColor"),
  baseLabelOpacity: createBinding("baseLabelStyles.baseLabelOpacity"),
  baseLabelHaloColor: createBinding("baseLabelStyles.baseLabelHaloColor"),
  baseLabelHaloWidth: createBinding("baseLabelStyles.baseLabelHaloWidth"),
  baseLabelSizeScale: createBinding("baseLabelStyles.baseLabelSizeScale"),
  baseLabelTransform: createBinding("baseLabelStyles.baseLabelTransform"),
  markerVariant: createBinding("cafeStyles.markerVariant"),
  showMarkerIndex: createBinding("cafeStyles.showMarkerIndex"),
  markerColor: createBinding("cafeStyles.markerColor"),
  markerStroke: createBinding("cafeStyles.markerStroke"),
  markerRadius: createBinding("cafeStyles.markerRadius"),
  markerOpacity: createBinding("cafeStyles.markerOpacity"),
  strokeWeight: createBinding("cafeStyles.strokeWeight"),
  haloColor: createBinding("cafeStyles.haloColor"),
  haloSize: createBinding("cafeStyles.haloSize"),
  haloOpacity: createBinding("cafeStyles.haloOpacity"),
  shadowColor: createBinding("cafeStyles.shadowColor"),
  shadowOpacity: createBinding("cafeStyles.shadowOpacity"),
  shadowBlur: createBinding("cafeStyles.shadowBlur"),
  shadowOffsetX: createBinding("cafeStyles.shadowOffsetX"),
  shadowOffsetY: createBinding("cafeStyles.shadowOffsetY"),
  jitterMeters: createBinding("cafeStyles.jitterMeters"),
  showLabels: createBinding("cafeStyles.showLabels"),
  labelMode: createBinding("cafeStyles.labelMode"),
  labelTransform: createBinding("cafeStyles.labelTransform"),
  labelColor: createBinding("cafeStyles.labelColor"),
  labelSize: createBinding("cafeStyles.labelSize"),
  labelHaloColor: createBinding("cafeStyles.labelHaloColor"),
  labelHaloWidth: createBinding("cafeStyles.labelHaloWidth"),
  labelLetterSpacing: createBinding("cafeStyles.labelLetterSpacing"),
  labelOffsetX: createBinding("cafeStyles.labelOffsetX"),
  labelOffsetY: createBinding("cafeStyles.labelOffsetY"),
  creativeProfileSelect: createBinding("creative.creativeProfileSelect"),
  labelDensityPreset: createBinding("creative.labelDensityPreset"),
  accentTarget: createBinding("creative.accentTarget"),
  accentStrength: createBinding("creative.accentStrength"),
  inkBoost: createBinding("creative.inkBoost"),
  riverBoost: createBinding("creative.riverBoost"),
  featureFocus: createBinding("creative.featureFocus"),
  featureFocusStrength: createBinding("creative.featureFocusStrength"),
  distortRotate: createBinding("creative.distortRotate"),
  distortSkewX: createBinding("creative.distortSkewX"),
  distortSkewY: createBinding("creative.distortSkewY"),
  distortScaleX: createBinding("creative.distortScaleX"),
  distortScaleY: createBinding("creative.distortScaleY"),
  paletteBgColor: createBinding("creative.paletteBgColor"),
  paletteInkColor: createBinding("creative.paletteInkColor"),
  paletteAccentColor: createBinding("creative.paletteAccentColor"),
  tintColor: createBinding("atmosphere.tintColor"),
  tintOpacity: createBinding("atmosphere.tintOpacity"),
  vignetteOpacity: createBinding("atmosphere.vignetteOpacity"),
  grainOpacity: createBinding("atmosphere.grainOpacity"),
  frameColor: createBinding("atmosphere.frameColor"),
  frameWidth: createBinding("atmosphere.frameWidth"),
  frameRadius: createBinding("atmosphere.frameRadius"),
  frameShadow: createBinding("atmosphere.frameShadow"),
  showPoster: createBinding("poster.showPoster"),
  posterTitle: createBinding("poster.posterTitle"),
  posterSubtitle: createBinding("poster.posterSubtitle"),
  posterPosition: createBinding("poster.posterPosition"),
  posterColor: createBinding("poster.posterColor"),
  posterSize: createBinding("poster.posterSize"),
  posterSubtitleSize: createBinding("poster.posterSubtitleSize"),
  posterBgColor: createBinding("poster.posterBgColor"),
  posterBgOpacity: createBinding("poster.posterBgOpacity"),
  posterPadding: createBinding("poster.posterPadding"),
  canvasRatio: createBinding("canvas.canvasRatio"),
  canvasPadding: createBinding("canvas.canvasPadding"),
  fitPadding: createBinding("canvas.fitPadding"),
  pitchInput: createBinding("camera.pitch"),
  bearingInput: createBinding("camera.bearing"),
  zoomInput: createBinding("camera.zoom"),
  centerLat: {
    get: (config) => config.camera.center[1],
    set: (config, value) => {
      config.camera.center[1] = Number(value);
    }
  },
  centerLng: {
    get: (config) => config.camera.center[0],
    set: (config, value) => {
      config.camera.center[0] = Number(value);
    }
  }
};

const presetBindingKeys = Object.keys(inputBindings);

function createBinding(path) {
  const pathTokens = path.split(".");
  return {
    get: (config) => getValueAtPath(config, pathTokens),
    set: (config, value) => {
      setValueAtPath(config, pathTokens, value);
    }
  };
}

function getValueAtPath(target, pathTokens) {
  return pathTokens.reduce((current, token) => current?.[token], target);
}

function setValueAtPath(target, pathTokens, value) {
  const tokens = Array.isArray(pathTokens) ? pathTokens : String(pathTokens).split(".");
  const parent = tokens.length === 1
    ? target
    : tokens.slice(0, -1).reduce((current, token) => current[token], target);
  parent[tokens.at(-1)] = value;
}

function normalizeInputValue(inputKey, rawValue) {
  const element = inputs[inputKey];
  if (!element) {
    return rawValue;
  }

  if (element.type === "checkbox") {
    return Boolean(rawValue);
  }

  if (element.type === "range" || element.type === "number") {
    return Number(rawValue);
  }

  return rawValue;
}

function mergeStyleEntityVisibility(nextConfig, visibilityPatch = {}) {
  for (const [entityKey, value] of Object.entries(visibilityPatch || {})) {
    const current = nextConfig.styleEntityVisibility[entityKey] || {};
    if (typeof value === "boolean") {
      nextConfig.styleEntityVisibility[entityKey] = { ...current, visible: value };
      continue;
    }
    nextConfig.styleEntityVisibility[entityKey] = { ...current, ...cloneValue(value) };
  }
}

function pickStyleEntityVisibility(entries = {}, options = {}) {
  const visibilityOnly = Boolean(options.visibilityOnly);
  const nextEntries = {};

  for (const [entityKey, entry] of Object.entries(entries || {})) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    if (visibilityOnly) {
      if (typeof entry.visible === "boolean") {
        nextEntries[entityKey] = { visible: entry.visible };
      }
      continue;
    }

    nextEntries[entityKey] = cloneValue(entry);
  }

  return nextEntries;
}

export function buildConfigFromDefaults() {
  return cloneValue(configDefaults);
}

export function buildConfigFromStyleSnapshot(snapshot, options = {}) {
  const config = buildConfigFromDefaults();
  config.basemap = snapshot?.basemap || config.basemap;
  config.layerVisibility = {
    ...config.layerVisibility,
    ...(snapshot?.layerVisibility || {})
  };
  config.componentStyles = {
    ...config.componentStyles,
    ...(snapshot?.componentStyles || {})
  };
  config.baseLabelStyles = {
    ...config.baseLabelStyles,
    ...(snapshot?.baseLabelStyles || {})
  };
  config.styleEntityVisibility = {};
  mergeStyleEntityVisibility(
    config,
    pickStyleEntityVisibility(snapshot?.styleEntityVisibility, { visibilityOnly: true })
  );

  if (options.preserveCamera) {
    config.camera = cloneValue(options.preserveCamera);
  }

  for (const sectionName of ["cafeStyles", "poster", "canvas", "atmosphere"]) {
    if (options[sectionName]) {
      config[sectionName] = cloneValue(options[sectionName]);
    }
  }

  if (options.creative) {
    config.creative = cloneValue(options.creative);
  }

  if (options.styleEntityVisibility) {
    mergeStyleEntityVisibility(config, options.styleEntityVisibility);
  }

  return config;
}

export function buildConfigFromPreset(preset, snapshot) {
  const config = buildConfigFromStyleSnapshot(snapshot);

  for (const key of presetBindingKeys) {
    if (!Object.prototype.hasOwnProperty.call(preset, key)) {
      continue;
    }
    inputBindings[key].set(config, normalizeInputValue(key, preset[key]));
  }

  if (Object.prototype.hasOwnProperty.call(preset, "styleEntityVisibility")) {
    mergeStyleEntityVisibility(config, preset.styleEntityVisibility);
  }

  return config;
}

export function renderInputsFromConfig(config) {
  for (const [inputKey, binding] of Object.entries(inputBindings)) {
    if (!inputs[inputKey]) {
      continue;
    }
    setInputValue(inputs[inputKey], binding.get(config));
  }
}

export function replaceConfig(nextConfig) {
  state.config = cloneValue(nextConfig);
  state.currentBasemap = state.config.basemap;
}

export function updateConfig(path, value) {
  setValueAtPath(state.config, path, cloneValue(value));
  return state.config;
}

export function updateConfigFromInput(inputKey, rawValue) {
  const binding = inputBindings[inputKey];
  if (!binding) {
    return state.config;
  }
  binding.set(state.config, normalizeInputValue(inputKey, rawValue));
  return state.config;
}

export function getConfigValue(path) {
  return getValueAtPath(state.config, Array.isArray(path) ? path : String(path).split("."));
}

export function getConfigValueByInput(inputKey, config = state.config) {
  return inputBindings[inputKey]?.get(config);
}

export function getInputBinding(inputKey) {
  return inputBindings[inputKey] || null;
}
