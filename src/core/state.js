import { inputs } from "./inputs.js";

export const state = {
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
  baseFeaturePaint: new Map(),
  styleEntitiesByKey: new Map(),
  mapReady: false,
  styleReady: false,
  componentStyleOverridesEnabled: false,
  baseLabelStyleOverridesEnabled: false
};

export const cafeSourceId = "cafes-source";
export const cafeShadowLayerId = "cafes-shadow";
export const cafeHaloLayerId = "cafes-halo";
export const cafeCoreLayerId = "cafes-core";
export const cafeLabelLayerId = "cafes-label";
