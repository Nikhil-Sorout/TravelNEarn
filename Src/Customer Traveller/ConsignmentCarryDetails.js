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
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome";
import UpdateStatus from "../Customer Traveller/UpdateStatusDetails";
import Header from "../header";
import commonStyles from "../styles";
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  responsivePadding,
  responsiveFontSize,
  responsiveDimensions,
} from "../Utils/responsive";
import { formatDate, formatTime } from "../Utils/dateTimeUtils";

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

  // Function to parse expected earning string and extract values
  const parseExpectedEarning = (earning) => {
    if (!earning) return null;
    
    // If it's already an object, return as is
    if (typeof earning === 'object' && earning !== null) {
      return earning;
    }
    
    // If it's a string, try to parse it
    if (typeof earning === 'string') {
      try {
        // Remove any extra quotes and parse the JSON-like string
        const cleanString = earning.replace(/^"|"$/g, '').replace(/\\/g, '');
        
        // Extract senderTotalPay and totalFare using regex
        const senderTotalPayMatch = cleanString.match(/senderTotalPay:\s*([\d.]+)/);
        const totalFareMatch = cleanString.match(/totalFare:\s*([\d.]+)/);
        
        if (senderTotalPayMatch && totalFareMatch) {
          return {
            senderTotalPay: parseFloat(senderTotalPayMatch[1]),
            totalFare: parseFloat(totalFareMatch[1])
          };
        }
        
        // Fallback: try to parse as JSON
        const parsed = JSON.parse(cleanString);
        return parsed;
      } catch (error) {
        console.error('Error parsing expected earning:', error);
        return null;
      }
    }
    
    return null;
  };

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

  // Using centralized date/time utilities
  const formatDateLocal = (dateString) => {
    if (!dateString) return "N/A";
    return formatDate(dateString, 'DD MMMM YYYY');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;

    console.log("formatTimestamp input:", JSON.stringify(timestamp, null, 2));

    // If timestamp is already an object with date, time, and day properties,
    // we need to check if it's already in local time or needs conversion
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
      
      // If the timestamp object has a raw timestamp property, use that for conversion
      if (timestamp.rawTimestamp) {
        console.log("Using rawTimestamp for conversion:", timestamp.rawTimestamp);
        return {
          date: formatDate(timestamp.rawTimestamp, 'DD/MM/YYYY'),
          time: formatTime(timestamp.rawTimestamp, 'hh:mm A'),
          day: formatDate(timestamp.rawTimestamp, 'dddd'),
        };
      }
      
      // If the timestamp object has an ISO string or UTC timestamp, use that
      if (timestamp.isoString || timestamp.utcTimestamp) {
        const rawTimestamp = timestamp.isoString || timestamp.utcTimestamp;
        console.log("Using ISO/UTC timestamp for conversion:", rawTimestamp);
        return {
          date: formatDate(rawTimestamp, 'DD/MM/YYYY'),
          time: formatTime(rawTimestamp, 'hh:mm A'),
          day: formatDate(rawTimestamp, 'dddd'),
        };
      }
      
      // Convert the formatted timestamp from UTC to local time
      // Since you mentioned the time is made using UTC, we'll always convert
      try {
        const dateStr = timestamp.date; // e.g., "8/19/2025"
        const timeStr = timestamp.time; // e.g., "11:38:59 PM"
        
        console.log("Attempting to convert UTC timestamp to local time");
        console.log("Date string:", dateStr);
        console.log("Time string:", timeStr);
        
        // Parse the date components
        const [month, day, year] = dateStr.split('/').map(Number);
        console.log("Parsed date components:", { month, day, year });
        
        // Parse the time components
        const timeMatch = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          let [_, hours, minutes, seconds, period] = timeMatch;
          hours = parseInt(hours);
          minutes = parseInt(minutes);
          seconds = parseInt(seconds);
          
          // Convert to 24-hour format
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
          
          console.log("Parsed time components:", { hours, minutes, seconds });
          
          // Create a Date object in UTC
          const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
          console.log("Created UTC Date object:", utcDate.toISOString());
          
          if (!isNaN(utcDate.getTime())) {
            console.log("Converting formatted UTC timestamp to local time");
            console.log("Original UTC time:", `${dateStr} ${timeStr}`);
            console.log("Converted to local time:", utcDate.toLocaleString());
            
            return {
              date: formatDate(utcDate, 'DD/MM/YYYY'),
              time: formatTime(utcDate, 'hh:mm A'),
              day: formatDate(utcDate, 'dddd'),
            };
          }
        } else {
          console.warn("Could not parse time format:", timeStr);
        }
      } catch (error) {
        console.warn("Error converting formatted timestamp:", error);
      }
      
      // If conversion fails, return as-is
      console.log("Conversion failed, returning formatted timestamp as-is");
      return {
        date: timestamp.date,
        time: timestamp.time,
        day: timestamp.day,
      };
    }

    // If it's a string, check if it's a UTC timestamp
    if (typeof timestamp === "string") {
      console.log("Processing string timestamp:", timestamp);
      
      // Check if it's an ISO string or UTC timestamp
      if (timestamp.includes('T') || timestamp.includes('Z') || timestamp.includes('GMT')) {
        console.log("Detected UTC timestamp, converting to local time");
        return {
          date: formatDate(timestamp, 'DD/MM/YYYY'),
          time: formatTime(timestamp, 'hh:mm A'),
          day: formatDate(timestamp, 'dddd'),
        };
      } else {
        // Assume it's already in local time format
        console.log("Assuming timestamp is already in local time");
        try {
          const dateObj = new Date(timestamp);
          if (!isNaN(dateObj.getTime())) {
            return {
              date: formatDate(dateObj, 'DD/MM/YYYY'),
              time: formatTime(dateObj, 'hh:mm A'),
              day: formatDate(dateObj, 'dddd'),
            };
          }
        } catch (error) {
          console.warn("Error parsing string timestamp:", error);
        }
      }
    }

    // Using centralized date/time utilities to convert UTC to local time
    console.log("Using default UTC to local conversion");
    return {
      date: formatDate(timestamp, 'DD/MM/YYYY'),
      time: formatTime(timestamp, 'hh:mm A'),
      day: formatDate(timestamp, 'dddd'),
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
          console.log(item)
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#000', fontSize: fontScale(16) }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: verticalScale(100) }}
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
             earning={(() => {
               const earning = consignmentDetails.expectedEarning || ride.expectedEarning;
               const parsedEarning = parseExpectedEarning(earning);
               return parsedEarning?.totalFare || 0;
             })()}
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
        <View style={[commonStyles.staraightSeparator, { marginTop: verticalScale(30) }]} />
        <View style={styles.infoRow}>
          <Image
            source={require("../Images/clock.png")}
            style={[styles.locationIcon, { marginLeft: scale(5) }]}
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
                <TouchableOpacity style={{ position: 'absolute', top: verticalScale(40), right: scale(20), zIndex: 1001 }} onPress={closeImageModal}>
                  <Text style={{ color: 'white', fontSize: fontScale(30) }}>×</Text>
                </TouchableOpacity>
                <Image
                  source={{ uri: consignmentDetails.images[selectedImageIndex] }}
                  style={{ width: scale(300), height: scale(400), borderRadius: scale(10), resizeMode: 'contain' }}
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
                              ? `${formatDateLocal(consignmentDetails.dateOfSending)}`
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
             {(() => {
               const earning = consignmentDetails.expectedEarning || ride.expectedEarning;
               const parsedEarning = parseExpectedEarning(earning);
               
               if (parsedEarning && parsedEarning.totalFare) {
                 return `₹${parseFloat(parsedEarning.totalFare).toFixed(2)}`;
               }
               
               // Fallback for other formats
               if (earning && earning !== "0" && earning !== 0) {
                 if (typeof earning === 'object' && earning.totalFare) {
                   return `₹${parseFloat(earning.totalFare).toFixed(2)}`;
                 }
                 if (typeof earning === 'string' && !isNaN(parseFloat(earning))) {
                   return `₹${parseFloat(earning).toFixed(2)}`;
                 }
                 if (typeof earning === 'number') {
                   return `₹${earning.toFixed(2)}`;
                 }
               }
               
               return "";
             })()}
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
          <View style={{ marginBottom: verticalScale(20) }}>
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
     </SafeAreaView>
   );
 };

// Responsive styles using responsive utilities
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
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
    margin: scale(12),
    padding: scale(16),
    borderRadius: scale(8),
    elevation: 3,
  },
  locationText: {
    color: "black",
    fontSize: fontScale(16),
    marginLeft: scale(10),
    fontWeight: "bold",
  },
  callNowText: {
    color: "black",
    fontSize: fontScale(14),
    marginLeft: scale(10),
    marginTop: verticalScale(5),
    fontWeight: "normal",
  },
  dottedLine: {
    borderStyle: "dotted",
    borderWidth: 1,
    borderColor: "#aaa",
    marginVertical: verticalScale(10),
  },
  infoText: {
    fontSize: fontScale(14),
    color: "#333",
    marginLeft: scale(10),
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: fontScale(18),
    marginBottom: verticalScale(8),
    color: "#333",
  },
  parcelDescription: {
    fontSize: fontScale(16),
    color: "black",
    marginBottom: verticalScale(12),
  },
  extraInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(5),
  },
  boldText: {
    fontWeight: "bold",
    fontSize: fontScale(14),
    color: "#333",
  },
  extraValue: {
    color: "black",
    fontSize: fontScale(14),
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningText: {
    color: "green",
    fontWeight: "bold",
    fontSize: fontScale(16),
  },
  footerButton: {
    backgroundColor: "#53B175",
    margin: scale(16),
    padding: verticalScale(14),
    borderRadius: scale(8),
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: fontScale(16),
    fontWeight: "bold",
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(10),
  },
  infoBlock: {
    flex: 1,
    alignItems: "flex-start",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  infoIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(8),
  },
  infoTitle: {
    fontSize: fontScale(14),
    fontWeight: "bold",
    color: "#444",
    marginRight: scale(10),
  },
  infoValue: {
    fontSize: fontScale(15),
    color: "#333",
    marginLeft: scale(32),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(5),
  },
  locationIcon: {
    width: scale(24),
    height: scale(24),
  },
  iconContainer: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  statusTimelineCard: {
    marginHorizontal: scale(16),
    marginVertical: verticalScale(10),
    padding: scale(16),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTimelineItem: {
    flexDirection: "row",
    marginBottom: verticalScale(16),
  },
  statusIconContainer: {
    alignItems: "center",
    width: scale(24),
    marginRight: scale(12),
  },
  statusIcon: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  statusLine: {
    position: "absolute",
    width: 2,
    backgroundColor: "#E0E0E0",
    top: scale(24),
    bottom: -scale(16),
    left: scale(11),
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fontScale(16),
    fontWeight: "600",
    color: "#333333",
  },
  statusTime: {
    fontSize: fontScale(14),
    color: "#666666",
    marginTop: verticalScale(2),
  },
  updateStatusButton: {
    backgroundColor: "#4CAF50",
    margin: scale(16),
    padding: verticalScale(12),
    borderRadius: scale(8),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  updateStatusButtonText: {
    color: "#fff",
    fontSize: fontScale(18),
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: scale(10),
  },
  arrowContainer: {
    justifyContent: "center",
  },
  arrowText: {
    color: "white",
    fontSize: fontScale(28),
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  imageContainer: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  imageWrapper: {
    marginRight: scale(10),
  },
  parcelImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(5),
  },
});

export default ConsignmentCarryDetails;