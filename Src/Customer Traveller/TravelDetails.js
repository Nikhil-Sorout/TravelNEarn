import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RBSheet from "react-native-raw-bottom-sheet";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";
import { useSocket } from "../Context/socketprovider";
import ReviewDetails from "./ReviewDetails";
import { getCurvedPolylinePoints } from "../Utils/getCurvedPolylinePonints";
import { formatDate, formatTime } from "../Utils/dateTimeUtils";

const TravelDetails = ({ route }) => {
  const { ride, fareDetails, calculatedPrices, userConsignments } = route.params;
  console.log("ride", ride);
  console.log("fare", fareDetails);
  console.log("calculatedPrices", calculatedPrices);
  console.log("userConsignments", userConsignments);
  
  const [travelMode, setTravelMode] = useState("");
  const [travelNumber, setTravelNumber] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [searchingDate, setSearchingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState(null);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const navigation = useNavigation();
  
  // Auto-select the first valid consignment with pricing
  useEffect(() => {
    if (calculatedPrices && calculatedPrices.length > 0) {
      const validConsignment = calculatedPrices.find(consignment => 
        consignment.calculatedPrice && 
        consignment.calculatedPrice.senderTotalPay && 
        !isNaN(consignment.calculatedPrice.senderTotalPay)
      );
      setSelectedConsignment(validConsignment || calculatedPrices[0]);
    }
  }, [calculatedPrices]);

  // Calculate curved line points for hover path (exactly like ReceiverScreen)
  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];
  
  const mapRef = useRef(null);
  const bottomSheetRef = useRef();
  const [isModalVisible, setModalVisible] = useState(false);
  const locationSubscriptionRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    const startLocationTracking = async () => {
      if (ride.travelStatus === "started" && !isTracking && socket) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Location permission denied");
          return;
        }

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setRiderLocation(newLocation);
            if (socket) {
              socket.emit("update-location", {
                rideId: ride.rideId,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                timestamp: new Date().toISOString(),
              });
            }
          }
        );
        setIsTracking(true);
      } else if (ride.travelStatus === "ENDED" && isTracking) {
        if (locationSubscriptionRef.current) {
          locationSubscriptionRef.current.remove();
          locationSubscriptionRef.current = null;
        }
        setIsTracking(false);
        setRiderLocation(null);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [ride.travelStatus, isTracking, socket]);

  // Listen for location updates from the backend
  useEffect(() => {
    if (socket && typeof socket.on === "function") {
      socket.on("location-update", (data) => {
        if (data.rideId === ride.rideId) {
          setRiderLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      });

      return () => {
        socket.off("location-update");
      };
    } else {
      console.warn("Socket is not initialized or not a function");
    }
  }, [socket, ride.rideId]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Use ride data directly instead of AsyncStorage
        const startingLocation = ride.Leavinglocation;
        const goingLocation = ride.Goinglocation;

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);

          console.log("Fetching coordinates for:", startingLocation, "to", goingLocation);
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
  }, [ride]);

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

  const getTimeFromDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchCoordinates = async (origin, destination) => {
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const response = await fetch(
        `${baseurl}map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        const origin = {
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        };
        const destination = {
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        };
        
        console.log("Setting origin coordinates:", origin);
        console.log("Setting destination coordinates:", destination);
        
        setOriginCoords(origin);
        setDestinationCoords(destination);
        await AsyncStorage.setItem(
          "setOriginCoords",
          JSON.stringify({
            latitude: data.originCoordinates.ltd,
            longitude: data.originCoordinates.lng,
          })
        );
        await AsyncStorage.setItem(
          "setDestinationCoords",
          JSON.stringify({
            latitude: data.destinationCoordinates.ltd,
            longitude: data.destinationCoordinates.lng,
          })
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

  useEffect(() => {
    if (originCoords) {
      console.log("Origin Coordinates:", originCoords);
    }
  }, [originCoords]);

  useEffect(() => {
    if (destinationCoords) {
      console.log("Destination Coordinates:", destinationCoords);
    }
  }, [destinationCoords]);

  useEffect(() => {
    if (coordinates.length > 1) {
      console.log("Updating polyline with coordinates:", coordinates);
    }
  }, [coordinates]);



  const getTravelIcon = (travelMode) => {
    switch (travelMode) {
      case "roadways":
        return <Icon name="car" size={30} color="#D83F3F" />;
      case "airplane":
        return <Ionicons name="airplane" size={30} color="#D83F3F" />;
      case "train":
        return <Icon name="train" size={30} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={30} color="gray" />;
    }
  };

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const startingLocation = await AsyncStorage.getItem("startingLocation");
        const goingLocation = await AsyncStorage.getItem("goingLocation");
        const travelMode = await AsyncStorage.getItem("travelMode");
        const travelNumber = await AsyncStorage.getItem("travelNumber");
        const startTime = await AsyncStorage.getItem("startTime");
        const endTime = await AsyncStorage.getItem("endTime");
        const searchingDate = await AsyncStorage.getItem("searchingDate");
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        setStartLocation(startingLocation || "");
        setEndLocation(goingLocation || "");
        setTravelMode(travelMode || "");
        setTravelNumber(travelNumber || "");
        setStartTime(startTime || "");
        setEndTime(endTime || "");
        setPhoneNumber(phoneNumber || "");
        setSearchingDate(searchingDate || "");
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchTravelData();
  }, []);

  // Using centralized date/time utilities
  const formatDateLocal = (dateString) => {
    return formatDate(dateString, 'DD MMMM YYYY');
  };

  const handleCloseModal = () => {
    console.log("Modal is closing...");
    setModalVisible(false);
  };

  const handleSearch = () => {
    console.log("Search button pressed");
    setModalVisible(false);
    navigation.navigate("TravelDetails");
  };

  useEffect(() => {
    console.log("Checking ride values:");
    console.log("earning:", fareDetails.senderTotalPay);
    console.log("id:", ride.rideId);
    console.log("fromLocation:", ride.Leavinglocation);
    console.log("toLocation:", ride.Goinglocation);
    console.log("deliveryFee:", fareDetails.deliveryFee);
    console.log("teFee:", fareDetails.TE);
    console.log("discount:", fareDetails.discount);
  }, [ride, fareDetails]);

  // Fit map to coordinates (exactly like ReceiverScreen)
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
      <ScrollView>
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ReviewDetails
              onClose={() => setModalVisible(false)}  
              onSearch={handleSearch}
            />
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image
              source={require("../Images/locon.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{ride.Leavinglocation}</Text>
          </View>

          <View style={styles.verticalseparator}></View>
          <View style={styles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../Images/locend.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{ride.Goinglocation}</Text>
          </View>

          <View style={styles.separator1} />

          <View style={styles.infoRow}>
            <Image
              source={require("../Images/clock.png")}
              style={[styles.locationIcon, { marginLeft: 5 }]}
            />
            <Text style={styles.infoText}>{ride.duration}</Text>
          </View>
          <Text style={styles.infoText1}>{ride.distance}</Text>
        </View>

        <View style={styles.mapContainer}>
          <Text style={[styles.infoTitle, { marginBottom: 20 }]}>
            Track on map
          </Text>
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

            {riderLocation && (
              <Marker coordinate={riderLocation} title="Rider's Current Location">
                <View style={[styles.marker, { backgroundColor: "blue" }]}>
                  <Icon name="car" size={25} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        <View style={styles.card}>
          <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Other Information</Text>

              <View style={[styles.infoRow, { marginTop: 20 }]}>
                <Image
                  source={require("../Images/clock.png")}
                  style={[styles.locationIcon, { marginLeft: 2 }]}
                />
                <Text style={styles.infoText}>
                  {formatDateLocal(ride.travelDate)}
                </Text>
              </View>
              <Text style={styles.infoText2}>
                {getTimeFromDate(ride.expectedStartTime)}
              </Text>
            </View>
            {/* <View style={styles.infoBlock}>
              <View style={[styles.infoRow, { marginTop: 0 }]}>
                <Image
                  source={require("../Images/weight.png")}
                  style={[
                    styles.locationIcon,
                    { marginLeft: 0, width: 24, height: 24, marginTop: -3 },
                  ]}
                />
                <Text
                  style={[
                    styles.infoTitle,
                    { marginRight: 20, marginLeft: 5, marginTop: 0 },
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
                1 Kg
              </Text>
            </View> */}
          </View>

          <View style={styles.separator1} />

          <View style={styles.traveler}>
            <View style={styles.iconContainer}>
              {getTravelIcon(ride.travelMode)}
            </View>

            <View style={styles.travelerDetails}>
              <Text style={[styles.travelerName, { marginLeft: 15 }]}>
                {ride.travelMode}
              </Text>
              <Text style={[styles.travelerName, { marginLeft: 15 }]}>
                {ride?.travelmode_number || ""}
              </Text>
            </View>
          </View>

          <View style={styles.separator1} />

          <Text style={[styles.infoTitle, { marginBottom: 5, marginLeft: 2 }]}>
            Traveller Details
          </Text>

          <View style={styles.traveler}>
            <Image
              source={{
                uri:ride.profilePicture|| "https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg",
              }}
              style={styles.profileImage}
            />
            <View style={styles.travelerDetails}>
              <Text style={styles.travelerName}>{ride.username}</Text>
              <Text style={styles.travelerRating}>⭐ {ride.averageRating} ({ride.rating} rating)</Text>
            </View>
          </View>
        </View>

        {/* Consignment Options Card */}
        {calculatedPrices && calculatedPrices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Consignment Options</Text>
            <Text style={styles.sectionSubtitle}>Select your consignment to calculate the exact price:</Text>
            
            {calculatedPrices.map((consignment, index) => (
              <TouchableOpacity
                key={consignment.consignmentId || index}
                style={[
                  styles.consignmentOption,
                  selectedConsignment?.consignmentId === consignment.consignmentId && styles.selectedConsignmentOption
                ]}
                onPress={() => setSelectedConsignment(consignment)}
              >
                <View style={styles.consignmentOptionHeader}>
                  <View style={styles.consignmentInfoContainer}>
                    <Text style={styles.consignmentTitle}>
                      Consignment Option
                    </Text>
                    {consignment.weight && (
                      <Text style={styles.consignmentDetails}>
                        Weight: {consignment.weight} kg
                      </Text>
                    )}
                    {consignment.dimensions && (
                      <Text style={styles.consignmentDetails}>
                        Size: {consignment.dimensions.length}×{consignment.dimensions.breadth}×{consignment.dimensions.height} {consignment.dimensions.unit}
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceContainer}>
                    {consignment.calculatedPrice ? (
                      <Text style={styles.priceText}>
                        ₹{consignment.calculatedPrice.senderTotalPay || 'N/A'}
                      </Text>
                    ) : (
                      <Text style={styles.priceErrorText}>
                        {consignment.priceError || 'Price not available'}
                      </Text>
                    )}
                  </View>
                </View>
                
                {consignment.priceError && (
                  <Text style={styles.errorText}>
                    {consignment.priceError}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ margin: 20, marginTop: -10 }}>
          <TouchableOpacity
            style={[
              styles.button,
              !selectedConsignment && styles.disabledButton
            ]}
            onPress={() => bottomSheetRef.current.open()}
            disabled={!selectedConsignment}
          >
            <Text style={[
              styles.buttonText,
              !selectedConsignment && styles.disabledButtonText
            ]}>
              {selectedConsignment ? "Request to carry my consignment" : "Please select a consignment option"}
            </Text>
          </TouchableOpacity>
        </View>

        <RBSheet
          ref={bottomSheetRef}
          height={500}
          openDuration={250}
          customStyles={{
            container: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            },
          }}
        >
          <ReviewDetails
            earning={selectedConsignment?.calculatedPrice?.senderTotalPay || fareDetails?.senderTotalPay}
            id={ride.rideId}
            fromLocation={ride.Leavinglocation}
            toLocation={ride.Goinglocation}
            deliveryFee={selectedConsignment?.calculatedPrice?.deliveryFee || fareDetails?.deliveryFee}
            teFee={selectedConsignment?.calculatedPrice?.TE || fareDetails?.TE}
            discount={selectedConsignment?.calculatedPrice?.discount || fareDetails?.discount}
            baseFare={selectedConsignment?.calculatedPrice || fareDetails}
            selectedConsignment={selectedConsignment}
            userConsignments={userConsignments || []}
            ride={ride} // Pass the ride object to get travel mode
          />
        </RBSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TravelDetails;

const styles = StyleSheet.create({
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginRight: 32,
  },
  backButton: {
    marginRight: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    marginTop: 0,
  },
  card: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 4,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
    width: 1,
    backgroundColor: "#ddd",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    height: 40,
    marginHorizontal: 11,
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: 10,
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
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: "#555",
    marginLeft: 5,
  },
  mapContainer: {
    marginVertical: 0,
    margin: 20,
  },
  map: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    objectFit: "cover",
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
    color: "#000"
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#555",
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
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000"
  },
  travelerRating: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#53B175",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  iconContainer: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
  },
  consignmentOption: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedConsignmentOption: {
    borderColor: "#53B175",
    borderWidth: 2,
  },
  consignmentOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  consignmentInfoContainer: {
    flex: 1,
  },
  consignmentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  consignmentDetails: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#53B175",
  },
  priceErrorText: {
    fontSize: 16,
    color: "#D83F3F",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    color: "#D83F3F",
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#888",
  },
});