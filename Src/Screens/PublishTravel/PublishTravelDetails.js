import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { default as FontAwesome } from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReviewDetails from '../../Customer Traveller/ReviewDetails';

const TravelDetails = () => {
  const navigation = useNavigation();
  const bottomSheetRef = useRef();
  const [isModalVisible, setModalVisible] = useState(false);
  const [travelMode, setTravelMode] = useState('');
  const [travelNumber, setTravelNumber] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [searchingDate, setSearchingDate] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  // New state for rating
  const [ratingData, setRatingData] = useState({ rating: null, average: null });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const [
          startingLocation,
          goingLocation,
          travelMode,
          travelNumber,
          startTime,
          endTime,
          searchingDate,
          phoneNumber,
          firstName,
          lastName,
        ] = await Promise.all([
          AsyncStorage.getItem('startingLocation'),
          AsyncStorage.getItem('goingLocation'),
          AsyncStorage.getItem('travelMode'),
          AsyncStorage.getItem('travelNumber'),
          AsyncStorage.getItem('startTime'),
          AsyncStorage.getItem('endTime'),
          AsyncStorage.getItem('searchingDate'),
          AsyncStorage.getItem('phoneNumber'),
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('lastName'),
        ]);
        console.log("startTime : ", startTime)
        console.log("endTime : ", endTime)
        console.log("Travel Mode : ", travelMode)
        console.log("Search date from async storage : ", searchingDate)
        setStartLocation(startingLocation);
        setEndLocation(goingLocation);
        setTravelMode(travelMode);
        setTravelNumber(travelNumber);
        setStartTime(startTime);
        setEndTime(endTime);
        setSearchingDate(searchingDate);
        setPhoneNumber(phoneNumber);
        setFirstName(firstName);
        setLastName(lastName);

        if (startingLocation && goingLocation) {
          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRoute(startingLocation, goingLocation),
          ]);
        }
      } catch (error) {
        console.error('Error fetching travel data:', error);
      }
    };

    fetchTravelData();
  }, []);

  // // Fetch rating when phoneNumber is available
  // useEffect(() => {
  //   const fetchRating = async () => {
  //     if (!phoneNumber) return;

  //     try {
  //       setRatingLoading(true);
  //       setRatingError(null);
  //       console.log("Fetching ratings")
  //       // Validate phone number (accepts +91 followed by 10 digits or just 10 digits)
  //       const phoneRegex = /^(?:\+91)?\d{10}$/;
  //       if (!phoneRegex.test(phoneNumber)) {
  //         throw new Error('Invalid phone number. Must be 10 digits or +91 followed by 10 digits.');
  //       }
  //       const baseUrl = await AsyncStorage.getItem("apiBaseUrl")
  //       const response = await fetch(`${baseUrl}api/rating/${phoneNumber}`);
  //       // const data = await response.json();
  //       // console.log(response)
  //       if (!response.ok) {
  //         throw new Error(data.message || 'Failed to fetch rating');
  //       }

  //       setRatingData({
  //         rating: data.rating,
  //         average: data.average,
  //       });
  //     } catch (err) {
  //       console.log(err)
  //       setRatingError(err.message || 'Failed to fetch rating');
  //     } finally {
  //       setRatingLoading(false);
  //     }
  //   };

  //   if (phoneNumber) {
  //     fetchRating();
  //   }
  // }, [phoneNumber]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!phoneNumber) return;
        setRatingLoading(true)
        setRatingError(null);

        const response = await fetch(
          `https://travel.timestringssystem.com/api/getall/${phoneNumber}`
        );
        const data = await response.json();
        console.log(data)
        if (data && data.user) {
          if (data.user.profilePicture) {
            setProfilePic(data.user.profilePicture);
          }
          if (data.user.firstName && !firstName) {
            setFirstName(data.user.firstName);
            await AsyncStorage.setItem('firstName', data.user.firstName);
          }
          if (data.user.lastName && !lastName) {
            setLastName(data.user.lastName);
            await AsyncStorage.setItem('lastName', data.user.lastName);
          }
          console.log(data?.user?.averageRating)
          setRatingData({
            rating: data?.user?.totalrating,
            average: data?.user?.averageRating,
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setRatingError(err.message || 'Error fetching user profile');
      } finally {
        setRatingLoading(false)
      }
    };

    if (phoneNumber) {
      fetchUserProfile();
    }
  }, [phoneNumber, firstName, lastName]);

  console.log("rating data : ", ratingData)
  const fetchRoute = async (origin, destination) => {
    try {
      const GOOGLE_MAPS_API_KEY = 'AIzaSyCJbXV5opQV7TQnfQ_d3UISYQhZegrqdec';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
        await AsyncStorage.setItem('DecodedPolyLine', JSON.stringify(decodedCoordinates));
        setCoordinates(decodedCoordinates);
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchCoordinates = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://travel.timestringssystem.com/map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        setOriginCoords({
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        });
        setDestinationCoords({
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        });
        await AsyncStorage.setItem('setOriginCoords', JSON.stringify(originCoords));
        await AsyncStorage.setItem('setDestinationCoords', JSON.stringify(destinationCoords));
        setDistance(data.distance);
        setDuration(data.duration);
      } else {
        throw new Error('Invalid coordinates data');
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      Alert.alert('Error', 'Failed to fetch route data. Please try again.');
    }
  };

  const getTravelIcon = () => {
    switch (travelMode) {
      case 'roadways':
        return <FontAwesome name="car" size={30} color="#D83F3F" />;
      case 'airplane':
        return <Ionicons name="airplane" size={30} color="#D83F3F" />;
      case 'train':
        return <FontAwesome name="train" size={30} color="#D83F3F" />;
      default:
        return <Ionicons name="help-circle-outline" size={30} color="gray" />;
    }
  };

  const handleCloseModal = () => {
    console.log('Modal is closing...');
    setModalVisible(false);
  };

  const handleSearch = () => {
    console.log('Search button pressed');
    setModalVisible(false);
    navigation.navigate('PublishTravelRequestSentScreen');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handlePublishTravel = async () => {
    setLoading(true);
    const requestData = {
      travelMode: travelMode === "roadways" ? "car" : travelMode.toLowerCase(),
      travelmode_number: travelNumber,
      expectedStartTime: startTime,
      expectedEndTime: endTime,
      travelDate: searchingDate,
      phoneNumber,
    };
    console.log("requestData :", requestData)
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      
      const response = await fetch(
        `${baseurl}t/creates?Leavinglocation=${startLocation}&Goinglocation=${endLocation}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );
      const data = await response.json();
      console.log("response", data)
      if (response.ok) {
        navigation.navigate('PublishTravelRequestSentScreen');
      } else {
        Alert.alert('Something went wrong!');
      }
    } catch (error) {
      Alert.alert('Failed to publish travel request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView scrollEnabled={true}>
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ReviewDetails onClose={handleCloseModal} onSearch={handleSearch} />
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image source={require('../../Images/locon.png')} style={styles.locationIcon} />
            <Text style={styles.locationText}>{startLocation}</Text>
          </View>
          <View style={styles.verticalseparator}></View>
          <View style={styles.separator} />
          <View style={styles.locationRow}>
            <Image source={require('../../Images/locend.png')} style={styles.locationIcon} />
            <Text style={styles.locationText}>{endLocation}</Text>
          </View>
          <View style={styles.separator1} />
          <View style={styles.infoRow}>
            <Image source={require('../../Images/clock.png')} style={[styles.locationIcon, { marginLeft: 5 }]} />
            <Text style={styles.infoText}>{duration}</Text>
          </View>
          <Text style={styles.infoText1}>{distance}</Text>
        </View>

        <View style={styles.mapContainer}>
          <Text style={[styles.infoTitle, { marginBottom: 20 }]}>Track on map</Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            key={coordinates.length}
            style={styles.map}
            initialRegion={{
              latitude: originCoords ? originCoords.latitude : 28,
              longitude: originCoords ? originCoords.longitude : 77,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            <Polyline coordinates={coordinates} strokeColor="blue" strokeWidth={5} />
            {originCoords && (
              <Marker coordinate={originCoords} title={startLocation}>
                <View style={[styles.marker, styles.startMarker]}>
                  <FontAwesome name="user" size={25} color="#fff" />
                </View>
              </Marker>
            )}
            {destinationCoords && (
              <Marker coordinate={destinationCoords} title={endLocation}>
                <View style={[styles.marker, styles.endMarker]}>
                  <FontAwesome name="map-marker" size={25} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        <View style={styles.card}>
          <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Other Information</Text>
              <View style={[styles.infoRow, { marginTop: 10 }]}>
                <Image source={require('../../Images/clock.png')} style={[styles.locationIcon, { marginLeft: 0 }]} />
                <Text style={styles.infoText}>{searchingDate ? formatDate(searchingDate) : ''}</Text>
              </View>
            </View>
          </View>
          <View style={{ marginLeft: 40 }}>
            <Text style={styles.infoText2}>
              {startTime} - {endTime}
            </Text>
          </View>
          <View style={styles.separator1} />
          <Text style={styles.infoTitle}>Mode Of Travel</Text>
          <View style={styles.traveler}>
            <View style={styles.iconContainer}>{getTravelIcon()}</View>
            <View style={styles.travelerDetails}>
              <Text style={[styles.travelerName, { marginLeft: 15 }]}>{travelMode}</Text>
            </View>
          </View>
          <View style={styles.separator1} />
          <Text style={[styles.infoTitle, { marginBottom: 5, marginLeft: 2 }]}>Traveller Details</Text>
          <View style={styles.traveler}>
            <Image
              source={{
                uri:
                  profilePic ||
                  'https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg',
              }}
              style={styles.profileImage}
            />
            <View style={styles.travelerDetails}>
              <Text style={styles.travelerName}>
                {firstName} {lastName}
              </Text>
              {ratingLoading ? (
                <Text style={styles.travelerRating}>Loading rating...</Text>
              ) : ratingError ? (
                <Text style={styles.travelerRating}>Rating unavailable</Text>
              ) : (
                <Text style={styles.travelerRating}>
                  ⭐ {ratingData?.average != undefined ? ratingData?.average.toFixed(1) : 'N/A'} (
                  {ratingData?.rating != undefined ? ratingData?.rating : 0} ratings)
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ margin: 20, marginBottom: 20 }}>
          <TouchableOpacity style={styles.button} onPress={handlePublishTravel} disabled={loading}>
            <Text style={styles.buttonText}>Publish My Travel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TravelDetails;

const styles = StyleSheet.create({
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  header: {
    backgroundColor: '#D83F3F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 4,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  separator1: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
    marginLeft: 5,
  },
  separator: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  verticalseparator: {
    width: 1,
    backgroundColor: '#ddd',
    borderStyle: 'dashed',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    height: 40,
    marginHorizontal: 11,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'black',
    fontWeight: 'bold',
    marginLeft: 10,
    marginTop: -2,
  },
  infoText1: {
    fontSize: 15,
    color: '#555',
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: '#555',
  },
  mapContainer: {
    marginVertical: 0,
    margin: 20,
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    objectFit: 'cover',
  },
  otherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  infoBlock: {
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  traveler: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  travelerRating: {
    fontSize: 14,
    color: '#555',
  },
  button: {
    backgroundColor: '#D83F3F',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarker: {
    backgroundColor: 'green',
  },
  endMarker: {
    backgroundColor: 'red',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});