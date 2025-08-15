import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const SearchDeliveryScreen = ({ onSearch, initialValues }) => {
  const [leavingLocation, setLeavingLocation] = useState(
    initialValues?.from || ""
  );
  const [goingLocation, setGoingLocation] = useState(initialValues?.to || "");
  const [date, setDate] = useState(
    initialValues?.date ? new Date(initialValues.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  console.log("initialValues :", initialValues)
  // Normalize date to avoid timezone issues
  const normalizeDate = (dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.includes("/")
      ? dateString.split("/").reverse()
      : dateString.split("-");
    return new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );
  };

  useEffect(() => {
    if (initialValues?.date) {
      setDate(normalizeDate(initialValues.date));
    }
  }, [initialValues?.date]);

  const formatDateDisplay = (date) => {
    const localDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return localDate;
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    return `${utcDate.getUTCDate().toString().padStart(2, "0")}/${(
      utcDate.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${utcDate.getUTCFullYear()}`;
  };

  const handleSearchPress = () => {
    const formattedDate = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`; // YYYY-MM-DD for backend
    onSearch({ leavingLocation, goingLocation, date: formattedDate });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Leaving Location Section */}
      <Text style={styles.label}>From</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="place" size={20} color="#4CAF50" />
        <TextInput
          style={styles.input}
          placeholder="Enter leaving location"
          placeholderTextColor="#aaa"
          value={leavingLocation}
          onChangeText={setLeavingLocation}
        />
      </View>

      {/* Going Location Section */}
      <Text style={styles.label}>To</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="place" size={20} color="red" />
        <TextInput
          style={styles.input}
          placeholder="Enter going location"
          placeholderTextColor="#aaa"
          value={goingLocation}
          onChangeText={setGoingLocation}
        />
      </View>

      {/* Date Section */}
      <Text style={styles.label}>Date of Delivery</Text>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => {
          console.log("Date field pressed");
          setShowDatePicker(true);
        }}
      >
        <MaterialIcons name="calendar-today" size={20} color="gray" />
        <Text style={styles.inputDate}>{formatDateDisplay(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            console.log("Date selected:", selectedDate);
            setShowDatePicker(false);
            if (selectedDate) {
              const utcDate = new Date(
                Date.UTC(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate()
                )
              );
              console.log("utcDate", utcDate);
              setDate(utcDate);
            }
          }}
        />
      )}

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
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
    marginTop: 320,
  },
  label: {
    fontSize: 16,
    fontFamily:'Inter-Bold',
    marginBottom: 8,
    color: "#000"
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
  input: {
    flex: 1,
    height: 45,
    marginLeft: 10,
    marginTop: 0,
    color: "#000"
  },
  inputDate: {
    flex: 1,
    height: 45,
    marginLeft: 10,
    // marginTop: 12,
    color: "#000",
    textAlignVertical: 'center'
  },
  searchButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SearchDeliveryScreen;
