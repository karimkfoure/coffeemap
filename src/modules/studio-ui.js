import { defaultCamera, presets, ratioMap } from "../core/constants.js";
import { hexToRgba } from "../core/helpers.js";
import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { setInputValue, setStatus } from "../core/ui-state.js";
import { applyCafeStyles, updateCafeSource } from "./cafe-layers.js";
import {
  applyBaseLabelStyles,
  applyCreativeFeatureAmplification,
  applyComponentColors,
  applyLayerVisibility,
  applyMapCanvasFilter
} from "./map-style.js";

const globalFilterInputKeys = ["mapBrightness", "mapContrast", "mapSaturation", "mapGrayscale", "mapHue"];
const componentStyleInputKeys = [
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
];
const baseLabelInputKeys = [
  "baseLabelColor",
  "baseLabelOpacity",
  "baseLabelHaloColor",
  "baseLabelHaloWidth",
  "baseLabelSizeScale",
  "baseLabelTransform"
];
const atmosphereInputKeys = [
  "tintColor",
  "tintOpacity",
  "vignetteOpacity",
  "grainOpacity",
  "frameColor",
  "frameWidth",
  "frameRadius",
  "frameShadow"
];
const creativeInputKeys = [
  "creativeProfileSelect",
  "labelDensityPreset",
  "accentTarget",
  "accentStrength",
  "inkBoost",
  "riverBoost",
  "featureFocus",
  "featureFocusStrength",
  "distortRotate",
  "distortSkewX",
  "distortSkewY",
  "distortScaleX",
  "distortScaleY",
  "paletteBgColor",
  "paletteInkColor",
  "paletteAccentColor"
];
const presetManagedInputKeys = [
  ...new Set(
    Object.values(presets)
      .flatMap((preset) => Object.keys(preset))
      .filter((key) => Boolean(inputs[key]))
  )
];

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

function resetInputToDefault(element) {
  if (!element) {
    return;
  }

  if (element.tagName === "SELECT") {
    const defaultOption = [...element.options].find((option) => option.defaultSelected) || element.options[0];
    if (defaultOption) {
      element.value = defaultOption.value;
    }
    return;
  }

  if (element.type === "checkbox") {
    element.checked = element.defaultChecked;
    return;
  }

  element.value = element.defaultValue;
}

function resetInputsToDefaults(keys) {
  for (const key of keys) {
    resetInputToDefault(inputs[key]);
  }
}

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

function applyLabelDensityPreset() {
  const preset = inputs.labelDensityPreset?.value || "balanced";

  if (preset === "silent") {
    setInputValue(inputs.showRoadLabels, false);
    setInputValue(inputs.showPlaceLabels, true);
    setInputValue(inputs.showPoiLabels, false);
    setInputValue(inputs.showWaterLabels, false);
    setInputValue(inputs.baseLabelOpacity, 72);
    setInputValue(inputs.baseLabelSizeScale, 84);
  } else if (preset === "dense") {
    setInputValue(inputs.showRoadLabels, true);
    setInputValue(inputs.showPlaceLabels, true);
    setInputValue(inputs.showPoiLabels, true);
    setInputValue(inputs.showWaterLabels, true);
    setInputValue(inputs.baseLabelOpacity, 92);
    setInputValue(inputs.baseLabelSizeScale, 104);
  } else {
    setInputValue(inputs.showRoadLabels, false);
    setInputValue(inputs.showPlaceLabels, true);
    setInputValue(inputs.showPoiLabels, false);
    setInputValue(inputs.showWaterLabels, false);
    setInputValue(inputs.baseLabelOpacity, 82);
    setInputValue(inputs.baseLabelSizeScale, 92);
  }
}

function applyCreativePalette() {
  const bg = inputs.paletteBgColor?.value || inputs.bgColor.value;
  const ink = inputs.paletteInkColor?.value || inputs.roadMajorColor.value;
  const accent = inputs.paletteAccentColor?.value || inputs.waterColor.value;
  const accentTarget = inputs.accentTarget?.value || "water";
  const accentStrength = clamp(Number(inputs.accentStrength?.value || 0) / 100, 0, 1);
  const accentMixStrong = 0.35 + accentStrength * 0.65;
  const accentMixSoft = 0.18 + accentStrength * 0.38;

  setInputValue(inputs.bgColor, bg);
  setInputValue(inputs.landuseColor, mixHexColor(bg, ink, 0.2));
  setInputValue(inputs.buildingColor, mixHexColor(bg, ink, 0.28));
  setInputValue(inputs.boundaryColor, mixHexColor(ink, bg, 0.25));
  setInputValue(inputs.roadMinorColor, mixHexColor(bg, ink, 0.16));
  setInputValue(inputs.roadMajorColor, mixHexColor(ink, bg, 0.14));
  setInputValue(inputs.waterColor, mixHexColor(bg, ink, 0.32));
  setInputValue(inputs.parkColor, mixHexColor(bg, ink, 0.26));

  if (accentTarget === "roads") {
    setInputValue(inputs.roadMajorColor, mixHexColor(inputs.roadMajorColor.value, accent, accentMixStrong));
    setInputValue(inputs.roadMinorColor, mixHexColor(inputs.roadMinorColor.value, accent, accentMixSoft));
  } else if (accentTarget === "water") {
    setInputValue(inputs.waterColor, mixHexColor(inputs.waterColor.value, accent, accentMixStrong));
  } else if (accentTarget === "parks") {
    setInputValue(inputs.parkColor, mixHexColor(inputs.parkColor.value, accent, accentMixStrong));
  } else if (accentTarget === "boundaries") {
    setInputValue(inputs.boundaryColor, mixHexColor(inputs.boundaryColor.value, accent, accentMixStrong));
  }
}

export function applyCreativeDistortion() {
  const rotate = Number(inputs.distortRotate?.value || 0);
  const skewX = Number(inputs.distortSkewX?.value || 0);
  const skewY = Number(inputs.distortSkewY?.value || 0);
  const scaleX = Number(inputs.distortScaleX?.value || 100) / 100;
  const scaleY = Number(inputs.distortScaleY?.value || 100) / 100;

  document.documentElement.style.setProperty("--map-art-rotate", `${rotate}deg`);
  document.documentElement.style.setProperty("--map-art-skew-x", `${skewX}deg`);
  document.documentElement.style.setProperty("--map-art-skew-y", `${skewY}deg`);
  document.documentElement.style.setProperty("--map-art-scale-x", String(scaleX));
  document.documentElement.style.setProperty("--map-art-scale-y", String(scaleY));
}

export function applyCreativeControls() {
  if (!state.styleReady) {
    applyCreativeDistortion();
    return;
  }

  state.componentStyleOverridesEnabled = true;
  state.baseLabelStyleOverridesEnabled = true;

  applyLabelDensityPreset();
  applyCreativePalette();
  applyLayerVisibility();
  applyComponentColors();
  applyBaseLabelStyles();
  applyCreativeFeatureAmplification();
  applyCreativeDistortion();
}

export function applyCreativeProfile(profileName) {
  const profile = creativeProfiles[profileName];
  if (!profile) {
    return;
  }

  if (profileName === "free") {
    setStatus("Perfil creativo: manual.");
    return;
  }

  for (const [key, value] of Object.entries(profile)) {
    if (inputs[key]) {
      setInputValue(inputs[key], value);
    }
  }

  applyCreativeControls();
  setStatus(`Perfil creativo aplicado: ${profileName}.`);
}

export function resetCreativeControls() {
  resetInputsToDefaults(creativeInputKeys);
  applyCreativeControls();
  setStatus("Controles creativos restablecidos.");
}

export function applyAtmosphereStyles() {
  document.documentElement.style.setProperty("--tint-color", inputs.tintColor.value);
  document.documentElement.style.setProperty("--tint-opacity", String(Number(inputs.tintOpacity.value) / 100));
  document.documentElement.style.setProperty("--vignette-opacity", String(Number(inputs.vignetteOpacity.value) / 100));
  document.documentElement.style.setProperty("--grain-opacity", String(Number(inputs.grainOpacity.value) / 100));

  document.documentElement.style.setProperty("--frame-color", inputs.frameColor.value);
  document.documentElement.style.setProperty("--frame-width", `${inputs.frameWidth.value}px`);
  document.documentElement.style.setProperty("--frame-radius", `${inputs.frameRadius.value}px`);
  document.documentElement.style.setProperty("--frame-shadow", `${inputs.frameShadow.value}px`);
}

export function applyPosterStyles() {
  const showPoster = inputs.showPoster.checked;
  inputs.posterOverlay.classList.toggle("is-visible", showPoster);

  inputs.posterTitleNode.textContent = inputs.posterTitle.value.trim() || "Bike & Coffee Club";
  inputs.posterSubtitleNode.textContent = inputs.posterSubtitle.value.trim();
  inputs.posterOverlay.setAttribute("data-position", inputs.posterPosition.value);

  document.documentElement.style.setProperty("--poster-color", inputs.posterColor.value);
  document.documentElement.style.setProperty("--poster-size", `${inputs.posterSize.value}px`);
  document.documentElement.style.setProperty("--poster-subtitle-size", `${inputs.posterSubtitleSize.value}px`);
  document.documentElement.style.setProperty("--poster-padding", `${inputs.posterPadding.value}px`);

  const bg = hexToRgba(inputs.posterBgColor.value, Number(inputs.posterBgOpacity.value) / 100);
  document.documentElement.style.setProperty("--poster-bg", bg);
}

export function applyCanvasLayout() {
  const padding = Number(inputs.canvasPadding.value);
  document.documentElement.style.setProperty("--canvas-padding", `${padding}px`);

  const ratio = ratioMap[inputs.canvasRatio.value];
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

  const lat = Number(inputs.centerLat.value);
  const lng = Number(inputs.centerLng.value);
  const zoom = Number(inputs.zoomInput.value);
  const pitch = Number(inputs.pitchInput.value);
  const bearing = Number(inputs.bearingInput.value);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) {
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
  state.map.jumpTo({
    center: defaultCamera.center,
    zoom: defaultCamera.zoom,
    pitch: defaultCamera.pitch,
    bearing: defaultCamera.bearing
  });
  inputs.pitchInput.value = "0";
  inputs.bearingInput.value = "0";
}

export function applyAllStyleControls() {
  applyLayerVisibility();
  applyComponentColors();
  applyMapCanvasFilter();
  applyBaseLabelStyles();
  applyCreativeFeatureAmplification();
  applyCreativeDistortion();
  applyAtmosphereStyles();
  applyPosterStyles();
  applyCanvasLayout();
  applyCafeStyles();
}

export function applyPreset(presetName, switchBasemap) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  resetInputsToDefaults(presetManagedInputKeys);
  state.componentStyleOverridesEnabled = true;
  state.baseLabelStyleOverridesEnabled = true;

  for (const [key, value] of Object.entries(preset)) {
    if (inputs[key]) {
      setInputValue(inputs[key], value);
    }
  }

  if (preset.basemapSelect && preset.basemapSelect !== state.currentBasemap) {
    switchBasemap(preset.basemapSelect, { preserveStyleOverrides: true });
  } else {
    applyAllStyleControls();
    updateCafeSource(false);
  }

  setStatus(`Preset aplicado: ${presetName}.`);
}

export function resetGlobalFilters() {
  resetInputsToDefaults(globalFilterInputKeys);
  applyMapCanvasFilter();
}

export function resetStyleConflictsForBasemapSwitch() {
  resetInputsToDefaults(componentStyleInputKeys);
  resetInputsToDefaults(baseLabelInputKeys);
  resetInputsToDefaults(globalFilterInputKeys);
  resetInputsToDefaults(atmosphereInputKeys);
  resetInputsToDefaults(creativeInputKeys);
  state.componentStyleOverridesEnabled = false;
  state.baseLabelStyleOverridesEnabled = false;

  applyMapCanvasFilter();
  applyCreativeDistortion();
  applyAtmosphereStyles();
}
