import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import commonStyles from "../../styles";

const logoImage = require("../../Images/logow.png");

const Otp = ({ navigation, route }) => {
  const { phoneNumber, otpsend } = route.params;

  const formatPhoneWithCountryCode = (fullNumber) => {
    if (!fullNumber) return "";

    if (fullNumber.startsWith("+")) {
      if (fullNumber.startsWith("+91") && fullNumber.length >= 13) {
        return `(+91) ${fullNumber.substring(3)}`;
      }

      const match = fullNumber.match(/^\+(\d{1,3}?)(\d+)$/);

      if (match && match.length === 3) {
        const countryCode = match[1];
        const number = match[2];
        return `(+${countryCode}) ${number}`;
      }
    }

    return fullNumber;
  };

  const otpLength = 6;
  const [otp, setOtp] = useState(Array(otpLength).fill(""));
  const [resendTime, setResendTime] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTime > 0) {
      const timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTime]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      handleConfirm(newOtp.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    setResendTime(60);
    Toast.show({ type: "info", text1: "Info", text2: "OTP has been resent!" });
  };

  const handleConfirm = async (finalOtp) => {
    try {
      const response = await fetch(
        "https://travel.timestringssystem.com/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, otp: finalOtp }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invalid OTP");

      await AsyncStorage.setItem("userLog", "1");
      const userDetails = data.userDetails || {};

      if (data.isNewUser) {
        await AsyncStorage.setItem("userDetails", JSON.stringify(userDetails));
        navigation.navigate("Verification", { user: userDetails, phoneNumber });
      } else {
        await AsyncStorage.setItem("userDetails", JSON.stringify(userDetails));
        navigation.navigate("Navigation");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to verify OTP.",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logoImage} />
              <Text style={styles.welcomeText}>Welcome</Text>
            </View>

            <Text style={styles.infoText}>
              Enter the code sent to{" "}
              <Text style={styles.phoneNumber}>
                {formatPhoneWithCountryCode(phoneNumber)}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendTime > 0}
            >
              <Text
                style={[
                  styles.resendText,
                  {
                    color:
                      resendTime > 0 ? "#777" : commonStyles.Colors.linkColor,
                  },
                ]}
              >
                {resendTime > 0 ? `Resend OTP in ${resendTime}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                otp.some((digit) => digit === "") && styles.disabledButton,
              ]}
              onPress={() => handleConfirm(otp.join(""))}
              disabled={otp.some((digit) => digit === "")}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    marginBottom: 35,
  },
  logoImage: { width: 42, height: 42, marginRight: 10 },
  welcomeText: { fontSize: 36, fontWeight: "bold", color: "#D83F3F" },
  infoText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
    fontFamily: "Inter-Bold",
  },
  phoneNumber: { fontWeight: "700", color: "#444" },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 58,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    textAlign: "center",
    fontSize: 22,
    borderRadius: 10,
    elevation: 2,
  },
  resendText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  confirmText: { fontSize: 18, fontWeight: "500", color: "#FFF" },
  disabledButton: { backgroundColor: "#BBB" },
  backButton: { position: "absolute", top: 10, left: 10, zIndex: 1 },
});

export default Otp;
