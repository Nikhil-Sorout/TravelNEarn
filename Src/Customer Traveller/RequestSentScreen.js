import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons'; // Install Expo icons if not already
import { useNavigation } from '@react-navigation/native'; // For navigation

const RequestSentScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Redirect to the next screen after 2 seconds
    const timer = setTimeout(() => {
      navigation.navigate("Navigation"); // Replace "NextPage" with the actual screen name you want to navigate to
    }, 2000);

    // Clean up the timer when component unmounts
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Icon with background */}
      <View style={styles.iconContainer}>
        <MaterialIcons name="check" size={80} color="white" />
      </View>
      {/* Heading */}
      <Text style={styles.heading}>Request Sent to the traveller</Text>
      {/* Subtext */}
      <Text style={styles.subtext}>
        You have Successfully sent your consignment request
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
