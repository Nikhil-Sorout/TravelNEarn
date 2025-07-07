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
  StatusBar,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

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
          setProfilePic(storedProfilePic);
        }

        let phoneNum = phoneNumber;
        if (!phoneNum) {
          phoneNum = await AsyncStorage.getItem("phoneNumber");
          setPhoneNumber(phoneNum || "");
        }

        if (!phoneNum) {
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
          setUserName(fullName);
          AsyncStorage.setItem("firstName", firstName);
          AsyncStorage.setItem("lastName", lastName);

          if (profilePicture && profilePicture !== storedProfilePic) {
            let imageUrl = profilePicture;
            if (!imageUrl.startsWith("http")) {
              const filename =
                imageUrl.split("\\").pop() || imageUrl.split("/").pop();
              imageUrl = `https://travel.timestringssystem.com/uploads/${filename}`;
            }
            await AsyncStorage.setItem("profilePicture", imageUrl);
            setProfilePic(imageUrl);
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
      // Handle share error silently
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
      // Handle logout error silently
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

  const renderItem = ({ item, index }) => {
    let extraStyle = {};
    if (item.name === "Share this app") {
      extraStyle = styles.specialSpacing;
    } else if (item.name === "Logout") {
      extraStyle = styles.logoutSpacing;
    }
    return (
      <TouchableOpacity
        style={[styles.menuItem, extraStyle]}
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
          <Icon name="chevron-forward" size={moderateScale(24)} color="#323232" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hi {userName || "User"}!</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile", { phoneNumber })}
              style={styles.editProfileContainer}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
              <Icon name="chevron-forward" size={moderateScale(20)} color="white" />
            </TouchableOpacity>
          </View>
          <Image
            source={
              profilePic ? { uri: profilePic } : require("../../Images/kyc.png")
            }
            style={styles.profilePic}
            onError={() => {
              setProfilePic(null);
            }}
          />
        </View>

        {/* Menu Items Group 1 */}
        <View style={styles.menuGroupCard}>
          {menuItems.map((item, idx) => renderItem({ item, index: idx }))}
        </View>
        <View style={styles.sectionSeparator} />
        {/* Menu Items Group 2 */}
        <View style={styles.menuGroupCard}>
          {otherItems.map((item, idx) => renderItem({ item, index: idx }))}
        </View>
        <View style={styles.sectionSeparator} />
        {/* Menu Items Group 3 (special) */}
        <View style={styles.menuGroupCard}>
          {specialItems.map((item, idx) => renderItem({ item, index: idx }))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#D83F3F",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? verticalScale(10) : verticalScale(10),
    padding: scale(20),
    backgroundColor: "#D83F3F",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: verticalScale(80),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingContainer: { 
    flex: 1,
    paddingRight: scale(10),
  },
  greeting: { 
    fontSize: moderateScale(20), 
    color: "#fff", 
    fontFamily: "Inter-Bold",
    marginBottom: verticalScale(5),
  },
  profilePic: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f0f0f0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(15),
    minHeight: verticalScale(60),
    backgroundColor: "#fff",
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuLogo: { 
    width: scale(20), 
    height: scale(20), 
    marginRight: scale(15), 
    resizeMode: "contain" 
  },
  menuText: { 
    flex: 1, 
    fontSize: moderateScale(16), 
    color: "#333", 
    fontFamily: "Inter-Bold" 
  },
  // sectionSeparator: {
  //   height: verticalScale(16),
  //   backgroundColor: "#E5E5E5",
  //   width: "100%",
  //   marginVertical: verticalScale(8),
  // },
  separator: { 
    height: 1, 
    backgroundColor: "transparent" 
  },
  menuList: { 
    marginTop: verticalScale(20),
    paddingHorizontal: width < 375 ? scale(10) : scale(20),
  },
  editProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  editProfileText: {
    color: "#fff",
    fontSize: moderateScale(16),
    marginRight: scale(5),
    fontFamily: "Inter-Regular",
  },
  specialSpacing: {
    marginTop: verticalScale(18),
  },
  logoutSpacing: {
    marginTop: verticalScale(10),
  },
  menuGroupCard: {
    backgroundColor: "#fff",
    borderRadius: scale(10),
    marginHorizontal: scale(2),
    marginBottom: verticalScale(8),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
});

export default Account;
