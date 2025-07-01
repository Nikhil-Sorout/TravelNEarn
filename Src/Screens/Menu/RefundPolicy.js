import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import Header from '../../header';
const PrivacyPolicy = () => {
    const navigation = useNavigation(); // Initialize navigation

    return (
        <View style={styles.container}>
          {/* Header */}
          <Header title="Refund Policy" navigation={navigation} />

    
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
        </View>
    );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      marginTop:20
    },
    header: {
      backgroundColor: '#D82E2F',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      justifyContent: 'space-between',  // Adjusted to space between the items
      marginTop:30
    },
    backButton: {
      marginRight: 10,
    },
    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1, // Makes the header title take up all available space
      textAlign: 'center', // Centers the title
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
