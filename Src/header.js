import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  scale,
  verticalScale,
  fontScale,
} from './Utils/responsive';

const Header = ({ title, navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={scale(24)} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#D83F3F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D83F3F',
    height: verticalScale(60),
    paddingHorizontal: 0,
  },
  backButton: {
    position: 'absolute',
    left: scale(15),
  },
  headerTitle: {
    color: '#fff',
    fontSize: fontScale(18),
    fontWeight: 'bold',
  },
});

export default Header;
