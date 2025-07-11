import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  // SafeAreaView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";    
import Icon from "react-native-vector-icons/Ionicons";
import verificationImage from "../../Images/kyc.png";
import commonStyles from "../../styles";
import axios from "axios";
import * as FileSystem from "expo-file-system";

const DEFAULT_PROFILE_PHOTO =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const API_URL = "https://travel.timestringssystem.com/api/update";
const FETCH_API_URL = "https://travel.timestringssystem.com/api/getall";
const { width } = Dimensions.get("window");

const Profile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber: phoneNumberFromParams } = route.params || {};

  const [profilePhotoUri, setProfilePhotoUri] = useState(DEFAULT_PROFILE_PHOTO);
  const [profileData, setProfileData] = useState({
    profileImage: DEFAULT_PROFILE_PHOTO,
    email: "",
    phoneNumber: phoneNumberFromParams || "",
    firstName: "",
    lastName: "",
    accountNumber: "",
    accountName: "",
    ifscCode: "",
    bankName: "",
    branch: "",
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // First try to load from AsyncStorage
        const storedProfilePicture =
          await AsyncStorage.getItem("profilePicture");
        if (storedProfilePicture) {
          setProfilePhotoUri(storedProfilePicture);
          setProfileData((prev) => ({
            ...prev,
            profileImage: storedProfilePicture,
          }));
          console.log("Loaded profile picture from AsyncStorage");
        }

        // Load other profile data from AsyncStorage
        const firstName = (await AsyncStorage.getItem("firstName")) || "";
        const lastName = (await AsyncStorage.getItem("lastName")) || "";
        const email = (await AsyncStorage.getItem("email")) || "";

        setProfileData((prev) => ({
          ...prev,
          firstName,
          lastName,
          email,
        }));

        let phoneNum = phoneNumberFromParams;
        if (!phoneNum) {
          phoneNum = await AsyncStorage.getItem("phoneNumber");
          setProfileData((prevState) => ({
            ...prevState,
            phoneNumber: phoneNum || "",
          }));
        }

        if (phoneNum) {
          fetchProfileFromAPI(phoneNum);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
  }, [phoneNumberFromParams]);

  const fetchProfileFromAPI = async (phoneNum) => {
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const response = await axios.get(
        `${baseurl}api/getall/${phoneNum}`
      );
      console.log("Fetch API Response:", JSON.stringify(response.data));

      if (response.data && response.data.user) {
        const { firstName, lastName, email } = response.data.user;

        // Save to AsyncStorage
        if (firstName) await AsyncStorage.setItem("firstName", firstName);
        if (lastName) await AsyncStorage.setItem("lastName", lastName);
        if (email) await AsyncStorage.setItem("email", email);

        // Update state with retrieved data
        setProfileData((prevState) => ({
          ...prevState,
          firstName: firstName || prevState.firstName,
          lastName: lastName || prevState.lastName,
          email: email || prevState.email,
        }));

        console.log("Profile data saved to AsyncStorage");
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  const selectImage = useCallback(async () => {
    console.log("selectImage");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission Denied", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      // Store the URI temporarily to display in the UI
      setProfilePhotoUri(uri);
      setProfileData((prevState) => ({ ...prevState, profileImage: uri }));

      // Inform user the image is ready for upload
      alert(
        "Image Selected",
        "Your image will be uploaded when you save your profile."
      );
    } else {
      alert("Action Cancelled", "No image was selected.");
    }
  }, []);

  const saveProfile = useCallback(async () => {
    try {
      const phone = profileData.phoneNumber;
      if (!phone) {
        alert("Error", "Phone number is required.");
        return;
      }

      // Check if we need to handle a new image
      const isNewImage =
        profilePhotoUri !== DEFAULT_PROFILE_PHOTO &&
        !profilePhotoUri.startsWith("http");

      if (isNewImage) {
        // We have a new local image, we need to use FormData for multipart/form-data
        try {
          console.log("Uploading new profile image to ImageKit...");

          // FormData object for multipart/form-data request
          const formData = new FormData();

          // Add the image file
          const fileInfo = await FileSystem.getInfoAsync(profilePhotoUri);
          if (!fileInfo.exists) {
            throw new Error("File does not exist");
          }

          // Get file name and extension
          const fileName = profilePhotoUri.split("/").pop();
          const fileType = fileName.split(".").pop().toLowerCase();
          const mimeType =
            fileType === "jpg" ? "image/jpeg" : `image/${fileType}`;

          // Add file to formData - MUST use "profilePicture" to match the backend upload.single("profilePicture")
          formData.append("profilePicture", {
            uri: profilePhotoUri,
            type: mimeType,
            name: `profile_${phone}_${Date.now()}.${fileType}`,
          });

          // Add profile data to formData - use camelCase to match backend expectations
          formData.append("firstName", profileData.firstName);
          formData.append("lastName", profileData.lastName);
          formData.append("email", profileData.email);
          formData.append("phoneNumber", profileData.phoneNumber);
          formData.append("accountNumber", profileData.accountNumber);
          formData.append("accountName", profileData.accountName);
          formData.append("ifscCode", profileData.ifscCode);
          formData.append("bankName", profileData.bankName);
          formData.append("branch", profileData.branch);

          console.log("Sending image upload request...");

          // Send request with image file
          const baseurl = await AsyncStorage.getItem("apiBaseUrl");
          const response = await fetch(
            `${baseurl}api/update/${phone}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "multipart/form-data",
              },
              body: formData,
            }
          );

          // Parse JSON response - THIS WAS MISSING
          const responseData = await response.json();

          console.log("Save API Response:", responseData);

          if (!response.ok) {
            throw new Error(responseData.message || "Failed to update profile");
          }

          // Update state with the ImageKit URL if available
          if (responseData.user && responseData.user.profilePicture) {
            setProfilePhotoUri(responseData.user.profilePicture);
            await AsyncStorage.setItem(
              "profilePicture",
              responseData.user.profilePicture
            );
          }
        } catch (error) {
          console.error("Image upload error:", error);
          throw new Error("Failed to upload profile picture: " + error.message);
        }
      } else {
        // Use regular JSON request
        const requestData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          accountNumber: profileData.accountNumber,
          accountName: profileData.accountName,
          ifscCode: profileData.ifscCode,
          bankName: profileData.bankName,
          branch: profileData.branch,
        };

        // Add ProfilePicture if it's not the default
        if (profilePhotoUri !== DEFAULT_PROFILE_PHOTO) {
          requestData.profilePicture = profilePhotoUri;
        }

        const response = await fetch(
          `https://travel.timestringssystem.com/api//update/${phone}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          }
        );

        const responseData = await response.json();
        console.log("Save API Response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to update profile");
        }
      }

      // Save to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem("firstName", profileData.firstName),
        AsyncStorage.setItem("lastName", profileData.lastName),
        AsyncStorage.setItem("email", profileData.email),
        AsyncStorage.setItem("phoneNumber", profileData.phoneNumber),
      ]);

      alert("Success", "Profile saved successfully!");
    } catch (error) {
      console.error("Save Profile Error:", error);
      alert(
        "Error",
        "Failed to save profile. Please try again: " + error.message
      );
    }
  }, [profileData, profilePhotoUri]);

  const handleStartVerification = () => {
    navigation.navigate("DLTScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#D32F2F" barStyle="light-content" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.innerContainer}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={{ uri: profilePhotoUri }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
              <Image source={require("../../Images/Vector.png")} />
            </TouchableOpacity>
            <Text style={styles.profilePhotoText}>Profile Photo</Text>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <TextInputField
            label="Email"
            value={profileData.email}
            onChangeText={(text) =>
              setProfileData((prevState) => ({ ...prevState, email: text }))
            }
            editable={true} // Allow email to be editable
          />
          <TextInputField
            label="Phone Number"
            value={profileData.phoneNumber}
            editable={false}
          />
          <TextInputField
            label="First Name"
            value={profileData.firstName}
            onChangeText={(text) =>
              setProfileData((prevState) => ({ ...prevState, firstName: text }))
            }
          />
          <TextInputField
            label="Last Name"
            value={profileData.lastName}
            onChangeText={(text) =>
              setProfileData((prevState) => ({ ...prevState, lastName: text }))
            }
          />
        </View>

        {/* Verification Section */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>
            Profile Verification (KYC)
          </Text>
          <Image source={verificationImage} style={styles.verificationImage} />
          <View style={styles.verificationContainer}>
            {[
              "Upload Driving License",
              "Upload Aadhaar Card/Voter ID/Passport",
              "Take a Selfie Photo",
            ].map((step, index) => (
              <Text key={index} style={styles.verificationStep}>
                {`${index + 1}. ${step}`}
              </Text>
            ))}
          </View>

          {/* Start Verification Button */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleStartVerification}
            >
              <Text style={styles.saveButtonText}>Start Verification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bank Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account Details</Text>
          {[
            {
              label: "Account Number",
              value: profileData.accountNumber,
              field: "accountNumber",
            },
            {
              label: "Account Name",
              value: profileData.accountName,
              field: "accountName",
            },
            {
              label: "IFSC Code",
              value: profileData.ifscCode,
              field: "ifscCode",
            },
            {
              label: "Bank Name",
              value: profileData.bankName,
              field: "bankName",
            },
            {
              label: "Branch",
              value: profileData.branch,
              field: "branch",
            },
          ].map(({ label, value, field }) => (
            <TextInputField
              key={field}
              label={label}
              value={value || ""}
              onChangeText={(text) =>
                setProfileData((prevState) => ({ ...prevState, [field]: text }))
              }
            />
          ))}
        </View>

        {/* Save Profile Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const TextInputField = ({ label, value, onChangeText, editable = true }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={`Enter ${label}`}
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  innerContainer: { padding: 20 },
  profilePhotoContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  profilePhoto: { width: 120, height: 120, borderRadius: 60 },
  editIcon: {
    position: "absolute",
    bottom: 50,
    left: "60%",
    backgroundColor: "#006EFF",
    borderRadius: 15,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  profilePhotoText: {
    marginTop: 10,
    fontSize: 16,
    color: commonStyles.Colors.blackColor,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontSize: 14, color: "#555", marginBottom: 5 },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    backgroundColor: "#f9f9f9",
  },
  verificationSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  verificationTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  verificationImage: { width: "100%", height: 200, resizeMode: "contain" },
  verificationContainer: { paddingLeft: 10, marginBottom: 10 },
  verificationStep: { fontSize: 14, marginBottom: 5 },
  saveButtonContainer: { alignItems: "center", paddingVertical: 20 },
  saveButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 100,
    borderRadius: 5,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default Profile;
