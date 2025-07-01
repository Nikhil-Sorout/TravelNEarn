import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Incomplete
const Traveldata = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Details</Text>
        <Ionicons name="help-circle" size={24} color="white" />
      </View>

      {/* Travel ID */}
      <View style={styles.card}>
        <View style={styles.travelIdRow}>
          <Text style={styles.travelIdText}>Travel ID: 123214120</Text>
          <Text style={styles.status}>CANCELLED</Text>
        </View>
      </View>

      {/* Route Details */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location" size={20} color="green" />
          <Text style={styles.text}>New Delhi Railway Station</Text>
        </View>
        <View style={styles.dottedLine}></View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color="red" />
          <Text style={styles.text}>Rajiv Chowk, Gurgaon</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={20} color="black" />
          <Text style={styles.text}>3hr 20 mins</Text>
          <Text style={styles.text}>170kms</Text>
        </View>
      </View>

      {/* Other Information */}
      <View style={styles.card}>
        <Text style={styles.boldText}>Other Information</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={20} color="black" />
          <Text style={styles.text}>27th January 2025, 8:30 AM</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="car-outline" size={20} color="blue" />
          <Text style={styles.text}>Flight</Text>
        </View>
      </View>

      {/* Reason for Cancellation */}
      <View style={styles.card}>
        <Text style={styles.boldText}>Reason for cancellation</Text>
        <Text style={styles.text}>
          Lorem ipsum dolor sit amet consectetur. Vel pulvinar orci mollis odio
          nullam odio. Lorem lectus eleifend quis vivamus faucibus eget metus
          nibh.
        </Text>
      </View>

      {/* Consignments and Earnings */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="cube-outline" size={20} color="black" />
          <Text style={styles.text}>Consignments to carry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="cash-outline" size={20} color="black" />
          <Text style={styles.text}>Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Cancel Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Traveldata;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  travelIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelIdText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    backgroundColor: '#ffe5e5',
    color: '#d32f2f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  boldText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dottedLine: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  cancelButton: {
    borderColor: '#d32f2f',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});
