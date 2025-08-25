import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import ConsignmentSearchScreen from "./ConsignmentSearchScreen";
import {
  generateDateArray,
  formatDateForAPI,
  getUserTimezone,
  getUserTimezoneOffset,
} from "../Utils/dateUtils";
import { 
  formatUTCTimeToLocal, 
  calculateDurationFromUTC 
} from "../Utils/dateTimeUtils";
import { SafeAreaView } from "react-native-safe-area-context";

// Add status normalization function
const normalizeConsignmentStatus = (consignments) => {
  if (!Array.isArray(consignments)) return [];
  
  return consignments.map(consignment => ({
    ...consignment,
    status: consignment.status === "Yet to Collect" ? "Pending" : consignment.status
  }));
};

const SearchRide = ({ navigation, route }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setModalVisible] = useState(true);
  const [dates, setDates] = useState([]);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [ridesWithProfile, setRidesWithProfile] = useState(null);
  const [selectedTravelMode, setSelectedTravelMode] = useState(route.params.mode || null);
  const [fareDetails, setFareDetails] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [searchFrom, setSearchFrom] = useState(route.params.from || "");
  const [searchTo, setSearchTo] = useState(route.params.to || "");
  const [searchDate, setSearchDate] = useState(route.params.date || "");
  const [waitingForCorrectMode, setWaitingForCorrectMode] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [userConsignments, setUserConsignments] = useState([]);

  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
        setPhoneNumber(storedPhoneNumber);
      } catch (err) {
        setError("Failed to retrieve user information");
      }
    };
    getPhoneNumber();
  }, []);

  // Set default travel mode if none provided
  useEffect(() => {
    if (!selectedTravelMode) {
      setSelectedTravelMode("train");
    }
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    searchDate ? formatDateForAPI(searchDate) : ""
  );

  const fetchData = useCallback(
    async (dateParam, modeFilter = "train") => {
      if (!dateParam || !searchFrom || !searchTo || !phoneNumber) return;
      
      // If we're fetching with a different mode than selected, show loading
      if (selectedTravelMode && modeFilter !== selectedTravelMode) {
        setWaitingForCorrectMode(true);
      }
      
      try {
        setLoading(true);
        await AsyncStorage.setItem("startingLocation", searchFrom);
        await AsyncStorage.setItem("goingLocation", searchTo);
        await AsyncStorage.setItem("searchingDate", searchDate);

        const formattedDate = formatDateForAPI(dateParam);
        const baseurl = await AsyncStorage.getItem("apiBaseUrl");
        const response = await axios.get(
          `${baseurl}t/search-rides`,
          {
            params: {
              leavingLocation: searchFrom,
              goingLocation: searchTo,
              date: formattedDate,
              travelMode: modeFilter,
              phoneNumber: phoneNumber,
              userTimezone: getUserTimezone(),
              timezoneOffset: getUserTimezoneOffset(),
            },
            headers: { "Content-Type": "application/json" },
          }
        );
        // console.log("Search rides raw response:", response);
        // console.log(
        //   "Search rides response:",
        //   JSON.stringify(response.data, null, 2)
        // );
        console.log("Full API response:", JSON.stringify(response.data, null, 2));
        
        // Handle different possible response structures
        const responseData = response.data;
        const rides = responseData?.availableRides || responseData?.rides || [];
        const profiles = responseData?.ridesWithProfile || [];
        const calculatedPrices = Array.isArray(responseData?.calculatedPrices) ? responseData.calculatedPrices : 
                                Array.isArray(responseData?.calculatedPrice) ? responseData.calculatedPrice : 
                                responseData?.calculatedPrice ? [responseData.calculatedPrice] : [];
        const userConsignments = responseData?.userConsignments || [];
        const estimatedFareData = responseData?.estimatedFare || responseData?.fareDetails || null;
        
        setCalculatedPrice(calculatedPrices);
        
        // Merge rides with profiles based on index
        const mergedRides = await rides.map((ride, index) => ({
          ...ride,
          // profilePicture: profiles[index]?.profilePicture || null,
          // rating: profiles[index]?.rating || 0,
          // aveargerating: profiles[index]?.aveargerating || 0,
        }));

        console.log("Merged rides:", JSON.stringify(mergedRides, null, 2));
        console.log("Calculated prices:", JSON.stringify(calculatedPrices, null, 2));
        console.log("User consignments:", JSON.stringify(userConsignments, null, 2));
        
        setData(mergedRides);
        setFilteredData(mergedRides);
        setEstimatedFare(estimatedFareData);
        setRidesWithProfile(profiles);
        setUserConsignments(normalizeConsignmentStatus(userConsignments));
        setError(null);
        
        // Clear waiting state when we get the correct mode data
        if (modeFilter === selectedTravelMode) {
          setWaitingForCorrectMode(false);
        }
      } catch (err) {
        console.error("Fetch error:", err.message, err.response?.data);
        setError(
          err.response?.data?.message || "No rides found for the given criteria"
        );
        setData([]);
        setFilteredData([]);
        setEstimatedFare(null);
        setRidesWithProfile(null);
        setUserConsignments(normalizeConsignmentStatus([]));
        setWaitingForCorrectMode(false);
      } finally {
        setLoading(false);
      }
    },
    [searchFrom, searchTo, searchDate, phoneNumber, selectedTravelMode]
  );

  useEffect(() => {
    if (!searchDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(searchDate)) {
      if (route.params?.date) {
        try {
          const paramDate = new Date(route.params.date);
          if (!isNaN(paramDate.getTime())) {
            const formattedParamDate = `${paramDate
              .getDate()
              .toString()
              .padStart(2, "0")}/${(paramDate.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${paramDate.getFullYear()}`;
            setSearchDate(formattedParamDate);
            return;
          }
        } catch (e) {
          console.error("Error parsing route.params.date:", e);
        }
      }

      const today = new Date();
      const defaultDate = `${today.getDate().toString().padStart(2, "0")}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${today.getFullYear()}`;
      setSearchDate(defaultDate);
      return;
    }

          const nextDates = generateDateArray(searchDate);
      setDates(nextDates);
      if (nextDates.length > 0) {
        setSelectedDate(formatDateForAPI(nextDates[0]));
      }
  }, [searchDate, route.params?.date]);

  useEffect(() => {
    if (selectedDate && searchFrom && searchTo && selectedTravelMode) {
      fetchData(formatDateForAPI(selectedDate), selectedTravelMode);
    }
  }, [selectedDate, selectedTravelMode, fetchData, searchFrom, searchTo]);

  const handleSearch = (searchParams) => {
    const { from, to, mode, date } = searchParams;
    setSearchFrom(from);
    setSearchTo(to);
    setSearchDate(date);
    const travelMode = mode || "train";
    setSelectedTravelMode(travelMode);
    setModalVisible(false);
    setWaitingForCorrectMode(false);
    if (date && from && to) {
      const formattedDate = formatDateForAPI(date);
      console.log(travelMode)
      fetchData(formattedDate, travelMode);
    }
  };

  const getTravelIcon = (travelMode, vehicleType) => {
    switch (travelMode) {
      case "roadways":
        // Use different icons based on vehicle type
        switch (vehicleType?.toLowerCase()) {
          case "car":
          case "hatchback":
            return <Icon name="car" size={30} color="#D83F3F" />;
          case "suv":
            return <Icon name="car" size={30} color="#D83F3F" />;
          case "bike":
          case "motorcycle":
            return <Icon name="motorcycle" size={30} color="#D83F3F" />;
          case "auto":
          case "autorickshaw":
            return <Icon name="car" size={30} color="#D83F3F" />;
          default:
            return <Icon name="car" size={30} color="#D83F3F" />;
        }
      case "airplane":
        return <Ionicons name="airplane" size={30} color="#D83F3F" />;
      case "train":
        return <Icon name="train" size={30} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={30} color="gray" />;
    }
  };

  const getTravelModeText = (travelMode, vehicleType) => {
    // If travel mode is roadways, use vehicle type instead
    if (travelMode === "roadways") {
      return vehicleType ? vehicleType.toUpperCase() : "ROADWAYS";
    }
    
    switch (travelMode) {
      case "car":
        return "Hatchback Car";
      case "airplane":
        return "Airplane";
      case "train":
        return "Train";
      default:
        return "Unknown";
    }
  };
  console.log("Estimated fare : ", estimatedFare)


  const renderItem = ({ item }) => {
    const getTimeFromDate = (dateTimeString) => {
      console.log("dateTimeString : ", dateTimeString)
      return formatUTCTimeToLocal(dateTimeString, "h:mm A");
    };

    const calculateDuration = () => {
      return calculateDurationFromUTC(item.expectedStartTime, item.expectedEndTime);
    };

    console.log("item : ", item)
    console.log("Rendering ride item:", {
      id: item._id,
      username: item.username,
      profilePicture: item.profilePicture,
      rating: item.rating,
      aveargeRating: item.averageRating,
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log("Navigating to TravelDetails with data:", {
            ride: item,
            fareDetails: estimatedFare,
            calculatedPrices: calculatedPrice,
            userConsignments: userConsignments
          });
          navigation.navigate("TravelDetails", {
            ride: item,
            fareDetails: estimatedFare,
            calculatedPrices: calculatedPrice || [],
            userConsignments: userConsignments || [],
          });
        }}
      >
        <View style={styles.timelineContainer}>
          <View style={styles.timelineContent}>
            <View style={styles.leftColumn}>
              <Text style={styles.timeText}>
                {getTimeFromDate(item.expectedStartTime)}
              </Text>
              <Text style={styles.durationText}>{calculateDuration()}</Text>
              <Text style={styles.timeText}>
                {getTimeFromDate(item.expectedEndTime)}
              </Text>
            </View>
            <View style={styles.rightColumn}>
              <View style={styles.rightColumn1}>
                <Image
                  source={require("../Images/locon.png")}
                  style={styles.locationIcon}
                />
                <View style={styles.dottedSeparator} />
                <Image
                  source={require("../Images/locend.png")}
                  style={styles.locationIcon}
                />
              </View>
              <View style={styles.locationNames}>
                <Text style={styles.locationText}>{item?.Leavinglocation}</Text>
                <View style={styles.dottedLineBetweenLocations} />
                <Text style={styles.locationText}>{item?.Goinglocation}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.modeContainer}>
          <Text style={styles.modeText}>Mode of Travel</Text>
          <View style={styles.modeIconContainer}>
            {getTravelIcon(item.travelMode, item.vehicleType)}
            <Text style={styles.modeDetailText}>
              {getTravelModeText(item.travelMode, item.vehicleType)}
            </Text>
          </View>
        </View>
        <View style={styles.driverContainer}>
          <View style={{ flexDirection: "row" }}>
            <Image
              source={{
                uri:
                  item.profilePicture ||
                  "https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg",
              }}
              style={styles.driverImage}
            />
            <View>
              <Text style={styles.driverName}>
                {item.username || "Unknown"}
              </Text>
              <Text style={styles.ratingText}>
                ⭐ {item.averageRating ? item.averageRating.toFixed(1) : "0"}{" "}
                ({item.rating || "0"} ratings)
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            {calculatedPrice && calculatedPrice.length > 0 ? (
              <View>
                <Text style={styles.price}>
                  ₹{calculatedPrice[0]?.calculatedPrice?.senderTotalPay || calculatedPrice[0]?.calculatedPrice?.totalFare || "N/A"}
                </Text>
                <Text style={styles.priceSubtext}>
                  {calculatedPrice.length} payment option{calculatedPrice.length > 1 ? 's' : ''} available
                </Text>
              </View>
            ) : (
              <Text style={styles.price}>
                ₹{estimatedFare?.senderTotalPay || estimatedFare?.totalFare || "N/A"}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={isModalVisible} transparent animationType="slide">
        <ConsignmentSearchScreen
          onSearch={handleSearch}
          initialValues={{ from: searchFrom, to: searchTo, date: searchDate }}
        />
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Search a Traveller</Text>
      </View>

      <FlatList
        data={waitingForCorrectMode ? [] : filteredData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={24} color="black" />
              <TextInput
                multiline={true}
                style={styles.searchInput}
                placeholder={`${searchFrom || "From"} → ${searchTo || "To"} ${
                  selectedDate || "Select Date"
                }`}
                placeholderTextColor="black"
                editable={false}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((date, index) => (
                <TouchableOpacity
                  key={`date-${index}`}
                  style={[
                    styles.dateButton,
                    selectedDate === date && styles.selectedDateButton,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === date && styles.selectedDateText,
                    ]}
                  >
                    {date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading || waitingForCorrectMode ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : error ? (
            <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
          ) : (
            <Text style={{ textAlign: "center", color: "#555" }}>
              {selectedTravelMode
                ? `No ${selectedTravelMode} rides available`
                : "No rides available"}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    fontFamily: "Inter-Bold",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Inter-Regular",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    margin: 10,
  },
  searchInput: { flex: 1, marginLeft: 10 },
  dateButton: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedDateButton: { backgroundColor: "#53B175" },
  dateText: { color: "#000" },
  selectedDateText: { color: "#fff" },
  listContent: { paddingHorizontal: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontFamily: "Inter-Bold",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  leftColumn: {
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  rightColumn: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
  },
  rightColumn1: {
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  durationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginBottom: 13,
  },
  dottedSeparator: {
    width: "1",
    height: 35,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  locationNames: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  locationText: {
    fontSize: 14,
    color: "#555",
  },
  dottedLineBetweenLocations: {
    width: "100%",
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 18,
  },
  modeContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 15,
    marginTop: 7,
  },
  modeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    fontFamily: "Inter-Regular",
    marginBottom: 5,
  },
  modeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeDetailText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  driverContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  driverImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  driverName: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  ratingText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D83F3F",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default SearchRide;
