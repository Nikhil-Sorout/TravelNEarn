import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome";
import UpdateStatus from "../Customer Traveller/UpdateStatusDetails";
import Header from "../header";
import commonStyles from "../styles";

const ConsignmentCarryDetails = ({ route }) => {
  const navigation = useNavigation();
  const { ride } = route?.params;
  console.log("ride", ride)
  const travelId = route?.params?.travelId;
  const consignmentId = route?.params?.consignmentId;


  const [loading, setLoading] = useState(true);
  const [consignmentDetails, setConsignmentDetails] = useState({});
  const [status, setStatus] = useState(ride.status);
  const [isModalVisible, setModalVisible] = useState(false);
  const [travelDistance, setTravelDistance] = useState(null);
  const [travelDuration, setTravelDuration] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const GOOGLE_API_KEY = "AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec";

  const handleImagePress = (index) => {
    console.log(index)
    setSelectedImageIndex(index);
    setShowImageModal(true);
    console.log("Image URI:", consignmentDetails.consignment);

  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(null);
  };

  // Memoize consignmentDetails to stabilize its reference
  const memoizedConsignmentDetails = useMemo(() => consignmentDetails, [
    consignmentDetails.consignmentId,
    consignmentDetails.username,
    consignmentDetails.phoneNumber,
    consignmentDetails.startinglocation,
    consignmentDetails.receivername,
    consignmentDetails.receiverphone,
    consignmentDetails.goinglocation,
    consignmentDetails.weight,
    consignmentDetails.dimensions?.length,
    consignmentDetails.dimensions?.breadth,
    consignmentDetails.dimensions?.height,
    consignmentDetails.dimensions?.unit,
    consignmentDetails.status,
    consignmentDetails.expectedEarning,
    consignmentDetails.description,
    consignmentDetails.handleWithCare,
    consignmentDetails.specialRequest,
    consignmentDetails.dateOfSending,
    consignmentDetails.distance,
    consignmentDetails.duration,
    consignmentDetails.category,
    consignmentDetails.durationAtEndPoint,
    consignmentDetails.images?.length,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;

    if (
      typeof timestamp === "object" &&
      timestamp.date &&
      timestamp.time &&
      timestamp.day
    ) {
      if (
        timestamp.date === "N/A" ||
        timestamp.time === "N/A" ||
        timestamp.day === "N/A"
      ) {
        return null;
      }
      return {
        date: timestamp.date,
        time: timestamp.time,
        day: timestamp.day,
      };
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      day: date.toLocaleDateString("en-GB", { weekday: "long" }),
    };
  };

  const fetchDistanceAndDuration = async (origin, destination) => {
    if (
      !origin ||
      !destination ||
      origin === "Unknown" ||
      destination === "Unknown"
    ) {
      console.warn("Invalid origin or destination:", { origin, destination });
      setTravelDistance("N/A");
      setTravelDuration("N/A");
      return;
    }

    const cacheKey = `distance_${origin}_${destination}`;
    try {
      const cachedResult = await AsyncStorage.getItem(cacheKey);
      if (cachedResult) {
        const { distance, duration } = JSON.parse(cachedResult);
        setTravelDistance(distance);
        setTravelDuration(duration);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&mode=driving&units=metric&key=${GOOGLE_API_KEY}`;

      const response = await axios.get(url);
      const result = response.data;

      if (result.status !== "OK" || !result.rows[0]?.elements[0]?.distance) {
        throw new Error(
          `API error: ${result.status}, ${result.error_message || "No distance data"
          }`
        );
      }

      const distance = result.rows[0].elements[0].distance.text;
      const duration = result.rows[0].elements[0].duration.text;

      await AsyncStorage.setItem(cacheKey, JSON.stringify({ distance, duration }));

      setTravelDistance(distance);
      setTravelDuration(duration);
    } catch (error) {
      console.error("Error fetching distance/duration:", error.message);
      setTravelDistance("N/A");
      setTravelDuration("N/A");
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        console.error("Phone number not found in AsyncStorage");
        return;
      }

      const response = await fetch(
        `https://travel.timestringssystem.com/editp/consignment-collected-status/phoneNumber=${phoneNumber}?consignmentId=${consignmentId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetch status response:", JSON.stringify(data, null, 2));

      if (data.status && Array.isArray(data.status)) {
        const mappedHistory = data.status.map((item) => ({
          status: item.step || "Unknown",
          time: formatTimestamp(item.updatedat),
          completed: item.completed || false,
        }));
        console.log(
          "Mapped status history:",
          JSON.stringify(mappedHistory, null, 2)
        );
        setStatusHistory(mappedHistory);

        const latestCompleted = mappedHistory
          .filter((item) => item.completed)
          .pop();

        if (latestCompleted) {
          setStatus(latestCompleted.status);
        }

        return mappedHistory;
      } else {
        console.error("Unexpected response:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching status:", error);
      return [];
    }
  };

  const fetchConsignmentData = async () => {
    try {
      if (!consignmentId) {
        console.log("No consignmentId available for fetching consignment data");
        return;
      }

      console.log("Fetching consignment data for consignmentId:", consignmentId);

      const response = await fetch(
        `https://travel.timestringssystem.com/api/consignment/${consignmentId}`
      );

      if (!response.ok) {
        console.warn("Failed to fetch consignment data:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Consignment data response:", JSON.stringify(data, null, 2));

      if (data && data.consignment) {
        const consignment = data.consignment;
        console.log("Setting consignment details from API response", consignment.images);

        setConsignmentDetails((prev) => ({
          ...prev,
          consignmentId: consignment.consignmentId || prev.consignmentId,
          username: consignment.username || prev.username,
          phoneNumber: consignment.phoneNumber || prev.phoneNumber,
          startinglocation: consignment.startinglocation || prev.startinglocation,
          receivername: consignment.recievername || prev.receivername,
          receiverphone: consignment.recieverphone || prev.receiverphone,
          goinglocation: consignment.goinglocation || prev.goinglocation,
          weight: consignment.weight || prev.weight,
          dimensions: consignment.dimensions || prev.dimensions,
          status: consignment.status || prev.status,
          expectedEarning: consignment.earning || prev.expectedEarning,
          description: consignment.Description || prev.description,
          handleWithCare: consignment.handleWithCare ? "Yes" : "No",
          specialRequest: consignment.specialRequest || prev.specialRequest,
          dateOfSending: consignment.dateOfSending || prev.dateOfSending,
          distance: consignment.distance || prev.distance,
          duration: consignment.duration || prev.duration,
          category: consignment.category || prev.category,
          durationAtEndPoint: consignment.durationAtEndPoint || prev.durationAtEndPoint,
          images: consignment.images || prev.images,
        }));

        // Update ride object as well
        ride.status = consignment.status || ride.status;
        ride.expectedEarning = consignment.earning || ride.expectedEarning;
        ride.distance = consignment.distance || ride.distance;
        ride.duration = consignment.duration || ride.duration;

        // Update travel distance and duration from API response
        if (consignment.distance) {
          setTravelDistance(consignment.distance);
        }
        if (consignment.duration) {
          setTravelDuration(consignment.duration);
        }
      }
    } catch (error) {
      console.error("Error fetching consignment data:", error);
    }
  };

  useEffect(() => {
    fetchStatusHistory();
  }, [consignmentId, refreshTrigger]);

  useEffect(() => {
    if (consignmentId) {
      fetchConsignmentData();
    }
  }, [consignmentId]);

  useEffect(() => {
    try {
      setLoading(true);

      const parseDimensions = (dimensions) => {
        if (typeof dimensions === "object" && dimensions !== null) {
          return {
            length: dimensions.length || "0",
            breadth: dimensions.breadth || "0",
            height: dimensions.height || "0",
            unit: dimensions.unit || "cm",
          };
        }
        return { length: "0", breadth: "0", height: "0", unit: "cm" };
      };

      const parseWeight = (weight) => {
        if (typeof weight === "string") {
          return weight.replace(/"/g, "") || "0";
        }
        return weight || "0";
      };

      const details = {
        consignmentId: consignmentId || "N/A",
        username: ride.username || "Unknown",
        phoneNumber: ride.phoneNumber || "Unknown",
        startinglocation: ride.startinglocation || "Unknown",
        receivername: ride.receivername || "Unknown",
        receiverphone: ride.receiverphone || "Unknown",
        goinglocation: ride.goinglocation || "Unknown",
        weight: parseWeight(ride.weight),
        dimensions: parseDimensions(ride.dimensions),
        status: ride.status || "Yet to Collect",
        expectedEarning: ride.expectedEarning || "0",
        description: ride.description || "No description provided",
        handleWithCare: ride.handleWithCare || "No",
        specialRequest: ride.specialRequest || "None",
        dateOfSending: ride.dateOfSending || null,
      };

      setConsignmentDetails(details);
      fetchDistanceAndDuration(details.startinglocation, details.goinglocation);
    } catch (err) {
      console.error("Error processing ride data:", err.message);
      setConsignmentDetails({});
      setTravelDistance("N/A");
      setTravelDuration("N/A");
    } finally {
      setLoading(false);
    }
  }, [ride, consignmentId]); // Removed consignmentDetails from dependencies

  useEffect(() => {
    if (
      memoizedConsignmentDetails &&
      (!memoizedConsignmentDetails.expectedEarning ||
        memoizedConsignmentDetails.expectedEarning === "0") &&
      consignmentId
    ) {
      fetchConsignmentData();
    }
  }, [consignmentId, refreshTrigger]); // Removed memoizedConsignmentDetails dependency

  const StatusTimeline = ({ statusHistory }) => {
    if (!statusHistory || statusHistory.length === 0) return null;

    return (
      <View style={styles.statusTimelineCard}>
        {statusHistory.map((item, index) => {
          let iconName = "time-outline";
          let bgColor = "#FFC107";
          let displayStatus = item.status;

          if (item.completed) {
            iconName = "check";
            bgColor = "#53B175";
            displayStatus =
              item.status === "Consignment Collected"
                ? "Consignment Collected"
                : "Consignment Delivered";
          }

          return (
            <View key={index} style={styles.statusTimelineItem}>
              <View style={styles.statusIconContainer}>
                <View style={[styles.statusIcon, { backgroundColor: bgColor }]}>
                  <Icon
                    name={item.completed ? "check" : "clock-o"}
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
                {index < statusHistory.length - 1 && (
                  <View style={styles.statusLine} />
                )}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>{displayStatus}</Text>
                {item.time && (
                  <Text style={styles.statusTime}>
                    {item.time.day}, {item.time.date} at {item.time.time}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const handleSearch = async (apiResponseData) => {
    try {
      setModalVisible(false);
      setLoading(true);

      if (apiResponseData) {
        console.log(
          "API Response in handleSearch:",
          JSON.stringify(apiResponseData, null, 2)
        );

        if (apiResponseData.status) {
          ride.status = apiResponseData.status;
          setStatus(apiResponseData.status);
          console.log("Updated status to:", apiResponseData.status);
        }

        if (apiResponseData.expectedEarning !== undefined) {
          ride.expectedEarning = apiResponseData.expectedEarning;
          console.log("Updated ride.expectedEarning to:", apiResponseData.expectedEarning);
        }

        if (apiResponseData.statusHistory) {
          const history = apiResponseData.statusHistory || [];
          const mappedHistory = history.map((item) => ({
            status:
              item.status === "Collected"
                ? "Consignment Collected"
                : "Consignment Delivered",
            time: formatTimestamp(
              item.time || apiResponseData.delivered || item.updatedat
            ),
            completed:
              item.status === "Collected" || item.status === "Delivered",
          }));

          console.log(
            "Mapped status history in handleSearch:",
            JSON.stringify(mappedHistory, null, 2)
          );

          setStatusHistory(mappedHistory);
        }

        setConsignmentDetails((prevDetails) => {
          const updatedDetails = {
            ...prevDetails,
            status: apiResponseData.status || prevDetails.status,
            ...(apiResponseData.pickup && { pickup: apiResponseData.pickup }),
            ...(apiResponseData.drop && { drop: apiResponseData.drop }),
            ...(apiResponseData.description && {
              description: apiResponseData.description,
            }),
            ...(apiResponseData.weight && { weight: apiResponseData.weight }),
            ...(apiResponseData.dimensions && {
              dimensions: apiResponseData.dimensions,
            }),
            ...(apiResponseData.handleWithCare && {
              handleWithCare: apiResponseData.handleWithCare,
            }),
            ...(apiResponseData.specialRequest && {
              specialRequest: apiResponseData.specialRequest,
            }),
            ...(apiResponseData.dateOfSending && {
              dateOfSending: apiResponseData.dateOfSending,
            }),
            ...(apiResponseData.expectedEarning !== undefined && {
              expectedEarning: apiResponseData.expectedEarning,
            }),
          };
          console.log("Updated consignment details:", updatedDetails);
          return updatedDetails;
        });
      }

      await fetchStatusHistory();
      setRefreshTrigger((prev) => prev + 1);

      if (!apiResponseData?.expectedEarning) {
        await fetchConsignmentData();
      }

      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error("Error in handleSearch:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#000' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <UpdateStatus
            onClose={() => setModalVisible(false)}
            onSearch={handleSearch}
            earning={consignmentDetails.expectedEarning || 0}
            consignmentId={consignmentId || ""}
            travelId={travelId || ""}
            currentStatus={status}
          />
        </View>
      </Modal>

      <Header title="Consignment Details" navigation={navigation} />

      {statusHistory &&
        statusHistory.some(
          (item) =>
            item.completed &&
            (item.status === "Consignment Collected" ||
              item.status === "Consignment Completed")
        ) && (
          <StatusTimeline
            statusHistory={statusHistory.filter(
              (item) =>
                item.completed &&
                (item.status === "Consignment Collected" ||
                  item.status === "Consignment Completed")
            )}
          />
        )}

      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locon.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>
            {consignmentDetails.username || "N/A"}:{" "}
            {consignmentDetails.phoneNumber || "N/A"}
            {"\n"}
            <Text style={styles.callNowText}>
              {consignmentDetails.startinglocation || "N/A"}
            </Text>
          </Text>
        </View>
        <View style={commonStyles.verticalseparator} />
        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locend.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>
            {consignmentDetails.receivername || "N/A"}:{" "}
            {consignmentDetails.receiverphone || "N/A"}
            {"\n"}
            <Text style={styles.callNowText}>
              {consignmentDetails.goinglocation || "N/A"}
            </Text>
          </Text>
        </View>
        <View style={[commonStyles.staraightSeparator, { marginTop: 30 }]} />
        <View style={styles.infoRow}>
          <Image
            source={require("../Images/clock.png")}
            style={[styles.locationIcon, { marginLeft: 5 }]}
          />
          <Text style={styles.infoText}>
            {consignmentDetails.distance || travelDistance || "Calculating..."}
            {"\n"}
            {consignmentDetails.duration || travelDuration || "Calculating..."}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description of Parcel</Text>
        <Text style={styles.parcelDescription}>
          {consignmentDetails.description || "No description provided"}
        </Text>

        {/* Render Images */}
        {consignmentDetails.images && consignmentDetails.images.length > 0 && (
          <>
            <View style={styles.dottedLine} />
            <Text style={styles.boldText}>Parcel Images</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageContainer}
            >
              {consignmentDetails.images.map((imageUrl, index) => (
                <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => handleImagePress(index)}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.parcelImage}
                    resizeMode="cover"
                    onError={(error) => console.log(`Image ${index} failed to load:`, error)}
                    defaultSource={require("../Images/package.png")}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {showImageModal && selectedImageIndex !== null && consignmentDetails?.images && consignmentDetails.images[selectedImageIndex] && (
              <View style={{
                position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                // width: 50,
              }}>
                <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 1001 }} onPress={closeImageModal}>
                  <Text style={{ color: 'white', fontSize: 30 }}>×</Text>
                </TouchableOpacity>
                <Image
                  source={{ uri: consignmentDetails.images[selectedImageIndex] }}
                  style={{ width: 300, height: 400, borderRadius: 10, resizeMode: 'contain' }}
                />
              </View>
            )}
          </>
        )}

        <View style={styles.dottedLine} />
        <View style={styles.otherInfo}>
          <View style={styles.infoBlock}>
            <View style={[styles.infoRow, { marginTop: 0 }]}>
              <Image
                source={require("../Images/weight.png")}
                style={styles.infoIcon}
              />
              <Text style={styles.infoTitle}>Weight</Text>
            </View>
            <Text style={styles.infoValue}>
              {consignmentDetails.weight
                ? `${parseFloat(consignmentDetails.weight)} Kg`
                : "N/A"}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <View style={[styles.infoRow, { marginTop: 0 }]}>
              <Image
                source={require("../Images/dimension.png")}
                style={styles.infoIcon}
              />
              <Text style={styles.infoTitle}>Dimensions</Text>
            </View>
            <Text style={styles.infoValue}>
              {consignmentDetails.dimensions?.length &&
                consignmentDetails.dimensions?.breadth &&
                consignmentDetails.dimensions?.height
                ? `${parseFloat(
                  consignmentDetails.dimensions.length
                )}x${parseFloat(
                  consignmentDetails.dimensions.breadth
                )}x${parseFloat(consignmentDetails.dimensions.height)} ${consignmentDetails.dimensions.unit || "cm"
                }`
                : "N/A"}
            </Text>
          </View>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.extraInfo}>
          <Text style={styles.boldText}>Category</Text>
          <Text style={styles.extraValue}>
            {consignmentDetails.category ? consignmentDetails.category.charAt(0).toUpperCase() + consignmentDetails.category.slice(1) : "N/A"}
          </Text>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.extraInfo}>
          <Text style={styles.boldText}>Handle with Care</Text>
          <Text style={styles.extraValue}>
            {consignmentDetails.handleWithCare || "No"}
          </Text>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.extraInfo}>
          <Text style={styles.boldText}>Special Requests</Text>
          <Text style={styles.extraValue}>
            {consignmentDetails.specialRequest || "None"}
          </Text>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.extraInfo}>
          <Text style={styles.boldText}>
            Date of Delivery
          </Text>
          <Text style={styles.extraValue}>
            {consignmentDetails.dateOfSending
              ? `${formatDate(consignmentDetails.dateOfSending)}`
              : "N/A"}
          </Text>
        </View>
        {consignmentDetails.durationAtEndPoint && (
          <>
            <View style={styles.dottedLine} />
            <View style={styles.extraInfo}>
              <Text style={styles.boldText}>Duration at End Point</Text>
              <Text style={styles.extraValue}>
                {consignmentDetails.durationAtEndPoint}
              </Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.boldText}>Expected Earning</Text>
          <Text style={styles.earningText}>
            {(consignmentDetails.expectedEarning || ride.expectedEarning) &&
              (consignmentDetails.expectedEarning !== "0" || ride.expectedEarning !== "0") &&
              (consignmentDetails.expectedEarning !== 0 || ride.expectedEarning !== 0)
              ? `₹${parseFloat(consignmentDetails.expectedEarning || ride.expectedEarning).toFixed(2)}`
              : ""}
          </Text>
        </View>
      </View>

      {ride.status !== "Delivered" &&
        ride.status !== "Completed" &&
        ride.status !== "Consignment Completed" &&
        ride.status !== "Consignment Delivered" &&
        status !== "Delivered" &&
        status !== "Completed" &&
        status !== "Consignment Completed" &&
        status !== "Consignment Delivered" && (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowText}>{"›››››  "}</Text>
              </View>
              <Text style={styles.updateStatusButtonText}>Update Status</Text>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowText}>{"  ›››››"}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
    </ScrollView>
  );
};

// Styles remain unchanged
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
  card: {
    backgroundColor: "#fff",
    margin: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  locationText: {
    color: "black",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
  },
  callNowText: {
    color: "black",
    fontSize: 14,
    marginLeft: 10,
    marginTop: 5,
    fontWeight: "normal",
  },
  dottedLine: {
    borderStyle: "dotted",
    borderWidth: 1,
    borderColor: "#aaa",
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    fontWeight: "bold",
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
  },
  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
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
    flex: 1,
    alignItems: "flex-start",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
    marginRight: 10,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    marginLeft: 32,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  locationIcon: {
    width: 24,
    height: 24,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  statusTimelineCard: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTimelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statusIconContainer: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusLine: {
    position: "absolute",
    width: 2,
    backgroundColor: "#E0E0E0",
    top: 24,
    bottom: -16,
    left: 11,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  statusTime: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  updateStatusButton: {
    backgroundColor: "#4CAF50",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  updateStatusButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 10,
  },
  arrowContainer: {
    justifyContent: "center",
  },
  arrowText: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  imageContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  imageWrapper: {
    marginRight: 10,
  },
  parcelImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
});

export default ConsignmentCarryDetails;