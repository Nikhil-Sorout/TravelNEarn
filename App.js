import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { enableScreens } from 'react-native-screens';

// Enable screens for better performance
enableScreens();

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import { SocketProvider } from "./Src/Context/socketprovider";

// Screens
import SearchRide from "./Src/Customer Traveller/SearchRide";
import TravelDetails from "./Src/Customer Traveller/TravelDetails";
import Dlt from "./Src/DLT/Dlt";
import Navigation from "./Src/Screens/BottomNavigation/Navigation";
import AddAddress from "./Src/Screens/Menu/AddAddress";
import AddressBook from "./Src/Screens/Menu/AddressBook";
import Contact from "./Src/Screens/Menu/Contact";
import ConsignmentHistory from "./Src/Screens/Menu/Details/ConsignmentHistory";
import TravelHistory from "./Src/Screens/Menu/Details/TravelHistory";
import ConsignmentDetails from "./Src/Customer Traveller/ConsignmentDetails";
import ConsignmentSearchPage from "./Src/Customer Traveller/ConsignmentSearchPage";
import ConsignmentSearchScreen from "./Src/Customer Traveller/ConsignmentSearchScreen";
import RequestSentScreen from "./Src/Customer Traveller/RequestSentScreen";
import SearchDeliveryScreen from "./Src/Customer Traveller/SearchDeliveryScreen";
import Account from "./Src/Screens/Home/Account";
import Search from "./Src/Screens/Home/Publish";
import Cancellation from "./Src/Screens/Menu/Details/Cancellation";
import Earnings from "./Src/Screens/Menu/Earnings";
import Faq from "./Src/Screens/Menu/Faq";
import Feedback from "./Src/Screens/Menu/Feedback";
import HelpSupp from "./Src/Screens/Menu/HelpSupp";
import PrivacyPolicy from "./Src/Screens/Menu/PrivacyPolicy";
import Profile from "./Src/Screens/Menu/Profile";
import RefundPolicy from "./Src/Screens/Menu/RefundPolicy";
import TermsCondition from "./Src/Screens/Menu/TernsCondition";
import ParcelDetails from "./Src/Screens/PublishConsignment/ParcelDetails";
import ParcelForm from "./Src/Screens/PublishConsignment/ParcelForm";
import PublishConsignmentLocation from "./Src/Screens/PublishConsignment/PublishConsignmentLocation";
import PublishConsignmentRequestSentScreen from "./Src/Screens/PublishConsignment/PublishConsignmentRequestSentScreen";
import PublishConsignmentSearchScreen from "./Src/Screens/PublishConsignment/PublishConsignmentSearchScreen";
import PublishConsignmentStarting from "./Src/Screens/PublishConsignment/PublishConsignmentStarting";
import ReceiverScreen from "./Src/Screens/PublishConsignment/ReceiverScreen";
import PublicSearchScreen from "./Src/Screens/PublishTravel/PublicSearchScreen";
import PublishLocation from "./Src/Screens/PublishTravel/PublishLocation";
import PublishStarting from "./Src/Screens/PublishTravel/PublishStarting";
import PublishTravelDropLocation from "./Src/Screens/PublishTravel/PublishTravelDropLocation";
import PublishTravelDetails from "./Src/Screens/PublishTravel/PublishTravelDetails";
import PublishTravelRequestSentScreen from "./Src/Screens/PublishTravel/RequestSentScreen";
import TravelMode from "./Src/Screens/PublishTravel/TravelMode";
import Otp from "./Src/Screens/Started/Otp";
import RegionPicker from "./Src/Screens/Started/Region";
import Start from "./Src/Screens/Started/Start";
import Terms from "./Src/Screens/Started/TermsLog";
import Verification from "./Src/Screens/Started/Verification";
import Notification from "./Src/Screens/Home/Notification";
import WalletWebViewScreen from "./Src/Screens/Home/WalletWebViewScreen";
import ConsignmentHistoryDetails from "./Src/Screens/Menu/Details/ConsignmentHistoryDetails";
import TravelHistoryDetails from "./Src/Screens/Menu/Details/TravelHistoryDetails";
import ConsignmentRequest from "./Src/Customer Traveller/ConsignmentRequest";
import ConsignmentRequestDetails from "./Src/Customer Traveller/ConsignmentRequestDetails";
import ConsignmentCarry from "./Src/Screens/Menu/Details/ConsignementCarry";
import ConsignmentCarryDetails from "./Src/Customer Traveller/ConsignmentCarryDetails";
import ConsignmentListScreen from "./Src/Customer Traveller/Consignmentrequesttocarry";
import UpdateStatus from "./Src/Customer Traveller/UpdateStatusDetails";
import ConsignmentPayRequest from "./Src/Screens/CustomerFlow/ConsignmentPayRequest";
import ConsignmentRequestModel from "./Src/Screens/CustomerFlow/ConsignmentRequestModel";
import TravelDetailsScreen from "./Src/Screens/Menu/Details/TravelDetailsScreen";
import TravelPayRequest from "./Src/Screens/CustomerFlow/TravelPayRequest";
import ReviewDetails from "./Src/Customer Traveller/ReviewDetails";
import PayNowScreen from "./Src/Screens/CustomerFlow/PayNowScreen";
import TravelStartEndDetails from "./Src/Screens/Menu/Details/TravelStartEndDetails";
import AddStartingCityAddress from "./Src/Screens/Menu/AddStartingCityAddress";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [fontsLoaded] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    "OpenSans-Regular": OpenSans_400Regular,
    "OpenSans-SemiBold": OpenSans_600SemiBold,
    "OpenSans-Bold": OpenSans_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set required data for socket connection
        const apiBaseUrl = "https://travel.timestringssystem.com/";
        // const apiBaseUrl = "http://192.168.65.68:5002/";
        await AsyncStorage.setItem("apiBaseUrl", apiBaseUrl);
        await AsyncStorage.removeItem('addressFieldType')
        await AsyncStorage.removeItem('addressFrom')
        await AsyncStorage.removeItem('addressTo')

        // Get phone number from AsyncStorage or set a default for testing
        let phoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (!phoneNumber) {
          // For testing, you can set a default phone number
          phoneNumber = "1234567890"; // Replace with your test phone number
          await AsyncStorage.setItem("phoneNumber", phoneNumber);
        }

        console.log("App initialization:", {
          apiBaseUrl,
          phoneNumber,
          userLog: await AsyncStorage.getItem("userLog")
        });

        const userLog = await AsyncStorage.getItem("userLog");
        setInitialRoute(userLog === "1" ? "Navigation" : "Terms");
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initializeApp();
  }, []);

  if (!fontsLoaded || !initialRoute || !isInitialized) {
    return null; // Optionally, render a loading screen here
  }

  return (
    <SocketProvider>
      <NavigationContainer
        onStateChange={(state) => {
          // Handle navigation state changes
          console.log('Navigation state changed:', state);
        }}
        onReady={() => {
          // Navigation is ready
          console.log('Navigation is ready');
        }}
      >
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen
            name="Search"
            component={Search}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Start"
            component={Start}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelDetailScreen"
            component={TravelDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Terms"
            component={Terms}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Otp"
            component={Otp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Verification"
            component={Verification}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Region"
            component={RegionPicker}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Address"
            component={AddAddress}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddressBook"
            component={AddressBook}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Contact"
            component={Contact}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FAQ"
            component={Faq}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Feedback"
            component={Feedback}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Help"
            component={HelpSupp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicy}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Refund"
            component={RefundPolicy}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TermsCondition"
            component={TermsCondition}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelHistory"
            component={TravelHistory}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentsHistory"
            component={ConsignmentHistory}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SearchRide"
            component={SearchRide}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentSearchPage"
            component={ConsignmentSearchPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentDetails"
            component={ConsignmentDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SearchDeliveryScreen"
            component={SearchDeliveryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RideDetails"
            component={TravelDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelDetails"
            component={TravelDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UpdateStatus"
            component={UpdateStatus}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RequestSentScreen"
            component={RequestSentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentSearchScreen"
            component={ConsignmentSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DLTScreen"
            component={Dlt}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishLocation"
            component={PublishLocation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishStarting"
            component={PublishStarting}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishTravelDropLocation"
            component={PublishTravelDropLocation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishSearchScreen"
            component={PublicSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelMode"
            component={TravelMode}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Earnings"
            component={Earnings}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishTravelDetails"
            component={PublishTravelDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishTravelRequestSentScreen"
            component={PublishTravelRequestSentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishConsignmentLocation"
            component={PublishConsignmentLocation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishConsignmentStarting"
            component={PublishConsignmentStarting}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishConsignmentSearchScreen"
            component={PublishConsignmentSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReceiverScreen"
            component={ReceiverScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParcelForm"
            component={ParcelForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParcelDetails"
            component={ParcelDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PublishConsignmentRequestSentScreen"
            component={PublishConsignmentRequestSentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Account"
            component={Account}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelHistoryDetails"
            component={TravelHistoryDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cancellation"
            component={Cancellation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentHistoryDetails"
            component={ConsignmentHistoryDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notification"
            component={Notification}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentRequest"
            component={ConsignmentRequest}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentRequestDetails"
            component={ConsignmentRequestDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentCarry"
            component={ConsignmentCarry}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentCarryDetails"
            component={ConsignmentCarryDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WalletWebViewScreen"
            component={WalletWebViewScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentPayRequest"
            component={ConsignmentPayRequest}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentRequestModel"
            component={ConsignmentRequestModel}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsignmentListScreen"
            component={ConsignmentListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelPayRequest"
            component={TravelPayRequest}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReviewDetails"
            component={ReviewDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PayNowScreen"
            component={PayNowScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TravelStartEndDetails"
            component={TravelStartEndDetails}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddStartingCityAddress"
            component={AddStartingCityAddress}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Navigation"
            component={Navigation}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SocketProvider>
  );
}
