import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";

const TravelMode = ({ navigation }) => {
  const [selectedMode, setSelectedMode] = useState("roadways");
  const [travelNumber, setTravelNumber] = useState("");
  const [travelDate, setTravelDate] = useState(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = await AsyncStorage.getItem("startingLocation");
        const goingLocation = await AsyncStorage.getItem("goingLocation");

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);
          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRoute(startingLocation, goingLocation),
          ]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const fetchRoute = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
        await AsyncStorage.setItem(
          "DecodedPolyLine",
          JSON.stringify(decodedCoordinates)
        );
        setCoordinates(decodedCoordinates);
      } else {
        throw new Error("No routes found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchCoordinates = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://travel.timestringssystem.com/map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        setOriginCoords({
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        });
        setDestinationCoords({
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        });
        await AsyncStorage.setItem(
          "setOriginCoords",
          JSON.stringify(originCoords)
        );
        await AsyncStorage.setItem(
          "setDestinationCoords",
          JSON.stringify(destinationCoords)
        );

        setDistance(data.distance);
        setDuration(data.duration);
      } else {
        throw new Error("Invalid coordinates data");
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

  const modeLabels = {
    roadways: "Vehicle Number",
    car: "Car Number",
    airplane: "Flight Number",
    train: "Train Number",
  };

  const handleValueChange = (value) => {
    if (value && value !== "null") {
      console.log(value);
      setSelectedMode(value);
    } else {
      alert("Please select a valid option.");
    }
  };

  const onDateChange = (event, selectedDate) => {
    console.log("Selected date : ", selectedDate)
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    setTravelDate(currentDate);
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setStartTime(formattedTime);
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setEndTime(formattedTime);
    }
  };

  const saveData = async () => {
    if (!travelNumber.trim()) {
      alert(`Please enter ${modeLabels[selectedMode]}.`);
      return;
    }
    if (!travelDate) {
      alert("Please select a travel date.");
      return;
    }
    if (!startTime.trim()) {
      alert("Please select the start time.");
      return;
    }
    if (!endTime.trim()) {
      alert("Please select the end time.");
      return;
    }

    try {
      console.log("Travel date : ", travelDate)
      await AsyncStorage.setItem("travelMode", selectedMode);
      await AsyncStorage.setItem("travelNumber", travelNumber);
      await AsyncStorage.setItem("searchingDate", travelDate.toISOString());
      await AsyncStorage.setItem("startTime", startTime);
      await AsyncStorage.setItem("endTime", endTime);

      navigation.navigate("PublishTravelDetails");
    } catch (error) {
      console.log("Error saving data:", error);
    }
  };

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const storedDate = await AsyncStorage.getItem("searchingDate");
        const storedStartTime = await AsyncStorage.getItem("startTime");
        const storedEndTime = await AsyncStorage.getItem("endTime");

        if (storedDate) setTravelDate(new Date(storedDate));
        if (storedStartTime) setStartTime(storedStartTime);
        if (storedEndTime) setEndTime(storedEndTime);
      } catch (error) {
        console.log("Error retrieving travel data:", error);
      }
    };

    fetchTravelData();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        key={coordinates.length}
        style={styles.map}
        initialRegion={{
          latitude:
            originCoords && coordinates.length > 1 ? originCoords.latitude : 28,
          longitude:
            originCoords && coordinates.length > 1
              ? originCoords.longitude
              : 77,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="blue"
          strokeWidth={5}
        />
        {originCoords && (
          <Marker coordinate={originCoords} title={startLocation}>
            <View style={[styles.marker, styles.startMarker]}>
              <Icon name="user" size={25} color="#fff" />
            </View>
          </Marker>
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title={endLocation}>
            <View style={[styles.marker, styles.endMarker]}>
              <Icon name="map-marker" size={25} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.header1}>
          <Ionicons
            name="chevron-back"
            style={{
              textAlign: "center",
              alignItems: "center",
              alignSelf: "center",
            }}
            size={20}
            color="white"
          />
        </View>
      </TouchableOpacity>
      <ScrollView>
        <View style={styles.detailsContainer}>
          <Text style={styles.label}>Mode of Travel</Text>
          <View style={styles.input}>
            <RNPickerSelect
              onValueChange={handleValueChange}
              items={[
                { label: "RoadWays", value: "roadways" },
                { label: "Airplane", value: "airplane" },
                { label: "Train", value: "train" },
              ]}
              value={selectedMode}
            >
              <Text>
                {selectedMode
                  ? selectedMode === "roadways" 
                    ? "Roadways"
                    : selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)
                  : "Please select a mode"}
              </Text>
            </RNPickerSelect>
          </View>

          <Text style={styles.label}>{modeLabels[selectedMode]}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${modeLabels[selectedMode]}`}
            placeholderTextColor="#999"
            value={travelNumber}
            onChangeText={setTravelNumber}
          />

          <Text style={styles.label}>
            Select the date when you are traveling
          </Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                {travelDate ? travelDate.toDateString() : "Select Date"}
              </Text>
            </TouchableOpacity>
            <Icon
              name="calendar"
              size={20}
              color="#aaa"
              style={styles.calendarIcon}
            />
          </View>

          <Text style={styles.label}>
            Select the start & end time of your journey
          </Text>
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.inputText}>
                {startTime || "Start Time (e.g., 8:30 AM)"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.inputText}>
                {endTime || "End Time (e.g., 8:00 PM)"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={saveData}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 2.5 },
  detailsContainer: {
    flex: 3,
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  label: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  calendarIcon: {
    position: "absolute",
    right: 15,
    bottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    width: "100%",
  },
  inputText: {
    color: "#333",
  },
  timeContainer: { flexDirection: "row", justifyContent: "space-between" },
  timeInput: { flex: 1, marginRight: 8 },
  nextButton: {
    backgroundColor: "#D83F3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  header1: {
    position: "absolute",
    top: 40,
    width: "13%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D83F3F",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "green",
  },
  endMarker: {
    backgroundColor: "red",
  },
});

export default TravelMode;
