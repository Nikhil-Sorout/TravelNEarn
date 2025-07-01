import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const Profile = ({ navigation, route }) => {
  const { phoneNumber } = route.params || {};
  // AsyncStorage.getItem("phoneNumber");
  console.log(phoneNumber);

  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `https://travel.timestringssystem.com/api/getall/${phoneNumber}`,
          {
            params: { phoneNumber: phoneNum },
          }
        );
        console.log(response.data);
        if (response.data && response.data.user) {
          const { firstName, lastName, profilePicture } = response.data.user;
          setUserName(`${firstName} ${lastName}`.trim());
          setProfilePic(profilePicture || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      }
    };
    if (phoneNumber) fetchUserData();
  }, [phoneNumber]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.image],
      allowsEditing: true,
      aspect: [1, 1],
      Kualitas: [0, 8],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", {
        uri,
        name: `profile_${phoneNumber}.jpg`,
        type: "image/jpeg",
      });

      const response = await axios.post(
        `https://travel.timestringssystem.com/api/upload-profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            phoneNumber,
          },
        }
      );

      if (response.data && response.data.profilePicture) {
        setProfilePic(response.data.profilePicture);
        await AsyncStorage.setItem(
          "userDetails",
          JSON.stringify({
            phoneNumber,
            profilePicture: response.data.profilePicture,
          })
        );
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error("Error uploading image:", error.message);
      Alert.alert("Error", "Failed to upload image.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              profilePic &&
              (profilePic.startsWith("http") || profilePic.startsWith("https"))
                ? { uri: profilePic }
                : require("../../Images/kyc.png")
            }
            style={styles.profilePic}
            onError={() => setProfilePic(null)}
          />
          <Text style={styles.changePicText}>Change Picture</Text>
        </TouchableOpacity>
        <Text style={styles.userName}>{userName || "User"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePicText: {
    color: "#D83F3F",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default Profile;
