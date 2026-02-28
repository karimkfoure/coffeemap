import {
  cafeAccentLayerId,
  cafeCoreLayerId,
  cafeHaloLayerId,
  cafeLabelLayerId,
  cafeMarkerIndexLayerId,
  cafeShadowLayerId,
  cafeSourceId,
  state
} from "../core/state.js";
import { hashSeed, hexToRgba } from "../core/helpers.js";
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildMarkerVariantStyle(cafeStyles) {
  const variant = cafeStyles.markerVariant || "badge";
  const radius = Number(cafeStyles.markerRadius);
  const strokeWeight = Number(cafeStyles.strokeWeight);
  const haloSize = Number(cafeStyles.haloSize);
  const markerOpacity = Number(cafeStyles.markerOpacity) / 100;
  const haloOpacity = Number(cafeStyles.haloOpacity) / 100;

  const styles = {
    shadow: {
      color: cafeStyles.shadowColor,
      radius: radius + 2,
      opacity: Number(cafeStyles.shadowOpacity) / 100,
      blur: Number(cafeStyles.shadowBlur),
      translate: [Number(cafeStyles.shadowOffsetX), Number(cafeStyles.shadowOffsetY)]
    },
    halo: {
      color: cafeStyles.haloColor,
      radius: radius + haloSize,
      opacity: haloOpacity
    },
    accent: {
      color: cafeStyles.markerStroke,
      radius: Math.max(2, radius * 0.42),
      opacity: 0
    },
    core: {
      color: cafeStyles.markerColor,
      strokeColor: cafeStyles.markerStroke,
      strokeWidth: strokeWeight,
      radius,
      opacity: markerOpacity
    },
    index: {
      visible: Boolean(cafeStyles.showMarkerIndex),
      size: clamp(radius * 1.05, 9, 18),
      color: cafeStyles.markerStroke,
      haloColor: cafeStyles.markerColor,
      haloWidth: 0.8,
      opacity: 1,
      offset: [0, 0]
    }
  };

  switch (variant) {
    case "dot":
      styles.halo.radius = radius + Math.max(2, haloSize * 0.55);
      styles.halo.opacity = haloOpacity * 0.55;
      styles.core.strokeWidth = Math.max(1, strokeWeight * 0.75);
      styles.index.size = clamp(radius * 0.95, 9, 15);
      styles.index.haloWidth = 0.65;
      break;
    case "ring":
      styles.halo.radius = radius + Math.max(4, haloSize * 0.75);
      styles.halo.opacity = haloOpacity * 0.72;
      styles.core.color = hexToRgba(cafeStyles.markerColor, 0);
      styles.core.strokeColor = cafeStyles.markerColor;
      styles.core.strokeWidth = Math.max(2, strokeWeight + 1.5);
      styles.index.size = clamp(radius * 1.12, 10, 18);
      styles.index.color = cafeStyles.markerColor;
      styles.index.haloColor = cafeStyles.markerStroke;
      styles.index.haloWidth = 0.75;
      break;
    case "target":
      styles.halo.radius = radius + Math.max(5, haloSize * 0.7);
      styles.halo.opacity = haloOpacity * 0.65;
      styles.accent.opacity = markerOpacity;
      styles.core.color = hexToRgba(cafeStyles.markerColor, 0);
      styles.core.strokeColor = cafeStyles.markerColor;
      styles.core.strokeWidth = Math.max(2, strokeWeight + 1);
      styles.index.size = clamp(radius * 0.95, 9, 15);
      styles.index.color = cafeStyles.markerColor;
      styles.index.haloColor = cafeStyles.markerStroke;
      styles.index.haloWidth = 0.55;
      break;
    case "badge":
    default:
      styles.index.size = clamp(radius * 1.05, 10, 18);
      break;
  }

  return styles;
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
          markerIndex: String(index + 1),
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

  if (!state.map.getLayer(cafeAccentLayerId)) {
    state.map.addLayer({
      id: cafeAccentLayerId,
      type: "circle",
      source: cafeSourceId,
      paint: {
        "circle-color": "#fff4e8",
        "circle-radius": 4,
        "circle-opacity": 0
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

  if (!state.map.getLayer(cafeMarkerIndexLayerId)) {
    state.map.addLayer({
      id: cafeMarkerIndexLayerId,
      type: "symbol",
      source: cafeSourceId,
      layout: {
        "text-field": ["get", "markerIndex"],
        "text-size": 11,
        "text-anchor": "center",
        "text-offset": [0, 0],
        "text-font": ["Noto Sans Regular"],
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "#fff4e8",
        "text-halo-color": "#d24828",
        "text-halo-width": 0.8,
        "text-opacity": 0
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
  const variantStyles = buildMarkerVariantStyle(cafeStyles);

  safeSetPaint(cafeShadowLayerId, "circle-color", variantStyles.shadow.color);
  safeSetPaint(cafeShadowLayerId, "circle-radius", variantStyles.shadow.radius);
  safeSetPaint(cafeShadowLayerId, "circle-opacity", variantStyles.shadow.opacity);
  safeSetPaint(cafeShadowLayerId, "circle-blur", variantStyles.shadow.blur);
  safeSetPaint(cafeShadowLayerId, "circle-translate", variantStyles.shadow.translate);

  safeSetPaint(cafeHaloLayerId, "circle-color", variantStyles.halo.color);
  safeSetPaint(cafeHaloLayerId, "circle-radius", variantStyles.halo.radius);
  safeSetPaint(cafeHaloLayerId, "circle-opacity", variantStyles.halo.opacity);

  safeSetLayout(cafeAccentLayerId, "visibility", variantStyles.accent.opacity > 0 ? "visible" : "none");
  safeSetPaint(cafeAccentLayerId, "circle-color", variantStyles.accent.color);
  safeSetPaint(cafeAccentLayerId, "circle-radius", variantStyles.accent.radius);
  safeSetPaint(cafeAccentLayerId, "circle-opacity", variantStyles.accent.opacity);

  safeSetPaint(cafeCoreLayerId, "circle-color", variantStyles.core.color);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-color", variantStyles.core.strokeColor);
  safeSetPaint(cafeCoreLayerId, "circle-stroke-width", variantStyles.core.strokeWidth);
  safeSetPaint(cafeCoreLayerId, "circle-radius", variantStyles.core.radius);
  safeSetPaint(cafeCoreLayerId, "circle-opacity", variantStyles.core.opacity);

  safeSetLayout(cafeMarkerIndexLayerId, "visibility", variantStyles.index.visible ? "visible" : "none");
  safeSetLayout(cafeMarkerIndexLayerId, "text-size", variantStyles.index.size);
  safeSetLayout(cafeMarkerIndexLayerId, "text-offset", variantStyles.index.offset);
  safeSetPaint(cafeMarkerIndexLayerId, "text-color", variantStyles.index.color);
  safeSetPaint(cafeMarkerIndexLayerId, "text-halo-color", variantStyles.index.haloColor);
  safeSetPaint(cafeMarkerIndexLayerId, "text-halo-width", variantStyles.index.haloWidth);
  safeSetPaint(cafeMarkerIndexLayerId, "text-opacity", variantStyles.index.visible ? variantStyles.index.opacity : 0);

  const labelVisible = cafeStyles.showLabels ? "visible" : "none";
  const labelSize = Number(cafeStyles.labelSize);
  safeSetLayout(cafeLabelLayerId, "visibility", labelVisible);
  safeSetLayout(cafeLabelLayerId, "text-size", labelSize);
  safeSetLayout(cafeLabelLayerId, "text-letter-spacing", Number(cafeStyles.labelLetterSpacing));

  const offsetXEm = Number(cafeStyles.labelOffsetX) / labelSize;
  const offsetYEm = Number(cafeStyles.labelOffsetY) / labelSize;
  safeSetLayout(cafeLabelLayerId, "text-offset", [offsetXEm, offsetYEm]);

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
