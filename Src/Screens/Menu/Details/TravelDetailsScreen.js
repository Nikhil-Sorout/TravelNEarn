import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";

// Responsive scaling functions
const { width, height } = Dimensions.get("window");
const scale = (size) => {
  const baseWidth = 393; // iPhone 14 Pro width
  const scaleFactor = width / baseWidth;
  return Math.round(size * scaleFactor);
};
const verticalScale = (size) => {
  const baseHeight = 852; // iPhone 14 Pro height
  const scaleFactor = height / baseHeight;
  return Math.round(size * scaleFactor);
};
const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const TravelDetailsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={scale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Det</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={scale(24)} color="#fff" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Travel ID Card */}
        <View style={styles.idCard}>
          <Text style={styles.travelId}>Travel ID:123214120</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>YET TO START</Text>
          </View>
        </View>
        
        {/* Consignments Section */}
        <TouchableOpacity style={styles.consignmentCard}>
          <View style={styles.consignmentRow}>
            <MaterialCommunityIcons name="cube-outline" size={scale(24)} color="#333" />
            <Text style={styles.consignmentText}>Consignments to carry</Text>
          </View>
          <Ionicons name="chevron-forward" size={scale(20)} color="#888" />
        </TouchableOpacity>
        
        {/* Travel Route Card */}
        <View style={styles.routeCard}>
          {/* Start Point */}
          <View style={styles.routePoint}>
            <View style={styles.locationIconContainer}>
              <View style={styles.greenDot}></View>
            </View>
            <Text style={styles.locationText}>New Delhi Railway Station</Text>
          </View>
          
          {/* Dotted Line */}
          <View style={styles.dottedLine}></View>
          
          {/* End Point */}
          <View style={styles.routePoint}>
            <View style={styles.locationIconContainer}>
              <View style={styles.redDot}></View>
            </View>
            <Text style={styles.locationText}>Rajic Chowk, Gurgaon</Text>
          </View>
          
          {/* Travel Time and Distance */}
          <View style={styles.travelInfo}>
            <Ionicons name="time-outline" size={scale(20)} color="#333" />
            <View style={styles.travelTextContainer}>
              <Text style={styles.travelTimeText}>1hr 40 mins</Text>
              <Text style={styles.travelDistanceText}>50kms</Text>
            </View>
          </View>
        </View>
        
        {/* Map Section */}
        {/* <View style={styles.mapSection}>
        //   <Text style={styles.sectionTitle}>Track on map</Text>
        //   <View style={styles.mapContainer}>
        //     <Image
        //       source={require('./assets/map-placeholder.png')}
        //       style={styles.mapImage}
        //       resizeMode="cover"
        //     />
        //   </View> */}
        {/* // </View> */}
        
        {/* Other Information */}
        <View style={styles.otherInfoSection}>
          <Text style={styles.sectionTitle}>Other Information</Text>
          
          {/* Date and Time */}
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={scale(20)} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>7th August 2024</Text>
              <Text style={styles.infoSubtext}>7:00 AM</Text>
            </View>
          </View>
          
          {/* Car Type */}
          <View style={styles.infoItem}>
            <FontAwesome5 name="car" size={scale(20)} color="#333" />
            <Text style={styles.infoText}>Hatchback Car (4 Seater)</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel Travel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Travel</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom Indicator */}
      <View style={styles.bottomIndicator}></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e34d4d',
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(15),
  },
  backButton: {
    padding: scale(5),
  },
  headerTitle: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  notificationButton: {
    padding: scale(5),
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ffd166',
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#333',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  idCard: {
    backgroundColor: 'white',
    margin: scale(15),
    marginBottom: 0,
    padding: scale(15),
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: scale(1) },
    shadowRadius: scale(2),
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelId: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#fff7d6',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: scale(4),
  },
  statusText: {
    color: '#dda900',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  consignmentCard: {
    backgroundColor: 'white',
    margin: scale(15),
    marginVertical: verticalScale(10),
    padding: scale(15),
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: scale(1) },
    shadowRadius: scale(2),
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(15),
  },
  consignmentText: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: '#333',
  },
  routeCard: {
    backgroundColor: 'white',
    margin: scale(15),
    marginVertical: verticalScale(10),
    padding: scale(15),
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: scale(1) },
    shadowRadius: scale(2),
    elevation: 2,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(5),
  },
  locationIconContainer: {
    width: scale(24),
    alignItems: 'center',
    marginRight: scale(15),
  },
  greenDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#4CAF50',
  },
  redDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#e34d4d',
  },
  locationText: {
    fontSize: moderateScale(15),
    color: '#333',
    fontWeight: '500',
  },
  dottedLine: {
    width: scale(1),
    height: verticalScale(20),
    backgroundColor: '#ccc',
    marginLeft: scale(12),
    marginVertical: verticalScale(2),
  },
  travelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(15),
    paddingTop: verticalScale(15),
    borderTopWidth: scale(1),
    borderTopColor: '#f0f0f0',
  },
  travelTextContainer: {
    marginLeft: scale(15),
  },
  travelTimeText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#333',
  },
  travelDistanceText: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: verticalScale(2),
  },
  mapSection: {
    margin: scale(15),
    marginVertical: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: verticalScale(10),
  },
  mapContainer: {
    height: verticalScale(160),
    borderRadius: scale(8),
    overflow: 'hidden',
    backgroundColor: '#e1e1e1',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  otherInfoSection: {
    margin: scale(15),
    marginVertical: verticalScale(10),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: scale(15),
    borderRadius: scale(8),
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: scale(1) },
    shadowRadius: scale(2),
    elevation: 1,
  },
  infoTextContainer: {
    marginLeft: scale(15),
  },
  infoText: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: '#333',
    marginLeft: scale(15),
  },
  infoSubtext: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: scale(15),
    backgroundColor: 'white',
    borderTopWidth: scale(1),
    borderTopColor: '#eaeaea',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(15),
    borderWidth: scale(1),
    borderColor: '#e34d4d',
    borderRadius: scale(5),
    marginRight: scale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e34d4d',
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    paddingVertical: verticalScale(15),
    backgroundColor: '#4CAF50',
    borderRadius: scale(5),
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomIndicator: {
    width: scale(50),
    height: verticalScale(5),
    backgroundColor: '#888',
    borderRadius: scale(2.5),
    alignSelf: 'center',
    marginBottom: verticalScale(10),
  },
});

export default TravelDetailsScreen;