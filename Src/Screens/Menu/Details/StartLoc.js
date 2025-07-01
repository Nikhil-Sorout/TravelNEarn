import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// Incompleted

const StartLoc = () => {
  const favorites = [
    { id: 1, icon: 'home', label: 'Home' },
    { id: 2, icon: 'briefcase', label: 'Work' },
    { id: 3, icon: 'map-marker', label: 'Other' },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Starting Location</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="ellipse" size={12} color="green" style={styles.statusIcon} />
        <TextInput
          style={styles.input}
          placeholder="E-81, 2nd floor, West Patel Nagar"
          placeholderTextColor="#777"
        />
        <TouchableOpacity>
          <Ionicons name="close" size={18} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Favorites Section */}
      <Text style={styles.sectionTitle}>Favourites</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.favoriteItem}>
            <FontAwesome name={item.icon} size={18} color="#4CAF50" style={styles.icon} />
            <Text style={styles.favoriteText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="locate" size={18} color="#FF5722" />
          <Text style={styles.footerText}>Current Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="map-outline" size={18} color="#FF5722" />
          <Text style={styles.footerText}>Locate on map</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default StartLoc;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    padding: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 15,
    padding: 10,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  sectionTitle: {
    marginLeft: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 15,
  },
  favoriteText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  footerText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#FF5722',
  },
});
