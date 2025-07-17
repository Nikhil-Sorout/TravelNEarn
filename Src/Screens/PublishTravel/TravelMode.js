import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { 
  fetchRoute, 
  decodePolyline, 
  fitMapToRoute, 
  getRouteColor, 
  getRouteStrokeWidth,
  getDefaultRegion,
  isValidCoordinate 
} from "../../Utils/routeUtils";

const TravelMode = ({ navigation, route }) => {
  const mapRef = useRef(null);
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
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const {fullFrom, fullTo, from, to, selectedDate} = route.params;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = from;
        const goingLocation = to;

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);
          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRouteData(startingLocation, goingLocation),
          ]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        setRouteError("Failed to load route data");
      }
    };

    fetchLocations();
  }, []);

  // Set the travel date from route parameter if available
  useEffect(() => {
    if (selectedDate) {
      const parsedDate = new Date(selectedDate);
      console.log("Parsed date: ", parsedDate)
      if (!isNaN(parsedDate.getTime())) {
        setTravelDate(parsedDate);
        setDate(parsedDate);
        console.log("Setting travel date from route parameter:", parsedDate);
      }
    }
  }, [selectedDate]);

  // Fit map to route when both coordinates and route data are available
  useEffect(() => {
    if (mapRef.current && coordinates.length > 0 && originCoords && destinationCoords) {
      // Calculate bounds for the entire route including coordinates
      let minLat = Math.min(originCoords.latitude, destinationCoords.latitude);
      let maxLat = Math.max(originCoords.latitude, destinationCoords.latitude);
      let minLng = Math.min(originCoords.longitude, destinationCoords.longitude);
      let maxLng = Math.max(originCoords.longitude, destinationCoords.longitude);

      // Include all route coordinates in bounds calculation
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord.latitude);
        maxLat = Math.max(maxLat, coord.latitude);
        minLng = Math.min(minLng, coord.longitude);
        maxLng = Math.max(maxLng, coord.longitude);
      });

      // Add padding to ensure the entire route is visible
      const latPadding = (maxLat - minLat) * 0.2; // 20% padding
      const lngPadding = (maxLng - minLng) * 0.2; // 20% padding

      const region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) + latPadding,
        longitudeDelta: (maxLng - minLng) + lngPadding,
      };

      // Animate to the calculated region
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [coordinates, originCoords, destinationCoords]);

  const fetchRouteData = async (origin, destination) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
      const routeData = await fetchRoute(origin, destination, GOOGLE_MAPS_API_KEY, 'driving');
      
      setCoordinates(routeData.coordinates);
      setDistance(routeData.distance);
      setDuration(routeData.duration);
      
      await AsyncStorage.setItem("DecodedPolyLine", JSON.stringify(routeData.coordinates));
      
    } catch (error) {
      console.error("Error fetching route:", error);
      setRouteError("Failed to load route. Please try again.");
    } finally {
      setIsLoadingRoute(false);
    }
  };



  const fetchCoordinates = async (origin, destination) => {
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        const originCoord = {
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        };
        const destCoord = {
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        };
        
        setOriginCoords(originCoord);
        setDestinationCoords(destCoord);
        
        await AsyncStorage.setItem("setOriginCoords", JSON.stringify(originCoord));
        await AsyncStorage.setItem("setDestinationCoords", JSON.stringify(destCoord));
      } else {
        throw new Error("Invalid coordinates data");
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
      setRouteError("Failed to load location coordinates");
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
      // Check if selected date is today and time is in the past
      const today = new Date();
      // const isToday = date.toDateString() === today.toDateString();
      
      // if (isToday && selectedTime <= today) {
      //   alert("Start time for today must be after the current time.");
      //   return;
      // }
      
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
    
    // Vehicle number validation - only alphanumeric characters
    if (selectedMode === "roadways" || selectedMode === "car") {
      const vehicleNumberRegex = /^[A-Za-z0-9]+$/;
      if (!vehicleNumberRegex.test(travelNumber.trim())) {
        alert("Vehicle number can only contain letters and numbers.");
        return;
      }
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

    // Check if selected date is today and validate times
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      const currentTime = today.getHours() * 60 + today.getMinutes(); // Convert to minutes
      
      // Parse start time
      const startTimeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (startTimeMatch) {
        let startHour = parseInt(startTimeMatch[1]);
        const startMinute = parseInt(startTimeMatch[2]);
        const startPeriod = startTimeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
        if (startPeriod === 'AM' && startHour === 12) startHour = 0;
        
        const startTimeInMinutes = startHour * 60 + startMinute;
        
        if (startTimeInMinutes <= currentTime) {
          alert("Start time for today must be after the current time.");
          return;
        }
      }
      
      // Parse end time
      const endTimeMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (endTimeMatch) {
        let endHour = parseInt(endTimeMatch[1]);
        const endMinute = parseInt(endTimeMatch[2]);
        const endPeriod = endTimeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        
        const endTimeInMinutes = endHour * 60 + endMinute;
        
        if (endTimeInMinutes <= currentTime) {
          alert("End time for today must be after the current time.");
          return;
        }
      }
    }

    // Validate that end time is after start time
    const startTimeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endTimeMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    
    if (startTimeMatch && endTimeMatch) {
      let startHour = parseInt(startTimeMatch[1]);
      const startMinute = parseInt(startTimeMatch[2]);
      const startPeriod = startTimeMatch[3].toUpperCase();
      
      let endHour = parseInt(endTimeMatch[1]);
      const endMinute = parseInt(endTimeMatch[2]);
      const endPeriod = endTimeMatch[3].toUpperCase();
      
      // Convert to 24-hour format for start time
      if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
      if (startPeriod === 'AM' && startHour === 12) startHour = 0;
      
      // Convert to 24-hour format for end time
      if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
      if (endPeriod === 'AM' && endHour === 12) endHour = 0;
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      if (endTimeInMinutes <= startTimeInMinutes) {
        alert("End time must be after start time.");
        return;
      }
    }

    try {
      console.log("Travel date : ", travelDate)
      console.log("Date from route parameter: ", selectedDate)
      await AsyncStorage.setItem("travelMode", selectedMode);
      await AsyncStorage.setItem("travelNumber", travelNumber);
      await AsyncStorage.setItem("searchingDate", date.toISOString());
      await AsyncStorage.setItem("startTime", startTime);
      await AsyncStorage.setItem("endTime", endTime);

      navigation.navigate("PublishTravelDetails", {fullFrom: fullFrom, fullTo: fullTo, from: from, to: to, selectedDate: date});
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
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={
          originCoords && destinationCoords
            ? {
                latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
                longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
              }
            : getDefaultRegion()
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {coordinates.length > 0 && (
          <Polyline
            coordinates={coordinates}
            strokeColor={getRouteColor('driving')}
            strokeWidth={getRouteStrokeWidth('driving')}
            lineDashPattern={[1]}
          />
        )}
        {isValidCoordinate(originCoords) && (
          <Marker coordinate={originCoords} title={startLocation}>
            <View style={[styles.marker, styles.startMarker]}>
              <Icon name="user" size={25} color="#fff" />
            </View>
          </Marker>
        )}
        {isValidCoordinate(destinationCoords) && (
          <Marker coordinate={destinationCoords} title={endLocation}>
            <View style={[styles.marker, styles.endMarker]}>
              <Icon name="map-marker" size={25} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>
      
      {/* Loading overlay */}
      {isLoadingRoute && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D83F3F" />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}
      
      {/* Error overlay */}
      {routeError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{routeError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (startLocation && endLocation) {
                fetchRouteData(startLocation, endLocation);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
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
            autoCapitalize="characters"
            maxLength={20}
          />

          <Text style={styles.label}>
            Select the date when you are traveling
          </Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.input]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.inputText]}>
                {date.toDateString()}
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
          minimumDate={new Date(new Date().setDate(new Date().getDate()))}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D83F3F',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#D83F3F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  routeDateInput: {
    borderColor: '#D83F3F',
    backgroundColor: '#fff5f5',
  },
  routeDateText: {
    color: '#D83F3F',
    fontWeight: '600',
  },
});

export default TravelMode;
