import React, { useState } from "react";
import {
  Dimensions,
  // SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RNPickerSelect from "react-native-picker-select";
import Header from "../../header";
import axios from "axios"; // Import axios for API requests
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const Contact = ({ navigation }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleValueChange = (value) => {
    if (value !== "null" && value) {
      setSubject(value);
    } else {
      Alert.alert("Invalid Selection", "Please select a valid option.");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate inputs
    if (!subject || !message.trim()) {
      Alert.alert("Error", "Please select a subject and enter a message.");
      return;
    }

    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        Alert.alert("Error", "Phone number not found. Please login again.");
        return;
      }

      console.log("Submitting feedback:", {
        subject: subject,
        feedbackmessage: message,
      });

      // Send feedback to backend API
      const response = await axios.post(
        `https://travel.timestringssystem.com/feed/submit/${phoneNumber}`,
        {
          subject: subject,
          feedbackmessage: message,
        }
      );
      console.log("API Response:", response.data);

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          "Your feedback has been submitted successfully!"
        );
        // Reset form
        setSubject("");
        setMessage("");
      } else {
        Alert.alert("Error", "Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert(
        "Error",
        "An error occurred while submitting your feedback. Please try again later."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Feedback Form" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.title}>Provide your Feedback</Text>
          <Text style={styles.subtitle}>
            Lorem ipsum dolor sit amet consectetur. Posuere sed odio elementum
            nunc volutpat egestas nunc ridiculus leo.
          </Text>
        </View>

        {/* Subject Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject</Text>
          <View style={styles.input}>
            <RNPickerSelect
              onValueChange={handleValueChange}
              items={[
                {
                  label: "I want to give you a feedback",
                  value: "I want to give you a feedback",
                },
              ]}
              placeholder={{ label: "Please select a mode", value: null }}
            >
              <Text>{subject || "Please select a mode"}</Text>
            </RNPickerSelect>
          </View>
        </View>

        {/* Message Box */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Type your message here..."
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity style={styles.sendButton} onPress={handleSubmit}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Contact;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: "#D83F3F",
    paddingVertical: height * 0.02, // Adjust for better touch on smaller screens
    paddingHorizontal: width * 0.05, // Dynamic horizontal padding
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  headerIcon: {
    position: "absolute", // Position the icon absolutely
    marginLeft: 20,
    left: 16, // Add padding to the left
  },
  headerTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  contactInfo: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6e6e6e",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "white",
  },
  messageInput: {
    height: 100,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: "#D32F2F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
