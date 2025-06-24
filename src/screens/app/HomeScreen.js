// src/screens/app/HomeScreen.js - IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, ActivityIndicator, 
  Portal, Snackbar, Chip
} from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';
import { setupDemoCourts, checkIfCourtsExist } from '../../utils/setupDemoData';
import { createRolesCollection, updateAllUsersWithPermissions } from '../../utils/databaseSetup';
import { 
  setupCompleteDatabase, 
  checkCollectionsStatus, 
  setupCurrentUserBookings,
  clearAllCollections 
} from '../../utils/hardcodedDatabaseSetup';
import { setupSamplePendingBookings } from '../../utils/bookingUtils';
import { createSamplePendingBookings } from '../../utils/createPendingBookings';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  
  // IMPROVED: Separate counts for better accuracy
  const [availableCourtsCount, setAvailableCourtsCount] = useState(0);
  const [totalCourtsCount, setTotalCourtsCount] = useState(0);
  const [userBookingsCount, setUserBookingsCount] = useState(0);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  
  // IMPROVED: Loading states for better UX
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setupRealtimeListeners();
    }
  }, [user]);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  // IMPROVED: Real-time listeners for live data updates
  const setupRealtimeListeners = () => {
    console.log('🔄 Setting up real-time listeners...');
    setDashboardLoading(true);

    // 1. Real-time Available Courts Count
    const courtsRef = collection(db, 'courts');
    const availableCourtsQuery = query(courtsRef, where('status', '==', 'available'));
    
    const unsubscribeCourts = onSnapshot(courtsRef, (snapshot) => {
      const totalCourts = snapshot.size;
      const availableCourts = snapshot.docs.filter(doc => 
        doc.data().status === 'available'
      ).length;
      
      setTotalCourtsCount(totalCourts);
      setAvailableCourtsCount(availableCourts);
      
      console.log(`🏟️ Courts updated: ${availableCourts}/${totalCourts} available`);
    });

    // 2. Real-time User Bookings Count & Recent Bookings
    const bookingsRef = collection(db, 'bookings');
    const userBookingsQuery = query(
      bookingsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBookings = onSnapshot(userBookingsQuery, (snapshot) => {
      const allUserBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent bookings (last 5)
      const recentBookings = allUserBookings.slice(0, 5);
      setRecentBookings(recentBookings);
      
      // Count user's total bookings
      setUserBookingsCount(allUserBookings.length);
      
      console.log(`📅 User bookings updated: ${allUserBookings.length} total, ${recentBookings.length} recent`);
      setDashboardLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      unsubscribeCourts();
      unsubscribeBookings();
    };
  };

  // IMPROVED: Enhanced database status check
  const checkDatabaseStatus = async () => {
    try {
      const result = await checkCollectionsStatus();
      if (result.success) {
        setDbStatus(result.status);
        console.log('📊 Database Status:', result.status);
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  // IMPROVED: Helper functions for better formatting
  const formatBookingTime = (booking) => {
    if (!booking.date || !booking.timeSlot) {
      return 'Date/time not set';
    }
    
    try {
      const date = new Date(booking.date);
      const dateStr = date.toLocaleDateString('en-MY', { 
        day: 'numeric', 
        month: 'short' 
      });
      return `${dateStr} at ${booking.timeSlot}`;
    } catch (error) {
      return `${booking.date} at ${booking.timeSlot}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'approved': 
        return '#4CAF50';
      case 'pending': 
        return '#FF9800';
      case 'cancelled':
      case 'rejected': 
        return '#F44336';
      case 'completed': 
        return '#2196F3';
      default: 
        return '#9E9E9E';
    }
  };

  const getBookingStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'CONFIRMED';
      case 'approved': return 'APPROVED';
      case 'pending': return 'PENDING';
      case 'cancelled': return 'CANCELLED';
      case 'rejected': return 'REJECTED';
      case 'completed': return 'COMPLETED';
      default: return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  // IMPROVED: Better demo setup with real-time refresh
  const handleSetupDemo = async () => {
    setLoading(true);
    try {
      // Check if courts already exist
      const courtsExist = await checkIfCourtsExist();
      
      if (courtsExist) {
        showSnackbar('Demo courts already exist! You can start booking.');
        setLoading(false);
        return;
      }

      const result = await setupDemoCourts();
      
      if (result.success) {
        showSnackbar('✅ Demo courts added successfully!');
        // Real-time listeners will automatically update the counts
      } else {
        showSnackbar('❌ Failed to setup demo courts');
      }
    } catch (error) {
      console.error('Demo setup error:', error);
      showSnackbar('❌ Error setting up demo courts');
    } finally {
      setLoading(false);
    }
  };



  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Text variant="bodyLarge" style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!
          </Text>
          <Text variant="titleLarge" style={styles.userName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Futsal Player'}
          </Text>
          <Text variant="bodyMedium" style={styles.welcomeText}>
            Ready to book your next futsal session?
          </Text>
        </Card.Content>
      </Card>

      {/* IMPROVED: Accurate Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard} onPress={() => navigation.navigate('Courts')}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {availableCourtsCount}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Available Courts
            </Text>
            {totalCourtsCount > 0 && (
              <Text variant="bodySmall" style={styles.statSubtext}>
                of {totalCourtsCount} total
              </Text>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard} onPress={() => navigation.navigate('MyBookings')}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {recentBookings.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Recent Bookings
            </Text>
            {userBookingsCount > recentBookings.length && (
              <Text variant="bodySmall" style={styles.statSubtext}>
                of {userBookingsCount} total
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Courts')}
              style={styles.primaryButton}
              buttonColor={Colors.primary}
              icon="calendar-plus"
              contentStyle={styles.buttonContent}
            >
              Book Court
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('MyBookings')}
              style={styles.secondaryButton}
              icon="calendar-check"
              contentStyle={styles.buttonContent}
            >
              My Bookings
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Demo Setup (Show only if no courts exist) */}
      {totalCourtsCount === 0 && (
        <Card style={styles.demoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.demoTitle}>
              🚀 Get Started
            </Text>
            <Text variant="bodyMedium" style={styles.demoText}>
              Set up demo courts to start exploring the booking features!
            </Text>
            
            <Button
              mode="contained"
              onPress={handleSetupDemo}
              loading={loading}
              disabled={loading}
              style={styles.demoButton}
              icon="download"
              contentStyle={styles.buttonContent}
            >
              Setup Demo Courts
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* IMPROVED: Recent Bookings with better formatting */}
      {recentBookings.length > 0 && (
        <Card style={styles.bookingsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recent Bookings
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('MyBookings')}
                compact
              >
                View All ({userBookingsCount})
              </Button>
            </View>
            
            {recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text variant="bodyLarge" style={styles.courtName}>
                    {booking.courtName || booking.courtNumber || 'Court'}
                  </Text>
                  <Text variant="bodySmall" style={styles.bookingTime}>
                    {formatBookingTime(booking)}
                  </Text>
                  {booking.totalAmount && (
                    <Text variant="bodySmall" style={styles.bookingPrice}>
                      RM {booking.totalAmount}
                    </Text>
                  )}
                </View>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { 
                    backgroundColor: getStatusColor(booking.status) 
                  }]}
                  textStyle={styles.statusText}
                >
                  {getBookingStatusText(booking.status)}
                </Chip>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* App Features */}
      <Card style={styles.featuresCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            App Features
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏟️</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Court Booking
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Book courts with real-time availability
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🤝</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Find Opponents
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Connect with other players
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💳</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Easy Payments
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Secure and convenient payment options
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔔</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Smart Notifications
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Get updates on bookings and matches
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

    

      {/* Logout Card */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
            contentStyle={styles.buttonContent}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Snackbar for notifications */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.onBackground,
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: Colors.primary,
  },
  greeting: {
    color: 'white',
    marginBottom: 4,
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.onSurface,
    textAlign: 'center',
  },
  statSubtext: {
    color: Colors.onSurface,
    opacity: 0.6,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    borderColor: Colors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  demoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#E8F5E8',
  },
  demoTitle: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  demoText: {
    color: '#2E7D32',
    marginBottom: 16,
  },
  demoButton: {
    backgroundColor: '#4CAF50',
  },
  bookingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  bookingInfo: {
    flex: 1,
  },
  courtName: {
    color: Colors.onSurface,
    fontWeight: '500',
  },
  bookingTime: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  bookingPrice: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusChip: {
    height: 32,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuresCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    color: Colors.onSurface,
    fontWeight: '500',
  },
  featureDesc: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  setupCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#F3E5F5',
  },
  setupTitle: {
    color: '#7B1FA2',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    backgroundColor: 'rgba(123, 31, 162, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 4,
  },
  statusText: {
    color: '#7B1FA2',
    fontSize: 12,
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  setupButton: {
    flex: 1,
  },
  dangerButton: {
    borderColor: '#F44336',
  },
  logoutCard: {
    margin: 16,
    elevation: 2,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
  snackbar: {
    backgroundColor: Colors.primary,
  },
});