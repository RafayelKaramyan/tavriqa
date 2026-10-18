import type { FeatureCollection } from 'geojson';
import land from './land.json';

// Natural Earth 1:110m land contains Polygon features. Rebuild the small typed
// surface rather than asserting widened JSON strings and bounding-box arrays.
export const geography: FeatureCollection = {
  type: 'FeatureCollection',
  features: land.features.map((feature) => {
    if (feature.geometry.type !== 'Polygon') throw new Error('Unsupported land geometry.');
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: feature.geometry.coordinates },
    };
  }),
};
