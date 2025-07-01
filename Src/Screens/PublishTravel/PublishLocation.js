import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons

const PublishLocation = ({ navigation, route }) => {
  const [leaving, setLeaving] = useState("");
  const [going, setGoing] = useState(route.params?.to || "");
  const [suggestions, setSuggestions] = useState({
    goingSuggestions: [],
    leavingSuggestions: [],
  });
  const [userName, setUserName] = useState("");
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.209,
  }); // Default coordinates (Delhi)
  const [loading, setLoading] = useState(false);

  // Fetch user name from AsyncStorage
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("firstName");
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  // Fetch coordinates when the `going` location changes
  useEffect(() => {
    if (going.trim() !== "") {
      fetchCoordinates();
    }
  }, [going]);

  // Function to fetch coordinates from API
  const fetchCoordinates = async () => {
    try {
      // console.log('going',going)
      setLoading(true);
      const apiUrl = await AsyncStorage.getItem("apiBaseUrl");
      if (!apiUrl) throw new Error("API Base URL not found in AsyncStorage");

      const response = await axios.get(`${apiUrl}map/get-coordinates`, {
        params: { address: going },
      });

      if (response && response.data && response.data.ltd && response.data.lng) {
        setLocation({
          latitude: response.data.ltd,
          longitude: response.data.lng,
        });
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      // Alert.alert('Error', 'Failed to fetch coordinates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationSuggestions = async () => {
    // console.log('parameter',params)
    try {
      const response = await axios.get(
        "https://travel.timestringssystem.com/api/location",
        {
          params: { going, leaving },
        }
      );
      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const fetchAddressFromCoordinates = async (lat, lng) => {
    console.log("Fetching address for text change lat:", lat, "lng:", lng);

    try {
      if (!lat || !lng || Math.abs(lat) < 0.01 || Math.abs(lng) < 0.01) {
        console.warn("Invalid coordinates: Skipping API call", lat, lng);
        return; // Stop execution if coordinates are invalid
      }

      const apiKey = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data && response.data.results.length > 0) {
        const formattedAddress = response.data.results[0].formatted_address;
        setGoing(formattedAddress); // Update the `going` state
      } else {
        console.warn("No results found for the given coordinates");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  // console.log('location',location)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Map View */}
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{ ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          onRegionChangeComplete={(region) => {
            if (
              region &&
              region.latitude &&
              region.longitude &&
              Math.abs(region.latitude) > 0.01 &&
              Math.abs(region.longitude) > 0.01
            ) {
              setLocation(region);
              fetchAddressFromCoordinates(region.latitude, region.longitude);
            } else {
              console.warn("Invalid region change detected, skipping API call");
            }
          }}
        >
          <Marker
            coordinate={location}
            draggable // Allows marker dragging
            onDragEnd={async (e) => {
              const { coordinate } = e.nativeEvent;

              if (coordinate && coordinate.latitude && coordinate.longitude) {
                setLocation(coordinate);
                fetchAddressFromCoordinates(
                  coordinate.latitude,
                  coordinate.longitude
                );
              } else {
                console.warn("Invalid marker drag position, skipping API call");
              }
            }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerCircle}>
                <View style={styles.innerCircle}>
                  <Icon name="map-marker" size={25} color="#fff" />
                </View>
              </View>
            </View>
          </Marker>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.header1}>
              {/* <Icon name="arrow-left" style={{textAlign:'center',alignItems:'center',alignSelf: 'center',}} size={15} color="#fff" /> */}
              <Ionicons
                name="chevron-back"
                style={{
                  textAlign: "center",
                  alignItems: "center",
                  alignSelf: "center",
                }}
                size={20}
                color="white"
              />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text
              style={styles.locationText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              <Text style={{ color: "#3bba00" }}>●</Text> {going}
            </Text>
          </View>

          {/* curreent location */}

          {/* Search Box */}

          <View style={styles.searchContainer}>
            <Text style={styles.greetingText}>Hi {userName},</Text>
            <Text style={styles.subGreetingText}>Where are you going?</Text>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Destination"
                value={going}
                onChangeText={setGoing} // Updates location dynamically
                onEndEditing={fetchLocationSuggestions}
              />
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await AsyncStorage.setItem("goingLocation", going); // Store the going location
                    navigation.navigate("PublishStarting"); // Navigate to next screen
                  } catch (error) {
                    console.error("Error saving location:", error);
                  }
                }}
                style={styles.searchIcon}
              >
                <Text>🔍</Text>
              </TouchableOpacity>
            </View>

            {suggestions.goingSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Going Suggestions:</Text>
                {suggestions.goingSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setGoing(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.searchContainer1}>
            <View style={styles.quickButtons}>
              <TouchableOpacity style={styles.quickButton}>
                <Text style={styles.quickButtonText}>
                  Home&nbsp;&nbsp;
                  <Icon
                    name="home"
                    size={20}
                    style={{ gap: 20 }}
                    color="#53B175"
                  />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton}>
                <Text style={styles.quickButtonText}>
                  Work&nbsp;&nbsp;
                  <Icon
                    name="briefcase"
                    size={20}
                    style={{ gap: 20 }}
                    color="#53B175"
                  />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickButton}>
                <Text style={styles.quickButtonText}>
                  Other&nbsp;&nbsp;
                  <Icon
                    name="map-marker"
                    size={20}
                    style={{ gap: 20 }}
                    color="#53B175"
                  />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </MapView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  map: { flex: 1 },
  markerContainer: { alignItems: "center", justifyContent: "center" },
  markerCircle: {
    backgroundColor: "#3bba00",
    width: 70,
    height: 70,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25, // Half of width/height
    borderWidth: 4, // Thickness of the border
    borderColor: "#34a300", // Slightly darker green border
    justifyContent: "center",
    alignItems: "center",
  },
  markerIcon: { color: "white", fontSize: 24 },
  header: {
    position: "absolute",
    top: 40,
    left: 60,
    right: 50,
    width: "78%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header1: {
    position: "absolute",
    top: 40,
    width: "13%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D83F3F",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  backButton: { marginRight: 0 },
  backButtonText: { fontSize: 18, color: "white", marginBottom: 5 },
  locationText: { fontSize: 14, color: "black", padding: 5 }, // Ensure it fits within its container },
  currentLocationConatiner: {
    flex: 1,
    position: "absolute",
    bottom: 250,
    left: "80%",
    width: "4%",
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: "black",
    alignContent: "center",
    borderRadius: 12,
  },
  searchContainer: {
    position: "absolute",
    bottom: 90,
    left: 10,
    width: "94%",
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: "#fff",
    alignContent: "center",
    borderRadius: 6,
  },
  searchContainer1: {
    position: "absolute",
    bottom: 0,
    left: 10,
    width: "94%",
    alignContent: "center",
    backgroundColor: "transparent",
  },
  greetingText: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  subGreetingText: { fontSize: 14, color: "gray", marginBottom: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 3,
  },
  searchInput: { flex: 1, fontSize: 16, marginRight: 10, padding: 15 },
  searchIcon: { padding: 5 },
  loadingText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    color: "gray",
  },
  quickButtonText: { fontSize: 14, color: "black" },
  suggestionsContainer: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
  },
  suggestionsTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  suggestionText: { fontSize: 14, color: "#333", paddingVertical: 5 },
  quickButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 30,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  quickButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});

export default PublishLocation;
