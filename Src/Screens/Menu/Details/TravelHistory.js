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
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  responsiveFontSize,
  responsiveDimensions,
  screenWidth,
  screenHeight
} from "../../../Utils/responsive";
import { formatDate, formatTime } from "../../../Utils/dateTimeUtils";

const { width, height } = Dimensions.get("window");

const TravelHistory = () => {
  const [searchText, setSearchText] = useState("");
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    fetchTravelHistory();
  }, []);

  // Using centralized date/time utilities
  const formatDateLocal = (dateString) => {
    return formatDate(dateString, 'DD MMMM YYYY');
  };

  const formatTimeLocal = (dateString) => {
    return formatTime(dateString, 'hh:mm A');
  };

  const extractCity = (fullLocation) => {
    if (!fullLocation) return "N/A";
    const parts = fullLocation.split(',').map(part => part.trim());
    return parts[parts.length - 1] || parts[0] || "N/A";
  };

  const fetchTravelHistory = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");

      if (!phoneNumber) {
        return;
      }
      const API_URL = await AsyncStorage.getItem("apiBaseUrl");
      const response = await fetch(`${API_URL}t/travelhistory/${phoneNumber}`, {
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
          fromCity: extractCity(travel.fullFrom || travel.pickup),
          toCity: extractCity(travel.fullTo || travel.drop),
          consignments: travel.consignments || 0,
          travelMode: travel.travelMode || "car",
          vehicleType: travel.vehicleType || "car",
          travelmode_number: travel.travelmode_number || "1234",
          status: travel.status || "UPCOMING",
          travelId: travel.travelId,
          expectedStartTime: travel.expectedStartTime,
          expectedEndTime: travel.expectedendtime,
          consignmentDetails: travel.consignmentDetails || [],
        }));
        console.log("Foramtted data: ", formattedData[0])
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
            fontSize: responsiveFontSize.xs,
          }}
        >
          {displayStatus}
        </Text>
      </View>
    );
  };

  const getTravelIcon = (travelMode, vehicleType) => {
    // If travel mode is roadways, use vehicle type instead
    if (travelMode === "roadways") {
      switch (vehicleType) {
        case "car":
          return <Icon name="car" size={responsiveDimensions.icon.medium} color="#284268" />;
        case "bike":
          return <Icon name="motorcycle" size={responsiveDimensions.icon.medium} color="#284268" />;
        case "truck":
          return <Icon name="truck" size={responsiveDimensions.icon.medium} color="#284268" />;
        case "bus":
          return <Icon name="bus" size={responsiveDimensions.icon.medium} color="#284268" />;
        default:
          return <Icon name="car" size={responsiveDimensions.icon.medium} color="#284268" />;
      }
    } else {
      switch (travelMode) {
        case "car":
          return <Icon name="car" size={responsiveDimensions.icon.medium} color="#284268" />;
        case "airplane":
          return <Ionicons name="airplane" size={responsiveDimensions.icon.medium} color="#284268" />;
        case "train":
          return <Icon name="train" size={responsiveDimensions.icon.medium} color="#284268" />;
        default:
          return <Ionicons name="help-circle-outline" size={responsiveDimensions.icon.medium} color="gray" />;
      }
    }
  };

  const getTravelModeText = (travelMode, vehicleType) => {
    if (travelMode === "roadways") {
      return vehicleType ? vehicleType.toUpperCase() : "ROADWAYS";
    }
    return travelMode ? travelMode.toUpperCase() : "CAR";
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
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.infoRow}>
          <Image
            source={require("../../../Images/clock.png")}
            style={[styles.locationIcon, { marginLeft: scale(5) }]}
          />
          <Text style={styles.infoText}>
            {formatDateLocal(item.travelDate)}{" "}
            {formatTimeLocal(item.travelDate)}
          </Text>
        </View>

        <View style={styles.locationSection}>
          <View style={[commonStyles.staraightSeparator, styles.separator]} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <View style={[commonStyles.iconContainer, styles.iconContainer]}></View>
            <View style={styles.locationTextContainer}>
              <Text style={[commonStyles.locationText, styles.locationText, {marginLeft: 0}]}>
                {item.fullLeavingLocation || "N/A"}
              </Text>
              <Text style={styles.cityText}>
                {extractCity(item.fullLeavingLocation)}
              </Text>
            </View>
          </View>

          <View style={styles.verticalSeparatorContainer}>
            <View style={[commonStyles.verticalseparator, styles.verticalSeparator]}></View>
          </View>
          {/* <View style={[commonStyles.separator, styles.dashedSeparator]} /> */}

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <View style={[commonStyles.iconContainer, styles.iconContainer]}></View>
            <View style={styles.locationTextContainer}>
              <Text style={[commonStyles.locationText, styles.locationText, {marginLeft: 0}]}>
                {item.fullGoingLocation || "N/A"}
              </Text>
              <Text style={styles.cityText}>
                {extractCity(item.fullGoingLocation)}
              </Text>
            </View>
          </View>

          <View style={[commonStyles.staraightSeparator, styles.separator]} />
        </View>

        <View style={[commonStyles.locationRow, styles.travelModeRow]}>
          <View style={[commonStyles.iconContainer, styles.travelIconContainer]}>
            {getTravelIcon(item.travelMode, item.vehicleType)}
          </View>
          <Text style={[commonStyles.infoText, styles.travelModeText]}>
            {getTravelModeText(item.travelMode, item.vehicleType)}
          </Text>
        </View>

        <View style={[commonStyles.staraightSeparator, styles.separator]} />

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
          placeholderTextColor={"#666"}
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
                item.Goinglocation.toLowerCase().includes(searchText.toLowerCase()) ||
                item.fromCity.toLowerCase().includes(searchText.toLowerCase()) ||
                item.toCity.toLowerCase().includes(searchText.toLowerCase())
            ).length
          }{" "}
          results found
        </Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D83F3F" />
        </View>
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
              item.fromCity.toLowerCase().includes(searchText.toLowerCase()) ||
              item.toCity.toLowerCase().includes(searchText.toLowerCase()) ||
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
    marginHorizontal: scale(16),
    borderRadius: scale(8),
  },
  searchInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: scale(5),
    paddingLeft: scale(40),
    paddingRight: scale(30),
    paddingVertical: verticalScale(8),
    fontSize: responsiveFontSize.sm,
    backgroundColor: "#7676801A",
    minHeight: verticalScale(40),
    color: '#000'
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
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },
  resultsCount: {
    paddingHorizontal: scale(15),
    paddingTop: verticalScale(5),
    fontSize: responsiveFontSize.xs,
    color: "#666",
    fontStyle: "italic",
    marginLeft: scale(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: scale(15),
    paddingHorizontal: scale(16),
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
    fontSize: responsiveFontSize.md,
    color: "#333",
    fontFamily: "Inter-Bold",
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
  dateText: {
    fontSize: responsiveFontSize.sm,
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
    fontSize: responsiveFontSize.sm,
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
    fontSize: responsiveFontSize.sm,
    fontFamily: "Inter-Medium",
  },
  icon: {
    width: scale(20),
    height: scale(20),
  },
  locationSection: {
    position: "relative",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: verticalScale(10),
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: scale(10),
  },
  locationText: {
    fontSize: responsiveFontSize.sm,
    color: "#000000",
    fontFamily: "Inter-Medium",
    lineHeight: responsiveFontSize.sm * 1.3,
  },
  cityText: {
    fontSize: responsiveFontSize.xs,
    color: "#666",
    fontFamily: "Inter-Regular",
    marginTop: verticalScale(2),
  },
  locationIcon: {
    width: scale(16),
    height: scale(16),
    marginTop: verticalScale(2),
  },
  iconContainer: {
    marginRight: scale(10),
  },
  travelModeRow: {
    marginVertical: verticalScale(10),
  },
  travelIconContainer: {
    marginRight: scale(10),
  },
  travelModeText: {
    fontSize: responsiveFontSize.sm,
    color: "black",
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: verticalScale(10),
    marginLeft: scale(5),
  },
  verticalSeparatorContainer: {
    position: "absolute",
    left: scale(-4),
    top: verticalScale(60),
    // bottom: verticalScale(50),
    alignItems: "center",
    zIndex: 1,
  },
  verticalSeparator: {
    width: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#6C6C70",
    height: verticalScale(50),
    // marginHorizontal: scale(11),
  },
  dashedSeparator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginVertical: verticalScale(10),
    marginLeft: scale(40),
    marginTop: verticalScale(-20),
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
    display: 'flex',
    flexDirection: "row",
    marginVertical: verticalScale(10),
    alignItems: "center"
  },
  infoText: {
    fontSize: responsiveFontSize.sm,
    color: "black",
    fontWeight: "bold",
    marginLeft: scale(10),
    marginTop: verticalScale(-2),
    fontFamily: "Inter-Bold",
  },
  infoText1: {
    fontSize: responsiveFontSize.sm,
    color: "#555",
    marginLeft: scale(32),
    marginTop: verticalScale(-10),
  },
  infoText2: {
    fontSize: responsiveFontSize.sm,
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
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color: "#000",
  },
  infoSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: "#555",
  },
  vehicleText: {
    fontSize: responsiveFontSize.md,
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
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color: "#000",
  },
  travelerRating: {
    fontSize: responsiveFontSize.sm,
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
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color: "#666",
    fontFamily: "Inter-Bold",
  },
});

export default TravelHistory;
