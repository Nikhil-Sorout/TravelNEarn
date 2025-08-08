import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getCoordinatesFromAddress } from "../../Utils/addressResolver";

const PublishLocation = ({ navigation, route }) => {
  const [leaving, setLeaving] = useState("");
  const [going, setGoing] = useState("");
  const [fullGoing, setFullGoing] = useState("");
  const [suggestions, setSuggestions] = useState({
    goingSuggestions: [],
    leavingSuggestions: [],
  });
  const [userName, setUserName] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMapInteraction, setIsMapInteraction] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState({
    home: null,
    work: null,
    other: null,
  });
  const { from, to, selectedDate, fullFrom, fullTo } = route.params;
  console.log(route.params);

  // Format display text to truncate long addresses
  const formatDisplayText = (text) => {
    if (text && text.length > 35) {
      return text.substring(0, 32) + "...";
    }
    return text;
  };

  const mapRef = useRef(null);
  const lastRegion = useRef(null);
  const motionTimeoutRef = useRef(null);

  const handleSearchParameter = async (search) => {
    if (search && search.trim()) {
      try {
        console.log(search)
        // First, get coordinates for the 'to' address
        const apiUrl = await AsyncStorage.getItem("apiBaseUrl");
        if (!apiUrl) {
          Alert.alert("Error", "API configuration not found");
          return;
        }

        const response = await axios.get(`${apiUrl}map/get-coordinates`, {
          params: { address: search },
        });
        console.log(response.data)

        if (response?.data?.ltd && response?.data?.lng) {
          const newLocation = {
            latitude: response.data.ltd,
            longitude: response.data.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setLocation(newLocation);
          lastRegion.current = newLocation;
        }

        // Second, get the exact/formal address name using reverse geocoding
        const apiKey = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";
        const reverseResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${response.data.ltd},${response.data.lng}&key=${apiKey}`
        );

        if (reverseResponse.data?.results?.length > 0) {
          const exactAddress = reverseResponse.data.results[0].formatted_address;
          console.log(exactAddress)
          setFullGoing(exactAddress);
          setGoing(formatDisplayText(exactAddress));
        } else {
          // Fallback to original 'to' parameter if reverse geocoding fails
          setFullGoing(to);
          setGoing(formatDisplayText(to));
        }
      } catch (error) {
        console.error("Error handling 'to' parameter:", error);
        // Fallback to original 'to' parameter if any step fails
        setFullGoing(to);
        setGoing(formatDisplayText(to));
      }
    }
  };

  useEffect(() => {
    handleSearchParameter(to);
  }, []); // Run only once on mount, no dependencies

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("firstName");
        console.log("Here" + storedName);
        if (storedName) setUserName(storedName);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const fetchCoordinates = async (address) => {
    if (address.trim() === "") return;
    console.log("fetching coordinates")
    try {
      setLoading(true);
      const apiUrl = await AsyncStorage.getItem("apiBaseUrl");
      if (!apiUrl) {
        Alert.alert("Error", "API configuration not found");
        return;
      }
      console.log("apiUrl", apiUrl)
      const response = await axios.get(`${apiUrl}map/get-coordinates`, {
        params: { address },
      });
      console.log("response", response.data)
      if (response?.data?.ltd && response?.data?.lng) {
        const newLocation = {
          latitude: response?.data?.ltd,
          longitude: response?.data?.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setLocation(newLocation);
        lastRegion.current = newLocation;
      } else {
        Alert.alert("Error", "Invalid coordinates returned.");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      Alert.alert("Error", "Failed to fetch coordinates");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationSuggestions = async () => {
    if (!going.trim()) return;
    try {
      const apiUrl = await AsyncStorage.getItem('apiBaseUrl')
      const response = await axios.get(`${apiUrl}api/location`, {
        params: { going, leaving },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };
  const fetchAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) return;
    try {
      const apiKey = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data?.results?.length > 0) {
        const newAddress = response.data.results[0].formatted_address;
        if (newAddress !== fullGoing) {
          setFullGoing(newAddress);
          setGoing(formatDisplayText(newAddress));
        }
        setIsTyping(false);
        setIsMapInteraction(false);
        setIsMapMoving(false);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      Alert.alert("Error", "Could not fetch address");
      setIsMapInteraction(false);
      setIsMapMoving(false);
    }
  };

  const debouncedFetchCoordinates = useCallback(
    debounce(fetchCoordinates, 800),
    []
  );
  const debouncedFetchSuggestions = useCallback(
    debounce(fetchLocationSuggestions, 800),
    [going, leaving]
  );
  const debouncedFetchAddress = useCallback(
    debounce(fetchAddressFromCoordinates, 1200),
    []
  );

  useEffect(() => {
    if (going.trim() !== "" && isTyping && !isMapInteraction) {
      debouncedFetchCoordinates(going);
      console.log("Re-rendering")
      debouncedFetchSuggestions();
    }
  }, [going, isTyping, isMapInteraction]);

  const handleRegionChange = useCallback(
    (region) => {
      // Remove this function entirely - we don't want to update pin on map movement
      // Only update pin when user explicitly clicks on the map
    },
    [isTyping, loading, location, isMapMoving]
  );

  const handleDragEnd = useCallback((e) => {
    // Remove this function entirely - we don't want to update pin on drag
    // Only update pin when user explicitly clicks on the map
  }, []);

  const handleMapPress = useCallback((e) => {
    const { coordinate } = e.nativeEvent;
    if (coordinate?.latitude && coordinate?.longitude) {
      setIsMapInteraction(true);
      setIsMapMoving(true);
      
      // Clear any existing timeout
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }
      
      // Update location immediately when map is tapped
      setLocation((prev) => {
        const newLocation = {
          ...prev,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        lastRegion.current = newLocation;
        return newLocation;
      });
      
      // Fetch address for the new location
      debouncedFetchAddress(coordinate.latitude, coordinate.longitude);
    }
  }, []);

  const renderSuggestion = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => {
          handleSearchParameter(item);
          setFullGoing(item);
          setGoing(formatDisplayText(item));
          setIsTyping(false);
          setIsMapInteraction(false);
          setIsMapMoving(false);
          // Clear any pending motion timeout
          if (motionTimeoutRef.current) {
            clearTimeout(motionTimeoutRef.current);
          }
          debouncedFetchCoordinates(item);
        }}
      >
        <Text style={styles.suggestionText}>{item}</Text>
      </TouchableOpacity>
    ),
    []
  );

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }
    };
  }, []);

  const handleQuickAddressSelect = (addressType) => {
    const address = savedAddresses[addressType];

    if (!address) {
      // If no address found, navigate to add address screen
      navigation.navigate("AddressBook", {
        isSelecting: true,
        returnScreen: "PublishConsignmentLocation",
      });
      return;
    }

    // Format the full address from components
    const formattedAddress = `${address.flat} ${address.landmark} ${address.street}, ${address.location}`;

    // Update the state with the selected address
    setFullGoing(formattedAddress);
    setGoing(formatDisplayText(formattedAddress));
    setIsTyping(false);
    setIsMapInteraction(false);
    setIsMapMoving(false);
    
    // Clear any pending motion timeout
    if (motionTimeoutRef.current) {
      clearTimeout(motionTimeoutRef.current);
    }

    // Fetch coordinates for the address
    debouncedFetchCoordinates(formattedAddress);
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#000' }}>Loading location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          onPress={handleMapPress}
          scrollEnabled={!isTyping}
          zoomEnabled={!isTyping}
          pitchEnabled={!isTyping}
          rotateEnabled={!isTyping}
        >
          <Marker coordinate={location} draggable={false}>
            <View style={styles.markerContainer}>
              <View style={styles.innerCircle}>
                <Icon name="map-marker" size={20} color="#fff" />
              </View>
            </View>
          </Marker>
        </MapView>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.header1}>
              <Ionicons
                name="chevron-back"
                size={20}
                color="white"
                style={{ textAlign: "center", alignSelf: "center" }}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.searchHeader}>
            <Text
              style={styles.locationText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              <Text style={{ color: "#3bba00" }}>●</Text>
              {going || "Select location"}
            </Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Text style={styles.greetingText}>Hi {userName},</Text>
          <Text style={styles.subGreetingText}>Where are you going?</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={[styles.searchInput, { textAlign: "left" }]}
              placeholder="Search Destination"
              ellipsizeMode="tail"
              numberOfLines={1}
              multiline={false}
              value={going}
              onChangeText={(text) => {
                setFullGoing(text);
                setGoing(formatDisplayText(text));
                setIsTyping(true);
                setIsMapInteraction(false);
                setIsMapMoving(false);
                // Clear any pending motion timeoutī
                if (motionTimeoutRef.current) {
                  clearTimeout(motionTimeoutRef.current);
                }
              }}
              onEndEditing={() => setIsTyping(false)}
            />
            <TouchableOpacity
              onPress={async () => {
                try {
                  await AsyncStorage.setItem("goingLocation", fullGoing);
                  navigation.navigate("PublishConsignmentStarting");
                } catch (error) {
                  console.error("Error saving location:", error);
                  Alert.alert("Error", "Failed to save location");
                }
              }}
              style={styles.searchIcon}
            >
              <Text style={{ color: '#000' }}>🔍</Text>
            </TouchableOpacity>
          </View>
          {loading && <Text style={styles.loadingText}>Loading...</Text>}
          {isTyping && suggestions.goingSuggestions.length > 0 && (
            <FlatList
              data={suggestions.goingSuggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => index.toString()}
              style={styles.suggestionsList}
            />
          )}
        </View>
        <View style={styles.searchContainer1}>
          <View style={styles.quickButtons}>
            <TouchableOpacity
              style={[
                styles.quickButton,
                !savedAddresses.home && styles.disabledButton,
              ]}
              onPress={() => handleQuickAddressSelect("home")}
            >
              <Text style={styles.quickButtonText}>
                Home <Icon name="home" size={20} color="#53B175" />
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickButton,
                !savedAddresses.work && styles.disabledButton,
              ]}
              onPress={() => handleQuickAddressSelect("work")}
            >
              <Text style={styles.quickButtonText}>
                Work <Icon name="briefcase" size={20} color="#53B175" />
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickButton,
                !savedAddresses.other && styles.disabledButton,
              ]}
              onPress={() => handleQuickAddressSelect("other")}
            >
              <Text style={styles.quickButtonText}>
                Other <Icon name="map-marker" size={20} color="#53B175" />
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3bba00",
    borderRadius: "50%",
    // padding: 10,
    width: 30,
    height: 30
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#34a300",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    marginRight: 10,
  },
  header1: {
    width: 50,
    alignItems: "center",
    backgroundColor: "#D83F3F",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  searchHeader: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  locationText: { fontSize: 14, color: "black", padding: 5 },
  searchContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    marginHorizontal: 10,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 6,
    maxHeight: "50%",
    zIndex: 10,
  },
  searchContainer1: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 10,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  greetingText: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#000" },
  subGreetingText: { fontSize: 14, color: "gray", marginBottom: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 16, marginRight: 10, padding: 15 },
  searchIcon: { padding: 5 },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: { fontSize: 14, color: "#333" },
  loadingText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    marginBottom: 10,
  },
  quickButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  quickButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 6,
    alignItems: "center",
    elevation: 3,
  },
  quickButtonText: { fontSize: 14, color: "black" },
  disabledButton: {
    opacity: 0.6,
  },
});

export default memo(PublishLocation);
