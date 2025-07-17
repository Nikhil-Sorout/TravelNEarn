import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator,
  Dimensions 
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get('window');

const PublicSearchScreen = ({ navigation, route }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [hasFittedMap, setHasFittedMap] = useState(false)

  const {from, to, fullFrom, fullTo, selectedDate} = route.params;
  console.log(route.params)
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setRouteError(null);
        
        // const startingLocation = await AsyncStorage.getItem("startingLocation");
        // const goingLocation = await AsyncStorage.getItem("goingLocation");
        const startingLocation = from;
        const goingLocation = to;

        if (startingLocation && goingLocation) {
          setStartLocation(startingLocation);
          setEndLocation(goingLocation);

          // Fetch coordinates and route in parallel
          await Promise.all([
            fetchCoordinates(startingLocation, goingLocation),
            fetchRoute(startingLocation, goingLocation),
          ]);
        } else {
          setRouteError("Location data not found. Please set your start and end locations.");
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        setRouteError("Failed to load route data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const fetchRoute = async (origin, destination) => {
    try {
      console.log("Fetching route for:", origin, "to", destination);
      const GOOGLE_MAPS_API_KEY = "AIzaSyDW79z0Hne2ne3ap7ghZIe_X-UXSxUBEGc";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedCoordinates = decodePolyline(points);
        await AsyncStorage.setItem(
          "DecodedPolyLine",
          JSON.stringify(decodedCoordinates)
        );
        setCoordinates(decodedCoordinates);
        
        // Fit map to show entire route
        // if (decodedCoordinates.length > 0 && originCoords && destinationCoords) {
        //   fitMapToRoute(decodedCoordinates, originCoords, destinationCoords);
        // }
      } else {
        throw new Error(data.error_message || "No routes found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      setRouteError("Failed to fetch route. Please check your locations.");
    }
  };

  const fitMapToRoute = (routeCoordinates, origin, destination) => {
    if (!mapRef.current || routeCoordinates.length === 0) return;

    // Calculate bounds to include all points
    let minLat = Math.min(origin.latitude, destination.latitude);
    let maxLat = Math.max(origin.latitude, destination.latitude);
    let minLng = Math.min(origin.longitude, destination.longitude);
    let maxLng = Math.max(origin.longitude, destination.longitude);

    // Include route coordinates in bounds calculation
    routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    // Add padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + latPadding,
      longitudeDelta: (maxLng - minLng) + lngPadding,
    };

    setMapRegion(region);
    
    // Animate to the region
    mapRef.current.animateToRegion(region, 1000);
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
    console.log("Origin : ", origin)
    console.log("Destination : ", destination)
    const apiUrl = await AsyncStorage.getItem("apiBaseUrl");
    if (!apiUrl) {
      Alert.alert("Error", "API configuration not found");
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}map/getdistanceandcoordinate?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
      const data = await response.json();

      if (data.originCoordinates && data.destinationCoordinates) {
        const originCoords = {
          latitude: data.originCoordinates.ltd,
          longitude: data.originCoordinates.lng,
        };
        const destCoords = {
          latitude: data.destinationCoordinates.ltd,
          longitude: data.destinationCoordinates.lng,
        };
        
        setOriginCoords(originCoords);
        setDestinationCoords(destCoords);
        
        await AsyncStorage.setItem("setOriginCoords", JSON.stringify(originCoords));
        await AsyncStorage.setItem("setDestinationCoords", JSON.stringify(destCoords));

        setDistance(data.distance);
        setDuration(data.duration);
      } else {
        throw new Error("Invalid coordinates data");
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
      // setRouteError("Failed to fetch route data. Please try again.");
    }
  };

  const handleFitToRoute = () => {
    if (coordinates.length > 0 && originCoords && destinationCoords) {
      fitMapToRoute(coordinates, originCoords, destinationCoords);
    }
  };

  const handleRetry = () => {
    if (startLocation && endLocation) {
      setIsLoading(true);
      setRouteError(null);
      Promise.all([
        fetchCoordinates(startLocation, endLocation),
        fetchRoute(startLocation, endLocation),
      ]).finally(() => setIsLoading(false));
    }
  };

  // Update map region when coordinates change
  useEffect(() => {
    if (!hasFittedMap && coordinates.length > 0 && originCoords && destinationCoords && !mapRegion) {
      fitMapToRoute(coordinates, originCoords, destinationCoords);
      setHasFittedMap(true);
    }
  }, [coordinates, originCoords, destinationCoords, mapRegion, hasFittedMap]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D83F3F" />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion || {
          latitude: originCoords?.latitude || 28,
          longitude: originCoords?.longitude || 77,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        showsBuildings={true}
        mapType="standard"
      >
        {/* Route Polyline */}
        {coordinates.length > 1 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="#D83F3F"
            strokeWidth={4}
            lineDashPattern={[1]}
            zIndex={1}
          />
        )}

        {/* Start Marker */}
        {originCoords && (
          <Marker 
            coordinate={originCoords} 
            title="Start Location"
            description={startLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.marker, styles.startMarker]}>
              <Icon name="user" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* End Marker */}
        {destinationCoords && (
          <Marker 
            coordinate={destinationCoords} 
            title="Destination"
            description={endLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.marker, styles.endMarker]}>
              <Icon name="map-marker" size={20} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.header1}>
          <Ionicons
            name="chevron-back"
            style={styles.backIcon}
            size={20}
            color="white"
          />
        </View>
      </TouchableOpacity>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleFitToRoute}
        >
          <Ionicons name="locate" size={20} color="#D83F3F" />
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {routeError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{routeError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.routeInfo}>
          <View style={styles.card}>
            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locon.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={2}>
                {fullFrom || "Start location not set"}
              </Text>
            </View>

            <View style={styles.verticalseparator}></View>
            <View style={styles.separator} />

            <View style={styles.locationRow}>
              <Image
                source={require("../../Images/locend.png")}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={2}>
                {fullTo || "Destination not set"}
              </Text>
            </View>

            <View style={styles.separator1} />

            {/* Travel Time and Distance */}
            <View style={styles.infoRow}>
              <Image
                source={require("../../Images/clock.png")}
                style={[styles.locationIcon, { marginLeft: 5 }]}
              />
              <Text style={styles.infoText}>{duration || "Calculating..."}</Text>
            </View>
            <Text style={styles.infoText1}>{distance || "Calculating..."}</Text>
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, (!startLocation || !endLocation) && styles.disabledButton]}
          onPress={() => navigation.navigate("ReceiverScreen", {fullFrom, fullTo, from, to, selectedDate})}
          disabled={!startLocation || !endLocation}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    flex: 2,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "green",
  },
  endMarker: {
    backgroundColor: "red",
  },
  markerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  infoContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 90,
  },
  routeInfo: {
    marginBottom: 16,
  },
  pointContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pointCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "green",
    marginRight: 8,
  },
  pointCircleEnd: {
    backgroundColor: "red",
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontSize: 16,
    color: "#333",
    paddingVertical: 4,
  },
  dashedLineContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  dashedLine: {
    width: 1,
    height: 40,
    backgroundColor: "#ccc",
    borderStyle: "dashed",
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  distance: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  nextButton: {
    backgroundColor: "#D83F3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 1,
    marginBottom: 16,
    marginTop: 5,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#D83F3F",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#D83F3F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  mapControls: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButton: {
    padding: 8,
  },

  card: {
    backgroundColor: "white",
    margin: 1,
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 10,
    marginTop: 10,
    maxWidth: '90%'
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  separator1: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginLeft: 5,
  },
  separator: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginLeft: 40,
    marginTop: -20,
  },
  verticalseparator: {
    width: 1, // Set width to 1 for a thin line
    backgroundColor: "#ddd", // Make the background transparent
    borderStyle: "dashed", // Dotted border style
    borderLeftWidth: 1, // Add left border to simulate a vertical line
    borderLeftColor: "#ddd", // Set the color for the dotted line
    height: "40", // Set height to 100% or any specific height you need
    marginHorizontal: 11, // Optional: add horizontal spacing if needed
  },
  infoRow: {
    flexDirection: "row",
    // justifyContent: 'space-between',
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: "black",
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: -2,
  },
  infoText1: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: 32,
    marginTop: -10,
  },
  infoText2: {
    fontSize: 15,
    color: "#555",
    // fontWeight:'bold',
    marginLeft: -30,
    marginTop: -10,
  },
  header1: {
    position: "absolute",
    top: 40,
    width: "13%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D83F3F",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default PublicSearchScreen;
