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
import RouteIcon from "react-native-vector-icons/FontAwesome6";
import { Picker } from '@react-native-picker/picker';

import {
  fetchRoute,
  decodePolyline,
  fitMapToRoute,
  getRouteColor,
  getRouteStrokeWidth,
  getDefaultRegion,
  isValidCoordinate
} from "../../Utils/routeUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../header";
import { getCurvedPolylinePoints } from '../../Utils/getCurvedPolylinePonints';

const TravelMode = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState("roadways");
  const [travelNumber, setTravelNumber] = useState("");
  const [travelDate, setTravelDate] = useState(
    route.params?.selectedDate ? new Date(route.params.selectedDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    route.params?.selectedDate ? new Date(route.params.selectedDate) : new Date()
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [stayDays, setStayDays] = useState('0');
  const [stayHours, setStayHours] = useState('0');
  const [subCategoryOfTravel, setSubCategoryOfTravel] = useState("");

  // const [curvedLinePoints, setCurvedLinePoints] = useState(null)

  console.log("route params: ",route?.params)
  const { fullFrom, fullTo, from, to, selectedDate, startCity, destCity } = route.params;
  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];
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

  const dayOptions = ['0', '1', '2', '3', 'More than 3'];
  // 0–3 days
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString()); // 0–23 hours


  // Set the travel date from route parameter if available
  useEffect(() => {
    if (route.params?.selectedDate) {
      const parsedDate = new Date(route.params.selectedDate);
      if (!isNaN(parsedDate.getTime())) {
        setTravelDate(parsedDate);
        // Automatically set end date to the same as travel date on initial load
        setEndDate(parsedDate);
      }
    }
  }, [route.params?.selectedDate]);

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

      // Add padding: more on top (40%), others 20%
      const latPadding = (maxLat - minLat) * 0.2; // 20% padding for bottom
      const lngPadding = (maxLng - minLng) * 0.2; // 20% padding for left/right
      const extraTopPadding = (maxLat - minLat) * 0.2; // extra 20% for top

      const region = {
        latitude: (minLat + maxLat) / 2 + extraTopPadding / 2, // shift center slightly down
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) + latPadding + extraTopPadding, // total 40% top padding
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
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
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
    if (selectedMode !== "roadways" && !travelNumber.trim()) {
      alert(`Please enter ${modeLabels[selectedMode]}.`);
      return;
    }

    // Vehicle number validation - only alphanumeric characters
    if (selectedMode !== "roadways") {
      const vehicleNumberRegex = /^[A-Za-z0-9]+$/;
      if (!vehicleNumberRegex.test(travelNumber.trim())) {
        alert("Vehicle number can only contain letters and numbers.");
        return;
      }
    }
    console.log(selectedMode, subCategoryOfTravel);
    if(selectedMode === 'roadways' && subCategoryOfTravel === ""){
      alert("Please select a type of vehicle")
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

    // Check if selected date is today and validate times
    const today = new Date();
    const isToday = travelDate.toDateString() === today.toDateString();
    const isEndDateToday = endDate.toDateString() === today.toDateString();

    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;

      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3].toUpperCase();

      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    const startTimeInMinutes = parseTime(startTime);
    const endTimeInMinutes = parseTime(endTime);
    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();

    // Validate start time when start date is today
    if (isToday && startTimeInMinutes !== null && startTimeInMinutes <= currentTimeInMinutes) {
      alert("Start time must be after the current time.");
      return;
    }

    // Validate end time when end date is today
    if (isEndDateToday && endTimeInMinutes !== null && endTimeInMinutes <= currentTimeInMinutes) {
      alert("End time must be after the current time.");
      return;
    }

    // Always validate that end time is after start time when dates are the same
    if (travelDate.toDateString() === endDate.toDateString()) {
      if (
        startTimeInMinutes !== null &&
        endTimeInMinutes !== null &&
        endTimeInMinutes <= startTimeInMinutes
      ) {
        alert("End time must be after the start time.");
        return;
      }
    }





    try {
      console.log("Travel date : ", travelDate)
      console.log("Date from route parameter: ", selectedDate)
      await AsyncStorage.setItem("travelMode", selectedMode);
      await AsyncStorage.setItem("travelNumber", travelNumber);
      await AsyncStorage.setItem("searchingDate", travelDate.toISOString());
      await AsyncStorage.setItem("endDate", endDate.toISOString());
      await AsyncStorage.setItem("startTime", startTime);
      await AsyncStorage.setItem("endTime", endTime);

      navigation.navigate("PublishTravelDetails", { fullFrom: fullFrom, fullTo: fullTo, from: from, to: to, selectedDate: travelDate, endDate: endDate, stayDays, stayHours, vehicleType: subCategoryOfTravel, startCity: startCity, destCity: destCity });
    } catch (error) {
      console.log("Error saving data:", error);
    }
  };

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const storedStartTime = await AsyncStorage.getItem("startTime");
        const storedEndTime = await AsyncStorage.getItem("endTime");

        // Only set travelDate from AsyncStorage if no route parameter is provided
        if (!route.params?.selectedDate) {
          const storedDate = await AsyncStorage.getItem("searchingDate");
          if (storedDate) {
            const parsedDate = new Date(storedDate);
            setTravelDate(parsedDate);
            // Automatically set end date to the same as travel date on initial load
            setEndDate(parsedDate);
          }
        }
        
        // Load endDate from AsyncStorage only if no route parameter and no stored travel date
        if (!route.params?.selectedDate) {
          const storedEndDate = await AsyncStorage.getItem("endDate");
          if (storedEndDate) setEndDate(new Date(storedEndDate));
        }
        
        if (storedStartTime) setStartTime(storedStartTime);
        if (storedEndTime) setEndTime(storedEndTime);
      } catch (error) {
        console.log("Error retrieving travel data:", error);
      }
    };

    fetchTravelData();
  }, [route.params?.selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Travel Details" />
      <View style={{ padding: 5 }}>
        {/* Date Text */}
        <Text style={styles.selectedDateText}>
          Travel Date: {travelDate.toDateString()}
        </Text>

        {/* Route Row */}
        <View style={styles.routeContainer}>
          {/* Icon Section */}
          <View style={styles.iconWrapper}>
            <RouteIcon name="route" size={24} color="#D83F3F" />
          </View>

          {/* Text Section */}
          <View style={styles.textWrapper}>
            <Text style={[styles.locationText, {fontWeight: 'bold'}]}>{startCity}</Text>
            <Text style={styles.locationText}>{fullFrom}</Text>
            <Text style={[styles.locationText, {fontWeight: 'bold'}]}>{destCity}</Text>
            <Text style={styles.locationText}>{fullTo}</Text>
          </View>
        </View>
      </View>

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
        {curvedLinePoints.length > 0 && (
          <Polyline
            coordinates={curvedLinePoints}
            strokeColor="rgba(0,0,255,0.6)"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
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
          <Text style={[styles.label, {color: "#000"}]}>Mode of Travel</Text>
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
              <Text style={{color: "grey"}}>
                {selectedMode
                  ? selectedMode === "roadways"
                    ? "Roadways"
                    : selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)
                  : "Please select a mode"}
              </Text>
            </RNPickerSelect>
          </View>

          {selectedMode === "roadways" ? (

            <>
              <Text style={[styles.label, {marginTop: 10, color :"#000"}]}>Select Vehicle Type</Text>
              <RNPickerSelect
                onValueChange={(value) => setSubCategoryOfTravel(value)}
                value={subCategoryOfTravel}
                placeholder={{ label: 'Select vehicle', value: null }}
                items={[
                  { label: 'Car', value: 'Car' },
                  { label: 'Bus', value: 'Bus' },
                  { label: 'Other', value: 'Other' },
                ]}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
              />
            </>

          ) : (
            <>
              <Text style={[styles.label, {color: '#000', marginTop: 10}]}>{modeLabels[selectedMode]}</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${modeLabels[selectedMode]}`}
                placeholderTextColor="#999"
                value={travelNumber}
                onChangeText={(text) => setTravelNumber(text)}
                autoCapitalize="characters"
                maxLength={20}
              />
            </>
          )}

          {/* <Text style={styles.label}> */}
          {/* Select the date when you are traveling */}
          {/* </Text> */}
          {/* <View style={styles.inputContainer}>
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
          </View> */}

          <Text style={[styles.label, {color: "#000", marginTop: 10}]}>
            Expected Time of start from Starting Location
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
            {/* <TouchableOpacity
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.inputText}>
                {endTime || "End Time (e.g., 8:00 PM)"}
              </Text>
            </TouchableOpacity> */}
          </View>
          <Text style={[styles.label, {color: "#000"}]}>
            Expected Time of arrival at Destination Location
          </Text>
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={[styles.input, { width: '45%', marginRight: 10 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.inputText]}>
                {endDate.toDateString()}
              </Text>
            </TouchableOpacity>
            <Icon
              name="calendar"
              size={20}
              color="#aaa"
              style={styles.calendarIcon}
            />
            <TouchableOpacity
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.inputText}>
                {endTime || "End Time (e.g., 8:00 PM)"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.label, {color: "#000"}]}>Duration of Stay</Text>
          <View style={styles.timeContainer}>
            <View style={[styles.input, { width: '45%', marginRight: 10 }]}>
              <Picker
                selectedValue={stayDays}
                onValueChange={(value) => setStayDays(value)}
                style={styles.picker}
                mode="dropdown"

              >
                {dayOptions.map((day) => (
                  <Picker.Item key={day} label={`${day} Day${day !== '1' ? 's' : ''}`} value={day} />
                ))}
              </Picker>
            </View>
            <View style={[styles.input, { width: '45%' }]}>
              <Picker
                selectedValue={stayHours}
                onValueChange={(value) => setStayHours(value)}
                style={styles.picker}
                mode="dropdown"
              >
                {hourOptions.map((hour) => (
                  <Picker.Item key={hour} label={`${hour} Hour${hour !== '1' ? 's' : ''}`} value={hour} />
                ))}
              </Picker>
            </View>
          </View>


          <TouchableOpacity style={styles.nextButton} onPress={saveData}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {
        showDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )
      }
      {
        showStartTimePicker && (
          <DateTimePicker
            value={travelDate}
            mode="time"
            display="default"
            onChange={onStartTimeChange}
          />
        )
      }
      {
        showEndTimePicker && (
          <DateTimePicker
            value={travelDate}
            mode="time"
            display="default"
            onChange={onEndTimeChange}
          />
        )
      }
    </SafeAreaView >
  );
};

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputAndroid: {
    // fontSize: 16,
    // paddingHorizontal: 12,
    // paddingVertical: 8,
    // borderWidth: 1,
    // borderColor: '#ccc',
    // borderRadius: 8,
    // color: '#000',
    // backgroundColor: '#fff',
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
  placeholder: {
    color: '#999',
  },
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { height: "30%" },
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
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch', // Ensures children stretch to match each other's height
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  // pickerWrapper: {
  //   marginVertical: 10,
  // },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  // input: {
  //   borderWidth: 1,
  //   borderColor: '#ccc',
  //   borderRadius: 8,
  //   padding: 12,
  //   fontSize: 16,
  //   marginVertical: 10,
  //   color: '#000',
  // },
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#000',
    paddingRight: 30,
  },
  placeholder: {
    color: '#999',
  },
  picker: {
    height: 55,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D83F3F',
    textAlign: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: '#FFEAEA',
    borderRadius: 8,
    marginHorizontal: 10,
  },

});


export default TravelMode;
