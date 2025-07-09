import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import * as Location from "expo-location";
import { useSocket } from "../Context/socketprovider";

const UpdateStatus = ({ travelId, consignmentId, onClose, onSearch, currentStatus }) => {
  const navigation = useNavigation();
  const { socket, sendLocationUpdate, startLocationTracking } = useSocket();
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState(
    currentStatus === "Collected" || currentStatus === "Consignment Collected" 
      ? "Completed" 
      : "Collected"
  );
  const [travelNumber, setTravelNumber] = useState("");
  const [locationError, setLocationError] = useState(null);
  const [isLocationServicesEnabled, setIsLocationServicesEnabled] =
    useState(null);

  // Check location services and permissions
  const checkLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      setIsLocationServicesEnabled(isEnabled);
      if (!isEnabled) {
        setLocationError(
          "Location services are disabled. Please enable them in your device settings."
        );
        return false;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Location permission denied. Please enable location permissions in your app settings."
        );
        return false;
      }

      setLocationError(null);
      return true;
    } catch (error) {
      console.error("Error checking location services:", error.message);
      setLocationError("Unable to verify location services. Please try again.");
      setIsLocationServicesEnabled(false);
      return false;
    }
  };

  // Monitor location services
  useEffect(() => {
    checkLocationServices();
    const interval = setInterval(checkLocationServices, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update selectedMode when currentStatus changes
  useEffect(() => {
    if (currentStatus === "Collected" || currentStatus === "Consignment Collected") {
      setSelectedMode("Completed");
    } else {
      setSelectedMode("Collected");
    }
  }, [currentStatus]);

  // Fetch ride status
  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        const baseurl = await AsyncStorage.getItem("apiBaseUrl");
        const response = await fetch(
          // `https://travel.timestringssystem.com/order/get-ride/${travelId}`
          `${baseurl}order/get-ride/${travelId}`
        );
        if (!response.ok) {
          const text = await response.text();
          console.error(
            `Server error: ${response.status} ${response.statusText}, Response: ${text}`
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error(
            `Invalid content type: ${contentType}, Response: ${text}`
          );
          throw new Error("Response is not JSON");
        }

        const data = await response.json();
        console.log("Ride Status:", data);
      } catch (error) {
        console.error("Error fetching ride status:", error.message);
      }
    };

    fetchRideStatus();
  }, [travelId]);

  // Handle Socket.IO tracking events
  useEffect(() => {
    if (!socket) return;

    const handleStartTracking = (data) => {
      console.log("Start tracking:", data);
      let isTracking = true;

      const locationInterval = setInterval(async () => {
        if (!isTracking) return;

        try {
          if (!(await checkLocationServices())) {
            Alert.alert(
              "Location Services Required",
              "Please enable location services to continue tracking.",
              [{ text: "OK" }]
            );
            return;
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          });

          const { latitude, longitude } = loc.coords;
          socket.emit("locationUpdate", {
            travelId,
            consignmentId,
            riderPhone: await AsyncStorage.getItem("phoneNumber"),
            ltd: latitude,
            lng: longitude,
            timestamp: new Date().toISOString(),
          });
          console.log("Sent location update:", { latitude, longitude });
        } catch (error) {
          console.error("Error sending location update:", error.message);
          Alert.alert(
            "Location Update Failed",
            "Unable to update location. Please check your internet connection and try again.",
            [{ text: "OK" }]
          );
        }
      }, 5000); // Update every 5 seconds instead of 50

      socket.on(`stopTracking:${consignmentId}`, () => {
        console.log("Stop tracking received");
        isTracking = false;
        clearInterval(locationInterval);
      });

      // Handle socket disconnection
      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        isTracking = false;
        clearInterval(locationInterval);
        Alert.alert(
          "Connection Lost",
          "Lost connection to tracking server. Attempting to reconnect...",
          [{ text: "OK" }]
        );
      });

      // Handle socket reconnection
      socket.on("connect", () => {
        console.log("Socket reconnected");
        if (isTracking) {
          // Restart tracking if we were tracking before disconnect
          handleStartTracking(data);
        }
      });

      return () => {
        isTracking = false;
        clearInterval(locationInterval);
        socket.off(`startTracking:${consignmentId}`);
        socket.off(`stopTracking:${consignmentId}`);
        socket.off("disconnect");
        socket.off("connect");
      };
    };

    socket.on(`startTracking:${consignmentId}`, handleStartTracking);

    return () => {
      socket.off(`startTracking:${consignmentId}`);
      socket.off(`stopTracking:${consignmentId}`);
      socket.off("disconnect");
      socket.off("connect");
    };
  }, [socket, travelId, consignmentId]);

  const handleValueChange = (value) => {
    if (value && value !== "null") {
      setSelectedMode(value);
    } else {
      Alert.alert("Validation Error", "Please select a valid option.");
    }
  };

  // Fetch location with retries and fallback accuracy
  const fetchLocationWithRetry = async (retries = 3, delay = 1000) => {
    const accuracies = [Location.Accuracy.High, Location.Accuracy.Balanced];

    for (let accuracy of accuracies) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          if (!(await checkLocationServices())) {
            throw new Error(
              "Location services are disabled. Please enable them in your device settings."
            );
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy,
            timeout: 15000, // Increased timeout to 15 seconds
          });
          console.log(
            `Location fetch attempt ${attempt} with ${accuracy === Location.Accuracy.High ? "High" : "Balanced"} accuracy succeeded`
          );
          return loc.coords;
        } catch (error) {
          console.error(
            `Location fetch attempt ${attempt} with ${accuracy === Location.Accuracy.High ? "High" : "Balanced"} accuracy failed:`,
            error.message
          );
          if (
            attempt === retries &&
            accuracy === accuracies[accuracies.length - 1]
          ) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  };

  const promptToEnableLocationServices = (errorMessage) => {
    Alert.alert(
      "Location Services Issue",
      errorMessage ||
        "Unable to fetch current location. Please ensure location services are enabled and try again.",
      [
        { text: "Cancel", onPress: () => setLoading(false) },
        {
          text: "Open Settings",
          onPress: () => {
            Linking.openSettings();
            setLoading(false);
          },
        },
        {
          text: "Retry",
          onPress: async () => {
            setLoading(true);
            if (await checkLocationServices()) {
              handleSubmit();
            } else {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMode) {
      Alert.alert("Validation Error", "Please select a status.");
      return;
    }
    if (!travelNumber.trim()) {
      Alert.alert(
        "Validation Error",
        `Please enter ${selectedMode === "Collected" ? "Sender OTP" : "Receiver OTP"}.`
      );
      return;
    }

    try {
      setLoading(true);
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        Alert.alert("Error", "Phone number not found in storage");
        setLoading(false);
        return;
      }

      // Fetch location for both Collected and Completed
      let ltd, lng;
      if (selectedMode === "Collected" || selectedMode === "Completed") {
        if (!isLocationServicesEnabled) {
          promptToEnableLocationServices(
            "Location services are disabled. Please enable them in your device settings."
          );
          return;
        }
        try {
          const coords = await fetchLocationWithRetry();
          ({ latitude: ltd, longitude: lng } = coords);
          console.log("Location fetched successfully:", {
            latitude: ltd,
            longitude: lng,
          });
        } catch (error) {
          console.error("Location fetch failed:", error.message);
          promptToEnableLocationServices(
            "Failed to fetch location. This could be due to disabled location services, poor GPS signal, or device issues. Please try again."
          );
          return;
        }
      }

      await submitStatus(phoneNumber, ltd, lng);
    } catch (error) {
      console.error("Error updating status:", error.message);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const submitStatus = async (phoneNumber, ltd, lng) => {
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // API call for status update with OTP verification
      const apiEndpoint =
        selectedMode === "Completed"
          ? `${baseurl}editp/deliver?travelId=${travelId}&consignmentId=${consignmentId}`
          : `${baseurl}editp/pickupconsignment?travelId=${travelId}&consignmentId=${consignmentId}`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedMode,
          otp: travelNumber,
          ...((selectedMode === "Collected" ||
            selectedMode === "Completed") && { ltd, lng }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // If OTP verification successful and status is "Collected", start sending location updates
        if (socket && selectedMode === "Collected") {
          console.log("OTP verified! Starting location tracking");

          // Send initial location immediately
          socket.emit("riderLocation", {
            travelId,
            latitude: ltd,
            longitude: lng,
          });

          // Start tracking every 5 seconds
          // startLocationTracking(travelId, consignmentId);
        } else if (selectedMode === "Completed") {
          // If completed, stop tracking and clear from AsyncStorage
          console.log("Delivery completed, stopping tracking");
          try {
            await AsyncStorage.removeItem(`tracking_${consignmentId}`);
          } catch (error) {
            console.error("Error removing tracking data:", error);
          }
        }

        // Success alert
        const displayStatus =
          selectedMode === "Collected" ? "Collected" : "Delivered";
        Alert.alert("Success", `Consignment ${displayStatus} successfully!`, [
          {
            text: "OK",
            onPress: () => {
              if (typeof onClose === "function") {
                onClose();
              }
              if (typeof onSearch === "function") {
                onSearch(data);
              }
              setLoading(false);
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update status");
        setLoading(false);
      }
    } catch (error) {
      throw error;
    }
  };

  // Function to handle OTP verification
  const handleVerify = async () => {
    try {
      setLoading(true);

      // Check OTP length
      if (selectedMode === "Collected" && travelNumber.length !== 4) {
        Alert.alert("Error", "Please enter a valid 4-digit OTP");
        setLoading(false);
        return;
      } else if (selectedMode === "Completed" && travelNumber.length !== 4) {
        Alert.alert("Error", "Please enter a valid 4-digit OTP");
        setLoading(false);
        return;
      }

      // Get current location (for both statuses)
      let ltd = null;
      let lng = null;

      // Location is required for both collected and completed states
      const locationAvailable = await checkLocationServices();
      if (!locationAvailable) {
        promptToEnableLocationServices();
        return;
      }

      try {
        const location = await fetchLocationWithRetry();
        if (location) {
          ltd = location.coords.latitude;
          lng = location.coords.longitude;
          console.log(`UpdateStatus: Got location: ${ltd}, ${lng}`);
        } else {
          Alert.alert(
            "Error",
            "Could not get your location. Please try again."
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error getting location:", error);
        promptToEnableLocationServices(error.message);
        return;
      }

      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // Proceed with API call
      const apiEndpoint =
        selectedMode === "Completed"
          ? `${baseurl}editp/deliver?travelId=${travelId}&consignmentId=${consignmentId}`
          : `${baseurl}editp/pickupconsignment?travelId=${travelId}&consignmentId=${consignmentId}`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedMode,
          otp: travelNumber,
          ...((selectedMode === "Collected" ||
            selectedMode === "Completed") && { ltd, lng }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // If status is "Collected", start location tracking
        if (selectedMode === "Collected") {
          // First send the initial location
          await sendLocationUpdate(travelId, consignmentId, {
            latitude: ltd,
            longitude: lng,
          });

          // Then start continuous tracking if needed
          if (socket) {
            await startLocationTracking(travelId, consignmentId);
            console.log("UpdateStatus: Started location tracking");
          }
        }

        // For completed status, we may want to send a final location update but stop tracking
        if (selectedMode === "Completed") {
          await sendLocationUpdate(travelId, consignmentId, {
            latitude: ltd,
            longitude: lng,
          });
        }

        // Success alert
        const displayStatus =
          selectedMode === "Collected" ? "Collected" : "Delivered";
        Alert.alert("Success", `Consignment ${displayStatus} successfully!`, [
          {
            text: "OK",
            onPress: () => {
              if (onSearch) {
                onSearch();
              }
              if (onClose) {
                onClose();
              }
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update status");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleVerify:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>
              {currentStatus === "Collected" || currentStatus === "Consignment Collected" 
                ? "Complete Delivery" 
                : "Update Status"}
            </Text>

            <View style={styles.detailsContainer}>
              {isLocationServicesEnabled === false && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    Location services are disabled. Please enable them to update
                    status.
                  </Text>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => Linking.openSettings()}
                  >
                    <Text style={styles.settingsButtonText}>Open Settings</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.label}>
                {currentStatus === "Collected" || currentStatus === "Consignment Collected" 
                  ? "Update to Completed" 
                  : "Status"}
              </Text>
              <View style={styles.inputContainer}>
                <RNPickerSelect
                  onValueChange={handleValueChange}
                  items={
                    currentStatus === "Collected" || currentStatus === "Consignment Collected"
                      ? [{ label: "Completed", value: "Completed" }]
                      : [
                          { label: "Collected", value: "Collected" },
                          { label: "Completed", value: "Completed" },
                        ]
                  }
                  placeholder={{ label: "Select a status", value: null }}
                  style={{
                    inputIOS: styles.pickerStyle,
                    inputAndroid: styles.pickerStyle,
                  }}
                  useNativeAndroidPickerStyle={false}
                  value={selectedMode}
                >
                  <Text style={styles.pickerText}>
                    {selectedMode || "Select a status"}
                  </Text>
                </RNPickerSelect>
              </View>

              <Text style={styles.label}>
                {selectedMode === "Collected" ? "Sender OTP" : "Receiver OTP"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${selectedMode === "Collected" ? "Sender" : "Receiver"} OTP`}
                placeholderTextColor="#999"
                value={travelNumber}
                onChangeText={setTravelNumber}
                keyboardType="numeric"
              />

              {(selectedMode === "Collected" ||
                selectedMode === "Completed") && (
                <Text style={styles.locationNote}>
                  Location is required for{" "}
                  {selectedMode === "Collected" ? "pickup" : "delivery"}. Ensure
                  location services are enabled.
                </Text>
              )}

              <TouchableOpacity
                style={[styles.nextButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={
                  loading ||
                  ((selectedMode === "Collected" ||
                    selectedMode === "Completed") &&
                    !isLocationServicesEnabled)
                }
              >
                <Text style={styles.nextButtonText}>
                  {loading ? "Submitting..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#D1D1D1",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    padding: 5,
  },
  warningContainer: {
    backgroundColor: "#FFF3CD",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  settingsButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  pickerStyle: {
    fontSize: 14,
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  pickerText: {
    fontSize: 14,
    color: "#333",
    padding: 12,
  },
  locationNote: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  nextButton: {
    backgroundColor: "#D83F3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UpdateStatus;
