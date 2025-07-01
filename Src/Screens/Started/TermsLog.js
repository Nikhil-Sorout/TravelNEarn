import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
} from "react-native";
import { Button, Checkbox } from "react-native-paper";
import RNSimData from "react-native-sim-data";
import Ionicons from "react-native-vector-icons/Ionicons";

import commonStyles from "../../styles";

const logoImage = require("../../Images/logow.png");

const countries = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
];

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isModalVisible, setModalVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPhoneNumber();
  }, []);

  const fetchPhoneNumber = async () => {
    try {
      const simData = RNSimData.getSimInfo();
      console.log("SIM Data:", simData);

      const number =
        simData?.sim1?.phoneNumber || simData?.sim2?.phoneNumber || "";
      if (number) {
        setPhoneNumber(number.replace("+91", ""));
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  const validateInput = () => {
    if (/^\d{10}$/.test(phoneNumber)) {
      return true;
    }
    setErrorMessage("Please enter a valid phone number");
    return false;
  };

  const handleNextPress = async () => {
    if (!validateInput()) return;

    setErrorMessage("");
    setLoading(true);

    try {
      const formattedPhoneNumber = `${selectedCountry.code}${phoneNumber}`;

      const response = await fetch(
        "https://travel.timestringssystem.com/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
        }
      );

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong.");
      }

      alert(formattedPhoneNumber);

      // Save phone number to AsyncStorage
      await AsyncStorage.setItem("phoneNumber", formattedPhoneNumber);
      await AsyncStorage.setItem(
        "isNewUser",
        String(responseData.is_newuser || "")
      );

      if (responseData.is_new_user == false) {
        await AsyncStorage.setItem(
          "firstName",
          String(responseData.firstName || "")
        );
        await AsyncStorage.setItem(
          "lastName",
          String(responseData.lastName || "")
        );
      }

      // Navigate to OTP screen with phone number and OTP
      navigation.navigate("Otp", {
        phoneNumber: formattedPhoneNumber,
        otpsend: responseData.otp,
      });
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Terms and Conditions Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.bottomSheet}>
            <Text style={styles.title}>Terms & Conditions</Text>
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
            >
              <Text style={styles.text}>
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis. Tempus leo eu aenean sed diam
                urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum
                egestas. Iaculis massa nisl malesuada lacinia integer nunc
                posuere. Ut hendrerit semper vel class aptent taciti sociosqu.
                Ad litora torquent per conubia nostra inceptos himenaeos. Lorem
                ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis. Tempus leo eu aenean sed diam
                urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum
                egestas. Iaculis massa nisl malesuada lacinia integer nunc
                posuere. Ut hendrerit semper vel class aptent taciti sociosqu.
                Ad litora torquent per conubia nostra inceptos himenaeos.
              </Text>
            </ScrollView>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={isChecked ? "checked" : "unchecked"}
                onPress={() => setIsChecked(!isChecked)}
                color="#D83F3F"
              />
              <Text style={styles.checkboxText}>
                I accept the terms and conditions
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setModalVisible(false)}
              disabled={!isChecked}
              style={[
                styles.submitButton,
                {
                  backgroundColor: isChecked
                    ? commonStyles.Colors.primary
                    : "#ccc",
                },
              ]}
            >
              Submit
            </Button>
          </View>
        </View>
      </Modal>

      {/* Welcome Screen Content */}
      <View style={styles.logoContainer}>
        <Image source={logoImage} style={styles.logoImage} />
        <Text style={styles.welcomeText}>Welcome</Text>
      </View>

      <Text style={styles.label}>Enter Phone Number</Text>

      <View style={styles.unifiedInputContainer}>
        <TouchableOpacity
          style={styles.countryCodeSection}
          onPress={() => setShowCountryList(!showCountryList)}
        >
          <Text style={styles.countryCodeText}>
            {selectedCountry.flag} {selectedCountry.code}
          </Text>
          <Ionicons
            name={showCountryList ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TextInput
          style={styles.phoneNumberSection}
          placeholder="Enter Phone Number"
          value={phoneNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "");
            setPhoneNumber(cleaned);
            setErrorMessage("");
          }}
          keyboardType="phone-pad"
          returnKeyType="done"
        />
      </View>

      {showCountryList && (
        <View style={styles.countryListContainer}>
          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            style={styles.countryList}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryList(false);
                }}
              >
                <Text style={styles.countryItemText}>
                  {item.flag} {item.country} ({item.code})
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: phoneNumber ? "#D83F3F" : "#ccc" },
        ]}
        disabled={!phoneNumber || loading}
        onPress={handleNextPress}
      >
        <Text style={styles.nextButtonText}>
          {loading ? "Loading..." : "Next"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        By tapping next you are creating an account and you agree to{" "}
        <Text style={styles.link}>Account Terms</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: { width: 42, height: 42, marginRight: 10 },
  welcomeText: { fontSize: 42, fontWeight: "bold", color: "#D83F3F" },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: commonStyles.Colors.blackColor,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  errorText: { color: "red", fontSize: 14, marginBottom: 10 },
  nextButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  footerText: {
    fontSize: 14,
    color: commonStyles.Colors.textColor,
    marginTop: 20,
    textAlign: "left",
  },
  link: { color: commonStyles.Colors.linkColor },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%", // Limit the height of the modal
  },
  title: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
    color: "#333",
  },
  content: {
    maxHeight: 300, // Fixed height for the ScrollView
    marginBottom: 15,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    fontFamily: "Inter-Regular",
    textAlign: "left",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkboxText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  submitButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    borderRadius: 8,
  },
  backButton: { position: "absolute", top: 70, left: 20, zIndex: 1 },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#f8f8f8",
    width: 90,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
    marginRight: 4,
  },
  phoneNumberInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  countryListContainer: {
    position: "absolute",
    top: height * 0.51,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countryList: {
    maxHeight: 200,
  },
  countryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  countryItemText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  unifiedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  countryCodeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    height: "100%",
    minWidth: 90,
  },
  divider: {
    height: "60%",
    width: 1,
    backgroundColor: "#ccc",
  },
  phoneNumberSection: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
});

export default WelcomeScreen;
