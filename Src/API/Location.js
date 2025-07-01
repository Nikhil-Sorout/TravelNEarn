// import axios from 'axios';

// const BASE_URL = 'https://travel.timestringssystem.com/api'; // Replace with your backend base URL

// export const fetchLocations = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/location`);
//     return response.data; // Axios automatically parses the response JSON
//   } catch (error) {
//     const errorMessage =
//       error.response?.data?.error || `Error fetching locations: ${error.message}`;
//     console.error(errorMessage);
//     throw new Error(errorMessage);
//   }
// };

import axios from "axios";
import { PermissionsAndroid, Platform } from "react-native";

const BASE_URL = "https://travel.timestringssystem.com/api"; // Replace with your backend base URL

/**
 * Fetch autocomplete suggestions for 'going' and 'leaving'.
 * @param {string} going - The 'going' query parameter.
 * @param {string} leaving - The 'leaving' query parameter.
 * @returns {Promise<Object>} - An object containing goingSuggestions and leavingSuggestions.
 */
export const fetchLocations = async (going, leaving) => {
  try {
    // Only send non-empty parameters
    const response = await axios.get(`${BASE_URL}/location`, {
      params: {
        going: going || undefined, // Send `undefined` if `going` is empty
        leaving: leaving || undefined, // Send `undefined` if `leaving` is empty
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching autocomplete suggestions:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const requestLocationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "App needs access to your location",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};
