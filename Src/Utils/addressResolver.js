import * as Location from "expo-location"

const requestPermissions = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission to access location was denied');
    return false;
  }
  return true;
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



