import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RadioButton } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";

const radioOptions = [
  { label: "Reason 1", value: "reason1" },
  { label: "Reason 2", value: "reason2" },
  { label: "Reason 3", value: "reason3" },
  { label: "Reason 4", value: "reason4" },
];

const Cancellation = ({ route }) => {
  const { travelId } = route.params || {};
  console.log(travelId);
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalReason, setAdditionalReason] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const navigation = useNavigation();

  // Fetch phoneNumber from AsyncStorage on component mount
  useEffect(() => {
    console.log("mmm" + travelId);

    const loadPhoneNumber = async () => {
      try {
        const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (storedPhoneNumber) {
          setPhoneNumber(storedPhoneNumber);
        } else {
          Alert.alert("Error", "Phone number not found. Please log in again.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error loading phone number:", error);
        Alert.alert("Error", "Failed to load user data.");
      }
    };
    loadPhoneNumber();
  }, [navigation]);

  const handleCancelRide = async () => {
    // Validation checks remain unchanged
    if (!phoneNumber) {
      Alert.alert("Validation Error", "Phone number is required.");
      return;
    }

    if (!travelId) {
      Alert.alert("Validation Error", "Travel ID is missing.");
      return;
    }

    if (!selectedReason) {
      Alert.alert(
        "Validation Error",
        "Please select a reason for cancellation."
      );
      return;
    }

    if (!additionalReason.trim()) {
      Alert.alert(
        "Validation Error",
        "Please elaborate on your reason for cancellation."
      );
      return;
    }

    // Prepare data for the POST request
    const postData = {
      selectedreason: selectedReason,
      reasonforcancellation: additionalReason.trim(),
    };

    try {
      const response = await fetch(
        `https://travel.timestringssystem.com/n/cancel-ride/${phoneNumber}/${travelId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      console.log(response);

      // Check response status before trying to parse JSON
      if (response.ok) {
        try {
          const result = await response.json();
          Alert.alert(
            "Success",
            result.message || "Ride cancelled successfully!"
          );
          navigation.goBack();
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          // Even if parsing fails, the operation might have succeeded
          Alert.alert("Success", "Ride cancelled successfully!");
          navigation.goBack();
        }
      } else {
        // For error responses, try to get error message or show status text
        try {
          const errorData = await response.json();
          Alert.alert(
            "Error",
            errorData.message || `Failed with status: ${response.status}`
          );
        } catch (parseError) {
          // If JSON parsing fails for error response, show status code
          console.error("Error Response Parse Error:", parseError);
          Alert.alert(
            "Error",
            `Server error (${response.status}). Please try again later.`
          );
        }
      }
    } catch (networkError) {
      console.error("Cancel Ride Error:", networkError);
      Alert.alert(
        "Connection Error",
        "Failed to connect to the server. Please check your internet connection."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reason for Cancellation</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Lorem ipsum dolor sit amet consectetur. Gravida in tincidunt rhoncus
        amet purus.
      </Text>

      {/* Select reason section */}
      <Text style={styles.sectionTitle}>Select a reason for cancellation</Text>

      <View style={styles.radioContainer}>
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
        placeholder="Elaborate your reason for cancellation*"
        value={additionalReason}
        onChangeText={setAdditionalReason}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
      />

      {/* Cancel button */}
      <TouchableOpacity style={styles.button} onPress={handleCancelRide}>
        <Text style={styles.buttonText}>Cancel Ride</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Cancellation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // paddingHorizontal: 20,
    // paddingVertical: ,
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  description: {
    paddingHorizontal: 20,
    color: "#8C8C8C",
    fontSize: 14,
    backgroundColor: "#F4F4F4",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  radioContainer: {
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    marginBottom: 20,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 15,
    fontSize: 14,
    height: 120,
    margin: 20,
    backgroundColor: "#F9F9F9",
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 2,
    margin: 15,
    borderColor: "#D83F3F",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#D83F3F",
    fontSize: 16,
    fontWeight: "bold",
  },
});
