import * as Location from "expo-location";

const requestPermissions = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

export const getCoordinatesFromAddress = async (address) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;
    console.log(address)
  try {
    const geocodedLocations = await Location.geocodeAsync(address);
    if (geocodedLocations.length > 0) {
      const { latitude, longitude } = geocodedLocations[0];
      console.log('Latitude:', latitude, 'Longitude:', longitude);
      return { latitude, longitude };
    } else {
      console.log('No results found');
    }
  } catch (error) {
    console.error('Error during geocoding:', error);
  }
};

/**
 * Comprehensive address parser that handles various address formats
 * @param {string} address - The full address string
 * @returns {object} - Parsed address components
 */
export const parseAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return {
      area: '',
      pincode: '',
      city: '',
      state: '',
      country: ''
    };
  }

  // Clean the address string
  const cleanAddress = address.trim().replace(/\s+/g, ' ');
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
  
  let area = '';
  let pincode = '';
  let city = '';
  let state = '';
  let country = '';

  // Extract pincode first (6-digit number)
  const pincodeRegex = /\b\d{6}\b/;
  const pincodeMatch = cleanAddress.match(pincodeRegex);
  if (pincodeMatch) {
    pincode = pincodeMatch[0];
  }

  // Handle different address formats based on number of parts
  if (parts.length === 1) {
    // Single part address (e.g., "Mumbai, Maharashtra 400001")
    const singlePart = parts[0];
    const pincodeInPart = singlePart.match(pincodeRegex);
    if (pincodeInPart) {
      const beforePincode = singlePart.substring(0, pincodeInPart.index).trim();
      const afterPincode = singlePart.substring(pincodeInPart.index + 6).trim();
      
      // Try to extract city and state from the remaining parts
      const remainingParts = [beforePincode, afterPincode].filter(part => part.length > 0);
      if (remainingParts.length >= 2) {
        city = remainingParts[0];
        state = remainingParts[1];
      } else if (remainingParts.length === 1) {
        city = remainingParts[0];
      }
      area = city; // Use city as area for single part addresses
    } else {
      area = singlePart;
    }
  } else if (parts.length === 2) {
    // Two part address (e.g., "Mumbai, Maharashtra")
    city = parts[0];
    state = parts[1];
    area = city;
  } else if (parts.length === 3) {
    // Three part address (e.g., "Andheri, Mumbai, Maharashtra")
    area = parts[0];
    city = parts[1];
    state = parts[2];
  } else if (parts.length >= 4) {
    // Four or more parts - use the original logic but improved
    // Last part is usually country, second last is state, third last is city
    const lastIndex = parts.length - 1;
    
    // Check if last part looks like a country
    const lastPart = parts[lastIndex].toLowerCase();
    const isCountry = ['india', 'usa', 'uk', 'canada', 'australia'].includes(lastPart);
    
    if (isCountry) {
      country = parts[lastIndex];
      state = parts[lastIndex - 1] || '';
      city = parts[lastIndex - 2] || '';
      // Area is everything before city
      area = parts.slice(0, lastIndex - 2).join(', ');
    } else {
      // No country detected, assume last part is state
      state = parts[lastIndex];
      city = parts[lastIndex - 1] || '';
      // Area is everything before city
      area = parts.slice(0, lastIndex - 1).join(', ');
    }
  }

  // Additional pincode extraction from any part if not found yet
  if (!pincode) {
    for (let i = 0; i < parts.length; i++) {
      const match = parts[i].match(pincodeRegex);
      if (match) {
        pincode = match[0];
        break;
      }
    }
  }

  // Clean up extracted values
  area = area.replace(pincodeRegex, '').trim().replace(/^[,.\s]+|[,.\s]+$/g, '');
  city = city.replace(pincodeRegex, '').trim().replace(/^[,.\s]+|[,.\s]+$/g, '');
  state = state.replace(pincodeRegex, '').trim().replace(/^[,.\s]+|[,.\s]+$/g, '');

  // Fallback: if area is empty but city exists, use city as area
  if (!area && city) {
    area = city;
  }

  // Fallback: if city is empty but area exists, use area as city
  if (!city && area) {
    city = area;
  }

  return {
    area,
    pincode,
    city,
    state,
    country
  };
};

/**
 * Enhanced address parser that uses Google Geocoding API for better accuracy
 * @param {string} address - The full address string
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<object>} - Parsed address components with coordinates
 */
export const parseAddressWithGeocoding = async (address, apiKey) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const formattedAddress = result.formatted_address;
      const { lat, lng } = result.geometry.location;
      
      // Parse the formatted address
      const parsed = parseAddress(formattedAddress);
      
      // Try to extract more precise information from address components
      if (result.address_components) {
        for (const component of result.address_components) {
          const types = component.types;
          
          if (types.includes('postal_code') && !parsed.pincode) {
            parsed.pincode = component.long_name;
          }
          if (types.includes('locality') && !parsed.city) {
            parsed.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1') && !parsed.state) {
            parsed.state = component.long_name;
          }
          if (types.includes('country') && !parsed.country) {
            parsed.country = component.long_name;
          }
          if (types.includes('sublocality') && !parsed.area) {
            parsed.area = component.long_name;
          }
        }
      }
      
      return {
        ...parsed,
        latitude: lat,
        longitude: lng,
        formattedAddress
      };
    }
  } catch (error) {
    console.error('Error in geocoding address:', error);
  }
  
  // Fallback to basic parsing if geocoding fails
  return {
    ...parseAddress(address),
    latitude: null,
    longitude: null,
    formattedAddress: address
  };
};



