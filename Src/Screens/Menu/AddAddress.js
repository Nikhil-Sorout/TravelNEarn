import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import Config from "react-native-config";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

// Simple Header component
const Header = ({ title, navigation }) => {
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight : 0;

  return (
    <View style={[headerStyles.container, { marginTop: statusBarHeight }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
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
    fontFamily: "Inter-Bold",
    marginLeft: 15,
  },
});

const InputItem = memo(
  ({ item, address, handleInputChange, locationInputRef }) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{item.label}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={item.value === "location" ? locationInputRef : null}
            style={styles.input}
            placeholder={item.placeholder}
            value={address[item.value] || ""}
            onChangeText={(text) => handleInputChange(item.value, text)}
            accessible
            accessibilityLabel={item.label}
          />
          {address[item.value] && (
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

const AddAddress = ({ navigation }) => {
  const [selectedSaveAs, setSelectedSaveAs] = useState("Work");
  const [address, setAddress] = useState({
    location: "",
    pincode: "",
    flat: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    saveAs: "Work",
  });
  const [region, setRegion] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);
  const locationInputRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";

  const addressFields = [
    { label: "Your Location", placeholder: "Lorem Ipsum", value: "location" },
    { label: "Pincode", placeholder: "110008", value: "pincode" },
    {
      label: "Flat, House no, Building, Company Apartment",
      placeholder: "33/19, 1st Floor, West Patel Nagar",
      value: "flat",
    },
    {
      label: "Area, Street, Sector Village",
      placeholder: "West Patel Nagar",
      value: "street",
    },
    { label: "Landmark", placeholder: "Near Ramjas Ground", value: "landmark" },
    { label: "Town/City", placeholder: "New Delhi", value: "city" },
    { label: "State", placeholder: "Delhi", value: "state" },
  ];

  // Initialize map and focus location input
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to set your location."
        );
        setRegion({
          latitude: 22.57,
          longitude: 88.36,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setMarkerCoords({ latitude: 22.57, longitude: 88.36 });
        fetchAddressFromCoords(22.57, 88.36);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarkerCoords({ latitude, longitude });
      fetchAddressFromCoords(latitude, longitude);
    })();

    // Auto-focus the location input
    const timer = setTimeout(() => {
      locationInputRef.current?.focus();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const fetchAddressFromCoords = useCallback(
    async (latitude, longitude, retries = 2) => {
      setIsLoading(true);
      try {
        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error("Invalid coordinates");
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();

        // Check for valid response
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components || [];

          const newAddress = {
            ...address,
            location:
              result.formatted_address ||
              address.location ||
              "Unknown location",
            pincode: "",
            street: "",
            landmark: "",
            city: "",
            state: "",
            saveAs: selectedSaveAs,
          };

          addressComponents.forEach((component) => {
            if (component.types.includes("postal_code")) {
              newAddress.pincode = component.long_name;
            } else if (component.types.includes("street_number")) {
              newAddress.street = component.long_name + " ";
            } else if (component.types.includes("route")) {
              newAddress.street += component.long_name;
            } else if (
              component.types.includes("sublocality") ||
              component.types.includes("neighborhood")
            ) {
              newAddress.landmark = component.long_name;
            } else if (component.types.includes("locality")) {
              newAddress.city = component.long_name;
            } else if (
              component.types.includes("administrative_area_level_1")
            ) {
              newAddress.state = component.long_name;
            }
          });

          // Ensure at least some address data is set
          if (!newAddress.location) {
            newAddress.location = `${latitude}, ${longitude}`;
          }

          setAddress(newAddress);
        } else if (data.status === "ZERO_RESULTS") {
          // Handle case where no address is found
          setAddress({
            ...address,
            location: `${latitude}, ${longitude}`,
            pincode: "",
            street: "",
            landmark: "",
            city: "",
            state: "",
            saveAs: selectedSaveAs,
          });
          Alert.alert(
            "Info",
            "No specific address found. Using coordinates as location."
          );
        } else if (retries > 0) {
          // Retry on other API errors (e.g., OVER_QUERY_LIMIT, REQUEST_DENIED)
          setTimeout(
            () => fetchAddressFromCoords(latitude, longitude, retries - 1),
            1000
          );
        } else {
          throw new Error(`API error: ${data.status}`);
        }
      } catch (error) {
        console.error("Error fetching address from coords:", error.message);
        if (retries > 0) {
          setTimeout(
            () => fetchAddressFromCoords(latitude, longitude, retries - 1),
            1000
          );
        } else {
          setAddress({
            ...address,
            location: `${latitude}, ${longitude}`,
            pincode: "",
            street: "",
            landmark: "",
            city: "",
            state: "",
            saveAs: selectedSaveAs,
          });
          Alert.alert(
            "Warning",
            "Unable to fetch address. Using coordinates as location. Please verify manually."
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [address, selectedSaveAs]
  );

  const fetchCoordsFromAddress = useCallback((location) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            location
          )}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setRegion(newRegion);
          setMarkerCoords({ latitude: lat, longitude: lng });
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } catch (error) {
        console.error("Error fetching coords from address:", error);
      }
    }, 500);
  }, []);

  const handleInputChange = useCallback(
    (name, value) => {
      let newValue = value;
      if (address[name] && value.length === 1) {
        console.log(`Clearing ${name} before new input`);
        newValue = value;
      }

      const newAddress = { ...address, [name]: newValue };
      setAddress(newAddress);
      if (name === "location" && newValue) {
        fetchCoordsFromAddress(newValue);
      }
    },
    [address, fetchCoordsFromAddress]
  );

  const handleSaveAsSelect = useCallback((value) => {
    const normalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    setSelectedSaveAs(normalizedValue);
    setAddress((prev) => ({ ...prev, saveAs: normalizedValue }));
  }, []);

  const handleSaveAddress = useCallback(async () => {
    if (
      !address.location ||
      !address.pincode ||
      !address.flat ||
      !address.street ||
      !address.city ||
      !address.state
    ) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      Alert.alert("Error", "Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");

      if (!baseurl || !phoneNumber) {
        Alert.alert("Error", "Unable to fetch user information.");
        return;
      }

      const response = await fetch(`${baseurl}address/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...address,
          phoneNumber,
          saveAs: address.saveAs // Ensure saveAs is sent as normalized
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Address saved successfully!");
        navigation.goBack();
      } else {
        let errorMessage = "Failed to save address";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Non-JSON response
        }
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again later.");
    }
  }, [address, navigation]);

  const handleMapPress = useCallback(
    (event) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setMarkerCoords({ latitude, longitude });
      fetchAddressFromCoords(latitude, longitude);
    },
    [fetchAddressFromCoords]
  );

  // Get device dimensions for responsive design
  const { width, height } = Dimensions.get("window");

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <View style={styles.container}>
            <Header title="Add New Address" navigation={navigation} />

            {/* The map section with fixed height */}
            <View style={styles.mapContainer}>
              {region && (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  ref={mapRef}
                  style={styles.map}
                  region={region}
                  onPress={handleMapPress}
                >
                  {markerCoords && (
                    <Marker
                      coordinate={markerCoords}
                      draggable
                      onDragEnd={(e) => {
                        const { latitude, longitude } =
                          e.nativeEvent.coordinate;
                        setMarkerCoords({ latitude, longitude });
                        fetchAddressFromCoords(latitude, longitude);
                      }}
                    >
                      <MaterialIcons
                        name="location-pin"
                        size={40}
                        color="red"
                      />
                    </Marker>
                  )}
                </MapView>
              )}
              <Text style={styles.mapText}>
                Move the pin to adjust your location
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.formContainer}>
                  {addressFields.map((item, index) => (
                    <InputItem
                      key={index}
                      item={item}
                      address={address}
                      handleInputChange={handleInputChange}
                      locationInputRef={locationInputRef}
                    />
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: 20, marginLeft: 20 }]}>
                  Save As
                </Text>
                <View style={styles.saveAsContainer}>
                  {["Home","Others","Work"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.saveAsButton,
                        selectedSaveAs === option && styles.saveAsSelected,
                      ]}
                      onPress={() => handleSaveAsSelect(option)}
                      accessible
                      accessibilityLabel={`Save as ${option}`}
                    >
                      <Text
                        style={
                          selectedSaveAs === option
                            ? styles.saveAsTextSelected
                            : styles.saveAsText
                        }
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Add extra padding at the bottom for the fixed button */}
                <View style={{ height: 80 }} />
              </ScrollView>
            </View>

            {/* Fixed save button at the bottom */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAddress}
              accessible
              accessibilityLabel="Save Address"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#D32F2F" />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

// Updated styles with key fixes for scrolling
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
   
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 0 : 0,
   
  },
  mapContainer: {
    height: Math.min(Dimensions.get("window").height * 0.25, 200),
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    padding: 5,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    position: "absolute",
    bottom: 10,
    maxWidth: "80%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  scrollContainer: {
    flex: 1, // This is critical for ScrollView to work properly
  },
  scrollContent: {
    flexGrow: 1, // Allow content to grow
    paddingBottom: 30,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontFamily: "Inter-Bold",
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative", // Ensure positioning context for clearButton
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingRight: 40, // Space for the clear button
  },
  clearButton: {
    position: "absolute",
    right: 10,
    height: 30,
    width: 30,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  saveAsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 15,
  },
  saveAsButton: {
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
  },
  saveAsSelected: {
    backgroundColor: "#d3f0e4",
    borderColor: "#66bb6a",
  },
  saveAsText: {
    color: "#000",
    fontFamily: "Inter-Regular",
  },
  saveAsTextSelected: {
    color: "#66bb6a",
    fontFamily: "Inter-Bold",
  },
  saveButton: {
    backgroundColor: "#D32F2F",
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 100,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
});

export default AddAddress;