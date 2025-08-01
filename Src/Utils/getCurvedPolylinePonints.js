// utils/getCurvedPolylinePoints.js

// import { interpolate } from 'd3-interpolate'; // Optional, or use your own linear interpolation

export const getCurvedPolylinePoints = (start, end, curvature = 0.2, numPoints = 100) => {
  const lat1 = start.latitude;
  const lon1 = start.longitude;
  const lat2 = end.latitude;
  const lon2 = end.longitude;

  // Midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;

  // Add curvature by offsetting midpoint
  const curveLat = midLat + (lat2 - lat1) * curvature;
  const curveLon = midLon - (lon2 - lon1) * curvature;

  // Quadratic Bezier curve generation
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat =
      (1 - t) * (1 - t) * lat1 +
      2 * (1 - t) * t * curveLat +
      t * t * lat2;
    const lon =
      (1 - t) * (1 - t) * lon1 +
      2 * (1 - t) * t * curveLon +
      t * t * lon2;
    points.push({ latitude: lat, longitude: lon });
  }

  return points;
};
