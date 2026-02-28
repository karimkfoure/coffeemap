import { configDefaults, defaultCamera, presets, ratioMap } from "../core/constants.js";
import { hexToRgba } from "../core/helpers.js";
import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { setStatus } from "../core/ui-state.js";
import { applyCafeStyles, updateCafeSource } from "./cafe-layers.js";
import {
  applyBaseLabelStyles,
  applyCreativeFeatureAmplification,
  applyComponentColors,
  applyLayerVisibility,
  applyMapCanvasFilter,
  applyStyleConfig,
  applyStyleEntityVisibilityPatch,
  renderStyleEntityEditor
} from "./map-style.js";
import { buildConfigFromDefaults, buildConfigFromPreset, renderInputsFromConfig, replaceConfig, updateConfig } from "./config-state.js";

const creativeProfiles = {
  free: {},
  "poster-ink": {
    labelDensityPreset: "silent",
    accentTarget: "roads",
    accentStrength: 72,
    inkBoost: 158,
    riverBoost: 124,
    featureFocus: "roads",
    featureFocusStrength: 42,
    distortRotate: -2,
    distortSkewX: -4,
    distortSkewY: 0,
    distortScaleX: 102,
    distortScaleY: 98,
    paletteBgColor: "#f4efe3",
    paletteInkColor: "#181a1e",
    paletteAccentColor: "#d35a3a"
  },
  "hydro-bloom": {
    labelDensityPreset: "balanced",
    accentTarget: "water",
    accentStrength: 82,
    inkBoost: 118,
    riverBoost: 248,
    featureFocus: "water",
    featureFocusStrength: 56,
    distortRotate: 1,
    distortSkewX: 3,
    distortSkewY: -2,
    distortScaleX: 104,
    distortScaleY: 96,
    paletteBgColor: "#e8efe9",
    paletteInkColor: "#1c2a33",
    paletteAccentColor: "#2185c5"
  },
  "warped-zine": {
    labelDensityPreset: "silent",
    accentTarget: "boundaries",
    accentStrength: 66,
    inkBoost: 170,
    riverBoost: 168,
    featureFocus: "boundaries",
    featureFocusStrength: 38,
    distortRotate: -7,
    distortSkewX: 15,
    distortSkewY: -8,
    distortScaleX: 118,
    distortScaleY: 86,
    paletteBgColor: "#f3ede4",
    paletteInkColor: "#111318",
    paletteAccentColor: "#e14a39"
  },
  "neon-rave": {
    labelDensityPreset: "dense",
    accentTarget: "roads",
    accentStrength: 88,
    inkBoost: 184,
    riverBoost: 178,
    featureFocus: "roads",
    featureFocusStrength: 55,
    distortRotate: 3,
    distortSkewX: 8,
    distortSkewY: 5,
    distortScaleX: 106,
    distortScaleY: 106,
    paletteBgColor: "#0b1020",
    paletteInkColor: "#d7e5ff",
    paletteAccentColor: "#ff5fd4"
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseHexColor(hex) {
  const clean = String(hex || "")
    .trim()
    .replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) {
    return { r: 0, g: 0, b: 0 };
  }
  const parsed = Number.parseInt(clean, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function toHexColor(r, g, b) {
  const asHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${asHex(r)}${asHex(g)}${asHex(b)}`;
}

function mixHexColor(colorA, colorB, ratio = 0.5) {
  const safeRatio = clamp(Number(ratio), 0, 1);
  const a = parseHexColor(colorA);
  const b = parseHexColor(colorB);
  return toHexColor(
    a.r * (1 - safeRatio) + b.r * safeRatio,
    a.g * (1 - safeRatio) + b.g * safeRatio,
    a.b * (1 - safeRatio) + b.b * safeRatio
  );
}

function rebuildConfig(nextConfig) {
  replaceConfig(nextConfig);
  renderInputsFromConfig(state.config);
}

function patchConfig(sectionName, patch) {
  updateConfig(sectionName, {
    ...state.config[sectionName],
    ...patch
  });
}

function currentCreative() {
  return state.config.creative;
}

export function applyLabelDensityPreset() {
  const preset = currentCreative().labelDensityPreset || "balanced";

  if (preset === "silent") {
    patchConfig("layerVisibility", {
      showRoadLabels: false,
      showPlaceLabels: true,
      showPoiLabels: false,
      showWaterLabels: false
    });
    patchConfig("baseLabelStyles", {
      baseLabelOpacity: 72,
      baseLabelSizeScale: 84
    });
  } else if (preset === "dense") {
    patchConfig("layerVisibility", {
      showRoadLabels: true,
      showPlaceLabels: true,
      showPoiLabels: true,
      showWaterLabels: true
    });
    patchConfig("baseLabelStyles", {
      baseLabelOpacity: 92,
      baseLabelSizeScale: 104
    });
  } else {
    patchConfig("layerVisibility", {
      showRoadLabels: false,
      showPlaceLabels: true,
      showPoiLabels: false,
      showWaterLabels: false
    });
    patchConfig("baseLabelStyles", {
      baseLabelOpacity: 82,
      baseLabelSizeScale: 92
    });
  }
}

export function applyCreativePalette() {
  const creative = currentCreative();
  const componentStyles = state.config.componentStyles;
  const bg = creative.paletteBgColor || componentStyles.bgColor;
  const ink = creative.paletteInkColor || componentStyles.roadMajorColor;
  const accent = creative.paletteAccentColor || componentStyles.waterColor;
  const accentTarget = creative.accentTarget || "water";
  const accentStrength = clamp(Number(creative.accentStrength || 0) / 100, 0, 1);
  const accentMixStrong = 0.35 + accentStrength * 0.65;
  const accentMixSoft = 0.18 + accentStrength * 0.38;

  const nextComponentStyles = {
    ...componentStyles,
    bgColor: bg,
    landuseColor: mixHexColor(bg, ink, 0.2),
    buildingColor: mixHexColor(bg, ink, 0.28),
    boundaryColor: mixHexColor(ink, bg, 0.25),
    roadMinorColor: mixHexColor(bg, ink, 0.16),
    roadMajorColor: mixHexColor(ink, bg, 0.14),
    waterColor: mixHexColor(bg, ink, 0.32),
    parkColor: mixHexColor(bg, ink, 0.26)
  };

  if (accentTarget === "roads") {
    nextComponentStyles.roadMajorColor = mixHexColor(nextComponentStyles.roadMajorColor, accent, accentMixStrong);
    nextComponentStyles.roadMinorColor = mixHexColor(nextComponentStyles.roadMinorColor, accent, accentMixSoft);
  } else if (accentTarget === "water") {
    nextComponentStyles.waterColor = mixHexColor(nextComponentStyles.waterColor, accent, accentMixStrong);
  } else if (accentTarget === "parks") {
    nextComponentStyles.parkColor = mixHexColor(nextComponentStyles.parkColor, accent, accentMixStrong);
  } else if (accentTarget === "boundaries") {
    nextComponentStyles.boundaryColor = mixHexColor(nextComponentStyles.boundaryColor, accent, accentMixStrong);
  }

  updateConfig("componentStyles", nextComponentStyles);
}

export function applyCreativeDistortion() {
  const creative = currentCreative();

  document.documentElement.style.setProperty("--map-art-rotate", `${Number(creative.distortRotate) || 0}deg`);
  document.documentElement.style.setProperty("--map-art-skew-x", `${Number(creative.distortSkewX) || 0}deg`);
  document.documentElement.style.setProperty("--map-art-skew-y", `${Number(creative.distortSkewY) || 0}deg`);
  document.documentElement.style.setProperty("--map-art-scale-x", String((Number(creative.distortScaleX) || 100) / 100));
  document.documentElement.style.setProperty("--map-art-scale-y", String((Number(creative.distortScaleY) || 100) / 100));
}

export function applyCreativeToneControls() {
  applyLabelDensityPreset();
  applyCreativePalette();
  renderInputsFromConfig(state.config);
  applyLayerVisibility();
  applyComponentColors();
  applyBaseLabelStyles();
  applyCreativeFeatureAmplification();
}

export function applyCreativeFeatureControls() {
  applyCreativeFeatureAmplification();
}

export function applyCreativeControls() {
  if (state.styleReady) {
    applyCreativeToneControls();
  }
  applyCreativeDistortion();
}

export function applyCreativeProfile(profileName) {
  const profile = creativeProfiles[profileName];
  if (!profile) {
    return;
  }

  if (profileName === "free") {
    updateConfig("creative", {
      ...state.config.creative,
      creativeProfileSelect: "free"
    });
    renderInputsFromConfig(state.config);
    setStatus("Perfil creativo: manual.");
    return;
  }

  updateConfig("creative", {
    ...state.config.creative,
    creativeProfileSelect: profileName,
    ...profile
  });
  renderInputsFromConfig(state.config);
  applyCreativeControls();
  setStatus(`Perfil creativo aplicado: ${profileName}.`);
}

export function resetCreativeControls() {
  updateConfig("creative", buildConfigFromDefaults().creative);
  renderInputsFromConfig(state.config);
  applyCreativeControls();
  setStatus("Controles creativos restablecidos.");
}

export function applyAtmosphereStyles() {
  const atmosphere = state.config.atmosphere;
  document.documentElement.style.setProperty("--tint-color", atmosphere.tintColor);
  document.documentElement.style.setProperty("--tint-opacity", String(Number(atmosphere.tintOpacity) / 100));
  document.documentElement.style.setProperty("--vignette-opacity", String(Number(atmosphere.vignetteOpacity) / 100));
  document.documentElement.style.setProperty("--grain-opacity", String(Number(atmosphere.grainOpacity) / 100));
  document.documentElement.style.setProperty("--frame-color", atmosphere.frameColor);
  document.documentElement.style.setProperty("--frame-width", `${atmosphere.frameWidth}px`);
  document.documentElement.style.setProperty("--frame-radius", `${atmosphere.frameRadius}px`);
  document.documentElement.style.setProperty("--frame-shadow", `${atmosphere.frameShadow}px`);
}

export function applyPosterStyles() {
  const poster = state.config.poster;
  inputs.posterOverlay.classList.toggle("is-visible", poster.showPoster);
  inputs.posterTitleNode.textContent = poster.posterTitle.trim() || "Bike & Coffee Club";
  inputs.posterSubtitleNode.textContent = poster.posterSubtitle.trim();
  inputs.posterOverlay.setAttribute("data-position", poster.posterPosition);

  document.documentElement.style.setProperty("--poster-color", poster.posterColor);
  document.documentElement.style.setProperty("--poster-size", `${poster.posterSize}px`);
  document.documentElement.style.setProperty("--poster-subtitle-size", `${poster.posterSubtitleSize}px`);
  document.documentElement.style.setProperty("--poster-padding", `${poster.posterPadding}px`);
  document.documentElement.style.setProperty("--poster-bg", hexToRgba(poster.posterBgColor, Number(poster.posterBgOpacity) / 100));
}

export function applyCanvasLayout() {
  const canvas = state.config.canvas;
  const padding = Number(canvas.canvasPadding);
  document.documentElement.style.setProperty("--canvas-padding", `${padding}px`);

  const ratio = ratioMap[canvas.canvasRatio];
  if (!ratio) {
    inputs.mapFrame.style.width = "100%";
    inputs.mapFrame.style.height = "100%";
    state.map?.resize();
    return;
  }

  const bounds = inputs.mapWrap.getBoundingClientRect();
  const availableWidth = Math.max(bounds.width - padding * 2, 100);
  const availableHeight = Math.max(bounds.height - padding * 2, 100);

  let width = availableWidth;
  let height = width / ratio;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * ratio;
  }

  inputs.mapFrame.style.width = `${Math.floor(width)}px`;
  inputs.mapFrame.style.height = `${Math.floor(height)}px`;
  state.map?.resize();
}

export function applyManualView() {
  if (!state.mapReady) {
    return;
  }

  const { center, zoom, pitch, bearing } = state.config.camera;
  const [lng, lat] = center;
  if (![lat, lng, zoom].every(Number.isFinite)) {
    setStatus("Lat/Lng/Zoom invalidos.");
    return;
  }

  state.map.jumpTo({
    center: [lng, lat],
    zoom,
    pitch,
    bearing
  });
}

export function resetCamera() {
  updateConfig("camera", {
    center: [...defaultCamera.center],
    zoom: defaultCamera.zoom,
    pitch: defaultCamera.pitch,
    bearing: defaultCamera.bearing
  });
  renderInputsFromConfig(state.config);
  applyManualView();
}

export function applyAllStyleControls() {
  applyStyleConfig();
  applyMapCanvasFilter();
  applyCreativeFeatureAmplification();
  applyCreativeDistortion();
  applyAtmosphereStyles();
  applyPosterStyles();
  applyCanvasLayout();
  applyCafeStyles();
  applyStyleEntityVisibilityPatch(state.config.styleEntityVisibility);
}

export function applyPreset(presetName, switchBasemap) {
  const preset = presets[presetName];
  if (!preset || !state.styleSnapshot) {
    return;
  }

  if (preset.basemapSelect && preset.basemapSelect !== state.currentBasemap) {
    switchBasemap(preset.basemapSelect, { mode: "preset", presetName });
    return;
  }

  rebuildConfig(buildConfigFromPreset(preset, state.styleSnapshot));
  applyAllStyleControls();
  renderStyleEntityEditor();
  updateCafeSource(false);
  setStatus(`Preset aplicado: ${presetName}.`);
}

export function resetGlobalFilters() {
  patchConfig("atmosphere", {
    mapBrightness: configDefaults.atmosphere.mapBrightness,
    mapContrast: configDefaults.atmosphere.mapContrast,
    mapSaturation: configDefaults.atmosphere.mapSaturation,
    mapGrayscale: configDefaults.atmosphere.mapGrayscale,
    mapHue: configDefaults.atmosphere.mapHue
  });
  renderInputsFromConfig(state.config);
  applyMapCanvasFilter();
}

export function buildPresetConfig(presetName) {
  const preset = presets[presetName];
  if (!preset || !state.styleSnapshot) {
    return null;
  }
  return buildConfigFromPreset(preset, state.styleSnapshot);
}
