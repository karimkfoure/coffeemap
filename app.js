const defaultMyMapsUrl =
  "https://www.google.com/maps/d/u/0/viewer?mid=1fMXnq7tJ3ToCsxz8NBltdYgiO5ldsyg&ll=-31.420478598270606%2C-64.18262452047118&z=13";

const styleUrls = {
  bright: "https://tiles.openfreemap.org/styles/bright",
  positron: "https://tiles.openfreemap.org/styles/positron",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark"
};

const ratioMap = {
  fill: null,
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16
};

const inputs = {
  sourceLink: document.getElementById("sourceLink"),
  status: document.getElementById("status"),
  reloadDataBtn: document.getElementById("reloadDataBtn"),
  layerFilter: document.getElementById("layerFilter"),

  presetSelect: document.getElementById("presetSelect"),
  applyPresetBtn: document.getElementById("applyPresetBtn"),

  basemapSelect: document.getElementById("basemapSelect"),

  showWater: document.getElementById("showWater"),
  showParks: document.getElementById("showParks"),
  showLanduse: document.getElementById("showLanduse"),
  showRoadsMajor: document.getElementById("showRoadsMajor"),
  showRoadsMinor: document.getElementById("showRoadsMinor"),
  showBuildings: document.getElementById("showBuildings"),
  showBoundaries: document.getElementById("showBoundaries"),
  showRoadLabels: document.getElementById("showRoadLabels"),
  showPlaceLabels: document.getElementById("showPlaceLabels"),
  showPoiLabels: document.getElementById("showPoiLabels"),
  showWaterLabels: document.getElementById("showWaterLabels"),

  bgColor: document.getElementById("bgColor"),
  waterColor: document.getElementById("waterColor"),
  waterOpacity: document.getElementById("waterOpacity"),
  parkColor: document.getElementById("parkColor"),
  parkOpacity: document.getElementById("parkOpacity"),
  landuseColor: document.getElementById("landuseColor"),
  landuseOpacity: document.getElementById("landuseOpacity"),
  roadMajorColor: document.getElementById("roadMajorColor"),
  roadMajorOpacity: document.getElementById("roadMajorOpacity"),
  roadMinorColor: document.getElementById("roadMinorColor"),
  roadMinorOpacity: document.getElementById("roadMinorOpacity"),
  buildingColor: document.getElementById("buildingColor"),
  buildingOpacity: document.getElementById("buildingOpacity"),
  boundaryColor: document.getElementById("boundaryColor"),
  boundaryOpacity: document.getElementById("boundaryOpacity"),

  mapBrightness: document.getElementById("mapBrightness"),
  mapContrast: document.getElementById("mapContrast"),
  mapSaturation: document.getElementById("mapSaturation"),
  mapGrayscale: document.getElementById("mapGrayscale"),
  mapHue: document.getElementById("mapHue"),
  resetGlobalFiltersBtn: document.getElementById("resetGlobalFiltersBtn"),

  baseLabelColor: document.getElementById("baseLabelColor"),
  baseLabelOpacity: document.getElementById("baseLabelOpacity"),
  baseLabelHaloColor: document.getElementById("baseLabelHaloColor"),
  baseLabelHaloWidth: document.getElementById("baseLabelHaloWidth"),
  baseLabelSizeScale: document.getElementById("baseLabelSizeScale"),
  baseLabelTransform: document.getElementById("baseLabelTransform"),

  markerColor: document.getElementById("markerColor"),
  markerStroke: document.getElementById("markerStroke"),
  markerRadius: document.getElementById("markerRadius"),
  markerOpacity: document.getElementById("markerOpacity"),
  strokeWeight: document.getElementById("strokeWeight"),
  haloColor: document.getElementById("haloColor"),
  haloSize: document.getElementById("haloSize"),
  haloOpacity: document.getElementById("haloOpacity"),
  shadowColor: document.getElementById("shadowColor"),
  shadowOpacity: document.getElementById("shadowOpacity"),
  shadowBlur: document.getElementById("shadowBlur"),
  shadowOffsetX: document.getElementById("shadowOffsetX"),
  shadowOffsetY: document.getElementById("shadowOffsetY"),
  jitterMeters: document.getElementById("jitterMeters"),

  showLabels: document.getElementById("showLabels"),
  labelMode: document.getElementById("labelMode"),
  labelTransform: document.getElementById("labelTransform"),
  labelColor: document.getElementById("labelColor"),
  labelSize: document.getElementById("labelSize"),
  labelHaloColor: document.getElementById("labelHaloColor"),
  labelHaloWidth: document.getElementById("labelHaloWidth"),
  labelLetterSpacing: document.getElementById("labelLetterSpacing"),
  labelOffsetY: document.getElementById("labelOffsetY"),

  tintColor: document.getElementById("tintColor"),
  tintOpacity: document.getElementById("tintOpacity"),
  vignetteOpacity: document.getElementById("vignetteOpacity"),
  grainOpacity: document.getElementById("grainOpacity"),
  frameColor: document.getElementById("frameColor"),
  frameWidth: document.getElementById("frameWidth"),
  frameRadius: document.getElementById("frameRadius"),
  frameShadow: document.getElementById("frameShadow"),

  showPoster: document.getElementById("showPoster"),
  posterTitle: document.getElementById("posterTitle"),
  posterSubtitle: document.getElementById("posterSubtitle"),
  posterPosition: document.getElementById("posterPosition"),
  posterColor: document.getElementById("posterColor"),
  posterSize: document.getElementById("posterSize"),
  posterSubtitleSize: document.getElementById("posterSubtitleSize"),
  posterBgColor: document.getElementById("posterBgColor"),
  posterBgOpacity: document.getElementById("posterBgOpacity"),
  posterPadding: document.getElementById("posterPadding"),

  canvasRatio: document.getElementById("canvasRatio"),
  canvasPadding: document.getElementById("canvasPadding"),
  fitPadding: document.getElementById("fitPadding"),
  pitchInput: document.getElementById("pitchInput"),
  bearingInput: document.getElementById("bearingInput"),
  centerLat: document.getElementById("centerLat"),
  centerLng: document.getElementById("centerLng"),
  zoomInput: document.getElementById("zoomInput"),
  applyViewBtn: document.getElementById("applyViewBtn"),
  fitBtn: document.getElementById("fitBtn"),
  resetCameraBtn: document.getElementById("resetCameraBtn"),
  togglePanelBtn: document.getElementById("togglePanelBtn"),

  mapWrap: document.getElementById("mapWrap"),
  mapFrame: document.getElementById("mapFrame"),

  posterOverlay: document.getElementById("posterOverlay"),
  posterTitleNode: document.getElementById("posterTitleNode"),
  posterSubtitleNode: document.getElementById("posterSubtitleNode"),

  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingText: document.getElementById("loadingText")
};

const state = {
  map: null,
  currentBasemap: inputs.basemapSelect.value,
  styleSwitching: false,
  loadingCount: 0,
  allPoints: [],
  points: [],
  layerGroups: {
    background: [],
    water: [],
    parks: [],
    landuse: [],
    roadsMajor: [],
    roadsMinor: [],
    buildings: [],
    boundaries: [],
    labelsRoad: [],
    labelsPlace: [],
    labelsPoi: [],
    labelsWater: []
  },
  baseLabelSizes: new Map(),
  mapReady: false,
  styleReady: false
};

const cafeSourceId = "cafes-source";
const cafeShadowLayerId = "cafes-shadow";
const cafeHaloLayerId = "cafes-halo";
const cafeCoreLayerId = "cafes-core";
const cafeLabelLayerId = "cafes-label";

const presets = {
  editorial: {
    basemapSelect: "positron",
    bgColor: "#f4efe7",
    waterColor: "#b8d3e4",
    parkColor: "#dce7ce",
    roadMajorColor: "#efb174",
    roadMinorColor: "#ffffff",
    buildingColor: "#e8ded1",
    mapContrast: 106,
    mapSaturation: 92,
    showPoiLabels: false,
    showWaterLabels: true,
    markerColor: "#d14f2b",
    markerStroke: "#fff3e5",
    haloColor: "#d14f2b",
    haloOpacity: 26,
    tintOpacity: 0,
    vignetteOpacity: 10,
    grainOpacity: 0
  },
  mono: {
    basemapSelect: "bright",
    bgColor: "#f6f6f4",
    waterColor: "#cfcfcf",
    parkColor: "#e0e0e0",
    landuseColor: "#ececec",
    roadMajorColor: "#c2c2c2",
    roadMinorColor: "#fefefe",
    buildingColor: "#d7d7d7",
    boundaryColor: "#9b9b9b",
    mapSaturation: 0,
    mapContrast: 120,
    showPoiLabels: false,
    showWaterLabels: false,
    baseLabelColor: "#2f2f2f",
    markerColor: "#121212",
    markerStroke: "#ffffff",
    haloColor: "#000000",
    haloOpacity: 16,
    tintOpacity: 0,
    grainOpacity: 8
  },
  night: {
    basemapSelect: "dark",
    bgColor: "#141922",
    waterColor: "#355f95",
    parkColor: "#233a2f",
    landuseColor: "#1e2430",
    roadMajorColor: "#6ea7ff",
    roadMinorColor: "#4a576d",
    buildingColor: "#2d3340",
    boundaryColor: "#7f8ba5",
    baseLabelColor: "#dce5ff",
    baseLabelHaloColor: "#131720",
    mapBrightness: 95,
    mapContrast: 122,
    mapSaturation: 115,
    showPoiLabels: false,
    markerColor: "#ffd166",
    markerStroke: "#1b2233",
    haloColor: "#ffd166",
    haloOpacity: 34,
    labelColor: "#fff4ce",
    tintColor: "#0f2442",
    tintOpacity: 16,
    vignetteOpacity: 22
  },
  park: {
    basemapSelect: "liberty",
    parkColor: "#b8e58a",
    parkOpacity: 90,
    waterColor: "#7fc9f6",
    roadMajorColor: "#ffc76b",
    roadMinorColor: "#ffefce",
    showPoiLabels: true,
    markerColor: "#ff5a36",
    haloColor: "#ff5a36",
    haloOpacity: 32,
    tintColor: "#f6e6a8",
    tintOpacity: 8,
    vignetteOpacity: 8
  },
  warm: {
    basemapSelect: "positron",
    bgColor: "#f5eadc",
    waterColor: "#b9cfda",
    parkColor: "#d8ddb8",
    roadMajorColor: "#d79c5b",
    roadMinorColor: "#fff8ec",
    buildingColor: "#e4d3bf",
    baseLabelColor: "#52453b",
    mapBrightness: 108,
    mapSaturation: 86,
    mapHue: 8,
    markerColor: "#8f3b2d",
    markerStroke: "#f5e8d6",
    haloColor: "#8f3b2d",
    haloOpacity: 24,
    tintColor: "#f2c993",
    tintOpacity: 13,
    grainOpacity: 10
  }
};

function setStatus(message) {
  inputs.status.textContent = message;
}

function setLoading(isLoading, message = "Procesando...") {
  if (isLoading) {
    state.loadingCount += 1;
    inputs.loadingText.textContent = message;
    inputs.loadingOverlay.classList.remove("is-hidden");
    return;
  }

  state.loadingCount = Math.max(state.loadingCount - 1, 0);
  if (state.loadingCount === 0) {
    inputs.loadingOverlay.classList.add("is-hidden");
  }
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }

  const intValue = Number.parseInt(clean, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function scaleRounded(value, scale) {
  return Number((value * scale).toFixed(2));
}

function scaleTextSizeOutput(value, scale) {
  if (typeof value === "number") {
    return scaleRounded(value, scale);
  }

  if (Array.isArray(value)) {
    const scaled = scaleTextSizeValue(value, scale);
    if (scaled != null) {
      return scaled;
    }
  }

  return cloneValue(value);
}

function scaleTextSizeValue(value, scale) {
  if (typeof value === "number") {
    return scaleRounded(value, scale);
  }

  if (Array.isArray(value)) {
    const operator = value[0];
    const scaled = cloneValue(value);

    if (operator === "step") {
      if (scaled.length > 2) {
        scaled[2] = scaleTextSizeOutput(scaled[2], scale);
      }
      for (let i = 4; i < scaled.length; i += 2) {
        scaled[i] = scaleTextSizeOutput(scaled[i], scale);
      }
      return scaled;
    }

    if (operator === "interpolate") {
      for (let i = 4; i < scaled.length; i += 2) {
        scaled[i] = scaleTextSizeOutput(scaled[i], scale);
      }
      return scaled;
    }

    return null;
  }

  if (value && typeof value === "object" && Array.isArray(value.stops)) {
    const scaled = cloneValue(value);
    scaled.stops = scaled.stops.map((stopPair) => {
      if (!Array.isArray(stopPair) || stopPair.length < 2) {
        return stopPair;
      }
      return [stopPair[0], scaleTextSizeOutput(stopPair[1], scale)];
    });
    return scaled;
  }

  return null;
}

function classifyMapLayers() {
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

    const isWater = id.includes("water") || sourceLayer.includes("water");
    const isPark =
      id.includes("park") || id.includes("landcover") || id.includes("grass") || id.includes("wood") || sourceLayer === "park";
    const isLanduse = id.includes("landuse") || sourceLayer === "landuse";
    const isBuilding = id.includes("building") || sourceLayer === "building";
    const isBoundary = id.includes("boundary") || sourceLayer === "boundary";

    const isRoadLike =
      type === "line" &&
      (id.includes("road") ||
        id.includes("highway") ||
        id.includes("motorway") ||
        id.includes("trunk") ||
        sourceLayer.includes("transportation"));

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
      const isMajor = /(motorway|trunk|primary|secondary|tertiary|major)/.test(id);
      if (isMajor) {
        groups.roadsMajor.add(layer.id);
      } else {
        groups.roadsMinor.add(layer.id);
      }
    }

    if (type === "symbol") {
      if (id.includes("highway-name") || id.includes("road_shield") || id.includes("road_oneway")) {
        groups.labelsRoad.add(layer.id);
      } else if (id.includes("water_name") || id.includes("waterway")) {
        groups.labelsWater.add(layer.id);
      } else if (id.includes("poi") || id.includes("airport") || id.includes("transit")) {
        groups.labelsPoi.add(layer.id);
      } else if (
        id.includes("label_") ||
        id.includes("place") ||
        id.includes("city") ||
        id.includes("town") ||
        id.includes("village") ||
        id.includes("country") ||
        id.includes("state")
      ) {
        groups.labelsPlace.add(layer.id);
      }
    }
  }

  state.layerGroups = Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, [...value]])
  );
}

function captureBaseLabelSizes() {
  state.baseLabelSizes.clear();
  const ids = [
    ...state.layerGroups.labelsRoad,
    ...state.layerGroups.labelsPlace,
    ...state.layerGroups.labelsPoi,
    ...state.layerGroups.labelsWater
  ];

  for (const id of ids) {
    const textSize = state.map.getLayoutProperty(id, "text-size");
    if (textSize != null) {
      state.baseLabelSizes.set(id, cloneValue(textSize));
    }
  }
}

function safeSetPaint(id, property, value) {
  try {
    state.map.setPaintProperty(id, property, value);
  } catch {
    // ignore layers without that paint property
  }
}

function safeSetLayout(id, property, value) {
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

function applyLayerVisibility() {
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

function applyComponentColors() {
  if (!state.styleReady) {
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

function applyMapCanvasFilter() {
  const filter = [
    `brightness(${inputs.mapBrightness.value}%)`,
    `contrast(${inputs.mapContrast.value}%)`,
    `saturate(${inputs.mapSaturation.value}%)`,
    `grayscale(${inputs.mapGrayscale.value}%)`,
    `hue-rotate(${inputs.mapHue.value}deg)`
  ].join(" ");

  document.documentElement.style.setProperty("--map-filter", filter);
}

function applyBaseLabelStyles() {
  if (!state.styleReady) {
    return;
  }

  const ids = [
    ...state.layerGroups.labelsRoad,
    ...state.layerGroups.labelsPlace,
    ...state.layerGroups.labelsPoi,
    ...state.layerGroups.labelsWater
  ];

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

function hashSeed(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function jitterPoint(point, meters) {
  if (!meters) {
    return { lat: point.lat, lng: point.lng };
  }

  const seed = hashSeed(`${point.name}|${point.lat}|${point.lng}`);
  const seed2 = hashSeed(`${point.lng}|${point.lat}|${point.name}`);
  const angle = ((seed % 360) * Math.PI) / 180;
  const distance = ((seed2 % 1000) / 1000) * meters;

  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;

  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos((point.lat * Math.PI) / 180));

  return {
    lat: point.lat + dLat,
    lng: point.lng + dLng
  };
}

function transformLabel(label) {
  const mode = inputs.labelTransform.value;
  if (mode === "uppercase") {
    return label.toUpperCase();
  }
  if (mode === "capitalize") {
    return label
      .split(" ")
      .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part))
      .join(" ");
  }
  return label;
}

function labelForPoint(point, index) {
  if (inputs.labelMode.value === "index") {
    return String(index + 1);
  }
  if (inputs.labelMode.value === "indexName") {
    return `${index + 1}. ${point.name}`;
  }
  return point.name;
}

function buildCafeGeoJSON() {
  const jitter = Number(inputs.jitterMeters.value);

  return {
    type: "FeatureCollection",
    features: state.points.map((point, index) => {
      const pos = jitterPoint(point, jitter);
      const label = transformLabel(labelForPoint(point, index));

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pos.lng, pos.lat]
        },
        properties: {
          name: point.name,
          label,
          layer: point.layer || ""
        }
      };
    })
  };
}

function ensureCafeLayers() {
  if (!state.styleReady) {
    return;
  }

  if (!state.map.getSource(cafeSourceId)) {
    state.map.addSource(cafeSourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: []
      }
    });
  }

  if (!state.map.getLayer(cafeShadowLayerId)) {
    state.map.addLayer({
      id: cafeShadowLayerId,
      type: "circle",
      source: cafeSourceId,
      paint: {
        "circle-color": "#000000",
        "circle-radius": 12,
        "circle-opacity": 0.15,
        "circle-blur": 0.5,
        "circle-translate": [0, 3]
      }
    });
  }

  if (!state.map.getLayer(cafeHaloLayerId)) {
    state.map.addLayer({
      id: cafeHaloLayerId,
      type: "circle",
      source: cafeSourceId,
      paint: {
        "circle-color": "#d24828",
        "circle-radius": 18,
        "circle-opacity": 0.25
      }
    });
  }

  if (!state.map.getLayer(cafeCoreLayerId)) {
    state.map.addLayer({
      id: cafeCoreLayerId,
      type: "circle",
      source: cafeSourceId,
      paint: {
        "circle-color": "#d24828",
        "circle-stroke-color": "#fff4e8",
        "circle-stroke-width": 2,
        "circle-radius": 10,
        "circle-opacity": 0.92
      }
    });
  }

  if (!state.map.getLayer(cafeLabelLayerId)) {
    state.map.addLayer({
      id: cafeLabelLayerId,
      type: "symbol",
      source: cafeSourceId,
      layout: {
        "text-field": ["get", "label"],
        "text-size": 13,
        "text-letter-spacing": 0.04,
        "text-offset": [0, -1.2],
        "text-anchor": "top",
        "text-font": ["Noto Sans Bold"]
      },
      paint: {
        "text-color": "#1f232e",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": 1
      }
    });
  }
}

function applyCafeStyles() {
  if (!state.styleReady || !state.map.getLayer(cafeCoreLayerId)) {
    return;
  }

  const radius = Number(inputs.markerRadius.value);

  safeSetPaint(cafeShadowLayerId, "circle-color", inputs.shadowColor.value);
  safeSetPaint(cafeShadowLayerId, "circle-radius", radius + 2);
  safeSetPaint(cafeShadowLayerId, "circle-opacity", Number(inputs.shadowOpacity.value) / 100);
  safeSetPaint(cafeShadowLayerId, "circle-blur", Number(inputs.shadowBlur.value));
  safeSetPaint(cafeShadowLayerId, "circle-translate", [
    Number(inputs.shadowOffsetX.value),
    Number(inputs.shadowOffsetY.value)
  ]);

  safeSetPaint(cafeHaloLayerId, "circle-color", inputs.haloColor.value);
  safeSetPaint(cafeHaloLayerId, "circle-radius", radius + Number(inputs.haloSize.value));
  safeSetPaint(cafeHaloLayerId, "circle-opacity", Number(inputs.haloOpacity.value) / 100);

  safeSetPaint(cafeCoreLayerId, "circle-color", inputs.markerColor.value);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-color", inputs.markerStroke.value);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-width", Number(inputs.strokeWeight.value));
  safeSetPaint(cafeCoreLayerId, "circle-radius", radius);
  safeSetPaint(cafeCoreLayerId, "circle-opacity", Number(inputs.markerOpacity.value) / 100);

  const labelVisible = inputs.showLabels.checked ? "visible" : "none";
  safeSetLayout(cafeLabelLayerId, "visibility", labelVisible);
  safeSetLayout(cafeLabelLayerId, "text-size", Number(inputs.labelSize.value));
  safeSetLayout(cafeLabelLayerId, "text-letter-spacing", Number(inputs.labelLetterSpacing.value));

  const offsetEm = Number(inputs.labelOffsetY.value) / Number(inputs.labelSize.value);
  safeSetLayout(cafeLabelLayerId, "text-offset", [0, offsetEm]);

  safeSetPaint(cafeLabelLayerId, "text-color", inputs.labelColor.value);
  safeSetPaint(cafeLabelLayerId, "text-halo-color", inputs.labelHaloColor.value);
  safeSetPaint(cafeLabelLayerId, "text-halo-width", Number(inputs.labelHaloWidth.value));
}

function updateCafeSource(shouldFit = false) {
  if (!state.styleReady || !state.map.getSource(cafeSourceId)) {
    return;
  }

  const geojson = buildCafeGeoJSON();
  state.map.getSource(cafeSourceId).setData(geojson);

  if (shouldFit) {
    fitToData();
  }
}

function fitToData() {
  if (!state.points.length) {
    return;
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const point of state.points) {
    minLng = Math.min(minLng, point.lng);
    minLat = Math.min(minLat, point.lat);
    maxLng = Math.max(maxLng, point.lng);
    maxLat = Math.max(maxLat, point.lat);
  }

  const padding = Number(inputs.fitPadding.value);
  state.map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat]
    ],
    {
      padding,
      maxZoom: 16,
      duration: 0
    }
  );
}

function normalizeMarker(raw, fallbackName = "Cafe") {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const lat = Number(raw.lat);
  const lng = Number(raw.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const name = String(raw.name ?? fallbackName).trim() || fallbackName;
  const layer = String(raw.layer ?? raw.folder ?? "").trim();

  return { name, lat, lng, layer };
}

function parseKML(xmlString) {
  const xml = new DOMParser().parseFromString(xmlString, "application/xml");
  const parseError = xml.querySelector("parsererror");

  if (parseError) {
    throw new Error("KML invalido");
  }

  const placemarks = [...xml.querySelectorAll("Placemark")];
  const parsed = [];

  function resolveLayerName(placemark) {
    let current = placemark.parentElement;

    while (current) {
      if (current.localName === "Folder") {
        const folderName = [...current.children].find((child) => child.localName === "name");
        const value = folderName?.textContent?.trim();
        if (value) {
          return value;
        }
      }
      current = current.parentElement;
    }

    return "";
  }

  for (const placemark of placemarks) {
    const coordNode = placemark.querySelector("Point > coordinates");
    if (!coordNode || !coordNode.textContent) {
      continue;
    }

    const firstTuple = coordNode.textContent.trim().split(/\s+/)[0];
    const rawCoords = firstTuple.split(",");
    const lng = Number(rawCoords[0]);
    const lat = Number(rawCoords[1]);

    const nameNode = placemark.querySelector("name");
    const name = (nameNode?.textContent || "Cafe").trim() || "Cafe";
    const layer = resolveLayerName(placemark);

    const point = normalizeMarker({ name, lat, lng, layer });
    if (point) {
      parsed.push(point);
    }
  }

  return parsed;
}

function extractMidFromMyMapsUrl(rawInput) {
  const value = rawInput.trim();
  if (!value) {
    return "";
  }

  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.searchParams.get("mid") || "";
  } catch {
    return "";
  }
}

function buildMyMapsKmlUrl(rawInput) {
  const mid = extractMidFromMyMapsUrl(rawInput);
  if (!mid) {
    throw new Error("No se encontro MID en URL de My Maps.");
  }

  return `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mid)}&forcekml=1`;
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function loadPointsFromMyMaps(rawInput) {
  const kmlUrl = buildMyMapsKmlUrl(rawInput);
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(kmlUrl)}`;
  const candidates = [
    { url: kmlUrl, mode: "directo" },
    { url: proxyUrl, mode: "proxy" }
  ];

  let lastError = null;

  for (const candidate of candidates) {
    try {
      const text = await fetchText(candidate.url);
      if (!text.includes("<kml") && !text.includes("<Placemark")) {
        throw new Error("Respuesta no parece KML");
      }

      const loadedPoints = parseKML(text);
      return { loadedPoints, sourceUrl: kmlUrl, mode: candidate.mode };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo descargar KML. Verifica mapa publico. ${lastError?.message || ""}`.trim()
  );
}

function getLayerNames(points) {
  const names = new Set();
  for (const point of points) {
    if (point.layer) {
      names.add(point.layer);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function syncLayerFilterOptions() {
  const layerNames = getLayerNames(state.allPoints);
  const previous = inputs.layerFilter.value;

  inputs.layerFilter.innerHTML = "";
  inputs.layerFilter.append(new Option("Todos", ""));

  for (const layerName of layerNames) {
    inputs.layerFilter.append(new Option(layerName, layerName));
  }

  inputs.layerFilter.value = layerNames.includes(previous) ? previous : "";
}

function applyLayerFilter() {
  const selected = inputs.layerFilter.value;
  if (!selected) {
    state.points = [...state.allPoints];
  } else {
    state.points = state.allPoints.filter((point) => point.layer === selected);
  }

  updateCafeSource(true);
  applyCafeStyles();

  const label = selected ? `Layer activo: ${selected}.` : "Mostrando todas las capas.";
  setStatus(`${label} Cafes visibles: ${state.points.length}.`);
}

function updatePoints(points, sourceLabel) {
  if (!points.length) {
    state.allPoints = [];
    state.points = [];
    syncLayerFilterOptions();
    updateCafeSource(false);
    setStatus(`No se encontraron puntos validos en ${sourceLabel}.`);
    return;
  }

  const unique = new Map();
  for (const point of points) {
    const key = `${point.name}-${point.lat.toFixed(6)}-${point.lng.toFixed(6)}`;
    unique.set(key, point);
  }

  state.allPoints = [...unique.values()];
  syncLayerFilterOptions();
  applyLayerFilter();

  setStatus(`Cargados ${state.allPoints.length} cafes desde ${sourceLabel}.`);
}

async function loadDefaultMapData() {
  setLoading(true, "Descargando cafeterias desde My Maps...");

  try {
    const { loadedPoints, sourceUrl, mode } = await loadPointsFromMyMaps(defaultMyMapsUrl);
    updatePoints(loadedPoints, `My Maps (${mode})`);
    setStatus(`Cargados ${state.allPoints.length} cafes. Fuente: ${sourceUrl}`);
  } catch (error) {
    state.allPoints = [];
    state.points = [];
    syncLayerFilterOptions();
    updateCafeSource(false);
    setStatus(`Error importando My Maps: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function applyAtmosphereStyles() {
  document.documentElement.style.setProperty("--tint-color", inputs.tintColor.value);
  document.documentElement.style.setProperty("--tint-opacity", String(Number(inputs.tintOpacity.value) / 100));
  document.documentElement.style.setProperty("--vignette-opacity", String(Number(inputs.vignetteOpacity.value) / 100));
  document.documentElement.style.setProperty("--grain-opacity", String(Number(inputs.grainOpacity.value) / 100));

  document.documentElement.style.setProperty("--frame-color", inputs.frameColor.value);
  document.documentElement.style.setProperty("--frame-width", `${inputs.frameWidth.value}px`);
  document.documentElement.style.setProperty("--frame-radius", `${inputs.frameRadius.value}px`);
  document.documentElement.style.setProperty("--frame-shadow", `${inputs.frameShadow.value}px`);
}

function applyPosterStyles() {
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

function applyCanvasLayout() {
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

function applyManualView() {
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

function resetCamera() {
  state.map.jumpTo({
    center: [-64.18262, -31.42048],
    zoom: 13,
    pitch: 0,
    bearing: 0
  });
  inputs.pitchInput.value = "0";
  inputs.bearingInput.value = "0";
}

function applyAllStyleControls() {
  applyLayerVisibility();
  applyComponentColors();
  applyMapCanvasFilter();
  applyBaseLabelStyles();
  applyAtmosphereStyles();
  applyPosterStyles();
  applyCanvasLayout();
  applyCafeStyles();
}

function onStyleReady() {
  state.styleReady = true;
  classifyMapLayers();
  captureBaseLabelSizes();
  ensureCafeLayers();
  updateCafeSource(false);
  applyAllStyleControls();

  if (state.styleSwitching) {
    state.styleSwitching = false;
    setLoading(false);
  }
}

function switchBasemap(styleKey) {
  if (!styleUrls[styleKey]) {
    return;
  }
  if (styleKey === state.currentBasemap) {
    return;
  }

  state.currentBasemap = styleKey;
  state.styleReady = false;
  state.styleSwitching = true;
  setLoading(true, "Cambiando estilo base...");
  state.map.setStyle(styleUrls[styleKey]);
}

function setInputValue(element, value) {
  if (!element) {
    return;
  }

  if (element.type === "checkbox") {
    element.checked = Boolean(value);
    return;
  }

  element.value = String(value);
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  for (const [key, value] of Object.entries(preset)) {
    if (inputs[key]) {
      setInputValue(inputs[key], value);
    }
  }

  if (preset.basemapSelect) {
    switchBasemap(preset.basemapSelect);
  } else {
    applyAllStyleControls();
    updateCafeSource(false);
  }

  setStatus(`Preset aplicado: ${presetName}.`);
}

function resetGlobalFilters() {
  inputs.mapBrightness.value = "100";
  inputs.mapContrast.value = "100";
  inputs.mapSaturation.value = "100";
  inputs.mapGrayscale.value = "0";
  inputs.mapHue.value = "0";
  applyMapCanvasFilter();
}

function bindEvents() {
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
    inputs.bgColor,
    inputs.waterColor,
    inputs.waterOpacity,
    inputs.parkColor,
    inputs.parkOpacity,
    inputs.landuseColor,
    inputs.landuseOpacity,
    inputs.roadMajorColor,
    inputs.roadMajorOpacity,
    inputs.roadMinorColor,
    inputs.roadMinorOpacity,
    inputs.buildingColor,
    inputs.buildingOpacity,
    inputs.boundaryColor,
    inputs.boundaryOpacity
  ].forEach((el) => {
    el.addEventListener("input", applyComponentColors);
    el.addEventListener("change", applyComponentColors);
  });

  [inputs.mapBrightness, inputs.mapContrast, inputs.mapSaturation, inputs.mapGrayscale, inputs.mapHue].forEach((el) => {
    el.addEventListener("input", applyMapCanvasFilter);
    el.addEventListener("change", applyMapCanvasFilter);
  });

  inputs.resetGlobalFiltersBtn.addEventListener("click", resetGlobalFilters);

  [
    inputs.baseLabelColor,
    inputs.baseLabelOpacity,
    inputs.baseLabelHaloColor,
    inputs.baseLabelHaloWidth,
    inputs.baseLabelSizeScale,
    inputs.baseLabelTransform
  ].forEach((el) => {
    el.addEventListener("input", applyBaseLabelStyles);
    el.addEventListener("change", applyBaseLabelStyles);
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
    document.getElementById("appShell").classList.toggle("panel-hidden");
    setTimeout(() => {
      applyCanvasLayout();
      state.map?.resize();
    }, 120);
  });

  window.addEventListener("resize", () => {
    applyCanvasLayout();
  });
}

function initMap() {
  state.map = new maplibregl.Map({
    container: "map",
    style: styleUrls[state.currentBasemap],
    center: [-64.18262, -31.42048],
    zoom: 13,
    pitch: 0,
    bearing: 0,
    attributionControl: true,
    preserveDrawingBuffer: true
  });

  state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

  state.map.on("style.load", onStyleReady);

  state.map.on("load", async () => {
    state.mapReady = true;
    applyCanvasLayout();
    await loadDefaultMapData();
  });

  state.map.on("moveend", () => {
    const center = state.map.getCenter();
    inputs.centerLat.value = center.lat.toFixed(6);
    inputs.centerLng.value = center.lng.toFixed(6);
    inputs.zoomInput.value = String(Number(state.map.getZoom().toFixed(2)));
    inputs.pitchInput.value = String(Number(state.map.getPitch().toFixed(1)));
    inputs.bearingInput.value = String(Number(state.map.getBearing().toFixed(1)));
  });
}

function init() {
  inputs.sourceLink.href = defaultMyMapsUrl;
  inputs.sourceLink.textContent = "Abrir fuente";

  bindEvents();
  applyMapCanvasFilter();
  applyAtmosphereStyles();
  applyPosterStyles();
  initMap();
}

init();
