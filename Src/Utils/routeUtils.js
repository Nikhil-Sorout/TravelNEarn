/**
 * Route utilities for map display and route fitting
 */

/**
 * Decode Google Maps polyline string to coordinates array
 * @param {string} encoded - Encoded polyline string from Google Directions API
 * @returns {Array} Array of coordinate objects with latitude and longitude
 */
export const decodePolyline = (encoded) => {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

/**
 * Calculate map region to fit entire route with padding
 * @param {Array} routeCoordinates - Array of route coordinates
 * @param {Object} origin - Origin coordinates {latitude, longitude}
 * @param {Object} destination - Destination coordinates {latitude, longitude}
 * @param {number} padding - Padding percentage (default: 0.1 = 10%)
 * @returns {Object} Map region object
 */
export const calculateRouteRegion = (routeCoordinates, origin, destination, padding = 0.1) => {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return null;
  }

  // Start with origin and destination bounds
  let minLat = Math.min(origin.latitude, destination.latitude);
  let maxLat = Math.max(origin.latitude, destination.latitude);
  let minLng = Math.min(origin.longitude, destination.longitude);
  let maxLng = Math.max(origin.longitude, destination.longitude);

  // Include route coordinates in bounds calculation
  routeCoordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  // Add padding to the bounds
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) + latPadding,
    longitudeDelta: (maxLng - minLng) + lngPadding,
  };
};

/**
 * Fit map to show entire route
 * @param {Object} mapRef - Reference to MapView component
 * @param {Array} routeCoordinates - Array of route coordinates
 * @param {Object} origin - Origin coordinates
 * @param {Object} destination - Destination coordinates
 * @param {number} animationDuration - Animation duration in milliseconds
 * @param {number} padding - Padding percentage
 */
export const fitMapToRoute = (
  mapRef, 
  routeCoordinates, 
  origin, 
  destination, 
  animationDuration = 1000,
  padding = 0.1
) => {
  if (!mapRef?.current || !routeCoordinates || routeCoordinates.length === 0) {
    return;
  }

  const region = calculateRouteRegion(routeCoordinates, origin, destination, padding);
  
  if (region) {
    mapRef.current.animateToRegion(region, animationDuration);
  }
};

/**
 * Fetch route from Google Directions API
 * @param {string} origin - Origin address
 * @param {string} destination - Destination address
 * @param {string} apiKey - Google Maps API key
 * @param {string} mode - Travel mode (driving, walking, bicycling, transit)
 * @returns {Promise} Promise resolving to route data
 */
export const fetchRoute = async (origin, destination, apiKey, mode = 'driving') => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const points = route.overview_polyline.points;
      const decodedCoordinates = decodePolyline(points);
      
      return {
        coordinates: decodedCoordinates,
        distance: route.legs[0]?.distance?.text || '',
        duration: route.legs[0]?.duration?.text || '',
        polyline: points,
        routeData: route
      };
    } else {
      throw new Error(data.error_message || "No routes found");
    }
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

/**
 * Format duration for display
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (durationMinutes) => {
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)}min`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.round(durationMinutes % 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

/**
 * Get route color based on travel mode
 * @param {string} mode - Travel mode
 * @returns {string} Color hex code
 */
export const getRouteColor = (mode = 'driving') => {
  const colors = {
    driving: '#D83F3F',
    walking: '#4CAF50',
    bicycling: '#2196F3',
    transit: '#FF9800'
  };
  return colors[mode] || colors.driving;
};

/**
 * Get route stroke width based on travel mode
 * @param {string} mode - Travel mode
 * @returns {number} Stroke width
 */
export const getRouteStrokeWidth = (mode = 'driving') => {
  const widths = {
    driving: 4,
    walking: 3,
    bicycling: 3,
    transit: 4
  };
  return widths[mode] || widths.driving;
};

/**
 * Validate coordinates
 * @param {Object} coord - Coordinate object
 * @returns {boolean} True if coordinates are valid
 */
export const isValidCoordinate = (coord) => {
  return coord && 
         typeof coord.latitude === 'number' && 
         typeof coord.longitude === 'number' &&
         coord.latitude >= -90 && coord.latitude <= 90 &&
         coord.longitude >= -180 && coord.longitude <= 180;
};

/**
 * Get default map region for India
 * @returns {Object} Default map region
 */
export const getDefaultRegion = () => {
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };
}; 