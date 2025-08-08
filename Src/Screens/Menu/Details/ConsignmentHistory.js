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

const ConsignmentHistory = () => {
  const [searchText, setSearchText] = useState("");
  const [travelData, setTravelData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

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
    const colors = {
      "YET TO COLLECT": "#FFF1A6",
      CANCELLED: "#FFEEEB",
      COMPLETED: "#F3FFFA",
      EXPIRED: "#FFE6E6",
    };

    const textColors = {
      "YET TO COLLECT": "#A18800",
      CANCELLED: "#C92603",
      COMPLETED: "#006939",
      EXPIRED: "#CC0000",
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
        <View>
          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <View>
              <Text style={styles.locationText}>
                {item.username} : {item.phoneNumber}
              </Text>
              <Text style={styles.callNowText}>{item.fullFrom}</Text>
            </View>
          </View>

          <View
            style={[
              commonStyles.verticalseparator,
              { marginTop: -4, marginBottom: 4 },
            ]}
          />
          <View style={commonStyles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <View>
              <Text style={styles.locationText}>
                {item.recievername}: {item.recieverphone}
              </Text>
              <Text style={styles.callNowText}>{item.fullTo}</Text>
            </View>
          </View>

          <View style={[commonStyles.staraightSeparator, { marginTop: 20 }]} />
        </View>

        {/* Only show traveler section if there are valid travel details with a username */}
        {item.traveldetails &&
        item.traveldetails.length > 0 &&
        item.traveldetails[0].username &&
        item.traveldetails[0].username !== "N/A" ? (
          <>
            <Text style={{ marginLeft: 10, fontWeight: "bold", fontSize: 14 }}>
              Traveller Details
            </Text>
            <View style={styles.driverSection}>
              <Image
                source={{
                  uri:item.traveldetails[0].profilePicture,
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
    <View style={styles.container}>
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
                item.goinglocation.toLowerCase().includes(searchText.toLowerCase())
            ).length
          }{" "}
          results found
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
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
              item.goinglocation.toLowerCase().includes(searchText.toLowerCase())
          )}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
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
    height: 60,
    paddingHorizontal: 0,
  },
  backButton: {
    position: "absolute",
    left: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
    width: 150,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    fontWeight: "bold",
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
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 8,
    color: "#007BFF",
    fontWeight: "500",
    fontSize: 14,
  },
  icon: {
    width: 16,
    height: 16,
  },
  verticalseparator: {
    width: 1,
    backgroundColor: "#ddd",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    height: "40",
    marginHorizontal: 11,
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  callNowText: {
    color: "black",
    fontSize: 16,
    marginLeft: 10,
    marginTop: 5,
    fontWeight: "light",
    width: '60%'
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginLeft: 5,
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
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  driverPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    objectFit: "fill",
  },
  driverDetails: {
    flex: 1,
    marginLeft: 10,
  },
  driverName: {
    fontSize: 16,
    color: "#000",
  },
  driverRating: {
    fontSize: 12,
    color: "#888",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    marginTop: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
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
