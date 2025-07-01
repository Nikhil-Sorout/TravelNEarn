import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Account from "../Home/Account"; // Adjust the path as per your folder structure
import PublishScreen from "../Home/Publish"; // Ensure PublishScreen is imported
import SearchScreen from "../Home/Search"; // Make sure to import SearchScreen
import commonStyles from "../../styles"; // Import common styles for fonts

const Tab = createBottomTabNavigator();

export default function Navigation({ route }) {
  const { userId } = route.params || {}; // Access userId passed from previous screen

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hides the header
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Publish") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#D83F3F",
        tabBarInactiveTintColor: "#919191",
        tabBarStyle: {
          backgroundColor: "#fff",
          paddingVertical: 5,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
        },
      })}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        initialParams={{ userId }} // Pass userId to Search screen
      />
      <Tab.Screen
        name="Publish"
        component={PublishScreen}
        initialParams={{ userId }} // Pass userId to Publish screen
      />
      <Tab.Screen
        name="Account"
        component={Account}
        initialParams={{ userId }} // Pass userId to Account screen
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
