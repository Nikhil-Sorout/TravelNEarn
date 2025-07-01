import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Incompleted

const PublishSucc = () => {
  return (
    <View style={styles.container}>
      {/* Checkmark Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.checkmark}>
          <Text style={styles.checkText}>✔</Text>
        </View>
      </View>

      {/* Success Message */}
      <Text style={styles.greeting}>Hi John Doe!</Text>
      <Text style={styles.message}>
        You have Successfully Published your travel
      </Text>
    </View>
  );
};

export default PublishSucc;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  iconContainer: {
    marginBottom: 20,
  },
  checkmark: {
    width: 100,
    height: 100,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    fontSize: 50,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 20,
  },
  message: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
    marginTop: 10,
  },
});
