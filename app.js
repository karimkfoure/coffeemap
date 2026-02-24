const defaultPoints = [
  { name: "Bruncheria", lat: -31.4119, lng: -64.1917 },
  { name: "Le Dureau", lat: -31.4233, lng: -64.1892 },
  { name: "Krake Cafe", lat: -31.4283, lng: -64.1822 },
  { name: "Lado B", lat: -31.4325, lng: -64.1754 },
  { name: "Comadreja", lat: -31.4175, lng: -64.1749 }
];

const inputs = {
  fileInput: document.getElementById("fileInput"),
  pasteInput: document.getElementById("pasteInput"),
  loadPasteBtn: document.getElementById("loadPasteBtn"),
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
let points = [...defaultPoints];

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

  return { name, lat: parsedLat, lng: parsedLng };
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

  for (const placemark of placemarks) {
    const coordNode = placemark.querySelector("Point > coordinates");
    if (!coordNode || !coordNode.textContent) {
      continue;
    }

    const rawCoords = coordNode.textContent.trim().split(",");
    const lng = Number(rawCoords[0]);
    const lat = Number(rawCoords[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const nameNode = placemark.querySelector("name");
    const name = (nameNode?.textContent || "Cafe").trim() || "Cafe";
    parsed.push({ name, lat, lng });
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

  points = [...unique.values()];
  renderMarkers();
  fitToData();
  setStatus(`Cargados ${points.length} markers desde ${sourceLabel}.`);
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
  setBaseLayer(inputs.basemapSelect.value);
  bindEvents();
  renderMarkers();
  fitToData();
  setStatus("Demo cargado. Importa tu archivo para reemplazar markers.");
}

init();
