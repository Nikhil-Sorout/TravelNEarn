import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RBSheet from "react-native-raw-bottom-sheet";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import EarningDetails from "../../../Customer Traveller/EarningDetails";
import Header from "../../../header";
import commonStyles from "../../../styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  responsiveFontSize,
  responsiveDimensions,
  screenWidth,
  screenHeight
} from "../../../Utils/responsive";
import { getCurvedPolylinePoints } from "../../../Utils/getCurvedPolylinePonints";

const TravelStartEndDetails = ({ route }) => {
  const { ride, consignmentId } = route.params;
  const consignmentDetails = ride.consignmentDetails || [];

  const [travelMode, setTravelMode] = useState("");
  const [travelNumber, setTravelNumber] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [searchingDate, setSearchingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("upcoming");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [travelId, setTravelId] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "", duration: "" });
  const [rideStatusSteps, setRideStatusSteps] = useState([]);

  // Curved line for map (like receiver screen)
  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];

  // Extract city from full location
  const extractCity = (fullLocation) => {
    if (!fullLocation) return "N/A";
    const parts = fullLocation.split(',').map(part => part.trim());
    return parts[parts.length - 1] || parts[0] || "N/A";
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = ride.Leavinglocation;
        const goingLocation = ride.Goinglocation;
        console.log(ride.travelId);

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
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);

        const leg = route.legs[0];
        const distance = leg.distance.text;
        const duration = leg.duration.text;

        setRouteInfo({ distance, duration });

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
    if (originCoords) {
    }
  }, [originCoords]);

  useEffect(() => {
    if (destinationCoords) {
    }
  }, [destinationCoords]);

  useEffect(() => {
    if (coordinates.length > 1) {
    }
  }, [coordinates]);

  const getTravelIcon = (travelMode) => {
    switch (travelMode) {
      case "roadways":
        return <Icon name="car" size={responsiveDimensions.icon.medium} color="#284268" />;
      case "airplane":
        return <Ionicons name="airplane" size={responsiveDimensions.icon.medium} color="#284268" />;
      case "train":
        return <Icon name="train" size={responsiveDimensions.icon.medium} color="#284268" />;
      default:
        return <Ionicons name="help-circle-outline" size={responsiveDimensions.icon.medium} color="gray" />;
    }
  };

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const startingLocation = ride.Leavinglocation;
        const goingLocation = ride.Goinglocation;
        const travelMode = await AsyncStorage.getItem("travelMode");
        const travelNumber = await AsyncStorage.getItem("travelNumber");
        const startTime = await AsyncStorage.getItem("startTime");
        const endTime = await AsyncStorage.getItem("endTime");
        const searchingDate = await AsyncStorage.getItem("searchingDate");
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");
        const travelId = ride.travelId;

        setStartLocation(startingLocation);
        setEndLocation(goingLocation);
        setTravelMode(travelMode);
        setTravelNumber(travelNumber);
        setStartTime(startTime);
        setEndTime(endTime);
        setPhoneNumber(phoneNumber);
        setSearchingDate(searchingDate);
        setTravelId(travelId);
        setStatus(ride.status.toLowerCase());
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchTravelData();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid date";

      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" });
      const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });

      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;

      let suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      else if (day === 2 || day === 22) suffix = "nd";
      else if (day === 3 || day === 23) suffix = "rd";

      return `${dayOfWeek}, ${month} ${day}${suffix} at ${hours12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date unavailable";
    }
  };

  const navigation = useNavigation();
  const bottomSheetRef = useRef();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSearch = () => {
    setModalVisible(false);
    navigation.navigate("TravelDetails", { expectedStartTime });
  };

  const renderStatusBadge = (status) => {
    const currentStatus = status.toUpperCase();

    const colors = {
      UPCOMING: "#FFD700",
      CANCELLED: "#FF6347",
      COMPLETED: "#32CD32",
      STARTED: "#32CD32",
      ENDED: "#FF6347",
    };

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors[currentStatus] || "#FFD700" },
        ]}
      >
        <Text style={styles.badgeText}>{currentStatus}</Text>
      </View>
    );
  };

  useEffect(() => {
    const fetchRideStatus = async () => {
      if (!travelId || !isModalVisible) return;

      try {
        const response = await fetch(
          `https://travel.timestringssystem.com/order/get-ride/${travelId}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Ride status data:", data);

          if (data.status && Array.isArray(data.status)) {
            setRideStatusSteps(data.status);
          }
        } else {
          console.error("Failed to fetch ride status");
        }
      } catch (error) {
        console.error("Error fetching ride status:", error);
      }
    };

    fetchRideStatus();
  }, [travelId, isModalVisible]);
  const isRideCompleted = rideStatusSteps.some(
    (step) => step.step === 'Ride Completed' && step.completed
  );
  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIndicator} />
                  <Text style={styles.modalTitle}>Earning Status</Text>
                </View>

                <View style={styles.timelineContainer}>
                  {rideStatusSteps.length > 0 ? (
                    rideStatusSteps
                      .filter((step) => step.step !== 'Ride In Progress' || !isRideCompleted)
                      .map((step, index, filteredSteps) => (
                        <React.Fragment key={index}>
                          <View style={styles.timelineItem}>
                            <View
                              style={
                                step.completed
                                  ? styles.timelineIconCompleted
                                  : step.completed === null
                                    ? styles.timelineIconInProgress
                                    : styles.timelineIconPending
                              }
                            >
                              {step.completed && step.step !== 'Ride In Progress' && (
                                <MaterialCommunityIcons
                                  name="check"
                                  size={responsiveDimensions.icon.small}
                                  color="white"
                                />
                              )}
                              {(step.completed === null || (step.completed && step.step === 'Ride In Progress')) && (
                                <MaterialCommunityIcons
                                  name="clock-outline"
                                  size={responsiveDimensions.icon.small}
                                  color="white"
                                />
                              )}
                            </View>
                            <View style={styles.timelineContent}>
                              <Text style={styles.timelineTitle}>
                                {step.step}
                              </Text>
                              {step.completed && step.updatedat ? (
                                <Text style={styles.timelineDate}>
                                  {formatDate(step.updatedat)}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          {index < filteredSteps.length - 1 && (
                            <View style={styles.timelineConnector} />
                          )}
                        </React.Fragment>
                      ))
                  ) : (
                    <>
                      {(status !== 'completed' && status !== 'ended') && (
                        <>
                          <View style={styles.timelineItem}>
                            <View style={styles.timelineIconInProgress}>
                                                      <MaterialCommunityIcons
                          name="clock-outline"
                          size={responsiveDimensions.icon.small}
                          color="white"
                        />
                            </View>
                            <View style={styles.timelineContent}>
                              <Text style={styles.timelineTitle}>
                                Ride In Progress
                              </Text>
                              <Text style={styles.timelineDate}>
                                {formatDate(new Date())}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.timelineConnector} />
                        </>
                      )}
                      <View style={styles.timelineItem}>
                        <View style={
                          (status === 'completed' || status === 'ended')
                            ? styles.timelineIconCompleted
                            : styles.timelineIconPending
                        }>
                          {(status === 'completed' || status === 'ended') && (
                                                          <MaterialCommunityIcons
                                name="check"
                                size={responsiveDimensions.icon.small}
                                color="white"
                              />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>
                            Ride Completed
                          </Text>
                          {(status === 'completed' || status === 'ended') &&
                            ride.updatedat ? (
                            <Text style={styles.timelineDate}>
                              {formatDate(ride.updatedat)}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.timelineConnector} />

                      <View style={styles.timelineItem}>
                        <View style={styles.timelineIconInProgress}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={responsiveDimensions.icon.small}
                            color="white"
                          />
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>
                            Earning (Transaction) In progress
                          </Text>
                          <Text style={styles.timelineDate}>
                            {formatDate(new Date())}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.timelineConnector} />

                      <View style={styles.timelineItem}>
                        <View style={styles.timelineIconPending} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>
                            Earning (Transaction) Completed
                          </Text>
                          <Text style={styles.timelineDate}>
                            {formatDate(new Date())}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Header title="Travel Details" navigation={navigation} />

      <ScrollView>
        <View style={styles.buttonContainer}>
          {(ride.status === "UPCOMING" || ride.status === "yet to start") && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() =>
                  navigation.navigate("Cancellation", { travelId })
                }
              >
                <Text style={styles.buttonText}>Cancel Travel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={async () => {
                  try {
                    Alert.alert("Starting Travel", "Please wait...");

                    const response = await fetch(
                      `https://travel.timestringssystem.com/t/start-ride/${travelId}`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          status: "start",
                        }),
                      }
                    );

                    const data = await response.json();
                    console.log(data);

                    if (response.ok) {
                      setStatus("started");
                      Alert.alert(
                        "Start Travel",
                        "Travel has been started successfully!"
                      );
                      ride.status = "started";
                    } else {
                      Alert.alert(
                        "Error",
                        data.message || "Failed to start travel."
                      );
                    }
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Something went wrong. Please try again."
                    );
                    console.error("API Error:", error);
                  }
                }}
              >
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                  Start Travel
                </Text>
              </TouchableOpacity>
            </>
          )}
          {status === "started" && (
            <TouchableOpacity
              style={[styles.button, styles.endButton]}
              onPress={async () => {
                if (!travelId) {
                  Alert.alert("Error", "Travel ID is missing");
                  return;
                }
                try {
                  setLoading(true);
                  Alert.alert("Ending Travel", "Please wait...");

                  const response = await fetch(
                    `https://travel.timestringssystem.com/t/end-ride/${travelId}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        status: "end",
                      }),
                    }
                  );

                  const data = await response.json();

                  if (response.ok) {
                    setStatus("ended");
                    Alert.alert(
                      "Success",
                      "Travel has been ended successfully!"
                    );
                  } else {
                    Alert.alert(
                      "Error",
                      data.message || "Failed to end travel"
                    );
                  }
                } catch (error) {
                  Alert.alert("Error", "Failed to end travel");
                  console.error("API Error:", error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: "#007BFF" }]}>
                End Travel
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow1}>
            <Text style={{ fontSize: responsiveFontSize.md, fontWeight: "bold", color: "#000" }}>
              Travel ID : {ride.travelId}
            </Text>
            <View>{renderStatusBadge(status)}</View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (!travelId) {
              console.error("Travel ID is not available");
              Alert.alert("Error", "Travel ID is missing. Please try again.");
              return;
            }
            navigation.navigate("ConsignmentCarry", {
              travelId,
              consignmentId,
              consignmentDetails: consignmentDetails,
            });
          }}
        >
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Image source={require("../../../Images/package.png")} />
              <Text
                style={{
                  fontSize: responsiveFontSize.sm,
                  fontWeight: "bold",
                  marginRight: scale(10),
                  marginTop: scale(5),
                  marginLeft: scale(10),
                  color: '#000'
                }}
              >
                Consignment to Carry
              </Text>
              <Ionicons
                name="arrow-forward"
                size={responsiveDimensions.icon.medium}
                color="black"
                style={{ position: "absolute", right: 0 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (!travelId) {
              console.error("Travel ID is not available");
              Alert.alert("Error", "Travel ID is missing. Please try again.");
              return;
            }
            setModalVisible(true);
          }}
        >
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Image source={require("../../../Images/package.png")} />
              <Text
                style={{
                  fontSize: responsiveFontSize.sm,
                  fontWeight: "bold",
                  marginRight: scale(10),
                  marginTop: scale(5),
                  marginLeft: scale(10),
                  color: "#000"
                }}
              >
                Earning
              </Text>
              <Ionicons
                name="arrow-forward"
                size={responsiveDimensions.icon.medium}
                color="black"
                style={{ position: "absolute", right: 0 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.locationSection}>
            {/* <View style={[commonStyles.staraightSeparator, styles.separator]} /> */}

            <View style={styles.locationRow}>
              <Image
                source={require("../../../Images/locon.png")}
                style={styles.locationIcon}
              />
              <View style={[commonStyles.iconContainer, styles.iconContainer]}></View>
              <View style={styles.locationTextContainer}>
                <Text style={[commonStyles.locationText, styles.locationText, {marginLeft: 0}]}>
                  {ride.fullLeavingLocation || "N/A"}
                </Text>
                <Text style={styles.cityText}>
                  {extractCity(ride.fullLeavingLocation)}
                </Text>
              </View>
            </View>

            <View style={styles.verticalSeparatorContainer}>
              <View style={[commonStyles.verticalseparator, styles.verticalSeparator]}></View>
            </View>

            <View style={styles.locationRow}>
              <Image
                source={require("../../../Images/locend.png")}
                style={styles.locationIcon}
              />
              <View style={[commonStyles.iconContainer, styles.iconContainer]}></View>
              <View style={styles.locationTextContainer}>
                <Text style={[commonStyles.locationText, styles.locationText, {marginLeft: 0}]}>
                  {ride.fullGoingLocation || "N/A"}
                </Text>
                <Text style={styles.cityText}>
                  {extractCity(ride.fullGoingLocation)}
                </Text>
              </View>
            </View>

            {/* <View style={[commonStyles.staraightSeparator, styles.separator]} /> */}
          </View>

          <View style={styles.infoRow}>
            <Image
              source={require("../../../Images/clock.png")}
              style={[styles.locationIcon, { marginLeft: scale(2) }]}
            />
            <Text style={styles.infoText}>{routeInfo.duration}</Text>
          </View>
          <Text style={styles.infoText1}>{routeInfo.distance}</Text>
        </View>

        <View style={styles.mapContainer}>
          <Text style={[styles.infoTitle, { marginBottom: scale(20), color : "#000" }]}>
            Track on map
          </Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            key={curvedLinePoints.length}
            style={styles.map}
            initialRegion={{
              latitude:
                originCoords && curvedLinePoints.length > 1
                  ? originCoords.latitude
                  : 28,
              longitude:
                originCoords && curvedLinePoints.length > 1
                  ? originCoords.longitude
                  : 77,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            {curvedLinePoints.length > 0 && (
              <Polyline
                coordinates={curvedLinePoints}
                strokeColor="#D32F2F"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
            {originCoords && (
              <Marker coordinate={originCoords} title={startLocation}>
                <View style={styles.originMarker}>
                  <Icon name="user" size={responsiveDimensions.icon.medium} color="#fff" />
                </View>
              </Marker>
            )}
            {destinationCoords && (
              <Marker coordinate={destinationCoords} title={endLocation}>
                <View style={styles.destinationMarker}>
                  <Icon name="map-marker" size={responsiveDimensions.icon.medium} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Other Information</Text>
              <View style={[styles.infoRow, { marginTop: scale(20) }]}>
                <Image
                  source={require("../../../Images/clock.png")}
                  style={[styles.locationIcon, { marginLeft: scale(2) }]}
                />
                <Text style={styles.infoText}>
                  {formatDate(ride.travelDate)}
                </Text>
              </View>
              {/* <Text style={styles.infoText}>
                {new Date(ride.expectedStartTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text> */}
            </View>
          </View>

          <View style={commonStyles.staraightSeparator} />

          <View style={[commonStyles.locationRow, styles.travelModeRow]}>
            <View style={[commonStyles.iconContainer, styles.travelIconContainer]}>
              {getTravelIcon(ride.travelMode)}
            </View>
            <Text style={[commonStyles.infoText, styles.travelModeText]}>
              {ride.travelMode === "roadways" ? ride.vehicleType : "Car"}
            </Text>
          </View>
        </View>

        <RBSheet
          ref={bottomSheetRef}
          height={scale(300)}
          openDuration={scale(250)}
          customStyles={{
            container: {
              borderTopLeftRadius: scale(20),
              borderTopRightRadius: scale(20),
              padding: scale(20),
            },
          }}
        >
          <EarningDetails earning={ride.expectedearning} id={ride.rideId} />
        </RBSheet>


      </ScrollView>
    </SafeAreaView>
  );
};

export default TravelStartEndDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(8),
    padding: scale(15),
    marginBottom: verticalScale(12),
    marginHorizontal: scale(16),
    borderWidth: 1,
    borderColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  locationSection: {
    position: "relative",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: verticalScale(10),
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: scale(10),
  },
  locationText: {
    fontSize: responsiveFontSize.sm,
    color: "#000000",
    fontFamily: "Inter-Medium",
    lineHeight: responsiveFontSize.sm * 1.3,
  },
  cityText: {
    fontSize: responsiveFontSize.xs,
    color: "#666",
    fontFamily: "Inter-Regular",
    marginTop: verticalScale(2),
  },
  locationIcon: {
    width: scale(16),
    height: scale(16),
    marginTop: verticalScale(2),
  },
  iconContainer: {
    marginRight: scale(10),
  },
  travelModeRow: {
    marginVertical: verticalScale(10),
  },
  travelIconContainer: {
    marginRight: scale(10),
  },
  travelModeText: {
    fontSize: responsiveFontSize.sm,
    color: "black",
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: verticalScale(10),
    marginLeft: scale(5),
  },
  verticalSeparatorContainer: {
    position: "absolute",
    left: scale(-5),
    top: verticalScale(40),
    alignItems: "center",
    zIndex: 1,
  },
  verticalSeparator: {
    width: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#6C6C70",
    height: verticalScale(50),
  },
  separator1: {
    height: scale(1),
    backgroundColor: "#ddd",
    marginVertical: verticalScale(10),
    marginLeft: scale(5),
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: scale(1),
    borderColor: "#ddd",
    marginVertical: verticalScale(10),
    marginLeft: scale(40),
    marginTop: verticalScale(-20),
  },
  verticalseparator: {
    width: scale(1),
    backgroundColor: "#ddd",
    borderStyle: "dashed",
    borderLeftWidth: scale(1),
    borderLeftColor: "#ddd",
    height: verticalScale(40),
    marginHorizontal: scale(11),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: verticalScale(10),
  },
  infoRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(10),
  },
  infoText: {
    fontSize: responsiveFontSize.sm,
    color: "black",
    fontWeight: "bold",
    marginLeft: scale(10),
    marginTop: verticalScale(-2),
    fontFamily: "Inter-Bold",
  },
  infoText1: {
    fontSize: responsiveFontSize.sm,
    color: "#555",
    marginLeft: scale(32),
    marginTop: verticalScale(-10),
  },
  infoText2: {
    fontSize: responsiveFontSize.sm,
    color: "#555",
    marginLeft: scale(0),
    marginTop: verticalScale(-10),
  },
  mapContainer: {
    height: verticalScale(300),
    marginHorizontal: scale(16),
    marginVertical: verticalScale(15),
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
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(10),
  },
  infoBlock: {
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color : "#000"
  },
  infoSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: "#555",
  },
  vehicleText: {
    fontSize: responsiveFontSize.md,
    color: "#333",
    textAlign: "center",
    marginVertical: verticalScale(10),
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: scale(2),
    borderColor: "#D83F3F",
    paddingVertical: verticalScale(15),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: verticalScale(15),
  },
  buttonText: {
    color: "#D83F3F",
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },

  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(6),
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: responsiveFontSize.xs,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: scale(20),
    marginTop: verticalScale(10),
  },
  cancelButton: {
    borderColor: "#D83F3F",
    backgroundColor: "transparent",
    width: "48%",
  },
  startButton: {
    backgroundColor: "#53B175",
    borderColor: "#53B175",
    width: "48%",
  },
  endButton: {
    backgroundColor: "white",
    borderColor: "#007BFF",
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingBottom: verticalScale(30),
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  modalIndicator: {
    width: scale(40),
    height: verticalScale(5),
    backgroundColor: "#D1D1D1",
    borderRadius: scale(5),
    marginBottom: verticalScale(15),
  },
  modalTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    color: "#333",
  },
  timelineContainer: {
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(30),
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(15),
  },
  timelineIconCompleted: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
  },
  timelineIconInProgress: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#F1C40F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
  },
  timelineIconPending: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#EEEEEE",
    marginRight: scale(15),
  },
  timelineConnector: {
    width: scale(2),
    height: verticalScale(30),
    backgroundColor: "#AAA",
    marginLeft: scale(14),
    marginBottom: verticalScale(15),
  },
  timelineContent: {
    flex: 1,
    paddingTop: scale(3),
  },
  timelineTitle: {
    fontSize: responsiveFontSize.md,
    color: "#333",
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: responsiveFontSize.sm,
    color: "#777",
    marginTop: verticalScale(5),
  },
  closeButton: {
    backgroundColor: "#D83F3F",
    padding: scale(15),
    borderRadius: scale(8),
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },
});
