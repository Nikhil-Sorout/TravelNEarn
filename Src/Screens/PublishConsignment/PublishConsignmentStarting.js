import React, { useState, useEffect } from "react";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { MaterialIcons, FontAwesome, Entypo } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons
import * as Location from "expo-location";

// Get screen dimensions
const { width, height } = Dimensions.get("window");
import AsyncStorage from "@react-native-async-storage/async-storage";

const PublishStarting = ({ navigation }) => {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState({
    home: null,
    work: null,
    other: null,
  });

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("startingLocation");
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();
  }, []);
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied by user.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error requesting location permission:", err);
      return false;
    }
  };

  const handleQuickAddressSelect = (addressType) => {
    const address = savedAddresses[addressType];

    if (!address) {
      // If no address found, navigate to add address screen
      navigation.navigate("AddressBook", {
        isSelecting: true,
        returnScreen: "PublishStarting", // Note the return screen is different
      });
      return;
    }

    // Format the full address from components
    const formattedAddress = `${address.flat} ${address.landmark} ${address.street}, ${address.location}`;

    // Update the state with the selected address
    setCurrentLocation(formattedAddress);
    setUserName(formatDisplayText(formattedAddress));

    // Save to AsyncStorage
    AsyncStorage.setItem("startingLocation", formattedAddress);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }

      let location = null;

      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          maximumAge: 10000,
          timeout: 15000,
        });
      } catch (error) {
        console.warn("Current position fetch failed, trying fallback:", error);
      }

      if (!location) {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          throw new Error("Unable to get current or last known location.");
        }
      }

      console.log("Final coordinates:", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      let locationString = "";
      if (address.length > 0) {
        const addr = address[0];
        locationString = `${addr.name}, ${addr.city}, ${addr.region}, ${addr.country}`;
        console.log("Geocoded address:", addr);
      }

      setCurrentLocation(locationString);
      setUserName(locationString);
      await AsyncStorage.setItem("startingLocation", locationString);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Unable to fetch location: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Starting Location</Text>
      </View>

      {/* Location Input Section */}
      <View style={styles.locationContainer}>
        <View style={styles.locationInput}>
          <FontAwesome
            name="circle"
            size={10}
            color="green"
            style={styles.dotIndicator}
          />
          <Text style={styles.locationText}>{userName}</Text>
          <TouchableOpacity>
            <Entypo name="cross" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Favorites Section */}
      <Text style={styles.favoritesTitle}>Favourites</Text>
      <View style={styles.favoritesContainer}>
        <TouchableOpacity
          style={[
            styles.favoriteItem,
            !savedAddresses.home && styles.disabledButton,
          ]}
          onPress={() => handleQuickAddressSelect("home")}
        >
          <FontAwesome name="home" size={24} color="#53B175" />
          <Text style={styles.favoriteText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.favoriteItem,
            !savedAddresses.work && styles.disabledButton,
          ]}
          onPress={() => handleQuickAddressSelect("work")}
        >
          <FontAwesome name="briefcase" size={24} color="#53B175" />
          <Text style={styles.favoriteText}>Work</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.favoriteItem1,
            !savedAddresses.other && styles.disabledButton,
          ]}
          onPress={() => handleQuickAddressSelect("other")}
        >
          <Entypo name="location-pin" size={24} color="#53B175" />
          <Text style={styles.favoriteText}>Other</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, loading && styles.disabledButton]}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="locate" size={24} color="red" />
            <Text style={styles.navText}>Current Location</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("PublishConsignmentSearchScreen")}
        >
          <View style={styles.iconContainer}>
            <FontAwesome name="map-marker" size={24} color="red" />
            <Text style={styles.navText}>Next</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",

  },
  header: {
    backgroundColor: "#D83F3F",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    color: "white",
    fontSize: width * 0.05, // Adjusting for screen width
    textAlign: "center",
    flex: 1, // Centering header text
  },
  locationContainer: {
    backgroundColor: "",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  locationInput: {
    backgroundColor: "#EAECF0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.03,
  },
  dotIndicator: {
    marginRight: width * 0.03, // Dynamic margin based on screen width
  },
  locationText: {
    flex: 1,
    fontSize: width * 0.04, // Adjust font size based on screen width
    color: "#333",
  },
  disabledButton: {
    // opacity: 0.5,
  },
  favoritesTitle: {
    marginHorizontal: width * 0.05,
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
    fontSize: width * 0.045,
    fontWeight: "bold",
    color: "#333",
  },
  favoritesContainer: {
    marginHorizontal: width * 0.01,
    backgroundColor: "white",
    padding: 15,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  favoriteItem1: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: height * 0.02,
  },
  favoriteText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.04,
    color: "black",
    fontWeight: "bold",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.1, // Adjusting horizontal padding for responsiveness
    paddingVertical: height * 0.03,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: "auto", // Ensuring the bottom nav stays at the bottom
    backgroundColor: "white",
  },
  navButton: {
    alignItems: "center",
  },

  iconContainer: {
    flexDirection: "column", // Places icon & text in a vertical column
    alignItems: "center", // Centers items horizontally
    justifyContent: "center",
    paddingHorizontal: height * 0.02,
    color: "red",
  },

  navText: {
    fontSize: 14,
    color: "red",
    marginTop: 5, // Adds space between icon & text
    textAlign: "center",
    // Space between icon & text
  },
});

export default PublishStarting;
