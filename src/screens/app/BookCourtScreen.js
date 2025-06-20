// Minimal BookCourtScreen for testing navigation
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BookCourtScreen({ route, navigation }) {
  console.log('🟢 BookCourtScreen Loaded Successfully!');
  console.log('📦 Route params:', route.params);

  const { court, courtId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎾 BookCourt Screen Working!</Text>
      
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Court ID: {courtId || 'Not provided'}</Text>
        <Text style={styles.debugText}>Court Number: {court?.courtNumber || 'Not provided'}</Text>
        <Text style={styles.debugText}>Price: RM {court?.pricePerHour || 'Not provided'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>← Go Back to Courts</Text>
      </TouchableOpacity>

      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>✅ Navigation: Working</Text>
        <Text style={styles.statusText}>✅ Route Params: {route.params ? 'Received' : 'Missing'}</Text>
        <Text style={styles.statusText}>✅ Screen Render: Success</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 30,
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  backButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2E8B57',
  },
  statusText: {
    fontSize: 14,
    color: '#2E8B57',
    marginBottom: 4,
  },
});