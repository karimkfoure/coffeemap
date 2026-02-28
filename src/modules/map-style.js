import { inputs } from "../core/inputs.js";
import { configDefaults } from "../core/constants.js";
import { state } from "../core/state.js";
import { cloneValue, hexToRgba, scaleTextSizeValue } from "../core/helpers.js";
import { updateConfig } from "./config-state.js";

const roadLineKeywords = [
  "road",
  "street",
  "highway",
  "motorway",
  "trunk",
  "transport",
  "bridge",
  "tunnel",
  "path",
  "trail",
  "rail"
];

const roadLabelKeywords = [
  "road",
  "street",
  "highway",
  "motorway",
  "trunk",
  "route",
  "shield",
  "transportation_name",
  "transport"
];

const waterLabelKeywords = ["water", "waterway", "water_name", "ocean", "sea", "river", "lake", "canal", "marine"];
const poiLabelKeywords = ["poi", "airport", "aerodrome", "transit", "station", "amenity", "school", "hospital", "shop"];
const placeLabelKeywords = [
  "place",
  "settlement",
  "subnational",
  "country",
  "state",
  "province",
  "city",
  "town",
  "village",
  "neighborhood",
  "neighbourhood",
  "district",
  "region",
  "continent",
  "locality"
];

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isMajorRoadId(id) {
  return /(motorway|trunk|primary|secondary|tertiary|major)/.test(id);
}

function getBaseLabelIds() {
  return [
    ...state.layerGroups.labelsRoad,
    ...state.layerGroups.labelsPlace,
    ...state.layerGroups.labelsPoi,
    ...state.layerGroups.labelsWater
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbaToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

function hslToRgb(h, s, l) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const normalizedSaturation = clamp(s / 100, 0, 1);
  const normalizedLightness = clamp(l / 100, 0, 1);
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const segment = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = normalizedLightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = secondary;
  } else if (segment < 2) {
    red = secondary;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = secondary;
  } else if (segment < 4) {
    green = secondary;
    blue = chroma;
  } else if (segment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  };
}

function parseColorValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(candidate)) {
    if (candidate.length === 4) {
      const [hash, r, g, b] = candidate;
      return {
        hex: `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase(),
        alpha: 1
      };
    }
    return { hex: candidate.toLowerCase(), alpha: 1 };
  }

  const rgbMatch = candidate.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) {
      return null;
    }

    return {
      hex: rgbaToHex(clamp(Math.round(parts[0]), 0, 255), clamp(Math.round(parts[1]), 0, 255), clamp(Math.round(parts[2]), 0, 255)),
      alpha: clamp(parts[3] ?? 1, 0, 1)
    };
  }

  const hslMatch = candidate.match(/^hsla?\(([^)]+)\)$/i);
  if (!hslMatch) {
    return null;
  }

  const parts = hslMatch[1].split(",").map((part) => part.trim());
  if (parts.length < 3) {
    return null;
  }

  const hue = Number(parts[0]);
  const saturation = Number(parts[1].replace("%", ""));
  const lightness = Number(parts[2].replace("%", ""));
  const alpha = parts[3] == null ? 1 : Number(parts[3]);

  if (![hue, saturation, lightness, alpha].every(Number.isFinite)) {
    return null;
  }

  const rgb = hslToRgb(hue, saturation, lightness);
  return {
    hex: rgbaToHex(rgb.r, rgb.g, rgb.b),
    alpha: clamp(alpha, 0, 1)
  };
}

function inferTextTransform(textField) {
  if (Array.isArray(textField) && textField.length > 1) {
    if (textField[0] === "upcase") {
      return "uppercase";
    }
    if (textField[0] === "downcase") {
      return "lowercase";
    }
  }
  return "none";
}

function buildTextFieldTransform(baseTextField, transform) {
  if (!baseTextField || transform === "none") {
    return cloneValue(baseTextField);
  }

  if (baseTextField && typeof baseTextField === "object" && !Array.isArray(baseTextField)) {
    return cloneValue(baseTextField);
  }

  if (Array.isArray(baseTextField) && baseTextField[0] === "format") {
    return cloneValue(baseTextField);
  }

  if (transform === "uppercase") {
    return ["upcase", cloneValue(baseTextField)];
  }
  if (transform === "lowercase") {
    return ["downcase", cloneValue(baseTextField)];
  }
  return cloneValue(baseTextField);
}

const layerToggleBindings = [
  ["showWater", "water"],
  ["showParks", "parks"],
  ["showLanduse", "landuse"],
  ["showRoadsMajor", "roadsMajor"],
  ["showRoadsMinor", "roadsMinor"],
  ["showBuildings", "buildings"],
  ["showBoundaries", "boundaries"],
  ["showRoadLabels", "labelsRoad"],
  ["showPlaceLabels", "labelsPlace"],
  ["showPoiLabels", "labelsPoi"],
  ["showWaterLabels", "labelsWater"]
];

const componentControlBindings = [
  { inputKey: "bgColor", groupKey: "background", kind: "color" },
  { inputKey: "waterColor", groupKey: "water", kind: "color" },
  { inputKey: "waterOpacity", groupKey: "water", kind: "opacity" },
  { inputKey: "parkColor", groupKey: "parks", kind: "color" },
  { inputKey: "parkOpacity", groupKey: "parks", kind: "opacity" },
  { inputKey: "landuseColor", groupKey: "landuse", kind: "color" },
  { inputKey: "landuseOpacity", groupKey: "landuse", kind: "opacity" },
  { inputKey: "roadMajorColor", groupKey: "roadsMajor", kind: "color" },
  { inputKey: "roadMajorOpacity", groupKey: "roadsMajor", kind: "opacity" },
  { inputKey: "roadMinorColor", groupKey: "roadsMinor", kind: "color" },
  { inputKey: "roadMinorOpacity", groupKey: "roadsMinor", kind: "opacity" },
  { inputKey: "buildingColor", groupKey: "buildings", kind: "color" },
  { inputKey: "buildingOpacity", groupKey: "buildings", kind: "opacity" },
  { inputKey: "boundaryColor", groupKey: "boundaries", kind: "color" },
  { inputKey: "boundaryOpacity", groupKey: "boundaries", kind: "opacity" }
];

export function classifyMapLayers() {
  const groups = {
    background: new Set(),
    water: new Set(),
    parks: new Set(),
    landuse: new Set(),
    roadsMajor: new Set(),
    roadsMinor: new Set(),
    buildings: new Set(),
    boundaries: new Set(),
    labelsRoad: new Set(),
    labelsPlace: new Set(),
    labelsPoi: new Set(),
    labelsWater: new Set()
  };

  const style = state.map.getStyle();
  const layers = style?.layers || [];

  for (const layer of layers) {
    if (!layer || layer.id.startsWith("cafes-")) {
      continue;
    }

    const id = layer.id.toLowerCase();
    const type = layer.type;
    const sourceLayer = String(layer["source-layer"] || "").toLowerCase();

    if (type === "background") {
      groups.background.add(layer.id);
      continue;
    }

    const layerTags = `${id} ${sourceLayer}`;
    const isWater = containsAny(layerTags, ["water", "waterway", "ocean", "sea", "river", "lake", "canal"]);
    const isPark =
      id.includes("park") ||
      id.includes("landcover") ||
      id.includes("grass") ||
      id.includes("wood") ||
      sourceLayer === "park";
    const isLanduse = id.includes("landuse") || sourceLayer === "landuse" || sourceLayer === "landcover";
    const isBuilding = id.includes("building") || sourceLayer === "building";
    const isBoundary = id.includes("boundary") || sourceLayer === "boundary";

    const isRoadLike = type === "line" && (containsAny(layerTags, roadLineKeywords) || sourceLayer.includes("transportation"));

    if (isWater && (type === "fill" || type === "line")) {
      groups.water.add(layer.id);
    }

    if (isPark && type === "fill") {
      groups.parks.add(layer.id);
    }

    if (isLanduse && type === "fill") {
      groups.landuse.add(layer.id);
    }

    if (isBuilding && (type === "fill" || type === "line")) {
      groups.buildings.add(layer.id);
    }

    if (isBoundary && type === "line") {
      groups.boundaries.add(layer.id);
    }

    if (isRoadLike) {
      const isMajor = isMajorRoadId(id);
      if (isMajor) {
        groups.roadsMajor.add(layer.id);
      } else {
        groups.roadsMinor.add(layer.id);
      }
    }

    if (type === "symbol") {
      if (containsAny(layerTags, roadLabelKeywords)) {
        groups.labelsRoad.add(layer.id);
      } else if (containsAny(layerTags, waterLabelKeywords)) {
        groups.labelsWater.add(layer.id);
      } else if (containsAny(layerTags, poiLabelKeywords)) {
        groups.labelsPoi.add(layer.id);
      } else if (containsAny(layerTags, placeLabelKeywords) || id.includes("label")) {
        groups.labelsPlace.add(layer.id);
      }
    }
  }

  state.layerGroups = Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, [...value]])
  );
}

export function captureBaseLabelSizes() {
  state.baseLabelSizes.clear();
  state.baseLabelTextFields.clear();
  const ids = getBaseLabelIds();

  for (const id of ids) {
    const textSize = state.map.getLayoutProperty(id, "text-size");
    if (textSize != null) {
      state.baseLabelSizes.set(id, cloneValue(textSize));
    }

    const textField = state.map.getLayoutProperty(id, "text-field");
    if (textField != null) {
      state.baseLabelTextFields.set(id, cloneValue(textField));
    }
  }
}

function saveBasePaint(layerId, property) {
  const value = readPaintProperty(layerId, property);
  if (typeof value === "number" && Number.isFinite(value)) {
    state.baseFeaturePaint.set(`${layerId}:${property}`, value);
    return;
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    state.baseFeaturePaint.set(`${layerId}:${property}`, cloneValue(value));
  }
}

export function captureBaseFeaturePaint() {
  state.baseFeaturePaint.clear();
  const groupsToCapture = [
    "water",
    "parks",
    "landuse",
    "roadsMajor",
    "roadsMinor",
    "buildings",
    "boundaries"
  ];

  for (const groupKey of groupsToCapture) {
    const ids = state.layerGroups[groupKey] || [];
    for (const id of ids) {
      const layer = state.map.getLayer(id);
      if (!layer) {
        continue;
      }

      if (layer.type === "line") {
        saveBasePaint(id, "line-width");
        saveBasePaint(id, "line-opacity");
      }

      if (layer.type === "fill") {
        saveBasePaint(id, "fill-opacity");
      }
    }
  }
}

export function safeSetPaint(id, property, value) {
  try {
    state.map.setPaintProperty(id, property, value);
  } catch {
    // ignore layers without that paint property
  }
}

export function safeSetLayout(id, property, value) {
  try {
    state.map.setLayoutProperty(id, property, value);
  } catch {
    // ignore layers without that layout property
  }
}

export function syncLayerControlAvailability() {
  if (!state.styleReady) {
    return;
  }

  for (const [inputKey, groupKey] of layerToggleBindings) {
    const toggle = inputs[inputKey];
    if (!toggle) {
      continue;
    }
    const hasLayers = (state.layerGroups[groupKey] || []).length > 0;
    toggle.disabled = !hasLayers;
    const container = toggle.closest(".checkbox-row");
    if (container) {
      container.classList.toggle("is-disabled", !hasLayers);
      container.title = hasLayers ? "" : "No disponible para el style activo";
    }
  }
}

export function syncComponentStyleControlAvailability() {
  const availability = state.styleSnapshot?.componentStyleAvailability || {};
  state.styleControlAvailability = state.styleControlAvailability || {};
  state.styleControlAvailability.componentStyles = { ...availability };

  for (const { inputKey } of componentControlBindings) {
    const input = inputs[inputKey];
    const label = document.querySelector(`label[for="${inputKey}"]`);
    if (!input || !label) {
      continue;
    }

    const isAvailable = availability[inputKey] !== false;
    input.disabled = !isAvailable;
    input.hidden = !isAvailable;
    label.hidden = !isAvailable;
    input.title = isAvailable ? "" : "No disponible para el style activo";
    label.title = input.title;
  }
}

function setGroupVisibility(groupKey, isVisible) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    safeSetLayout(id, "visibility", isVisible ? "visible" : "none");
  }
}

export function applyLayerVisibilityPatch(patch = {}) {
  if (!state.styleReady) {
    return;
  }

  const visibility = {
    ...state.config.layerVisibility,
    ...patch
  };

  setGroupVisibility("water", visibility.showWater);
  setGroupVisibility("parks", visibility.showParks);
  setGroupVisibility("landuse", visibility.showLanduse);
  setGroupVisibility("roadsMajor", visibility.showRoadsMajor);
  setGroupVisibility("roadsMinor", visibility.showRoadsMinor);
  setGroupVisibility("buildings", visibility.showBuildings);
  setGroupVisibility("boundaries", visibility.showBoundaries);
  setGroupVisibility("labelsRoad", visibility.showRoadLabels);
  setGroupVisibility("labelsPlace", visibility.showPlaceLabels);
  setGroupVisibility("labelsPoi", visibility.showPoiLabels);
  setGroupVisibility("labelsWater", visibility.showWaterLabels);
}

export function applyLayerVisibility() {
  applyLayerVisibilityPatch(state.config.layerVisibility);
}

export function applyComponentStylePatch(patch = {}) {
  if (!state.styleReady) {
    return;
  }

  const componentStyles = {
    ...state.config.componentStyles,
    ...patch
  };

  for (const id of state.layerGroups.background) {
    safeSetPaint(id, "background-color", componentStyles.bgColor);
  }

  for (const id of state.layerGroups.water) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }

    if (layer.type === "fill") {
      safeSetPaint(id, "fill-color", componentStyles.waterColor);
      safeSetPaint(id, "fill-opacity", Number(componentStyles.waterOpacity) / 100);
    }

    if (layer.type === "line") {
      safeSetPaint(id, "line-color", componentStyles.waterColor);
      safeSetPaint(id, "line-opacity", Number(componentStyles.waterOpacity) / 100);
    }
  }

  for (const id of state.layerGroups.parks) {
    safeSetPaint(id, "fill-color", componentStyles.parkColor);
    safeSetPaint(id, "fill-opacity", Number(componentStyles.parkOpacity) / 100);
  }

  for (const id of state.layerGroups.landuse) {
    safeSetPaint(id, "fill-color", componentStyles.landuseColor);
    safeSetPaint(id, "fill-opacity", Number(componentStyles.landuseOpacity) / 100);
  }

  for (const id of state.layerGroups.roadsMajor) {
    safeSetPaint(id, "line-color", componentStyles.roadMajorColor);
    safeSetPaint(id, "line-opacity", Number(componentStyles.roadMajorOpacity) / 100);
  }

  for (const id of state.layerGroups.roadsMinor) {
    safeSetPaint(id, "line-color", componentStyles.roadMinorColor);
    safeSetPaint(id, "line-opacity", Number(componentStyles.roadMinorOpacity) / 100);
  }

  for (const id of state.layerGroups.buildings) {
    safeSetPaint(id, "fill-color", componentStyles.buildingColor);
    safeSetPaint(id, "fill-opacity", Number(componentStyles.buildingOpacity) / 100);
    safeSetPaint(id, "line-color", componentStyles.buildingColor);
    safeSetPaint(id, "line-opacity", Number(componentStyles.buildingOpacity) / 100);
  }

  for (const id of state.layerGroups.boundaries) {
    safeSetPaint(id, "line-color", componentStyles.boundaryColor);
    safeSetPaint(id, "line-opacity", Number(componentStyles.boundaryOpacity) / 100);
  }
}

export function applyComponentColors() {
  applyComponentStylePatch(state.config.componentStyles);
}

function applyComponentColorControl(controlKey) {
  const componentStyles = state.config.componentStyles;

  switch (controlKey) {
    case "bgColor":
      for (const id of state.layerGroups.background) {
        safeSetPaint(id, "background-color", componentStyles.bgColor);
      }
      break;
    case "waterColor":
      for (const id of state.layerGroups.water) {
        const layer = state.map.getLayer(id);
        if (!layer) {
          continue;
        }

        if (layer.type === "fill") {
          safeSetPaint(id, "fill-color", componentStyles.waterColor);
        }
        if (layer.type === "line") {
          safeSetPaint(id, "line-color", componentStyles.waterColor);
        }
      }
      break;
    case "waterOpacity":
      for (const id of state.layerGroups.water) {
        const layer = state.map.getLayer(id);
        if (!layer) {
          continue;
        }
        if (layer.type === "fill") {
          safeSetPaint(id, "fill-opacity", Number(componentStyles.waterOpacity) / 100);
        }
        if (layer.type === "line") {
          safeSetPaint(id, "line-opacity", Number(componentStyles.waterOpacity) / 100);
        }
      }
      break;
    case "parkColor":
      for (const id of state.layerGroups.parks) {
        safeSetPaint(id, "fill-color", componentStyles.parkColor);
      }
      break;
    case "parkOpacity":
      for (const id of state.layerGroups.parks) {
        safeSetPaint(id, "fill-opacity", Number(componentStyles.parkOpacity) / 100);
      }
      break;
    case "landuseColor":
      for (const id of state.layerGroups.landuse) {
        safeSetPaint(id, "fill-color", componentStyles.landuseColor);
      }
      break;
    case "landuseOpacity":
      for (const id of state.layerGroups.landuse) {
        safeSetPaint(id, "fill-opacity", Number(componentStyles.landuseOpacity) / 100);
      }
      break;
    case "roadMajorColor":
      for (const id of state.layerGroups.roadsMajor) {
        safeSetPaint(id, "line-color", componentStyles.roadMajorColor);
      }
      break;
    case "roadMajorOpacity":
      for (const id of state.layerGroups.roadsMajor) {
        safeSetPaint(id, "line-opacity", Number(componentStyles.roadMajorOpacity) / 100);
      }
      break;
    case "roadMinorColor":
      for (const id of state.layerGroups.roadsMinor) {
        safeSetPaint(id, "line-color", componentStyles.roadMinorColor);
      }
      break;
    case "roadMinorOpacity":
      for (const id of state.layerGroups.roadsMinor) {
        safeSetPaint(id, "line-opacity", Number(componentStyles.roadMinorOpacity) / 100);
      }
      break;
    case "buildingColor":
      for (const id of state.layerGroups.buildings) {
        safeSetPaint(id, "fill-color", componentStyles.buildingColor);
        safeSetPaint(id, "line-color", componentStyles.buildingColor);
      }
      break;
    case "buildingOpacity":
      for (const id of state.layerGroups.buildings) {
        safeSetPaint(id, "fill-opacity", Number(componentStyles.buildingOpacity) / 100);
        safeSetPaint(id, "line-opacity", Number(componentStyles.buildingOpacity) / 100);
      }
      break;
    case "boundaryColor":
      for (const id of state.layerGroups.boundaries) {
        safeSetPaint(id, "line-color", componentStyles.boundaryColor);
      }
      break;
    case "boundaryOpacity":
      for (const id of state.layerGroups.boundaries) {
        safeSetPaint(id, "line-opacity", Number(componentStyles.boundaryOpacity) / 100);
      }
      break;
    default:
      applyComponentColors();
  }
}

export function applySingleComponentStyle(controlKey) {
  if (!state.styleReady) {
    return;
  }
  applyComponentColorControl(controlKey);
}

export function applyMapCanvasFilter() {
  const atmosphere = state.config.atmosphere;
  const filter = [
    `brightness(${atmosphere.mapBrightness}%)`,
    `contrast(${atmosphere.mapContrast}%)`,
    `saturate(${atmosphere.mapSaturation}%)`,
    `grayscale(${atmosphere.mapGrayscale}%)`,
    `hue-rotate(${atmosphere.mapHue}deg)`
  ].join(" ");

  document.documentElement.style.setProperty("--map-filter", filter);
}

export function applyBaseLabelStylePatch(patch = {}) {
  if (!state.styleReady) {
    return;
  }

  const ids = getBaseLabelIds();
  const baseLabelStyles = {
    ...state.config.baseLabelStyles,
    ...patch
  };

  const labelOpacity = clamp(Number(baseLabelStyles.baseLabelOpacity) / 100, 0, 1);
  const textColor = hexToRgba(baseLabelStyles.baseLabelColor, labelOpacity);
  const haloWidth = Number(baseLabelStyles.baseLabelHaloWidth);
  const scale = Number(baseLabelStyles.baseLabelSizeScale) / 100;
  const transform = baseLabelStyles.baseLabelTransform;

  for (const id of ids) {
    safeSetPaint(id, "text-color", textColor);
    safeSetPaint(id, "text-opacity", 1);
    safeSetPaint(id, "text-halo-color", baseLabelStyles.baseLabelHaloColor);
    safeSetPaint(id, "text-halo-width", haloWidth);

    if (state.baseLabelSizes.has(id)) {
      const base = cloneValue(state.baseLabelSizes.get(id));
      const scaled = scaleTextSizeValue(base, scale);
      if (scaled != null) {
        safeSetLayout(id, "text-size", scaled);
      }
    }

    if (state.baseLabelTextFields.has(id)) {
      const baseTextField = cloneValue(state.baseLabelTextFields.get(id));
      const transformed = buildTextFieldTransform(baseTextField, transform);
      safeSetLayout(id, "text-field", transformed);
    }
  }
}

export function applyBaseLabelStyles() {
  applyBaseLabelStylePatch(state.config.baseLabelStyles);
}

function applyBaseLabelControl(controlKey) {
  const ids = getBaseLabelIds();
  const baseLabelStyles = state.config.baseLabelStyles;
  const scale = Number(baseLabelStyles.baseLabelSizeScale) / 100;

  for (const id of ids) {
    if (controlKey === "baseLabelColor" || controlKey === "baseLabelOpacity") {
      const opacity = clamp(Number(baseLabelStyles.baseLabelOpacity) / 100, 0, 1);
      safeSetPaint(id, "text-color", hexToRgba(baseLabelStyles.baseLabelColor, opacity));
      safeSetPaint(id, "text-opacity", 1);
    } else if (controlKey === "baseLabelHaloColor") {
      safeSetPaint(id, "text-halo-color", baseLabelStyles.baseLabelHaloColor);
    } else if (controlKey === "baseLabelHaloWidth") {
      safeSetPaint(id, "text-halo-width", Number(baseLabelStyles.baseLabelHaloWidth));
    } else if (controlKey === "baseLabelTransform") {
      if (!state.baseLabelTextFields.has(id)) {
        continue;
      }
      const baseTextField = cloneValue(state.baseLabelTextFields.get(id));
      const transformed = buildTextFieldTransform(baseTextField, baseLabelStyles.baseLabelTransform);
      safeSetLayout(id, "text-field", transformed);
    } else if (controlKey === "baseLabelSizeScale" && state.baseLabelSizes.has(id)) {
      const base = cloneValue(state.baseLabelSizes.get(id));
      const scaled = scaleTextSizeValue(base, scale);
      if (scaled != null) {
        safeSetLayout(id, "text-size", scaled);
      }
    }
  }
}

export function applySingleBaseLabelStyle(controlKey) {
  if (!state.styleReady) {
    return;
  }
  applyBaseLabelControl(controlKey);
}

function applyExpressionBounds(expression, minValue = null, maxValue = null) {
  let next = expression;
  if (minValue != null) {
    next = ["max", minValue, next];
  }
  if (maxValue != null) {
    next = ["min", maxValue, next];
  }
  return next;
}

function scaleOutputValue(value, scale, minValue = null, maxValue = null) {
  if (typeof value === "number") {
    return clamp(value * scale, minValue ?? Number.NEGATIVE_INFINITY, maxValue ?? Number.POSITIVE_INFINITY);
  }
  return applyExpressionBounds(["*", cloneValue(value), scale], minValue, maxValue);
}

function scalePaintValue(baseValue, scale, minValue = null, maxValue = null) {
  if (baseValue == null) {
    return null;
  }
  if (scale === 1) {
    return cloneValue(baseValue);
  }

  if (typeof baseValue === "number") {
    return clamp(baseValue * scale, minValue ?? Number.NEGATIVE_INFINITY, maxValue ?? Number.POSITIVE_INFINITY);
  }

  if (Array.isArray(baseValue)) {
    const op = baseValue[0];

    if (op === "step") {
      const scaled = cloneValue(baseValue);
      if (scaled.length > 2) {
        scaled[2] = scaleOutputValue(scaled[2], scale, minValue, maxValue);
      }
      for (let i = 4; i < scaled.length; i += 2) {
        scaled[i] = scaleOutputValue(scaled[i], scale, minValue, maxValue);
      }
      return scaled;
    }

    if (op === "interpolate") {
      const scaled = cloneValue(baseValue);
      for (let i = 4; i < scaled.length; i += 2) {
        scaled[i] = scaleOutputValue(scaled[i], scale, minValue, maxValue);
      }
      return scaled;
    }

    return applyExpressionBounds(["*", cloneValue(baseValue), scale], minValue, maxValue);
  }

  if (baseValue && typeof baseValue === "object" && Array.isArray(baseValue.stops)) {
    const scaled = cloneValue(baseValue);
    scaled.stops = scaled.stops.map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) {
        return pair;
      }
      return [pair[0], scaleOutputValue(pair[1], scale, minValue, maxValue)];
    });
    return scaled;
  }

  return null;
}

function applyGroupLineWidth(groupKey, widthScale = 1) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer || layer.type !== "line") {
      continue;
    }
    const base = state.baseFeaturePaint.get(`${id}:line-width`);
    const scaled = scalePaintValue(base, widthScale);
    if (scaled != null) {
      safeSetPaint(id, "line-width", scaled);
    }
  }
}

function applyGroupOpacity(groupKey, opacityScale = 1) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }

    if (layer.type === "line") {
      const base = state.baseFeaturePaint.get(`${id}:line-opacity`);
      const scaled = scalePaintValue(base, opacityScale, 0, 1);
      if (scaled != null) {
        safeSetPaint(id, "line-opacity", scaled);
      }
    }

    if (layer.type === "fill") {
      const base = state.baseFeaturePaint.get(`${id}:fill-opacity`);
      const scaled = scalePaintValue(base, opacityScale, 0, 1);
      if (scaled != null) {
        safeSetPaint(id, "fill-opacity", scaled);
      }
    }
  }
}

function focusKeyToGroupKey(focusKey) {
  if (focusKey === "water") {
    return "water";
  }
  if (focusKey === "roads") {
    return "roadsMajor";
  }
  if (focusKey === "parks") {
    return "parks";
  }
  if (focusKey === "buildings") {
    return "buildings";
  }
  if (focusKey === "boundaries") {
    return "boundaries";
  }
  return null;
}

export function applyCreativeFeatureAmplification() {
  if (!state.styleReady) {
    return;
  }
  const creative = state.config.creative;
  const inkBoost = Number(creative.inkBoost) / 100;
  const riverBoost = Number(creative.riverBoost) / 100;
  const focusKey = creative.featureFocus;
  const focusStrength = Number(creative.featureFocusStrength) / 100;
  const focusGroup = focusKeyToGroupKey(focusKey);

  const groups = ["water", "parks", "landuse", "roadsMajor", "roadsMinor", "buildings", "boundaries"];
  for (const groupKey of groups) {
    let widthScale = 1;
    let opacityScale = 1;

    if (groupKey === "roadsMajor") {
      widthScale *= inkBoost;
    } else if (groupKey === "roadsMinor") {
      widthScale *= inkBoost;
    } else if (groupKey === "boundaries") {
      widthScale *= inkBoost;
    } else if (groupKey === "water") {
      widthScale *= inkBoost * riverBoost;
    }

    if (focusGroup && focusStrength > 0) {
      if (groupKey === focusGroup || (focusGroup === "roadsMajor" && groupKey === "roadsMinor")) {
        widthScale *= 1 + focusStrength * 1.25;
        opacityScale *= 1;
      } else {
        opacityScale *= clamp(1 - focusStrength * 0.72, 0.18, 1);
      }
    }

    applyGroupLineWidth(groupKey, widthScale);
    applyGroupOpacity(groupKey, opacityScale);
  }
}

function isGroupVisible(groupKey) {
  const ids = state.layerGroups[groupKey] || [];
  if (!ids.length) {
    return configDefaults.layerVisibility[layerToggleBindings.find(([, key]) => key === groupKey)?.[0]] ?? true;
  }

  return ids.some((id) => {
    try {
      const value = state.map.getLayoutProperty(id, "visibility");
      return value !== "none";
    } catch {
      return true;
    }
  });
}

function findFirstGroupColor(groupKey, fallback) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }
    const props = paintPropsForLayerType(layer.type);
    for (const property of props.color) {
      const colorInfo = parseColorValue(readPaintProperty(id, property));
      if (colorInfo?.hex) {
        return colorInfo.hex;
      }
    }
  }
  return fallback;
}

function hasReadableGroupColor(groupKey) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }
    const props = paintPropsForLayerType(layer.type);
    for (const property of props.color) {
      const colorInfo = parseColorValue(readPaintProperty(id, property));
      if (colorInfo?.hex) {
        return true;
      }
    }
  }
  return false;
}

function findFirstGroupOpacity(groupKey, fallback) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }
    const props = paintPropsForLayerType(layer.type);
    for (const property of props.opacity) {
      const opacity = extractOpacityPercent(readPaintProperty(id, property));
      if (opacity != null) {
        return opacity;
      }
    }
  }
  return fallback;
}

function hasReadableGroupOpacity(groupKey) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }
    const props = paintPropsForLayerType(layer.type);
    for (const property of props.opacity) {
      const opacity = extractOpacityPercent(readPaintProperty(id, property));
      if (opacity != null) {
        return true;
      }
    }
  }
  return false;
}

function captureLayerVisibilitySnapshot() {
  return {
    showWater: isGroupVisible("water"),
    showParks: isGroupVisible("parks"),
    showLanduse: isGroupVisible("landuse"),
    showRoadsMajor: isGroupVisible("roadsMajor"),
    showRoadsMinor: isGroupVisible("roadsMinor"),
    showBuildings: isGroupVisible("buildings"),
    showBoundaries: isGroupVisible("boundaries"),
    showRoadLabels: isGroupVisible("labelsRoad"),
    showPlaceLabels: isGroupVisible("labelsPlace"),
    showPoiLabels: isGroupVisible("labelsPoi"),
    showWaterLabels: isGroupVisible("labelsWater")
  };
}

export function captureComponentStyleAvailability() {
  return Object.fromEntries(
    componentControlBindings.map(({ inputKey, groupKey, kind }) => [
      inputKey,
      kind === "color" ? hasReadableGroupColor(groupKey) : hasReadableGroupOpacity(groupKey)
    ])
  );
}

export function captureComponentStyleSnapshot() {
  return {
    bgColor: findFirstGroupColor("background", configDefaults.componentStyles.bgColor),
    waterColor: findFirstGroupColor("water", configDefaults.componentStyles.waterColor),
    waterOpacity: findFirstGroupOpacity("water", configDefaults.componentStyles.waterOpacity),
    parkColor: findFirstGroupColor("parks", configDefaults.componentStyles.parkColor),
    parkOpacity: findFirstGroupOpacity("parks", configDefaults.componentStyles.parkOpacity),
    landuseColor: findFirstGroupColor("landuse", configDefaults.componentStyles.landuseColor),
    landuseOpacity: findFirstGroupOpacity("landuse", configDefaults.componentStyles.landuseOpacity),
    roadMajorColor: findFirstGroupColor("roadsMajor", configDefaults.componentStyles.roadMajorColor),
    roadMajorOpacity: findFirstGroupOpacity("roadsMajor", configDefaults.componentStyles.roadMajorOpacity),
    roadMinorColor: findFirstGroupColor("roadsMinor", configDefaults.componentStyles.roadMinorColor),
    roadMinorOpacity: findFirstGroupOpacity("roadsMinor", configDefaults.componentStyles.roadMinorOpacity),
    buildingColor: findFirstGroupColor("buildings", configDefaults.componentStyles.buildingColor),
    buildingOpacity: findFirstGroupOpacity("buildings", configDefaults.componentStyles.buildingOpacity),
    boundaryColor: findFirstGroupColor("boundaries", configDefaults.componentStyles.boundaryColor),
    boundaryOpacity: findFirstGroupOpacity("boundaries", configDefaults.componentStyles.boundaryOpacity)
  };
}

export function captureBaseLabelSnapshot() {
  const ids = getBaseLabelIds();
  let color = configDefaults.baseLabelStyles.baseLabelColor;
  let opacity = configDefaults.baseLabelStyles.baseLabelOpacity;
  let haloColor = configDefaults.baseLabelStyles.baseLabelHaloColor;
  let haloWidth = configDefaults.baseLabelStyles.baseLabelHaloWidth;
  let transform = configDefaults.baseLabelStyles.baseLabelTransform;

  for (const id of ids) {
    const nextColor = parseColorValue(readPaintProperty(id, "text-color"));
    if (nextColor?.hex) {
      color = nextColor.hex;
      opacity = Math.round(nextColor.alpha * 100);
      const nextOpacity = extractOpacityPercent(readPaintProperty(id, "text-opacity"));
      if (nextOpacity != null) {
        opacity = nextOpacity;
      }
      break;
    }
  }

  for (const id of ids) {
    const nextHalo = parseColorValue(readPaintProperty(id, "text-halo-color"));
    if (nextHalo?.hex) {
      haloColor = nextHalo.hex;
      break;
    }
  }

  for (const id of ids) {
    const nextHaloWidth = readPaintProperty(id, "text-halo-width");
    if (typeof nextHaloWidth === "number" && Number.isFinite(nextHaloWidth)) {
      haloWidth = nextHaloWidth;
      break;
    }
  }

  for (const id of ids) {
    const textField = state.map.getLayoutProperty(id, "text-field");
    transform = inferTextTransform(textField);
    if (transform !== "none") {
      break;
    }
  }

  return {
    baseLabelColor: color,
    baseLabelOpacity: opacity,
    baseLabelHaloColor: haloColor,
    baseLabelHaloWidth: haloWidth,
    baseLabelSizeScale: 100,
    baseLabelTransform: transform
  };
}

function paintPropsForLayerType(type) {
  if (type === "background") {
    return { color: ["background-color"], opacity: ["background-opacity"], width: [] };
  }
  if (type === "fill") {
    return { color: ["fill-color"], opacity: ["fill-opacity"], width: [] };
  }
  if (type === "line") {
    return { color: ["line-color"], opacity: ["line-opacity"], width: ["line-width"] };
  }
  if (type === "circle") {
    return { color: ["circle-color"], opacity: ["circle-opacity"], width: ["circle-radius"] };
  }
  if (type === "symbol") {
    return {
      color: ["text-color", "icon-color"],
      opacity: ["text-opacity", "icon-opacity"],
      width: ["text-halo-width"]
    };
  }
  return { color: [], opacity: [], width: [] };
}

function readPaintProperty(layerId, property) {
  try {
    return state.map.getPaintProperty(layerId, property);
  } catch {
    return null;
  }
}

function detectEntityKey(layer) {
  const sourceLayer = String(layer["source-layer"] || "").trim().toLowerCase();
  if (sourceLayer) {
    return sourceLayer;
  }
  const id = String(layer.id || "").trim().toLowerCase();
  if (!id) {
    return "layer";
  }
  const chunks = id.split("-").filter(Boolean);
  return chunks.slice(0, 2).join("-") || id;
}

function formatEntityLabel(entityKey) {
  return entityKey
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractOpacityPercent(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value * 100)));
  }
  if (typeof value === "string") {
    const colorInfo = parseColorValue(value);
    if (colorInfo) {
      return Math.max(0, Math.min(100, Math.round(colorInfo.alpha * 100)));
    }
  }
  return null;
}

function extractWidth(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(24, value));
  }
  return null;
}

function collectStyleEntities() {
  const style = state.map.getStyle();
  const layers = style?.layers || [];
  const entities = new Map();

  for (const layer of layers) {
    if (!layer || layer.id.startsWith("cafes-")) {
      continue;
    }

    const key = detectEntityKey(layer);
    if (!entities.has(key)) {
      entities.set(key, {
        key,
        label: formatEntityLabel(key),
        layers: [],
        hasColor: false,
        hasOpacity: false,
        hasWidth: false
      });
    }

    const entity = entities.get(key);
    const props = paintPropsForLayerType(layer.type);
    const colorProp = props.color.find((property) => readPaintProperty(layer.id, property) != null) || null;
    const opacityProp = props.opacity.find((property) => readPaintProperty(layer.id, property) != null) || null;
    const widthProp = props.width.find((property) => readPaintProperty(layer.id, property) != null) || null;

    entity.layers.push({
      id: layer.id,
      colorProp,
      opacityProp,
      widthProp
    });
    entity.hasColor = entity.hasColor || Boolean(colorProp);
    entity.hasOpacity = entity.hasOpacity || Boolean(opacityProp);
    entity.hasWidth = entity.hasWidth || Boolean(widthProp);
  }

  return [...entities.values()].sort((a, b) => b.layers.length - a.layers.length);
}

function isEntityVisible(entity) {
  for (const layer of entity.layers) {
    let visibility = "visible";
    try {
      const value = state.map.getLayoutProperty(layer.id, "visibility");
      visibility = value || "visible";
    } catch {
      visibility = "visible";
    }
    if (visibility !== "none") {
      return true;
    }
  }
  return false;
}

function getStyleEntityConfig(entityKey) {
  return state.config.styleEntityVisibility[entityKey] || null;
}

function captureEntityColor(entity) {
  for (const layer of entity.layers) {
    if (!layer.colorProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.colorProp);
    const colorInfo = parseColorValue(value);
    if (colorInfo?.hex) {
      return colorInfo.hex;
    }
  }
  return null;
}

function getEntityColor(entity) {
  const configEntry = getStyleEntityConfig(entity.key);
  if (configEntry?.color) {
    return configEntry.color;
  }
  const color = captureEntityColor(entity);
  if (color) {
    return color;
  }
  return "#808080";
}

function captureEntityOpacity(entity) {
  for (const layer of entity.layers) {
    if (!layer.opacityProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.opacityProp);
    const opacity = extractOpacityPercent(value);
    if (opacity != null) {
      return opacity;
    }
  }
  return null;
}

function getEntityOpacity(entity) {
  const configEntry = getStyleEntityConfig(entity.key);
  if (typeof configEntry?.opacity === "number") {
    return configEntry.opacity;
  }
  const opacity = captureEntityOpacity(entity);
  if (opacity != null) {
    return opacity;
  }
  return 100;
}

function captureEntityWidth(entity) {
  for (const layer of entity.layers) {
    if (!layer.widthProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.widthProp);
    const width = extractWidth(value);
    if (width != null) {
      return width;
    }
  }
  return null;
}

function getEntityWidth(entity) {
  const configEntry = getStyleEntityConfig(entity.key);
  if (typeof configEntry?.width === "number") {
    return configEntry.width;
  }
  const width = captureEntityWidth(entity);
  if (width != null) {
    return width;
  }
  return 1;
}

export function captureEntityVisibilitySnapshot() {
  const entries = {};
  for (const entity of collectStyleEntities()) {
    const entry = {
      visible: isEntityVisible(entity)
    };
    const color = entity.hasColor ? captureEntityColor(entity) : null;
    const opacity = entity.hasOpacity ? captureEntityOpacity(entity) : null;
    const width = entity.hasWidth ? captureEntityWidth(entity) : null;

    if (color) {
      entry.color = color;
    }
    if (opacity != null) {
      entry.opacity = opacity;
    }
    if (width != null) {
      entry.width = width;
    }

    entries[entity.key] = entry;
  }
  return entries;
}

export function captureStyleSnapshot() {
  return {
    basemap: state.currentBasemap,
    layerVisibility: captureLayerVisibilitySnapshot(),
    componentStyleAvailability: captureComponentStyleAvailability(),
    componentStyles: captureComponentStyleSnapshot(),
    baseLabelStyles: captureBaseLabelSnapshot(),
    styleEntityVisibility: captureEntityVisibilitySnapshot()
  };
}

export function applyStyleEntityVisibilityPatch(patch = {}) {
  const entries = Object.entries(patch);
  if (!entries.length) {
    return;
  }

  if (state.styleEntitiesByKey.size === 0) {
    const entities = collectStyleEntities();
    state.styleEntitiesByKey = new Map(entities.map((entity) => [entity.key, entity]));
  }

  for (const [entityKey, entityPatch] of entries) {
    const entity = state.styleEntitiesByKey.get(entityKey);
    if (!entity) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(entityPatch, "visible")) {
      for (const layer of entity.layers) {
        safeSetLayout(layer.id, "visibility", entityPatch.visible ? "visible" : "none");
      }
    }

    if (Object.prototype.hasOwnProperty.call(entityPatch, "color")) {
      for (const layer of entity.layers) {
        if (layer.colorProp) {
          safeSetPaint(layer.id, layer.colorProp, entityPatch.color);
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(entityPatch, "opacity")) {
      for (const layer of entity.layers) {
        if (layer.opacityProp) {
          safeSetPaint(layer.id, layer.opacityProp, Number(entityPatch.opacity) / 100);
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(entityPatch, "width")) {
      for (const layer of entity.layers) {
        if (layer.widthProp) {
          safeSetPaint(layer.id, layer.widthProp, Number(entityPatch.width));
        }
      }
    }
  }
}

export function applyStyleConfig() {
  applyLayerVisibility();
  applyComponentColors();
  applyBaseLabelStyles();
  applyStyleEntityVisibilityPatch(state.config.styleEntityVisibility);
}

function ensureStyleEntityEditorListeners() {
  if (!inputs.styleEntityEditor || inputs.styleEntityEditor.dataset.bound === "1") {
    return;
  }

  const applyFromControl = (target) => {
    const entityKey = target.dataset.entityKey;
    const action = target.dataset.entityAction;
    if (!entityKey || !action) {
      return;
    }

    const entity = state.styleEntitiesByKey.get(entityKey);
    if (!entity) {
      return;
    }

    if (action === "visibility") {
      const isVisible = target.checked;
      updateConfig(["styleEntityVisibility", entityKey], {
        ...(getStyleEntityConfig(entityKey) || {}),
        visible: isVisible
      });
      applyStyleEntityVisibilityPatch({
        [entityKey]: { visible: isVisible }
      });
      return;
    }

    if (action === "color") {
      const color = target.value;
      updateConfig(["styleEntityVisibility", entityKey], {
        ...(getStyleEntityConfig(entityKey) || {}),
        color
      });
      applyStyleEntityVisibilityPatch({
        [entityKey]: { color }
      });
      return;
    }

    if (action === "opacity") {
      const opacity = Number(target.value);
      updateConfig(["styleEntityVisibility", entityKey], {
        ...(getStyleEntityConfig(entityKey) || {}),
        opacity
      });
      applyStyleEntityVisibilityPatch({
        [entityKey]: { opacity }
      });
      return;
    }

    if (action === "width") {
      const width = Number(target.value);
      updateConfig(["styleEntityVisibility", entityKey], {
        ...(getStyleEntityConfig(entityKey) || {}),
        width
      });
      applyStyleEntityVisibilityPatch({
        [entityKey]: { width }
      });
    }
  };

  inputs.styleEntityEditor.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.dataset.entityAction === "color" || target.dataset.entityAction === "opacity" || target.dataset.entityAction === "width") {
      applyFromControl(target);
    }
  });

  inputs.styleEntityEditor.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    applyFromControl(target);
  });

  inputs.styleEntityEditor.dataset.bound = "1";
}

export function renderStyleEntityEditor() {
  if (!state.styleReady || !inputs.styleEntityEditor) {
    return;
  }

  const entities = collectStyleEntities();
  state.styleEntitiesByKey = new Map(entities.map((entity) => [entity.key, entity]));
  inputs.styleEntityEditor.innerHTML = "";

  if (!entities.length) {
    const empty = document.createElement("p");
    empty.className = "style-entity-empty";
    empty.textContent = "No hay entidades editables detectadas para este style.";
    inputs.styleEntityEditor.append(empty);
    return;
  }

  for (const entity of entities) {
    const row = document.createElement("div");
    row.className = "style-entity-row";

    const head = document.createElement("div");
    head.className = "style-entity-head";
    const name = document.createElement("div");
    name.className = "style-entity-name";
    name.textContent = entity.label;
    const count = document.createElement("div");
    count.className = "style-entity-count";
    count.textContent = `${entity.layers.length} capas`;
    head.append(name, count);
    row.append(head);

    const controls = document.createElement("div");
    controls.className = "style-entity-controls";

    const visibilityLabel = document.createElement("label");
    visibilityLabel.textContent = "Visible";
    const visibilityInput = document.createElement("input");
    visibilityInput.type = "checkbox";
    visibilityInput.checked = getStyleEntityConfig(entity.key)?.visible ?? isEntityVisible(entity);
    visibilityInput.dataset.entityKey = entity.key;
    visibilityInput.dataset.entityAction = "visibility";
    visibilityLabel.prepend(visibilityInput);
    controls.append(visibilityLabel);

    if (entity.hasColor) {
      const colorLabel = document.createElement("label");
      colorLabel.textContent = "Color";
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = getEntityColor(entity);
      colorInput.defaultValue = colorInput.value;
      colorInput.dataset.entityKey = entity.key;
      colorInput.dataset.entityAction = "color";
      colorLabel.append(colorInput);
      controls.append(colorLabel);
    }

    if (entity.hasOpacity) {
      const opacityLabel = document.createElement("label");
      opacityLabel.textContent = "Opacidad";
      const opacityInput = document.createElement("input");
      opacityInput.type = "range";
      opacityInput.min = "0";
      opacityInput.max = "100";
      opacityInput.value = String(getEntityOpacity(entity));
      opacityInput.defaultValue = opacityInput.value;
      opacityInput.dataset.entityKey = entity.key;
      opacityInput.dataset.entityAction = "opacity";
      opacityLabel.append(opacityInput);
      controls.append(opacityLabel);
    }

    if (entity.hasWidth) {
      const widthLabel = document.createElement("label");
      widthLabel.textContent = "Trazo";
      const widthInput = document.createElement("input");
      widthInput.type = "range";
      widthInput.min = "0";
      widthInput.max = "24";
      widthInput.step = "0.2";
      widthInput.value = String(getEntityWidth(entity));
      widthInput.defaultValue = widthInput.value;
      widthInput.dataset.entityKey = entity.key;
      widthInput.dataset.entityAction = "width";
      widthLabel.append(widthInput);
      controls.append(widthLabel);
    }

    row.append(controls);
    inputs.styleEntityEditor.append(row);
  }

  ensureStyleEntityEditorListeners();
}
