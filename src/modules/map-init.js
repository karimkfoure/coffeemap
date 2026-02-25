import { defaultCamera, styleUrls } from "../core/constants.js";
import { inputs } from "../core/inputs.js";
import { state } from "../core/state.js";

export function initMap({ onStyleLoad, onInitialLoad, onMoveEnd }) {
  const maplibre = window.maplibregl;

  if (!maplibre) {
    throw new Error("MapLibre no esta disponible en window.maplibregl");
  }

  state.map = new maplibre.Map({
    container: "map",
    style: styleUrls[state.currentBasemap],
    center: defaultCamera.center,
    zoom: defaultCamera.zoom,
    pitch: defaultCamera.pitch,
    bearing: defaultCamera.bearing,
    attributionControl: true,
    preserveDrawingBuffer: true
  });
  window.__MECHIMAP_MAP__ = state.map;

  state.map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");

  state.map.on("style.load", () => {
    onStyleLoad?.();
  });

  state.map.on("load", async () => {
    state.mapReady = true;
    await onInitialLoad();
  });

  state.map.on("moveend", () => {
    const center = state.map.getCenter();
    inputs.centerLat.value = center.lat.toFixed(6);
    inputs.centerLng.value = center.lng.toFixed(6);
    inputs.zoomInput.value = String(Number(state.map.getZoom().toFixed(2)));
    inputs.pitchInput.value = String(Number(state.map.getPitch().toFixed(1)));
    inputs.bearingInput.value = String(Number(state.map.getBearing().toFixed(1)));
    onMoveEnd?.();
  });
}
