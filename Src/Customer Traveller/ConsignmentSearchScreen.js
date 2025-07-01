import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native"; // Added for navigation

const ConsignmentSearchScreen = ({ onSearch, initialValues }) => {
  const navigation = useNavigation(); // Initialize navigation hook
  const [selectedMode, setSelectedMode] = useState("");
  const [from, setFrom] = useState(initialValues?.from || "");
  const [to, setTo] = useState(initialValues?.to || "");
  const [date, setDate] = useState(initialValues?.date || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [travelModeError, setTravelModeError] = useState("");

  // Handle travel mode selection from dropdown
  const handleTravelModeSelect = (value) => {
    if (value && value !== "null") {
      setSelectedMode(value);
      setTravelModeError("");
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date(date);
    setShowDatePicker(false);
    setDate(currentDate.toISOString());
  };

  // Handle search button press
  const handleSearch = () => {
    if (!selectedMode) {
      setTravelModeError("Please select travel mode");
      return;
    }
    onSearch({ from, to, mode: selectedMode, date });
  };

  // Handle back button press
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <MaterialIcons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* From Section */}
      <Text style={styles.label}>From</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="place" size={20} color="#4CAF50" />
        <TextInput
          style={styles.textInput}
          placeholder="Enter location"
          placeholderTextColor="#aaa"
          value={from}
          onChangeText={setFrom}
        />
      </View>

      {/* To Section */}
      <Text style={styles.label}>To</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="place" size={20} color="red" />
        <TextInput
          style={styles.textInput}
          placeholder="Enter destination"
          placeholderTextColor="#aaa"
          value={to}
          onChangeText={setTo}
        />
      </View>

      {/* Mode of Travel (Dropdown) */}
      <Text style={styles.label}>Mode of Travel</Text>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={handleTravelModeSelect}
          items={[
            { label: "Roadways", value: "car" },
            { label: "Airplane", value: "airplane" },
            { label: "Train", value: "train" },
          ]}
          placeholder={{ label: "Select a mode", value: null }}
          style={pickerSelectStyles}
          value={selectedMode}
        />
      </View>
      {travelModeError ? (
        <Text style={styles.errorText}>{travelModeError}</Text>
      ) : null}

      {/* Date of Sending */}
      <Text style={styles.label}>Date of Sending</Text>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setShowDatePicker(true)}
      >
        <MaterialIcons name="calendar-today" size={20} color="gray" />
        <Text style={styles.inputDate}>
          {date ? new Date(date).toDateString() : "No Date Selected"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Result Card */}
      <Text style={styles.label}>Select your consignment</Text>
      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locon.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>{from || "Not Provided"}</Text>
        </View>

        <View style={styles.verticalseparator}></View>
        <View style={styles.separator} />

        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locend.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>{to || "Not Provided"}</Text>
        </View>

        <View style={styles.separator1} />

        <Text style={styles.cardTitle}>Date & Time of Sending (Expected)</Text>
        <Text style={styles.cardSubtext}>
          {date ? new Date(date).toDateString() : "No Date Selected"}
        </Text>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    color: "#000",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  textInput: {
    flex: 1,
    height: 45,
    paddingLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  inputDate: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    paddingLeft: 10,
    lineHeight: 45,
  },
  card: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    color: "#000",
    marginBottom: 5,
  },
  cardSubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#555",
    marginTop: 8,
  },
  searchButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
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
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginLeft: 5,
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
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
    fontFamily: "Inter-Regular",
  },
  backButton: { // Added back button style
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: { // Added back button text style
    fontSize: 16,
    color: "#333",
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
});

// Custom styles for RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#333",
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 8,
    color: "#333",
  },
  placeholder: {
    color: "#aaa",
  },
});

export default ConsignmentSearchScreen;