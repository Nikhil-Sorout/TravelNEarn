import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Install expo icons
import { Picker } from '@react-native-picker/picker'; // Import from @react-native-picker/picker
import React, { useState } from 'react';
const { width, height } = Dimensions.get('window'); // Get screen dimensions
import Header from '../../header';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';


const Contact = ({navigation}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  


  const handleValueChange = (value) => {
    console.log(value)
    if (value!='null') {
      setSubject(value);
    } else {
      alert("Please select a valid option.");
    }
  };

  return (
    <View style={styles.container}>
        {/* Header */}
        <Header title="Contact Us" navigation={navigation} />

        <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.title}>Get in touch with us</Text>
          <Text style={styles.subtitle}>
            Lorem ipsum dolor sit amet consectetur. Posuere sed odio elementum
            nunc volutpat egestas nunc ridiculus leo.
          </Text>
       
        </View>

        {/* Subject Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject</Text>
                  <View style={styles.input}>
          
          <RNPickerSelect
       onValueChange={handleValueChange}
      items={[
        { label: 'I want to give you a feedback', value: 'I want to give you a feedback' },

      ]}
     
    >
 
      
{/* <Text></Text> */}
<Text>{subject ? subject : "Please select a mode"}</Text>
      </RNPickerSelect>
      </View>
        </View>

        {/* Message Box */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Type your message here..."
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Contact;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop:20
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: '#D83F3F',
    paddingVertical: height * 0.02, // Adjust for better touch on smaller screens
    paddingHorizontal: width * 0.05, // Dynamic horizontal padding
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:30
  },
  headerIcon: {
    position: 'absolute', // Position the icon absolutely
    marginLeft: 20, 
    left: 16, // Add padding to the left
  },
  headerTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  contactInfo: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6e6e6e',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
