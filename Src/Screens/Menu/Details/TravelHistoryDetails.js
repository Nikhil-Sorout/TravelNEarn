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
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import RBSheet from "react-native-raw-bottom-sheet";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import EarningDetails from "../../../Customer Traveller/EarningDetails";
import Header from "../../../header";
import commonStyles from "../../../styles";
import { SafeAreaView } from "react-native-safe-area-context";

// Responsive scaling functions
const { width, height } = Dimensions.get("window");
const scale = (size) => {
  const baseWidth = 393; // iPhone 14 Pro width
  const scaleFactor = width / baseWidth;
  return Math.round(size * scaleFactor);
};
const verticalScale = (size) => {
  const baseHeight = 852; // iPhone 14 Pro height
  const scaleFactor = height / baseHeight;
  return Math.round(size * scaleFactor);
};
const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const TravelDetails = ({ route }) => {
  const { ride, consignmentId } = route.params;
  console.log("ride", ride);
  console.log("consignmentId", consignmentId);
  const consignmentDetails = ride.consignmentDetails || [];

  const [travelMode, setTravelMode] = useState("");
  const [travelNumber, setTravelNumber] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [searchingDate, setSearchingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("completed");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [travelId, setTravelId] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "", duration: "" });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const startingLocation = ride.Leavinglocation;
        const goingLocation = ride.Goinglocation;

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
      const response = await fetch(
        `https://travel.timestringssystem.com/map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();
      console.log(data);

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

  const getTravelIcon = (travelMode) => {
    switch (travelMode) {
      case "car":
        return <Icon name="car" size={scale(30)} color="#D83F3F" />;
      case "airplane":
        return <Ionicons name="airplane" size={scale(30)} color="#D83F3F" />;
      case "train":
        return <Icon name="train" size={scale(30)} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={scale(30)} color="gray" />;
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

        console.log("Fetched travelId:", travelId);

        setStartLocation(startingLocation);
        setEndLocation(goingLocation);
        setTravelMode(travelMode);
        setTravelNumber(travelNumber);
        setStartTime(startTime);
        setEndTime(endTime);
        setPhoneNumber(phoneNumber);
        setSearchingDate(searchingDate);
        setTravelId(travelId);
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchTravelData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const navigation = useNavigation();
  const bottomSheetRef = useRef();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleCloseModal = () => {
    console.log("Modal is closing...");
    setModalVisible(false);
  };

  const handleSearch = () => {
    console.log("Search button pressed");
    setModalVisible(false);
    navigation.navigate("TravelDetails", { expectedStartTime });
  };

  const renderStatusBadge = (status) => {
    const colors = {
      UPCOMING: "#FFD700",
      CANCELLED: "#FF6347",
      COMPLETED: "#32CD32",
    };

    return (
      <View style={[styles.badge, { backgroundColor: colors[status] }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <EarningDetails
            onClose={() => setModalVisible(false)}
            onSearch={handleSearch}
          />
        </View>
      </Modal>

      <Header title="Travel Details" navigation={navigation} />

      <ScrollView>
        <View style={styles.card}>
          <View style={styles.infoRow1}>
            <Text style={{ fontSize: scale(16), fontWeight: "bold" }}>
              Travel ID:{ride.travelId}
            </Text>
            <View>{renderStatusBadge("UPCOMING")}</View>
          </View>
        </View>

        {status === "upcoming" && (
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
                    fontSize: scale(14),
                    fontWeight: "bold",
                    marginRight: scale(10),
                    marginTop: scale(5),
                    marginLeft: scale(10),
                  }}
                >
                  Consignment to Carry
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={scale(24)}
                  color="black"
                  style={{ position: "absolute", right: 0 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{ride.Leavinglocation}</Text>
          </View>

          <View style={commonStyles.verticalseparator}></View>
          <View style={commonStyles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{ride.Goinglocation}</Text>
          </View>

          <View style={commonStyles.staraightSeparator} />

          <View style={styles.infoRow}>
            <Image
              source={require("../../../Images/clock.png")}
              style={[styles.locationIcon, { marginLeft: scale(5) }]}
            />
            <Text style={styles.infoText}>{routeInfo.duration}</Text>
          </View>
          <Text style={styles.infoText1}>{routeInfo.distance}</Text>
        </View>

        <View style={styles.mapContainer}>
          <Text style={[styles.infoTitle, { marginBottom: scale(20) }]}>
            Track on map
          </Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            key={coordinates.length}
            style={styles.map}
            initialRegion={{
              latitude:
                originCoords && coordinates.length > 1
                  ? originCoords.latitude
                  : 28,
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
              strokeWidth={scale(5)}
            />
            {originCoords && (
              <Marker coordinate={originCoords} title={startLocation}>
                <View style={[styles.marker, styles.startMarker]}>
                  <Icon name="user" size={scale(25)} color="#fff" />
                </View>
              </Marker>
            )}
            {destinationCoords && (
              <Marker coordinate={destinationCoords} title={endLocation}>
                <View style={[styles.marker, styles.endMarker]}>
                  <Icon name="map-marker" size={scale(25)} color="#fff" />
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
              <Text style={styles.infoText}>
                {new Date(ride.expectedStartTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
          </View>

          <View style={commonStyles.staraightSeparator} />

          <View style={styles.traveler}>
            <View style={styles.iconContainer}>
              {getTravelIcon(ride.travelMode)}
            </View>
            <View style={styles.travelerDetails}>
              <Text style={[styles.travelerName, { marginLeft: scale(15) }]}>
                {ride.travelMode}
              </Text>
              <Text style={[styles.travelerName, { marginLeft: scale(15) }]}>
                {ride.travelmode_number}
              </Text>
            </View>
          </View>
        </View>

        {status === "completed" && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (!travelId) {
                  console.error("Travel ID is not available");
                  Alert.alert(
                    "Error",
                    "Travel ID is missing. Please try again."
                  );
                  return;
                }
                navigation.navigate("ConsignmentCarry", {
                  travelId,
                  consignmentId, // Pass consignmentId to ConsignmentCarry
                  consignmentDetails: consignmentDetails,
                });
              }}
            >
              <View style={styles.infoRow}>
                <Image source={require("../../../Images/package.png")} />
                <Text
                  style={{
                    fontSize: scale(14),
                    fontWeight: "bold",
                    marginRight: scale(10),
                    marginTop: scale(5),
                    marginLeft: scale(10),
                  }}
                >
                  Consignment to Carry
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={scale(24)}
                  color="black"
                  style={{ position: "absolute", right: 0 }}
                />
              </View>
            </TouchableOpacity>

            <View style={commonStyles.staraightSeparator} />

            <TouchableOpacity onPress={() => bottomSheetRef.current.open()}>
              <View style={styles.infoRow}>
                <Image source={require("../../../Images/Earnings.png")} />
                <Text
                  style={{
                    fontSize: scale(14),
                    fontWeight: "bold",
                    marginRight: scale(10),
                    marginTop: scale(5),
                    marginLeft: scale(10),
                  }}
                >
                  Earning
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={scale(24)}
                  color="black"
                  style={{ position: "absolute", right: 0 }}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {status !== "completed" && status !== "cancelled" && (
          <View style={{ margin: scale(20), marginTop: scale(-10) }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Cancellation")}
            >
              <Text style={styles.buttonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        )}

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

export default TravelDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: verticalScale(20),
  },
  card: {
    backgroundColor: "#fff",
    margin: scale(20),
    borderRadius: scale(4),
    padding: scale(15),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  dot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "green",
    marginRight: scale(10),
  },
  circle: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "red",
    marginRight: scale(10),
  },
  locationText: {
    fontSize: moderateScale(16),
    color: "#333",
    marginLeft: scale(10),
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
    fontSize: moderateScale(14),
    color: "black",
    fontWeight: "bold",
    marginLeft: scale(10),
    marginTop: verticalScale(-2),
  },
  infoText1: {
    fontSize: moderateScale(15),
    color: "#555",
    marginLeft: scale(32),
    marginTop: verticalScale(-10),
  },
  infoText2: {
    fontSize: moderateScale(15),
    color: "#555",
    marginLeft: scale(0),
    marginTop: verticalScale(-10),
  },
  mapContainer: {
    marginVertical: 0,
    margin: scale(20),
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
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  infoSubtitle: {
    fontSize: moderateScale(14),
    color: "#555",
  },
  vehicleText: {
    fontSize: moderateScale(16),
    color: "#333",
    textAlign: "center",
    marginVertical: verticalScale(10),
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(10),
  },
  profileImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(10),
  },
  driverPhoto: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(20),
    objectFit: "contain",
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  travelerRating: {
    fontSize: moderateScale(14),
    color: "#555",
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
    fontSize: moderateScale(16),
    fontWeight: "bold",
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
  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(6),
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(12),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D83F3F",
    paddingVertical: verticalScale(15),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: verticalScale(15),
  },
  locationIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(10),
  },
});
