// src/screens/app/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, ActivityIndicator, 
  Portal, Snackbar, Chip
} from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';
import { setupDemoCourts, checkIfCourtsExist } from '../../utils/setupDemoData';
import DatabaseSetupComponent from '../../components/DatabaseSetupComponent';
import RoleTestComponent from '../../components/RoleTestComponent';
import { createRolesCollection, updateAllUsersWithPermissions } from '../utils/databaseSetup';


export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [totalCourts, setTotalCourts] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const setupRoleSystem = async () => {
  // 1. Create roles collection
  await createRolesCollection();
  
  // 2. Update existing users with permissions
  await updateAllUsersWithPermissions();
  
  // 3. Test with your current account
  console.log('Role system setup complete!');
};

  const loadDashboardData = async () => {
    try {
      // Load recent bookings
      if (user) {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef, 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentBookings(bookings);
      }

      // Load total courts count
      const courtsRef = collection(db, 'courts');
      const courtsSnapshot = await getDocs(courtsRef);
      setTotalCourts(courtsSnapshot.size);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

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
        loadDashboardData(); // Refresh dashboard
      } else {
        showSnackbar('❌ Failed to setup demo courts');
      }
    } catch (error) {
      console.error('Setup error:', error);
      showSnackbar('❌ Error setting up demo data');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatBookingTime = (booking) => {
    const date = new Date(booking.date);
    const dateStr = date.toLocaleDateString('en-MY', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr} at ${booking.timeSlot}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return Colors.primary;
      case 'pending': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.greeting}>
              {getTimeOfDayGreeting()}!
            </Text>
            <Text variant="titleLarge" style={styles.userName}>
              {user?.displayName || user?.email?.split('@')[0] || 'Futsal Player'}
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeText}>
              Ready to book your next futsal session?
            </Text>
          </Card.Content>
        </Card>

         <ScrollView style={styles.container}>
      <DatabaseSetupComponent />
      
      {/* TEMPORARY - Role testing */}
      <RoleTestComponent />
      
      {/* Your existing HomeScreen content */}
    </ScrollView>

        <ScrollView style={styles.container}>
      {/* TEMPORARY - Remove after setup */}
      <DatabaseSetupComponent />
      
      {/* Your existing HomeScreen content below */}
      {/* ... rest of your home screen ... */}
    </ScrollView>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {totalCourts}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Available Courts
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {recentBookings.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Recent Bookings
              </Text>
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
        {totalCourts === 0 && (
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

        {/* Recent Bookings */}
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
                  View All
                </Button>
              </View>
              
              {recentBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingItem}>
                  <View style={styles.bookingInfo}>
                    <Text variant="bodyLarge" style={styles.courtName}>
                      {booking.courtName}
                    </Text>
                    <Text variant="bodySmall" style={styles.bookingTime}>
                      {formatBookingTime(booking)}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { 
                      backgroundColor: getStatusColor(booking.status) 
                    }]}
                    textStyle={styles.statusText}
                  >
                    {booking.status.toUpperCase()}
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

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor="#F44336"
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: Colors.primary,
  },
  greeting: {
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    marginBottom: 8,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
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
  },
  statLabel: {
    color: Colors.onSurface,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 4,
  },
  secondaryButton: {
    paddingVertical: 4,
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
    paddingVertical: 8,
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
  statusChip: {
    height: 36,
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