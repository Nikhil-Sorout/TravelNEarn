import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState, useEffect } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import commonStyles from "../../styles";
import { 
  scale, 
  verticalScale, 
  moderateScale,
  moderateVerticalScale,
  responsiveFontSize, 
  responsivePadding,
  responsiveDimensions,
  screenWidth,
  screenHeight
} from "../../Utils/responsive";

const DEFAULT_PROFILE_PHOTO =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const Verification = ({ route }) => {
  const navigation = useNavigation();
  const { phoneNumber } = route.params;

  const [profilePhotoUri, setProfilePhotoUri] = useState(DEFAULT_PROFILE_PHOTO);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(null); // State to track if user is new

  // Check if user already exists on component mount
  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const response = await fetch(
          `https://travel.timestringssystem.com/api/user/${phoneNumber}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // User exists
          const userData = await response.json();
          setIsNewUser(false);
          // Optionally pre-fill the form with existing data
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setEmail(userData.email || "");
          if (userData.profilePicture) {
            setProfilePhotoUri(userData.profilePicture);
          }
        } else {
          // User does not exist (e.g., 404)
          setIsNewUser(true);
        }
      } catch (error) {
        console.error("Error checking user existence:", error);
        // Assume user is new if there's an error (e.g., network issue)
        setIsNewUser(true);
      }
    };

    checkUserExists();
  }, [phoneNumber]);

  // Function to select an image
  const selectImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setProfilePhotoUri(result.assets[0].uri);
    } else {
      Alert.alert("Action Cancelled", "No image was selected.");
    }
  }, []);
  console.log(isNewUser)
  // Function to save profile with FormData (only for new users)
  const saveProfile = useCallback(async () => {
    if (isNewUser === null) {
      Alert.alert("Loading", "Please wait while we check your profile status.");
      return;
    }

    // If user is not new, skip profile creation and navigate to Region
    if (!isNewUser) {
      // Fetch user data again or use stored data to get userId
      try {
        const baseurl = await AsyncStorage.getItem("apiBaseUrl")
        const response = await fetch(
          `${baseurl}api/user/${phoneNumber}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const userData = await response.json();
          await AsyncStorage.setItem("userLog", "1");
          await AsyncStorage.setItem("firstName", userData.firstName || "");
          await AsyncStorage.setItem("lastName", userData.lastName || "");
          await AsyncStorage.setItem("email", userData.email || "");
          if (userData.profilePicture) {
            await AsyncStorage.setItem(
              "profilePicture",
              userData.profilePicture
            );
          }
          navigation.navigate("Region", { userId: userData._id });
        } else {
          Alert.alert("Error", "Failed to fetch user data.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to fetch user data. Please try again.");
      }
      return;
    }

    // Proceed with profile creation for new users
    if (!firstName || !lastName) {
      Alert.alert(
        "Validation Error",
        "Full Names and Profile Picture are required."
      );
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    // Only append email if it's provided (not empty)
    if (email) {
      formData.append("email", email);
    }
    formData.append("phoneNumber", phoneNumber);

    // Save the profile picture URI to AsyncStorage right away
    if (profilePhotoUri && profilePhotoUri !== DEFAULT_PROFILE_PHOTO) {
      await AsyncStorage.setItem("profilePicture", profilePhotoUri);

      // Prepare file for ImageKit upload
      const fileName = profilePhotoUri.split("/").pop();
      const fileType = fileName.split(".").pop();

      // Create the file object in the format expected by the server
      formData.append("profilePicture", {
        uri: profilePhotoUri,
        name: fileName || `profile_${Date.now()}.${fileType || "jpg"}`,
        type: `image/${fileType || "jpeg"}`,
      });

      console.log("Attaching profile image to request:", fileName);
    }

    console.log("Sending form data to API");

    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(`${baseurl}api/create`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          // Remove any other Content-Type headers to avoid conflicts
        },
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        Alert.alert("Error", responseData.message || "Something went wrong.");
        return;
      }

      Alert.alert("Success", "Profile updated successfully.");

      await AsyncStorage.setItem("userLog", "1");
      await AsyncStorage.setItem("firstName", firstName.toString());
      await AsyncStorage.setItem("lastName", lastName.toString());
      await AsyncStorage.setItem("email", email || "");

      navigation.navigate("Region", { userId: responseData.user?._id });
    } catch (error) {
      console.error("Save Profile Error:", error);
      Alert.alert("Error", "Failed to save the profile. Please try again.");
    }
  }, [
    firstName,
    lastName,
    email,
    phoneNumber,
    profilePhotoUri,
    navigation,
    isNewUser,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoContainer}>
            <Image
              source={{ uri: profilePhotoUri }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
              <Image 
                source={require("../../Images/Vector.png")} 
                style={styles.editIconImage}
              />
            </TouchableOpacity>
            <Text style={styles.profilePhotoText}>Profile Photo</Text>
          </View>

          {/* Phone Number Section */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Phone Number </Text>
              <View style={styles.verifiedContainer}>
                <Icon 
                  name="verified" 
                  size={responsiveDimensions.icon.medium} 
                  color={commonStyles.Colors.successTextColor} 
                />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={phoneNumber}
              placeholderTextColor={commonStyles.Colors.secondColor}
              editable={false}
            />
          </View>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter First Name"
              placeholderTextColor={commonStyles.Colors.secondColor}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Last Name"
              placeholderTextColor={commonStyles.Colors.secondColor}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Email"
              placeholderTextColor={commonStyles.Colors.secondColor}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(40),
  },
  innerContainer: { 
    paddingHorizontal: responsivePadding.horizontal,
    paddingTop: responsivePadding.vertical,
    paddingBottom: responsivePadding.medium,
  },
  profilePhotoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(30),
    marginTop: verticalScale(20),
  },
  profilePhoto: { 
    width: responsiveDimensions.logo.width, 
    height: responsiveDimensions.logo.height, 
    borderRadius: scale(60),
    borderWidth: 2,
    borderColor: commonStyles.Colors.primary,
  },
  editIcon: {
    position: "absolute",
    bottom: verticalScale(50),
    left: "60%",
    backgroundColor: commonStyles.Colors.linkColor,
    borderRadius: scale(15),
    padding: scale(5),
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editIconImage: {
    width: scale(20),
    height: scale(20),
  },
  profilePhotoText: {
    marginTop: verticalScale(10),
    fontSize: responsiveFontSize.md,
    color: commonStyles.Colors.blackColor,
    fontWeight: "500",
    fontFamily: commonStyles.fonts.interMedium,
  },
  label: {
    fontSize: responsiveFontSize.md,
    color: commonStyles.Colors.secondColor,
    marginBottom: verticalScale(10),
    fontWeight: "bold",
    fontFamily: commonStyles.fonts.interSemiBold,
  },
  inputContainer: { 
    marginBottom: verticalScale(20) 
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  verifiedText: {
    color: commonStyles.Colors.successTextColor,
    fontWeight: "bold",
    marginLeft: scale(5),
    fontSize: responsiveFontSize.sm,
    fontFamily: commonStyles.fonts.interSemiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: responsiveFontSize.md,
    color: commonStyles.Colors.blackColor,
    fontFamily: commonStyles.fonts.interRegular,
    backgroundColor: "#fff",
  },
  disabledInput: { 
    backgroundColor: "#f0f0f0", 
    color: commonStyles.Colors.secondColor,
    fontFamily: commonStyles.fonts.interMedium,
  },
  saveButton: {
    backgroundColor: commonStyles.Colors.primary,
    paddingVertical: verticalScale(15),
    borderRadius: scale(8),
    alignItems: "center",
    marginTop: verticalScale(30),
    marginBottom: verticalScale(20),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: { 
    color: "#fff", 
    fontSize: responsiveFontSize.lg, 
    fontWeight: "bold",
    fontFamily: commonStyles.fonts.interBold,
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: commonStyles.Colors.successBackgroundColor,
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
    marginBottom: verticalScale(5),
  },
});

export default Verification;
