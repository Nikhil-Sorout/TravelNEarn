import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../header';
const { width, height } = Dimensions.get('window'); // Get screen dimensions

const HelpSupp = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Help & Support" navigation={navigation} />


      {/* Options */}
      <View style={styles.optionContainer}>
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => navigation.navigate('FAQ')} // Navigate to the FAQ screen
        >
          <Text style={styles.optionText}>FAQ's</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => navigation.navigate('Contact')} // Navigate to the ContactUs screen
        >
          <Text style={styles.optionText}>Contact Us</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => navigation.navigate('Refund')} // Navigate to the RefundPolicy screen
        >
          <Text style={styles.optionText}>Refund Policy</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',

  },
  
 
  optionContainer: {
    backgroundColor: 'white',
    // marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.02, // Relative vertical padding
    paddingHorizontal: width * 0.05, // Dynamic horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: width * 0.04, // Relative font size for better legibility
    color: 'black',
  },
});

export default HelpSupp;
