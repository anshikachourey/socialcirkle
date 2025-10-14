// src/features/map/geo.ts

type LatLng = { lat: number; lng: number };

// approximate earth radius in meters
const R = 6378137;

// returns a GeoJSON FeatureCollection with one polygon circle
export function makeCircleGeoJSON(center: LatLng, radiusMeters: number, steps = 64) {
  const coords: [number, number][] = [];
  const lat = (center.lat * Math.PI) / 180;
  const lng = (center.lng * Math.PI) / 180;

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters / R) * Math.sin(theta);
    const dLng = (radiusMeters / (R * Math.cos(lat))) * Math.cos(theta);
    const lat2 = lat + dLat;
    const lng2 = lng + dLng;
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: {},
      },
    ],
  };
}
