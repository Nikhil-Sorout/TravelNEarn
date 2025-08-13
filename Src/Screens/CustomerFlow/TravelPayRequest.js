import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import ConsignmentRequestModel from "./ConsignmentRequestModel";
import TravelRequestModel from "./TravelRequestModel";

const { width } = Dimensions.get("window");

const TravelPayRequest = ({ route, navigation }) => {
  const { phoneNumber, consignmentId, travelId } = route?.params || {};
  const [profilePic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [selectedTravelMode, setSelectedTravelMode] = useState("train");

  useEffect(() => {
    const fetchRideRequests = async () => {
      if (!phoneNumber) {
        setError("Phone number not provided");
        setLoading(false);
        Alert.alert("Error", "Phone number not provided");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const endpoint = `https://travel.timestringssystem.com/api/riderequest/${phoneNumber}`;
        // const endpoint = `http://192.168.31.158:5002/api/riderequest/${phoneNumber}`;
        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
        // const newdata = await response.json();
        // console.log("response :", newdata);
        // console.log("Ans " + JSON.stringify(response.data, null, 2));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error: ${response.status}`
          );
        }

        const data = await response.json();
        if (!data.rideRequests || data.rideRequests.length === 0) {
          throw new Error("No ride requests found");
        }
        console.log("data :", data);
        setRideRequests(
          data.rideRequests.map((item) => ({
            rideId: item.rideId || "N/A",
            travelId: item.travelId || travelId || "N/A",
            rider: item.rider || "N/A",
            consignmentId: consignmentId || item.consignmentId || "N/A",
            pickup: item.pickup || "N/A",
            drop: item.drop || "N/A",
            travelMode: item.travelMode || "N/A",
            expectedStartTime: item.expectedstarttime || "N/A",
            earning: item.earning || "N/A",
            requestedBy: item.requestedby || "N/A",
            requestTo: item.requestto || "N/A",
            username: item.username || "N/A",
            bookingId: item.bookingId || "N/A",
            createdAt: item.createdAt || "N/A",
            profilePicture: item.profilepicture || null,
            rating: item.rating || "0",
            totalRating: item.totalrating || "0",
            status: item.status || "N/A",
          }))
        );
      } catch (err) {
        console.error("Error fetching ride requests:", err);
        setError(err.message || "Failed to load ride requests");
        Alert.alert("Error", err.message || "Failed to load ride requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRideRequests();
  }, [phoneNumber, consignmentId, travelId]);

  const handleSearch = (searchParams) => {
    const { from, to, mode, date } = searchParams;
    setSearchFrom(from);
    setSearchTo(to);
    setSearchDate(date);
    setSelectedTravelMode(mode || "train");
    setSearchModalVisible(false);

    if (date && from && to) {
      fetchSearchData(formatDate(date), mode || "train");
    }
  };

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

  const fetchSearchData = async (formattedDate, mode) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = `https://travel.timestringssystem.com/t/search?from=${encodeURIComponent(
        searchFrom
      )}&to=${encodeURIComponent(searchTo)}&date=${encodeURIComponent(
        formattedDate
      )}&mode=${encodeURIComponent(mode)}`;
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.rideRequests || data.rideRequests.length === 0) {
        throw new Error("No search results found");
      }

      setRideRequests(
        data.rideRequests.map((item) => ({
          rideId: item.rideId || "N/A",
          travelId: item.travelId || travelId || "N/A",
          consignmentId: consignmentId || item.consignmentId || "N/A",
          pickup: item.pickup || "N/A",
          drop: item.drop || "N/A",
          travelMode: item.travelMode || "N/A",
          expectedStartTime: item.expectedstarttime || "N/A",
          earning: item.earning || "N/A",
          requestedBy: item.requestedby || "N/A",
          requestTo: item.requestto || "N/A",
          username: item.username || "N/A",
          bookingId: item.bookingId || "N/A",
          createdAt: item.createdAt || "N/A",
        }))
      );
    } catch (err) {
      console.error("Error fetching search data:", err);
      setError(err.message || "Failed to load search results");
      Alert.alert("Error", err.message || "Failed to load search results");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const toggleSearchModal = () => {
    setSearchModalVisible(!searchModalVisible);
  };

  const toggleDetailsModal = (item) => {
    if (!item) {
      setSelectedRequest(null);
      setDetailsModalVisible(false);
      return;
    }

    const finalConsignmentId =
      item.consignmentId !== "N/A"
        ? item.consignmentId
        : consignmentId !== "N/A"
          ? consignmentId
          : selectedRequest?.consignmentId || "N/A";
    const finalTravelId =
      item.travelId !== "N/A"
        ? item.travelId
        : travelId !== "N/A"
          ? travelId
          : selectedRequest?.travelId || "N/A";

    console.log("Opening TravelRequestModel with:", {
      consignmentId: finalConsignmentId,
      travelId: finalTravelId,
      item,
    });

    if (
      !finalConsignmentId ||
      finalConsignmentId === "N/A" ||
      !finalTravelId ||
      finalTravelId === "N/A"
    ) {
      Alert.alert("Error", "Invalid consignment or travel ID");
      return;
    }

    setSelectedRequest({
      ...item,
      consignmentId: finalConsignmentId,
      travelId: finalTravelId,
      profilePicture: item.profilePicture || null,
    });
    setDetailsModalVisible(true);
  };

  const handleAccept = async (item) => {
    try {
      setLoading(true);
      console.log("Handling accept for item:", item);

      // Remove the accepted ride request from the list
      setRideRequests((prev) =>
        prev.filter((data) => data.rideId !== item.rideId)
      );

      // Close the modal
      toggleDetailsModal(null);

      // Navigate to NotificationsScreen
      navigation.navigate("Notification", {
        refresh: true,
        consignmentId: item.consignmentId,
        travelId: item.travelId,
      });
    } catch (err) {
      console.error("Error handling accept:", err);
      Alert.alert("Error", err.message || "Failed to process accept action");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (item) => {
    try {
      setLoading(true);
      console.log("Handling reject for item:", item);

      // Remove the rejected ride request from the list
      setRideRequests((prev) =>
        prev.filter((data) => data.rideId !== item.rideId)
      );

      // Show success alert
      Alert.alert("Success", "Ride request rejected successfully");

      // Close the modal
      toggleDetailsModal(null);

      // Navigate to NotificationsScreen
      navigation.navigate("Notification", {
        refresh: true,
        consignmentId: item.consignmentId,
        travelId: item.travelId,
      });
    } catch (err) {
      console.error("Error handling reject:", err);
      Alert.alert("Error", err.message || "Failed to process reject action");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Requests</Text>
      </View>

      <ScrollView>
        {rideRequests.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => toggleDetailsModal(item)}
          >
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locon.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>{item.pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.verticalSeparator} />
            </View>
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locend.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>{item.drop}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.otherInfo}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoTitle}>Mode of Travel</Text>
                <View style={{ marginTop: 10 }}>
                  <Ionicons
                    name={getIconName(item.travelMode)}
                    size={30}
                    color="#D83F3F"
                  />
                </View>
              </View>
            </View>
            <View style={styles.dottedLine} />
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Image
                  source={
                    item.profilePicture
                      ? { uri: item.profilePicture }
                      : require("../../Images/kyc.png")
                  }
                  style={styles.profilePic}
                  onError={() => {
                    console.log(
                      "Error loading profile image, falling back to default"
                    );
                  }}
                />
                <View>
                  <Text style={{ fontFamily: "Inter-Regular" }}>
                    {item.rider}
                  </Text>
                  <View
                    style={{
                      marginTop: 5,
                      flexDirection: "row",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="star" color={"orange"} />
                    <Text>
                      {item.rating || "0"} ({item.totalRating || "0"} ratings)
                    </Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={{ fontFamily: "Inter-Bold", color: "green" }}>
                  ₹ {item.earning.senderTotalPay} 
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={searchModalVisible}
        onRequestClose={toggleSearchModal}
      >
        <TravelRequestModel onSearch={handleSearch} />
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => toggleDetailsModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TravelRequestModel
              selectedConsignment={selectedRequest}
              consignmentId={
                selectedRequest?.consignmentId !== "N/A"
                  ? selectedRequest?.consignmentId
                  : consignmentId !== "N/A"
                    ? consignmentId
                    : undefined
              }
              travelId={
                selectedRequest?.travelId !== "N/A"
                  ? selectedRequest?.travelId
                  : travelId !== "N/A"
                    ? travelId
                    : undefined
              }
              onClose={() => toggleDetailsModal(null)}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    marginRight: 10,
  },
  card: {
    backgroundColor: "#fff",
    margin: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
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
  locationText: {
    color: "black",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f0f0f0",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  verticalSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "#ddd",
    marginLeft: 29,
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBlock: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    color: "#333",
  },
  infoSubtitle: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
  dottedLine: {
    borderStyle: "solid",
    borderWidth: 0.2,
    borderColor: "#aaa",
    marginVertical: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  earningText: {
    color: "green",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    marginTop: "20%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default TravelPayRequest;
