import React, { useState, useEffect, useRef, useCallback } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { fetchLocations } from "../../API/Location";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import commonStyles from "../../styles";
import Modal from "react-native-modal";
import { useFocusEffect } from "@react-navigation/native";
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

// Responsive scaling functions
// const scale = (size) => {
//   const baseWidth = 393; // iPhone 14 Pro width
//   const scaleFactor = width / baseWidth;
//   return Math.round(size * scaleFactor);
// };

// const verticalScale = (size) => {
//   const baseHeight = 852; // iPhone 14 Pro height
//   const scaleFactor = height / baseHeight;
//   return Math.round(size * scaleFactor);
// };

// const moderateScale = (size, factor = 0.5) => {
//   return size + (scale(size) - size) * factor;
// };

const Search = ({ route }) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Travellers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fullFrom, setFullFrom] = useState("");
  const [fullTo, setFullTo] = useState("");
  const [date, setDate] = useState(new Date());
  // const addressType = route?.params?.addressFieldType
  // const addressItem = route?.params?.body
  // console.log(addressType, addressItem);
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const fromString = await AsyncStorage.getItem("addressFrom");
          const toString = await AsyncStorage.getItem("addressTo");

          const fromItem = fromString ? JSON.parse(fromString) : null;
          const toItem = toString ? JSON.parse(toString) : null;

          if (fromItem) {
            setFullFrom(fromItem.displayAddress);
            setFrom(fromItem.googleMapsAddress);
          }

          if (toItem) {
            setFullTo(toItem.displayAddress);
            setTo(toItem.googleMapsAddress);
          }
        } catch (error) {
          console.error("Error loading address from AsyncStorage:", error);
        }
      })();
    }, [])
  );

  // Function to ensure text is displayed properly in TextInput
  const formatDisplayText = (text) => {
    const maxLength = screenWidth < 375 ? 25 : screenWidth < 390 ? 30 : 35;
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
    }
    return text;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [goingSuggestions, setGoingSuggestions] = useState([]);
  const [leavingSuggestions, setLeavingSuggestions] = useState([]);
  const [fromSelected, setFromSelected] = useState(false);
  const [toSelected, setToSelected] = useState(false);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressFieldType, setAddressFieldType] = useState(null); // 'from' or 'to'
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [startCity, setStartCity] = useState('')
  const [destCity, setDestCity] = useState('')
  // const [goingCity, setGoingCity] = useState('')
  // const [state, setState] = useState('')


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
    setDate(currentDate);
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
    const fromAddress = from;
    const toAddress = to;

    // AsyncStorage.setItem("startingLocation", fromAddress.toString());
    // AsyncStorage.setItem("goingLocation", toAddress.toString());
    // AsyncStorage.setItem("searchingDate", date.toString());
    navigation.navigate(
      activeTab === "Travellers"
        ? "TravelMode"
        : "ReceiverScreen",
      {
        from: fromAddress,
        to: toAddress,
        fullFrom: fullFrom,
        fullTo: fullTo,
        selectedDate: date.toISOString(),
        startCity,
        destCity
      }
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

  const fetchAddresses = async () => {
    setAddressLoading(true);
    setAddressError(null);
    try {
      let baseurl = await AsyncStorage.getItem("apiBaseUrl");
      if (!baseurl) {
        baseurl = "https://travel.timestringssystem.com/";
      }
      // console.log("Baseurl: ", baseurl);
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!phoneNumber) {
        setAddressError("Phone number not found.");
        setAddressLoading(false);
        return;
      }
      const response = await fetch(`${baseurl}address/getaddress/${phoneNumber}`);
      const data = await response.json();
      console.log("Data: ", data.addresses);
      if (data && data?.addresses?.length > 0) {
        setAddresses(data?.addresses);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      setAddressError("Error fetching addresses.");
    } finally {
      setAddressLoading(false);
    }
  };

  const openAddressModal = (type) => {
    setAddressFieldType(type);
    setAddressModalVisible(true);
    fetchAddresses();
  };

  const handleSelectAddress = (item) => {
    console.log("Item: ", item)
    // const formatted = `${item.flat} ${item.landmark} ${item.street} ${item.location}\n${item.city} ${item.state}`;
    if (addressFieldType === 'from') {
      setStartCity(item.city)
      // setState(item.state);
      setFullFrom(item.displayAddress);
      setFrom(item.googleMapsAddress);
    } else {
      setDestCity(item.city)
      setFullTo(item.displayAddress);
      setTo(item.googleMapsAddress);
    }
    setAddressModalVisible(false);
  };

  const handleAddNewAddress = () => {
    setAddressModalVisible(false);
    navigation.navigate("Address", { addressFieldType });
    // navigation.navigate("PublishConsignmentLocation")
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
                  <Icon name="bell-o" size={moderateScale(25)} color="#fff" />
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
                  marginHorizontal: width < 375 ? 10 : 20,
                  paddingHorizontal: width < 375 ? 15 : 20,
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={{color: "#000"}}>{activeTab === "Travellers" ? "Leaving From" : "Sending From"}</Text>
              {/* Leaving From Input */}
              {/* <Text style={styles.inputLabel}>Leaving From</Text> */}
              <View style={styles.inputContainer}>
                <View style={styles.bulletPointRed} />
                <TouchableOpacity
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => openAddressModal('from')}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: from ? '#333' : '#aaa', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                    {fullFrom || (activeTab === "Travellers" ? "Starting City Address" : "Starting City Address")}
                  </Text>
                </TouchableOpacity>
                {/* Show suggestions only if focused, not selected, and suggestions exist */}
                {isFromFocused &&
                  goingSuggestions.length > 0 &&
                  !fromSelected && (
                    <TouchableWithoutFeedback onPress={() => { }}>
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
              <Text style={{color: "#000"}}>{activeTab === "Travellers" ? "Going To" : "Sending To"}</Text>
              <View style={styles.inputContainer}>
                <View style={styles.bulletPointGreen} />
                <TouchableOpacity
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => openAddressModal('to')}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: to ? '#333' : '#aaa', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                    {fullTo || (activeTab === "Travellers" ? "Destination City Address" : "Destination City Address")}
                  </Text>
                </TouchableOpacity>

                {isToFocused &&
                  leavingSuggestions.length > 0 &&
                  !toSelected && (
                    <TouchableWithoutFeedback onPress={() => { }}>
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
                  size={moderateScale(20)}
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
                  style={{
                    width: moderateScale(50),
                    fontFamily: "Inter-Regular",
                    transform: [{ scale: screenWidth < 375 ? 0.9 : 1 }]
                  }}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChange}
                  minimumDate={new Date()}
                  maximumDate={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() + 2)
                    )
                  }
                />
              )}

              {/* Search Button */}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchPress}
              >
                <Text style={styles.searchButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Address Modal */}
      <Modal
        isVisible={addressModalVisible}
        onBackdropPress={() => setAddressModalVisible(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.4}
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: height * 0.3 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: "#000" }}>
            {addressFieldType === 'from' ? 'Select Starting City Address' : 'Select Destination City Address'}
          </Text>
          <TouchableOpacity onPress={handleAddNewAddress} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Icon name="location-arrow" size={20} color="#D83F3F" style={{ marginRight: 8 }} />
            <Text style={{ color: '#D83F3F', fontWeight: 'bold', fontSize: 16 }}>Add New Address</Text>
          </TouchableOpacity>
          {addressLoading ? (
            <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
          ) : addressError ? (
            <Text style={{ color: 'red', marginTop: 20 }}>{addressError}</Text>
          ) : addresses.length === 0 ? (
            <Text style={{ color: 'grey', marginTop: 20 }}>No addresses found.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.map((item, idx) => (
                <TouchableOpacity
                  key={item._id || idx}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => handleSelectAddress(item)}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: "#000" }}>{item.saveAs === "Others" ? item.customName : item.saveAs}</Text>
                  <Text style={{ color: '#333' }} numberOfLines={1} ellipsizeMode="tail">
                    {item.flat} {item.landmark} {item.street} {item.location}
                  </Text>
                  <Text style={{ color: 'grey', fontSize: 13 }} numberOfLines={1} ellipsizeMode="tail">
                    {item.city} {item.state}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
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
    color: '#000'
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
