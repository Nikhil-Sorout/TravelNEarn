import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchDeliveryScreen from "./SearchDeliveryScreen";
import { 
  formatDateForAPI, 
  formatDateForDisplay, 
  generateDateArray,
  getUserTimezone,
  getUserTimezoneOffset 
} from "../Utils/dateUtils";

const SearchRide = ({ navigation, route }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setModalVisible] = useState(true);
  const [dates, setDates] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState(null);

  const { from, to, date } = route.params;
  console.log("route.params :", route.params)

  const [selectedDate, setSelectedDate] = useState(formatDateForAPI(date));

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

  const fetchData = useCallback(
    async (dateParam) => {
      if (!dateParam || !phoneNumber) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await AsyncStorage.setItem("startingLocation", from.toString());
        await AsyncStorage.setItem("goingLocation", to.toString());
        await AsyncStorage.setItem("searchingDate", dateParam);
        const baseUrl = await AsyncStorage.getItem('apiBaseUrl');
        const response = await axios.get(
          `${baseUrl}api/getdetails?leavingLocation=${from}&goingLocation=${to}&date=${dateParam}&phoneNumber=${phoneNumber}&userTimezone=${getUserTimezone()}&timezoneOffset=${getUserTimezoneOffset()}`,
          { headers: { "Content-Type": "application/json" } }
        );
        // console.log("Response:", response.data.consignments[0]?.earning);
        console.log("Response:", response.data.consignments);
        

        // Handle both array and single object responses
        let rawConsignments = response?.data?.consignments;
        if (!Array.isArray(rawConsignments)) {
          // If it's a single object, wrap it in an array
          rawConsignments = rawConsignments ? [rawConsignments] : [];
        }
        
        const consignments = rawConsignments.map(item => {
          // Extract the actual consignment data from the nested structure
          const consignmentData = item._doc || item;
          console.log("Processing item:", item);
          console.log("Extracted consignmentData:", consignmentData);
          
          return {
            ...consignmentData,
            // Include additional properties from the outer object
            calculatedPrice: item.calculatedPrice,
            matchType: item.matchType,
            priceCalculationMode: item.priceCalculationMode,
            userTravelId: item.userTravelId,
            userTravelMode: item.userTravelMode
          };
        });
        
        console.log("Final processed consignments:", consignments);
        setData(consignments);
        console.log("consignments", consignments)
        setError(
          consignments?.length > 0
            ? null
            : "No consignments found for the selected date"
        );
        console.log("Data length:", consignments.length);
        console.log("Error state:", consignments?.length > 0 ? null : "No consignments found for the selected date");
      } catch (err) {
        setData([]);
        setError("No rides found for the selected date");
      } finally {
        setLoading(false);
      }
    },
    [from, to, phoneNumber]
  );

  useEffect(() => {
    if (phoneNumber) {
      fetchData(selectedDate);
    }
  }, [selectedDate, phoneNumber, fetchData]);

  // Debug useEffect to monitor data changes
  useEffect(() => {
    console.log("Data state changed:", data);
    console.log("Data length:", data.length);
    console.log("Loading state:", loading);
    console.log("Error state:", error);
  }, [data, loading, error]);

  useEffect(() => {
    if (!date) return;
    const nextDates = generateDateArray(date);
    setDates(nextDates);
    setSelectedDate(formatDateForAPI(nextDates[0]));
  }, [date]);

  useEffect(() => {
    if (selectedDate) {
      fetchData(formatDateForAPI(selectedDate));
    }
  }, [selectedDate, fetchData]);

  const handleSearch = () => {
    console.log("Search button pressed, selectedDate:", selectedDate);
    setModalVisible(false);
    fetchData(formatDateForAPI(selectedDate));
  };

  const renderItem = ({ item }) => {
    console.log("Rendering item:", item);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ConsignmentDetails", { item })}
      >
        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locon.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>{item.startinglocation || "N/A"}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={styles.verticalseparator} />
        </View>
        <View style={styles.separator} />
        <View style={styles.locationRow}>
          <Image
            source={require("../Images/locend.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText}>{item.goinglocation || "N/A"}</Text>
        </View>
        <View style={styles.separator1} />
        <View style={styles.otherInfo}>
          <View style={styles.infoBlock}>
            <View style={[styles.infoRow, { marginTop: 0 }]}>
              <Image
                source={require("../Images/weight.png")}
                style={[
                  styles.locationIcon,
                  { marginLeft: 0, width: 24, height: 24, marginTop: -3 },
                ]}
              />
              <Text
                style={[
                  styles.infoTitle,
                  { marginRight: 20, marginLeft: 5, marginTop: 0 },
                ]}
              >
                Weight
              </Text>
            </View>
            <Text
              style={[
                styles.infoSubtitle,
                {
                  marginRight: 20,
                  marginLeft: -50,
                  marginTop: 5,
                  fontSize: 15,
                  color: "black",
                },
              ]}
            >
              {item.weight || "N/A"} Kg
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <View style={[styles.infoRow, { marginTop: 0 }]}>
              <Image
                source={require("../Images/dimension.png")}
                style={[
                  styles.locationIcon,
                  { marginLeft: 0, width: 24, height: 24, marginTop: -3 },
                ]}
              />
              <Text
                style={[
                  styles.infoTitle,
                  { marginRight: 20, marginLeft: 5, marginTop: 0 },
                ]}
              >
                Dimensions
              </Text>
            </View>
            <Text
              style={[
                styles.infoSubtitle,
                {
                  marginRight: 20,
                  marginLeft: -50,
                  marginTop: 5,
                  fontSize: 15,
                  color: "black",
                },
              ]}
            >
              {item.dimensions?.length || "N/A"}X{item.dimensions?.breadth || "N/A"}X
              {item.dimensions?.height || "N/A"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <SearchDeliveryScreen
            onSearch={handleSearch}
            initialValues={{ from, to, date }}
          />
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setModalVisible(false);
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consignment Search Page</Text>
      </View>

      <FlatList
        data={loading ? [] : data}
        keyExtractor={(item, index) => item._id ?? item.consignmentId ?? index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.rideList}
        ListEmptyComponent={
          !loading && data.length === 0 ? (
            <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
              {error || "No consignments found"}
            </Text>
          ) : null
        }
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={24} color="black" />
              <TextInput
                multiline={true}
                textAlignVertical="top"  
                style={styles.searchInput}
                placeholder={`${from || "From"} → ${
                  to || "To"
                } ${selectedDate}`}
                placeholderTextColor="black"
                editable={false}
              />
              <Ionicons name="options" size={24} color="black" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((date) => (
                <TouchableOpacity
                  key={date}
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

            {loading && (
              <ActivityIndicator
                size="large"
                color="#007bff"
                style={{ marginTop: 20 }}
              />
            )}
            {error && (
              <Text
                style={{ color: "red", textAlign: "center", marginTop: 20 }}
              >
                {error}
              </Text>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#D83F3F",
  },
  backButton: { padding: 5 },
  headerTitle: {
    color: "white",
    fontSize: 18,

    fontFamily: "Inter-Bold",
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
  searchInput: { flex: 1, marginLeft: 10, color: "black" },
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
  rideList: { paddingHorizontal: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  locationIcon: { width: 20, height: 20 },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 30,
    marginTop: -20,
  },
  verticalseparator: {
    width: 1,
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    height: 40,
    marginHorizontal: 10,
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  infoBlock: { alignItems: "center" },
  infoRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#555",
  },
});

export default SearchRide;
