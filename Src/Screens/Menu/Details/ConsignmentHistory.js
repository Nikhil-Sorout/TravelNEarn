import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../header";
import commonStyles from "../../../styles";
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  fontScale, 
  responsiveFontSize,
  responsivePadding 
} from "../../../Utils/responsive";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_PROFILE_PHOTO =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const ConsignmentHistory = () => {
  const [searchText, setSearchText] = useState("");
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  // Function to extract city from address
  const extractCity = (address) => {
    if (!address) return "N/A";
    
    // Split address by commas and get the last part (usually city)
    const parts = address.split(',').map(part => part.trim());
    if (parts.length > 1) {
      // Return the second last part as city (last part is often country/state)
      return parts[parts.length - 2] || parts[parts.length - 1] || "N/A";
    }
    return parts[0] || "N/A";
  };

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (!phoneNumber) {
          console.error("Phone number not found in AsyncStorage");
          return;
        }
        const apiBaseUrl = await AsyncStorage.getItem('apiBaseUrl')
        const response = await fetch(
          `${apiBaseUrl}api/history/${phoneNumber}`
        );
          // console.log("response", response)
        const data = await response.json();
        console.log("api response", JSON.stringify(data.history[0], null, 2));

        if (data.history && Array.isArray(data.history)) {
          const formattedData = data.history.map((consignment) => ({
            _id: consignment._id,
            username: consignment.senderName || "Unknown",
            phoneNumber: consignment.ownerPhoneNumber || "N/A",
            startinglocation: consignment.senderAddress || "N/A",
            recievername: consignment.receiverName || "Unknown",
            recieverphone: consignment.receiverPhoneNumber || "N/A",
            goinglocation: consignment.receiverAddress || "N/A",
            status: consignment?.status || "",
            rating: consignment?.traveldetails[0]?.rating || "0",
            totalRatings: consignment?.traveldetails[0]?.totalrating || "0",
            traveldetails: consignment.traveldetails || [],
            travelId: consignment.traveldetails?.[0]?.travelId || "N/A",
            travelmode: consignment.traveldetails?.[0]?.travelMode || "N/A",
            travellername: consignment.traveldetails?.[0]?.username || "N/A",
            tphoneNumber: consignment.traveldetails?.[0]?.phoneNumber || "N/A",
            profilepicture:consignment.traveldetails?.[0]?.profilepicture || "N/A",
            otp: consignment.sotp,
            rotp: consignment.rotp,
            consignmentId: consignment.consignmentId,
            images: consignment.images || [],
            fullFrom: consignment?.senderFullAddress,
            fullTo: consignment?.receiverFullAddress,
            fromCity: extractCity(consignment?.senderFullAddress || consignment?.senderAddress),
            toCity: extractCity(consignment?.receiverFullAddress || consignment?.receiverAddress),
          }));
          // console.log("formattedData", formattedData)
          setTravelData(formattedData);
          // console.log(
          //   "Formatted travel data:",
            JSON.stringify(formattedData[0], null, 2)
          // );
        } else {
          console.log("No history found in response");
          setTravelData([]);
        }
      } catch (error) {
        console.error("Error fetching travel data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelData();
  }, []);

  const renderStatusBadge = (status) => {
    // Helper function to determine display status (consistent with ConsignmentHistoryDetails)
    const getDisplayStatus = (statusStr) => {
      const status = statusStr || "";
      const lowerStatus = status.toLowerCase();
      
      // Check for pending/not accepted statuses
      const pendingStatuses = ["pending", "not started", "in progress", "rejected", "expired"];
      if (pendingStatuses.includes(lowerStatus)) {
        return "UPCOMING";
      }
      
      // Check for accepted status
      if (lowerStatus === "accepted") {
        return "ACCEPTED";
      }
      
      // Check for completed status
      if (lowerStatus === "completed") {
        return "COMPLETED";
      }
      
      // Check for collected status
      if (lowerStatus === "collected") {
        return "ON THE WAY";
      }
      
      // Default fallback
      return status.toUpperCase() || "YET TO COLLECT";
    };

    const colors = {
      "YET TO COLLECT": "#FFF1A6",
      "UPCOMING": "#FFF1A6",
      "ACCEPTED": "#E8F5E8",
      "ON THE WAY": "#E3F2FD",
      "COMPLETED": "#F3FFFA",
      "CANCELLED": "#FFEEEB",
      "EXPIRED": "#FFE6E6",
    };

    const textColors = {
      "YET TO COLLECT": "#A18800",
      "UPCOMING": "#A18800",
      "ACCEPTED": "#2E7D32",
      "ON THE WAY": "#1976D2",
      "COMPLETED": "#006939",
      "CANCELLED": "#C92603",
      "EXPIRED": "#CC0000",
    };

    const displayStatus = getDisplayStatus(status);

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors[displayStatus] || "#FFF1A6" },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: textColors[displayStatus] || "#A18800" }
          ]}
        >
          {displayStatus}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => 
    {
      console.log("item", item.status)
      return(
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ConsignmentHistoryDetails", {
          ride: item,
          travelId: item.travelId,
        })
      }
    >
      <View style={styles.card}>
        {renderStatusBadge(item.status)}
        
        {/* City Route Display */}
        <View style={styles.cityRouteContainer}>
          <View style={styles.cityRoute}>
            <Text style={styles.cityLabel}>From:</Text>
            <Text style={styles.cityText}>{item.fromCity}</Text>
          </View>
          <View style={styles.routeArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.cityRoute}>
            <Text style={styles.cityLabel}>To:</Text>
            <Text style={styles.cityText}>{item.toCity}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Image
            source={require("../../../Images/locon.png")}
            style={styles.locationIcon}
          />
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>
              {item.username} : {item.phoneNumber}
            </Text>
            <Text style={styles.callNowText}>{item.fullFrom}</Text>
          </View>
        </View>

        <View
          style={[
            commonStyles.verticalseparator,
            { marginTop: -4, marginBottom: 4, position: 'relative', top: -30, height: verticalScale(50), left: scale(-5) },
          ]}
        />
        <View style={commonStyles.separator} />

        <View style={styles.locationRow}>
          <Image
            source={require("../../../Images/locend.png")}
            style={styles.locationIcon}
          />
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>
              {item.recievername}: {item.recieverphone}
            </Text>
            <Text style={styles.callNowText}>{item.fullTo}</Text>
          </View>
        </View>

        <View style={[commonStyles.staraightSeparator, { marginTop: 20 }]} />
        
        {/* Only show traveler section if there are valid travel details with a username */}
        {item.traveldetails &&
        item.traveldetails.length > 0 &&
        item.traveldetails[0].username &&
        item.traveldetails[0].username !== "N/A" ? (
          <>
            <Text style={styles.travelerSectionTitle}>
              Traveler Details
            </Text>
                         <View style={styles.driverSection}>
               <Image
                 source={{
                   uri: item.traveldetails[0].profilePicture || DEFAULT_PROFILE_PHOTO,
                 }}
                 style={styles.driverPhoto}
               />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>
                  {item.traveldetails[0].username}
                </Text>
                <Text style={styles.rating}>
                  ⭐ {item?.traveldetails[0]?.rating || "0"} (
                  {item?.traveldetails[0].totalrating || "0"} ratings)
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Consignments History" navigation={navigation} />

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location or ID"
          placeholderTextColor={"#000"}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Image
            source={require("../../../Images/search.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
        {searchText ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchText("")}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {searchText && !loading && (
        <Text style={styles.resultsCount}>
          {
            travelData.filter(
              (item) =>
                item._id.toLowerCase().includes(searchText.toLowerCase()) ||
                item.startinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
                item.goinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
                item.fromCity.toLowerCase().includes(searchText.toLowerCase()) ||
                item.toCity.toLowerCase().includes(searchText.toLowerCase())
            ).length
          }{" "}
          results found
        </Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : travelData.length === 0 ? (
        <View style={styles.noRidesContainer}>
          <Text style={styles.noRidesText}>No Consignment found</Text>
        </View>
      ) : (
        <FlatList
          data={travelData.filter(
            (item) =>
              item._id.toLowerCase().includes(searchText.toLowerCase()) ||
              item.startinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
              item.goinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
              item.fromCity.toLowerCase().includes(searchText.toLowerCase()) ||
              item.toCity.toLowerCase().includes(searchText.toLowerCase())
          )}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ConsignmentHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    height: verticalScale(60),
    paddingHorizontal: 0,
  },
  backButton: {
    position: "absolute",
    left: scale(15),
  },
  headerTitle: {
    color: "#fff",
    fontSize: fontScale(18),
    fontWeight: "bold",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: responsivePadding.medium,
    paddingVertical: verticalScale(10),
    marginTop: verticalScale(10),
  },
  searchInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: scale(40),
    paddingRight: scale(30),
    paddingVertical: verticalScale(8),
    fontSize: fontScale(14),
    backgroundColor: "#f1f1f1",
    color: "#000"
  },
  searchIcon: {
    position: "absolute",
    left: scale(10),
    marginLeft: scale(18),
  },
  clearButton: {
    position: "absolute",
    right: scale(15),
    padding: scale(5),
  },
  clearButtonText: {
    color: "#888",
    fontSize: fontScale(16),
    fontWeight: "bold",
  },
  resultsCount: {
    paddingHorizontal: responsivePadding.medium,
    paddingTop: verticalScale(5),
    fontSize: fontScale(12),
    color: "#666",
    fontStyle: "italic",
  },
  listContainer: {
    padding: responsivePadding.medium,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: responsivePadding.medium,
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cityRouteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: scale(10),
    borderRadius: 6,
    marginBottom: verticalScale(10),
  },
  cityRoute: {
    flex: 1,
    alignItems: "center",
  },
  cityLabel: {
    fontSize: fontScale(12),
    color: "#666",
    fontWeight: "500",
    marginBottom: verticalScale(2),
  },
  cityText: {
    fontSize: fontScale(14),
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  routeArrow: {
    paddingHorizontal: scale(10),
  },
  arrowText: {
    fontSize: fontScale(18),
    color: "#007BFF",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  boldText: {
    fontWeight: "bold",
    fontSize: fontScale(16),
    color: "#333",
  },
  badge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: 2,
    width: scale(150),
    marginBottom: verticalScale(10),
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontWeight: "600",
    fontSize: fontScale(12),
  },
  dateText: {
    fontSize: fontScale(14),
    color: "#666",
    marginBottom: verticalScale(8),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(5),
  },
  locationDetails: {
    flex: 1,
    marginLeft: scale(10),
  },
  locationText: {
    fontSize: fontScale(16),
    color: "#333",
    fontWeight: "bold",
  },
  locationIcon: {
    width: scale(20),
    height: scale(20),
    marginTop: verticalScale(2),
  },
  carRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(10),
  },
  carText: {
    marginLeft: scale(8),
    fontSize: fontScale(14),
    color: "#444",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: scale(8),
    color: "#007BFF",
    fontWeight: "500",
    fontSize: fontScale(14),
  },
  icon: {
    width: scale(16),
    height: scale(16),
  },
  callNowText: {
    color: "black",
    fontSize: fontScale(16),
    marginTop: verticalScale(5),
    fontWeight: "300",
    flex: 1,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: verticalScale(10),
    marginLeft: scale(5),
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: verticalScale(10),
  },
  infoText: {
    fontSize: fontScale(15),
    color: "black",
    marginLeft: scale(10),
    marginTop: verticalScale(-2),
  },
  infoText1: {
    fontSize: fontScale(15),
    color: "#555",
    marginLeft: scale(32),
    marginTop: verticalScale(-10),
  },
  infoText2: {
    fontSize: fontScale(15),
    color: "#555",
    marginLeft: scale(-30),
    marginTop: verticalScale(-10),
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: responsivePadding.small,
  },
  driverPhoto: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    objectFit: "fill",
  },
  driverDetails: {
    flex: 1,
    marginLeft: scale(10),
  },
  driverName: {
    fontSize: fontScale(16),
    color: "#000",
    fontWeight: "600",
  },
  rating: {
    fontSize: fontScale(12),
    color: "#888",
    marginTop: verticalScale(2),
  },
  travelerSectionTitle: {
    marginLeft: scale(10),
    fontWeight: "bold",
    fontSize: fontScale(14),
    marginBottom: verticalScale(5),
    color : "#000"
  },
  price: {
    fontSize: fontScale(18),
    fontWeight: "bold",
    color: "green",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(15),
    paddingHorizontal: responsivePadding.small,
    justifyContent: "space-between",
    marginTop: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: fontScale(18),
    fontWeight: "bold",
    marginLeft: scale(20),
  },
  headerTitle: {
    color: "white",
    fontSize: fontScale(18),
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(50),
  },
  noRidesImage: {
    width: scale(150),
    height: scale(150),
    marginBottom: verticalScale(10),
    resizeMode: "contain",
  },
  noRidesText: {
    fontSize: fontScale(16),
    fontWeight: "bold",
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
