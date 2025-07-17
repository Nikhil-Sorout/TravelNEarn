import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons
import { Alert } from "react-native";

const TravelMode = ({ navigation, route }) => {
  // Add this ref for the map
  const mapRef = useRef(null);

  const [receivername, setreceivername] = useState("");
  const [receivernumber, setreceivernumber] = useState("");
  const [phoneNumber, setphoneNumber] = useState("");
  const [useMyNumber, setUseMyNumber] = useState(false);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isNumberFocused, setIsNumberFocused] = useState(false);
  const {from, to, fullFrom, fullTo, selectedDate} = route.params
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = await AsyncStorage.getItem("startingLocation");
        const goingLocation = await AsyncStorage.getItem("goingLocation");

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);

          // Fetch coordinates and route in parallel
          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRoute(startingLocation, goingLocation),
          ]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const fetchRoute = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc"; // Replace with your API key
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
        await AsyncStorage.setItem(
          "DecodedPolyLine",
          JSON.stringify(decodedCoordinates)
        );
        setCoordinates(decodedCoordinates);
      } else {
        throw new Error("No routes found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const decodePolyline = (encoded) => {
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

  const fetchCoordinates = async (origin, destination) => {
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        setOriginCoords({
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        });
        setDestinationCoords({
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        });
        await AsyncStorage.setItem(
          "setOriginCoords",
          JSON.stringify(originCoords)
        );
        await AsyncStorage.setItem(
          "setDestinationCoords",
          JSON.stringify(destinationCoords)
        );

        setDistance(data.distance);
        setDuration(data.duration);
      } else {
        throw new Error("Invalid coordinates data");
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
      Alert.alert("Error", "Failed to fetch route data. Please try again.");
    }
  };

  useEffect(() => {
    if (originCoords) {
      // console.log("Origin Coordinates:", originCoords);
    }
  }, [originCoords]);

  useEffect(() => {
    if (destinationCoords) {
      // console.log("Destination Coordinates:", destinationCoords);
    }
  }, [destinationCoords]);

  useEffect(() => {
    if (coordinates.length > 1) {
      // console.log("Updating polyline with coordinates:", coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    const fetchUserPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("phoneNumber");
        if (storedPhone) {
          setphoneNumber(storedPhone);
        }
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };

    fetchUserPhoneNumber();
  }, []);

  // Handle checkbox toggle
  const toggleUseMyNumber = () => {
    setUseMyNumber(!useMyNumber);
    if (!useMyNumber) {
      setreceivernumber(phoneNumber);
    } else {
      setreceivernumber("");
    }
  };

  // Function to validate receiver name (only alphabets allowed)
  const validateReceiverName = (name) => {
    // Regular expression to match only alphabets and spaces
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name.trim());
  };

  // Function to validate mobile number (with optional country code)
  const validateMobileNumber = (number) => {
    // Remove any spaces, dashes, or parentheses from the number
    const cleanNumber = number.replace(/[\s\-\(\)]/g, '');
    
    // Regular expression to match:
    // Optional + followed by 1-3 digits (country code)
    // Followed by exactly 10 digits (mobile number)
    const mobileRegex = /^(\+\d{1,3})?\d{10}$/;
    return mobileRegex.test(cleanNumber);
  };

  // Function to save data in AsyncStorage
  const saveData = async () => {
    if (!receivername) {
      alert(`Please enter Receiver's Name.`);
      return;
    }
    
    if (!validateReceiverName(receivername)) {
      alert(`Please enter a valid name with only alphabets (letters).`);
      return;
    }
    
    if (!receivernumber) {
      alert(`Please enter Receiver's Number.`);
      return;
    }

    if (!validateMobileNumber(receivernumber)) {
      alert(`Please enter a valid 10-digit mobile number.`);
      return;
    }

    try {
      await AsyncStorage.setItem("receiverName", receivername.toString());
      await AsyncStorage.setItem("receiverNumber", receivernumber.toString());
      navigation.navigate("ParcelForm", {from, to, fullFrom, fullTo, selectedDate}); // Navigate after saving data
    } catch (error) {
      console.log("Error saving data:", error);
    }
  };

  // Add a new useEffect to fit the map to the coordinates when they're available
  useEffect(() => {
    // Only fit to coordinates if we have both markers and polyline data
    if (
      mapRef.current &&
      originCoords &&
      destinationCoords &&
      coordinates.length > 0
    ) {
      // Add a slight delay to ensure the map is ready
      setTimeout(() => {
        try {
          mapRef.current.fitToCoordinates([originCoords, destinationCoords], {
            edgePadding: { top: 100, right: 5, bottom: 400, left: 5 },
            animated: true,
          });
        } catch (error) {
          console.error("Error fitting map to coordinates:", error);
        }
      }, 500);
    }
  }, [originCoords, destinationCoords, coordinates]);

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        key={coordinates.length}
        style={styles.map}
        initialRegion={{
          latitude: 28, // Default center of India
          longitude: 77,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {coordinates.length > 0 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="blue"
            strokeWidth={5}
          />
        )}
        {originCoords && (
          <Marker coordinate={originCoords} title={startLocation}>
            <View style={[styles.marker, styles.startMarker]}>
              <Icon name="user" size={25} color="#fff" />
            </View>
          </Marker>
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title={endLocation}>
            <View style={[styles.marker, styles.endMarker]}>
              <Icon name="map-marker" size={25} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.header1}>
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
      {/* Details Section as Bottom Sheet */}
      <KeyboardAwareScrollView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        style={styles.detailsContainer}
      >
        {/* <ScrollView
          contentContainerStyle={styles.detailsContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        > */}
        <View style={styles.detailsContent}>
          <Text style={styles.label}>Receiver's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Receiver's Name"
            placeholderTextColor="#999"
            value={receivername}
            onChangeText={setreceivername}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />
          <Text style={styles.label}>Receiver's Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Receiver's Mobile Number"
            placeholderTextColor="#999"
            value={receivernumber}
            onChangeText={setreceivernumber}
            keyboardType="phone-pad"
            returnKeyType="done"
            onFocus={() => setIsNumberFocused(true)}
            onBlur={() => setIsNumberFocused(false)}
          />
          {/* Checkbox for using stored phone number */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={toggleUseMyNumber}
          >
            <Icon
              name={useMyNumber ? "check-square" : "square-o"}
              size={24}
              color="#53B175"
            />
            <Text style={styles.checkboxText}>
              Use my mobile number ({phoneNumber})
            </Text>
          </TouchableOpacity>
          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={saveData}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
          </View>
        {/* </ScrollView> */}
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  detailsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '48%', // or adjust as needed for your design
    paddingBottom: 24, // for safe area
  },
  detailsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  label: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: "#333",
    backgroundColor: "white",
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  nextButton: {
    backgroundColor: "#D83F3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
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
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "green",
  },
  endMarker: {
    backgroundColor: "red",
  },
});

export default TravelMode;
