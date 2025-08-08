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
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { default as FontAwesome } from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from "react-native-vector-icons/FontAwesome6"
import ReviewDetails from '../../Customer Traveller/ReviewDetails';
import { getCurvedPolylinePoints } from '../../Utils/getCurvedPolylinePonints';
import {
  fetchRoute,
  decodePolyline,
  fitMapToRoute,
  getRouteColor,
  getRouteStrokeWidth,
  getDefaultRegion,
  isValidCoordinate
} from "../../Utils/routeUtils";

const TravelDetails = ({ route }) => {
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
  const [routeError, setRouteError] = useState(null);
  const mapRef = useRef(null);


  console.log(route?.params)
  const { fullFrom, fullTo, from, to, selectedDate, endDate, stayDays, stayHours, vehicleType, startCity, destCity } = route.params;

  useEffect(() => {
    const fetchTravelData = async () => {
      try {
        const [
          // startingLocation,
          // goingLocation,
          travelMode,
          travelNumber,
          startTime,
          endTime,
          searchingDate,
          phoneNumber,
          firstName,
          lastName,
        ] = await Promise.all([
          // AsyncStorage.getItem('startingLocation'),
          // AsyncStorage.getItem('goingLocation'),
          AsyncStorage.getItem('travelMode'),
          AsyncStorage.getItem('travelNumber'),
          AsyncStorage.getItem('startTime'),
          AsyncStorage.getItem('endTime'),
          AsyncStorage.getItem('searchingDate'),
          AsyncStorage.getItem('phoneNumber'),
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('lastName'),
        ]);
        console.log("Travel number : ", travelNumber)
        console.log("startTime : ", startTime)
        console.log("endTime : ", endTime)
        console.log("Travel Mode : ", travelMode)
        console.log("Search date from async storage : ", searchingDate)
        setStartLocation(fullFrom);
        setEndLocation(fullTo);
        setTravelMode(travelMode);
        setTravelNumber(travelNumber);
        setStartTime(startTime);
        setEndTime(endTime);
        setSearchingDate(searchingDate);
        setPhoneNumber(phoneNumber);
        setFirstName(firstName);
        setLastName(lastName);

        if (from && to) {
          await Promise.all([
            fetchCoordinates(from, to),
            fetchRoute(from, to),
          ]);
        }
      } catch (error) {
        console.error('Error fetching travel data:', error);
      }
    };

    fetchTravelData();
  }, []);

  const curvedLinePoints =
    originCoords && destinationCoords
      ? getCurvedPolylinePoints(originCoords, destinationCoords)
      : [];

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
      const GOOGLE_MAPS_API_KEY = 'AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc';
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
      const baseurl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseurl}map/getdistanceandcoordinate?origin=${origin}&destination=${destination}`
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
        return <Icon name="road" size={30} color="#D83F3F" />;
      case 'airplane':
        return <Icon name="plane-up" size={30} color="#D83F3F" />;
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
    console.log("clicked")
    const requestData = {
      travelMode: travelMode === "roadways" ? "car" : travelMode?.toLowerCase(),
      vehicleType: travelMode === "roadways" ? vehicleType ?? "" : "",
      travelmode_number: travelNumber,
      expectedStartTime: startTime,
      expectedEndTime: endTime,
      travelDate: searchingDate,
      endDate: endDate,
      phoneNumber,
      fullFrom,
      fullTo,
      stayDays,
      stayHours
    };
    console.log("hey i am here")
    console.log("requestData :", requestData)
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");

      const response = await fetch(
        `${baseurl}t/creates?Leavinglocation=${from}&Goinglocation=${to}`,
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

  // Fit map to route when both coordinates and route data are available
  useEffect(() => {
    if (mapRef.current && coordinates.length > 0 && originCoords && destinationCoords) {
      // Calculate bounds for the entire route including coordinates
      let minLat = Math.min(originCoords.latitude, destinationCoords.latitude);
      let maxLat = Math.max(originCoords.latitude, destinationCoords.latitude);
      let minLng = Math.min(originCoords.longitude, destinationCoords.longitude);
      let maxLng = Math.max(originCoords.longitude, destinationCoords.longitude);

      // Include all route coordinates in bounds calculation
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord.latitude);
        maxLat = Math.max(maxLat, coord.latitude);
        minLng = Math.min(minLng, coord.longitude);
        maxLng = Math.max(maxLng, coord.longitude);
      });

      // Add padding: more on top (40%), others 20%
      const latPadding = (maxLat - minLat) * 0.2; // 20% padding for bottom
      const lngPadding = (maxLng - minLng) * 0.2; // 20% padding for left/right
      const extraTopPadding = (maxLat - minLat) * 0.2; // extra 20% for top

      const region = {
        latitude: (minLat + maxLat) / 2 + extraTopPadding / 2, // shift center slightly down
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) + latPadding + extraTopPadding, // total 40% top padding
        longitudeDelta: (maxLng - minLng) + lngPadding,
      };

      // Animate to the calculated region
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [coordinates, originCoords, destinationCoords]);

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

        {/* <View style={styles.card}>
          <View style={styles.locationBlock}>
            <View style={styles.locationPoint}>
              <Text style={styles.dateText}>{formatDate(searchingDate)}</Text>
              <Text style={styles.timeText}>{startTime}</Text>
              <Text style={styles.cityText}>Noida</Text>
              <Text style={styles.addressText}>{startLocation}</Text>
            </View>

            <View style={styles.timeline}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={styles.dot} />
            </View>

            <View style={styles.locationPoint}>
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              <Text style={styles.timeText}>{endTime}</Text>
              <Text style={styles.cityText}>Bhubaneswar</Text>
              <Text style={styles.addressText}>{endLocation}</Text>
            </View>
          </View>
        </View> */}


        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Image source={require('../../Images/locon.png')} style={styles.locationIcon} />
            <View>
              <Text style={{ color: '#000' }}>{selectedDate ? formatDate(selectedDate) : ''}</Text>
              <Text style={{ color: '#000' }}>{startTime}</Text>
            </View>
            <View>
              <Text style={[styles.locationText, { fontWeight: 'bold' }]}>{startCity}</Text>
              <Text style={styles.locationText}>{startLocation}</Text>
            </View>
          </View>
          <View style={styles.verticalseparator}></View>
          {/* <View style={styles.separator} /> */}
          <View style={styles.locationRow}>
            <Image source={require('../../Images/locend.png')} style={styles.locationIcon} />
            <View>
              <Text style={{ color: '#000' }}>{endDate ? formatDate(endDate) : ''}</Text>
              <Text style={{ color: '#000' }}>{endTime}</Text>
            </View>
            <View>
              <Text style={[styles.locationText, { fontWeight: 'bold' }]}>{destCity}</Text>
              <Text style={styles.locationText}>{endLocation}</Text>
            </View>
          </View>
          {/* <View style={styles.separator1} />
          <View style={styles.infoRow}>
            <Image source={require('../../Images/clock.png')} style={[styles.locationIcon, { marginLeft: 5 }]} />
            <Text style={styles.infoText}>{duration}</Text>
          </View>
          <Text style={styles.infoText1}>{distance}</Text> */}
        </View>

        <View style={styles.mapContainer}>
          <Text style={[styles.infoTitle, { marginBottom: 20 }]}>Track on map</Text>
          {(originCoords && destinationCoords) ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
                longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
            >
              {curvedLinePoints.length > 0 && (
                <Polyline
                  coordinates={curvedLinePoints}
                  strokeColor="rgba(0,0,255,0.6)"
                  strokeWidth={2}
                  lineDashPattern={[5, 5]}
                />
              )}
              {isValidCoordinate(originCoords) && (
                <Marker coordinate={originCoords} title={startLocation}>
                  <View style={[styles.marker, styles.startMarker]}>
                    <Icon name="user" size={20} color="#fff" />
                  </View>
                </Marker>
              )}
              {isValidCoordinate(destinationCoords) && (
                <Marker coordinate={destinationCoords} title={endLocation}>
                  <View style={[styles.marker, styles.endMarker]}>
                    <Icon name="location-dot" size={20} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#D83F3F" />
              <Text style={{ color: '#000' }}>Loading map...</Text>
            </View>
          )}

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#D83F3F" />
              <Text style={styles.loadingText}>Loading route...</Text>
            </View>
          )}

          {/* Error overlay */}
          {routeError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{routeError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (startLocation && endLocation) {
                    fetchRoute(startLocation, endLocation);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {/* <View style={styles.otherInfo}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Other Information</Text>
              <View style={[styles.infoRow, { marginTop: 10 }]}>
                <Image source={require('../../Images/clock.png')} style={[styles.locationIcon, { marginLeft: 0 }]} />
                <Text style={styles.infoText}>{searchingDate ? formatDate(searchingDate) : ''}</Text>
              </View>
            </View>
          </View> */}
          {/* <View style={{ marginLeft: 40 }}>
            <Text style={styles.infoText2}>
              {startTime} - {endTime}
            </Text>
          </View> */}
          {/* <View style={styles.separator1} /> */}
          <Text style={styles.infoTitle}>Mode Of Travel</Text>
          <View style={styles.traveler}>
            {/* {selectedMode === "roadways"} */}
            <View style={styles.iconContainer}>{getTravelIcon()}</View>
            <View style={styles.travelerDetails}>
              <Text style={[styles.travelerName, { marginLeft: 15 }]}>{travelMode === 'roadways' ? vehicleType : travelMode.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.separator1} />
          <Text style={[styles.infoTitle, { marginBottom: 5, marginLeft: 2 }]}>Staying at Destination Location</Text>
          <View style={styles.traveler}>
            {/* {selectedMode === "roadways"} */}
            {/* <View style={styles.iconContainer}>{getTravelIcon()}</View> */}
            <Icon name="hourglass-half" size={30} color="#D83F3F" />
            <View style={styles.travelerDetails}>
              <Text style={[styles.travelerName, { marginLeft: 15 }]}>{`For ${stayDays} days ${stayHours} hours`}</Text>
            </View>
          </View>

          {/* <View style={styles.separator1} />
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
          </View> */}

        </View>

        <View style={{ margin: 20, marginBottom: 20 }}>
          <TouchableOpacity style={styles.button} onPress={handlePublishTravel} >
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
    width: '65%',
    gap: 7
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
    height: 200,
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
    color: '#000',
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
    color: '#000',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#D83F3F',
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  errorText: {
    color: '#D83F3F',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#D83F3F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});