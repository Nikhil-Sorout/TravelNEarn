import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Header = ({ title, navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D83F3F',
        height: 60,
        paddingHorizontal: 0,
        
      },
      backButton: {
        position: 'absolute',
        left: 15,
      },
      headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
      },
});

export default Header;
