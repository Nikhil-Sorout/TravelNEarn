import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ConsignmentListScreen = ({ route, navigation }) => {
  const { request } = route.params || {}; // Default to empty object if undefined
  const description = "Lorem ipsum dolor sit amet consectetur. Tincidunt nec consectetur.";
  const handleWithCare = "YES";
  const specialRequests = "NO";
  const date = request?.dateParam ? new Date(request.dateParam).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : "21/01/2024, 9:00 AM";
  const earning = request?.earning || "₹500";
  console.log("request", request)
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Consignment Requests</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={20} color="#4CAF50" />
          <Text style={styles.locationText}>{request?.pickup || "Kashmiri Gate ISBT, New Delhi"}</Text>
          <Ionicons name="location" size={20} color="#F44336" style={styles.dropIcon} />
          <Text style={styles.locationText}>{request?.drop || "Amritsar Bus Terminal"}</Text>
        </View>
        <Text style={styles.descriptionTitle}>Description of Consignment</Text>
        <Text style={styles.descriptionText}>{description}</Text>
        <View style={styles.detailsRow}>
          <Ionicons name="scale" size={20} color="#2196F3" />
          <Text style={styles.detailText}>Weight {request?.weight || "250gms"}</Text>
          <Ionicons name="cube" size={20} color="#9C27B0" />
          <Text style={styles.detailText}>Dimensions {request?.dimensions || "10x10x12"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="hand" size={20} color="#FF9800" />
          <Text style={styles.detailText}>Handle with Care {handleWithCare}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="star" size={20} color="#FFEB3B" />
          <Text style={styles.detailText}>Special Requests {specialRequests}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#795548" />
          <Text style={styles.detailText}>Date to carry the Consignment {date}</Text>
        </View>
        <View style={styles.earningRow}>
          <Ionicons name="cash" size={20} color="#FF9800" />
          <Text style={styles.earningText}>Total expected earning {earning}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.rejectButton} onPress={() => alert('Rejected')}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={() => alert('Accepted')}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#D32F2F',
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 5,
    flex: 1,
  },
  dropIcon: {
    marginLeft: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default  ConsignmentListScreen;


