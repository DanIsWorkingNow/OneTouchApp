// src/screens/app/HomeScreen.js - INDEX ERROR FIX
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
  
  // NEW: Feedback state management
  const [userFeedbackCount, setUserFeedbackCount] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const [recentFeedback, setRecentFeedback] = useState([]);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  
  // IMPROVED: Loading states for better UX
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // NEW: Index error handling
  const [feedbackIndexError, setFeedbackIndexError] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setupRealtimeListeners();
    }
  }, [user]);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  // FIXED: Real-time listeners with index error handling
  const setupRealtimeListeners = () => {
    console.log('🔄 Setting up real-time listeners...');
    setDashboardLoading(true);

    // 1. Real-time Available Courts Count
    const courtsRef = collection(db, 'courts');
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
    });

    // 3. FIXED: Feedback listener with error handling
    const setupFeedbackListener = () => {
      try {
        const feedbackRef = collection(db, 'feedback');
        
        // FIXED: Try with orderBy first, fallback if index doesn't exist
        const userFeedbackQuery = query(
          feedbackRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeFeedback = onSnapshot(
          userFeedbackQuery, 
          (snapshot) => {
            const allUserFeedback = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Get recent feedback (last 3)
            const recentFeedback = allUserFeedback.slice(0, 3);
            setRecentFeedback(recentFeedback);
            
            // Count total and pending feedback
            setUserFeedbackCount(allUserFeedback.length);
            const pendingCount = allUserFeedback.filter(f => 
              f.status === 'new' || f.status === 'in-progress'
            ).length;
            setPendingFeedbackCount(pendingCount);
            
            console.log(`💬 User feedback updated: ${allUserFeedback.length} total, ${pendingCount} pending`);
            setDashboardLoading(false);
            setFeedbackIndexError(false);
          },
          (error) => {
            console.error('❌ Feedback listener error:', error);
            if (error.code === 'failed-precondition') {
              console.log('📝 Index required for feedback query, falling back to simple query');
              setFeedbackIndexError(true);
              setupFallbackFeedbackListener();
            } else {
              setDashboardLoading(false);
            }
          }
        );

        return unsubscribeFeedback;
      } catch (error) {
        console.error('❌ Error setting up feedback listener:', error);
        setFeedbackIndexError(true);
        setupFallbackFeedbackListener();
        return () => {};
      }
    };

    // FALLBACK: Simple feedback query without orderBy
    const setupFallbackFeedbackListener = () => {
      try {
        const feedbackRef = collection(db, 'feedback');
        const fallbackQuery = query(feedbackRef, where('userId', '==', user.uid));

        const unsubscribeFallback = onSnapshot(fallbackQuery, (snapshot) => {
          const allUserFeedback = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Manual sorting since we can't use orderBy
          allUserFeedback.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
            return dateB - dateA;
          });

          const recentFeedback = allUserFeedback.slice(0, 3);
          setRecentFeedback(recentFeedback);
          
          setUserFeedbackCount(allUserFeedback.length);
          const pendingCount = allUserFeedback.filter(f => 
            f.status === 'new' || f.status === 'in-progress'
          ).length;
          setPendingFeedbackCount(pendingCount);
          
          console.log(`💬 Feedback updated (fallback): ${allUserFeedback.length} total, ${pendingCount} pending`);
          setDashboardLoading(false);
        });

        return unsubscribeFallback;
      } catch (error) {
        console.error('❌ Fallback feedback listener error:', error);
        setDashboardLoading(false);
        return () => {};
      }
    };

    const unsubscribeFeedback = setupFeedbackListener();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      unsubscribeCourts();
      unsubscribeBookings();
      if (unsubscribeFeedback) unsubscribeFeedback();
    };
  };

  // NEW: Feedback helper functions
  const formatFeedbackTime = (feedback) => {
    if (!feedback.createdAt) return 'Recently';
    
    try {
      const date = feedback.createdAt.toDate ? feedback.createdAt.toDate() : new Date(feedback.createdAt);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
      return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
    } catch (error) {
      return 'Recently';
    }
  };

  const getFeedbackStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return '#FF9800';
      case 'in-progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#FF9800';
    }
  };

  const getFeedbackStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'NEW';
      case 'in-progress': return 'IN PROGRESS';
      case 'resolved': return 'RESOLVED';
      case 'closed': return 'CLOSED';
      default: return status?.toUpperCase() || 'PENDING';
    }
  };

  // NEW: Enhanced feedback navigation with index setup
 const handleProvideFeedback = () => {
  if (feedbackIndexError) {
    Alert.alert(
      '💬 Provide Feedback',
      'Feedback submission is ready! However, for optimal performance, please create the required database index first.',
      [
        { text: 'Setup Index', onPress: handleSetupFeedbackIndex },
        { text: 'Continue Anyway', onPress: () => navigation.navigate('FeedbackSubmission') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  } else {
    navigation.navigate('FeedbackSubmission');
  }
};

  const showFeedbackComingSoon = () => {
    Alert.alert(
      '💬 Provide Feedback',
      'Feedback submission screen coming soon! This will allow you to report court issues, cleanliness concerns, or general feedback.',
      [
        { text: 'OK' },
        { 
          text: 'Setup Demo Feedback', 
          onPress: handleSetupDemoFeedback 
        }
      ]
    );
  };

const handleViewMyFeedback = () => {
  if (userFeedbackCount === 0) {
    Alert.alert(
      '💬 My Feedback',
      'You haven\'t submitted any feedback yet. Use "Provide Feedback" to report court issues or share suggestions.',
      [
        { text: 'Submit Feedback', onPress: () => navigation.navigate('FeedbackSubmission') },
        { text: 'Cancel' }
      ]
    );
  } else {
    navigation.navigate('MyFeedback');
  }
};

  // NEW: Index setup helper
  const handleSetupFeedbackIndex = () => {
    Alert.alert(
      '📋 Setup Feedback Index',
      'To enable optimal feedback queries, please create a composite index in Firebase:\n\n1. Click the link in your browser console\n2. Or go to Firebase Console → Firestore → Indexes\n3. Create index for collection "feedback" with:\n   • userId (Ascending)\n   • createdAt (Descending)\n\nAfter creating the index, restart your app.',
      [
        { 
          text: 'Open Firebase Console', 
          onPress: () => {
            console.log('🔗 Firebase Index URL: https://console.firebase.google.com/v1/r/project/onetouchapp-1684e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9vbmV0b3VjaGFwcC0xNjg0ZS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZmVlZGJhY2svaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg');
            showSnackbar('📋 Index creation URL logged to console');
          }
        },
        { text: 'Continue Without Index' }
      ]
    );
  };

  // NEW: Demo feedback setup for testing
  const handleSetupDemoFeedback = async () => {
    try {
      setLoading(true);
      
      // Create sample feedback for current user
      const sampleFeedback = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email,
        courtId: 'demo_court_1',
        courtName: 'Demo Court 1',
        category: 'maintenance',
        severity: 'medium',
        title: 'Court lighting issue',
        description: 'Some lights are flickering during evening hours. This affects visibility during games.',
        status: 'new',
        priority: 3,
        adminResponse: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'feedback'), sampleFeedback);
      
      showSnackbar('✅ Demo feedback created! Check your feedback stats.');
    } catch (error) {
      console.error('Error creating demo feedback:', error);
      showSnackbar('❌ Failed to create demo feedback');
    } finally {
      setLoading(false);
    }
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

  // Enhanced complete database setup with pending bookings
  const handleSetupCompleteDatabase = async () => {
    setSetupLoading(true);
    try {
      console.log('🚀 Starting complete database setup...');
      
      const result = await setupCompleteDatabase(true, true);
      
      if (result.success) {
        Alert.alert(
          '🎉 Setup Complete!', 
          result.message,
          [{ text: 'OK', onPress: checkDatabaseStatus }]
        );
        // Real-time listeners will automatically update the data
      } else {
        Alert.alert('❌ Setup Failed', result.message || result.error);
      }
    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert('❌ Error', 'Database setup failed: ' + error.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleAddCurrentUserBookings = async () => {
    setSetupLoading(true);
    try {
      const result = await setupCurrentUserBookings();
      if (result.success) {
        Alert.alert('✅ Success', result.message);
        // Real-time listeners will automatically update the bookings
      } else {
        Alert.alert('❌ Error', result.message);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to add user bookings: ' + error.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      '⚠️ Clear Database',
      'This will delete ALL data in the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setSetupLoading(true);
            try {
              const result = await clearAllCollections();
              if (result.success) {
                Alert.alert('✅ Cleared', result.message);
                setDbStatus(null);
                // Reset all counts
                setAvailableCourtsCount(0);
                setTotalCourtsCount(0);
                setUserBookingsCount(0);
                setUserFeedbackCount(0);
                setPendingFeedbackCount(0);
                setRecentBookings([]);
                setRecentFeedback([]);
              } else {
                Alert.alert('❌ Error', result.error);
              }
            } catch (error) {
              Alert.alert('❌ Error', error.message);
            } finally {
              setSetupLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreatePendingBookings = async () => {
    try {
      console.log('🔄 Creating pending bookings...');
      const result = await createSamplePendingBookings();
      
      if (result.success) {
        Alert.alert('✅ Success', result.message);
        console.log('✅ Pending bookings created successfully!');
        // Real-time listeners will automatically update the bookings
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to create pending bookings');
      }
    } catch (error) {
      console.error('❌ Error creating pending bookings:', error);
      Alert.alert('❌ Error', error.message);
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

      {/* Index Warning */}
      {feedbackIndexError && (
        <Card style={styles.warningCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.warningTitle}>
              ⚠️ Database Index Required
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              Feedback system needs a database index for optimal performance.
            </Text>
            <Button
              mode="outlined"
              onPress={handleSetupFeedbackIndex}
              style={styles.warningButton}
              compact
            >
              Setup Index
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* ENHANCED: Stats with Feedback integration */}
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

        {/* NEW: Feedback Stats Card */}
        <Card style={styles.statCard} onPress={handleViewMyFeedback}>
          <Card.Content style={styles.statContent}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {userFeedbackCount}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              My Feedback
            </Text>
            {pendingFeedbackCount > 0 && (
              <Text variant="bodySmall" style={[styles.statSubtext, { color: Colors.primary }]}>
                {pendingFeedbackCount} pending
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* ENHANCED: Quick Actions with Feedback */}
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

          {/* NEW: Feedback Actions Row */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleProvideFeedback}
              style={[styles.primaryButton, styles.feedbackButton]}
              buttonColor="#FF9800"
              icon="comment-plus"
              contentStyle={styles.buttonContent}
            >
              Provide Feedback
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleViewMyFeedback}
              style={[styles.secondaryButton, styles.feedbackOutlineButton]}
              icon="comment-text"
              contentStyle={styles.buttonContent}
            >
              My Feedback {userFeedbackCount > 0 && `(${userFeedbackCount})`}
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

      {/* NEW: Recent Feedback Display */}
      {recentFeedback.length > 0 && (
        <Card style={styles.feedbackCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recent Feedback
              </Text>
              <Button
                mode="text"
                onPress={handleViewMyFeedback}
                compact
              >
                View All ({userFeedbackCount})
              </Button>
            </View>
            
            {recentFeedback.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackItem}>
                <View style={styles.feedbackInfo}>
                  <Text variant="bodyLarge" style={styles.feedbackTitle}>
                    {feedback.title || 'Feedback'}
                  </Text>
                  <Text variant="bodySmall" style={styles.feedbackTime}>
                    {feedback.courtName} • {formatFeedbackTime(feedback)}
                  </Text>
                  {feedback.adminResponse && (
                    <Text variant="bodySmall" style={styles.adminResponseHint}>
                      💬 Admin responded
                    </Text>
                  )}
                </View>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { 
                    backgroundColor: getFeedbackStatusColor(feedback.status) 
                  }]}
                  textStyle={styles.statusText}
                >
                  {getFeedbackStatusText(feedback.status)}
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
              <Text style={styles.featureIcon}>💬</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Feedback System
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Report issues and get admin responses
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
              <Text style={styles.featureIcon}>🔔</Text>
              <View>
                <Text variant="bodyMedium" style={styles.featureTitle}>
                  Smart Notifications
                </Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Get updates on bookings and feedback
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Database Setup Card - Development Only */}
      <Card style={styles.setupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.setupTitle}>
            🗄️ Database Setup (Development)
          </Text>
          
          {/* Database Status */}
          {dbStatus && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>📊 Current Status:</Text>
              <Text style={styles.statusText}>
                🏟️ Courts: {dbStatus.courts?.count || 0} documents
              </Text>
              <Text style={styles.statusText}>
                👥 Users: {dbStatus.users?.count || 0} documents  
              </Text>
              <Text style={styles.statusText}>
                📅 Bookings: {dbStatus.bookings?.count || 0} documents
              </Text>
              <Text style={styles.statusText}>
                💬 Feedback: {dbStatus.feedback?.count || 0} documents
              </Text>
            </View>
          )}
          
          {/* Setup Buttons */}
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={handleSetupCompleteDatabase}
              loading={setupLoading}
              style={[styles.setupButton, styles.primaryButton]}
              disabled={setupLoading}
            >
              🚀 Setup All Data
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={checkDatabaseStatus}
              style={styles.setupButton}
              disabled={setupLoading}
            >
              📊 Check Status
            </Button>
          </View>
          
          <View style={styles.buttonRow}>
            <Button 
              mode="outlined" 
              onPress={handleAddCurrentUserBookings}
              loading={setupLoading}
              style={styles.setupButton}
              disabled={setupLoading || !auth.currentUser}
            >
              📅 Add My Bookings
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleClearDatabase}
              style={[styles.setupButton, styles.dangerButton]}
              disabled={setupLoading}
            >
              🗑️ Clear All
            </Button>
          </View>
          
          <Button 
            mode="outlined" 
            onPress={handleCreatePendingBookings}
            style={styles.setupButton}
            disabled={setupLoading}
          >
            ⏳ Add Pending Bookings
          </Button>
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
  // NEW: Warning card styles
  warningCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
    backgroundColor: '#FFF3E0',
  },
  warningTitle: {
    color: '#E65100',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#E65100',
    marginBottom: 8,
  },
  warningButton: {
    borderColor: '#E65100',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.onSurface,
    textAlign: 'center',
    fontSize: 12,
  },
  statSubtext: {
    color: Colors.onSurface,
    opacity: 0.6,
    fontSize: 10,
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
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    borderColor: Colors.primary,
  },
  // NEW: Feedback button styles
  feedbackButton: {
    backgroundColor: '#FF9800',
  },
  feedbackOutlineButton: {
    borderColor: '#FF9800',
  },
  buttonContent: {
    paddingVertical: 6,
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
  // NEW: Feedback card styles
  feedbackCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFF8E1',
  },
  feedbackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 152, 0, 0.1)',
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackTitle: {
    color: Colors.onSurface,
    fontWeight: '500',
  },
  feedbackTime: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  adminResponseHint: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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