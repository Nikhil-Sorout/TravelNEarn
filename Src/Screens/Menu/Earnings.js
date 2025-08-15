import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  responsivePadding,
  responsiveFontSize,
  responsiveDimensions,
} from "../../Utils/responsive";

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
        const baseurl = await AsyncStorage.getItem("apiBaseUrl")
        // Fix: Construct URL with proper query parameter
        const response = await fetch(
          `${baseurl}earn/earning?phoneNumber=${encodeURIComponent(
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
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
    paddingVertical: responsivePadding.medium,
    paddingHorizontal: responsivePadding.small,
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: scale(12),
  },
  headerTitle: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  content: {
    marginTop: verticalScale(25),
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    backgroundColor: "#A4CE39",
    borderRadius: 5,
    paddingVertical: verticalScale(17),
    paddingHorizontal: scale(20),
    width: "95%",
    alignItems: "center",
  },
  summaryText: {
    fontSize: fontScale(16),
    color: "#fff",
  },
  summaryValue: {
    margin: verticalScale(8),
    fontSize: fontScale(39),
    color: "#fff",
  },
  start: {
    textAlign: "center",
    alignItems: "center",
    marginTop: verticalScale(85),
  },
  circle: {
    width: scale(118),
    height: scale(118),
    backgroundColor: "#53B175",
    borderRadius: scale(59),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(17),
  },
  startText: {
    fontSize: fontScale(20),
    color: "#373737a",
    textAlign: "center",
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: responsiveFontSize.md,
    color: '#000'
  },
  address: {
    color: "#7C7C7C",
    marginTop: 5,
  },
  iconContainer: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(25),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#53B175",
    marginRight: scale(20),
    marginLeft: scale(10),
  },
  card: {
    backgroundColor: "#fff",
    margin: responsivePadding.small,
    borderRadius: 5,
    flexDirection: "row",
    paddingVertical: responsivePadding.medium,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-start",
    elevation: 3,
  },
  moreIcon: {
    marginLeft: scale(10),
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: verticalScale(20),
  },
});

export default Earnings;
