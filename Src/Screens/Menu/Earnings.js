import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const Earnings = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        // const baseurl = await AsyncStorage.getItem("apiBaseUrl");
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        if (!phoneNumber) {
          setError("Base URL or phone number not found.");
          setLoading(false);
          return;
        }

        // Fix: Construct URL with proper query parameter
        const response = await fetch(
          `https://travel.timestringssystem.com/earn/earning?phoneNumber=${encodeURIComponent(
            phoneNumber
          )}`
        );
        const data = await response.json();
        console.log("Earnings API response:", data);

        if (data.status === "success") {
          setTransactions(data.data || []);
          setTotalEarnings(data.totalEarnings * 100 || 0);
        } else {
          setError(data.message || "Error fetching earnings.");
        }
      } catch (err) {
        console.error("Earnings API error:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", () => {
      setLoading(true);
      fetchEarnings();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
      </View>

      {/* Content */}
      <ScrollView>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.content}>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>Total Earnings till date</Text>
              <Text style={styles.summaryValue}>₹0.0</Text>
            </View>
            <View style={styles.start}>
              <View style={styles.circle}>
                <FontAwesome name="rupee" size={45} color="white" />
              </View>
              <Text style={styles.startText}>
                Finish your first travel to start earning!
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.content}>
              <View style={styles.summary}>
                <Text style={styles.summaryText}>Total Earnings till date</Text>
                <Text style={styles.summaryValue}>₹{totalEarnings / 100}</Text>
              </View>
            </View>

            {transactions.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="south-west" size={20} color="white" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressTitle}>
                    {item.title || "Earning Entry"}
                  </Text>
                  <Text style={styles.address}>
                    Travel ID:
                    <Text style={{ color: "#373737" }}>{item.travelId}</Text>
                  </Text>
                </View>
                <TouchableOpacity style={styles.moreIcon}>
                  <Text
                    style={{
                      color: "#53B175",
                      fontWeight: "bold",
                      marginRight: 20,
                    }}
                  >
                    ₹{item.amount}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "whitesmoke",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: width * 0.03,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  content: {
    marginTop: height * 0.03,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    backgroundColor: "#A4CE39",
    borderRadius: 5,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    width: "95%",
    alignItems: "center",
  },
  summaryText: {
    fontSize: width * 0.04,
    color: "#fff",
  },
  summaryValue: {
    margin: height * 0.01,
    fontSize: width * 0.1,
    color: "#fff",
  },
  start: {
    textAlign: "center",
    alignItems: "center",
    marginTop: height * 0.1,
  },
  circle: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: "#53B175",
    borderRadius: width * 0.15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.02,
  },
  startText: {
    fontSize: width * 0.05,
    color: "#373737a",
    textAlign: "center",
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
  },
  address: {
    color: "#7C7C7C",
    marginTop: 5,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#53B175",
    marginRight: 20,
    marginLeft: 10,
  },
  card: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 5,
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-start",
    elevation: 3,
  },
  moreIcon: {
    marginLeft: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default Earnings;
