import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { parseAddress, parseAddressWithGeocoding } from "../../Utils/addressResolver";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Dimensions,
  Image
} from "react-native";
import Config from "react-native-config";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { fetchLocations } from "../../API/Location";

// Simple Header component
const Header = ({ title, navigation }) => {
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight : 0;

  return (
    <View style={[headerStyles.container, { marginTop: statusBarHeight }]}>
      <TouchableOpacity
        onPress={() => navigation.replace("Navigation", { screen: "Publish" })}
        accessible
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "500", // Less bold than before
    marginLeft: 15,
    color: "#222",
  },
});

const InputItem = memo(
  ({ item, address, handleInputChange, locationInputRef, disabled = false }) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {item.label}
          {item.required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={item.value === "location" ? locationInputRef : null}
            style={[styles.input, disabled && styles.disabledInput]}
            placeholder={item.placeholder}
            value={address[item.value] || ""}
            onChangeText={(text) => handleInputChange(item.value, text)}
            editable={!disabled}
            accessible
            accessibilityLabel={item.label}
            scrollEnabled={false}
            multiline={false}
            blurOnSubmit={true}
            returnKeyType="next"
            pointerEvents={disabled ? "none" : "auto"}
          />
          {address[item.value] && !disabled && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleInputChange(item.value, "")}
              accessible
              accessibilityLabel={`Clear ${item.label}`}
            >
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

const AddAddress = ({ navigation, route }) => {
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 80,
    longitudeDelta: 160,
  });
  const [markerCoords, setMarkerCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false)
  const mapRef = useRef(null);
  const locationInputRef = useRef(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSelected, setFromSelected] = useState(false); // Track if "Leaving from" is selected
  const [toSelected, setToSelected] = useState(false); // Track if "Going to" is selected
  const [goingSuggestions, setGoingSuggestions] = useState([]);
  const [leavingSuggestions, setLeavingSuggestions] = useState([]);
  // const {address : addressViaRoute} = route?.params || {}
  const addressViaRoute = route?.params?.address
  const addressFieldType = route?.params?.addressFieldType
  console.log(addressViaRoute)
  useEffect(() => {
    if (addressViaRoute && addressViaRoute?.googleMapsAddress) {
      setAddress(addressViaRoute?.googleMapsAddress)
      fetchCoordsFromAddress(addressViaRoute?.googleMapsAddress)
    }
    console.log("Address: ", address)
  }, [addressViaRoute])

  const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";

  // Geocode address to coordinates
  const fetchCoordsFromAddress = useCallback((location) => {
    if (!location) return;
    setIsLoading(true);
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${GOOGLE_MAPS_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          setMarkerCoords({ latitude: lat, longitude: lng });
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const fetchSuggestions = async () => {
    try {
      if (from || to) {
        const data = await fetchLocations(from, to);
        setGoingSuggestions(data.goingSuggestions || []);
        setLeavingSuggestions(data.leavingSuggestions || []);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error.message);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!fromSelected || !toSelected) {
        fetchSuggestions();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [from, to]);


  // Reverse geocode coordinates to address
  const fetchAddressFromCoords = useCallback(async (latitude, longitude) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);

        // Log the parsed address for debugging
        const parsed = parseAddress(formattedAddress);
        setIsLoading(false)
        console.log('Parsed address from coordinates:', parsed);
      } else {
        setAddress(`${latitude}, ${longitude}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (text) => {
    setAddress(text);
    // fetchCoordsFromAddress(text);
  };

  // Handle map press or marker drag
  const handleMapPress = (event) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = event.nativeEvent.coordinate;

    setMarkerCoords({ latitude, longitude });
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    fetchAddressFromCoords(latitude, longitude);
  };

  // Handle region change
  const handleRegionChange = (region) => {
    console.log("Region :", region)
    setRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    })
    setMarkerCoords({ latitude: region.latitude, longitude: region.longitude })
    fetchAddressFromCoords(region.latitude, region.longitude)
  }
  // Handle current location button
  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to set your location."
        );
        setIsLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setMarkerCoords({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      fetchAddressFromCoords(latitude, longitude);
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } finally {
      setIsLoading(false);
      setShowPin(true)
    }
  };

  // Save location handler (implement as needed)
  const handleSaveLocation = async () => {
    if (!address || !markerCoords) {
      Alert.alert("Error", "Please select a location on the map.");
      return;
    }

    setIsLoading(true);
    try {
      // Use the enhanced address parser with geocoding for better accuracy
      const parsedAddress = await parseAddressWithGeocoding(address, GOOGLE_MAPS_API_KEY);

      // Extract the parsed components
      const { area, pincode, city, state } = parsedAddress;

      // Validate that we have at least some basic information
      if (!area && !city) {
        Alert.alert("Error", "Could not extract location information from the address. Please try selecting a different location or enter the address manually.");
        return;
      }

      // Create display address (full address for display)
      const displayAddress = `${address.flat}, ${address.street}, ${address.landmark}, ${address.city}, ${address.state} - ${address.pincode}`;

      // Create Google Maps address (location, pincode, city, state for maps)
      const googleMapsAddress = `${address.location}, ${address.pincode}, ${address.city}, ${address.state}`;

      // Determine the save name
      // const saveName = selectedSaveAs === "Others" ? address.customName : selectedSaveAs;

      // Prepare data according to MongoDB schema
      // const addressData = {
      //   userId: userId || phoneNumber, // Use userId if available, otherwise phoneNumber
      //   phoneNumber: phoneNumber,
      //   location: address.location,
      //   pincode: address.pincode,
      //   flat: address.flat,
      //   street: address.street,
      //   landmark: address.landmark,
      //   city: address.city,
      //   state: address.state,
      //   saveAs: selectedSaveAs,
      //   customName: saveName,
      //   displayAddress: displayAddress,
      //   googleMapsAddress: googleMapsAddress,
      //   latitude: markerCoords ? markerCoords.latitude : undefined,
      //   longitude: markerCoords ? markerCoords.longitude : undefined
      // };

      navigation.navigate('AddStartingCityAddress', {
        area: area || city,
        pincode,
        city: city || area,
        state,
        latitude: markerCoords?.latitude,
        longitude: markerCoords?.longitude,
        addressFieldType
      });
    } catch (error) {
      console.error('Error parsing address:', error);
      // Fallback to basic parsing if geocoding fails
      const parsedAddress = parseAddress(address);
      const { area, pincode, city, state } = parsedAddress;

      navigation.navigate('AddStartingCityAddress', {
        area: area || city,
        pincode,
        city: city || area,
        state,
        latitude: markerCoords?.latitude,
        longitude: markerCoords?.longitude
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add address manually handler
  const handleAddManually = () => {
    // Navigate to manual address entry screen or show more fields
    // Alert.alert("Manual Entry", "Show manual address entry UI here.");
    navigation.navigate("AddStartingCityAddress", { addManually: true })
  };

  // UI
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // tweak based on header height
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.mainContainer}>
          <Header title="Locate on Map" navigation={navigation} />
          <View style={styles.flexMapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              style={styles.map}
              // region={region}
              onRegionChangeComplete={handleRegionChange}
            // onPress={handleMapPress}
            >
              {/* {markerCoords && (
            <Marker
              coordinate={markerCoords}
              draggable
              onDragEnd={handleMapPress}
            >
              <MaterialIcons name="location-pin" size={35} color="red" />
            </Marker>
          )} */}
            </MapView>
            {showPin && (<View style={styles.pinContainer}>
              <Image source={require('../../../assets/location_pin.png')} style={styles.pin} />
            </View>)}
            {/* Floating current location button */}
            {/* <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleCurrentLocation}
          accessible
          accessibilityLabel="Use current location"
        >
          <MaterialIcons name="my-location" size={22} color="#888" style={{ opacity: 0.8 }} />
        </TouchableOpacity> */}
          </View>
          {/* Address input and info */}
          <View style={styles.inputSection}>
            <View style={styles.inputWithInfo}>
              <TextInput
                ref={locationInputRef}
                style={styles.input}
                placeholder="Enter location/address"
                value={address}
                onChangeText={text => {
                  handleInputChange(text);
                  setFrom(text); // Use 'from' state for suggestions
                  setFromSelected(false);
                }}
                onFocus={() => {
                  setFromSelected(false);
                }}
                accessible
                accessibilityLabel="Location address"
              />
              <TouchableOpacity onPress={() => {
                fetchCoordsFromAddress(address)
                setShowPin(true)
              }}>
                <MaterialIcons name="search" size={20} />
              </TouchableOpacity>
            </View>
            {/* Suggestions Dropdown */}
            {(goingSuggestions.length > 0 && !fromSelected) && (
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.suggestionScrollContent}
                  >
                    {goingSuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`from-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setAddress(item);
                          setFrom(item);
                          setFromSelected(true);
                          setGoingSuggestions([]);
                          Keyboard.dismiss();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={styles.suggestionText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {goingSuggestions.length > 20 && (
                      <Text style={styles.suggestionsFooter}>
                        Showing first 20 suggestions...
                      </Text>
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={18} color="#888" />
              <Text style={styles.infoText}>
                Based on dropped pin, to change enter full address
              </Text>
            </View>
          </View>
          {/* Buttons */}
          <View style={styles.buttonSection}>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: 'white', borderColor: '#D32F2F', borderWidth: 1 }]}
              onPress={handleCurrentLocation}
              accessible
              accessibilityLabel="Get Current Location"
            >
              <Text style={[styles.saveButtonText, { color: "#D32F2F" }]}>Get Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveLocation}
              accessible
              accessibilityLabel="Save Location"
            >
              <Text style={styles.saveButtonText}>Save Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleAddManually}
              accessible
              accessibilityLabel="Add address manually"
            >
              <Text style={styles.manualButtonText}>Add address manually</Text>
            </TouchableOpacity>
          </View>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#D32F2F" />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Updated styles with key fixes for scrolling and responsiveness
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    paddingBottom: 20
  },
  flexMapContainer: {
    flex: 1,
    minHeight: 150,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  map: {
    // height: 300,
    // position: 'relative',
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationButton: {
    position: "absolute",
    bottom: 80,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
    zIndex: 10,
    // opacity: 1 // Less visible
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#fff",
  },
  inputWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#222",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  infoText: {
    color: "#888",
    fontSize: 13,
    marginLeft: 6,
  },
  buttonSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    paddingVertical: 10
  },
  saveButton: {
    backgroundColor: "#D32F2F",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  manualButton: {
    borderColor: "#4B7BEC",
    borderWidth: 1.5,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  manualButtonText: {
    color: "#4B7BEC",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.0)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24, // half of pin width
    marginTop: -48, // adjust depending on pin height
    zIndex: 20,
  },
  pin: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50, // Adjust based on input height
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
    maxHeight: 200, // Limit height for suggestions
  },
  suggestionScrollContent: {
    paddingVertical: 8,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  suggestionsFooter: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default AddAddress;