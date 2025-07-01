import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const cities = ['Delhi', 'Gurugram', 'Noida', 'Jaipur', 'Bangalore', 'Hyderabad', 'Kolkata'];

const { width, height } = Dimensions.get('window');  // Get screen dimensions

const RegionPicker = ({ navigation }) => {
  const route = useRoute(); 
  const { userId } = route.params || {};  

  if (!userId) {
    return <Text style={styles.errorText}>Error: User ID not provided!</Text>;
  }

  const [selectedRegion, setSelectedRegion] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = cities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    navigation.navigate('Navigation');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Pick your region</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your city"
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.cityContainer,
              item === selectedRegion ? styles.selectedCity : null,
            ]}
            onPress={() => handleRegionSelect(item)}
          >
            <Text style={styles.cityText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 30 : 0,  // Adjust for iOS status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'ios' ? 20 : 0,  // Adjust margin on iOS for better spacing
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,  // Make the header text flexible for centering
    textAlign: 'center',  // Center the text in the header
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    width: width - 30,  // Use width of the screen for responsiveness
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  cityContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    width: width - 30,  // Ensure cities are correctly sized based on screen width
  },
  cityText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCity: {
    backgroundColor: '#e0e0e0',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RegionPicker;

// import React, { useState, useEffect } from 'react';
// import { useRoute } from '@react-navigation/native';
// import { Dimensions, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';

// const { width, height } = Dimensions.get('window');  // Get screen dimensions

// const RegionPicker = ({ navigation }) => {
//   const route = useRoute();
//   const { userId } = route.params || {};  // Get userId from navigation params

//   if (!userId) {
//     return <Text style={styles.errorText}>Error: User ID not provided!</Text>;
//   }

//   const [cities, setCities] = useState([]); // State for cities from backend
//   const [filteredCities, setFilteredCities] = useState([]); // State for filtered cities
//   const [selectedRegion, setSelectedRegion] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(false); // Loading state for API calls
//   const [error, setError] = useState(null); // State for errors

//   // Fetch cities from backend
//   useEffect(() => {
//     const fetchCities = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await axios.post('https://swiftmed.in/t/regions'); // Replace with your API endpoint
//         setCities(response.data.cities); // Assuming API response contains `cities` array
//         setFilteredCities(response.data.cities); // Initialize filteredCities
//       } catch (err) {
//         setError('Failed to fetch cities. Please try again later.');
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCities();
//   }, []);

//   // Filter cities based on search query
//   useEffect(() => {
//     setFilteredCities(
//       cities.filter((city) =>
//         city.toLowerCase().includes(searchQuery.toLowerCase())
//       )
//     );
//   }, [searchQuery, cities]);

//   const handleRegionSelect = (region) => {
//     setSelectedRegion(region);
//     navigation.navigate('Navigation', { selectedRegion: region, userId });
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#D32F2F" />
//         <Text>Loading cities...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return <Text style={styles.errorText}>{error}</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Icon name="chevron-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Pick your region</Text>
//       </View>

//       <View style={styles.searchContainer}>
//         <Icon name="search" size={20} color="gray" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search for your city"
//           placeholderTextColor="gray"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//       </View>

//       <FlatList
//         data={filteredCities}
//         keyExtractor={(item) => item}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.cityContainer,
//               item === selectedRegion ? styles.selectedCity : null,
//             ]}
//             onPress={() => handleRegionSelect(item)}
//           >
//             <Text style={styles.cityText}>{item}</Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//     paddingTop: Platform.OS === 'ios' ? 30 : 0,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#D32F2F',
//     paddingVertical: 20,
//     paddingHorizontal: 15,
//     marginTop: Platform.OS === 'ios' ? 20 : 0,
//   },
//   backButton: {
//     marginRight: 10,
//   },
//   headerText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     flex: 1,
//     textAlign: 'center',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     margin: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 3,
//     width: width - 30,
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 8,
//     fontSize: 16,
//   },
//   cityContainer: {
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     width: width - 30,
//   },
//   cityText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   selectedCity: {
//     backgroundColor: '#e0e0e0',
//   },
//   errorText: {
//     fontSize: 18,
//     color: 'red',
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default RegionPicker;
