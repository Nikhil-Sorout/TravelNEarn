import React, { useEffect, useState, useRef } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const ConsignmentPayRequest = ({ route, navigation }) => {
  const { phoneNumber, notification, consignmentId, profilepicture } =
    route?.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consignmentData, setConsignmentData] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [selectedTravelMode, setSelectedTravelMode] = useState("train");
  const isMounted = useRef(true); // Track component mount state

  console.log("Consignment ID from params:", consignmentId);

  useEffect(() => {
    isMounted.current = true; // Set to true on mount

    const fetchConsignmentDetails = async () => {
      if (!phoneNumber) {
        console.warn("Phone number not provided in route params");
        if (isMounted.current) {
          setError("Phone number not provided");
          setLoading(false);
        }
        Alert.alert("Error", "Phone number not provided");
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }

        console.log("Fetching consignment details for Phone:", phoneNumber);
        const baseUrl = await AsyncStorage.getItem('apiBaseUrl')
        // const baseUrl = "http://192.168.1.30:5002/"
        const endpoint = `${baseUrl}t/request/${phoneNumber}`;
        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
        

        if (!response.ok) {
          let errorMessage = `HTTP error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage += ` - ${errorData.message || "No details provided"}`;
          } catch (e) {
            console.warn("Could not parse error response:", e);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(
          "Consignment details response:",
          JSON.stringify(data, null, 2)
        );
        setSearchStatus(data.requests[0].status);

        let requests = [];
        if (data && Array.isArray(data.requests) && data.requests.length > 0) {
          requests = data.requests;
        } else if (data && data.request) {
          requests = [data.request];
        }

        if (requests.length > 0) {
          const mappedData = requests.map((item) => {
            console.log("Raw dimension value:", item.dimension);
            let parsedDimensions = {
              length: "N/A",
              breadth: "N/A",
              height: "N/A",
              unit: "N/A",
            };
            if (item.dimension) {
              try {
                const cleanedDimension = item.dimension
                  .trim()
                  .replace(/'/g, '"')
                  .replace(/\s+/g, " ")
                  .replace(/(\w+):/g, '"$1":');
                parsedDimensions = JSON.parse(cleanedDimension);
              } catch (parseErr) {
                console.error("Dimension parsing error:", parseErr);
                const match = item.dimension.match(
                  /length: ['"]?(\w+)['"]?, breadth: ['"]?(\w+)['"]?, height: ['"]?(\w+)['"]?, unit: ['"]?(\w+)['"]?/
                );
                if (match) {
                  parsedDimensions = {
                    length: match[1] || "N/A",
                    breadth: match[2] || "N/A",
                    height: match[3] || "N/A",
                    unit: match[4] || "N/A",
                  };
                }
              }
            }
            return {
              consignmentId: item.consignmentId || "N/A",
              fromLocation: item.pickup || "N/A",
              toLocation: item.drop || "N/A",
              weight: item.weight || "N/A",
              dimensions: parsedDimensions,
              amount: item.earning || "N/A",
              distance: item.distance || "N/A",
              date: item.date || "N/A",
              description: item.description || "No description provided",
              handleWithCare: item.handleWithCare || "No",
              specialRequests: item.specialRequests || "No",
              travelmode: item.travelmode || "N/A",
              requestedby: item.requestedby || "N/A",
              travellername: item.travellername || "N/A",
              travelId: item.travelId || "N/A",
              status: item.status,
              dateOfSending : item.dateOfSending
            };
          });

          if (isMounted.current) {
            setConsignmentData(mappedData);
          }
        } else if (notification?.rideDetails) {
          const notificationData = [
            {
              consignmentId: notification.rideDetails.consignmentId || "N/A",
              fromLocation: notification.rideDetails.starting || "N/A",
              toLocation: notification.rideDetails.going || "N/A",
              weight: notification.rideDetails.weight || "N/A",
              dimensions: notification.rideDetails.dimensions || {
                length: "N/A",
                breadth: "N/A",
                height: "N/A",
                unit: "N/A",
              },
              amount: notification.rideDetails.amount || "N/A",
              distance: notification.rideDetails.distance || "N/A",
              date: notification.rideDetails.date || "N/A",
              description:
                notification.rideDetails.description ||
                "No description provided",
              handleWithCare: notification.rideDetails.handleWithCare || "No",
              specialRequests: notification.rideDetails.specialRequests || "No",
              travelmode: notification.rideDetails.travelmode || "N/A",
              requestedby: notification.rideDetails.requestedby || "N/A",
              travellername: notification.rideDetails.travellername || "N/A",
              travelId: notification.rideDetails.travelId || "N/A",
            },
          ];

          if (isMounted.current) {
            setConsignmentData(notificationData);
          }
        } else {
          throw new Error("No consignment data found");
        }
      } catch (err) {
        console.error("Error fetching consignment details:", err);
        if (isMounted.current) {
          setError(err.message || "Failed to load consignment details");
          Alert.alert(
            "Error",
            err.message || "Failed to load consignment details"
          );
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchConsignmentDetails();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
    };
  }, [phoneNumber]); // Removed notification from dependency array

  const handleSearch = (searchParams) => {
    const { from, to, mode, date } = searchParams;
    setSearchFrom(from);
    setSearchTo(to);
    setSearchDate(date);
    setSelectedTravelMode(mode || "train");
    setSearchModalVisible(false);

    if (date && from && to) {
      fetchData(formatDate(date), mode || "train");
    }
  };

  const fetchData = async (formattedDate, mode) => {
    try {
      setLoading(true);
      setError(null);
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const endpoint = `${baseurl}t/search?from=${searchFrom}&to=${searchTo}&date=${formattedDate}&mode=${mode}`;
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      let requests = [];
      if (data && Array.isArray(data.requests) && data.requests.length > 0) {
        requests = data.requests;
      } else if (data && data.request) {
        requests = [data.request];
      }

      const mappedData = requests.map((item) => ({
        consignmentId: item.consignmentId || "N/A",
        fromLocation: item.pickup || "N/A",
        toLocation: item.drop || "N/A",
        weight: item.weight || "N/A",
        dimensions: item.dimension
          ? JSON.parse(
              item.dimension
                .trim()
                .replace(/'/g, '"')
                .replace(/\s+/g, " ")
                .replace(/(\w+):/g, '"$1":')
            )
          : { length: "N/A", breadth: "N/A", height: "N/A", unit: "N/A" },
        amount: item.earning || "N/A",
        distance: item.distance || "N/A",
        date: item.date || "N/A",
        description: item.description || "No description provided",
        handleWithCare: item.handleWithCare || "No",
        specialRequests: item.specialRequests || "No",
        travelmode: item.travelmode || "N/A",
        requestedby: item.requestedby || "N/A",
        travellername: item.travellername || "N/A",
        travelId: item.travelId || "N/A",
        status : item.status
      }));

      if (isMounted.current) {
        setConsignmentData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching search data:", err);
      if (isMounted.current) {
        setError(err.message || "Failed to load search results");
        Alert.alert("Error", err.message || "Failed to load search results");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const formatDate = (date) => {
    return date;
  };

  const toggleSearchModal = () => {
    setSearchModalVisible(!searchModalVisible);
  };

  const toggleDetailsModal = (item) => {
    setSelectedConsignment(item);
    setDetailsModalVisible(!detailsModalVisible);
  };

  const handleResponse = async (item, responseType) => {
    try {
      const { consignmentId, travelId } = item;
      if (!consignmentId || consignmentId === "N/A") {
        throw new Error("Consignment ID not found");
      }
      if (!travelId || travelId === "N/A") {
        throw new Error("Travel ID not found");
      }

      const payload = {
        response: responseType, // "accept" or "reject"
      };
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const url = `${baseurl}order/respondto?travelId=${travelId}&consignmentId=${consignmentId}`;
      console.log(`${responseType} request URL:`, url);
      console.log(
        `${responseType} request payload:`,
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`${responseType} response status:`, response.status);
      console.log(`Raw ${responseType} response:`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(
          `Invalid server response: ${responseText.substring(0, 100)}...`
        );
      }

      if (response.ok) {
        if (responseType === "accept") {  
          Alert.alert(
            "Success",
            `Consignment request accepted successfully`
          );
          // Navigate to PayNowScreen and then NotificationsScreen
          navigation.navigate("PayNowScreen", {
            consignmentId: consignmentId,
            travelId: travelId,
          });
          navigation.navigate("Notification");
        } else {
          Alert.alert("Success", "Consignment request declined");
          navigation.navigate("Notification");
        }
      } else {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error(`${responseType} error:`, error.message);
      Alert.alert(
        "Error",
        error.message || `Failed to ${responseType} consignment`
      );
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
        <Text style={styles.headerTitle}>Consignment Requests</Text>
      </View>

      <ScrollView>
        {consignmentData.map((item, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => toggleDetailsModal(item)}
            >
              <View style={styles.locationRow}>
                <Image
                  source={require("../../Images/locon.png")}
                  style={styles.locationIcon}
                />
                <Text style={styles.locationText}>
                  {item.fromLocation || "N/A"}
                </Text>
              </View>

              <View style={styles.locationRow}>
                <View style={styles.verticalseparator} />
              </View>

              <View style={styles.separator} />

              <View style={styles.locationRow}>
                <Image
                  source={require("../../Images/locend.png")}
                  style={styles.locationIcon}
                />
                <Text style={styles.locationText}>
                  {item.toLocation || "N/A"}
                </Text>
              </View>

              <View style={styles.separator1} />

              <View style={styles.otherInfo}>
                <View style={styles.infoBlock}>
                  <View style={[styles.infoRow, { marginTop: 0 }]}>
                    <Image
                      source={require("../../Images/weight.png")}
                      style={[
                        styles.locationIcon,
                        { width: 24, height: 24, marginTop: -3 },
                      ]}
                    />
                    <Text style={[styles.infoTitle, { marginLeft: 5 }]}>
                      Weight
                    </Text>
                  </View>
                  <Text style={[styles.infoSubtitle, { color: "black" }]}>
                    {item.weight || "N/A"} Kg
                  </Text>
                </View>

                <View style={styles.infoBlock}>
                  <View style={[styles.infoRow, { marginTop: 0 }]}>
                    <Image
                      source={require("../../Images/dimension.png")}
                      style={[
                        styles.locationIcon,
                        { width: 24, height: 24, marginTop: -3 },
                      ]}
                    />
                    <Text style={[styles.infoTitle, { marginLeft: 5 }]}>
                      Dimensions
                    </Text>
                  </View>
                  <Text style={[styles.infoSubtitle, { color: "black" }]}>
                    {item.dimensions.length}x{item.dimensions.breadth}x
                    {item.dimensions.height} {item.dimensions.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.dottedLine} />

              <View style={styles.rowBetween}>
                <Text style={styles.boldText}>Total expected Earning</Text>
                <Text style={styles.earningText}>₹{item.amount.totalFare || "N/A"}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => toggleDetailsModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ConsignmentRequestModel
              status={searchStatus}
              selectedConsignment={selectedConsignment}
              onClose={() => toggleDetailsModal(null)}
              onResponse={handleResponse} // Updated to use a single handler
              phoneNumber={phoneNumber}
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
    // marginTop: 40,
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
    marginTop: 0,
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
    marginTop: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  locationIcon: {
    width: 20,
    height: 20,
  },
  locationText: {
    color: "black",
    fontSize: 16,
    marginLeft: 20,
    fontWeight: "bold",
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginLeft: 5,
  },
  verticalseparator: {
    width: 1,
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
    fontSize: 15,
    color: "black",
    marginLeft: 10,
    marginTop: -2,
    fontWeight: "bold",
  },
  dottedLine: {
    borderStyle: "dotted",
    borderWidth: 0.5,
    borderColor: "#aaa",
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: "#333",
  },
  parcelDescription: {
    fontSize: 16,
    color: "black",
    marginBottom: 12,
    marginLeft: 6,
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
    marginTop: 5,
  },
  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 0,
  },
  extraValue: {
    color: "black",
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
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

export default ConsignmentPayRequest;
