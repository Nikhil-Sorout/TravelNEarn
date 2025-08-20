import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  // SafeAreaView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { formatTime, formatDate } from "../../Utils/dateTimeUtils";
const PayNowScreen = ({ navigation, route }) => {
  const {
    consignmentId,
    phoneNumber,
    amount,
    notification,
    travelId,
    travelmode,
    pickup,
    dropoff,
    pickuptime,
    dropofftime,
    travellername,
    requestTo,
    requestedBy,
    notificationType,
    profilepicture,
  } = route.params;
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [travelMode, setTravelMode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  // Removed profilePic state since we're using route params directly
  const [savedAmount, setSavedAmount] = useState(0);
  const [platformFee, setPlatformFee] = useState(20); // Default platform fee
  const [loading, setLoading] = useState(false);
  const [travelDetails, setTravelDetails] = useState(null);
  const [fetchingTravelDetails, setFetchingTravelDetails] = useState(false);
  const [travelModeNumber, setTravelModeNumber] = useState(""); // Default to 4 seater
  const mapRef = useRef(null); // Reference to MapView

  console.log("Travel ID:", travelId);
  console.log("Amount:", amount);
  console.log("Params from route:", {
    pickup,
    dropoff,
    pickuptime,
    dropofftime,
    travellername,
    travelmode,
    requestedBy,
    requestTo,
    notificationType,
    profilepicture,
  });
  console.log("Current travelModeNumber state:", travelModeNumber);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Prioritize route.params values
        let startingLocation =
          pickup || notification?.rideDetails?.startLocation;
        let goingLocation = dropoff || notification?.rideDetails?.endLocation;
        let mode = travelmode || notification?.rideDetails?.travelMode || "car";
        let pickupT = pickuptime || notification?.rideDetails?.pickupTime;
        let dropoffT = dropofftime || notification?.rideDetails?.dropoffTime;
        let saved = notification?.rideDetails?.savedAmount || 0;
        let fee = notification?.rideDetails?.platformFee || 20;
        let travelModeNum = notification?.rideDetails?.travelmode_number || "";

        // Debug notification object
        console.log(
          "NOTIFICATION OBJECT:",
          JSON.stringify(notification, null, 2)
        );
        console.log("Travel mode number from notification:", notification?.rideDetails?.travelmode_number);

        // Fallback to AsyncStorage if locations are missing
        if (!startingLocation || !goingLocation) {
          startingLocation = await AsyncStorage.getItem("startingLocation");
          goingLocation = await AsyncStorage.getItem("goingLocation");
          console.log(
            "Retrieved from AsyncStorage - Start:",
            startingLocation,
            "End:",
            goingLocation
          );
        }

        // Fetch user details
        let fname = notification?.user?.firstName;
        let lname = notification?.user?.lastName;
        let profile = notification?.user?.profileImage;

        // Debug user info from notification
        console.log("USER INFO FROM NOTIFICATION:", {
          firstName: fname,
          lastName: lname,
          profileImage: profile,
        });

        if (!fname || !lname) {
          fname = await AsyncStorage.getItem("firstName");
          lname = await AsyncStorage.getItem("lastName");
          console.log("USER FROM ASYNCSTORAGE:", {
            firstName: fname,
            lastName: lname,
          });
        }

        // Use fallback image if no profile picture from notification
        if (!profile) {
          profile = null; // Don't use stored values, use fallback image
          console.log("No profile picture from notification, using fallback image");
        }

        // Log final values before setting state
        console.log("FINAL VALUES:", {
          firstName: fname,
          lastName: lname,
          profilePicture: profilepicture ? "exists" : "missing",
          startLocation: startingLocation,
          endLocation: goingLocation,
          travelMode: mode,
          travelModeNumber: travelModeNum,
          pickupTime: pickupT,
          dropoffTime: dropoffT,
        });

        if (!pickupT) {
          pickupT = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (!dropoffT) {
          const now = new Date();
          now.setMinutes(now.getMinutes() + 30);
          dropoffT = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);
          setTravelMode(mode);
          setFirstName(fname || ""); // Add fallback to empty string
          setLastName(lname || ""); // Add fallback to empty string
          setPickupTime(pickupT);
          setDropoffTime(dropoffT);
          // Removed setProfilePic since we're using route params directly
          setSavedAmount(saved || Math.floor(amount * 0.5));
          setPlatformFee(fee);
          setTravelModeNumber(travelModeNum);

          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRoute(startingLocation, goingLocation),
          ]);
        } else {
          throw new Error("Start or end location not found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load data.");
      }
    };

    fetchData();
    
    // Fetch travel details if travelId is available
    if (travelId) {
      fetchTravelDetails();
    }
  }, [
    pickup,
    dropoff,
    pickuptime,
    dropofftime,
    travelmode,
    amount,
    notification,
    travelId,
  ]); // Added travelId to dependencies

  // New useEffect to handle map zooming
  useEffect(() => {
    
    
    if (
      mapRef.current &&
      originCoords &&
      destinationCoords &&
      coordinates.length > 0
    ) {
      const coords = [
        { latitude: originCoords.latitude, longitude: originCoords.longitude },
        {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude,
        },
        ...coordinates,
      ];

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [originCoords, destinationCoords, coordinates]); // Trigger when these values update

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

        const route = data.routes[0].legs[0];
        setDistance(route.distance.text);
        setDuration(route.duration.text);
      } else {
        throw new Error("No routes found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("Error", "Failed to fetch route data.");
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
        setOriginCoords(origin);
        setDestinationCoords(destination);

        await AsyncStorage.setItem("setOriginCoords", JSON.stringify(origin));
        await AsyncStorage.setItem(
          "setDestinationCoords",
          JSON.stringify(destination)
        );
      } else {
        throw new Error("Invalid coordinates data");
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
      Alert.alert("Error", "Failed to fetch coordinate data.");
    }
  };

  const fetchTravelDetails = async () => {
    if (!travelId) {
      console.log("No travelId provided, skipping travel details fetch");
      return;
    }

    setFetchingTravelDetails(true);
    try {
      console.log("Fetching travel details for travelId:", travelId);
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}t/travel/${travelId}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Travel details response:", JSON.stringify(data, null, 2));
        setTravelDetails(data);
        
        // Update UI with fetched travel details if they exist
        if (data) {
          if (data.pickup && !startLocation) {
            setStartLocation(data.pickup);
          }
          if (data.drop && !endLocation) {
            setEndLocation(data.drop);
          }
          if (data.travelMode && !travelMode) {
            setTravelMode(data.travelMode);
          }
          if (data.expectedStartTime && !pickupTime) {
            setPickupTime(data.expectedStartTime);
          }
          if (data.expectedEndTime && !dropoffTime) {
            setDropoffTime(data.expectedEndTime);
          }
          if (data.travelerName && !travellername) {
            // Update traveler name if available
            console.log("Traveler name from API:", data.travelerName);
          }
          if (data.profilePicture && !profilepicture) {
            // Update profile picture if available
            console.log("Profile picture from API:", data.profilePicture);
          }
          // Set travel mode number from API response
          if (data.travelmode_number) {
            setTravelModeNumber(data.travelmode_number.toString());
            console.log("Travel mode number from API:", data.travelmode_number);
          }
        }
      } else {
        console.error("Failed to fetch travel details:", response.status);
      }
    } catch (error) {
      console.error("Error fetching travel details:", error);
    } finally {
      setFetchingTravelDetails(false);
    }
  };

  console.log("Data :", travelDetails)
  const create_payment_order = async (consignmentId, notificationAmount) => {
    console.log("Creating payment order for Consignment ID:", consignmentId);
    setLoading(true);
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const userName = await AsyncStorage.getItem("firstName");
      const userEmail =
        (await AsyncStorage.getItem("email")) || "default@example.com";

      // Determine the phone number based on notification type
      const notificationType = route.params?.notificationType;
      let verificationPhoneNumber;
      if (notificationType === "consignment_accept") {
        verificationPhoneNumber = requestTo;
      } else if (notificationType === "ride_accept") {
        verificationPhoneNumber = requestedBy;
      } else {
        verificationPhoneNumber = phoneNumber;
      }

      console.log("Using phone number for verification:", {
        verificationPhoneNumber,
        notificationType,
      });

      if (!baseurl) {
        throw new Error("Base URL not found in AsyncStorage.");
      }

      if (!verificationPhoneNumber) {
        throw new Error("Phone number not found.");
      }

      if (!userEmail) {
        throw new Error("User email not found.");
      }

      const finalConsignmentId = consignmentId || `placeholder-${Date.now()}`;
      const finalTravelId = travelId || "N/A";
      let finalAmount = notificationAmount
        ? parseFloat(notificationAmount) * 100 // Convert to paisa
        : null;
      if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
        console.warn("Amount missing, using default amount.");
        finalAmount = (amount ? parseFloat(amount) : 500) * 100; // Convert to paisa
      }
      const displayAmount = (finalAmount / 100).toFixed(2);
      console.log("Creating order with:", {
        consignmentId: finalConsignmentId,
        displayAmount,
        phoneNumber: verificationPhoneNumber,
        userName,
        userEmail,
        travelId: finalTravelId,
      });
      const baseUrl = await AsyncStorage.getItem('apiBaseUrl')
      const response = await fetch(
        `${baseUrl}p/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            amount: finalAmount.toFixed(2), 
            currency: "INR",
          }),
        }
      );

      const json = await response.json();
      console.log("Payment order response:", JSON.stringify(json, null, 2));

      if (response.ok && json.success && json.order?.id) {
        navigation.navigate("WalletWebViewScreen", {
          orderId: json.order.id,
          amount: finalAmount / 100, // Convert back to rupees for display
          phoneNumber: verificationPhoneNumber, // Use the selected phone number
          userName,
          userEmail,
          travelId: finalTravelId,
          time: finalConsignmentId,
          consignmentId: finalConsignmentId,
          keyId: "rzp_test_HYwz1gfxytH2ci",
          verificationPhoneNumber,
          notificationType,
          notification: route.params?.notification, // Pass the notification object
        });
      } else {
        throw new Error(json.message || "Failed to create payment order.");
      }
    } catch (error) {
      console.error("Create payment order error:", error.message);
      Alert.alert(
        "Error",
        error.message || "Failed to create payment order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!consignmentId || !amount) {
      Alert.alert("Error", "Consignment ID or amount is missing.");
      return;
    }
    create_payment_order(consignmentId, amount);
  };

  const getTravelIcon = () => {
    switch (travelMode.toLowerCase()) {
      case "roadways":
        return <Icon name="car" size={24} color="#D83F3F" />;
      case "car":
        return <Icon name="car" size={24} color="#D83F3F" />;
      case "bus":
        return <Icon name="car" size={24} color="#D83F3F" />;
      case "other":
        return <Icon name="car" size={24} color="#D83F3F" />;
      case "airplane":
        return <Ionicons name="airplane" size={24} color="#D83F3F" />;
      case "train":
        return <Icon name="train" size={24} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={24} color="gray" />;
    }
  };

  console.log("PayNowScreen - Received amount:", amount);
  console.log("PayNowScreen - Amount type:", typeof amount);
  console.log("PayNowScreen - Notification object:", notification);
  
  const itemTotal = amount ? parseInt(amount) + parseInt(savedAmount || 0) : 0;
  const totalAmount = amount || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Consignment Request Accepted</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef} // Add ref to MapView
          style={styles.map}
          initialRegion={{
            latitude: originCoords?.latitude || 28,
            longitude: originCoords?.longitude || 77,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor="blue"
              strokeWidth={5}
            />
          )}

          {originCoords && (
            <Marker coordinate={originCoords} title={startLocation}>
              <View style={[styles.marker, styles.startMarker]}>
                <Icon name="user" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {destinationCoords && (
            <Marker coordinate={destinationCoords} title={endLocation}>
              <View style={[styles.marker, styles.endMarker]}>
                <Icon name="map-marker" size={20} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* User Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Traveler Details</Text>
          <View style={styles.traveler}>
            <Image 
              source={profilepicture ? { uri: profilepicture } : require("../../Images/kyc.png")} 
              style={styles.profileImage} 
            />
            <View style={styles.travelerDetails}>
              <Text style={styles.travelerName}>
                {travellername ? `${travellername}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            {getTravelIcon()}
            <Text style={styles.infoText}>
              {travelMode === "roadways" 
                ? `Roadways ${travelModeNumber || ''}` 
                : `${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)} ${travelModeNumber || ''}`}
            </Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimated Travel Route</Text>
          <View style={styles.locationRow}>
            <Image
              source={require("../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>{startLocation || "N/A"}</Text>
              <Text style={styles.timeText}>Pick-up: {pickupTime ? formatTime(pickupTime, 'HH:mm') : "N/A"}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.verticalSeparator} />
          </View>

          <View style={styles.locationRow}>
            <Image
              source={require("../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>{endLocation || "N/A"}</Text>
              <Text style={styles.timeText}>
                Drop-off: {dropoffTime ? formatTime(dropoffTime, 'HH:mm') : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Travel Details Card */}
        {travelDetails && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Travel Details</Text>
            <View style={styles.travelDetailsRow}>
              <Text style={styles.travelDetailsLabel}>Travel ID:</Text>
              <Text style={styles.travelDetailsValue}>{travelDetails.travelId || travelId || "N/A"}</Text>
            </View>
            <View style={styles.travelDetailsRow}>
              <Text style={styles.travelDetailsLabel}>Status:</Text>
              <Text style={[styles.travelDetailsValue, styles.statusText]}>
                {travelDetails?.status ? travelDetails?.status.toUpperCase() : "N/A"}
              </Text>
            </View>
            {travelDetails.expectedStartTime && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>Start Time:</Text>
                <Text style={styles.travelDetailsValue}>
                  {formatTime(travelDetails.expectedStartTime, 'HH:mm')}
                </Text>
              </View>
            )}
            {travelDetails.expectedEndTime && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>End Time:</Text>
                <Text style={styles.travelDetailsValue}>
                  {formatTime(travelDetails.expectedEndTime, 'HH:mm')}
                </Text>
              </View>
            )}
            {travelDetails.travelDate && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>Travel Date:</Text>
                <Text style={styles.travelDetailsValue}>
                  {formatDate(travelDetails.travelDate, 'DD MMM YYYY')}
                </Text>
              </View>
            )}
            {travelDetails.phoneNumber && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>Traveler Phone:</Text>
                <Text style={styles.travelDetailsValue}>{travelDetails.phoneNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* Loading indicator for travel details */}
        {fetchingTravelDetails && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Loading Travel Details...</Text>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Fetching travel information...</Text>
            </View>
          </View>
        )}

        {/* Payment Info - Now inside ScrollView */}
        <View style={styles.paymentInfo}>
          <TouchableOpacity
            style={styles.paymentDetails}
          >
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentText}>
                Total: ₹{totalAmount || "N/A"}
              </Text>
              {/* {notification?.amount && typeof notification.amount === 'object' && (
                <View style={styles.amountBreakdown}>
                  {notification.amount.senderTotalPay && (
                    <Text style={styles.breakdownText}>
                      Sender Pay: ₹{notification.amount.senderTotalPay}
                    </Text>
                  )}
                  {notification.amount.totalFare && (
                    <Text style={styles.breakdownText}>
                      Total Fare: ₹{notification.amount.totalFare}
                    </Text>
                  )}
                  {notification.amount.platformFee && (
                    <Text style={styles.breakdownText}>
                      Platform Fee: ₹{notification.amount.platformFee}
                    </Text>
                  )}
                </View>
              )} */}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payButton, loading && { opacity: 0.6 }]}
            onPress={handlePayNow}
            disabled={loading}
          >
            <Text style={styles.payButtonText}>
              {loading ? "Processing..." : "Pay Now"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add bottom padding for better spacing */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    marginRight: 10,
  },
  scrollView: {
    flex: 1,
  },
  map: {
    height: 300, // Fixed height instead of flex
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  locationIcon: {
    width: 20,
    height: 20,
  },
  locationDetails: {
    marginLeft: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timeText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  verticalSeparator: {
    width: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginLeft: 29,
  },
  paymentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "#4CAF50",
  },
  endMarker: {
    backgroundColor: "#F44336",
  },
  bottomPadding: {
    height: 20,
  },
  travelDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    paddingVertical: 2,
  },
  travelDetailsLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    flex: 1,
  },
  travelDetailsValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  statusText: {
    fontWeight: "bold",
    color: "#D83F3F",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  amountBreakdown: {
    marginTop: 5,
  },
  breakdownText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default PayNowScreen;
