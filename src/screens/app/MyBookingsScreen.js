// src/screens/app/MyBookingsScreen.js - ANDROID FIX
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Text, Card, Button, Chip, SegmentedButtons, 
  ActivityIndicator, Portal, Modal, FAB
} from 'react-native-paper';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // ✅ FIX: Handle both totalPrice and totalAmount fields
        totalAmount: doc.data().totalPrice || doc.data().totalAmount || 0,
        totalPrice: doc.data().totalPrice || doc.data().totalAmount || 0
      }));
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    return bookings.filter(booking => {
      // Filter by status
      if (filterStatus === 'upcoming') {
        return booking.date > today || 
               (booking.date === today && parseInt(booking.timeSlot.replace(':', '')) > currentTime);
      } else if (filterStatus === 'past') {
        return booking.date < today || 
               (booking.date === today && parseInt(booking.timeSlot.replace(':', '')) < currentTime);
      } else if (filterStatus === 'cancelled') {
        return booking.status === 'cancelled';
      }
      return true; // 'all'
    });
  };

  const getStatusColor = (status, date, timeSlot) => {
    if (status === 'cancelled') return '#F44336';
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const bookingTime = parseInt(timeSlot.replace(':', ''));
    
    if (date < today || (date === today && bookingTime < currentTime)) {
      return '#4CAF50'; // Past - Green
    } else {
      return '#2196F3'; // Upcoming - Blue
    }
  };

  const getStatusText = (status, date, timeSlot) => {
    if (status === 'cancelled') return 'CANCELLED';
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const bookingTime = parseInt(timeSlot.replace(':', ''));
    
    if (date < today || (date === today && bookingTime < currentTime)) {
      return 'COMPLETED';
    } else if (date === today) {
      return 'TODAY';
    } else {
      return 'UPCOMING';
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status === 'cancelled') return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.date);
    const timeDiff = bookingDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return hoursDiff > 2; // Can cancel if more than 2 hours before
  };

  const handleCancelBooking = async (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for ${booking.courtName} on ${formatDate(booking.date)}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => confirmCancelBooking(booking)
        }
      ]
    );
  };

  const confirmCancelBooking = async (booking) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      
      Alert.alert('Success', 'Booking cancelled successfully');
      loadBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    }
  };

  const showBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ✅ FIX: Safe price formatting with null checks
  const formatPrice = (booking) => {
    const price = booking.totalPrice || booking.totalAmount || 0;
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  // ✅ FIX: Safe end time calculation
  const calculateEndTime = (timeSlot, duration) => {
    try {
      if (!timeSlot || !duration) return 'N/A';
      
      const [hours, minutes] = timeSlot.split(':').map(num => parseInt(num));
      const endHours = hours + (duration || 1);
      const endMinutes = minutes;
      
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const renderBookingCard = (booking) => (
    <Card key={booking.id} style={styles.bookingCard} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.courtInfo}>
            <Text variant="titleMedium" style={styles.courtName}>
              {booking.courtName || 'Unknown Court'}
            </Text>
            <Text variant="bodySmall" style={styles.bookingId}>
              ID: {booking.id.slice(-8)}
            </Text>
          </View>
          <Chip 
            mode="flat"
            style={[styles.statusChip, { 
              backgroundColor: getStatusColor(booking.status, booking.date, booking.timeSlot) 
            }]}
            textStyle={styles.statusText}
          >
            {getStatusText(booking.status, booking.date, booking.timeSlot)}
          </Chip>
        </View>

        <View style={styles.bookingDetails}>
          <Text variant="bodyMedium" style={styles.dateText}>
            📅 {formatDate(booking.date)}
          </Text>
          <Text variant="bodyMedium" style={styles.timeText}>
            ⏰ {booking.timeSlot} - {calculateEndTime(booking.timeSlot, booking.duration)} ({booking.duration || 1}h)
          </Text>
          <Text variant="bodyMedium" style={styles.priceText}>
            💰 RM {formatPrice(booking)}
          </Text>
          {booking.needOpponent && (
            <Text variant="bodySmall" style={styles.opponentText}>
              🤝 Looking for opponent
            </Text>
          )}
          {booking.facilityName && (
            <Text variant="bodySmall" style={styles.facilityText}>
              📍 {booking.facilityName}
            </Text>
          )}
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => showBookingDetails(booking)}
          style={styles.actionButton}
          compact
        >
          Details
        </Button>
        {canCancelBooking(booking) && (
          <Button 
            mode="outlined" 
            onPress={() => handleCancelBooking(booking)}
            style={[styles.actionButton, styles.cancelButton]}
            textColor="#F44336"
            compact
          >
            Cancel
          </Button>
        )}
        {booking.needOpponent && booking.status === 'confirmed' && (
          <Button 
            mode="contained" 
            onPress={() => {/* Find opponent functionality */}}
            style={styles.actionButton}
            buttonColor={Colors.primary}
            compact
          >
            Find Match
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filterStatus}
          onValueChange={setFilterStatus}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            My Bookings
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {filterStatus === 'all' ? 'Book your first court to get started!' : `You don't have any ${filterStatus} bookings.`}
            </Text>
          </View>
        )}
      </ScrollView>

      

      {/* Booking Details Modal */}
      <Portal>
        <Modal 
          visible={showDetailsModal} 
          onDismiss={() => setShowDetailsModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedBooking && (
            <>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Booking Details
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Court:</Text>
                <Text style={styles.detailValue}>{selectedBooking.courtName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Facility:</Text>
                <Text style={styles.detailValue}>{selectedBooking.facilityName || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedBooking.date)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {selectedBooking.timeSlot} - {calculateEndTime(selectedBooking.timeSlot, selectedBooking.duration)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{selectedBooking.duration || 1} hour{(selectedBooking.duration || 1) > 1 ? 's' : ''}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {getStatusText(selectedBooking.status, selectedBooking.date, selectedBooking.timeSlot)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Price:</Text>
                <Text style={styles.detailValue}>RM {formatPrice(selectedBooking)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Need Opponent:</Text>
                <Text style={styles.detailValue}>{selectedBooking.needOpponent ? 'Yes' : 'No'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>{selectedBooking.id}</Text>
              </View>

              <Button
                mode="contained"
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </>
          )}
        </Modal>
      </Portal>
    </View>
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
  filterContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
  },
  segmentedButtons: {
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.onBackground,
    marginTop: 4,
  },
  bookingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    color: Colors.onSurface,
    fontWeight: 'bold',
  },
  bookingId: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  statusChip: {
  height: 34,              // ✅ INCREASED from 28 to 34 for more space
  minWidth: 95,            // ✅ NEW: Ensures enough width for text
  paddingHorizontal: 14,   // ✅ NEW: More horizontal padding
  borderRadius: 17,        // ✅ NEW: Rounded edges for better look
  alignItems: 'center',    // ✅ NEW: Center alignment
  justifyContent: 'center', // ✅ NEW: Center content
},
statusText: {
  color: 'white',
  fontSize: 12,            // ✅ Kept readable size
  fontWeight: '600',       // ✅ Better than 'bold' for readability
  letterSpacing: 0.3,      // ✅ NEW: Improves text spacing
  textAlign: 'center',     // ✅ NEW: Center text
},
  bookingDetails: {
    marginBottom: 8,
  },
  dateText: {
    color: Colors.onSurface,
    marginBottom: 4,
  },
  timeText: {
    color: Colors.onSurface,
    marginBottom: 4,
  },
  priceText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  opponentText: {
    color: Colors.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  facilityText: {
    color: Colors.onSurface,
    opacity: 0.7,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    marginRight: 8,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.onBackground,
    textAlign: 'center',
    opacity: 0.7,
  },
   // Replace your existing fab style with this:
  fab: {
  position: 'absolute',
  margin: 16,
  right: 0,
  bottom: 0,
  backgroundColor: '#ffffff',
  borderRadius: 20,
  elevation: 12,               // Higher elevation for more dramatic shadow
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  borderWidth: 0.5,            // Very subtle border
  borderColor: '#f0f0f0',
},
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: Colors.onSurface,
    flex: 1,
  },
  detailValue: {
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  modalCloseButton: {
    marginTop: 20,
  },
});