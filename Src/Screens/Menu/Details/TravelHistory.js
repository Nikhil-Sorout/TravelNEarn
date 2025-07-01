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
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../../../header";
import commonStyles from "../../../styles";

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
        console.error("Phone number not found in AsyncStorage");
        return;
      }

      const response = await fetch(`${API_URL}/${phoneNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      if (data.travels && Array.isArray(data.travels)) {
        const formattedData = data.travels.map((travel) => ({
          _id: travel._id,
          travelDate: travel.expectedStartTime || travel.createdAt,
          Leavinglocation: travel.pickup,
          Goinglocation: travel.drop,
          consignments: travel.consignments || 0,
          travelMode: travel.travelMode || "car",
          travelmode_number: travel.travelmode_number || "1234",
          status: travel.status || "UPCOMING",
          travelId: travel.travelId,
          expectedStartTime: travel.expectedStartTime,
          consignmentDetails: travel.consignmentDetails || [],
        }));
        console.log("Formatted Data:", JSON.stringify(formattedData, null, 2));
        setTravelData(formattedData);
      } else {
        console.log("No travels found in response");
        setTravelData([]);
      }
    } catch (error) {
      console.error("Error fetching travel history:", error);
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
        return <Icon name="car" size={30} color="#284268" />;
      case "airplane":
        return <Ionicons name="airplane" size={30} color="#284268" />;
      case "train":
        return <Icon name="train" size={30} color="#284268" />;
      default:
        return <Ionicons name="help-circle-outline" size={30} color="gray" />;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        const consignmentId =
          item.consignmentDetails.length > 0
            ? item.consignmentDetails[0].consignmentId
            : null;

        navigation.navigate("TravelStartEndDetails", {
          ride: item,
          consignmentId: consignmentId,
        });
        console.log(item.travelId);
        // navigation.navigate("Cancellation",{
        //   travelId:item.travelId
        // })
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
              {item.Leavinglocation || "N/A"}
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
              {item.Goinglocation || "N/A"}
            </Text>
          </View>

          <View style={commonStyles.staraightSeparator} />
        </View>

        <View style={commonStyles.locationRow}>
          <View style={commonStyles.iconContainer}>
            {getTravelIcon(item.travelMode)}
          </View>
          <Text style={commonStyles.infoText}>
            {item.travelMode.toUpperCase()} - {item.travelmode_number}
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
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 40,
    paddingRight: 30, // Add space for the clear button
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#f1f1f1",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    marginLeft: 18,
  },
  clearButton: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  clearButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsCount: {
    paddingHorizontal: 15,
    paddingTop: 5,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  carRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  carText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 8,
    color: "#007AFF",
    fontWeight: "500",
    fontSize: 14,
  },
  icon: {
    width: 20,
    height: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "green",
    marginRight: 10,
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: "black",
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: -2,
  },
  infoText1: {
    fontSize: 15,
    color: "#555",
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: "#555",
    marginLeft: -30,
    marginTop: -10,
  },
  mapContainer: {
    marginVertical: 0,
    margin: 20,
  },
  map: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    objectFit: "cover",
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
  },
  vehicleText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginVertical: 10,
  },
  traveler: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 20,
    objectFit: "contain",
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  travelerRating: {
    fontSize: 14,
    color: "#555",
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noRidesImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
    resizeMode: "contain",
  },
  noRidesText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
});

export default TravelHistory;
