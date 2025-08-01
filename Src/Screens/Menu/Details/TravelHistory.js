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
  TouchableWithoutFeedback,
  View,
  Dimensions,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../../../header";
import commonStyles from "../../../styles";
import {SafeAreaView} from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => {
  const baseWidth = 393; // iPhone 14 Pro width
  const scaleFactor = width / baseWidth;
  return Math.round(size * scaleFactor);
};

const verticalScale = (size) => {
  const baseHeight = 852; // iPhone 14 Pro height
  const scaleFactor = height / baseHeight;
  return Math.round(size * scaleFactor);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const API_URL = "https://travel.timestringssystem.com/t/travelhistory";

const TravelHistory = () => {
  const [searchText, setSearchText] = useState("");
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    fetchTravelHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const fetchTravelHistory = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");

      if (!phoneNumber) {
        return;
      }

      const response = await fetch(`${API_URL}/${phoneNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log(data?.travels[0])
      if (data.travels && Array.isArray(data.travels)) {
        const formattedData = data.travels.map((travel) => ({
          _id: travel._id,
          travelDate: travel.expectedStartTime || travel.createdAt,
          Leavinglocation: travel.pickup,
          fullLeavingLocation: travel.fullFrom,
          fullGoingLocation: travel.fullTo,
          Goinglocation: travel.drop,
          consignments: travel.consignments || 0,
          travelMode: travel.travelMode || "car",
          travelmode_number: travel.travelmode_number || "1234",
          status: travel.status || "UPCOMING",
          travelId: travel.travelId,
          expectedStartTime: travel.expectedStartTime,
          consignmentDetails: travel.consignmentDetails || [],
        }));
        setTravelData(formattedData);
      } else {
        setTravelData([]);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const colors = {
      UPCOMING: "#FFF1A6",
      CANCELLED: "#FFEEEB",
      COMPLETED: "#F3FFFA",
    };

    const textColors = {
      UPCOMING: "#A18800",
      CANCELLED: "#C92603",
      COMPLETED: "#006939",
    };

    const displayStatus = status ? status.toUpperCase() : "UPCOMING";

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors[displayStatus] || "#FFF1A6" },
        ]}
      >
        <Text
          style={{
            color: textColors[displayStatus] || "#A18800",
            fontWeight: "600",
            fontSize: 12,
          }}
        >
          {displayStatus}
        </Text>
      </View>
    );
  };

  const getTravelIcon = (travelMode) => {
    switch (travelMode) {
      case "car":
        return <Icon name="car" size={moderateScale(30)} color="#284268" />;
      case "airplane":
        return <Ionicons name="airplane" size={moderateScale(30)} color="#284268" />;
      case "train":
        return <Icon name="train" size={moderateScale(30)} color="#284268" />;
      default:
        return <Ionicons name="help-circle-outline" size={moderateScale(30)} color="gray" />;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableWithoutFeedback
      onPress={() => {
        const consignmentId =
          item.consignmentDetails.length > 0
            ? item.consignmentDetails[0].consignmentId
            : null;

        navigation.navigate("TravelStartEndDetails", {
          ride: item,
          consignmentId: consignmentId,
        });
      }}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.boldText}>Travel ID: {item.travelId}</Text>
          {/* {renderStatusBadge(item.status)} */}
        </View>

        <View style={styles.infoRow}>
          <Image
            source={require("../../../Images/clock.png")}
            style={[styles.locationIcon, { marginLeft: 5 }]}
          />
          <Text style={styles.infoText}>
            {formatDate(item.travelDate)}{" "}
            {new Date(item.travelDate).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>

        <View>
          <View style={commonStyles.staraightSeparator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <View style={commonStyles.iconContainer}></View>
            <Text style={commonStyles.locationText}>
              {item.fullLeavingLocation || "N/A"}
            </Text>
          </View>

          <View style={commonStyles.verticalseparator}></View>
          <View style={commonStyles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <View style={commonStyles.iconContainer}></View>
            <Text style={commonStyles.locationText}>
              {item.fullGoingLocation || "N/A"}
            </Text>
          </View>

          <View style={commonStyles.staraightSeparator} />
        </View>

        <View style={commonStyles.locationRow}>
          <View style={commonStyles.iconContainer}>
            {getTravelIcon(item.travelMode)}
          </View>
          <Text style={commonStyles.infoText}>
            {item.travelMode.toUpperCase()}
          </Text>
        </View>

        <View style={commonStyles.staraightSeparator} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button}>
            <Image
              source={require("../../../Images/box.png")}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>
              {item.consignments} Consignments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Image
              source={require("../../../Images/route1.png")}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      <Header title="Travel History" navigation={navigation} />

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location (from/to)"
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
                item.Leavinglocation
                  .toLowerCase()
                  .includes(searchText.toLowerCase()) ||
                item.Goinglocation.toLowerCase().includes(searchText.toLowerCase())
            ).length
          }{" "}
          results found
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : travelData.length === 0 ? (
        <View style={styles.noRidesContainer}>
          <Text style={styles.noRidesText}>No rides found</Text>
        </View>
      ) : (
        <FlatList
          data={travelData.filter(
            (item) =>
              item.Leavinglocation
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              item.Goinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
              item.travelId.toLowerCase().includes(searchText.toLowerCase())
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    marginTop: verticalScale(10),
    // marginHorizontal: width < 375 ? scale(10) : scale(15),
    borderRadius: scale(8),
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: scale(5),
    paddingLeft: scale(40),
    paddingRight: scale(30),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(14),
    // backgroundColor: "#f1f1f1",
    backgroundColor: "#7676801A",
    minHeight: verticalScale(40),
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
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  resultsCount: {
    paddingHorizontal: scale(15),
    paddingTop: verticalScale(5),
    fontSize: moderateScale(12),
    color: "#666",
    fontStyle: "italic",
  },
  listContainer: {
    padding: scale(15),
    paddingHorizontal: width < 375 ? scale(10) : scale(15),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(8),
    padding: scale(15),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  boldText: {
    fontWeight: "bold",
    fontSize: moderateScale(16),
    color: "#333",
  },
  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(6),
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(12),
  },
  dateText: {
    fontSize: moderateScale(14),
    color: "#666",
    marginBottom: verticalScale(8),
  },
  carRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(10),
  },
  carText: {
    marginLeft: scale(8),
    fontSize: moderateScale(14),
    color: "#444",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: scale(8),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(44),
  },
  buttonText: {
    marginLeft: scale(8),
    color: "#007AFF",
    fontWeight: "500",
    fontSize: moderateScale(14),
  },
  icon: {
    width: scale(20),
    height: scale(20),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  dot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "green",
    marginRight: scale(10),
  },
  circle: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "red",
    marginRight: scale(10),
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: verticalScale(10),
  },
  infoText: {
    fontSize: moderateScale(14),
    color: "black",
    fontWeight: "bold",
    marginLeft: scale(10),
    marginTop: verticalScale(-2),
  },
  infoText1: {
    fontSize: moderateScale(15),
    color: "#555",
    marginLeft: scale(32),
    marginTop: verticalScale(-10),
  },
  infoText2: {
    fontSize: moderateScale(15),
    color: "#555",
    marginLeft: scale(-30),
    marginTop: verticalScale(-10),
  },
  mapContainer: {
    marginVertical: 0,
    margin: scale(20),
  },
  map: {
    width: "100%",
    height: verticalScale(180),
    borderRadius: scale(10),
    objectFit: "cover",
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(10),
  },
  infoBlock: {
    alignItems: "center",
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  infoSubtitle: {
    fontSize: moderateScale(14),
    color: "#555",
  },
  vehicleText: {
    fontSize: moderateScale(16),
    color: "#333",
    textAlign: "center",
    marginVertical: verticalScale(10),
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(10),
  },
  profileImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(10),
  },
  driverPhoto: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(20),
    objectFit: "contain",
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  travelerRating: {
    fontSize: moderateScale(14),
    color: "#555",
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
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#666",
  },
});

export default TravelHistory;
