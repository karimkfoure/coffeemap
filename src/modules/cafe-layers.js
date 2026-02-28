import {
  cafeCoreLayerId,
  cafeHaloLayerId,
  cafeLabelLayerId,
  cafeShadowLayerId,
  cafeSourceId,
  state
} from "../core/state.js";
import { hashSeed } from "../core/helpers.js";
import { safeSetLayout, safeSetPaint } from "./map-style.js";

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
  const mode = state.config.cafeStyles.labelTransform;
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
  if (state.config.cafeStyles.labelMode === "index") {
    return String(index + 1);
  }
  if (state.config.cafeStyles.labelMode === "indexName") {
    return `${index + 1}. ${point.name}`;
  }
  return point.name;
}

function buildCafeGeoJSON() {
  const jitter = Number(state.config.cafeStyles.jitterMeters);

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

export function ensureCafeLayers() {
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
        "text-font": ["Noto Sans Regular"]
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

export function applyCafeStyles() {
  if (!state.styleReady || !state.map.getLayer(cafeCoreLayerId)) {
    return;
  }

  const cafeStyles = state.config.cafeStyles;
  const radius = Number(cafeStyles.markerRadius);

  safeSetPaint(cafeShadowLayerId, "circle-color", cafeStyles.shadowColor);
  safeSetPaint(cafeShadowLayerId, "circle-radius", radius + 2);
  safeSetPaint(cafeShadowLayerId, "circle-opacity", Number(cafeStyles.shadowOpacity) / 100);
  safeSetPaint(cafeShadowLayerId, "circle-blur", Number(cafeStyles.shadowBlur));
  safeSetPaint(cafeShadowLayerId, "circle-translate", [
    Number(cafeStyles.shadowOffsetX),
    Number(cafeStyles.shadowOffsetY)
  ]);

  safeSetPaint(cafeHaloLayerId, "circle-color", cafeStyles.haloColor);
  safeSetPaint(cafeHaloLayerId, "circle-radius", radius + Number(cafeStyles.haloSize));
  safeSetPaint(cafeHaloLayerId, "circle-opacity", Number(cafeStyles.haloOpacity) / 100);

  safeSetPaint(cafeCoreLayerId, "circle-color", cafeStyles.markerColor);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-color", cafeStyles.markerStroke);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-width", Number(cafeStyles.strokeWeight));
  safeSetPaint(cafeCoreLayerId, "circle-radius", radius);
  safeSetPaint(cafeCoreLayerId, "circle-opacity", Number(cafeStyles.markerOpacity) / 100);

  const labelVisible = cafeStyles.showLabels ? "visible" : "none";
  const labelSize = Number(cafeStyles.labelSize);
  safeSetLayout(cafeLabelLayerId, "visibility", labelVisible);
  safeSetLayout(cafeLabelLayerId, "text-size", labelSize);
  safeSetLayout(cafeLabelLayerId, "text-letter-spacing", Number(cafeStyles.labelLetterSpacing));

  const offsetEm = Number(cafeStyles.labelOffsetY) / labelSize;
  safeSetLayout(cafeLabelLayerId, "text-offset", [0, offsetEm]);

  safeSetPaint(cafeLabelLayerId, "text-color", cafeStyles.labelColor);
  safeSetPaint(cafeLabelLayerId, "text-halo-color", cafeStyles.labelHaloColor);
  safeSetPaint(cafeLabelLayerId, "text-halo-width", Number(cafeStyles.labelHaloWidth));
}

export function updateCafeSource(shouldFit = false) {
  if (!state.styleReady || !state.map.getSource(cafeSourceId)) {
    return;
  }

  const geojson = buildCafeGeoJSON();
  state.map.getSource(cafeSourceId).setData(geojson);

  if (shouldFit) {
    fitToData();
  }
}

export function fitToData() {
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

  const padding = Number(state.config.canvas.fitPadding);
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
