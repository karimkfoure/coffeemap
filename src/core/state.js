import { startupConfig } from "./constants.js";
import { cloneValue } from "./helpers.js";

export const state = {
  map: null,
  currentBasemap: startupConfig.basemap,
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
  baseLabelTextFields: new Map(),
  baseFeaturePaint: new Map(),
  styleEntitiesByKey: new Map(),
  styleControlAvailability: {
    componentStyles: {}
  },
  mapReady: false,
  styleReady: false,
  config: cloneValue(startupConfig),
  styleSnapshot: null
};

export const cafeSourceId = "cafes-source";
export const cafeShadowLayerId = "cafes-shadow";
export const cafeHaloLayerId = "cafes-halo";
export const cafeCoreLayerId = "cafes-core";
export const cafeLabelLayerId = "cafes-label";
