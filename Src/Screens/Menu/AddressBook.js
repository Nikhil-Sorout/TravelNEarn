import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../header";
import { SafeAreaView } from "react-native-safe-area-context";

const AddressBook = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null); // Track which address menu is open

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        let baseurl = await AsyncStorage.getItem("apiBaseUrl");

        if (!baseurl) {
          baseurl = "https://travel.timestringssystem.com/";
          // baseurl = "http://192.168.1.25:5002/";
        }

        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        if (!phoneNumber) {
          setError("Phone number not found.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${baseurl}address/getaddress/${phoneNumber}`
        );
        const data = await response.json();
        // console.log("Addresses Data: ", data);

        if (data?.addresses && data?.addresses?.length > 0) {
          setAddresses(data?.addresses);
        } else {
          setAddresses([]);
        }
      } catch (err) {
        setError("Error fetching addresses.");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", () => {
      setLoading(true);
      fetchAddresses();
    });

    return unsubscribe;
  }, []);

  // Toggle menu visibility for a specific address
  const toggleMenu = (index) => {
    setMenuVisible(menuVisible === index ? null : index);
  };

  // Handle Edit action
  const handleEdit = (address) => {
    setMenuVisible(null);
    navigation.navigate("Address", { address }); // Pass address to edit
  };

  // Handle Delete action
  const handleDelete = async (addressId) => {
    try {
      console.log(addressId)
      if(addressId === undefined) return;
      console.log("addressId", addressId)
      let baseurl = await AsyncStorage.getItem("apiBaseUrl");
      if (!baseurl) {
        baseurl = "https://travel.timestringssystem.com/";
        // baseurl = "http://192.168.1.25:5002/";
      
      }
      console.log("baseurl", baseurl)
      const response = await fetch(`${baseurl}address/delete/${addressId}`, {
        method: "DELETE",
      });
      console.log(response)
      if (response.ok) {
        setAddresses(addresses.filter((item) => item.id !== addressId));
      } else {
        setError("Failed to delete address.");
      }
    } catch (err) {
      setError("Error deleting address.");
    } finally {
      setMenuVisible(null);
    }
  };

  // Handle address item press - navigate to publish consignment location
  // const handleAddressPress = (address) => {
  //   // Construct googleMapsAddress from address components
  //   const googleMapsAddress = `${address.location}, ${address.pincode}, ${address.city}, ${address.state}`;
    
  //   // Navigate to PublishConsignmentLocation with the address
  //   navigation.navigate("PublishConsignmentLocation", {
  //     googleMapsAddress: googleMapsAddress,
  //     initialLocation: address.googleMapsAddress || googleMapsAddress,
  //     address: address // Pass the full address object for constructing displayAddress
  //   });
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Address Book" navigation={navigation} />

      <ScrollView style={styles.addressList}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : addresses.length === 0 ? (
          <Text style={styles.noDataText}>No addresses found.</Text>
        ) : (
          addresses.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.addressItem}
              // onPress={() => handleAddressPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.addressIconContainer}>
                <MaterialIcons name="location-pin" size={24} color="orange" />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressTitle}>{item.saveAs === "Others" ? item.customName : item.saveAs}</Text>
                <Text style={styles.address}>
                  {item.flat} {item.landmark} {item.street} {item.location}
                </Text>
                <Text style={styles.addressDescription}>
                  {item.city} {item.state}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreIcon}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
                  toggleMenu(index);
                }}
              >
                <MaterialIcons name="more-vert" size={24} color="black" />
              </TouchableOpacity>
              {menuVisible === index && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleEdit(item)}
                  >
                    <Text style={styles.menuText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.menuText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Address")}
      >
        <Text style={styles.addButtonText}>+ Add New Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddressBook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    marginTop: 40,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    marginRight: 10,
  },
  addressList: {
    padding: 20,
  },
  addressItem: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-start",
    position: "relative", // For positioning dropdown
  },
  addressIconContainer: {
    width: 30,
    alignItems: "center",
    marginRight: 10,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#000'
  },
  address: {
    color: "#333",
    marginTop: 5,
  },
  addressDescription: {
    color: "grey",
    marginTop: 5,
  },
  moreIcon: {
    marginLeft: 10,
  },
  addButton: {
    margin: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    color: "grey",
  },
  dropdownMenu: {
    position: "absolute",
    right: 10,
    top: 50,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 14,
    color: "#333",
  },
});