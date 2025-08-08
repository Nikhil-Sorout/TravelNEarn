import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCityStateFromPincode } from '../../Utils/addressResolver';

const saveAsOptions = [
  { key: 'Home', label: 'Home', icon: <MaterialIcons name="home" size={22} /> },
  { key: 'Work', label: 'Work', icon: <Ionicons name="briefcase" size={22} /> },
  { key: 'Other', label: 'Other', icon: <FontAwesome name="tag" size={20} /> },
];

const AddStartingCityAddress = ({ route, navigation }) => {


  console.log("Address field type: ", addressFieldType)
  const [area, setArea] = useState(route.params?.area || '');
  const [pinCode, setPinCode] = useState(route.params?.pincode || '');
  const [city, setCity] = useState(route.params?.city || '');
  const [state, setState] = useState(route.params?.state || '');
  const [flat, setFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [saveAs, setSaveAs] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const lastFetchedPincode = useRef(null);


  // Get address details and coordinates from navigation params
  const { latitude, longitude } = route.params || {};
  const addManually = route?.params?.addManually;
  // useEffect(() => {
  //   const setVar = async () => {
  //     setCity(city);
  //     setState(state);
  //     setPinCode(pincode);
  //     setArea(area);
  //   }
  //   setVar();
  // }, [city,state])

  useEffect(() => {
    const fetchCityState = async () => {
      if (pinCode.length === 6 && pinCode !== lastFetchedPincode.current) {
        lastFetchedPincode.current = pinCode;
        const { city, state } = await getCityStateFromPincode(pinCode);
        setCity(city);
        setState(state);
      } else if (pinCode.length < 6) {
        setCity('');
        setState('');
      }
    };

    const delayDebounce = setTimeout(fetchCityState, 500);
    return () => clearTimeout(delayDebounce);
  }, [pinCode]);

  const addressFieldType = route?.params?.addressFieldType


  // Validation and save handler
  const handleSave = async () => {
    if (!flat.trim()) {
      Alert.alert('Error', 'Please enter flat, housing no., building, apartment, floor.');
      return;
    }
    if (saveAs === 'Other' && !customLabel.trim()) {
      Alert.alert('Error', 'Please enter a custom label for this address.');
      return;
    }

    // Validate that we have at least basic location information
    if (!area && !city) {
      Alert.alert('Error', 'Location information is missing. Please go back and select a valid location.');
      return;
    }

    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");

      // Compose the request body with better handling of missing data
      const body = {
        phoneNumber,
        location: area || city, // Use area if available, otherwise city
        pincode: pinCode || '', // Ensure pincode is never undefined
        flat,
        street: area || city, // Use area if available, otherwise city
        landmark: landmark || '', // Ensure landmark is never undefined
        city: city || area, // Use city if available, otherwise area
        state: state || '', // Ensure state is never undefined
        saveAs: saveAs === "Other" ? "Others" : saveAs, // backend expects "Others"
        customName: saveAs === "Other" ? customLabel : undefined,
        displayAddress: `${flat}, ${landmark ? landmark + ', ' : ''}${area || city}, ${city || area}, ${state}${pinCode ? ' - ' + pinCode : ''}`,
        googleMapsAddress: `${area || city}, ${city || area}, ${state}${pinCode ? ' - ' + pinCode : ''}`,
        latitude: "",
        longitude: "",
      };
      // Remove undefined fields
      console.log(body)
      Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
      const response = await fetch(`${baseurl}address/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Address saved successfully!");
        if (addressFieldType === 'from') {
          await AsyncStorage.setItem("addressFrom", JSON.stringify(body));
        } else {
          await AsyncStorage.setItem("addressTo", JSON.stringify(body));
        }

        navigation.popToTop();
      } else {
        Alert.alert("Error", data.message || "Failed to save address.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    }
  };

  // const handlePincode = async () => {
  //   const { city, state } = await getCityStateFromPincode(value);
  //   return {city, state}
  // }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Add ${addressFieldType === "from" ? "Starting" : "Destination"} City Address`}</Text>
        </View>
        {/* Map */}
        <View style={styles.mapContainer}>
          {latitude && longitude ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={{
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={{ latitude, longitude }} />
            </MapView>
          ) : (<>
            <TouchableOpacity style={{ backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5, position: 'absolute', bottom: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => navigation.replace("Address")}
            >
              <MaterialIcons name="my-location" size={22} color="#888" style={{ opacity: 0.8 }} />
              <Text style={{ color: '#888', textAlign: 'center' }}>Select Location</Text>
            </TouchableOpacity>
          </>
          )}
        </View>
        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.label]}>Flat, Housing no., Building, Apartment, Floor <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter flat, housing no, building, apartment, ..."
            placeholderTextColor="#000"
            value={flat}
            multiline={true}
            numberOfLines={1}
            onChangeText={setFlat}
          />
          <Text style={styles.label}>Landmark</Text>
          <TextInput
            style={styles.input}
            placeholder="Landmark (optional)"
            placeholderTextColor="#000"
            value={landmark}
            onChangeText={setLandmark}
          />
          <Text style={styles.label}>Area, street, sector</Text>
          <TextInput
            style={[styles.input, !area && !addManually && styles.missingField]}
            value={area || ''}
            editable={addManually}
            onChangeText={(text)=>setArea(text)}
          />
          {!area && !addManually && (
            <Text style={styles.warningText}>
              ⚠️ Area information could not be extracted. Using city as area.
            </Text>
          )}
          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={[styles.input, !pinCode && !addManually && styles.missingField]}
            placeholder="Enter PIN code"
            placeholderTextColor="#000"
            keyboardType="number-pad"
            value={pinCode}
            onChangeText={setPinCode}
            maxLength={6}
          />
          {!pinCode && !addManually && (
            <Text style={styles.warningText}>
              ⚠️ Pincode could not be extracted from the address. You may want to verify the location.
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, !city && styles.missingField]}
                value={city || 'City not found'}
                editable={false}
              />
              {!city && (
                <Text style={styles.warningText}>
                  ⚠️ City information could not be extracted.
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={[styles.input, !state && styles.missingField]}
                value={state || 'State not found'}
                editable={false}
              />
              {!state && (
                <Text style={styles.warningText}>
                  ⚠️ State information could not be extracted.
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.label}>Save as</Text>
          <View style={styles.saveAsRow}>
            {saveAsOptions.map(option => {
              const isSelected = saveAs === option.key;
              const bgColor = isSelected ? 'lightgrey' : '#fff'; // Light blue when selected, white otherwise
              const borderColor = isSelected ? 'lightgrey' : '#bbb';
              const iconColor = isSelected ? '#fff' : '#222';
              const textColor = isSelected ? '#fff' : '#222';
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.saveAsOption, { backgroundColor: bgColor, borderColor: borderColor }]}
                  onPress={() => setSaveAs(option.key)}
                  activeOpacity={0.8}
                >
                  {React.cloneElement(option.icon, { color: iconColor })}
                  <Text style={[styles.saveAsLabel, { color: textColor }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {saveAs === 'Other' && (
            <TextInput
              style={styles.input}
              placeholder="Enter custom label"
              placeholderTextColor="#000"
              value={customLabel}
              onChangeText={setCustomLabel}
            />
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '500', marginLeft: 15, color: '#222' },
  mapContainer: { height: 160, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 10 },
  map: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  form: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 15, color: '#333', marginTop: 10, marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 2 },
  saveAsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 },
  saveAsOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 2,
    borderRadius: 10,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderColor: '#bbb',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 1,
  },
  saveAsSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOpacity: 0.18,
  },
  saveAsLabel: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
    letterSpacing: 0.2,
    textAlignVertical: 'center',
  },
  saveAsLabelSelected: {
    color: '#fff',
  },
  saveBtn: { backgroundColor: '#D32F2F', borderRadius: 8, marginTop: 20, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  missingField: { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' },
  warningText: { color: '#856404', fontSize: 12, marginTop: 4, marginBottom: 8, fontStyle: 'italic' },
});

export default AddStartingCityAddress; 