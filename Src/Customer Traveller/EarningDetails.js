import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import commonStyles from "../styles";

const ReviewDetails = ({ onClose, onSearch, earning, id }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState([]);

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
      console.log("hhhhhh", data);

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
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.card}>
        {rideStatus.map((item, index) => (
          <View key={index}>
            <View style={styles.locationRow}>
              {/* Icon with Conditional Color */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.completed ? "#0B8043" : "#EAB308" },
                ]}
              >
                {item.completed ? (
                  <Icon name="check" size={15} color="white" />
                ) : (
                  <Ionicons name="time-outline" size={20} color="white" />
                )}
              </View>

              {/* Status Text */}

              <Text style={styles.locationText}>{item.step}</Text>
              <Text style={styles.callNowText}>{item.updatedat}</Text>
            </View>

            {/* Render Separator only if not the last item */}
            {index !== rideStatus.length - 1 && (
              <View
                style={[
                  commonStyles.verticalseparator,
                  { marginTop: 5, marginLeft: 8 },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Route Details */}

      {/* Fare Details */}

      {/* Buttons */}
    </View>
  );
};

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginLeft: 5,
  },
  routeContainer: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#00a000",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  routePoint: {
    marginBottom: 8,
  },
  fareDetails: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: "#666",
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  discount: {
    color: "green",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#53B175",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#D83F3F",
  },
  cancelButtonText: {
    color: "#D83F3F",
    fontWeight: "bold",
    fontSize: 16,
  },
  requestButton: {
    flex: 1,
    backgroundColor: "#D83F3F",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    // marginTop:-20
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  verticalseparator: {
    width: 1, // Set width to 1 for a thin line
    backgroundColor: "#ddd", // Make the background transparent
    borderStyle: "dashed", // Dotted border style
    borderLeftWidth: 1, // Add left border to simulate a vertical line
    borderLeftColor: "#ddd", // Set the color for the dotted line
    height: "30", // Set height to 100% or any specific height you need
    marginHorizontal: 15, // Optional: add horizontal spacing if needed
    marginTop: 5,
  },
  callNowText: {
    color: "black",
    fontSize: 16,
    // marginLeft:20,
    // marginTop:5,
    position: "absolute",
    left: 40,
    top: 25,
    fontWeight: "light",
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ReviewDetails;
