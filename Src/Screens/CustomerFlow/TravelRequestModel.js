import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";

const { width } = Dimensions.get("window");

const TravelRequestModel = ({
  route,
  selectedConsignment,
  consignmentId: propConsignmentId,
  travelId: propTravelId,
  onSearch,
  onClose,
  onAccept,
  onReject,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consignmentStatus, setConsignmentStatus] = useState(null); // New state for consignment status

  const getIconName = (mode) => {
    switch (mode.toLowerCase()) {
      case "car":
        return "car";
      case "train":
        return "train";
      case "plane":
      case "airplane":
        return "airplane";
      default:
        return "help";
    }
  };

  const getTravelIcon = () => {
    const mode = rideDetails?.travelMode?.toLowerCase() || "car";
    switch (mode) {
      case "car":
        return <Ionicons name="car" size={24} color="#D83F3F" />;
      case "airplane":
        return <Ionicons name="airplane" size={24} color="#D83F3F" />;
      case "train":
        return <Ionicons name="train" size={24} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={24} color="gray" />;
    }
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        let dataSource = selectedConsignment;

        if (!dataSource && route?.params) {
          const { rideId, consignmentId: routeConsignmentId } =
            route.params || {};
          const phoneNumber = await AsyncStorage.getItem("phoneNumber");
          if (!phoneNumber) throw new Error("Phone number not found");

          const endpoint = `https://travel.timestringssystem.com/api/riderequest/${phoneNumber}`;
          const response = await fetch(endpoint, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `HTTP error: ${response.status}`
            );
          }

          const result = await response.json();
          console.log("Ride requests data:", result);
          if (
            Array.isArray(result.rideRequests) &&
            result.rideRequests.length > 0
          ) {
            dataSource = result.rideRequests.find((r) => r.rideId === rideId);
          }

          if (!dataSource) throw new Error("Ride details not found");
        }

        if (dataSource) {
          console.log("Data source for ride details:", dataSource);
          setRideDetails({
            rideId: dataSource.rideId || "N/A",
            travelId: dataSource.travelId || propTravelId || "N/A",
            consignmentId:
              propConsignmentId ||
              route?.params?.consignmentId ||
              dataSource.consignmentId ||
              "N/A",
            pickup: dataSource.pickup || dataSource.starting || "Unknown",
            drop: dataSource.drop || dataSource.going || "Unknown",
            travelMode: dataSource.travelMode || "Unknown",
            expectedStartTime:
              dataSource.expectedStartTime ||
              dataSource.expectedstarttime ||
              "Unknown",
            earning: dataSource.earning || "0",
            requestedBy:
              dataSource.requestedBy || dataSource.requestedby || "Unknown",
            requestTo:
              dataSource.requestTo || dataSource.requestto || "Unknown",
            username: dataSource.username || dataSource.riderName || "Unknown",
            bookingId: dataSource.bookingId || "N/A",
            createdAt: dataSource.createdAt || "Unknown",
            riderName: dataSource.rider || dataSource.username || "Unknown",
            profilePicture: dataSource.profilePicture || null,
            rating: dataSource.rating || "0",
            totalRating: dataSource.totalRating || "0",
          });
          // Set consignment status from dataSource
          setConsignmentStatus(dataSource.status || "Pending");
        }
      } catch (error) {
        console.error("Error fetching ride details:", error.message);
        Alert.alert("Error", "Failed to load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [selectedConsignment, propConsignmentId, propTravelId, route]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const finalConsignmentId =
        rideDetails?.consignmentId ||
        propConsignmentId ||
        route?.params?.consignmentId ||
        selectedConsignment?.consignmentId ||
        "N/A";

      const finalTravelId =
        rideDetails?.travelId ||
        propTravelId ||
        route?.params?.travelId ||
        selectedConsignment?.travelId ||
        "N/A";

      console.log("Before remove - Setting navigation params:", {
        consignmentId: finalConsignmentId,
        travelId: finalTravelId,
      });

      // Update the current screen's params
      navigation.setParams({
        consignmentId:
          finalConsignmentId !== "N/A" ? finalConsignmentId : undefined,
        travelId: finalTravelId !== "N/A" ? finalTravelId : undefined,
      });

      // Ensure the parent screen receives the params
      if (navigation.getParent()) {
        navigation.getParent().setParams({
          consignmentId:
            finalConsignmentId !== "N/A" ? finalConsignmentId : undefined,
          travelId: finalTravelId !== "N/A" ? finalTravelId : undefined,
        });
      }
    });

    return unsubscribe;
  }, [
    navigation,
    rideDetails,
    propConsignmentId,
    propTravelId,
    route,
    selectedConsignment,
  ]);

  const handleAcceptAction = async (action) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLoading(true);
    try {
      const travelId =
        rideDetails?.travelId ||
        selectedConsignment?.travelId ||
        propTravelId ||
        route?.params?.travelId;
      const finalConsignmentId =
        propConsignmentId ||
        rideDetails?.consignmentId ||
        route?.params?.consignmentId;

      console.log(`Attempting to ${action} with:`, {
        travelId,
        consignmentId: finalConsignmentId,
      });

      if (!travelId || travelId === "N/A") {
        throw new Error("Travel ID is missing or invalid");
      }
      if (!finalConsignmentId || finalConsignmentId === "N/A") {
        throw new Error("Consignment ID is missing or invalid");
      }

      const payload = {
        response: action,
      };
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const url = `${baseurl}order/respond?travelId=${travelId}&consignmentId=${finalConsignmentId}`;
      console.log(`${action} request URL:`, url);
      console.log(
        `${action} request payload:`,
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        timeout: 10000,
      });

      console.log(`${action} response status:`, response.status);
      const responseText = await response.text();
      console.log(`Raw ${action} response:`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          "Response:",
          responseText
        );
        throw new Error("Invalid server response");
      }

      if (response.ok) {
        console.log(`${action} response data:`, JSON.stringify(data, null, 2));

        if (action === "accept") {
          setIsAccepted(true);
          setConsignmentStatus("Accepted"); // Update status locally
          Alert.alert(
            "Success",
            `Consignment request accepted successfully`
          );
        } else if (action === "reject") {
          setConsignmentStatus("Rejected"); // Update status locally
          Alert.alert("Success", "Consignment request rejected successfully");
        }

        setTimeout(() => {
          navigation.navigate("Notification", {
            refresh: true,
            consignmentId: finalConsignmentId,
            travelId,
          });
        }, 2000);

        if (selectedConsignment) {
          if (action === "accept" && onAccept) {
            onAccept(selectedConsignment);
          } else if (action === "reject" && onReject) {
            onReject(selectedConsignment);
          }
          onClose();
        }
      } else {
        console.error("Server error data:", data);
        // Update status if server indicates already accepted/rejected
        if (data.message === "This consignment is already accepted") {
          setConsignmentStatus("Accepted");
        } else if (data.message.includes("already been")) {
          setConsignmentStatus(data.message.split(" ").pop().replace(".", ""));
        }
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error(`${action} error:`, error.message);
      Alert.alert("Error", error.message || `Failed to ${action} consignment`);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (!rideDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ride details available</Text>
      </View>
    );
  }

  const { pickup, drop, travelMode, earning, riderName } = rideDetails;
  const isStatusAccepted = isAccepted || consignmentStatus === "Accepted";
  const isStatusRejected = consignmentStatus === "Rejected";
  const isStatusExpired = consignmentStatus === "Expired";

  // Show different content based on status
  if (isStatusAccepted) {
    return (
      <View style={styles.modalContainer}>
        <ScrollView>
          {/* Traveler Details Card - Full details when accepted */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Traveler Details</Text>
            <View style={styles.traveler}>
              <Image 
                source={{ uri: rideDetails.profilePicture }} 
                style={styles.profileImage}
                onError={() => {
                  console.log("Error loading profile image, falling back to default");
                  setRideDetails((prev) => ({ ...prev, profilePicture: null }));
                }}
              />
              <View style={styles.travelerDetails}>
                <Text style={styles.travelerName}>
                  {rideDetails?.riderName || "Unknown User"}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="orange" />
                  <Text style={styles.ratingText}>
                    {rideDetails.rating} ({rideDetails.totalRating} ratings)
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.infoRow}>
              {getTravelIcon()}
              <Text style={styles.infoText}>
                {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}
              </Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Travel Route</Text>
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locon.png")}
                style={styles.locationIcon}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>{pickup}</Text>
                <Text style={styles.timeText}>
                  Pick-up: {rideDetails.expectedStartTime ? 
                    moment.utc(rideDetails.expectedStartTime).format("HH:mm") : "N/A"}
                </Text>
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
                <Text style={styles.locationText}>{drop}</Text>
                <Text style={styles.timeText}>
                  Drop-off: {rideDetails.expectedEndTime ? 
                    moment.utc(rideDetails.expectedEndTime).format("HH:mm") : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Travel Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Travel Details</Text>
            {/* <View style={styles.travelDetailsRow}>
              <Text style={styles.travelDetailsLabel}>Travel ID:</Text>
              <Text style={styles.travelDetailsValue}>{rideDetails.travelId || "N/A"}</Text>
            </View> */}
            {/* <View style={styles.travelDetailsRow}>
              <Text style={styles.travelDetailsLabel}>Consignment ID:</Text>
              <Text style={styles.travelDetailsValue}>{rideDetails.consignmentId || "N/A"}</Text>
            </View> */}
            <View style={styles.travelDetailsRow}>
              <Text style={styles.travelDetailsLabel}>Status:</Text>
              <Text style={[styles.travelDetailsValue, styles.statusText]}>
                {consignmentStatus?.toUpperCase() || "ACCEPTED"}
              </Text>
            </View>
            {rideDetails.expectedStartTime && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>Start Time:</Text>
                <Text style={styles.travelDetailsValue}>
                  {moment.utc(rideDetails.expectedStartTime).format("HH:mm")}
                </Text>
              </View>
            )}
            {rideDetails.expectedEndTime && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>End Time:</Text>
                <Text style={styles.travelDetailsValue}>
                  {moment.utc(rideDetails.expectedEndTime).format("HH:mm")}
                </Text>
              </View>
            )}
            {rideDetails.createdAt && (
              <View style={styles.travelDetailsRow}>
                <Text style={styles.travelDetailsLabel}>Created:</Text>
                <Text style={styles.travelDetailsValue}>
                  {moment.utc(rideDetails.createdAt).format("DD MMM YYYY HH:mm")}
                </Text>
              </View>
            )}
          </View>

          {/* Earning Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.boldText}>Expected Earning</Text>
              <Text style={styles.earningText}>₹{earning.totalFare}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // For rejected or expired status - show minimal information
  if (isStatusRejected || isStatusExpired) {
    return (
      <View style={styles.modalContainer}>
        <ScrollView>
          {/* Status Card */}
          <View style={styles.card}>
            <Text style={[styles.statusText, styles.statusTitle]}>
              {isStatusRejected ? "Request Rejected" : "Request Expired"}
            </Text>
          </View>

          {/* Basic Travel Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Travel Information</Text>
            <View style={styles.infoRow}>
              {getTravelIcon()}
              <Text style={styles.infoText}>
                {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}
              </Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Route</Text>
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locon.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>{pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.verticalSeparator} />
            </View>
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locend.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>{drop}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Default view for pending status - show action buttons
  return (
    <View style={styles.modalContainer}>
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{pickup}</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.verticalSeparator} />
          </View>
          <View style={styles.locationRow}>
            <Image
              source={require("../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{drop}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Travel Mode</Text>
            <View style={{ marginLeft: 10 }}>
              <Ionicons
                name={getIconName(rideDetails.travelMode)}
                size={20}
                color="#D32F2F"
              />
            </View>
          </View>

          <View style={styles.profileSection}>
            <Image
              source={{ uri: rideDetails.profilePicture }}
              style={styles.profilePic}
              onError={() => {
                console.log(
                  "Error loading profile image, falling back to default"
                );
                setRideDetails((prev) => ({ ...prev, profilePicture: null }));
              }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>
                {rideDetails?.riderName || "Unknown User"}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="orange" />
                <Text style={styles.ratingText}>
                  {rideDetails.rating} ({rideDetails.totalRating} ratings)
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.boldText}>Expected Earning</Text>
            <Text style={styles.earningText}>₹{earning.totalFare}</Text>
          </View>
        </View>

        {selectedConsignment?.status === "pending" && (
          <View style={styles.card}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleAcceptAction("reject")}
                disabled={loading || isProcessing}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptAction("accept")}
                disabled={loading || isProcessing}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  acceptedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  acceptedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#53B175",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    margin: 12,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  locationIcon: { width: 20, height: 20 },
  locationText: {
    color: "black",
    fontSize: 16,
    marginLeft: 10,
    fontFamily: "Inter-SemiBold",
  },
  locationDetails: {
    marginLeft: 10,
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  separator: { height: 1, backgroundColor: "#ddd", marginVertical: 10 },
  verticalSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "#ddd",
    marginLeft: 29,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  infoText: { fontSize: 14, color: "black", fontFamily: "Inter-SemiBold" },
  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  extraValue: { color: "black", fontSize: 14 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boldText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Inter-Bold",
  },
  earningText: { color: "green", fontFamily: "Inter-Bold", fontSize: 16 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  rejectButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff0000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#ff0000",
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  acceptButton: {
    backgroundColor: "#53B175",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  acceptButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter-Bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", textAlign: "center", fontSize: 16 },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#eee",
    backgroundColor: "#f0f0f0",
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  username: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  ratingText: {
    marginLeft: 5,
    color: "#555",
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  // New styles for accepted status view
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
  statusTitle: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },
});

export default TravelRequestModel;