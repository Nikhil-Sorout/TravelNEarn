import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RBSheet from "react-native-raw-bottom-sheet"; // Importing the Bottom Sheet library
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons
import { SafeAreaView } from "react-native-safe-area-context";
import ReviewDetails from "../../Customer Traveller/ReviewDetails";
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
  formatDateForAPI,
  createConsignmentPublishData,
  getUserTimezone,
  getUserTimezoneOffset , 
  formatDateForDisplay
} from '../../Utils/dateUtils';
import { formatDate } from '../../Utils/dateTimeUtils';

const TravelDetails = ({ route }) => {
  const navigation = useNavigation();

  // Create a reference for the bottom sheet
  const bottomSheetRef = useRef();
  console.log(route?.params)
  const { fullFrom, fullTo, from, to, selectedDate, category, subCategory, startCity, destCity } = route?.params;
  console.log(route.params)

  // Initially, set the modal visibility to false to avoid it showing on the first enter
  const [isModalVisible, setModalVisible] = useState(false);
  const [travelMode, setTravelMode] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [searchingDate, setSearchingDate] = useState(null);
  const [receiverName, setReceiverName] = useState(null);
  const [receiverNumber, setReceiverNumber] = useState(null);
  const [parcelDetails, setParcelDetails] = useState(null);
  const [name, setName] = useState(null);
  const [number, setNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];
  // Add map reference
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = from;
        const goingLocation = to;

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);

          // Fetch coordinates and route in parallel
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
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc"; // Replace with your API key
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

  console.log("startLocation", startLocation);
  console.log("endLocation", endLocation);
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
    if (originCoords) {
      // console.log("Origin Coordinates:", originCoords);
    }
  }, [originCoords]);

  useEffect(() => {
    if (destinationCoords) {
      // console.log("Destination Coordinates:", destinationCoords);
    }
  }, [destinationCoords]);

  useEffect(() => {
    if (coordinates.length > 1) {
      // console.log("Updating polyline with coordinates:", coordinates);
    }
  }, [coordinates]);

  const handleCloseModal = () => {
    console.log("Modal is closing...");
    setModalVisible(false);
  };

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(null);
  };

  const handlePublishConsignment = async () => {
    setLoading(true);

    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // const baseurl = "http://192.168.1.30:5002/";

      // Create FormData object for multipart/form-data
      const formData = new FormData();

      // Add text fields
      formData.append('startinglocation', startLocation);
      formData.append('goinglocation', endLocation);
      formData.append('fullgoinglocation', fullTo);
      formData.append('fullstartinglocation', fullFrom);
      formData.append('travelMode', "car");
      formData.append('recievername', receiverName);
      formData.append('recieverphone', receiverNumber);
      formData.append('Description', parcelDetails.description);
      formData.append('weight', parcelDetails.weight);
      formData.append('category', category.trim().replace('-', '').toLowerCase());
      formData.append('subcategory', subCategory ? subCategory.trim().replace('-', '').toLowerCase() : '');
      // Use unified date conversion
      const dateToSend = formatDateForAPI(searchingDate);
      formData.append('dateOfSending', dateToSend);
      formData.append('userTimezone', getUserTimezone());
      formData.append('timezoneOffset', getUserTimezoneOffset().toString());
      formData.append('durationAtEndPoint', parcelDetails.duration);
      formData.append('phoneNumber', number);

      // Add dimensions as JSON string
      const dimensions = {
        breadth: Number(parcelDetails.dimensions.breadth),
        height: Number(parcelDetails.dimensions.height),
        length: Number(parcelDetails.dimensions.length),
        unit: parcelDetails?.unit.toLowerCase() || "cm"
      };
      formData.append('dimensions', JSON.stringify(dimensions));

      // Log all the data being sent
      console.log("Data being sent:");
      console.log("startinglocation:", startLocation);
      console.log("goinglocation:", endLocation);
      console.log("fullstartinglocation:", fullFrom);
      console.log("fullgoinglocation:", fullTo);
      console.log("travelMode:", "car");
      console.log("recievername:", receiverName);
      console.log("recieverphone:", receiverNumber);
      console.log("Description:", parcelDetails.description);
      console.log("weight:", parcelDetails.weight);
      console.log("category:", category.trim().replace('-', '').toLowerCase());
      console.log("subCategory:", subCategory ? subCategory.trim().replace('-', '').toLowerCase() : '');
      console.log("dateOfSending:", searchingDate);
      console.log("durationAtEndPoint:", parcelDetails.duration);
      console.log("phoneNumber:", number);
      console.log("dimensions:", dimensions);
      console.log("parcelDetails:", parcelDetails);
      
      // Add images if they exist
      if (parcelDetails?.images && parcelDetails.images.length > 0) {
        parcelDetails.images.forEach((image, index) => {
          // Create file object from image URI
          const imageFile = {
            uri: image.uri,
            type: 'image/jpeg', // You might want to detect the actual type
            name: `parcel_image_${index}.jpg`
          };
          formData.append('images', imageFile);
        });
      }

      // Add other optional fields if they exist
      if (parcelDetails?.handleWithCare !== undefined) {
        formData.append('handleWithCare', parcelDetails.handleWithCare.toString());
      }

      if (parcelDetails?.specialRequest) {
        formData.append('specialRequest', parcelDetails.specialRequest);
      }

      console.log("FormData being sent:", formData);
      
      const response = await fetch(`${baseurl}api/consignment`, {
        method: "POST",
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        navigation.navigate("PublishConsignmentRequestSentScreen");
        console.log("Success! Response:", data);
      } else {
        console.error("Error response:", data);
        Alert.alert("Error", data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error publishing consignment:", error);
      Alert.alert("Error", "Failed to publish consignment request.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure the modal is not visible when the component first renders
  useEffect(() => {
    const fetchConsignmentData = async () => {
      try {
        // const startingLocation = await AsyncStorage.getItem("startingLocation");
        // const goingLocation = await AsyncStorage.getItem("goingLocation");
        const travelMode = await AsyncStorage.getItem("travelMode");
        const startTime = await AsyncStorage.getItem("startTime");
        const endTime = await AsyncStorage.getItem("endTime");
        const searchingDate = await AsyncStorage.getItem("searchingDate");
        const receiverName = await AsyncStorage.getItem("receiverName");
        const receiverNumber = await AsyncStorage.getItem("receiverNumber");
        const storedData = await AsyncStorage.getItem("parcelDetails");
        const name = await AsyncStorage.getItem("firstName");
        const number = await AsyncStorage.getItem("phoneNumber");
        console.log("Searching date: ", searchingDate)
        // setStartLocation(startingLocation);
        // setEndLocation(goingLocation);
        setTravelMode(travelMode);
        setStartTime(startTime);
        setEndTime(endTime);
        setSearchingDate(selectedDate || searchingDate);
        setParcelDetails(storedData ? JSON.parse(storedData) : null);
        setReceiverName(receiverName);
        setReceiverNumber(receiverNumber);
        setName(name);
        setNumber(number);
      } catch (error) {
        console.error("Error fetching consignment data:", error);
      }
    };

    fetchConsignmentData();
  }, []);

  // Add this useEffect to fit the map to the markers and polyline when they're available
  useEffect(() => {
    // Only fit to coordinates if we have both markers and polyline data
    if (
      mapRef.current &&
      originCoords &&
      destinationCoords &&
      coordinates.length > 0
    ) {
      // Add a slight delay to ensure the map is ready
      setTimeout(() => {
        try {
          // Fit the map to show both markers with padding
          mapRef.current.fitToCoordinates([originCoords, destinationCoords], {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        } catch (error) {
          console.error("Error fitting map to coordinates:", error);
        }
      }, 500);
    }
  }, [originCoords, destinationCoords, coordinates]);

  // Handle back button for image modal
  useEffect(() => {
    // BackHandler implementation removed to fix compatibility issues
    // Use navigation.goBack() instead for back button functionality
  }, [showImageModal]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={responsiveDimensions.icon.medium} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consignment Details</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={{ paddingBottom: verticalScale(100) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Travel Info */}
        <View style={styles.card}>
          <View style={styles.routeSection}>
            <View style={styles.routeItem}>
              <View style={styles.routeDot} />
              <View style={styles.routeContent}>
                <Text style={styles.routeCity}>{startCity || "Starting City"}</Text>
                <Text style={styles.routeAddress}>{fullFrom || "Starting Address"}</Text>
                <Text style={styles.routeContact}>{name}: {number}</Text>
              </View>
            </View>
            
            <View style={styles.routeItem}>
              <View style={styles.routeDot} />
              <View style={styles.routeContent}>
                <Text style={styles.routeCity}>{destCity || "Destination City"}</Text>
                <Text style={styles.routeAddress}>{fullTo || "Destination Address"}</Text>
                <Text style={styles.routeContact}>{receiverName}: {receiverNumber}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
          </View>

          {/* Travel Time and Distance */}
          <View style={[styles.infoRow, { paddingHorizontal: responsivePadding.medium}]}>
            <Image
              source={require("../../Images/clock.png")}
              style={[styles.locationIcon, { marginLeft: scale(5) }]}
            />
            <Text style={styles.infoText}>{distance}</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
         <Text style={[styles.infoTitle, { marginBottom: verticalScale(10), color: "#000" }]}>
            Track on map
          </Text>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            key={coordinates.length}
            style={styles.map}
            initialRegion={{
              latitude: 28, // Default center of India
              longitude: 77,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
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
                <View style={[styles.marker, styles.startMarker]}>
                  <Icon name="user" size={responsiveDimensions.icon.medium} color="#fff" />
                </View>
              </Marker>
            )}

            {destinationCoords && (
              <Marker coordinate={destinationCoords} title={endLocation}>
                <View style={[styles.marker, styles.endMarker]}>
                  <Icon name="map-marker" size={responsiveDimensions.icon.medium} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView> 
        </View> 

        <View style={styles.card}>
          <Text style={styles.sectionTitle}> Description of parcel</Text>
          <Text style={styles.parcelDescription}>
            {parcelDetails?.description || "Loading..."}
          </Text>

          {/* Simple Image Gallery */}
          {parcelDetails?.images && parcelDetails.images.length > 0 && (
            <View style={{ marginVertical: verticalScale(10) }}>
              <Text style={{ fontWeight: 'bold', marginBottom: verticalScale(5), color: "#000", fontSize: responsiveFontSize.md }}>Parcel Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {parcelDetails.images.map((img, idx) => (
                  <TouchableOpacity key={idx} onPress={() => handleImagePress(idx)}>
                    <Image
                      source={{ uri: img.uri }}
                      style={{ 
                        width: scale(80), 
                        height: scale(80), 
                        borderRadius: scale(8), 
                        marginRight: scale(10), 
                        borderWidth: 1, 
                        borderColor: '#ccc' 
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Simple Image Modal */}
          {showImageModal && selectedImageIndex !== null && parcelDetails?.images && parcelDetails.images[selectedImageIndex] && (
            <View style={{
              position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            }}>
              <TouchableOpacity style={{ position: 'absolute', top: verticalScale(40), right: scale(20), zIndex: 1001 }} onPress={closeImageModal}>
                <Text style={{ color: 'white', fontSize: responsiveFontSize.xl }}>×</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: parcelDetails.images[selectedImageIndex].uri }}
                style={{ 
                  width: scale(300), 
                  height: scale(400), 
                  borderRadius: scale(10), 
                  resizeMode: 'contain' 
                }}
              />
            </View>
          )}

          <View style={styles.dottedLine} />
          {/* Weight & Dimensions */}

          <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <View style={[styles.infoRow, { marginTop: 0 }]}>
                <Image
                  source={require("../../Images/weight.png")}
                  style={[
                    styles.locationIcon,
                    { marginLeft: 0, width: 24, height: 24, marginTop: -3 },
                  ]}
                />
                <Text
                  style={[
                    styles.infoTitle,
                    { marginRight: 20, marginLeft: 5, marginTop: 0, color: "#000" },
                  ]}
                >
                  Weight
                </Text>
              </View>
              <Text
                style={[
                  styles.infoSubtitle,
                  {
                    marginRight: 20,
                    marginLeft: -50,
                    marginTop: 5,
                    fontSize: 15,
                    color: "black",
                  },
                ]}
              >
                {parcelDetails?.weight || "Loading..."} Kg
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <View style={[styles.infoRow, { marginTop: 0 }]}>
                <Image
                  source={require("../../Images/dimension.png")}
                  style={[
                    styles.locationIcon,
                    { marginLeft: 0, width: 24, height: 24, marginTop: -3 },
                  ]}
                />
                <Text
                  style={[
                    styles.infoTitle,
                    { marginRight: 20, marginLeft: 5, marginTop: 0, color: "#000" },
                  ]}
                >
                  Dimensions ({parcelDetails?.unit.toLowerCase()})
                </Text>
              </View>
              <Text
                style={[
                  styles.infoSubtitle,
                  {
                    marginRight: 20,
                    marginLeft: -50,
                    marginTop: 5,
                    fontSize: 15,
                    color: "black",
                  },
                ]}
              >
                {parcelDetails?.dimensions
                  ? `${parcelDetails.dimensions.length} X ${parcelDetails.dimensions.breadth} X ${parcelDetails.dimensions.height}`
                  : "Loading..."}
              </Text>
            </View>
          </View>

          <View style={styles.dottedLine} />
          {/* Extra Information */}
          <View style={styles.extraInfo}>
            <Text style={[styles.infoTitle, {color: "#000"}]} numberOfLines={1}>
              Handle with Care
            </Text>
          </View>
          <View style={styles.extraInfo}>
            <Text style={styles.extraValue} numberOfLines={1}>
              {parcelDetails?.handleWithCare ? "Yes" : "No"}
            </Text>
          </View>
          <View style={styles.dottedLine} />
          <View style={styles.extraInfo}>
            <Text style={[styles.infoTitle, {color: "#000"}]} numberOfLines={1}>
              Special Requests
            </Text>
          </View>
          <View style={styles.extraInfo}>
            <Text style={styles.extraValue} numberOfLines={1}>
              {" "}
              {parcelDetails?.specialRequest || "No"}
            </Text>
          </View>
          <View style={styles.dottedLine} />

          <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <View style={[styles.infoRow, { marginTop: 0 }]}>
                <Text
                  style={[
                    styles.infoTitle,
                    { marginRight: 20, marginLeft: 5, marginTop: 0, color: '#000' },
                  ]}
                >
                  Date of Sending {"\n"}
                </Text>
              </View>
              <Text
                style={[
                  styles.infoSubtitle,
                  {
                    marginRight: 20,
                    marginLeft: 0,
                    marginTop: 5,
                    fontSize: 15,
                    color: "black",
                  },
                ]}
              >
                {searchingDate ? formatDate(searchingDate, 'DD MMMM YYYY') : "Loading..."}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <View style={[styles.infoRow, { marginTop: 0 }]}>
                <Text
                  style={[
                    styles.infoTitle,
                    { marginRight: 20, marginLeft: 5, marginTop: 0, color: '#000' },
                  ]}
                >
                  Category
                </Text>
              </View>
              <Text
                style={[
                  styles.infoSubtitle,
                  {
                    marginRight: 20,
                    marginLeft: 0,
                    marginTop: 5,
                    fontSize: 15,
                    color: "black",
                    width: "45%"
                  },
                ]}
              >
                {category + (category === "nondocument" ? ' ' + subCategory : '')}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePublishConsignment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Publish My Consignment</Text>
          )}
        </TouchableOpacity>

        {/* Bottom Sheet */}
        <RBSheet
          ref={bottomSheetRef}
          height={500} // Height of the Bottom Sheet
          openDuration={250} // Animation duration
          customStyles={{
            container: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            },
          }}
        >
          <ReviewDetails />
          {/* ReviewDetails component will be displayed inside the Bottom Sheet */}
        </RBSheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TravelDetails;

const styles = StyleSheet.create({
  headerTitle: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginTop: verticalScale(20),
  },
  backButton: {
    marginTop: verticalScale(20),
    padding: scale(5),
    marginRight: scale(10),
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(5),
    paddingHorizontal: responsivePadding.small,
    justifyContent: "space-between",
    marginTop: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    marginLeft: scale(20),
  },
  card: {
    backgroundColor: "#fff",
    margin: responsivePadding.medium,
    borderRadius: scale(8),
    padding: responsivePadding.small,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
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
  routeContact: {
    fontSize: responsiveFontSize.sm,
    color: '#888',
    marginTop: scale(2),
  },
  routeLine: {
    position: 'absolute',
    width: scale(2),
    height: verticalScale(50),
    backgroundColor: '#D32F2F',
    left: scale(25),
    top: verticalScale(45),
    zIndex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 10,
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "green",
    marginRight: 10,
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginLeft: 5,
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  verticalseparator: {
    width: 1, // Set width to 1 for a thin line
    backgroundColor: "#ddd", // Make the background transparent
    borderStyle: "dashed", // Dotted border style
    borderLeftWidth: 1, // Add left border to simulate a vertical line
    borderLeftColor: "#ddd", // Set the color for the dotted line
    height: "40", // Set height to 100% or any specific height you need
    marginHorizontal: 11, // Optional: add horizontal spacing if needed
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: verticalScale(10),
    // marginLeft: scale(20)
    // paddingHorizontal: responsivePadding.medium,
  },
  infoText: {
    fontSize: responsiveFontSize.sm,
    color: "black",
    fontWeight: "bold",
    marginLeft: scale(10),
    marginTop: -2,
  },
  infoText1: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: -30,
    marginTop: -10,
  },
  mapContainer: {
    marginVertical: 0,
    margin: responsivePadding.medium,
  },
  map: {
    width: "100%",
    height: verticalScale(180),
    borderRadius: scale(10),
    objectFit: "cover",
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(10),
  },
  infoBlock: {
    alignItems: "center",
  },
  infoTitle: {
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },
  infoSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: "black",
  },
  vehicleText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginVertical: 10,
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 20,
    objectFit: "contain",
  },
  travelerDetails: {
    flex: 1,
    // padding:10
  },
  travelerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  travelerRating: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#D83F3F",
    paddingVertical: verticalScale(15),
    borderRadius: scale(8),
    alignItems: "center",
    marginTop: verticalScale(15),
    marginBottom: verticalScale(20),
    marginHorizontal: responsivePadding.medium,
  },
  buttonText: {
    color: "#fff",
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },
  locationText: {
    color: "black",
    fontSize: 16,
    marginLeft: 20,
    marginRight: 20,
    fontWeight: "bold",
  },
  callNowText: {
    color: "black",
    fontSize: 14,
    marginLeft: 20,
    marginTop: 5,
    fontWeight: "light",
  },
  parcelDescription: {
    // width: 300,
    fontSize: 16,
    color: "black",
    marginBottom: 12,
    marginLeft: 6,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: responsiveFontSize.lg,
    marginBottom: verticalScale(8),
    color: "#333",
  },
  parcelDescription: {
    fontSize: responsiveFontSize.md,
    color: "black",
    marginBottom: verticalScale(12),
    marginLeft: scale(6),
  },

  infoColumn: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 0,
  },
  extraValue: {
    color: "black",
    fontSize: responsiveFontSize.sm,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningText: {
    color: "green",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerButton: {
    backgroundColor: "#53B175",
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  infoBlock: {
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#555",
  },

  infoText: {
    fontSize: 14,
    color: "black",
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: -2,
  },
  infoText1: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: -30,
    marginTop: -10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: verticalScale(10),
    marginLeft: scale(5),
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: verticalScale(10),
    marginLeft: scale(40),
    marginTop: -verticalScale(20),
  },
  verticalseparator: {
    width: 1,
    backgroundColor: "#ddd",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    height: "40",
    marginHorizontal: scale(11),
  },
  dottedLine: {
    borderStyle: "dotted",
    borderWidth: 0.5,
    borderColor: "#aaa",
    marginVertical: verticalScale(12),
  },
  boldText: {
    fontWeight: "bold",
    fontSize: responsiveFontSize.sm,
    color: "#333",
    marginBottom: verticalScale(4),
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
});
