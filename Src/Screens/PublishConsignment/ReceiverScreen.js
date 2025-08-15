import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
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

const ReceiverScreen = ({ navigation, route }) => {
  const mapRef = useRef(null);

  const [receivername, setreceivername] = useState("");
  const [receivernumber, setreceivernumber] = useState("");
  const [phoneNumber, setphoneNumber] = useState("");
  const [useMyNumber, setUseMyNumber] = useState(false);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isNumberFocused, setIsNumberFocused] = useState(false);
  const { from, to, fullFrom, fullTo, selectedDate, startCity, destCity } = route.params

  // Function to format date from UTC to readable format
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { 
        day: '2-digit', 
        month: 'short', 
        year: '2-digit' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = fullFrom || from;
        const goingLocation = fullTo || to;

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
  }, [from, to, fullFrom, fullTo]);

  const fetchRoute = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
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
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
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
      Alert.alert("Error", "Failed to fetch route data. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("phoneNumber");
        if (storedPhone) {
          setphoneNumber(storedPhone);
        }
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };

    fetchUserPhoneNumber();
  }, []);

  const toggleUseMyNumber = () => {
    setUseMyNumber(!useMyNumber);
    if (!useMyNumber) {
      setreceivernumber(phoneNumber);
    } else {
      setreceivernumber("");
    }
  };

  const validateReceiverName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name.trim());
  };

  const validateMobileNumber = (number) => {
    const cleanNumber = number.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(\+\d{1,3})?\d{10}$/;
    return mobileRegex.test(cleanNumber);
  };

  const saveData = async () => {
    if (!receivername) {
      Alert.alert("Error", "Please enter Receiver's Name.");
      return;
    }

    if (!validateReceiverName(receivername)) {
      Alert.alert("Error", "Please enter a valid name with only alphabets (letters).");
      return;
    }

    if (!receivernumber) {
      Alert.alert("Error", "Please enter Receiver's Number.");
      return;
    }

    if (!validateMobileNumber(receivernumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      await AsyncStorage.setItem("receiverName", receivername.toString());
      await AsyncStorage.setItem("receiverNumber", receivernumber.toString());
      navigation.navigate("ParcelForm", { from, to, fullFrom, fullTo, selectedDate, startCity, destCity });
    } catch (error) {
      console.log("Error saving data:", error);
    }
  };

  useEffect(() => {
    if (
      mapRef.current &&
      originCoords &&
      destinationCoords &&
      coordinates.length > 0
    ) {
      setTimeout(() => {
        try {
          // Fit to all coordinates to show the complete route
          const allCoordinates = [originCoords, ...coordinates, destinationCoords];
          mapRef.current.fitToCoordinates(allCoordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        } catch (error) {
          console.error("Error fitting map to coordinates:", error);
        }
      }, 500);
    }
  }, [originCoords, destinationCoords, coordinates]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={responsiveDimensions.icon.medium} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consignment Details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>
            {selectedDate ? formatDate(selectedDate) : "20 Jul 25"}
          </Text>
        </View>

        {/* Route Information */}
        <View style={styles.routeSection}>
          <View style={styles.routeItem}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeCity}>{startCity || "Noida"}</Text>
              <Text style={styles.routeAddress}>{fullFrom || "G-251, Gaur Grandeur, Sector 119, Noida, UP"}</Text>
            </View>
          </View>
          
          <View style={styles.routeItem}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeCity}>{destCity || "Bhubaneswar"}</Text>
              <Text style={styles.routeAddress}>{fullTo || "IVA $1/43-2, Ashok Nagar, Bhubaneswar, Odisha"}</Text>
            </View>
          </View>
          
          <View style={styles.routeLine} />
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            key={coordinates.length}
            style={styles.map}
            initialRegion={{
              latitude: 28,
              longitude: 77,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            {curvedLinePoints.length > 0 && (
              <Polyline
                coordinates={curvedLinePoints}
                strokeColor="rgba(0,0,255,0.6)"
                strokeWidth={2}
                lineDashPattern={[5, 5]}
              />
            )}
            {originCoords && (
              <Marker coordinate={originCoords} title={startLocation}>
                <View style={styles.originMarker}>
                  <MaterialIcons name="home" size={responsiveDimensions.icon.small} color="#fff" />
                </View>
              </Marker>
            )}
            {destinationCoords && (
              <Marker coordinate={destinationCoords} title={endLocation}>
                <View style={styles.destinationMarker}>
                  <MaterialIcons name="home" size={responsiveDimensions.icon.small} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Receiver Details Section */}
        <View style={styles.receiverSection}>
          <Text style={styles.sectionTitle}>Receiver's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Receiver's Name"
            placeholderTextColor="#999"
            value={receivername}
            onChangeText={setreceivername}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />

          <Text style={styles.sectionTitle}>Receiver's Mobile Number</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter Receiver's Mobile Number"
              placeholderTextColor="#999"
              value={receivernumber}
              onChangeText={setreceivernumber}
              keyboardType="phone-pad"
              returnKeyType="done"
              onFocus={() => setIsNumberFocused(true)}
              onBlur={() => setIsNumberFocused(false)}
            />
            <TouchableOpacity style={styles.phoneIcon}>
              <MaterialIcons name="phone" size={responsiveDimensions.icon.small} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Checkbox for using stored phone number */}
          <TouchableOpacity style={styles.checkboxContainer} onPress={toggleUseMyNumber}>
            <MaterialIcons
              name={useMyNumber ? "check-box" : "check-box-outline-blank"}
              size={responsiveDimensions.icon.small}
              color="#D32F2F"
            />
            <Text style={styles.checkboxText}>
              Use my mobile number ({phoneNumber})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={saveData}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsivePadding.medium,
    backgroundColor: '#D32F2F',
  },
  headerTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '500',
    marginLeft: responsivePadding.medium,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  dateSection: {
    backgroundColor: '#f5f5f5',
    paddingVertical: scale(8),
    paddingHorizontal: responsivePadding.horizontal,
  },
  dateText: {
    fontSize: responsiveFontSize.sm,
    color: '#666',
    fontWeight: '500',
  },
  routeSection: {
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.medium,
    backgroundColor: '#fff',
    position: 'relative',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(10),
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
    top: verticalScale(40),
    zIndex: 1,
  },
  mapContainer: {
    height: verticalScale(300),
    marginHorizontal: responsivePadding.horizontal,
    marginVertical: responsivePadding.medium,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  originMarker: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: '#fff',
  },
  destinationMarker: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: '#fff',
  },
  receiverSection: {
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.medium,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
    color: '#333',
    marginBottom: scale(8),
    marginTop: scale(16),
  },
  input: {
    borderWidth: scale(1),
    borderColor: '#ddd',
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: responsiveFontSize.md,
    color: '#333',
    backgroundColor: '#fafafa',
    minHeight: verticalScale(48),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: '#ddd',
    borderRadius: scale(8),
    backgroundColor: '#fafafa',
    minHeight: verticalScale(48),
  },
  phoneInput: {
    flex: 1,
    padding: scale(12),
    fontSize: responsiveFontSize.md,
    color: '#333',
  },
  phoneIcon: {
    padding: scale(12),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  checkboxText: {
    marginLeft: scale(8),
    fontSize: responsiveFontSize.sm,
    color: '#333',
  },
  buttonContainer: {
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.medium,
    backgroundColor: '#fff',
    borderTopWidth: scale(1),
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#D32F2F',
    borderRadius: scale(8),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    minHeight: verticalScale(50),
  },
  nextButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize.md,
    fontWeight: 'bold',
  },
});

export default ReceiverScreen;
