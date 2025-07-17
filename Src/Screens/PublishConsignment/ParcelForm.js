import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from "react-native-vector-icons/FontAwesome";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from 'expo-image-picker';


const ParcelDetails = ({ navigation, route }) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Non-Document");
  const [subCategory, setSubCategory] = useState("Select Sub Category");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({
    length: 0,
    breadth: 0,
    height: 0,
  });
  const [handleWithCare, setHandleWithCare] = useState(false);
  const [specialRequest, setSpecialRequest] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState("1 HR");
  const [unit, setUnit] = useState("cm");
  const [isInch, setIsInch] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const {fullTo, fullFrom, from, to, selectedDate} = route.params
  const validateForm = () => {
    console.log(description, weight, dimensions)
    if (
      !description ||
      !weight ||
      !dimensions.length ||
      !dimensions.breadth ||
      !dimensions.height ||
      dimensions.length == 0 ||
      dimensions.breadth == 0 ||
      dimensions.height == 0
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const handleCategoryChange = (value) => {
    console.log(value);
    if (value != "null") {
      setCategory(value);
    } else {
      alert("Please select a valid option.");
    }
  };

  const handleSubCategoryChange = (value) => {
    console.log(value);
    if (value != "null") {
      setSubCategory(value);
    } else {
      alert("Please select a valid option.");
    }
  };

  const handledurationChange = (value) => {
    console.log(value);
    if (value != "null") {
      setDuration(value);
    } else {
      alert("Please select a valid option.");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `consignment_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const saveData = async () => {
    if (!validateForm()) return;
    
    try {
      const parcelDetails = {
        description,
        category,
        subCategory,
        weight,
        dimensions,
        unit: isInch ? "INCH" : "CM",
        handleWithCare,
        specialRequest,
        date: date.toDateString(),
        duration,
        images: selectedImages,
      };
      
      // Save to AsyncStorage for local storage
      await AsyncStorage.setItem(
        "parcelDetails",
        JSON.stringify(parcelDetails)
      );
      navigation.navigate("ParcelDetails", {fullFrom, fullTo, from, to, selectedDate});
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  useEffect(() => {
    const fetchTravelDate = async () => {
      try {
        const storedDate = await AsyncStorage.getItem("searchingDate");
        if (storedDate) {
          // If a date is found, parse it into a Date object
          setDate(new Date(storedDate));
        }
      } catch (error) {
        console.log("Error retrieving travel date from AsyncStorage", error);
      }
    };

    fetchTravelDate();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parcel Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Description of Consignment</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Category</Text>

        <View style={styles.input}>
          <RNPickerSelect
            onValueChange={handleCategoryChange}
            items={[
              { label: "Non-Document", value: "Non Document" },
              { label: "Document", value: "Document" },
            ]}
          >
            {/* <Text></Text> */}
            <Text>{category ? category : "Please Select Category"}</Text>
          </RNPickerSelect>

          {/* <Picker selectedValue={selectedMode} onValueChange={setSelectedMode} style={styles.picker}>
    <Picker.Item label="Hatchback Car (4 seater)" value="car" />
    <Picker.Item label="Airplane" value="airplane" />
    <Picker.Item label="Train" value="train" />
  </Picker> */}
        </View>

        <Text style={styles.label}>Sub Category</Text>

        <View style={styles.input}>
          <RNPickerSelect
            onValueChange={handleSubCategoryChange}
            items={[
              { label: "Food & Beverages", value: "Food & Beverages" },
              { label: "Electronics", value: "Electronics" },
              { label: "Clothing & Fashion", value: "Clothing & Fashion" },
              { label: "Books & Documents", value: "Books & Documents" },
              { label: "Medical Supplies", value: "Medical Supplies" },
              { label: "Fragile Items", value: "Fragile Items" },
              { label: "Automotive Parts", value: "Automotive Parts" },
              { label: "Home & Garden", value: "Home & Garden" },
              { label: "Sports Equipment", value: "Sports Equipment" },
              { label: "Jewelry & Accessories", value: "Jewelry & Accessories" },
              { label: "Tools & Hardware", value: "Tools & Hardware" },
              { label: "Toys & Games", value: "Toys & Games" },
              { label: "Other", value: "Other" },
            ]}
          >
            <Text>{subCategory ? subCategory : "Please Select Sub Category"}</Text>
          </RNPickerSelect>
        </View>

        <Text style={styles.label}>Weight (Kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weight}
          placeholder="0.00"
          onChangeText={setWeight}
        />

        {/* <View style={styles.inputContainer1}>
          <TextInput
            style={styles.weightinput}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <Text style={styles.unitText}>KG</Text>
        </View> */}

        {/* <Text style={styles.label}>Dimensions (cm)</Text> */}

        <View style={styles.rowContainer}>
          <Text style={styles.label}>Dimensions</Text>

          <View style={styles.switchContainer}>
            <Text style={[styles.unitText, !isInch && styles.activeText]}>
              CM
            </Text>
            <Switch
              trackColor={{ false: "#ccc", true: "green" }}
              thumbColor="#fff"
              ios_backgroundColor="#ccc"
              onValueChange={() => setIsInch(!isInch)}
              value={isInch}
              style={{ transform: [{ scale: 0.6 }] }}
            />
            <Text style={[styles.unitText, isInch && styles.activeText]}>
              INCH
            </Text>
          </View>
        </View>

        <View style={styles.dimensionContainer}>
          <TextInput
            style={styles.dimensionInput}
            placeholder="Length"
            keyboardType="numeric"
             onChangeText={(val) =>{
              const sanitized = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
              console.log(sanitized)
              setDimensions({ ...dimensions, length: sanitized })
            }
            }
          />
          <Text style={styles.dimensionCross}>X</Text>
          <TextInput
            style={styles.dimensionInput}
            placeholder="Breadth"
            keyboardType="numeric"
             onChangeText={(val) =>{
              const sanitized = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
              setDimensions({ ...dimensions, breadth: sanitized })
            }
            }
          />
          <Text style={styles.dimensionCross}>X</Text>

          <TextInput
            style={styles.dimensionInput}
            placeholder="Height"
            keyboardType="numeric"
            onChangeText={(val) =>{
              const sanitized = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
              setDimensions({ ...dimensions, height: sanitized })
            }
            }
          />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Handle with care?</Text>
        {/* <TouchableOpacity style={handleWithCare ? styles.buttonActive : styles.button} onPress={() => setHandleWithCare(!handleWithCare)}>
          <Text>{handleWithCare ? 'Yes' : 'No'}</Text>
        </TouchableOpacity> */}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              handleWithCare === true && styles.buttonActive,
            ]}
            onPress={() => setHandleWithCare(true)}
          >
            <Text
              style={[
                styles.text,
                handleWithCare === true && styles.textActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              handleWithCare === false && styles.buttonActive,
            ]}
            onPress={() => setHandleWithCare(false)}
          >
            <Text
              style={[
                styles.text,
                handleWithCare === false && styles.textActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>
          Special request (If any)
        </Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={specialRequest}
          onChangeText={setSpecialRequest}
        />

        <View>
          <Text style={styles.label}>Date of sending</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.input}>{selectedDate.toDateString()}</Text>
            {/* <Icon name="calendar" size={20} color="#aaa" style={styles.calendarIcon} /> */}
          </TouchableOpacity>
        </View>

        {/* {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
        )} */}

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))} // Set minimum date to day after tomorrow
          />
        )}

        <Text style={styles.label}>Duration at end point</Text>

        <View style={styles.input}>
          <RNPickerSelect
            onValueChange={handledurationChange}
            items={[
              { label: "1 HR", value: "1 HR" },
              { label: "2 HR", value: "2 HR" },
            ]}
          >
            {/* <Text></Text> */}
            <Text>{duration ? duration : "Please Select Duration"}</Text>
          </RNPickerSelect>
        </View>

        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text>+ Choose from device</Text>
        </TouchableOpacity>

        {/* Display selected images */}
        {selectedImages.length > 0 && (
          <View style={styles.imageContainer}>
            <Text style={styles.label}>Selected Images ({selectedImages.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#D83F3F" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={saveData}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    //  marginTop: 40
  },
  scrollContainer: { padding: 16 },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dimensionContainer: { flexDirection: "row", justifyContent: "space-between" },
  dimensionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    flex: 1,
    marginRight: 5,
    borderRadius: 8,
    color : 'black'
  },
  dimensionCross: { padding: 10 },
  button: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#D83F3F",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: "#D83F3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonActive: {
    borderColor: "green",
    backgroundColor: "#e0ffe0",
  },
  text: {
    fontSize: 16,
    color: "black",
  },
  textActive: {
    color: "green",
    fontWeight: "bold",
  },
  inputContainer1: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 20,
  },
  weightinput: {
    borderRadius: 8,
    flex: 1, // Takes up remaining space
    fontSize: 25,
    height: 25,
  },
  unitText: {
    fontSize: 12,
    color: "#555",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Moves toggle to the right
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0, // Adds spacing between CM, Switch, and INCH
  },
  activeText: {
    color: "green",
    fontWeight: "bold",
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  selectedButton: {
    backgroundColor: "green",
  },
  toggleText: {
    fontSize: 10,
    color: "#000",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default ParcelDetails;
