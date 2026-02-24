const defaultPoints = [
  { name: "Bruncheria", lat: -31.4119, lng: -64.1917 },
  { name: "Le Dureau", lat: -31.4233, lng: -64.1892 },
  { name: "Krake Cafe", lat: -31.4283, lng: -64.1822 },
  { name: "Lado B", lat: -31.4325, lng: -64.1754 },
  { name: "Comadreja", lat: -31.4175, lng: -64.1749 }
];

const inputs = {
  myMapsUrl: document.getElementById("myMapsUrl"),
  importMyMapsBtn: document.getElementById("importMyMapsBtn"),
  fileInput: document.getElementById("fileInput"),
  pasteInput: document.getElementById("pasteInput"),
  loadPasteBtn: document.getElementById("loadPasteBtn"),
  layerFilter: document.getElementById("layerFilter"),
  status: document.getElementById("status"),
  basemapSelect: document.getElementById("basemapSelect"),
  tileOpacity: document.getElementById("tileOpacity"),
  markerColor: document.getElementById("markerColor"),
  markerStroke: document.getElementById("markerStroke"),
  markerRadius: document.getElementById("markerRadius"),
  markerOpacity: document.getElementById("markerOpacity"),
  strokeWeight: document.getElementById("strokeWeight"),
  showLabels: document.getElementById("showLabels"),
  labelColor: document.getElementById("labelColor"),
  labelSize: document.getElementById("labelSize"),
  centerLat: document.getElementById("centerLat"),
  centerLng: document.getElementById("centerLng"),
  zoomInput: document.getElementById("zoomInput"),
  applyViewBtn: document.getElementById("applyViewBtn"),
  fitBtn: document.getElementById("fitBtn"),
  togglePanelBtn: document.getElementById("togglePanelBtn")
};

const baseLayersConfig = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  lightNoLabels: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }
};

const map = L.map("map", {
  zoomControl: false,
  attributionControl: true
}).setView([-31.42048, -64.18262], 13);

L.control.zoom({ position: "bottomright" }).addTo(map);

let currentTile = null;
let markerLayer = L.layerGroup().addTo(map);
let allPoints = [...defaultPoints];
let points = [...defaultPoints];
const myMapsUrlStorageKey = "bike-coffee-my-maps-url";

function setStatus(message) {
  inputs.status.textContent = message;
}

function setBaseLayer(name) {
  if (!baseLayersConfig[name]) {
    return;
  }

  if (currentTile) {
    map.removeLayer(currentTile);
  }

  currentTile = L.tileLayer(baseLayersConfig[name].url, {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: baseLayersConfig[name].attribution,
    opacity: Number(inputs.tileOpacity.value) / 100
  });

  currentTile.addTo(map);
}

function renderMarkers() {
  markerLayer.clearLayers();

  const fillColor = inputs.markerColor.value;
  const strokeColor = inputs.markerStroke.value;
  const radius = Number(inputs.markerRadius.value);
  const fillOpacity = Number(inputs.markerOpacity.value) / 100;
  const weight = Number(inputs.strokeWeight.value);
  const labelsEnabled = inputs.showLabels.checked;

  document.documentElement.style.setProperty("--label-size", `${inputs.labelSize.value}px`);
  document.documentElement.style.setProperty("--label-color", inputs.labelColor.value);

  for (const point of points) {
    const marker = L.circleMarker([point.lat, point.lng], {
      radius,
      fillColor,
      color: strokeColor,
      weight,
      opacity: 1,
      fillOpacity
    }).addTo(markerLayer);

    if (labelsEnabled && point.name) {
      marker.bindTooltip(point.name, {
        permanent: true,
        direction: "top",
        offset: [0, -(radius + 6)],
        className: "cafe-label"
      });
    }
  }
}

function fitToData() {
  if (!points.length) {
    return;
  }

  const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
  map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });

  const center = map.getCenter();
  inputs.centerLat.value = center.lat.toFixed(6);
  inputs.centerLng.value = center.lng.toFixed(6);
  inputs.zoomInput.value = String(map.getZoom());
}

function normalizeMarker(raw, fallbackName = "Cafe") {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  let lat = raw.lat ?? raw.latitude;
  let lng = raw.lng ?? raw.lon ?? raw.longitude ?? raw.long;

  if (lat == null && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    lng = raw.coordinates[0];
    lat = raw.coordinates[1];
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return null;
  }

  const name = String(raw.name ?? raw.title ?? raw.label ?? fallbackName).trim() || fallbackName;
  const layer = String(raw.layer ?? raw.folder ?? "").trim();

  return { name, lat: parsedLat, lng: parsedLng, layer };
}

function parseGeoJSON(data) {
  const parsed = [];

  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    for (const feature of data.features) {
      if (!feature || feature.type !== "Feature") {
        continue;
      }

      const geometry = feature.geometry;
      if (!geometry) {
        continue;
      }

      if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
        const item = normalizeMarker(
          {
            ...feature.properties,
            coordinates: geometry.coordinates
          },
          "Cafe"
        );
        if (item) {
          parsed.push(item);
        }
      }
    }

    return parsed;
  }

  if (data.type === "Feature" && data.geometry?.type === "Point") {
    const item = normalizeMarker(
      {
        ...data.properties,
        coordinates: data.geometry.coordinates
      },
      "Cafe"
    );
    return item ? [item] : [];
  }

  return parsed;
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

    const firstCoordTuple = coordNode.textContent.trim().split(/\s+/)[0];
    const rawCoords = firstCoordTuple.split(",");
    const lng = Number(rawCoords[0]);
    const lat = Number(rawCoords[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const nameNode = placemark.querySelector("name");
    const name = (nameNode?.textContent || "Cafe").trim() || "Cafe";
    const layer = resolveLayerName(placemark);
    parsed.push({ name, lat, lng, layer });
  }

  return parsed;
}

function parseInputText(text, fileName = "") {
  if (!text.trim()) {
    throw new Error("Entrada vacia");
  }

  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".kml")) {
    return parseKML(text);
  }

  let parsedJSON;
  try {
    parsedJSON = JSON.parse(text);
  } catch {
    if (text.includes("<kml") || text.includes("<Placemark")) {
      return parseKML(text);
    }
    throw new Error("No se pudo parsear JSON/KML");
  }

  if (Array.isArray(parsedJSON)) {
    return parsedJSON.map((item) => normalizeMarker(item)).filter(Boolean);
  }

  if (parsedJSON && typeof parsedJSON === "object") {
    const geoJSONResult = parseGeoJSON(parsedJSON);
    if (geoJSONResult.length) {
      return geoJSONResult;
    }

    const single = normalizeMarker(parsedJSON);
    return single ? [single] : [];
  }

  return [];
}

function getLayerNames(fromPoints) {
  const names = new Set();
  for (const point of fromPoints) {
    if (point.layer) {
      names.add(point.layer);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function syncLayerFilterOptions(fromPoints) {
  const layerNames = getLayerNames(fromPoints);
  const previousValue = inputs.layerFilter.value;

  inputs.layerFilter.innerHTML = "";
  inputs.layerFilter.append(new Option("Todos", ""));
  for (const layerName of layerNames) {
    inputs.layerFilter.append(new Option(layerName, layerName));
  }

  if (layerNames.includes(previousValue)) {
    inputs.layerFilter.value = previousValue;
  } else {
    inputs.layerFilter.value = "";
  }
}

function applyLayerFilter() {
  const selectedLayer = inputs.layerFilter.value;
  if (!selectedLayer) {
    points = [...allPoints];
  } else {
    points = allPoints.filter((point) => point.layer === selectedLayer);
  }

  renderMarkers();
  fitToData();
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
  const value = rawInput.trim();
  if (!value) {
    throw new Error("Falta URL o MID de Google My Maps.");
  }

  if (value.includes("/maps/d/kml") || value.includes("output=kml")) {
    return value;
  }

  const mid = extractMidFromMyMapsUrl(value);
  if (!mid) {
    throw new Error("No se encontro MID en la URL de Google My Maps.");
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
    { url: kmlUrl, label: "directo" },
    { url: proxyUrl, label: "proxy" }
  ];
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const text = await fetchText(candidate.url);
      if (!text.includes("<kml") && !text.includes("<Placemark")) {
        throw new Error("Respuesta no parece KML");
      }
      const loadedPoints = parseInputText(text, "mymaps.kml");
      return { loadedPoints, sourceUrl: kmlUrl, mode: candidate.label };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo descargar el KML desde My Maps. Verifica que el mapa sea publico. ${lastError?.message || ""}`.trim()
  );
}

function updatePoints(newPoints, sourceLabel) {
  if (!newPoints.length) {
    setStatus(`No se encontraron puntos validos en ${sourceLabel}.`);
    return;
  }

  const unique = new Map();
  for (const point of newPoints) {
    const key = `${point.name}-${point.lat.toFixed(6)}-${point.lng.toFixed(6)}`;
    unique.set(key, point);
  }

  allPoints = [...unique.values()];
  syncLayerFilterOptions(allPoints);
  applyLayerFilter();

  const activeLayerLabel = inputs.layerFilter.value ? ` (layer: ${inputs.layerFilter.value})` : "";
  setStatus(`Cargados ${allPoints.length} markers desde ${sourceLabel}${activeLayerLabel}.`);
}

function applyManualView() {
  const lat = Number(inputs.centerLat.value);
  const lng = Number(inputs.centerLng.value);
  const zoom = Number(inputs.zoomInput.value);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) {
    setStatus("Lat/Lng/Zoom invalidos.");
    return;
  }

  map.setView([lat, lng], zoom);
}

function bindEvents() {
  inputs.layerFilter.addEventListener("change", applyLayerFilter);

  inputs.myMapsUrl.addEventListener("change", () => {
    const value = inputs.myMapsUrl.value.trim();
    if (value) {
      localStorage.setItem(myMapsUrlStorageKey, value);
    } else {
      localStorage.removeItem(myMapsUrlStorageKey);
    }
  });

  inputs.importMyMapsBtn.addEventListener("click", async () => {
    try {
      setStatus("Descargando KML desde Google My Maps...");
      const { loadedPoints, sourceUrl, mode } = await loadPointsFromMyMaps(inputs.myMapsUrl.value);
      localStorage.setItem(myMapsUrlStorageKey, inputs.myMapsUrl.value.trim());
      updatePoints(loadedPoints, `My Maps (${mode})`);
      setStatus(`Cargados ${allPoints.length} markers desde My Maps. Fuente: ${sourceUrl}`);
    } catch (error) {
      setStatus(`Error importando My Maps: ${error.message}`);
    }
  });

  inputs.basemapSelect.addEventListener("change", () => {
    setBaseLayer(inputs.basemapSelect.value);
  });

  inputs.tileOpacity.addEventListener("input", () => {
    if (currentTile) {
      currentTile.setOpacity(Number(inputs.tileOpacity.value) / 100);
    }
  });

  [
    inputs.markerColor,
    inputs.markerStroke,
    inputs.markerRadius,
    inputs.markerOpacity,
    inputs.strokeWeight,
    inputs.showLabels,
    inputs.labelColor,
    inputs.labelSize
  ].forEach((input) => {
    input.addEventListener("input", renderMarkers);
    input.addEventListener("change", renderMarkers);
  });

  inputs.applyViewBtn.addEventListener("click", applyManualView);
  inputs.fitBtn.addEventListener("click", fitToData);

  inputs.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const loaded = parseInputText(content, file.name);
      updatePoints(loaded, file.name);
    } catch (error) {
      setStatus(`Error cargando archivo: ${error.message}`);
    }
  });

  inputs.loadPasteBtn.addEventListener("click", () => {
    try {
      const loaded = parseInputText(inputs.pasteInput.value, "pegado");
      updatePoints(loaded, "texto pegado");
    } catch (error) {
      setStatus(`Error parseando input pegado: ${error.message}`);
    }
  });

  inputs.togglePanelBtn.addEventListener("click", () => {
    document.getElementById("appShell").classList.toggle("panel-hidden");
  });

  map.on("moveend", () => {
    const center = map.getCenter();
    inputs.centerLat.value = center.lat.toFixed(6);
    inputs.centerLng.value = center.lng.toFixed(6);
    inputs.zoomInput.value = String(map.getZoom());
  });
}

function init() {
  const rememberedMyMapsUrl = localStorage.getItem(myMapsUrlStorageKey);
  if (rememberedMyMapsUrl) {
    inputs.myMapsUrl.value = rememberedMyMapsUrl;
  }

  setBaseLayer(inputs.basemapSelect.value);
  bindEvents();
  syncLayerFilterOptions(allPoints);
  renderMarkers();
  fitToData();
  setStatus("Demo cargado. Importa tu archivo para reemplazar markers.");
}

init();
