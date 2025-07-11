import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  // SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RadioButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const radioOptions = [
  { label: "Reason 1", value: "reason1" },
  { label: "Reason 2", value: "reason2" },
  { label: "Reason 3", value: "reason3" },
  { label: "Reason 4", value: "reason4" },
];

const ReviewDetails = ({ onClose, onSearch, earning, id }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState([]);

  const [selectedReason, setSelectedReason] = useState("");
  const [additionalReason, setAdditionalReason] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);
  const ratings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const handleCancelRide = async () => {
    // Validation check
    if (!selectedRating) {
      Alert.alert("Validation Error", "Please provide a rating.");
      return;
    }

    if (!selectedReason) {
      Alert.alert(
        "Validation Error",
        "Please select what could have been better."
      );
      return;
    }

    if (!additionalReason.trim()) {
      Alert.alert("Validation Error", "Please write your feedback.");
      return;
    }

    // Prepare data for the POST request
    const postData = {
      rating: selectedRating,
      reason: selectedReason,
      additionalReason: additionalReason.trim(),
    };

    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // POST API call (Replace with your actual API endpoint)
      const response = await fetch(
        `${baseurl}api/rating/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        Alert.alert("Success", "Ride cancelled successfully!");
        navigation.goBack(); // Navigate back on success
      } else {
        Alert.alert("Error", "Something went wrong, please try again.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to cancel the ride. Please check your internet connection."
      );
    }
  };

  useEffect(() => {
    fetch("https://travel.timestringssystem.com/map/ride-status")
      .then((res) => res.json())
      .then((data) => {
        setRideStatus(data.status); // Corrected this
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Function to handle the booking request
  const handleSendRequest = async () => {
    try {
      setLoading(true);

      // Fetch phone number from AsyncStorage
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        Alert.alert("Error", "Phone number not found in storage");
        setLoading(false);
        return;
      }

      // API call
      const response = await fetch(
        "https://travel.timestringssystem.com/t/booking-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            rideId: id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Booking request sent successfully!");
        navigation.navigate("RequestSentScreen"); // Navigate on success
      } else {
        Alert.alert("Error", data.message || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending booking request:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      <Text style={styles.sectionTitle}>How was your service experience?</Text>

      <View style={styles.ratingContainer}>
        {ratings.map((rate) => (
          <TouchableOpacity
            key={rate}
            style={[
              styles.ratingBox,
              selectedRating === rate && styles.selectedRating,
            ]}
            onPress={() => setSelectedRating(rate)}
          >
            <Text
              style={
                selectedRating === rate
                  ? styles.selectedText
                  : styles.ratingText
              }
            >
              {rate}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>Poor</Text>
        <Text style={styles.labelText}>Excellent</Text>
      </View>

      {/* Select reason section */}
      <Text style={styles.sectionTitle}>What could have been better?</Text>

      <View style={styles.container1}>
        <RadioButton.Group
          onValueChange={(value) => setSelectedReason(value)}
          value={selectedReason}
        >
          {radioOptions.map((item) => (
            <View key={item.value} style={styles.radioButtonContainer}>
              <RadioButton.Android
                value={item.value}
                status={selectedReason === item.value ? "checked" : "unchecked"}
                color={selectedReason === item.value ? "#2474e1" : "gray"}
              />
              <Text style={styles.radioText}>{item.label}</Text>
            </View>
          ))}
        </RadioButton.Group>
      </View>

      {/* Text input for additional reason */}
      <TextInput
        style={styles.textInput}
        placeholder="Write your feedback in detail"
        value={additionalReason}
        onChangeText={setAdditionalReason}
        // multiline
        // keyboardType="phone-pad"
        returnKeyType="done"
      />

      {/* Cancel button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleCancelRide} // Trigger bottom sheet on press
      >
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  container1: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "space-between", // Adjusted to space between the items
    marginTop: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
  },
  description: {
    color: "#8C8C8C",
    fontSize: 14,
    // textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#F4F4F4",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    margin: 10,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioText: {
    fontSize: 14,
    marginLeft: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    margin: 10,
    height: 150,
  },
  cancelButton: {
    backgroundColor: "#D32F2F",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1, // Makes the header title take up all available space
    textAlign: "center",
  },
  backButton: {
    marginRight: 10,
  },
  button: {
    backgroundColor: "#D83F3F", // Transparent background
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    margin: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  radioButtonContainer: {
    flexDirection: "row", // Ensure text aligns with radio button
    alignItems: "center", // Keep text vertically centered
    marginBottom: 10,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 8, // Space between radio button & text
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  ratingBox: {
    width: 36,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 2,
    margin: 1,
  },
  selectedRating: {
    backgroundColor: "#05945C",
    borderColor: "#05945C",
  },
  ratingText: {
    fontSize: 12,
    color: "#000",
  },
  selectedText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  labelText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 5,
  },
});

export default ReviewDetails;
