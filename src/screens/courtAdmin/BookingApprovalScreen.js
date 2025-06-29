// src/screens/courtAdmin/BookingManagementScreen.js
// UPDATED: Converted from approval screen to general booking management screen
// Since all bookings are now auto-confirmed, this screen displays ALL bookings by default

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, ActivityIndicator, 
  SegmentedButtons, Avatar, FAB, IconButton 
} from 'react-native-paper';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, getDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingManagementScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // Default to 'all' instead of 'pending'
  const [submitting, setSubmitting] = useState(false);
  const { userPermissions } = useAuth();

  // UPDATED: Filter options now focus on viewing all bookings instead of approval workflow
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'confirmed', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    loadBookings();
  }, [filterStatus]);

  // UPDATED: Modified to load ALL bookings by default instead of filtering for pending
  const loadBookings = async () => {
  try {
    setLoading(true);
    console.log('📡 Loading bookings with filter:', filterStatus);
    
    let q;
    if (filterStatus === 'all') {
      // Show ALL bookings (no status filter) - USE SIMPLE QUERY TO AVOID INDEX ISSUES
      q = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
    } else if (filterStatus === 'completed') {
      // SIMPLIFIED: Show bookings with confirmed status (avoid date filtering for now)
      q = query(
        collection(db, 'bookings'),
        where('status', '==', 'confirmed'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Filter by specific status
      q = query(
        collection(db, 'bookings'),
        where('status', '==', filterStatus),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const bookingsData = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const bookingData = docSnapshot.data();
        
        // Get user details for each booking
        let userData = {};
        if (bookingData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user data:', error);
          }
        }

        return {
          id: docSnapshot.id,
          ...bookingData,
          userName: userData.username || 'Unknown User',
          userPhone: userData.phoneNumber || 'N/A',
          userEmail: userData.email || 'N/A'
        };
      })
    );
    
    // MANUAL FILTERING FOR COMPLETED BOOKINGS (to avoid Firebase index issues)
    let filteredBookings = bookingsData;
    if (filterStatus === 'completed') {
      const today = new Date().toISOString().split('T')[0];
      filteredBookings = bookingsData.filter(booking => {
        return booking.status === 'confirmed' && booking.date < today;
      });
    }
    
    setBookings(filteredBookings);
    console.log(`✅ Loaded ${filteredBookings.length} bookings`);
  } catch (error) {
    console.error('Error loading bookings:', error);
    
    // FALLBACK: If index error occurs, try simpler query
    if (error.message?.includes('index')) {
      console.log('🔄 Trying fallback query without complex filtering...');
      try {
        const simpleQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(simpleQuery);
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userName: 'User', // Simplified for fallback
          userPhone: 'N/A',
          userEmail: 'N/A'
        }));
        
        // Apply client-side filtering
        let filtered = bookingsData;
        if (filterStatus !== 'all') {
          filtered = bookingsData.filter(booking => booking.status === filterStatus);
        }
        
        setBookings(filtered);
        console.log(`✅ Fallback query loaded ${filtered.length} bookings`);
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        Alert.alert('Error', 'Failed to load bookings. Please try again later.');
      }
    } else {
      Alert.alert('Error', 'Failed to load bookings');
    }
  } finally {
    setLoading(false);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // UPDATED: Instead of approval, provide booking management actions
  const handleCancelBooking = async (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking for ${booking.userName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => processCancelBooking(booking)
        }
      ]
    );
  };

  const processCancelBooking = async (booking) => {
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: auth.currentUser.uid
      });

      Alert.alert('✅ Success', 'Booking cancelled successfully');
      loadBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('❌ Error', 'Failed to cancel booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (booking) => {
    Alert.alert(
      '⚠️ Delete Booking',
      `Are you sure you want to permanently delete this booking? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => processDeleteBooking(booking)
        }
      ]
    );
  };

  const processDeleteBooking = async (booking) => {
    try {
      setSubmitting(true);
      
      await deleteDoc(doc(db, 'bookings', booking.id));

      Alert.alert('✅ Success', 'Booking deleted successfully');
      loadBookings(); // Refresh the list
    } catch (error) {
      console.error('Error deleting booking:', error);
      Alert.alert('❌ Error', 'Failed to delete booking');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status, date, timeSlot) => {
    // Determine if booking is in the past
    const bookingDate = new Date(date);
    const today = new Date();
    const isPast = bookingDate < today;

    switch (status) {
      case 'confirmed':
        return isPast ? Colors.success : Colors.primary;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.outline;
    }
  };

  const getStatusText = (status, date, timeSlot) => {
    const bookingDate = new Date(date);
    const today = new Date();
    const isPast = bookingDate < today;

    switch (status) {
      case 'confirmed':
        return isPast ? 'COMPLETED' : 'ACTIVE';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPrice = (booking) => {
    const price = booking.totalPrice || booking.totalAmount || 0;
    return `RM ${price.toFixed(2)}`;
  };

  const canManageBooking = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    const isPast = bookingDate < today;
    
    // Can't manage past bookings or already cancelled bookings
    return !isPast && booking.status !== 'cancelled';
  };

  const renderBookingCard = (booking) => (
    <Card key={booking.id} style={styles.bookingCard}>
      <Card.Content>
        {/* Header with Court and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.courtInfo}>
            <Text variant="titleMedium" style={styles.courtName}>
              🏟️ {booking.courtName || booking.courtNumber || 'Court'}
            </Text>
            <Chip 
              mode="flat"
              textStyle={{ fontSize: 12 }}
              style={[styles.statusChip, { backgroundColor: getStatusColor(booking.status, booking.date, booking.timeSlot) + '20' }]}
            >
              {getStatusText(booking.status, booking.date, booking.timeSlot)}
            </Chip>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.customerInfo}>
          <Avatar.Text 
            size={40} 
            label={booking.userName.charAt(0).toUpperCase()} 
            style={styles.avatar}
          />
          <View style={styles.customerDetails}>
            <Text variant="titleSmall" style={styles.customerName}>
              {booking.userName}
            </Text>
            <Text variant="bodySmall" style={styles.customerContact}>
              📧 {booking.userEmail}
            </Text>
            {booking.userPhone && booking.userPhone !== 'N/A' && (
              <Text variant="bodySmall" style={styles.customerContact}>
                📱 {booking.userPhone}
              </Text>
            )}
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Date:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ Time:</Text>
            <Text style={styles.detailValue}>{booking.timeSlot}</Text>
          </View>
          {booking.duration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏱️ Duration:</Text>
              <Text style={styles.detailValue}>{booking.duration}h</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Amount:</Text>
            <Text style={styles.detailValue}>{formatPrice(booking)}</Text>
          </View>
          {booking.needOpponent && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🤝 Opponent:</Text>
              <Text style={styles.detailValue}>Looking for opponent</Text>
            </View>
          )}
        </View>

        {/* Created Date */}
        <View style={styles.metaInfo}>
          <Text variant="bodySmall" style={styles.createdDate}>
            Created: {new Date(booking.createdAt?.toDate() || booking.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Action Buttons - Only show for manageable bookings */}
        {canManageBooking(booking) && booking.status === 'confirmed' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(booking)}
              icon="close-circle"
              disabled={submitting}
            >
              Cancel
            </Button>
          </View>
        )}

        {/* Delete button for cancelled bookings (admin cleanup) */}
        {booking.status === 'cancelled' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteBooking(booking)}
              icon="delete"
              disabled={submitting}
              textColor={Colors.error}
            >
              Delete
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Permission check - Updated to check for general booking management
  if (!userPermissions?.canViewAllBookings) {
    return (
      <View style={styles.noPermissionContainer}>
        <Text variant="titleLarge" style={styles.noPermissionText}>
          Access Denied
        </Text>
        <Text variant="bodyMedium" style={styles.noPermissionSubtext}>
          You don't have permission to view bookings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <SegmentedButtons
        value={filterStatus}
        onValueChange={setFilterStatus}
        buttons={filterOptions}
        style={styles.filterButtons}
      />

      {/* Booking Count */}
      <View style={styles.countContainer}>
        <Text variant="bodyMedium" style={styles.countText}>
          {loading ? 'Loading...' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length > 0 ? (
          bookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No {filterStatus === 'all' ? '' : filterStatus + ' '}bookings found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {filterStatus === 'all' 
                ? 'Bookings will appear here once users start making reservations'
                : `Try selecting a different filter to see other bookings`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Quick Actions */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CourtsList')}
        label="View Courts"
         color="white"           // White icon color
  labelStyle={{ color: 'white' }}  // White text color
/>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterButtons: {
    margin: 16,
    marginBottom: 8,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    color: Colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  bookingCard: {
    margin: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtName: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusChip: {
    borderRadius: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outline + '30',
  },
  avatar: {
    marginRight: 12,
    backgroundColor: Colors.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  customerContact: {
    color: Colors.onSurfaceVariant,
    marginBottom: 1,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  metaInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outline + '30',
  },
  createdDate: {
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
  cancelButton: {
    borderColor: Colors.error,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.onSurfaceVariant,
  },
  emptySubtext: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPermissionText: {
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.error,
  },
  noPermissionSubtext: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 28,
  elevation: 8,
  },
});