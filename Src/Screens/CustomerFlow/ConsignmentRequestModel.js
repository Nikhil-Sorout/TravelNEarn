import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
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

const { width, height } = Dimensions.get("window");

const ConsignmentRequestModel = ({
  route,
  selectedConsignment,
  searchStatus,
  onSearch,
  onClose,
  onAccept,
  onReject,
  phoneNumber,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [consignmentDetails, setConsignmentDetails] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  console.log("selectedConsignment :", selectedConsignment)
  // Function to fetch distance and duration from Google Maps Directions API
  const fetchDistanceAndDuration = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc"; // Replace with your API key
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      // console.log("Google Maps API response:", JSON.stringify(data, null, 2));

      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0].legs[0];
        const distance = route.distance.text; // e.g., "12.5 km"
        const duration = route.duration.text; // e.g., "25 mins"
        return { distance, duration };
      } else {
        throw new Error("No routes found or invalid response");
      }
    } catch (error) {
      console.error("Error fetching distance and duration:", error.message);
      return { distance: "Not Available", duration: "Unknown" };
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
    const images = consignmentDetails?.images || [];
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    const images = consignmentDetails?.images || [];
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getCurrentImages = () => {
    return consignmentDetails?.images || [];
  };

  useEffect(() => {
    const loadConsignmentDetails = async () => {
      let details = null;

      if (selectedConsignment) {
        // Modal mode: Use selectedConsignment and fetch data using consignmentId
        const consignmentId = selectedConsignment.consignmentId;
        if (!consignmentId) {
          console.error("No consignmentId found in selectedConsignment");
          return;
        }

        try {
          setLoading(true);
          // const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
          // if (!storedPhoneNumber) {
          //   throw new Error("Phone number not found");
          // }

          // console.log(
          //   `Fetching consignment details for ID: ${consignmentId}, Phone: ${storedPhoneNumber}`
          // );
          const baseurl = await AsyncStorage.getItem("apiBaseUrl");
          // const baseurl = "http://192.168.1.30:5002/";
          const response = await fetch(
            `${baseurl}api/consignment/${consignmentId}`
          );
          
          if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            throw new Error(
              `Failed to fetch consignment data: ${response.status}`
            );
          }
          
          const result = await response.json();
          console.log("API response:", JSON.stringify(result, null, 2));

          let consignment = null;
          if (result.consignment) {
            consignment = result.consignment;
          }

          if (consignment) {
            console.log(
              "Found consignment:",
              JSON.stringify(consignment, null, 2)
            );
            
            details = {
              _id: consignment.consignmentId || consignmentId,
              username: consignment.username || selectedConsignment.travellername || "Unknown",
              phoneNumber: consignment.phoneNumber || selectedConsignment.requestedby || "Unknown",
              startinglocation: consignment.startinglocation || selectedConsignment.fromLocation || "Unknown",
              receivername: consignment.recievername || "Unknown",
              receiverphone: consignment.recieverphone || "Unknown",
              goinglocation: consignment.goinglocation || selectedConsignment.toLocation || "Unknown",
              weight: consignment.weight || selectedConsignment.weight || "0",
              dimensions: consignment.dimensions || selectedConsignment.dimensions || {
                length: "0",
                breadth: "0",
                height: "0",
                unit: "cm",
              },
              status: consignment.status || selectedConsignment.status || "Yet to Collect",
              distance: consignment.distance || selectedConsignment.distance || "Not Available",
              duration: consignment.duration || "Unknown",
              expectedEarning: consignment.earning || selectedConsignment.amount || "500",
              description: consignment.Description || selectedConsignment.description || "No description provided",
              handleWithCare: consignment.handleWithCare ? "YES" : "NO",
              specialRequests: consignment.specialRequest || selectedConsignment.specialRequests || "NO",
              date: consignment.dateOfSending || selectedConsignment.dateOfSending || "Not Available",
              travelId: selectedConsignment.travelId || "N/A",
              images: consignment.images || [],
            };

            // Only fetch distance and duration from Google Maps if not already provided by API
            if (
              !consignment.distance &&
              details.startinglocation !== "Unknown" &&
              details.goinglocation !== "Unknown"
            ) {
              const { distance, duration } = await fetchDistanceAndDuration(
                details.startinglocation,
                details.goinglocation
              );
              details.distance = distance;
              details.duration = duration;
            }
          } else {
            console.log(`No consignment found for ID: ${consignmentId}, using selectedConsignment data`);
            // Fallback to selectedConsignment data if API doesn't return the specific consignment
            details = {
              _id: selectedConsignment.consignmentId || "N/A",
              username: selectedConsignment.travellername || "Unknown",
              phoneNumber: selectedConsignment.requestedby || "Unknown",
              startinglocation: selectedConsignment.fromLocation || "Unknown",
              receivername: "Unknown",
              receiverphone: "Unknown",
              goinglocation: selectedConsignment.toLocation || "Unknown",
              weight: selectedConsignment.weight || "0",
              dimensions: selectedConsignment.dimensions || {
                length: "0",
                breadth: "0",
                height: "0",
                unit: "cm",
              },
              status: selectedConsignment.status || "Yet to Collect",
              distance: selectedConsignment.distance || "Not Available",
              duration: "Unknown",
              expectedEarning: selectedConsignment.amount || "500",
              description: selectedConsignment.description || "No description provided",
              handleWithCare: selectedConsignment.handleWithCare || "YES",
              specialRequests: selectedConsignment.specialRequests || "NO",
              date: selectedConsignment.dateOfSending || "Not Available",
              travelId: selectedConsignment.travelId || "N/A",
              images: selectedConsignment.images || [],
            };

            // Fetch distance and duration if locations are valid
            if (
              details.startinglocation !== "Unknown" &&
              details.goinglocation !== "Unknown"
            ) {
              const { distance, duration } = await fetchDistanceAndDuration(
                details.startinglocation,
                details.goinglocation
              );
              details.distance = distance;
              details.duration = duration;
            }
          }

          console.log(
            "Modal mode - Consignment Details:",
            JSON.stringify(details, null, 2)
          );
          setConsignmentDetails(details);
        } catch (error) {
          console.error("Error fetching consignment details:", error.message);
          // Fallback to selectedConsignment data on error
          details = {
            _id: selectedConsignment.consignmentId || "N/A",
            username: selectedConsignment.travellername || "Unknown",
            phoneNumber: selectedConsignment.requestedby || "Unknown",
            startinglocation: selectedConsignment.fromLocation || "Unknown",
            receivername: "Unknown",
            receiverphone: "Unknown",
            goinglocation: selectedConsignment.toLocation || "Unknown",
            weight: selectedConsignment.weight || "0",
            dimensions: selectedConsignment.dimensions || {
              length: "0",
              breadth: "0",
              height: "0",
              unit: "cm",
            },
            status: selectedConsignment.status || "pending",
            distance: selectedConsignment.distance || "Not Available",
            duration: "Unknown",
            expectedEarning: selectedConsignment.amount || "500",
            description: selectedConsignment.description || "No description provided",
            handleWithCare: selectedConsignment.handleWithCare || "YES",
            specialRequests: selectedConsignment.specialRequests || "NO",
            date: selectedConsignment.dateOfSending || "Not Available",
            travelId: selectedConsignment.travelId || "N/A",
            images: selectedConsignment.images || [],
          };

          // Fetch distance and duration if locations are valid
          if (
            details.startinglocation !== "Unknown" &&
            details.goinglocation !== "Unknown"
          ) {
            const { distance, duration } = await fetchDistanceAndDuration(
              details.startinglocation,
              details.goinglocation
            );
            details.distance = distance;
            details.duration = duration;
          }

          setConsignmentDetails(details);
          Alert.alert("Warning", "Failed to fetch updated data, showing available information");
        } finally {
          setLoading(false);
        }
      } else if (route?.params) {
        // Screen mode: Check for rideDetails in route.params or fetch from API
        const { consignmentId, rideDetails = {} } = route.params;
        try {
          setLoading(true);
          const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
          if (!storedPhoneNumber) {
            throw new Error("Phone number not found");
          }

          console.log(
            `Fetching consignment details for ID: ${consignmentId}, Phone: ${storedPhoneNumber}`
          );
          const baseurl = await AsyncStorage.getItem("apiBaseUrl");
          console.log("selectedConsignment", selectedConsignment?.consignmentId)
          const response = await fetch(
            // `https://travel.timestringssystem.com/t/request/${storedPhoneNumber}`
            `${baseurl}t/request/${storedPhoneNumber}`, {
            body: {
              consignmentId: selectedConsignment?.consignmentId
            }
          }
          );
          if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            throw new Error(
              `Failed to fetch consignment data: ${response.status}`
            );
          }
          const result = await response.json();
          console.log("API response:", JSON.stringify(result, null, 2));

          let consignment = null;
          if (Array.isArray(result.requests) && result.requests.length > 0) {
            consignment = result.requests.find(
              (c) => c.consignmentId === consignmentId
            );
          }

          if (consignment) {
            console.log(
              "Found consignment:",
              JSON.stringify(consignment, null, 2)
            );
            let dimensions;
            try {
              dimensions = JSON.parse(
                consignment.dimension
                  .trim()
                  .replace(/'/g, '"')
                  .replace(/\s+/g, " ")
                  .replace(/(\w+):/g, '"$1":')
              );
            } catch (e) {
              console.error(
                "Failed to parse dimension:",
                consignment.dimension
              );
              dimensions = {
                length: "0",
                breadth: "0",
                height: "0",
                unit: "cm",
              };
            }

            details = {
              _id: consignment.consignmentId || consignmentId,
              username:
                consignment.travellername || rideDetails.riderName || "Unknown",
              phoneNumber: consignment.requestedby || "Unknown",
              startinglocation:
                consignment.pickup || rideDetails.starting || "Unknown",
              receivername: "Unknown",
              receiverphone: "Unknown",
              goinglocation: consignment.drop || rideDetails.going || "Unknown",
              weight: consignment.weight || "0",
              dimensions: dimensions,
              status: "Yet to Collect",
              distance:
                consignment.distance || rideDetails.distance || "Not Available",
              duration: "Unknown",
              expectedEarning: consignment.earning || "500",
              description:
                consignment.description ||
                consignment.travelmode ||
                rideDetails.description ||
                "No description provided",
              handleWithCare: "YES",
              specialRequests: "NO",
              date: consignment.date || rideDetails.date || "Not Available",
              travelId: consignment.travelId || rideDetails.travelId || "N/A",
              images: consignment.images || [],
            };

            // Fetch distance and duration if locations are valid
            if (
              details.startinglocation !== "Unknown" &&
              details.goinglocation !== "Unknown"
            ) {
              const { distance, duration } = await fetchDistanceAndDuration(
                details.startinglocation,
                details.goinglocation
              );
              details.distance = distance;
              details.duration = duration;
            }
          } else {
            console.log(`No consignment found for ID: ${consignmentId}`);
            details = {
              _id: consignmentId || rideDetails.consignmentId || "N/A",
              username: rideDetails.riderName || "Unknown",
              phoneNumber: "Unknown",
              startinglocation: rideDetails.starting || "Unknown",
              receivername: "Unknown",
              receiverphone: "Unknown",
              goinglocation: rideDetails.going || "Unknown",
              weight: "0",
              dimensions: {
                length: "0",
                breadth: "0",
                height: "0",
                unit: "cm",
              },
              status: "Yet to Collect",
              distance: rideDetails.distance || "Not Available",
              duration: "Unknown",
              expectedEarning: rideDetails.earning || "500",
              description: rideDetails.description || "No description provided",
              handleWithCare: "YES",
              specialRequests: "NO",
              date: rideDetails.date || "Not Available",
              travelId: rideDetails.travelId || "N/A",
              images: rideDetails.images || [],
            };

            // Fetch distance and duration if locations are valid
            if (
              details.startinglocation !== "Unknown" &&
              details.goinglocation !== "Unknown"
            ) {
              const { distance, duration } = await fetchDistanceAndDuration(
                details.startinglocation,
                details.goinglocation
              );
              details.distance = distance;
              details.duration = duration;
            }
          }

          console.log(
            "Screen mode - Consignment Details:",
            JSON.stringify(details, null, 2)
          );
          setConsignmentDetails(details);
        } catch (error) {
          console.error("Error fetching consignment details:", error.message);
          Alert.alert("Error", "Failed to fetch consignment details");
        } finally {
          setLoading(false);
        }
      }
    };

    // Add a small delay to prevent race conditions
    const timer = setTimeout(() => {
      loadConsignmentDetails();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedConsignment, route?.params]);

  const handleAction = async (actionType) => {
    setLoading(true);
    try {
      const consignmentId =
        selectedConsignment?.consignmentId ||
        route?.params?.consignmentId ||
        route?.params?.rideDetails?.consignmentId;
      if (!consignmentId) {
        throw new Error("Consignment ID not found");
      }

      const travelId =
        consignmentDetails?.travelId ||
        selectedConsignment?.travelId ||
        route?.params?.travelId ||
        route?.params?.rideDetails?.travelId;
      if (!travelId || travelId === "N/A") {
        throw new Error("Travel ID not found");
      }

      const payload = {
        response: actionType, // "accept" or "reject"
      };
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const url = `${baseurl}order/respondto?travelId=${travelId}&consignmentId=${consignmentId}`;
      console.log(`${actionType.toUpperCase()} request URL:`, url);
      console.log(
        `${actionType.toUpperCase()} request payload:`,
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
      console.log("Response", response.data);

      console.log(
        `${actionType.toUpperCase()} response status:`,
        response.status
      );
      const responseText = await response.text();
      console.log(`Raw ${actionType.toUpperCase()} response:`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response content:", responseText);
        throw new Error(
          `Invalid server response: Expected JSON but received: ${responseText.substring(0, 100)}...`
        );
      }

      if (response.ok) {
        console.log(
          `${actionType.toUpperCase()} response data:`,
          JSON.stringify(data, null, 2)
        );
        if (actionType === "accept") {
          setIsAccepted(true);
          Alert.alert(
            "Success",
            `Consignment request accepted successfully`
          );
        } else if (actionType === "reject") {
          Alert.alert("Success", "Consignment request declined");
        }

        if (
          selectedConsignment &&
          (actionType === "accept" ? onAccept : onReject)
        ) {
          (actionType === "accept" ? onAccept : onReject)(selectedConsignment);
          onClose();
        } else {
          setTimeout(() => {
            navigation.navigate("Notification");
          }, 2000);
        }
      } else {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error(`${actionType.toUpperCase()} error:`, error.message);
      Alert.alert(
        "Error",
        error.message || `Failed to ${actionType} consignment`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Loading consignment details...</Text>
      </View>
    );
  }

  if (isAccepted) {
    return (
      <View style={styles.acceptedContainer}>
        <Text style={styles.acceptedText}>Consignment Accepted!</Text>
      </View>
    );
  }

  if (!consignmentDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No consignment details available</Text>
      </View>
    );
  }

  const {
    startinglocation,
    goinglocation,
    distance,
    date,
    weight,
    dimensions,
    expectedEarning,
    description,
    handleWithCare,
    specialRequests,
    duration,
    username,
    phoneNumber: userPhoneNumber,
    receivername,
    receiverphone,
    images,
  } = consignmentDetails;

  // Check if request is accepted - use a stable boolean
  const isRequestAccepted = Boolean(isAccepted || selectedConsignment?.status === "Accepted");
  const showActionButtons = !["Accepted", "Rejected", "Expired"].includes(selectedConsignment?.status || "");

  return (
    <View style={styles.modalContainer}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{startinglocation || "Location not available"}</Text>
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
            <Text style={styles.locationText}>{goinglocation || "Location not available"}</Text>
          </View>

          <View style={styles.separator1} />
          <View style={styles.infoRow}>
            <Image
              source={require("../../Images/clock.png")}
              style={[styles.locationIcon, { marginLeft: 5 }]}
            />
            <Text style={styles.infoText}>
              {distance || "Distance not available"}, {duration || "Duration not available"}
            </Text>
          </View>
        </View>

        {/* User and Receiver Details - Only show when accepted */}
        {isRequestAccepted && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>User Details</Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Name:</Text>
                  <Text style={styles.contactValue}>{username || "Not available"}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Phone:</Text>
                  <Text style={styles.contactValue}>{userPhoneNumber || "Not available"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Receiver Details</Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Name:</Text>
                  <Text style={styles.contactValue}>{receivername || "Not available"}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Phone:</Text>
                  <Text style={styles.contactValue}>{receiverphone || "Not available"}</Text>
                </View>
              </View>
            </View>

            {/* Images - Only show when accepted and images exist */}
            {Array.isArray(images) && images.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Consignment Images</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.imageScroll}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  {images.map((image, index) => (
                    <TouchableOpacity
                      key={`image-${index}`}
                      onPress={() => openImageModal(index)}
                      style={styles.imageContainer}
                    >
                      <Image
                        source={{ uri: typeof image === 'string' ? image : image?.uri }}
                        style={styles.consignmentImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.zoomIcon}>🔍</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description of Consignment</Text>
          <Text style={styles.parcelDescription}>{description || "No description provided"}</Text>

          <View style={styles.dottedLine} />

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
                <Text style={[styles.infoTitle, { marginLeft: 5, color: "#000" }]}>
                  Weight
                </Text>
              </View>
              <Text style={[styles.infoSubtitle, { color: "black" }]}>
                {weight || "0"} Kg
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
                <Text style={[styles.infoTitle, { marginLeft: 5, color: "#000" }]}>
                  Dimensions
                </Text>
              </View>
              <Text style={[styles.infoSubtitle, { color: "black" }]}>
                {dimensions?.length || "0"}x{dimensions?.breadth || "0"}x{dimensions?.height || "0"}{" "}
                {dimensions?.unit || "cm"}
              </Text>
            </View>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.extraInfo}>
            <Text style={styles.boldText}>Handle with Care</Text>
            <Text style={styles.extraValue}>{handleWithCare || "Not specified"}</Text>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.extraInfo}>
            <Text style={styles.boldText}>Special Requests</Text>
            <Text style={styles.extraValue}>{specialRequests || "None"}</Text>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.extraInfo}>
            <Text style={styles.boldText}>Date to Carry the Consignment</Text>
            <Text style={styles.extraValue}>
              {date ? new Date(date).toLocaleDateString() : "Date not available"}
            </Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.boldText}>Total expected Earning</Text>
            <Text style={styles.earningText}>₹{expectedEarning.totalFare || "0"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {showActionButtons ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleAction("reject")}
                disabled={loading}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAction("accept")}
                disabled={loading}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.statusText}>
              {selectedConsignment?.status || "Unknown Status"}
            </Text>
          )}
        </View>
      </ScrollView>

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
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {Array.isArray(getCurrentImages()) && getCurrentImages().length > 0 && (
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
          {Array.isArray(getCurrentImages()) && getCurrentImages().length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={previousImage}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {getCurrentImages().length}
              </Text>
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={nextImage}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    marginTop: 70,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
    backgroundColor: "#ddd",
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
    fontWeight: "bold",
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
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#333",
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  contactLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  contactValue: {
    fontSize: 14,
    color: "#666",
    flex: 2,
    textAlign: "right",
  },
  statusText: {
    color: "#dda900",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 12,
  },
  imageScroll: {
    height: 100,
  },
  imageScrollContent: {
    padding: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  consignmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  imageNavigation: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  imageCounter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 10,
  },
});

export default ConsignmentRequestModel;
