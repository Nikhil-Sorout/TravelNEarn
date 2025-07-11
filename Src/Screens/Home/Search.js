import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import {
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import { fetchLocations } from "../../API/Location"; // Correct import path for API function
import { 
  scale, 
  verticalScale, 
  moderateScale,
  responsiveFontSize, 
  responsivePadding,
  screenWidth,
  screenHeight 
} from "../../Utils/responsive";

const { width, height } = Dimensions.get("window");

const Search = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Travellers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fullFrom, setFullFrom] = useState("");
  const [fullTo, setFullTo] = useState("");
  const [date, setDate] = useState(new Date()); // Initialize with current date

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [goingSuggestions, setGoingSuggestions] = useState([]);
  const [leavingSuggestions, setLeavingSuggestions] = useState([]);
  const [fromSelected, setFromSelected] = useState(false); // Track if "Leaving from" is selected
  const [toSelected, setToSelected] = useState(false); // Track if "Going to" is selected
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Format display text to truncate long addresses
  const formatDisplayText = (text) => {
    const maxLength = screenWidth < 375 ? 25 : screenWidth < 390 ? 30 : 35;
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
    }
    return text;
  };

  const fetchSuggestions = async () => {
    try {
      if (from || to) {
        const data = await fetchLocations(from, to);
        setGoingSuggestions(data.goingSuggestions || []);
        setLeavingSuggestions(data.leavingSuggestions || []);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error.message);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!fromSelected || !toSelected) {
        fetchSuggestions();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [from, to]);

  // Auto-scroll when suggestions appear or input is focused
  useEffect(() => {
    if (isFromFocused || isToFocused) {
      // Delay to ensure the keyboard is shown
      setTimeout(() => {
        if (scrollViewRef.current) {
          const scrollY = screenHeight < 700 ? 200 : screenHeight < 800 ? 250 : 300;
          scrollViewRef.current.scrollTo({
            y: scrollY,
            animated: true
          });
        }
      }, 100);
    }
  }, [isFromFocused, isToFocused, goingSuggestions.length, leavingSuggestions.length]);



  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    const localDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    setDate(localDate); // raw Date object
    const formatDate = localDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSearchPress = () => {
    if (!from.trim()) {
      alert("Please enter your departure location.");
      return;
    }
    if (!to.trim()) {
      alert("Please enter your destination.");
      return;
    }
    if (from?.trim().toLowerCase() === to?.trim().toLowerCase()) {
      alert("Departure and destination cannot be the same.");
      return;
    }
    if (!date) {
      alert("Please select a valid date.");
      return;
    }

    // Use full addresses when available
    const fromAddress = fullFrom || from;
    const toAddress = fullTo || to;

    const formatDate = date.toLocaleDateString("en-CA");
    AsyncStorage.setItem("startingLocation", fromAddress.toString());
    AsyncStorage.setItem("goingLocation", toAddress.toString());
    AsyncStorage.setItem("searchingDate", date.toString());
    navigation.navigate(
      activeTab === "Travellers" ? "SearchRide" : "ConsignmentSearchPage",
      { from: fromAddress, to: toAddress, date: formatDate }
    );
  };

  const showPicker = () => {
    // if (Platform.OS === 'android') {
    setShowDatePicker(true);
    // }
  };

  const closeSuggestions = () => {
    setGoingSuggestions([]);
    setLeavingSuggestions([]);
    setIsFromFocused(false);
    setIsToFocused(false);
    setFromSelected(false);
    setToSelected(false);
    Keyboard.dismiss();
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      const lastReadTime = await AsyncStorage.getItem(
        "lastNotificationReadTime"
      );
      const baseUrl = await AsyncStorage.getItem('apiBaseUrl');
      if (phoneNumber) {
        const travelResponse = await fetch(
          `${baseUrl}n/getnotification/travel/${phoneNumber}`
        );
        const consignmentResponse = await fetch(
          `${baseUrl}n/getnotification/consignment/${phoneNumber}`
        );

        if (travelResponse.ok && consignmentResponse.ok) {
          const travelData = await travelResponse.json();
          const consignmentData = await consignmentResponse.json();

          let totalUnread = 0;

          if (lastReadTime) {
            const lastReadTimestamp = new Date(lastReadTime);

            const travelUnread = (travelData.notifications || []).filter(
              (n) => new Date(n.createdAt || Date.now()) > lastReadTimestamp
            ).length;

            const consignmentUnread = (
              consignmentData.notifications || []
            ).filter(
              (n) => new Date(n.createdAt || Date.now()) > lastReadTimestamp
            ).length;

            totalUnread = travelUnread + consignmentUnread;
          } else {
            totalUnread =
              (travelData.notifications || []).length +
              (consignmentData.notifications || []).length;
          }

          console.log(`Total unread notifications: ${totalUnread}`);
          setUnreadNotificationsCount(totalUnread);
        }
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadNotificationsCount();
      return () => { };
    }, [])
  );

  const handleNotificationPress = async () => {
    try {
      setUnreadNotificationsCount(0);

      const lastReadTimestamp = new Date().toISOString();
      await AsyncStorage.setItem("lastNotificationReadTime", lastReadTimestamp);

      navigation.navigate("Notification");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (screenHeight < 700 ? 80 : 100) : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <TouchableWithoutFeedback onPress={closeSuggestions}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <ImageBackground
                source={require("../../Images/background.png")}
                style={[
                  styles.textureBackground,
                  { width: "100%", height: "100%" },
                ]}
                resizeMode="cover"
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Travel n Earn</Text>
                  <Text style={styles.subHeader}>Search</Text>
                </View>

                {/* Notification Icon in top-right corner */}
                <TouchableOpacity
                  style={styles.notificationIconContainer}
                  onPress={handleNotificationPress}
                >
                  <Icon name="bell-o" size={moderateScale(25)} color="#fff" />
                  {unreadNotificationsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadNotificationsCount > 99
                          ? "99+"
                          : unreadNotificationsCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ImageBackground>
            </View>

            {/* Tab Section */}
            <View style={styles.tabContainer}>
              {["Travellers", "Consignments"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form Section */}
            <View
              style={[
                styles.formContainer,
                { 
                  marginHorizontal: screenWidth < 375 ? scale(10) : scale(20),
                  paddingHorizontal: screenWidth < 375 ? scale(15) : scale(20),
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Leaving From Input */}
              <View style={styles.inputContainer}>
                <View style={styles.bulletPointRed} />
                <TextInput
                  style={[styles.input, { textAlign: "left" }]}
                  placeholder={activeTab === "Travellers" ? "Leaving from" : "Sending from"}
                  placeholderTextColor="#aaa"
                  value={from}
                  numberOfLines={1}
                  ellipsizeMode="head"
                  multiline={false}
                  onChangeText={(text) => {
                    setFrom(text);
                    setFromSelected(false); // Allow re-entering locations
                  }}
                  onFocus={() => {
                    setIsFromFocused(true);
                    setIsToFocused(false); // Ensure only one is focused
                    setLeavingSuggestions([]); // Close other suggestions
                  }}
                  onBlur={() => {
                    // Delay blur to allow suggestion taps
                    setTimeout(() => setIsFromFocused(false), 150);
                  }}
                />
                {isFromFocused &&
                  goingSuggestions.length > 0 &&
                  !fromSelected && (
                    <TouchableWithoutFeedback onPress={() => {}}>
                      <View style={styles.suggestionsContainer}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                          contentContainerStyle={styles.suggestionScrollContent}
                        >
                          {goingSuggestions.map((item, index) => (
                            <TouchableOpacity
                              key={`from-${index}`}
                              style={styles.suggestionItem}
                              onPress={() => {
                                setFullFrom(item);
                                setFrom(formatDisplayText(item));
                                setGoingSuggestions([]);
                                setFromSelected(true);
                                setIsFromFocused(false);
                                Keyboard.dismiss();
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={styles.suggestionText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {goingSuggestions.length > 20 && (
                            <Text style={styles.suggestionsFooter}>
                              Showing first 20 suggestions...
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
              </View>

              {/* Going To Input */}
              <View style={styles.inputContainer}>
                <View style={styles.bulletPointGreen} />
                <TextInput
                  style={[styles.input, { textAlign: "left" }]}
                  placeholder={activeTab === "Travellers" ? "Going to" : "Sending to"}
                  placeholderTextColor="#aaa"
                  value={to}
                  numberOfLines={1}
                  ellipsizeMode="head"
                  multiline={false}
                  onChangeText={(text) => {
                    setTo(text);
                    setToSelected(false); // Allow re-entering locations
                  }}
                  onFocus={() => {
                    setIsToFocused(true);
                    setIsFromFocused(false);
                    setGoingSuggestions([]);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsToFocused(false), 150);
                  }}
                />
                {isToFocused &&
                  leavingSuggestions.length > 0 &&
                  !toSelected && (
                    <TouchableWithoutFeedback onPress={() => {}}>
                      <View style={styles.suggestionsContainer}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                          contentContainerStyle={styles.suggestionScrollContent}
                        >
                          {leavingSuggestions.map((item, index) => (
                            <TouchableOpacity
                              key={`to-${index}`}
                              style={styles.suggestionItem}
                              onPress={() => {
                                setFullTo(item);
                                setTo(formatDisplayText(item));
                                setLeavingSuggestions([]);
                                setToSelected(true);
                                setIsToFocused(false);
                                Keyboard.dismiss();
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={styles.suggestionText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {leavingSuggestions.length > 20 && (
                            <Text style={styles.suggestionsFooter}>
                              Showing first 20 suggestions...
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
              </View>

              {/* Date Picker with Calendar Icon */}
              <View style={styles.inputContainer}>
                <Icon
                  name="calendar"
                  size={moderateScale(20)}
                  color="#aaa"
                  style={styles.calendarIcon}
                />
                <TouchableOpacity style={styles.input} onPress={showPicker}>
                  <Text style={styles.inputText}>
                    {date
                      ? date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "Select Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  style={{ 
                    width: moderateScale(50), 
                    fontFamily: "Inter-Regular",
                    transform: [{ scale: screenWidth < 375 ? 0.9 : 1 }]
                  }}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChange}
                  minimumDate={new Date()} // Set minimum date to today
                  maximumDate={
                    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                  } // Set max date to 1 year from now
                />
              )}

              {/* Search Button */}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchPress}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background for better contrast
  },
  headerContainer: {
    height: verticalScale(480),
    minHeight: screenHeight * 0.55, // Ensure minimum height for smaller screens
    maxHeight: screenHeight * 0.65, // Prevent header from being too large on big screens
  },
  textureBackground: {
    width: "100%",
    height: "100%",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: moderateScale(46),
    fontFamily: "Inter-Bold",
    fontWeight: "900",
    marginBottom: verticalScale(10),
    marginTop: verticalScale(-200),
    textAlign: "center",
    paddingHorizontal: scale(20),
  },
  subHeader: {
    color: "white",
    fontSize: moderateScale(20),
    position: "absolute",
    bottom: "40%",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  notificationIconContainer: {
    position: "absolute",
    top: verticalScale(43),
    right: scale(20),
    padding: scale(8),
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: scale(8),
    alignSelf: "center",
    marginTop: verticalScale(-180),
    width: "90%",
    maxWidth: scale(350),
    minHeight: verticalScale(44), // Ensure minimum touch target size
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    alignItems: "center",
    borderRadius: scale(6),
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: moderateScale(14),
    fontFamily: "OpenSans-Bold",
    color: "white",
  },
  activeTabText: {
    color: "#D83F3F",
  },
  formContainer: {
    width: "90%",
    maxWidth: scale(350),
    backgroundColor: "#fff",
    marginVertical: verticalScale(20),
    padding: scale(20),
    borderRadius: scale(15),
    alignSelf: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(20),
    borderBottomWidth: 1.5,
    borderBottomColor: "#ddd",
    minHeight: verticalScale(50),
  },
  bulletPointRed: {
    width: scale(10),
    height: scale(10),
    backgroundColor: "#D83F3F",
    borderRadius: scale(5),
    marginRight: scale(10),
  },
  bulletPointGreen: {
    width: scale(10),
    height: scale(10),
    backgroundColor: "green",
    borderRadius: scale(5),
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: "Inter-Regular",
    paddingVertical: verticalScale(10),
    color: "#333",
    minHeight: verticalScale(40),
  },
  searchButton: {
    backgroundColor: "#D83F3F",
    paddingVertical: verticalScale(20),
    borderRadius: scale(15),
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  searchButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontFamily: "Inter-Bold",
  },
  calendarIcon: {
    marginRight: scale(10),
  },
  // Suggestions Styling
  suggestionsContainer: {
    position: "absolute",
    top: verticalScale(45),
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: verticalScale(200),
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(3),
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
    minHeight: verticalScale(44),
    justifyContent: "center",
  },
  suggestionText: {
    fontSize: moderateScale(15),
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  suggestionsFooter: {
    fontSize: moderateScale(12),
    color: "#888",
    textAlign: "center",
    paddingVertical: verticalScale(5),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  suggestionScrollContent: {
    flexGrow: 1,
  },
  inputText: {
    fontSize: moderateScale(16),
  },
  notificationBadge: {
    position: "absolute",
    right: scale(-6),
    top: verticalScale(-6),
    backgroundColor: "#FFD700",
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(4),
  },
  notificationBadgeText: {
    color: "#000",
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
});
