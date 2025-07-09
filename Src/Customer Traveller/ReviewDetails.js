import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ReviewDetails = ({
  onClose,
  earning,
  id,
  fromLocation,
  toLocation,
  fare,
  deliveryFee,
  teFee,
  discount,
  baseFare,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    try {
      setLoading(true);

      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      console.log("Retrieved phoneNumber:", phoneNumber);
      if (!phoneNumber) {
        Alert.alert(
          "Error",
          "Phone number not found. Please log in or set your phone number."
        );
        setLoading(false);
        return;
      }

      if (!id) {
        Alert.alert("Error", "Ride ID is missing. Please try again.");
        setLoading(false);
        return;
      }

      const payload = { phoneNumber, rideId: id };
      console.log("Sending payload:", payload);
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // const baseurl = "http://192.168.1.5:5002/";
      const response = await fetch(
        `${baseurl}t/booking-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok) {
        Alert.alert("Success", "Booking request sent successfully!");
        navigation.navigate("RequestSentScreen");
        if (onClose) onClose();
      } else {
        Alert.alert("Error", data.message || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending booking request:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("handleClose called in ReviewDetails");
    if (onClose) {
      console.log("onClose exists, calling it now");
      onClose();
    } else {
      console.log("onClose is undefined, falling back to navigation.goBack()");
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.infoRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Review Details</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.locationRow}>
              <Image
                source={require("../Images/locon.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={2}>
                {fromLocation || "N/A"}
              </Text>
            </View>
            <View style={styles.verticalseparator} />
            <View style={styles.separator} />
            <View style={styles.locationRow}>
              <Image
                source={require("../Images/locend.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={2}>
                {toLocation || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fareDetails}>
          <View style={styles.row}>
            <Text style={styles.label}>Base Fare</Text>
            <Text style={styles.value}>₹{baseFare || "0"}</Text>
          </View>
          <Text style={{fontSize: 12, color: "#666", marginBottom: 10}}>Total expected fare is calculated based on the weight of consignment + Platform fee</Text>
          {/* <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>₹{deliveryFee || "0"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>T&E Fee</Text>
            <Text style={styles.value}>₹{teFee || "0"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, styles.discount]}>Discount</Text>
            <Text style={[styles.value, styles.discount]}>
              -₹{discount || "0"}
            </Text>
          </View> */}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Expected Fare</Text>
            <Text style={styles.totalValue}>₹{earning || "0"}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, loading && styles.disabledButton]}
          onPress={handleSendRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Request"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
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
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginTop: 3,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    flex: 1,
    flexWrap: "wrap",
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
    width: 1,
    backgroundColor: "#ddd",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    height: 40,
    marginHorizontal: 11,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
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
  disabledButton: {
    backgroundColor: "#aaaaaa",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ReviewDetails;
