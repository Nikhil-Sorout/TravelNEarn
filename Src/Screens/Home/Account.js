import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");
const statusBarHeight = Platform.OS === "ios" ? 20 : 0;

const Account = ({ navigation, route }) => {
  const { phoneNumber: phoneNumberFromParams } = route.params || {};
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(phoneNumberFromParams || "");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedProfilePic = await AsyncStorage.getItem("profilePicture");
        if (storedProfilePic) {
          console.log(
            "Profile picture loaded from AsyncStorage:",
            storedProfilePic
          );
          setProfilePic(storedProfilePic);
        }

        let phoneNum = phoneNumber;
        if (!phoneNum) {
          phoneNum = await AsyncStorage.getItem("phoneNumber");
          setPhoneNumber(phoneNum || "");
        }
        console.log(phoneNum);

        if (!phoneNum) {
          console.warn("Phone number is missing");
          return;
        }

        // Fetch user data from API
        const response = await axios.get(
          `https://travel.timestringssystem.com/api/getall/${phoneNum}`,
          {
            params: { phoneNumber: phoneNum },
          }
        );

        if (response.data && response.data.user) {
          const { firstName, lastName, profilePicture } = response.data.user;
          const fullName = `${firstName} ${lastName}`.trim();
          // console.log(fullName)
          setUserName(fullName);
          AsyncStorage.setItem("firstName");
          AsyncStorage.setItem("lastName");

          if (profilePicture && profilePicture !== storedProfilePic) {
            let imageUrl = profilePicture;
            if (!imageUrl.startsWith("http")) {
              const filename =
                imageUrl.split("\\").pop() || imageUrl.split("/").pop();
              imageUrl = `https://travel.timestringssystem.com/uploads/${filename}`;
            }
            await AsyncStorage.setItem("profilePicture", imageUrl);
            setProfilePic(imageUrl);
            console.log("Updated profile picture from API:", imageUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [phoneNumber]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out this amazing app: [Your App Link Here]",
      });
    } catch (error) {
      console.error("Error sharing:", error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userLog");
      await AsyncStorage.removeItem("phoneNumber");
      await AsyncStorage.removeItem("firstName");
      await AsyncStorage.removeItem("lastName");
      navigation.navigate("Start");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const menuItems = [
    {
      logo: require("../../Images/ride_history.png"),
      name: "Travel History",
      screen: "TravelHistory",
    },
    {
      logo: require("../../Images/consignments_history.png"),
      name: "Consignments History",
      screen: "ConsignmentsHistory",
    },
    {
      logo: require("../../Images/Earnings.png"),
      name: "Earnings",
      screen: "Earnings",
    },
    {
      logo: require("../../Images/Address Book.png"),
      name: "Address Book",
      screen: "AddressBook",
    },
  ];

  const otherItems = [
    {
      logo: require("../../Images/About Us.png"),
      name: "About Us",
      screen: "About Us",
    },
    {
      logo: require("../../Images/Help & Support.png"),
      name: "Help & Support",
      screen: "Help",
    },
    {
      logo: require("../../Images/Feedback Form.png"),
      name: "Feedback Form",
      screen: "Feedback",
    },
    {
      logo: require("../../Images/Privacy Policy.png"),
      name: "Privacy Policy",
      screen: "PrivacyPolicy",
    },
    {
      logo: require("../../Images/Terms & Conditions.png"),
      name: "Terms & Conditions",
      screen: "TermsCondition",
    },
  ];

  const specialItems = [
    {
      logo: require("../../Images/Share.png"),
      name: "Share this app",
      action: handleShare,
    },
    {
      logo: require("../../Images/login.png"),
      name: "Logout",
      action: handleLogout,
    },
  ];

  const allItems = [
    ...menuItems,
    { name: "Separator", isSeparator: true },
    ...otherItems,
    { name: "Separator", isSeparator: true },
    ...specialItems,
  ];

  const renderItem = ({ item }) => {
    if (item.isSeparator) {
      return <View style={styles.sectionSeparator} />;
    }

    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          if (item.action) {
            item.action();
          } else {
            navigation.navigate(item.screen, { phoneNumber });
          }
        }}
      >
        <Image source={item.logo} style={styles.menuLogo} />
        <Text
          style={[
            styles.menuText,
            item.name === "Logout" ? { color: "#FB344F" } : {},
          ]}
        >
          {item.name}
        </Text>
        {!["Share this app", "Logout"].includes(item.name) && (
          <Icon name="chevron-forward" size={24} color="#323232" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hi {userName || "User"}!</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile", { phoneNumber })}
              style={styles.editProfileContainer}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
              <Icon name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Image
            source={
              profilePic ? { uri: profilePic } : require("../../Images/kyc.png")
            }
            style={styles.profilePic}
            onError={() => {
              console.log(
                "Error loading profile image, falling back to default"
              );
              setProfilePic(null);
            }}
          />
        </View>

        {/* Menu Items */}
        <FlatList
          data={allItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.menuList}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#D83F3F", // Match the header color for a seamless look
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // Remove the fixed marginTop: 40
  },
  header: {
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? 10 : 10, // Reduced padding
    padding: 20,
    backgroundColor: "#D83F3F",
    justifyContent: "space-between",
    alignItems: "center",
    // Remove fixed height for more flexibility
  },
  greetingContainer: { flex: 1 },
  greeting: { fontSize: 20, color: "#fff", fontFamily: "Inter-Bold" },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f0f0f0", // Fallback background color
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  menuLogo: { width: 20, height: 20, marginRight: 15, resizeMode: "contain" },
  menuText: { flex: 1, fontSize: 16, color: "#333", fontFamily: "Inter-Bold" },
  sectionSeparator: { height: 10, backgroundColor: "#f1f1f1" },
  separator: { height: 1, backgroundColor: "#f1f1f1" },
  menuList: { marginTop: 20 },
  editProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 16,
    marginRight: 5,
    fontFamily: "Inter-Regular",
  },
});

export default Account;
