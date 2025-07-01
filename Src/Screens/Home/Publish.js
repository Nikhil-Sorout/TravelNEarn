import React, { useState, useEffect, useRef } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  TouchableWithoutFeedback, // Add this
  Keyboard, // Add this
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { fetchLocations } from "../../API/Location"; // Correct import path for API function
import Icon from "react-native-vector-icons/FontAwesome"; // Import FontAwesome Icon for calendar
import AsyncStorage from "@react-native-async-storage/async-storage";
import commonStyles from "../../styles";

const { width, height } = Dimensions.get("window");

const Search = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Travellers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fullFrom, setFullFrom] = useState(""); // Store the full address
  const [fullTo, setFullTo] = useState(""); // Store the full address
  const [date, setDate] = useState(new Date()); // Set date to today

  // Function to ensure text is displayed properly in TextInput
  const formatDisplayText = (text) => {
    if (text && text.length > 35) {
      return text.substring(0, 32) + "...";
    }
    return text;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [goingSuggestions, setGoingSuggestions] = useState([]);
  const [leavingSuggestions, setLeavingSuggestions] = useState([]);
  const [fromSelected, setFromSelected] = useState(false); // Track if "Leaving from" is selected
  const [toSelected, setToSelected] = useState(false); // Track if "Going to" is selected
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);

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

  // Auto-scroll when suggestions appear
  useEffect(() => {
    if ((isFromFocused && goingSuggestions.length > 0) || (isToFocused && leavingSuggestions.length > 0)) {
      // Delay to ensure suggestions are rendered
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 300, // Adjust this value based on your layout
            animated: true
          });
        }
      }, 100);
    }
  }, [goingSuggestions.length, leavingSuggestions.length, isFromFocused, isToFocused]);

  // Auto-scroll when input fields are focused
  useEffect(() => {
    if (isFromFocused || isToFocused) {
      // Delay to ensure keyboard is shown
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 250, // Adjust this value based on your layout
            animated: true
          });
        }
      }, 200);
    }
  }, [isFromFocused, isToFocused]);

  const clearInput = (field) => {
    if (field === "from") {
      setFrom("");
      setGoingSuggestions([]);
      setFromSelected(false);
    } else {
      setTo("");
      setLeavingSuggestions([]);
      setToSelected(false);
    }
  };

  const onChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      // User canceled the picker (Android only)
      setShowDatePicker(false);
      return;
    }

    const currentDate = selectedDate || date;
    // On iOS, keep the picker open after selection
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    setDate(currentDate); // Update the date

    console.log("Selected date:", currentDate.toDateString());
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
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      alert("Departure and destination cannot be the same.");
      return;
    }
    if (!date) {
      alert("Please select a valid date.");
      return;
    }

    const formattedDate = date.toISOString();
    // Use full addresses if available, otherwise use the display values
    const fromAddress = fullFrom || from;
    const toAddress = fullTo || to;

    AsyncStorage.setItem("startingLocation", fromAddress.toString());
    AsyncStorage.setItem("goingLocation", toAddress.toString());
    AsyncStorage.setItem("searchingDate", date.toString());
    navigation.navigate(
      activeTab === "Travellers"
        ? "PublishStarting"
        : "PublishConsignmentLocation",
      { from: fromAddress, to: toAddress, date: formattedDate }
    );
  };

  const showPicker = () => {
    // if (Platform.OS === 'android') {
    setShowDatePicker(true);
    // }
  };

  // Function to close all suggestions
  const closeSuggestions = () => {
    setGoingSuggestions([]);
    setLeavingSuggestions([]);
    setIsFromFocused(false);
    setIsToFocused(false);
    setFromSelected(false);
    setToSelected(false);
    Keyboard.dismiss(); // Also dismiss the keyboard
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Wrap ScrollView content with TouchableWithoutFeedback */}
      <TouchableWithoutFeedback onPress={closeSuggestions}>
        <ScrollView 
          ref={scrollViewRef}
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
                  <Text style={styles.subHeader}>Publish</Text>
                </View>

                {/* Notification Icon in top-right corner */}
                <TouchableOpacity
                  style={styles.notificationIconContainer}
                  onPress={() => navigation.navigate("Notification")}
                >
                  <Icon name="bell-o" size={25} color="#fff" />
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
            {/* Add onStartShouldSetResponder to prevent TouchableWithoutFeedback from stealing taps inside */}
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
                    setIsToFocused(false); // Ensure only one is considered focused for suggestions
                    setLeavingSuggestions([]); // Close other suggestions on focus
                  }}
                  onBlur={() => {
                    // Delay blur slightly to allow suggestion press
                    setTimeout(() => setIsFromFocused(false), 150);
                  }}
                />
                {/* Show suggestions only if focused, not selected, and suggestions exist */}
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
                                setFullFrom(item); // Store full address
                                setFrom(formatDisplayText(item)); // Store formatted address for display
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
                    setToSelected(false);
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
                                setFullTo(item); // Store full address
                                setTo(formatDisplayText(item)); // Store formatted address for display
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
                {/* Make TouchableOpacity also prevent outer touch */}
                <TouchableOpacity
                  style={styles.input}
                  onPress={showPicker}
                  onStartShouldSetResponder={() => true}
                >
                  <Text style={styles.inputText}>
                    {date ? date.toDateString() : "Select Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChange}
                  minimumDate={new Date()} // Allow selection from today
                  maximumDate={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() + 2)
                    )
                  } // Allow dates up to 2 years in the future
                />
              )}

              {/* Search Button */}
              <View
                style={{ marginLeft: -20, marginRight: -20, marginBottom: -20 }}
                // Prevent outer touch on button area
                onStartShouldSetResponder={() => true}
              >
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearchPress}
                >
                  <Text style={styles.searchButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    fontFamily: "OpenSans-SemiBold",
    color: "white",
    fontSize: 20,
    position: "absolute",
    bottom: "40%",
    // top:20
  },
  notificationIconContainer: {
    position: "absolute",
    top: 40,
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
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "white",
  },
  activeTabText: {
    fontFamily: "Inter-SemiBold",
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
    fontFamily: "Inter-Regular",
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: "#333",
    textAlign: "left", // Force left alignment
    textAlignVertical: "center", // Center text vertically
    includeFontPadding: false, // Helps with text alignment
  },
  inputText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#D83F3F",
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  searchButtonText: {
    fontFamily: "Inter-Bold",
    color: "#fff",
    fontSize: 16,
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
});
