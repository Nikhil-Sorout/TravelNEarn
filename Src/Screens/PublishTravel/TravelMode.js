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
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  responsivePadding,
  responsiveFontSize,
  responsiveDimensions,
  screenWidth,
  screenHeight
} from '../../Utils/responsive';
import { 
  createTimezoneAwareDate, 
  formatDateForAPI,
  formatDateForDisplay,
  getUserTimezone,
  getUserTimezoneOffset 
} from '../../Utils/dateUtils';
import TimezoneDisplay from '../../Components/TimezoneDisplay';

const TravelMode = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState("roadways");
  const [travelNumber, setTravelNumber] = useState("");
  const [travelDate, setTravelDate] = useState(() => {
    if (route.params?.selectedDate) {
      return new Date(route.params.selectedDate);
    }
    return new Date();
  });
  const [endDate, setEndDate] = useState(() => {
    if (route.params?.selectedDate) {
      return new Date(route.params.selectedDate);
    }
    return new Date();
  });
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

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        // When keyboard shows, scroll to make the input visible
        setTimeout(() => {
          if (scrollViewRef.current && travelNumber) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 300);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // When keyboard hides, scroll back to top
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [travelNumber]);

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
      
      // Create timezone-aware date objects
      const travelDateData = createTimezoneAwareDate(travelDate, startTime);
      const endDateData = createTimezoneAwareDate(endDate, endTime);
      
      await AsyncStorage.setItem("travelMode", selectedMode);
      await AsyncStorage.setItem("travelNumber", travelNumber);
      await AsyncStorage.setItem("searchingDate", travelDateData.date);
      await AsyncStorage.setItem("endDate", endDateData.date);
      await AsyncStorage.setItem("startTime", startTime);
      await AsyncStorage.setItem("endTime", endTime);
      await AsyncStorage.setItem("userTimezone", travelDateData.timezone);
      await AsyncStorage.setItem("timezoneOffset", travelDateData.timezoneOffset.toString());

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
            const parsedDate = utcToLocalDate(storedDate);
            setTravelDate(parsedDate);
            // Automatically set end date to the same as travel date on initial load
            setEndDate(parsedDate);
          }
        }
        
        // Load endDate from AsyncStorage only if no route parameter and no stored travel date
        if (!route.params?.selectedDate) {
          const storedEndDate = await AsyncStorage.getItem("endDate");
          if (storedEndDate) {
            const parsedEndDate = utcToLocalDate(storedEndDate);
            setEndDate(parsedEndDate);
          }
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
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      <Header title="Travel Details" />
      
      {/* Route Section with Dots and Circles */}
      <View style={styles.routeSection}>
        <Text style={styles.selectedDateText}>
          Travel Date: {travelDate.toDateString()}
        </Text>
        
        {/* Timezone Display */}
        {/* <TimezoneDisplay /> */}
        
        <View style={styles.routeItem}>
          <View style={styles.routeDot} />
          <View style={styles.routeContent}>
            <Text style={styles.routeCity}>{startCity || "Starting City"}</Text>
            <Text style={styles.routeAddress}>{fullFrom || "Starting Address"}</Text>
          </View>
        </View>
        
        <View style={styles.routeItem}>
          <View style={styles.routeDot} />
          <View style={styles.routeContent}>
            <Text style={styles.routeCity}>{destCity || "Destination City"}</Text>
            <Text style={styles.routeAddress}>{fullTo || "Destination Address"}</Text>
          </View>
        </View>
        
        <View style={styles.routeLine} />
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
              <Icon name="user" size={responsiveDimensions.icon.medium} color="#fff" />
            </View>
          </Marker>
        )}
        {isValidCoordinate(destinationCoords) && (
          <Marker coordinate={destinationCoords} title={endLocation}>
            <View style={[styles.marker, styles.endMarker]}>
              <Icon name="map-marker" size={responsiveDimensions.icon.medium} color="#fff" />
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
            size={responsiveDimensions.icon.small}
            color="white"
          />
        </View>
      </TouchableOpacity>
      
                     <ScrollView 
           ref={scrollViewRef}
           showsVerticalScrollIndicator={false}
           keyboardShouldPersistTaps="always"
           contentContainerStyle={{ paddingBottom: 200 }}
           nestedScrollEnabled={true}
           keyboardDismissMode="on-drag"
           style={{ flex: 1 }}
           removeClippedSubviews={false}
         >
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
                 returnKeyType="next"
                 blurOnSubmit={false}
                 enablesReturnKeyAutomatically={false}
                 contextMenuHidden={false}
                 selectTextOnFocus={false}
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
              <View style={[styles.input, { width: '45%', marginRight: 10, padding: 0, paddingHorizontal: scale(5) }]}>
                <Picker
                  selectedValue={stayDays}
                  onValueChange={(value) => setStayDays(value)}
                  style={styles.picker}
                  mode="dropdown"
                  dropdownIconColor="#000"
                >
                  {dayOptions.map((day) => (
                    <Picker.Item key={day} label={`${day} Day${day !== '1' ? 's' : ''}`} value={day} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.input, { width: '45%', padding: 0, paddingHorizontal: scale(5) }]}>
                <Picker
                  selectedValue={stayHours}
                  onValueChange={(value) => setStayHours(value)}
                  style={styles.picker}
                  mode="dropdown"
                  dropdownIconColor="#000"
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
    fontSize: responsiveFontSize.md,
    paddingVertical: verticalScale(12),
    paddingHorizontal: responsivePadding.medium,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scale(8),
    color: '#000',
    backgroundColor: '#fff',
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    padding: responsivePadding.medium,
    fontSize: responsiveFontSize.sm,
    marginBottom: verticalScale(16),
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
  routeSection: {
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.medium,
    backgroundColor: '#fff',
    position: 'relative',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  routeDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#D32F2F',
    marginTop: scale(4),
    marginRight: scale(12),
  },
  routeContent: {
    flex: 1,
  },
  routeCity: {
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
    color: '#333',
    marginBottom: scale(2),
  },
  routeAddress: {
    fontSize: responsiveFontSize.sm,
    color: '#666',
    lineHeight: verticalScale(18),
  },
  routeLine: {
    position: 'absolute',
    width: scale(2),
    height: verticalScale(40),
    backgroundColor: '#D32F2F',
    left: scale(25),
    top: verticalScale(90),
    zIndex: 1,
  },
  detailsContainer: {
    flex: 1,
    padding: responsivePadding.medium,
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 5,
  },
  label: { 
    fontSize: responsiveFontSize.md, 
    fontWeight: "700", 
    color: "#000", 
    marginBottom: verticalScale(8) 
  },
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
    borderRadius: scale(8),
    padding: responsivePadding.medium,
    fontSize: responsiveFontSize.sm,
    marginBottom: verticalScale(16),
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
    padding: responsivePadding.medium,
    borderRadius: scale(8),
    alignItems: "center",
    marginTop: verticalScale(16),
  },
  nextButtonText: { 
    color: "#fff", 
    fontSize: responsiveFontSize.md, 
    fontWeight: "bold" 
  },
  header1: {
    position: "absolute",
    top: verticalScale(40),
    width: "13%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D83F3F",
    padding: responsivePadding.medium,
    borderRadius: scale(12),
    marginHorizontal: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 5,
  },
  marker: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
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
    marginTop: verticalScale(10),
    fontSize: responsiveFontSize.md,
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
    padding: responsivePadding.medium,
  },
  errorText: {
    fontSize: responsiveFontSize.md,
    color: '#D83F3F',
    textAlign: 'center',
    marginBottom: verticalScale(15),
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#D83F3F',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize.sm,
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

  picker: {
    height: verticalScale(55),
    color: '#000',
  },
  selectedDateText: {
    fontSize: responsiveFontSize.lg,
    fontWeight: 'bold',
    color: '#D83F3F',
    textAlign: 'center',
    marginBottom: verticalScale(10),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FFEAEA',
    borderRadius: scale(8),
    marginHorizontal: scale(10),
  },

});


export default TravelMode;
