import { Ionicons } from '@expo/vector-icons'; // Make sure to install 'expo/vector-icons'
import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../header';
import { SafeAreaView } from 'react-native-safe-area-context';
// Get screen width and height
const { width, height } = Dimensions.get('window');

const TermsCondition = ({navigation}) => {
  useEffect(() => {
    // Set the status bar to white background with dark content (black icons)
    StatusBar.setBarStyle('dark-content');  // Dark icons on the status bar
    StatusBar.setBackgroundColor('#ffffff');  // White background for the status bar
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Terms & Conditions" navigation={navigation} />


      {/* Scrollable Text Area */}
      <ScrollView style={styles.content}>
        <Text style={styles.text}>
          Lorem ipsum dolor sit amet consectetur. Ut sit egestas leo metus. 
          Consequat mus fringilla duis velit malesuada. Ac a libero potenti quis. 
          Semper tristique sed curabitur consectetur nibh interdum. Sed viverra a porta auctor integer risus.
          ...
          (Add the rest of your placeholder text here)
          ...
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsCondition;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    
    },
    header: {
      backgroundColor: '#D82E2F',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      marginTop: 34,

    },
    backButton: {
      marginRight: 10,
    },
    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    content: {
      padding: 15,
    },
    text: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333',
    },
});
