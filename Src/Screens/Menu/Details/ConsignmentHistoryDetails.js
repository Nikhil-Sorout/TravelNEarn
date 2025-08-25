import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import RBSheet from "react-native-raw-bottom-sheet";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSocket } from "../../../Context/socketprovider";
import RatingDetails from "../../../Customer Traveller/RatingDetails";
import Header from "../../../header";
import commonStyles from "../../../styles";
import { getCurvedPolylinePoints } from "../../../Utils/getCurvedPolylinePonints";
import { formatDate, formatTime } from "../../../Utils/dateTimeUtils";
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  screenWidth,
  screenHeight,
  responsivePadding,
  responsiveFontSize,
  responsiveDimensions,
} from "../../../Utils/responsive";

import axios from "axios";

const TravelDetails = ({ route }) => {
  const { ride } = route.params;
  console.log("Ride : ", ride);
  const bottomSheetRef = useRef();
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const { socket, isConnected, connectionError } = useSocket();

  const [startLocation, setStartLocation] = useState(
    ride.startinglocation || ""
  );
  const [endLocation, setEndLocation] = useState(ride.goinglocation || "");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  // Helper function to extract city from address
  const extractCityFromAddress = (address) => {
    if (!address) return null;
    
    // Split address by commas and look for city patterns
    const parts = address.split(',').map(part => part.trim());
    
    // Look for common city indicators or state abbreviations
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      // Skip if it's a state abbreviation or PIN code
      if (part.length <= 3 || /^\d{6}$/.test(part)) continue;
      
      // If it looks like a city name (not too short, not a number)
      if (part.length > 2 && !/^\d+$/.test(part)) {
        return part;
      }
    }
    
    return null;
  };

  // Helper function to determine display status
  const getDisplayStatus = (statusStr) => {
    const status = statusStr || "";
    const lowerStatus = status.toLowerCase();
    console.log(lowerStatus)
    // Check for pending/not accepted statuses
    const pendingStatuses = ["pending", "not started", "in progress", "rejected", "expired", "upcoming"];
    if (pendingStatuses.includes(lowerStatus)) {
      return "Upcoming";
    }
    
    // Check for accepted status
    if (lowerStatus === "accepted") {
      return "Accepted";
    }
    
    // Check for completed status
    if (lowerStatus === "completed") {
      return "Delivered";
    }
    
    // Check for collected status
    if (lowerStatus === "collected") {
      return "on the way";
    }
    
    // Default fallback
    return status || "Yet To Collect";
  };

  const [status, setStatus] = useState(() => getDisplayStatus(ride.status));
  const [otp, setOtp] = useState(ride.otp || "N/A");
  const [rotp, setRotp] = useState(ride.rotp || "N/A");
  const [rideStatus, setRideStatus] = useState([]);
  const [pickupTime, setPickupTime] = useState(null);
  const [dropTime, setDropTime] = useState(null);
  const [onTheWayTime, setOnTheWayTime] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(null);
  const [travelerProfilePic, setTravelerProfilePic] = useState(null);
  const [movementInterval, setMovementInterval] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [trackingError, setTrackingError] = useState(null);
  const [trackingState, setTrackingState] = useState({
    isActive: false,
    lastUpdate: null,
    error: null,
    retryCount: 0,
  });
  const locationUpdateHandlerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const [driverToDestinationRoute, setDriverToDestinationRoute] = useState([]);

  // Curved polyline points for flight-style path
  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];

  // State for additional consignment details
  const [consignmentDetails, setConsignmentDetails] = useState(null);
  const [loadingConsignment, setLoadingConsignment] = useState(false);

  // State for image modal
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchRideDetails = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        console.error("Phone number not found in AsyncStorage");
        return;
      }
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}editp/consignment-collected-status/phoneNumber=${phoneNumber}?consignmentId=${ride.consignmentId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Fetch Ride Details Response:",
        JSON.stringify(data, null, 2)
      );

      if (data.status && Array.isArray(data.status)) {
        const isCompleted = data.status.some(
          (item) => item.step === "Consignment Completed" && item.completed
        );

        const isCollected = data.status.some(
          (item) => item.step === "Consignment Collected" && item.completed
        );

        if (isCompleted) {
          setStatus("Delivered");
        } else if (isCollected) {
          setStatus("on the way");
        } else {
          // Check if the original status is pending/not accepted
          const originalStatus = ride.status || "";
          const lowerOriginalStatus = originalStatus.toLowerCase();
          const pendingStatuses = ["pending", "not started", "in progress", "rejected", "expired", "upcoming"];
          
          if (pendingStatuses.includes(lowerOriginalStatus)) {
            setStatus("Upcoming");
          } else if (lowerOriginalStatus === "accepted") {
            setStatus("Accepted");
          } else {
            setStatus("Yet To Collect");
          }
        } // Extract timestamps from the status updates
        const collectedItem = data.status.find(
          (item) => item.step === "Consignment Collected"
        );
        const onTheWayItem = data.status.find((item) =>
          item.step.includes("is on the way")
        );
        const completedItem = data.status.find(
          (item) => item.step === "Consignment Completed"
        );

        // Set pickup time if available
        if (collectedItem && collectedItem.updatedat) {
          try {
            // Try to parse updatedat as JSON if it's a string
            if (typeof collectedItem.updatedat === "string") {
              console.log(collectedItem)
              try {
                const parsedData = JSON.parse(collectedItem.updatedat);
                setPickupTime(parsedData);
              } catch {
                // If not valid JSON, try to use it directly as a date string
                setPickupTime(collectedItem.updatedat);
              }
            } else if (typeof collectedItem.updatedat === "object") {
              // If already an object, store the entire object
              setPickupTime(collectedItem.updatedat);
            }
          } catch (e) {
            console.error("Error parsing pickup time:", e);
          }
        }
        // Set on the way time if available
        if (onTheWayItem && onTheWayItem.updatedat) {
          try {
            // Try to parse updatedat as JSON if it's a string
            if (typeof onTheWayItem.updatedat === "string") {
              try {
                const parsedData = JSON.parse(onTheWayItem.updatedat);
                setOnTheWayTime(parsedData);
              } catch {
                // If not valid JSON, try to use it directly as a date string
                setOnTheWayTime(onTheWayItem.updatedat);
              }
            } else if (typeof onTheWayItem.updatedat === "object") {
              // If already an object, store the entire object
              setOnTheWayTime(onTheWayItem.updatedat);
            }
          } catch (e) {
            console.error("Error parsing on-the-way time:", e);
          }
        }

        // Set drop time if available
        if (completedItem && completedItem.updatedat) {
          try {
            // Try to parse updatedat as JSON if it's a string
            if (typeof completedItem.updatedat === "string") {
              try {
                const parsedData = JSON.parse(completedItem.updatedat);
                setDropTime(parsedData);
              } catch {
                // If not valid JSON, try to use it directly as a date string
                setDropTime(completedItem.updatedat);
              }
            } else if (typeof completedItem.updatedat === "object") {
              // If already an object, store the entire object
              setDropTime(completedItem.updatedat);
            }
          } catch (e) {
            console.error("Error parsing drop time:", e);
          }
        }

        // Map the status items for display
        const updatedStatus = data.status.map((item) => {
          let step = item.step;
          if (item.step.includes("is on the way")) {
            step = `${ride.travellername || "Traveler"} is on the way`;
          } else if (item.step === "Consignment Collected") {
            step = "on the way";
          } else if (item.step === "Consignment Completed") {
            step = "Delivered";
          }
          return { ...item, step };
        });

        setRideStatus(updatedStatus);
      } else {
        console.error("Unexpected response:", data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  // Function to fetch additional consignment details from backend
  const fetchConsignmentDetails = async () => {
    if (!ride.consignmentId) {
      console.log("No consignment ID available");
      return;
    }

    try {
      setLoadingConsignment(true);
      console.log("Fetching consignment details for consignment ID: ", ride.consignmentId)
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      // const baseurl = "http://192.168.1.30:5002/"
      const response = await fetch(`${baseurl}api/consignment/${ride.consignmentId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Consignment details from API:", data);
        setConsignmentDetails(data.consignment);
      } else {
        console.error("Failed to fetch consignment details:", response.status);
      }
    } catch (error) {
      console.error("Error fetching consignment details:", error);
    } finally {
      setLoadingConsignment(false);
    }
  };

  // Image modal functions
  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
  };

  const nextImage = () => {
    const images = consignmentDetails?.images || ride.images || [];
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    const images = consignmentDetails?.images || ride.images || [];
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getCurrentImages = () => {
    return consignmentDetails?.images || ride.images || [];
  };

  console.log("Consignment Details: ", consignmentDetails)
  useEffect(() => {
    const fetchLocationsAndDetails = async () => {
      try {
        if (ride.startinglocation && ride.goinglocation) {
          setStartLocation(ride.startinglocation);
          setEndLocation(ride.goinglocation);

          if (
            ride.status &&
            ride.status.toLowerCase() === "completed" &&
            ride.isRating !== "done"
          ) {
            bottomSheetRef.current.open();
          }

          await Promise.all([
            fetchCoordinates(ride.startinglocation, ride.goinglocation),
            fetchRoute(ride.startinglocation, ride.goinglocation),
            fetchRideDetails(),
            fetchConsignmentDetails(),
          ]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocationsAndDetails();
  }, [ride]);

  // Update map view when coordinates change
  useEffect(() => {
    if (mapRef.current && status === "Collected" && driverCoords) {
      // If we have driver coordinates and status is "Collected", focus on the driver
      mapRef.current.animateToRegion(
        {
          latitude: driverCoords.latitude,
          longitude: driverCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } else if (mapRef.current && originCoords && destinationCoords) {
      // Otherwise, fit the map to show both origin and destination
      mapRef.current.fitToCoordinates([originCoords, destinationCoords], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [originCoords, destinationCoords, driverCoords, status]);

  // Socket location tracking - enhanced version
  useEffect(() => {
    if (!socket || !ride || !ride.travelId || !ride._id) {
      console.log("[SOCKET] Missing socket or ride info for tracking");
      return;
    }

    console.log(
      `[SOCKET] Setting up location listeners for travel ${ride.travelId}`
    );

    // Add connection status logging
    socket.on("connect", () => {
      console.log("[SOCKET] Connected with ID:", socket.id);
      setConnectionStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected, reason:", reason);
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error);
      setConnectionStatus("error");
    });

    // Listen for location updates from the controller (riderLocationUpdate event)
    const locationUpdateHandler = (locationData) => {
      console.log(
        `[SOCKET] Received location update for travel ${ride.travelId}:`,
        locationData
      );

      if (
        locationData &&
        typeof locationData.latitude === "number" &&
        typeof locationData.longitude === "number"
      ) {
        const newDriverCoords = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };

        console.log("[SOCKET] New driver coordinates:", newDriverCoords);
        console.log("[SOCKET] Current status:", status);
        console.log("[SOCKET] Destination coordinates:", destinationCoords);

        // Update driver coordinates
        setDriverCoords(newDriverCoords);

        // Update tracking state
        setTrackingState((prev) => ({
          ...prev,
          lastUpdate: new Date(),
          error: null,
          retryCount: 0,
        }));

        // If we have destination coordinates and status is on the way, fetch the route
        if (destinationCoords && status === "on the way") {
          console.log("[SOCKET] Fetching new route to destination");
          fetchDriverToDestinationRoute(newDriverCoords, destinationCoords);
        }

        // Animate map to new location if available
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500
          );
        }
      } else {
        console.warn("[SOCKET] Invalid location data received:", locationData);
      }
    };

    // Subscribe to rider location updates
    socket.on("riderLocationUpdate", locationUpdateHandler);

    // Listen for start/stop tracking events
    socket.on(`startTracking:${ride.consignmentId}`, (data) => {
      console.log("[SOCKET] Start tracking received:", data);
      setTrackingState((prev) => ({
        ...prev,
        isActive: true,
        error: null,
      }));
    });

    socket.on(`stopTracking:${ride.consignmentId}`, (data) => {
      console.log("[SOCKET] Stop tracking received:", data);
      setTrackingState((prev) => ({
        ...prev,
        isActive: false,
        error: null,
      }));
      cleanupTracking();
    });

    // Get user's phone number from AsyncStorage
    const joinTrackingRoom = async () => {
      try {
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (!phoneNumber) {
          console.error("[SOCKET] Phone number not found in AsyncStorage");
          return;
        }

        // Join the tracking room with both phoneNumber and travelId
        socket.emit("join", {
          phoneNumber,
          travelId: ride.travelId,
        });

        console.log(
          `[SOCKET] Joining tracking room for travel ${ride.travelId} with phone ${phoneNumber}`
        );
      } catch (error) {
        console.error("[SOCKET] Error joining tracking room:", error);
        setTrackingState((prev) => ({
          ...prev,
          error: error.message,
          isActive: false,
        }));
      }
    };

    joinTrackingRoom();

    // Clean up on unmount
    return () => {
      console.log(
        `[SOCKET] Cleaning up location listeners and tracking for travel ${ride.travelId}`
      );
      socket.off("riderLocationUpdate", locationUpdateHandler);
      socket.off(`startTracking:${ride.consignmentId}`);
      socket.off(`stopTracking:${ride.consignmentId}`);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      cleanupTracking();
    };
  }, [socket, ride?.travelId, ride?._id, status]);

  useEffect(() => {
    if (
      status === "Delivered" &&
      ride.isRating !== "done" &&
      !ratingModalVisible &&
      !feedbackModalVisible
    ) {
      const timer = setTimeout(() => {
        setRatingModalVisible(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [status, ride.isRating]);

  // Check for rated consignments on component mount
  useEffect(() => {
    console.log("Profile pic" + ride?.profilePicture);

    const checkRatingStatus = async () => {
      try {
        if (ride.isRating === "done") {
          console.log("Rating already completed according to ride object");
          return;
        }

        const ratedConsignments =
          (await AsyncStorage.getItem("ratedConsignments")) || "[]";
        const ratedList = JSON.parse(ratedConsignments);

        const consignmentId = ride.consignmentId || ride._id;
        const hasBeenRated = ratedList.includes(consignmentId);

        if (hasBeenRated) {
          console.log("Consignment previously rated, updating ride object");
          ride.isRating = "done";
        }

        if (
          status === "Delivered" &&
          !hasBeenRated &&
          ride.isRating !== "done" &&
          !ratingModalVisible &&
          !feedbackModalVisible
        ) {
          console.log("Showing rating modal for unrated delivered consignment");
          setTimeout(() => {
            setRatingModalVisible(true);
          }, 500);
        }
      } catch (error) {
        console.error("Error checking rating status:", error);
      }
    };

    checkRatingStatus();
  }, [status]);

  useEffect(() => {
    const fetchTravelerData = async () => {
      try {
        // First try to use the picture from ride.traveldetails array if available
        if (
          ride.traveldetails &&
          ride.traveldetails.length > 0 &&
          ride.traveldetails[0]?.profilePicture
        ) {
          console.log(
            "Using profile picture from traveldetails:",
            ride.traveldetails[0]?.profilePicture
          );
          console.log("ride.traveldetails[0]?.profilePicture", ride.traveldetails[0]?.profilePicture)
          setTravelerProfilePic(ride.traveldetails[0]?.profilePicture);
          return;
        }

        // Next, try the profilepicture directly from the ride
        if (ride?.profilepicture && ride?.profilepicture !== "N/A") {
          console.log(
            "Using profile picture from ride object:",
            ride?.profilepicture
          );
          setTravelerProfilePic(ride?.profilepicture);
          return;
        }

        // If no profile pic found locally, then make the API call
        if (!ride || !ride.phoneNumber) {
          console.log("No traveler phone number available");
          return;
        }

        console.log("Fetching traveler data for:", ride.phoneNumber);
        const baseurl = await AsyncStorage.getItem("apiBaseUrl");
        const response = await axios.get(
          `${baseurl}api/getall/${ride.phoneNumber}`,
          {
            params: { phoneNumber: ride.phoneNumber },
          }
        );

        console.log("Traveler data response:", response.data);

        if (response.data && response.data.user) {
          const { profilePicture } = response?.data?.user;
          setTravelerProfilePic(profilePicture || null);
          console.log("Profile picture URL from API:", profilePicture);
        }
      } catch (error) {
        console.error("Error fetching traveler data:", error.message);
      }
    };

    fetchTravelerData();
  }, [ride?.phoneNumber]);

  const fetchRoute = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
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
        `${baseurl}map/getdistanceandcoordinate?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}`
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
        setDistance(data.distance);
        setDuration(data.duration);
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

  const getTravelIcon = (travelmode) => {
    switch (travelmode?.toLowerCase()) {
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
  const formatTimeLocal = (timeData) => {
    if (!timeData) return "N/A";

    console.log("formatTimeLocal input:", JSON.stringify(timeData, null, 2));

    // Handle UTC timestamp strings like "2025-08-25T03:28:33.778Z"
    if (typeof timeData === "string" && timeData.includes("T") && timeData.includes("Z")) {
      try {
        const date = new Date(timeData);
        if (!isNaN(date.getTime())) {
          // Use direct toLocaleTimeString for more reliable timezone conversion
          const localTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          console.log("Converted UTC timestamp to local time:", localTime);
          return localTime;
        }
      } catch (error) {
        console.error("Error parsing UTC timestamp:", error);
      }
    }

    // If timeData is an object with date, time, and day properties (pre-formatted local time)
    if (typeof timeData === "object" && timeData.date && timeData.time && timeData.day) {
      console.log("Processing pre-formatted local time object");
      
      // The time is already in local format, just return it without seconds
      const timeWithoutSeconds = timeData.time.replace(/:\d{2}\s/, " ");
      console.log("Returning time without seconds:", timeWithoutSeconds);
      return timeWithoutSeconds;
    }

    // If it's a string that looks like a time (e.g., "1:30 PM")
    if (typeof timeData === "string") {
      if (
        timeData.includes(":") &&
        (timeData.includes("AM") || timeData.includes("PM"))
      ) {
        return timeData.replace(/:\d{2}\s/, " "); // Remove seconds if present
      }

      try {
        // Attempt to parse as a full datetime string and convert to local time
        const date = new Date(timeData);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }

        // If we can't parse it directly, return the original string
        return timeData;
      } catch (e) {
        console.error("Error formatting time:", e);
        return timeData;
      }
    }

    return "N/A";
  };

  const formatDateLocal = (dateString) => {
    if (!dateString) return "N/A";
    
    // Handle UTC timestamp strings like "2025-08-25T03:28:33.778Z"
    if (typeof dateString === "string" && dateString.includes("T") && dateString.includes("Z")) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          // Use direct toLocaleDateString for more reliable timezone conversion
          const localDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          console.log("Converted UTC timestamp to local date:", localDate);
          return localDate;
        }
      } catch (error) {
        console.error("Error parsing UTC timestamp for date:", error);
      }
    }
    
    // If it's an object with date, time, and day properties (pre-formatted local date)
    if (typeof dateString === "object" && dateString.date && dateString.time && dateString.day) {
      console.log("Processing pre-formatted local date object");
      
      // The date is already in local format, just return it
      console.log("Returning date:", dateString.date);
      return dateString.date;
    }
    
    // For regular date strings, try to parse and format
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error("Error parsing date string:", error);
    }
    
    // Fallback to original string
    return dateString;
  };
  const formatDayShort = (dayString) => {
    if (!dayString) return "";
    return dayString.substring(0, 3).toUpperCase();
  };

  const formatUpdatedAt = (updatedat) => {
    if (!updatedat) return "N/A";

    if (typeof updatedat === "object") {
      if (updatedat.time && updatedat.date && updatedat.day) {
        const shortDay = formatDayShort(updatedat.day);
        const timeWithoutSeconds = updatedat.time.replace(/:\d{2}\s/, " ");
        return `${shortDay}, ${updatedat.date}, ${timeWithoutSeconds}`;
      }
      return JSON.stringify(updatedat);
    }

    if (typeof updatedat === "string") {
      try {
        const parsed = JSON.parse(updatedat);
        if (parsed.date && parsed.time && parsed.day) {
          const shortDay = formatDayShort(parsed.day);
          const timeWithoutSeconds = parsed.time.replace(/:\d{2}\s/, " ");
          return `${shortDay}, ${parsed.date}, ${timeWithoutSeconds}`;
        }
      } catch (e) {
        // Not JSON, continue with date parsing
      }

      const parsedDate = new Date(updatedat);
      if (!isNaN(parsedDate)) {
        const dayName = parsedDate
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase();

        const formattedDate = {
          date: `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear()}`,
          time: parsedDate
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase(),
          day: parsedDate.toLocaleDateString("en-US", { weekday: "long" }),
        };

        return `${dayName}, ${formattedDate.date}, ${formattedDate.time}`;
      }
      return updatedat;
    }
    return "N/A";
  };

  const renderStatusBadge = (status) => {
    let badgeColor;
    
    switch (status) {
      case "Delivered":
        badgeColor = "#32CD32"; // Green
        break;
      case "Upcoming":
        badgeColor = "#FF6B35"; // Orange
        break;
      case "Accepted":
        badgeColor = "#4CAF50"; // Light Green
        break;
      case "on the way":
        badgeColor = "#2196F3"; // Blue
        break;
      case "Yet To Collect":
        badgeColor = "#FFC107"; // Yellow/Amber
        break;
      default:
        badgeColor = "#FFC107"; // Yellow/Amber
        break;
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  const handleGetDirection = async () => {
    if (status === "on the way") {
      // Show loading state
      setIsTrackingLocation(true);

      try {
        // Start live location tracking
        if (socket && isConnected) {
          console.log("[TRACKING] Starting live tracking...");

          // Join tracking room
          const phoneNumber = await AsyncStorage.getItem("phoneNumber");
          if (phoneNumber) {
            socket.emit("join", {
              phoneNumber,
              travelId: ride.travelId,
              consignmentId: ride.consignmentId,
            });
            console.log("[TRACKING] Joined tracking room");
          }

          // Set up location update handler
          const locationHandler = (locationData) => {
            console.log("[TRACKING] Received location update:", locationData);
            if (
              locationData &&
              locationData.latitude &&
              locationData.longitude
            ) {
              const newCoords = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              };

              // Update driver coordinates
              setDriverCoords(newCoords);

              // Fetch new route to destination
              if (destinationCoords) {
                fetchDriverToDestinationRoute(newCoords, destinationCoords);
              }

              // Focus map on driver's location
              if (mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: newCoords.latitude,
                    longitude: newCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  1000
                );
              }
            }
          };

          // Listen for location updates
          socket.on("riderLocationUpdate", locationHandler);

          // Store handler reference for cleanup
          locationUpdateHandlerRef.current = locationHandler;

          // Update tracking state
          setTrackingState((prev) => ({
            ...prev,
            isActive: true,
            error: null,
            lastUpdate: new Date(),
          }));

          // If we already have driver coordinates, focus on them
          if (driverCoords) {
            mapRef.current.animateToRegion(
              {
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000
            );
          } else {
            Alert.alert(
              "Location Unavailable",
              "Waiting for rider's location. The map will update automatically when location data is available."
            );
          }
        } else {
          throw new Error("Socket not connected");
        }
      } catch (error) {
        console.error("[TRACKING] Error starting live tracking:", error);
        Alert.alert(
          "Error",
          "There was a problem starting live tracking. Please try again."
        );
      } finally {
        setIsTrackingLocation(false);
      }
    } else {
      Alert.alert(
        "Rider Location Unavailable",
        "The rider's current location is only available when the consignment is on the way."
      );
    }
  };

  const openRatingModal = () => {
    setRatingModalVisible(true);
  };

  const handleRatingSelection = (rating) => {
    setSelectedRating(rating);
    setTimeout(() => {
      setRatingModalVisible(false);
      setFeedbackModalVisible(true);
    }, 300);
  };

  const handleFeedbackSelection = (feedback) => {
    if (selectedFeedback.includes(feedback)) {
      setSelectedFeedback(selectedFeedback.filter((item) => item !== feedback));
    } else {
      setSelectedFeedback([...selectedFeedback, feedback]);
    }
  };

  const handleSubmitRating = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      const tPhoneNumber = ride?.tphoneNumber;
      console.log("tPhoneNumber", tPhoneNumber)
      if (!tPhoneNumber) {
        Alert.alert(
          "Error",
          "Unable to find your phone number. Please login again."
        );
        return;
      }

      // Ensure rating is a number
      const numericRating = Number(selectedRating);

      if (isNaN(numericRating)) {
        Alert.alert("Error", "Please select a valid rating");
        return;
      }

      const ratingData = {
        message:
          feedbackText || selectedFeedback.join(", ") || "No feedback provided",
        rate: numericRating, // Ensure this is a number
        consignmentId: ride.consignmentId,
        tPhoneNumber: tPhoneNumber,
      };

      console.log("Submitting rating:", ratingData);
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const response = await fetch(
        `${baseurl}api/rating/${phoneNumber}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ratingData),
        }
      );

      const result = await response.json();
      console.log("Rating submission response:", result);

      if (response.ok) {   
        try {
          const ratedConsignments =
            (await AsyncStorage.getItem("ratedConsignments")) || "[]";
          const ratedList = JSON.parse(ratedConsignments);

          if (!ratedList.includes(ride.consignmentId || ride._id)) {
            ratedList.push(ride.consignmentId || ride._id);
            await AsyncStorage.setItem(
              "ratedConsignments",
              JSON.stringify(ratedList)
            );
          }

          ride.isRating = "done";

          Alert.alert(
            "Success",
            "Your rating has been submitted. Thank you for your feedback!"
          );
        } catch (error) {
          console.error("Error updating local rating status:", error);
        }
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to submit rating. Please try again."
        );
      }

      setFeedbackModalVisible(false);
      setSelectedRating(null);
      setSelectedFeedback([]);
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert(
        "Error",
        "Failed to submit your rating. Please try again later."
      );
    }
  };

  // Effect to cleanup tracking resources on unmount
  useEffect(() => {
    return () => {
      // Clean up any tracking resources
      if (movementInterval) {
        clearInterval(movementInterval);
      }
    };
  }, [movementInterval]);

  // Enhanced pulsating animation for live tracking indicator
  useEffect(() => {
    if (status === "on the way" && driverCoords) {
      // Create a sequence of animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when not tracking
      pulseAnim.setValue(1);
    }

    return () => {
      // Clean up animation on unmount
      pulseAnim.stopAnimation();
    };
  }, [status, driverCoords, pulseAnim]);

  // Add this new function after the existing useEffect hooks and before the fetchRoute function
  const startLiveLocationTracking = async () => {
    try {
      if (!ride.travelId || !ride.phoneNumber) {
        console.log("[API] Missing travelId or phoneNumber for live tracking");
        return;
      }

      setIsTrackingLocation(true);
      console.log(
        `[API] Starting live location tracking for travelId: ${ride.travelId}, phoneNumber: ${ride.phoneNumber}`
      );

      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const response = await fetch(
        `${baseurl}track-rider/${ride.travelId}/${ride.phoneNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("[API] Live tracking API response:", data);

      if (response.ok) {
        console.log("[API] Live location tracking started successfully");
        // Update driver coordinates immediately if location data is available
        if (data.latitude && data.longitude) {
          setDriverCoords({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      } else {
        console.error("[API] Failed to start live tracking:", data.message);
        // Don't show alert for every failed request to avoid spam
        if (data.message && !data.message.includes("Invalid location data")) {
          console.warn("[API] Live tracking warning:", data.message);
        }
      }
    } catch (error) {
      console.error("[API] Error starting live location tracking:", error);
      // Only log errors, don't show alerts to avoid interrupting user experience
    } finally {
      setIsTrackingLocation(false);
    }
  };

  // Enhanced cleanup function
  const cleanupTracking = () => {
    console.log("[TRACKING] Cleaning up tracking resources...");

    if (socket) {
      // Remove location update listener
      if (locationUpdateHandlerRef.current) {
        socket.off("riderLocationUpdate", locationUpdateHandlerRef.current);
        locationUpdateHandlerRef.current = null;
      }

      // Leave tracking room
      socket.emit("leave", ride.travelId);
      console.log("[TRACKING] Left tracking room");
    }

    // Clear tracking state
    setTrackingState((prev) => ({
      ...prev,
      isActive: false,
      error: null,
    }));
  };

  // Enhanced startLiveTracking function
  const startLiveTracking = async () => {
    try {
      if (!socket || !isConnected) {
        setTrackingState((prev) => ({
          ...prev,
          error: "Socket connection not available",
          isActive: false,
        }));
        return;
      }

      if (!ride.consignmentId) {
        setTrackingState((prev) => ({
          ...prev,
          error: "Invalid consignment ID",
          isActive: false,
        }));
        return;
      }

      // Clean up any existing tracking first
      await cleanupTracking();

      // Join the tracking room
      socket.emit("joinTracking", { consignmentId: ride.consignmentId });

      // Create and store the location update handler
      locationUpdateHandlerRef.current = (locationData) => {
        if (locationData && locationData.consignmentId === ride.consignmentId) {
          setDriverCoords({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
          setTrackingState((prev) => ({
            ...prev,
            lastUpdate: new Date(),
            error: null,
          }));

          // Animate map to new location
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500
            );
          }
        }
      };

      // Listen for location updates
      socket.on("riderLocationUpdate", locationUpdateHandlerRef.current);

      // Start periodic location updates
      trackingIntervalRef.current = setInterval(async () => {
        try {
          const baseurl = await AsyncStorage.getItem("apiBaseUrl");
          const response = await fetch(
            `${baseurl}track-rider/${ride.travelId}/${ride.phoneNumber}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch location update");
          }

          const data = await response.json();
          if (data.latitude && data.longitude) {
            console.log("[API] Periodic location update received:", data);
            setDriverCoords({
              latitude: data.latitude,
              longitude: data.longitude,
            });
            setTrackingState((prev) => ({
              ...prev,
              lastUpdate: new Date(),
              error: null,
              retryCount: 0,
            }));
          }
        } catch (error) {
          console.error("[API] Error fetching location update:", error);
          setTrackingState((prev) => ({
            ...prev,
            error: "Failed to update location",
            retryCount: prev.retryCount + 1,
          }));
        }
      }, 5000);

      setTrackingState((prev) => ({
        ...prev,
        isActive: true,
        error: null,
      }));

      // Store tracking state in AsyncStorage
      await AsyncStorage.setItem(
        `tracking_${ride.consignmentId}`,
        JSON.stringify({
          travelId: ride.travelId,
          consignmentId: ride.consignmentId,
          startTime: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Error starting tracking:", error);
      setTrackingState((prev) => ({
        ...prev,
        error: error.message,
        isActive: false,
      }));
    }
  };

  // Handle socket connection status changes
  useEffect(() => {
    if (!isConnected && trackingState.isActive) {
      setTrackingState((prev) => ({
        ...prev,
        error: "Lost connection to tracking server",
        isActive: false,
      }));
      cleanupTracking();
    } else if (
      isConnected &&
      status === "on the way" &&
      !trackingState.isActive
    ) {
      startLiveTracking();
    }
  }, [isConnected]);

  // Add tracking status display to the UI
  const renderTrackingStatus = () => {
    if (!trackingState.isActive) return null;

    return (
      <View style={styles.trackingStatusContainer}>
        <Text style={styles.trackingStatusText}>
          {trackingState.error ? "Tracking Error" : "Live Tracking Active"}
        </Text>
        {trackingState.lastUpdate && (
          <Text style={styles.lastUpdatedText}>
            Last updated:{" "}
            {new Date(trackingState.lastUpdate).toLocaleTimeString()}
          </Text>
        )}
        {trackingState.error && (
          <Text style={styles.errorText}>{trackingState.error}</Text>
        )}
      </View>
    );
  };

  // Add this new function to fetch route between driver and destination
  const fetchDriverToDestinationRoute = async (
    driverCoords,
    destinationCoords
  ) => {
    try {
      console.log("[ROUTE] Fetching route from driver to destination:", {
        driver: driverCoords,
        destination: destinationCoords,
      });

      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverCoords.latitude},${driverCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

      console.log("[ROUTE] API URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("[ROUTE] API Response:", data);

      if (data.routes && data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
        console.log("[ROUTE] Decoded coordinates:", decodedCoordinates);
        setDriverToDestinationRoute(decodedCoordinates);
      } else {
        console.warn("[ROUTE] No routes found in response");
      }
    } catch (error) {
      console.error(
        "[ROUTE] Error fetching driver to destination route:",
        error
      );
    }
  };

  // Add effect to fetch initial route when status changes to "on the way"
  useEffect(() => {
    if (status === "on the way" && driverCoords && destinationCoords) {
      console.log(
        "[EFFECT] Status changed to on the way, fetching initial route"
      );
      fetchDriverToDestinationRoute(driverCoords, destinationCoords);
    }
  }, [status, driverCoords, destinationCoords]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRatingModalVisible(false)}
            >
              <Icon name="times" size={20} color="#000" />
            </TouchableOpacity>

            <Image
              source={{
                uri: travelerProfilePic,
              }}
              style={styles.modalProfileImage}
            />

            <Text style={styles.ratingTitle}>
              How was your service experience?
            </Text>

            <View style={styles.ratingContainer}>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingBox,
                    selectedRating >= rating && { backgroundColor: "#0C9D5C" },
                  ]}
                  onPress={() => handleRatingSelection(rating)}
                >
                  <Text
                    style={[
                      styles.ratingBoxText,
                      selectedRating >= rating
                        ? { color: "white" }
                        : { color: "black" },
                    ]}
                  >
                    {rating === 5 ? "5" : rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ratingLabelsContainer}>
              <Text style={styles.ratingLabel}>Poor</Text>
              <Text style={styles.ratingLabel}>Excellent</Text>
            </View>

            <View style={styles.bottomIndicator} />
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Icon name="times" size={20} color="#000" />
              </TouchableOpacity>

              <Text style={styles.ratingTitle}>
                How was your service experience?
              </Text>

              <View style={styles.ratingContainer}>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor:
                          rating <= selectedRating ? "#0C9D5C" : "#e0e0e0",
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        borderWidth: 0,
                      },
                    ]}
                    disabled={true}
                  >
                    <Text style={[styles.ratingButtonText, { color: "white" }]}>
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.ratingLabelsContainer}>
                <Text style={styles.ratingLabel}>Poor</Text>
                <Text style={styles.ratingLabel}>Excellent</Text>
              </View>

              <View style={styles.separator} />

              <Text style={styles.feedbackTitle}>
                What could have been better?
              </Text>

              <View style={styles.feedbackOptionsContainer}>
                {[
                  "Late delivery",
                  "Poor communication",
                  "Packaging issues",
                  "Item condition",
                ].map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.feedbackOption}
                    onPress={() => handleFeedbackSelection(option)}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        selectedFeedback.includes(option) && {
                          borderColor: "#2B8DFF",
                        },
                      ]}
                    >
                      {selectedFeedback.includes(option) && (
                        <View style={styles.radioButtonSelected}>
                          <Icon name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.feedbackOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.feedbackInput}
                placeholder="Write your feedback in detail"
                placeholderTextColor="#aaa"
                multiline={true}
                value={feedbackText}
                onChangeText={setFeedbackText}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitRating}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>

              <View style={styles.bottomIndicator} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Image Modal for Zoomed View */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
          
          {getCurrentImages().length > 0 && (
            <Image
              source={{ 
                uri: typeof getCurrentImages()[selectedImageIndex] === 'string' 
                  ? getCurrentImages()[selectedImageIndex] 
                  : getCurrentImages()[selectedImageIndex]?.uri 
              }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          
          {/* Image navigation */}
          {getCurrentImages().length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={previousImage}
              >
                <Icon name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {getCurrentImages().length}
              </Text>
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={nextImage}
              >
                <Icon name="chevron-right" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Header title="Track Your Consignment" navigation={navigation} />

      <ScrollView>
        {status === "Upcoming" && (
          <View style={styles.upcomingMessageContainer}>
            <View style={styles.upcomingMessage}>
              <Icon name="clock-o" size={24} color="#FF6B35" />
              <Text style={styles.upcomingMessageText}>
                Your consignment is pending acceptance. You'll be notified once a traveler accepts it.
              </Text>
            </View>
          </View>
        )}
        
        {status === "Accepted" && (
          <View style={styles.acceptedMessageContainer}>
            <View style={styles.acceptedMessage}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.acceptedMessageText}>
                Your consignment has been accepted! The traveler will collect it soon.
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.mapContainer}>
          {/* Dashed line overlay background */}
          <View style={styles.dashedLineOverlay} />
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: originCoords ? originCoords.latitude : 28.7041,
              longitude: originCoords ? originCoords.longitude : 77.1025,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Show curved flight-style route */}
            {curvedLinePoints.length > 0 && (
              <Polyline
                coordinates={curvedLinePoints}
                strokeColor="rgba(0,0,255,0.6)"
                strokeWidth={2}
                lineDashPattern={[5, 5]}
              />
            )}

            {/* Show current route when journey has started */}
            {status === "on the way" && driverToDestinationRoute.length > 0 && (
              <Polyline
                coordinates={driverToDestinationRoute}
                strokeColor="rgba(255, 0, 0, 0.3)"
                strokeWidth={2}
                lineDashPattern={[10, 5]}
                zIndex={1}
              />
            )}

            {/* Origin marker */}
            {originCoords && (
              <Marker coordinate={originCoords} title="Pickup">
                <View style={[styles.marker, styles.startMarker]}>
                  <Icon name="map-marker" size={20} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Destination marker */}
            {destinationCoords && (
              <Marker coordinate={destinationCoords} title="Destination">
                <View style={[styles.marker, styles.endMarker]}>
                  <Icon name="flag" size={20} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Driver marker - only show when journey has started */}
            {driverCoords && status === "on the way" && (
              <Marker coordinate={driverCoords} title="Driver">
                <View style={[styles.marker, styles.driverMarker]}>
                  <View style={styles.carIconContainer}>
                    <Icon name="car" size={18} color="#fff" />
                  </View>
                  <View style={styles.driverMarkerDot} />
                </View>
              </Marker>
            )}
          </MapView>

          {renderTrackingStatus()}

          {status === "on the way" && (
            <TouchableOpacity
              style={styles.getDirectionButton}
              onPress={handleGetDirection}
            >
              <Text style={styles.getDirectionText}>Get Direction</Text>
            </TouchableOpacity>
          )}

          {driverCoords && status === "on the way" && (
            <View style={styles.liveTrackingIndicator}>
              <Animated.View
                style={[
                  styles.pulsatingDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.liveTrackingText}>
                {isTrackingLocation ? "Updating..." : "Live Tracking"}
              </Text>
              <Icon
                name="car"
                size={14}
                color="#fff"
                style={{ marginLeft: 5 }}
              />
            </View>
          )}
        </View>
        <View style={styles.card1}>
          <View style={styles.infoRow1}>
            <Text
              style={{
                fontSize: responsiveFontSize.xl,
                fontWeight: "bold",
                marginRight: scale(10),
                marginTop: verticalScale(5),
                color: "#000"
              }}
            >
              {status}
            </Text>

            <View style={styles.greenBox}>
              <Text
                style={{
                  fontSize: responsiveFontSize.xl,
                  fontWeight: "bold",
                  color: "white",
                  letterSpacing: scale(5),
                }}
              >
                {status !== "Delivered" && status !== "Upcoming" &&
                  (status === "on the way" ? 
                    (rotp && rotp !== "N/A" ? rotp : "") : 
                    (otp && otp !== "N/A" ? otp : "")
                  )}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.card1}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <View style={styles.locationContent}>
              <Text style={styles.locationCity}>
                {ride.startCity || extractCityFromAddress(consignmentDetails?.fullstartinglocation) || "Starting City"}
              </Text>
              <Text style={styles.locationText}>
                {consignmentDetails?.fullstartinglocation || ride.startinglocation || "Starting Location"}
              </Text>
            </View>
          </View>

          <View style={commonStyles.verticalseparator}></View>
          <View style={commonStyles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <View style={styles.locationContent}>
              <Text style={styles.locationCity}>
                {ride.destCity || extractCityFromAddress(consignmentDetails?.fullgoinglocation) || "Destination City"}
              </Text>
              <Text style={styles.locationText}>
                {consignmentDetails?.fullgoinglocation || ride.goinglocation || "Destination Location"}
              </Text>
            </View>
          </View>
        </View>

        {/* Consignment Details */}
        <View style={styles.card}>
          <Text style={styles.infoTitle}>Consignment Details</Text>
          
          {loadingConsignment ? (
            <Text style={styles.loadingText}>Loading consignment details...</Text>
          ) : (
            <>
              {/* Description */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>
                  {consignmentDetails?.Description || consignmentDetails?.description || ride.Description || ride.description || "No description available"}
                </Text>
              </View>

              {/* Images */}
              {(consignmentDetails?.images || ride.images) && (consignmentDetails?.images?.length > 0 || ride.images?.length > 0) && (
                <View style={styles.imageSection}>
                  <Text style={styles.detailLabel}>Images:</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.imageScroll}
                    contentContainerStyle={styles.imageScrollContent}
                  >
                    {(consignmentDetails?.images || ride.images).map((image, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => openImageModal(index)}
                        style={styles.imageContainer}
                      >
                        <Image
                          source={{ uri: typeof image === 'string' ? image : image.uri }}
                          style={styles.consignmentImage}
                        />
                        <View style={styles.imageOverlay}>
                          <Icon name="search-plus" size={16} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Weight */}
              {(consignmentDetails?.weight || ride.weight) && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconRow}>
                    <Image source={require("../../../Images/weight.png")} style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Weight:</Text>
                  </View>
                  <Text style={styles.detailValue}>{consignmentDetails?.weight || ride.weight} Kg</Text>
                </View>
              )}

              {/* Dimensions */}
              {(consignmentDetails?.dimensions || ride.dimensions) && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconRow}>
                    <Image source={require("../../../Images/dimension.png")} style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Dimensions:</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const dimensions = consignmentDetails?.dimensions || ride.dimensions;
                      if (typeof dimensions === 'object') {
                        return `${dimensions.length || 'N/A'} × ${dimensions.breadth || 'N/A'} × ${dimensions.height || 'N/A'} ${dimensions.unit || 'cm'}`;
                      }
                      return dimensions;
                    })()}
                  </Text>
                </View>
              )}

              {/* Category */}
              {(consignmentDetails?.category || ride.category) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>
                    {consignmentDetails?.category || ride.category}
                  </Text>
                </View>
              )}

              {/* Handle with Care */}
              {(consignmentDetails?.handleWithCare !== undefined || ride.handleWithCare !== undefined) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Handle with Care:</Text>
                  <Text style={styles.detailValue}>
                    {(consignmentDetails?.handleWithCare !== undefined ? consignmentDetails.handleWithCare : ride.handleWithCare) ? "Yes" : "No"}
                  </Text>
                </View>
              )}

              {/* Special Request */}
              {(consignmentDetails?.specialRequest || ride.specialRequest) && (consignmentDetails?.specialRequest !== "None" && ride.specialRequest !== "None") && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Special Request:</Text>
                  <Text style={styles.detailValue}>
                    {consignmentDetails?.specialRequest || ride.specialRequest}
                  </Text>
                </View>
              )}

              {/* Date of Sending */}
              {consignmentDetails?.dateOfSending && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of Sending:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(consignmentDetails.dateOfSending).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Duration at End Point */}
              {consignmentDetails?.durationAtEndPoint && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration at End Point:</Text>
                  <Text style={styles.detailValue}>
                    {consignmentDetails.durationAtEndPoint}
                  </Text>
                </View>
              )}

              {/* Receiver Name */}
              {consignmentDetails?.recievername && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receiver Name:</Text>
                  <Text style={styles.detailValue}>
                    {consignmentDetails.recievername}
                  </Text>
                </View>
              )}

              {/* Receiver Phone */}
              {consignmentDetails?.recieverphone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receiver Phone:</Text>
                  <Text style={styles.detailValue}>
                    {consignmentDetails.recieverphone}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {Array.isArray(ride.traveldetails) && ride.traveldetails.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.infoTitle}>Traveler Details</Text>
            <View style={styles.traveler}>
              <Image
                source={{
                  uri: ride.traveldetails[0]?.profilePicture || "https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg",
                }}
                style={styles.profileImage}
              />
              <View style={styles.travelerDetails}>
                <Text style={styles.travelerName}>
                  {ride.travellername || "N/A"}
                </Text>
                <Text style={styles.travelerRating}>
                  ⭐ {ride.traveldetails[0].rating} (
                  {ride.traveldetails[0].totalrating} ratings)
                </Text>
              </View>
            </View>

            {ride.travelmode && (
              <>
                <View style={commonStyles.staraightSeparator} />
                <View style={styles.traveler}>
                  <View style={styles.iconContainer1}>
                    {getTravelIcon(ride.travelmode)}
                  </View>
                  <View style={styles.travelerDetails}>
                    <Text style={[styles.travelerName, { marginLeft: scale(15) }]}>
                      {ride.travelmode === "roadways" ? (ride.vehicleType || "Car") : ride.travelmode}
                    </Text>
                    {/* {ride.travelmode === "roadways" && ride.vehicleType && (
                      <Text style={[styles.travelerName, { marginLeft: scale(15), fontSize: responsiveFontSize.sm, color: "#666" }]}>
                        Vehicle Type
                      </Text>
                    )} */}
                    {ride.travelmode !== "roadways" && ride.travelmode_number && (
                      <Text style={[styles.travelerName, { marginLeft: scale(15) }]}>
                        {ride.travelmode_number}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}

            <View style={commonStyles.staraightSeparator} />
            <View style={styles.otherInfo}>
              <View style={styles.infoBlock}>
                <View style={[styles.infoRow, { marginTop: verticalScale(20) }]}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: "#53B175" },
                    ]}
                  >
                    <Icon name="phone" size={15} color="white" />
                  </View>
                  <Text style={styles.phoneNumber}>
                    {ride.traveldetails?.[0]?.phoneNumber || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {status !== "Yet To Collect" && status !== "Upcoming" && (
          <View style={styles.card}>
            {/* Step 1: Collected */}
            <View>
              <View style={styles.locationRow}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: "#0B8043", // Always collected at this point
                    },
                  ]}
                >
                  <Icon name="check" size={15} color="white" />
                </View>
                <Text style={styles.locationText}>Collected</Text>
                <View
                  style={{
                    alignItems: "flex-end",
                    position: "absolute",
                    right: 10,
                  }}
                >
                  <Text style={[styles.callNowText, { textAlign: "right" }]}>
                    {pickupTime ? formatTimeLocal(pickupTime) : ""}
                  </Text>
                  {pickupTime &&
                    typeof pickupTime === "object" &&
                    pickupTime.date && (
                      <Text
                        style={[
                          styles.callNowText,
                          { fontSize: fontScale(11), color: "#555", textAlign: "right" },
                        ]}
                      >
                        {formatDateLocal(pickupTime)}
                      </Text>
                    )}
                </View>
              </View>
              <View
                style={[
                  commonStyles.verticalseparator,
                  { marginTop: 5, marginLeft: 8 },
                ]}
              />
            </View>
            {/* Step 2: On the Way - Only show if not yet delivered */}
            {status === "on the way" && (
              <>
                <View style={styles.locationRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: "#FFC107" },
                    ]}
                  >
                    <Ionicons name="time-outline" size={20} color="white" />
                  </View>
                  <Text style={styles.locationText}>On the way</Text>
                  <View
                    style={{
                      alignItems: "flex-end",
                      position: "absolute",
                      right: 10,
                    }}
                  >
                                      <Text style={[styles.callNowText, { textAlign: "right" }]}>
                    {onTheWayTime ? formatTimeLocal(onTheWayTime) : ""}
                  </Text>
                  {onTheWayTime &&
                    typeof onTheWayTime === "object" &&
                    onTheWayTime.date && (
                      <Text
                        style={[
                          styles.callNowText,
                          { fontSize: fontScale(11), color: "#555", textAlign: "right" },
                        ]}
                      >
                        {formatDateLocal(onTheWayTime)}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    commonStyles.verticalseparator,
                    { marginTop: 5, marginLeft: 8 },
                  ]}
                />
              </>
            )}
            {/* Step 3: Delivered */}
            <View>
              <View style={styles.locationRow}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        status === "Delivered" ? "#0B8043" : "#28A745",
                    },
                  ]}
                >
                  {status === "Delivered" ? (
                    <Icon name="check" size={15} color="white" />
                  ) : (
                    <Ionicons name="time-outline" size={20} color="white" />
                  )}
                </View>
                <Text style={styles.locationText}>Delivered</Text>
                <View
                  style={{
                    alignItems: "flex-end",
                    position: "absolute",
                    right: 10,
                  }}
                >
                  <Text style={[styles.callNowText, { textAlign: "right" }]}>
                    {status === "Delivered" && dropTime
                      ? formatTimeLocal(dropTime)
                      : ""}
                  </Text>
                  {status === "Delivered" &&
                    dropTime &&
                    typeof dropTime === "object" &&
                    dropTime.date && (
                      <Text
                        style={[
                          styles.callNowText,
                          { fontSize: fontScale(11), color: "#555", textAlign: "right" },
                        ]}
                      >
                        {formatDateLocal(dropTime)}
                      </Text>
                    )}
                </View>
              </View>
            </View>
          </View>
        )}
        <RBSheet
          ref={bottomSheetRef}
          height={700}
          openDuration={250}
          customStyles={{
            container: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            },
          }}
        >
          <RatingDetails
            earning={ride.expectedearning}
            id={ride.rideId || ride._id}
          />
        </RBSheet>
      </ScrollView>
    </SafeAreaView>
  );
};

// Add this to your App.js or main component
const restoreActiveTracking = async () => {
  try {
    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();

    // Filter tracking keys
    const trackingKeys = keys.filter((key) => key.startsWith("tracking_"));

    // Restore each active tracking
    for (const key of trackingKeys) {
      const trackingData = JSON.parse(await AsyncStorage.getItem(key));
      if (trackingData && trackingData.travelId) {
        // Re-initialize tracking for this consignment
        const consignmentId = key.replace("tracking_", "");
        startLocationTracking(trackingData.travelId, consignmentId);
      }
    }
  } catch (error) {
    console.error("Error restoring tracking:", error);
  }
};

// Responsive styles using centralized responsive utilities
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mapContainer: {
    marginVertical: 0,
    position: "relative",
  },
  map: {
    width: "100%",
    height: verticalScale(298), // 35% of base height (852 * 0.35)
    objectFit: "cover",
  },
  getDirectionButton: {
    position: "absolute",
    bottom: verticalScale(20),
    right: scale(20),
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateVerticalScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: scale(12),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  getDirectionText: {
    color: "#007AFF",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    margin: moderateScale(15),
    borderRadius: scale(16),
    padding: moderateScale(20),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  card1: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: moderateScale(15),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
    paddingRight: scale(80),
    position: "relative",
  },
  locationText: {
    fontSize: responsiveFontSize.sm,
    color: "#666",
    marginLeft: scale(10),
    fontWeight: "400",
    flex: 1,
    lineHeight: verticalScale(18),
  },
  locationContent: {
    flex: 1,
  },
  locationCity: {
    fontSize: responsiveFontSize.md,
    fontWeight: "600",
    color: "#333",
    marginLeft: scale(10),
    marginBottom: verticalScale(2),
  },
  innerlocationText: {
    fontSize: responsiveFontSize.md,
    color: "#666",
    marginLeft: scale(10),
    fontWeight: "400",
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: verticalScale(10),
    alignItems: "center",
  },
  infoRow1: {
    flexDirection: "row",
    marginVertical: verticalScale(10),
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneNumber: {
    fontSize: responsiveFontSize.md,
    color: "#333",
    fontWeight: "600",
    marginLeft: scale(10),
    marginTop: verticalScale(5),
  },
  infoTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: "bold",
    marginBottom: verticalScale(20),
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(15),
  },
  profileImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: scale(15),
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  travelerRating: {
    fontSize: responsiveFontSize.md,
    color: "#666",
    marginTop: verticalScale(4),
  },
  marker: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "#4CAF50",
  },
  endMarker: {
    backgroundColor: "#F44336",
  },
  driverMarker: {
    backgroundColor: "#D83F3F",
    borderWidth: 2,
    borderColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  carIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#D83F3F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  driverMarkerDot: {
    position: "absolute",
    bottom: -verticalScale(4),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#D83F3F",
    borderWidth: 1,
    borderColor: "white",
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
  greenBox: {
    backgroundColor: "#53B175",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    position: "absolute",
    right: scale(10),
    top: 0,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  otpLabel: {
    color: "white",
    fontSize: responsiveFontSize.xs,
    fontWeight: "bold",
    marginBottom: verticalScale(2),
  },
  iconContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer1: {
    width: scale(40),
    height: verticalScale(35),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  callNowText: {
    color: "#333",
    fontSize: responsiveFontSize.sm,
    fontWeight: "500",
    textAlign: "right",
    maxWidth: scale(150),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalScrollView: {
    flex: 1,
    maxHeight: verticalScale(682), // 80% of base height (852 * 0.8)
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: moderateScale(20),
    paddingBottom: verticalScale(40),
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: scale(10),
  },
  modalProfileImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    marginVertical: verticalScale(20),
  },
  ratingTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: "bold",
    marginBottom: verticalScale(25),
    color: "#1a1a1a",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: verticalScale(15),
    width: "90%",
  },
  ratingButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    marginHorizontal: scale(4),
    marginVertical: verticalScale(4),
    backgroundColor: "#0C9D5C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
  },
  ratingButtonText: {
    fontSize: responsiveFontSize.md,
    color: "white",
    fontWeight: "600",
  },
  ratingLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginTop: verticalScale(15),
  },
  ratingLabel: {
    color: "#666",
    fontSize: responsiveFontSize.lg,
    fontWeight: "500",
  },
  openModalButton: {
    backgroundColor: "#53B175",
    padding: scale(18),
    borderRadius: scale(12),
    alignItems: "center",
    margin: scale(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  openModalText: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
  feedbackTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: verticalScale(20),
    color: "#1a1a1a",
  },
  feedbackOptionsContainer: {
    width: "100%",
    marginBottom: verticalScale(25),
  },
  feedbackOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(18),
  },
  radioButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(18),
  },
  radioButtonSelected: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "#2B8DFF",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackOptionText: {
    fontSize: responsiveFontSize.lg,
    color: "#333",
  },
  feedbackInput: {
    width: "100%",
    height: verticalScale(100),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: scale(12),
    marginTop: verticalScale(15),
    padding: scale(15),
    textAlignVertical: "top",
    fontSize: responsiveFontSize.md,
    backgroundColor: "#f8f9fa",
  },
  submitButton: {
    backgroundColor: "#E94B4B",
    width: "100%",
    paddingVertical: verticalScale(18),
    borderRadius: scale(12),
    marginTop: verticalScale(25),
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
  bottomIndicator: {
    width: scale(100),
    height: verticalScale(5),
    backgroundColor: "#ddd",
    borderRadius: scale(3),
    marginTop: verticalScale(30),
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    width: "100%",
    marginVertical: verticalScale(20),
  },
  ratingBox: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(8),
    marginHorizontal: scale(4),
    marginVertical: verticalScale(4),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0C9D5C",
  },
  ratingBoxText: {
    fontSize: responsiveFontSize.md,
    fontWeight: "600",
    color: "#333",
  },
  liveTrackingIndicator: {
    position: "absolute",
    top: verticalScale(15),
    left: scale(15),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    borderRadius: scale(25),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pulsatingDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "#00FF00",
    marginRight: scale(8),
  },
  liveTrackingText: {
    color: "white",
    fontWeight: "bold",
    fontSize: responsiveFontSize.sm,
  },
  riderMarkerContainer: {
    backgroundColor: "white",
    padding: scale(10),
    borderRadius: scale(25),
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  trackingStatusContainer: {
    position: "absolute",
    bottom: verticalScale(15),
    left: scale(15),
    right: scale(15),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: moderateScale(15),
    borderRadius: scale(12),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  trackingStatusText: {
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color: "#333",
  },
  lastUpdatedText: {
    fontSize: responsiveFontSize.sm,
    color: "#666",
    marginTop: verticalScale(6),
  },
  errorText: {
    color: "#F44336",
    fontSize: responsiveFontSize.sm,
    marginTop: verticalScale(6),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: responsiveFontSize.md,
    fontWeight: "600",
    color: "#333",
    marginRight: scale(15),
    flex: 1,
  },
  detailValue: {
    fontSize: responsiveFontSize.md,
    color: "#666",
    flex: 2,
    textAlign: "right",
    lineHeight: verticalScale(20),
  },
  detailIconRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: scale(8),
  },
  imageSection: {
    marginBottom: verticalScale(25),
  },
  imageScroll: {
    height: verticalScale(100),
    marginTop: verticalScale(10),
  },
  imageScrollContent: {
    paddingHorizontal: scale(5),
  },
  imageContainer: {
    marginRight: scale(12),
    position: "relative",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(8),
    opacity: 0,
  },
  consignmentImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  loadingText: {
    fontSize: responsiveFontSize.lg,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalCloseButton: {
    position: "absolute",
    top: verticalScale(50),
    right: scale(20),
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: scale(25),
    padding: scale(12),
    width: scale(50),
    height: scale(50),
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: screenWidth,
    height: verticalScale(682), // 80% of base height (852 * 0.8)
  },
  imageNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(20),
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageCounter: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
  upcomingMessageContainer: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: moderateScale(15),
    marginTop: verticalScale(15),
    borderRadius: scale(12),
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  upcomingMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(15),
  },
  upcomingMessageText: {
    fontSize: responsiveFontSize.md,
    color: "#E65100",
    marginLeft: scale(12),
    flex: 1,
    lineHeight: verticalScale(20),
  },
  acceptedMessageContainer: {
    backgroundColor: "#E8F5E8",
    marginHorizontal: moderateScale(15),
    marginTop: verticalScale(15),
    borderRadius: scale(12),
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  acceptedMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(15),
  },
  acceptedMessageText: {
    fontSize: responsiveFontSize.md,
    color: "#2E7D32",
    marginLeft: scale(12),
    flex: 1,
    lineHeight: verticalScale(20),
  },

  dashedLineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 0,
    pointerEvents: "none",
  },
});

export default TravelDetails;
