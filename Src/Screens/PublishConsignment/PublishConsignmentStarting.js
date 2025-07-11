import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  scale, 
  verticalScale, 
  responsivePadding, 
  responsiveFontSize, 
  responsiveDimensions 
} from "../../Utils/responsive";

// Simple Header component
const Header = ({ title, navigation }) => {
  return (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
    </SafeAreaView>
  );
};

// Input Item Component
const InputItem = ({ item, address, handleInputChange, disabled = false }) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {item.label}
        {item.required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          placeholder={item.placeholder}
          value={address[item.value] || ""}
          onChangeText={(text) => handleInputChange(item.value, text)}
          editable={!disabled}
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
          >
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const PublishStarting = ({ navigation, route }) => {
  const [address, setAddress] = useState({
    location: "",
    pincode: "",
    flat: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Address fields configuration
  const addressFields = [
    { label: "Your Location", placeholder: "Enter your location", value: "location", required: true },
    { label: "Pincode", placeholder: "110008", value: "pincode", required: true },
    {
      label: "Flat, House no, Building, Company Apartment",
      placeholder: "33/19, 1st Floor, West Patel Nagar",
      value: "flat",
      required: true,
    },
    {
      label: "Area, Street, Sector Village",
      placeholder: "West Patel Nagar",
      value: "street",
      required: true,
    },
    { label: "Landmark", placeholder: "Near Ramjas Ground", value: "landmark", required: true },
    { label: "Town/City", placeholder: "New Delhi", value: "city", required: true },
    { label: "State", placeholder: "Delhi", value: "state", required: true },
  ];

  // Initialize with route params if available
  useEffect(() => {
    console.log(route.params)
    const { displayAddress, googleMapsAddress } = route.params || {};
    
    // Use googleMapsAddress if displayAddress is empty or not provided
    const addressToUse = displayAddress || googleMapsAddress || "";
    
    if (addressToUse !== "") {
      if (googleMapsAddress && (!displayAddress || displayAddress === "")) {
        // Parse Google Maps address format: "V9WX+MF, Hodal, Haryana 121106, India"
        const parts = addressToUse.split(', ');
        
        // Extract pincode from the last part (e.g., "Haryana 121106, India")
        let pincode = "";
        let state = "";
        let city = "";
        
        if (parts.length >= 3) {
          // Last part contains state, pincode, and country
          const lastPart = parts[parts.length - 1]; // "India"
          const secondLastPart = parts[parts.length - 2]; // "Haryana 121106"
          
          // Extract pincode from "Haryana 121106"
          const pincodeMatch = secondLastPart.match(/\d{6}/);
          if (pincodeMatch) {
            pincode = pincodeMatch[0];
            state = secondLastPart.replace(/\d{6}/, '').trim(); // "Haryana"
          }
          
          // City is usually the second part
          city = parts[1] || "";
        }
        
        setAddress({
          location: addressToUse,
          pincode: pincode,
          flat: "", // Empty for Google Maps addresses
          street: "", // Empty for Google Maps addresses
          landmark: "", // Empty for Google Maps addresses
          city: city,
          state: state,
        });
      } else {
        // Parse display address format: "35/8 India Gate West  Rajpath, J67M+36V, India Gate, New Delhi, Delhi 110001, India, New Delhi Delhi"
        const addressParts = addressToUse.split(', ');
        
        let pincode = "";
        let state = "";
        let city = "";
        let flat = "";
        let street = "";
        let landmark = "";
        
        if (addressParts.length >= 6) {
          // Extract pincode from "Delhi 110001"
          const pincodePart = addressParts[addressParts.length - 3]; // "Delhi 110001"
          const pincodeMatch = pincodePart.match(/\d{6}/);
          if (pincodeMatch) {
            pincode = pincodeMatch[0];
            state = pincodePart.replace(/\d{6}/, '').trim(); // "Delhi"
          }
          
          // City is usually "New Delhi" (before the state+pincode)
          city = addressParts[addressParts.length - 4] || ""; // "New Delhi"
          
          // Landmark is "India Gate" (3rd position)
          landmark = addressParts[2] || ""; // "India Gate"
          
          // Street is "Rajpath" (part of first element after flat)
          const firstPart = addressParts[0]; // "35/8 India Gate West  Rajpath"
          const streetMatch = firstPart.match(/Rajpath/);
          if (streetMatch) {
            street = "Rajpath";
          }
          
          // Flat is the first part before street
          flat = addressParts[0] || ""; // "35/8 India Gate West  Rajpath"
        }
        
        setAddress({
          location: addressToUse,
          pincode: pincode,
          flat: flat,
          street: street,
          landmark: landmark,
          city: city,
          state: state,
        });
      }
    }
  }, [route.params]);

  const handleInputChange = useCallback((name, value) => {
    setAddress(prev => ({ ...prev, [name]: value }));
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 10000,
        timeout: 15000,
      });

      if (!location) {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          throw new Error("Unable to get current or last known location.");
        }
      }

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        const locationString = `${addr.name}, ${addr.city}, ${addr.region}, ${addr.country}`;
        
        setAddress(prev => ({
          ...prev,
          location: locationString,
          city: addr.city || "",
          state: addr.region || "",
        }));
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Unable to fetch location: " + error.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNext = useCallback(async () => {
    // Validate all required fields
    const requiredFields = ['location', 'pincode', 'flat', 'street', 'landmark', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !address[field] || address[field].trim() === '');
    
    if (missingFields.length > 0) {
      Alert.alert("Error", "Please fill all required fields marked with *.");
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(address.pincode)) {
      Alert.alert("Error", "Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      // Create display address
      const displayAddress = `${address.flat}, ${address.street}, ${address.landmark}, ${address.city}, ${address.state} - ${address.pincode}`;
      
      // Get the original Google Maps address from route params
      const { googleMapsAddress } = route.params || {};
      
      // Store both addresses in AsyncStorage
      await AsyncStorage.setItem("goingLocation", displayAddress);
      if (googleMapsAddress) {
        await AsyncStorage.setItem("goingGoogleMapsAddress", googleMapsAddress);
      }
      
      // Navigate to next screen with Google Maps address for sending from
      navigation.navigate("Search", {
        startingLocation: displayAddress,
        startingAddress: address,
        sendingFrom: googleMapsAddress || address.location, // Use Google Maps address for sending from
      });
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    }
  }, [address, navigation, route.params]);

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header title="Starting Location" navigation={navigation} />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Current Location Button */}
            {/* <TouchableOpacity
              style={[styles.currentLocationButton, isLoadingLocation && styles.disabledButton]}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#D83F3F" />
              <Text style={styles.currentLocationText}>
                {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
              </Text>
              {isLoadingLocation && (
                <ActivityIndicator size="small" color="#D83F3F" style={styles.loadingIndicator} />
              )}
            </TouchableOpacity> */}

            {/* Address Fields */}
            {addressFields.map((item, index) => (
              <InputItem
                key={index}
                item={item}
                address={address}
                handleInputChange={handleInputChange}
              />
            ))}
          </View>
        </ScrollView>

        {/* Fixed Next button at the bottom */}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.disabledButton]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#D83F3F" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#D83F3F",
    paddingVertical: verticalScale(15),
    paddingHorizontal: responsivePadding.horizontal,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: responsivePadding.medium,
  },
  headerText: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(30),
    width: '100%',
  },
  formContainer: {
    paddingHorizontal: responsivePadding.horizontal,
    paddingTop: verticalScale(15),
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: verticalScale(15),
    paddingHorizontal: responsivePadding.medium,
    borderRadius: 8,
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  currentLocationText: {
    marginLeft: responsivePadding.medium,
    fontSize: responsiveFontSize.md,
    color: "#D83F3F",
    fontWeight: "600",
  },
  loadingIndicator: {
    marginLeft: "auto",
  },
  inputContainer: {
    marginBottom: verticalScale(15),
  },
  label: {
    fontWeight: "bold",
    marginBottom: verticalScale(5),
    fontSize: responsiveFontSize.sm,
    color: "#333",
  },
  required: {
    color: "#D83F3F",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    height: verticalScale(48),
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: responsivePadding.medium,
    paddingRight: 40,
    fontSize: responsiveFontSize.sm,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  clearButton: {
    position: "absolute",
    right: responsivePadding.medium,
    height: 30,
    width: 30,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#D83F3F",
    height: verticalScale(54),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(15),
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 100,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

export default PublishStarting;
