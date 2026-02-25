import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";
import { cloneValue, scaleTextSizeValue } from "../core/helpers.js";

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
  const ids = getBaseLabelIds();

  for (const id of ids) {
    const textSize = state.map.getLayoutProperty(id, "text-size");
    if (textSize != null) {
      state.baseLabelSizes.set(id, cloneValue(textSize));
    }
  }
}

function saveBasePaint(layerId, property) {
  const value = readPaintProperty(layerId, property);
  if (typeof value === "number" && Number.isFinite(value)) {
    state.baseFeaturePaint.set(`${layerId}:${property}`, value);
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

function setGroupVisibility(groupKey, isVisible) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    safeSetLayout(id, "visibility", isVisible ? "visible" : "none");
  }
}

export function applyLayerVisibility() {
  if (!state.styleReady) {
    return;
  }

  setGroupVisibility("water", inputs.showWater.checked);
  setGroupVisibility("parks", inputs.showParks.checked);
  setGroupVisibility("landuse", inputs.showLanduse.checked);
  setGroupVisibility("roadsMajor", inputs.showRoadsMajor.checked);
  setGroupVisibility("roadsMinor", inputs.showRoadsMinor.checked);
  setGroupVisibility("buildings", inputs.showBuildings.checked);
  setGroupVisibility("boundaries", inputs.showBoundaries.checked);
  setGroupVisibility("labelsRoad", inputs.showRoadLabels.checked);
  setGroupVisibility("labelsPlace", inputs.showPlaceLabels.checked);
  setGroupVisibility("labelsPoi", inputs.showPoiLabels.checked);
  setGroupVisibility("labelsWater", inputs.showWaterLabels.checked);
}

export function applyComponentColors() {
  if (!state.styleReady || !state.componentStyleOverridesEnabled) {
    return;
  }

  for (const id of state.layerGroups.background) {
    safeSetPaint(id, "background-color", inputs.bgColor.value);
  }

  for (const id of state.layerGroups.water) {
    const layer = state.map.getLayer(id);
    if (!layer) {
      continue;
    }

    if (layer.type === "fill") {
      safeSetPaint(id, "fill-color", inputs.waterColor.value);
      safeSetPaint(id, "fill-opacity", Number(inputs.waterOpacity.value) / 100);
    }

    if (layer.type === "line") {
      safeSetPaint(id, "line-color", inputs.waterColor.value);
      safeSetPaint(id, "line-opacity", Number(inputs.waterOpacity.value) / 100);
    }
  }

  for (const id of state.layerGroups.parks) {
    safeSetPaint(id, "fill-color", inputs.parkColor.value);
    safeSetPaint(id, "fill-opacity", Number(inputs.parkOpacity.value) / 100);
  }

  for (const id of state.layerGroups.landuse) {
    safeSetPaint(id, "fill-color", inputs.landuseColor.value);
    safeSetPaint(id, "fill-opacity", Number(inputs.landuseOpacity.value) / 100);
  }

  for (const id of state.layerGroups.roadsMajor) {
    safeSetPaint(id, "line-color", inputs.roadMajorColor.value);
    safeSetPaint(id, "line-opacity", Number(inputs.roadMajorOpacity.value) / 100);
  }

  for (const id of state.layerGroups.roadsMinor) {
    safeSetPaint(id, "line-color", inputs.roadMinorColor.value);
    safeSetPaint(id, "line-opacity", Number(inputs.roadMinorOpacity.value) / 100);
  }

  for (const id of state.layerGroups.buildings) {
    safeSetPaint(id, "fill-color", inputs.buildingColor.value);
    safeSetPaint(id, "fill-opacity", Number(inputs.buildingOpacity.value) / 100);
    safeSetPaint(id, "line-color", inputs.buildingColor.value);
    safeSetPaint(id, "line-opacity", Number(inputs.buildingOpacity.value) / 100);
  }

  for (const id of state.layerGroups.boundaries) {
    safeSetPaint(id, "line-color", inputs.boundaryColor.value);
    safeSetPaint(id, "line-opacity", Number(inputs.boundaryOpacity.value) / 100);
  }
}

function applyComponentColorControl(controlKey) {
  switch (controlKey) {
    case "bgColor":
      for (const id of state.layerGroups.background) {
        safeSetPaint(id, "background-color", inputs.bgColor.value);
      }
      break;
    case "waterColor":
      for (const id of state.layerGroups.water) {
        const layer = state.map.getLayer(id);
        if (!layer) {
          continue;
        }

        if (layer.type === "fill") {
          safeSetPaint(id, "fill-color", inputs.waterColor.value);
        }
        if (layer.type === "line") {
          safeSetPaint(id, "line-color", inputs.waterColor.value);
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
          safeSetPaint(id, "fill-opacity", Number(inputs.waterOpacity.value) / 100);
        }
        if (layer.type === "line") {
          safeSetPaint(id, "line-opacity", Number(inputs.waterOpacity.value) / 100);
        }
      }
      break;
    case "parkColor":
      for (const id of state.layerGroups.parks) {
        safeSetPaint(id, "fill-color", inputs.parkColor.value);
      }
      break;
    case "parkOpacity":
      for (const id of state.layerGroups.parks) {
        safeSetPaint(id, "fill-opacity", Number(inputs.parkOpacity.value) / 100);
      }
      break;
    case "landuseColor":
      for (const id of state.layerGroups.landuse) {
        safeSetPaint(id, "fill-color", inputs.landuseColor.value);
      }
      break;
    case "landuseOpacity":
      for (const id of state.layerGroups.landuse) {
        safeSetPaint(id, "fill-opacity", Number(inputs.landuseOpacity.value) / 100);
      }
      break;
    case "roadMajorColor":
      for (const id of state.layerGroups.roadsMajor) {
        safeSetPaint(id, "line-color", inputs.roadMajorColor.value);
      }
      break;
    case "roadMajorOpacity":
      for (const id of state.layerGroups.roadsMajor) {
        safeSetPaint(id, "line-opacity", Number(inputs.roadMajorOpacity.value) / 100);
      }
      break;
    case "roadMinorColor":
      for (const id of state.layerGroups.roadsMinor) {
        safeSetPaint(id, "line-color", inputs.roadMinorColor.value);
      }
      break;
    case "roadMinorOpacity":
      for (const id of state.layerGroups.roadsMinor) {
        safeSetPaint(id, "line-opacity", Number(inputs.roadMinorOpacity.value) / 100);
      }
      break;
    case "buildingColor":
      for (const id of state.layerGroups.buildings) {
        safeSetPaint(id, "fill-color", inputs.buildingColor.value);
        safeSetPaint(id, "line-color", inputs.buildingColor.value);
      }
      break;
    case "buildingOpacity":
      for (const id of state.layerGroups.buildings) {
        safeSetPaint(id, "fill-opacity", Number(inputs.buildingOpacity.value) / 100);
        safeSetPaint(id, "line-opacity", Number(inputs.buildingOpacity.value) / 100);
      }
      break;
    case "boundaryColor":
      for (const id of state.layerGroups.boundaries) {
        safeSetPaint(id, "line-color", inputs.boundaryColor.value);
      }
      break;
    case "boundaryOpacity":
      for (const id of state.layerGroups.boundaries) {
        safeSetPaint(id, "line-opacity", Number(inputs.boundaryOpacity.value) / 100);
      }
      break;
    default:
      applyComponentColors();
  }
}

export function applySingleComponentStyle(controlKey) {
  if (!state.styleReady || !state.componentStyleOverridesEnabled) {
    return;
  }
  applyComponentColorControl(controlKey);
}

export function applyMapCanvasFilter() {
  const filter = [
    `brightness(${inputs.mapBrightness.value}%)`,
    `contrast(${inputs.mapContrast.value}%)`,
    `saturate(${inputs.mapSaturation.value}%)`,
    `grayscale(${inputs.mapGrayscale.value}%)`,
    `hue-rotate(${inputs.mapHue.value}deg)`
  ].join(" ");

  document.documentElement.style.setProperty("--map-filter", filter);
}

export function applyBaseLabelStyles() {
  if (!state.styleReady || !state.baseLabelStyleOverridesEnabled) {
    return;
  }

  const ids = getBaseLabelIds();

  const labelOpacity = Number(inputs.baseLabelOpacity.value) / 100;
  const haloWidth = Number(inputs.baseLabelHaloWidth.value);
  const scale = Number(inputs.baseLabelSizeScale.value) / 100;

  for (const id of ids) {
    safeSetPaint(id, "text-color", inputs.baseLabelColor.value);
    safeSetPaint(id, "text-opacity", labelOpacity);
    safeSetPaint(id, "text-halo-color", inputs.baseLabelHaloColor.value);
    safeSetPaint(id, "text-halo-width", haloWidth);
    safeSetLayout(id, "text-transform", inputs.baseLabelTransform.value);

    if (state.baseLabelSizes.has(id)) {
      const base = cloneValue(state.baseLabelSizes.get(id));
      const scaled = scaleTextSizeValue(base, scale);
      if (scaled != null) {
        safeSetLayout(id, "text-size", scaled);
      }
    }
  }
}

function applyBaseLabelControl(controlKey) {
  const ids = getBaseLabelIds();
  const scale = Number(inputs.baseLabelSizeScale.value) / 100;

  for (const id of ids) {
    if (controlKey === "baseLabelColor") {
      safeSetPaint(id, "text-color", inputs.baseLabelColor.value);
    } else if (controlKey === "baseLabelOpacity") {
      safeSetPaint(id, "text-opacity", Number(inputs.baseLabelOpacity.value) / 100);
    } else if (controlKey === "baseLabelHaloColor") {
      safeSetPaint(id, "text-halo-color", inputs.baseLabelHaloColor.value);
    } else if (controlKey === "baseLabelHaloWidth") {
      safeSetPaint(id, "text-halo-width", Number(inputs.baseLabelHaloWidth.value));
    } else if (controlKey === "baseLabelTransform") {
      safeSetLayout(id, "text-transform", inputs.baseLabelTransform.value);
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
  if (!state.styleReady || !state.baseLabelStyleOverridesEnabled) {
    return;
  }
  applyBaseLabelControl(controlKey);
}

function applyGroupLineWidth(groupKey, widthScale = 1) {
  const ids = state.layerGroups[groupKey] || [];
  for (const id of ids) {
    const layer = state.map.getLayer(id);
    if (!layer || layer.type !== "line") {
      continue;
    }
    const base = state.baseFeaturePaint.get(`${id}:line-width`);
    if (typeof base === "number") {
      safeSetPaint(id, "line-width", clamp(base * widthScale, 0, 26));
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
      if (typeof base === "number") {
        safeSetPaint(id, "line-opacity", clamp(base * opacityScale, 0, 1));
      }
    }

    if (layer.type === "fill") {
      const base = state.baseFeaturePaint.get(`${id}:fill-opacity`);
      if (typeof base === "number") {
        safeSetPaint(id, "fill-opacity", clamp(base * opacityScale, 0, 1));
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
  if (!inputs.inkBoost || !inputs.riverBoost || !inputs.featureFocus || !inputs.featureFocusStrength) {
    return;
  }

  const inkBoost = Number(inputs.inkBoost.value) / 100;
  const riverBoost = Number(inputs.riverBoost.value) / 100;
  const focusKey = inputs.featureFocus.value;
  const focusStrength = Number(inputs.featureFocusStrength.value) / 100;
  const focusGroup = focusKeyToGroupKey(focusKey);

  const groups = ["water", "parks", "landuse", "roadsMajor", "roadsMinor", "buildings", "boundaries"];
  for (const groupKey of groups) {
    let widthScale = 1;
    let opacityScale = 1;

    if (groupKey === "roadsMajor") {
      widthScale *= inkBoost * 1.16;
    } else if (groupKey === "roadsMinor") {
      widthScale *= inkBoost;
    } else if (groupKey === "boundaries") {
      widthScale *= inkBoost * 0.9;
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

function extractHexColor(value) {
  if (typeof value !== "string") {
    return null;
  }
  const candidate = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(candidate)) {
    if (candidate.length === 4) {
      const [hash, r, g, b] = candidate;
      return `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return candidate.toLowerCase();
  }
  return null;
}

function extractOpacityPercent(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value * 100)));
  }
  return 100;
}

function extractWidth(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(24, value));
  }
  return 1;
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

function getEntityColor(entity) {
  for (const layer of entity.layers) {
    if (!layer.colorProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.colorProp);
    const color = extractHexColor(value);
    if (color) {
      return color;
    }
  }
  return "#808080";
}

function getEntityOpacity(entity) {
  for (const layer of entity.layers) {
    if (!layer.opacityProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.opacityProp);
    const opacity = extractOpacityPercent(value);
    if (opacity !== 100 || typeof value === "number") {
      return opacity;
    }
  }
  return 100;
}

function getEntityWidth(entity) {
  for (const layer of entity.layers) {
    if (!layer.widthProp) {
      continue;
    }
    const value = readPaintProperty(layer.id, layer.widthProp);
    if (typeof value === "number") {
      return extractWidth(value);
    }
  }
  return 1;
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
      for (const layer of entity.layers) {
        safeSetLayout(layer.id, "visibility", isVisible ? "visible" : "none");
      }
      return;
    }

    if (action === "color") {
      const color = target.value;
      for (const layer of entity.layers) {
        if (layer.colorProp) {
          safeSetPaint(layer.id, layer.colorProp, color);
        }
      }
      return;
    }

    if (action === "opacity") {
      const opacity = Number(target.value) / 100;
      for (const layer of entity.layers) {
        if (layer.opacityProp) {
          safeSetPaint(layer.id, layer.opacityProp, opacity);
        }
      }
      return;
    }

    if (action === "width") {
      const width = Number(target.value);
      for (const layer of entity.layers) {
        if (layer.widthProp) {
          safeSetPaint(layer.id, layer.widthProp, width);
        }
      }
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
    visibilityInput.checked = isEntityVisible(entity);
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
