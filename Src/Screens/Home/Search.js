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
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import { fetchLocations } from "../../API/Location"; // Correct import path for API function

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
  const [formattedDate, setFormattedDate] = useState("");

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
    if (text && text.length > 35) {
      return text.substring(0, 32) + "...";
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
          scrollViewRef.current.scrollTo({
            y: 300, // Adjust this value based on your layout
            animated: true
          });
        }
      }, 100);
    }
  }, [isFromFocused, isToFocused, goingSuggestions.length, leavingSuggestions.length]);

  const clearInput = (field) => {
    if (field === "from") {
      setFrom("");
      setFullFrom("");
      setGoingSuggestions([]);
      setFromSelected(false);
    } else {
      setTo("");
      setFullTo("");
      setLeavingSuggestions([]);
      setToSelected(false);
    }
  };

  const onChange = (event, selectedDate) => {
    console.log("onChange", event, selectedDate);
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    const localDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    setDate(localDate); // raw Date object
    console.log("localDate", localDate);
    const formatDate = localDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  
    console.log("Formatted Date:", formatDate);
    setFormattedDate(formatDate); // for display
  };

  const handleSearchPress = () => {
    console.log("date on search ", date);
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
    console.log("formattedDate : ", formatDate);
    console.log("formattedDate", formattedDate);
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
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
                  <Text style={styles.subHeader}>Search For</Text>
                </View>

                {/* Notification Icon in top-right corner */}
                <TouchableOpacity
                  style={styles.notificationIconContainer}
                  onPress={handleNotificationPress}
                >
                  <Icon name="bell-o" size={25} color="#fff" />
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
              style={styles.formContainer}
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
                  size={20}
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
                  style={{ width: 50, fontFamily: "Inter-Regular" }}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChange}
                  minimumDate={new Date()} // Set minimum date to today
                  maximumDate={
                    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                  } // Set max date to 1 year from now
                />
              )}

              {/* Search Button */}
              <View
                style={{ marginLeft: -20, marginRight: -20, marginBottom: -20 }}
              >
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearchPress}
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
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
  // flex: { flex: 1 },
  container: {
    flex: 1,
    // backgroundColor: '#E73D48',
  },
  headerContainer: {
    height: 480,
    // backgroundColor:'white'
  },
  textureBackground: {
    width: "100%",
    height: "100%",
    // position: 'absolute',
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 46,
    fontFamily: "Inter-Bold",
    fontWeight: "900",
    marginBottom: 10,
    marginTop: -200,
  },
  subHeader: {
    color: "white",
    fontSize: 20,
    position: "absolute",
    bottom: "40%",
    fontFamily: "Inter-Bold",
    // top:20
  },
  notificationIconContainer: {
    position: "absolute",
    top: 43,
    right: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 8,
    alignSelf: "center",
    marginTop: -180,
    width: "90%",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "OpenSans-Bold",
    color: "white",
  },
  activeTabText: {
    color: "#D83F3F",
  },
  formContainer: {
    width: "90%",
    backgroundColor: "#fff",
    marginVertical: 20,
    padding: 20,
    borderRadius: 15,
    alignSelf: "center",
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#ddd",
  },
  bulletPointRed: {
    width: 10,
    height: 10,
    backgroundColor: "#D83F3F",
    borderRadius: 5,
    marginRight: 10,
  },
  bulletPointGreen: {
    width: 10,
    height: 10,
    backgroundColor: "green",
    borderRadius: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    paddingVertical: 10,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#D83F3F",
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  calendarIcon: {
    marginRight: 10,
  },
  // Suggestions Styling
  inlineSuggestion: {
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  suggestionsContainer: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 200, // This limits the height and enables scrolling
    zIndex: 999,
    elevation: 5, // For Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: "hidden", // Ensure content doesn't overflow rounded corners
  },

  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },

  suggestionText: {
    fontSize: 15,
    fontFamily: "Inter-Regular",
    color: "#333",
  },

  suggestionsFooter: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },

  suggestionScrollContent: {
    flexGrow: 1,
  },
  inputText: {
    fontSize: 16,
  },
  notificationBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
});
