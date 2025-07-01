import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const TravelDetailsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Details</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
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
            <MaterialCommunityIcons name="cube-outline" size={24} color="#333" />
            <Text style={styles.consignmentText}>Consignments to carry</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
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
            <Ionicons name="time-outline" size={20} color="#333" />
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
            <Ionicons name="time-outline" size={20} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>7th August 2024</Text>
              <Text style={styles.infoSubtext}>7:00 AM</Text>
            </View>
          </View>
          
          {/* Car Type */}
          <View style={styles.infoItem}>
            <FontAwesome5 name="car" size={20} color="#333" />
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
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  notificationButton: {
    padding: 5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ffd166',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#333',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  idCard: {
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 0,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#fff7d6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  statusText: {
    color: '#dda900',
    fontWeight: '600',
    fontSize: 12,
  },
  consignmentCard: {
    backgroundColor: 'white',
    margin: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  consignmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  routeCard: {
    backgroundColor: 'white',
    margin: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  locationIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e34d4d',
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dottedLine: {
    width: 1,
    height: 20,
    backgroundColor: '#ccc',
    marginLeft: 12,
    marginVertical: 2,
  },
  travelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  travelTextContainer: {
    marginLeft: 15,
  },
  travelTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  travelDistanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mapSection: {
    margin: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mapContainer: {
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e1e1e1',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  otherInfoSection: {
    margin: 15,
    marginVertical: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 15,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#e34d4d',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e34d4d',
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomIndicator: {
    width: 50,
    height: 5,
    backgroundColor: '#888',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
});

export default TravelDetailsScreen;