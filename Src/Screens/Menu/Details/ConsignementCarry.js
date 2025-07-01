import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../header";
import commonStyles from "../../../styles";

const ConsignmentCarry = ({ route }) => {
  const { travelId } = route.params;
  console.log("travelId:", travelId);

  const [travelData, setTravelData] = useState([]);
  const navigation = useNavigation();

  const fetchTravelData = async () => {
    try {
      if (!travelId) {
        console.log("Missing travelId:", travelId);
        setTravelData([]);
        return;
      }

      console.log("Fetching consignments for travelId:", travelId);
      const response = await fetch(
        `https://travel.timestringssystem.com/order/consignmenttocarry/${travelId}`
      );

      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          `Expected JSON, received ${contentType}: ${text.slice(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      let consignments = [];
      if (Array.isArray(data.consignments)) {
        consignments = data.consignments;
        console.log(
          "Using data.consignments with length:",
          data.consignments.length
        );
      } else if (Array.isArray(data.consige)) {
        // Handle the nested array structure
        if (Array.isArray(data.consige[0])) {
          consignments = data.consige[0]; // Access the inner array
          console.log(
            "Using nested data.consige with length:",
            consignments.length
          );
        } else {
          consignments = data.consige;
          console.log("Using data.consige with length:", data.consige.length);
        }
      } else {
        console.log(
          "No consignments found in API response. Keys:",
          Object.keys(data)
        );
        setTravelData([]);
        return;
      }

      const parseDimensions = (dimensions) => {
        if (typeof dimensions === "object" && dimensions !== null) {
          return {
            length: dimensions.length || "0",
            breadth: dimensions.breadth || "0",
            height: dimensions.height || "0",
            unit: dimensions.unit || "cm",
          };
        } else if (typeof dimensions === "string") {
          const cleanedString = dimensions
            .replace(/'/g, '"')
            .replace(/(\w+):/g, '"$1":');
          try {
            return JSON.parse(cleanedString);
          } catch {
            const lengthMatch = dimensions.match(/length: ['"]?(\d+)['"]?/);
            const breadthMatch = dimensions.match(/breadth: ['"]?(\d+)['"]?/);
            const heightMatch = dimensions.match(/height: ['"]?(\d+)['"]?/);
            const unitMatch = dimensions.match(/unit: ['"]?(\w+)['"]?/);
            return {
              length: lengthMatch ? lengthMatch[1] : "0",
              breadth: breadthMatch ? breadthMatch[1] : "0",
              height: heightMatch ? heightMatch[1] : "0",
              unit: unitMatch ? unitMatch[1] : "cm",
            };
          }
        }
        return { length: "0", breadth: "0", height: "0", unit: "cm" };
      };

      const parseWeight = (weight) => {
        if (typeof weight === "string") {
          return weight.replace(/"/g, "") || "0";
        }
        return weight || "0";
      };

      const normalized = consignments.map((item) => ({
        _id: item._id,
        consignmentId: item.consignmentId,
        username: item.sender || "Unknown",
        phoneNumber: item.senderPhone || item.senderphone || "Unknown",
        startinglocation: item.startinglocation || "Unknown",
        receivername: item.receiver || "Unknown",
        receiverphone: item.receiverphone || item.receiverPhone || "Unknown",
        goinglocation: item.droplocation || item.goinglocation || "Unknown",
        weight: parseWeight(item.weight),
        dimensions: parseDimensions(item.dimensions),
        distance: item.distance,
        status: item.status,
        OTP: item.sotp,
        expectedEarning: item.earning || "0",
        description: item.description || "No description provided",
        handleWithCare: item.handleWithCare || "No",
        specialRequest: item.specialRequest || "None",
        dateOfSending: item.dateOfSending || null,
      }));

      console.log("Normalized Data:", JSON.stringify(normalized, null, 2));
      setTravelData(normalized);
    } catch (error) {
      console.error("Error fetching consignment data:", error);
      setTravelData([]);
    }
  };

  useEffect(() => {
    fetchTravelData();
  }, [travelId]);

  useFocusEffect(
    useCallback(() => {
      fetchTravelData();

      return () => {};
    }, [travelId])
  );

  const renderStatusBadge = (status) => {
    const colors = {
      "Yet to Collect": "#E6F0FA",
      COLLECTED: "#FFF1A6",
      COMPLETED: "#F3FFFA",
    };

    const textColors = {
      "Yet to Collect": "#003087",
      COLLECTED: "#A18800",
      COMPLETED: "#006939",
    };

    return (
      <View
        style={[styles.badge, { backgroundColor: colors[status] || "#E6F0FA" }]}
      >
        <Text
          style={{
            color: textColors[status] || "#003087",
            fontWeight: "600",
            fontSize: 12,
          }}
        >
          {status}
        </Text>
      </View>
    );
  };

  const handleUpdateStatus = (consignmentId) => {
    console.log("Navigating to ConsignmentDetails with:", { consignmentId });
    const item = travelData.find(
      (item) => item.consignmentId === consignmentId
    );
    if (!item) {
      console.error("Consignment not found for consignmentId:", consignmentId);
      return;
    }
    navigation.navigate("ConsignmentCarryDetails", {
      ride: item,
      consignmentId,
      travelId,
    });
  };

  const handleViewDetails = (itemId) => {
    const item = travelData.find((item) => item._id === itemId);
    console.log("Navigating to ConsignmentCarryDetails with:", {
      consignmentId: item?.consignmentId,
      travelId,
      ride: item,
      earning: item.expectedEarning,
    });
    if (!item || !item.consignmentId) {
      console.error("Missing item or consignmentId:", {
        consignmentId: item?.consignmentId,
        item,
      });
      return;
    }
    navigation.navigate("ConsignmentCarryDetails", {
      ride: item,
      consignmentId: item.consignmentId, // Use item.consignmentId
      travelId,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleViewDetails(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        {renderStatusBadge(item.status)}

        <View>
          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locon.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {item.username}
              {item.phoneNumber !== "Unknown" ? ` : ${item.phoneNumber}` : ""}
              {"\n"}
              <Text style={styles.locationDescription}>
                {item.startinglocation}
              </Text>
            </Text>
          </View>

          <View
            style={[
              commonStyles.verticalseparator,
              { marginTop: -5, marginBottom: 5 },
            ]}
          ></View>
          <View style={styles.separator} />

          <View style={styles.locationRow}>
            <Image
              source={require("../../../Images/locend.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {item.receivername}
              {item.receiverphone !== "Unknown"
                ? ` : ${item.receiverphone}`
                : ""}
              {"\n"}
              <Text style={styles.locationDescription}>
                {item.goinglocation}
              </Text>
            </Text>
          </View>

          <View style={[commonStyles.staraightSeparator, { marginTop: 20 }]} />

          <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Image
                  source={require("../../../Images/weight.png")}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoTitle}>Weight</Text>
              </View>
              <Text style={styles.infoValue}>{item.weight} Kg</Text>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Image
                  source={require("../../../Images/dimension.png")}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoTitle}>Dimensions</Text>
              </View>
              <Text style={styles.infoValue}>
                {item.dimensions?.length}×{item.dimensions?.breadth}×
                {item.dimensions?.height} {item.dimensions?.unit || "cm"}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {item.status !== "COMPLETED" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus(item.consignmentId)}
                style={[styles.button, styles.updateButton]}
              >
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>
            )}
            <View style={styles.buttonDivider} />
            <TouchableOpacity
              onPress={() => handleViewDetails(item._id)}
              style={[styles.button, styles.viewButton]}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Consignments to carry" navigation={navigation} />
      {travelData.length === 0 ? (
        <Text style={styles.noDataText}>No consignments available</Text>
      ) : (
        <FlatList
          data={travelData}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    height: 60,
    paddingHorizontal: 0,
    marginTop: 30,
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
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#f1f1f1",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    marginLeft: 18,
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
    alignItems: "flex-start",
    marginBottom: 5,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginTop: 3,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    fontWeight: "bold",
    flex: 1,
  },
  locationDescription: {
    color: "#555",
    fontSize: 16,
    fontWeight: "normal",
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
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    marginLeft: 32,
    marginTop: 3,
  },
  infoBlock: {
    flex: 1,
    marginVertical: 5,
  },
  otherInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 10,
    paddingTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  updateButton: {
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  buttonDivider: {
    width: 1,
    backgroundColor: "#ddd",
  },
  buttonText: {
    color: "#1976d2",
    fontWeight: "500",
    fontSize: 14,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#555",
  },
});

export default ConsignmentCarry;
