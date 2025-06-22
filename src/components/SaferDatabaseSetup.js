// src/components/SaferDatabaseSetup.js
// Improved version that doesn't accidentally delete everything

import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { checkCollectionsStatus } from '../utils/hardcodedDatabaseSetup';
import { createSamplePendingBookings, checkBookingStatuses } from '../utils/createPendingBookings';
import { updateUserToCourtAdmin } from '../utils/updateUserRole';
import { useAuth } from '../contexts/AuthContext';

export default function SaferDatabaseSetup() {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingStatuses, setBookingStatuses] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const [statusResult, bookingStats] = await Promise.all([
        checkCollectionsStatus(),
        checkBookingStatuses()
      ]);
      
      if (statusResult.success) {
        setDbStatus(statusResult.status);
      }
      setBookingStatuses(bookingStats);
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const handleCreatePendingBookings = async () => {
    Alert.alert(
      '📋 Create Test Bookings',
      'This will create 3 sample pending bookings for testing the approval feature. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await createSamplePendingBookings();
              if (result.success) {
                Alert.alert('✅ Success', result.message);
                checkStatus(); // Refresh status
              } else {
                Alert.alert('❌ Error', result.error);
              }
            } catch (error) {
              Alert.alert('❌ Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpgradeToCourtAdmin = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    Alert.alert(
      '🔧 Upgrade Role',
      'This will upgrade your current user to Court Admin role. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await updateUserToCourtAdmin(user.uid);
              if (result.success) {
                Alert.alert(
                  '✅ Success', 
                  'Role upgraded! Please restart the app for changes to take effect.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('❌ Error', result.error);
              }
            } catch (error) {
              Alert.alert('❌ Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateIndex = () => {
    Alert.alert(
      '🗂️ Create Firebase Index',
      'To fix the booking loading error, you need to create a composite index in Firebase Console.\n\n1. Go to Firebase Console\n2. Navigate to Firestore → Indexes\n3. Create composite index:\n   - Collection: bookings\n   - Field 1: status (Ascending)\n   - Field 2: createdAt (Descending)\n\nOr click the URL from the error message to auto-create it.',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          🛠️ Development Tools
        </Text>
        
        {/* Status Display */}
        {dbStatus && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>📊 Database Status:</Text>
            <Text style={styles.statusText}>🏟️ Courts: {dbStatus.courts?.count || 0}</Text>
            <Text style={styles.statusText}>👥 Users: {dbStatus.users?.count || 0}</Text>
            <Text style={styles.statusText}>📅 Bookings: {dbStatus.bookings?.count || 0}</Text>
            
            {bookingStatuses && (
              <View style={styles.bookingStats}>
                <Text style={styles.statusTitle}>📋 Booking Status:</Text>
                {Object.entries(bookingStatuses).map(([status, count]) => (
                  <Text key={status} style={styles.statusText}>
                    • {status}: {count}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCreatePendingBookings}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="clock-outline"
          >
            Create Pending Bookings
          </Button>

          <Button
            mode="outlined"
            onPress={handleUpgradeToCourtAdmin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="account-star"
          >
            Upgrade to Court Admin
          </Button>

          <Button
            mode="outlined"
            onPress={handleCreateIndex}
            style={styles.button}
            icon="database"
          >
            Fix Index Error
          </Button>

          <Button
            mode="outlined"
            onPress={checkStatus}
            disabled={loading}
            style={styles.button}
            icon="refresh"
          >
            Refresh Status
          </Button>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ These are development tools. Remove this component before production!
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: '#fff9c4'
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#b8860b'
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057'
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4
  },
  bookingStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6'
  },
  buttonContainer: {
    gap: 8
  },
  button: {
    marginBottom: 8
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic'
  }
});