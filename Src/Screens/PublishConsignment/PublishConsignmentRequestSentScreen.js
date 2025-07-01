import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // Install Expo icons if not already
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import axios from "axios"; // Import axios for API calls

const RequestSentScreen = () => {
  const navigation = useNavigation(); // Get navigation instance

  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // First try to get from AsyncStorage
        let firstName = await AsyncStorage.getItem("firstName");

        // If not in AsyncStorage, call the API
        if (!firstName) {
          const phoneNumber = await AsyncStorage.getItem("phoneNumber");

          if (phoneNumber) {
            const response = await axios.get(
              `https://travel.timestringssystem.com/api/getall/${phoneNumber}`,
              {
                params: { phoneNumber: phoneNumber },
              }
            );

            if (
              response.data &&
              response.data.user &&
              response.data.user.firstName
            ) {
              firstName = response.data.user.firstName;

              // Save to AsyncStorage for future use
              await AsyncStorage.setItem("firstName", firstName);
            }
          }
        }

        if (firstName) {
          setUserName(firstName);
        } else {
          // Fallback
          setUserName("there");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setUserName("there");
      }
    };

    fetchUserName();

    // Set timeout to navigate after 2 seconds
    const timer = setTimeout(() => {
      navigation.navigate("Navigation");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Icon with background */}
      <View style={styles.iconContainer}>
        <MaterialIcons name="check" size={80} color="white" />
      </View>
      {/* Heading */}
      <Text style={styles.heading}>Hi {userName}!</Text>
      {/* Subtext */}
      <Text style={styles.subtext}>
        You have successfully published your consignment.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  iconContainer: {
    backgroundColor: "#53B175", // Green background
    borderRadius: 100,
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 18,
    width: 290,
    textAlign: "center",
    color: "#53B175", // Green text color
  },
});

export default RequestSentScreen;
