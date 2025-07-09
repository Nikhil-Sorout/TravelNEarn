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
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

const PublishStarting = ({ navigation }) => {
  const [userName, setUserName] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState({
    home: null,
    work: null,
    other: null,
  });

  // Format display text to truncate long addresses
  const formatDisplayText = (text) => {
    if (text && text.length > 35) {
      return text.substring(0, 32) + "...";
    }
    return text;
  };

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

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please enable location permissions in your device settings to use this feature."
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      }).catch(async (error) => {
        console.warn("Failed to get current position:", error);
        return await Location.getLastKnownPositionAsync();
      });

      if (!location) {
        throw new Error("Unable to fetch current or last known location.");
      }

      console.log("Location coordinates:", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      let locationString = "Unknown location";
      if (address.length > 0) {
        const addr = address[0];
        locationString = `${addr.name || ""}, ${addr.city || ""}, ${
          addr.region || ""
        }, ${addr.country || ""}`
          .replace(/,\s*,/g, ",")
          .replace(/^\s*,|\s*$/g, "")
          .trim();
        console.log("Geocoded address:", locationString);
      }

      setCurrentLocation(locationString);
      setUserName(locationString);
      await AsyncStorage.setItem("startingLocation", locationString);
    } catch (error) {
      console.error("Location fetch error:", error);
      Alert.alert("Error", "Unable to fetch location: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("startingLocation");
        if (storedName) {
          setUserName(storedName);
          setCurrentLocation(storedName);
        }
      } catch (error) {
        console.error("Error fetching stored location:", error);
      }
    };

    fetchUserName();
  }, []);

  // Add this new effect to fetch saved addresses
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        let baseurl = await AsyncStorage.getItem("apiBaseUrl");

        // Fallback to default URL if not found
        if (!baseurl) {
          baseurl = "https://travel.timestringssystem.com/";
        }

        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        if (!phoneNumber) {
          console.error("Phone number not found");
          return;
        }

        const response = await fetch(
          `${baseurl}address/getaddress/${phoneNumber}`
        );
        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
          // Find addresses by saveAs category
          const home =
            data.find((addr) => addr.saveAs.toLowerCase() === "home") || null;
          const work =
            data.find((addr) => addr.saveAs.toLowerCase() === "work") || null;
          const other =
            data.find((addr) => addr.saveAs.toLowerCase() === "others") || null;

          setSavedAddresses({ home, work, other });
        }
      } catch (err) {
        console.error("Error fetching saved addresses:", err);
      }
    };

    fetchSavedAddresses();
  }, []);

  // Add the handleQuickAddressSelect function
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Starting Location</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationInput}>
          <FontAwesome
            name="circle"
            size={10}
            color="green"
            style={styles.dotIndicator}
          />
          <Text style={styles.locationText}>
            {loading
              ? "Fetching location..."
              : userName || "Tap below to get location"}
          </Text>
          <TouchableOpacity onPress={() => setUserName("")}>
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
          onPress={() => navigation.navigate("PublishTravelDropLocation")}
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
    fontSize: width * 0.05,
    textAlign: "center",
    flex: 1,
    marginRight: 12,
  },
  locationContainer: {
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
    marginRight: width * 0.03,
  },
  locationText: {
    flex: 1,
    fontSize: width * 0.04,
    color: "#333",
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
    paddingHorizontal: width * 0.1,
    paddingVertical: height * 0.03,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: "auto",
    backgroundColor: "white",
  },
  navButton: {
    alignItems: "center",
  },
  disabledButton: {
    opacity: 1,
  },
  iconContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "50vw",
    paddingHorizontal: height * 0.02,
  },
  navText: {
    fontSize: 14,
    color: "red",
    marginTop: 5,
    textAlign: "center",
  },
});

export default PublishStarting;
