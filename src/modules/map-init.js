import { styleUrls } from "../core/constants.js";
import { state } from "../core/state.js";
import { renderInputsFromConfig, updateConfig } from "./config-state.js";

export function initMap({ onStyleLoad, onInitialLoad, onMoveEnd }) {
  const maplibre = window.maplibregl;

  if (!maplibre) {
    throw new Error("MapLibre no esta disponible en window.maplibregl");
  }

  state.map = new maplibre.Map({
    container: "map",
    style: styleUrls[state.currentBasemap],
    center: state.config.camera.center,
    zoom: state.config.camera.zoom,
    pitch: state.config.camera.pitch,
    bearing: state.config.camera.bearing,
    attributionControl: true,
    preserveDrawingBuffer: true
  });
  window.__COFFEEMAP_MAP__ = state.map;

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
    updateConfig("camera", {
      center: [Number(center.lng.toFixed(6)), Number(center.lat.toFixed(6))],
      zoom: Number(state.map.getZoom().toFixed(2)),
      pitch: Number(state.map.getPitch().toFixed(1)),
      bearing: Number(state.map.getBearing().toFixed(1))
    });
    renderInputsFromConfig(state.config);
    onMoveEnd?.();
  });
}
