import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import logo from "../../Images/logo.png"; // Import the local image
import backgroundImage from "../../Images/Pattern.png"; // Replace with your background image path
import commonStyles from "../../styles"; // Import common styles for fonts

const Start = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.logoContainer}>
        <Image
          source={logo} // Use the imported logo
          style={styles.logo}
        />
        <Text style={styles.title}>Travel & Earn</Text>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Terms")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{" "}
            <Text style={styles.linkText}>Terms of Service</Text>,{" "}
            <Text style={styles.linkText}>Privacy Policy</Text>, and{" "}
            <Text style={styles.linkText}>Content Policy</Text>.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E73D48", // Red background as a fallback
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backgroundImage: {
    resizeMode: "cover", // Ensures the image covers the full background
    opacity: 0.9, // Slight opacity to keep the background clear and visible
    height: "95%",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 129,
    height: 129,
    marginBottom: 20,
    marginTop: -20,
  },
  title: {
    fontSize: 39,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 10,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    width: "100%",
  },
  button: {
    backgroundColor: "#FFFFFF",
    width: 361,
    height: 45,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#E73D48",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerTextContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    width: "113%",
  },
  footerText: {
    color: "#E73D48",
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    textDecorationLine: "underline",
  },
});

export default Start;
