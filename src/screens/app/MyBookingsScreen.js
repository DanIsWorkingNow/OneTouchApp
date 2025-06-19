// src/screens/app/MyBookingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, ActivityIndicator, 
  SegmentedButtons, FAB, Portal, Modal 
} from 'react-native-paper';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const loadBookings = () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookingsData = [];
        snapshot.forEach((doc) => {
          bookingsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort by date and time (newest first)
        bookingsData.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.timeSlot}`);
          const dateB = new Date(`${b.date} ${b.timeSlot}`);
          return dateB - dateA;
        });
        
        setBookings(bookingsData);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

    let filtered = [...bookings];

    switch (filter) {
      case 'upcoming':
        filtered = bookings.filter(booking => {
          const bookingDate = booking.date;
          const bookingTime = booking.timeSlot;
          
          if (bookingDate > today) return true;
          if (bookingDate === today && bookingTime > currentTime) return true;
          return false;
        });
        break;
      case 'completed':
        filtered = bookings.filter(booking => 
          booking.status === 'completed' || 
          (booking.date < today || (booking.date === today && booking.timeSlot < currentTime))
        );
        break;
      case 'cancelled':
        filtered = bookings.filter(booking => booking.status === 'cancelled');
        break;
      default:
        break;
    }

    setFilteredBookings(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status, date, timeSlot) => {
    if (status === 'cancelled') return '#F44336';
    if (status === 'completed') return '#4CAF50';
    
    // Check if booking is in the past
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (date < today || (date === today && timeSlot < currentTime)) {
      return '#4CAF50'; // Past bookings are considered completed
    }
    
    switch (status) {
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status, date, timeSlot) => {
    // Check if booking is in the past
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (date < today || (date === today && timeSlot < currentTime)) {
      return 'COMPLETED';
    }
    
    return status.toUpperCase();
  };

  const canCancelBooking = (booking) => {
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date} ${booking.timeSlot}`);
    const timeDiff = bookingDateTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 2 && booking.status !== 'cancelled' && booking.status !== 'completed';
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for ${booking.courtName} on ${booking.date} at ${booking.timeSlot}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => cancelBooking(booking.id) }
      ]
    );
  };

  const cancelBooking = async (bookingId) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      Alert.alert('Success', 'Booking cancelled successfully');
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

  const renderBookingCard = (booking) => (
    <Card key={booking.id} style={styles.bookingCard} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.courtInfo}>
            <Text variant="titleMedium" style={styles.courtName}>
              {booking.courtName}
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
            ⏰ {booking.timeSlot} - {booking.endTime} ({booking.duration}h)
          </Text>
          <Text variant="bodyMedium" style={styles.priceText}>
            💰 RM {booking.totalAmount.toFixed(2)}
          </Text>
          {booking.needOpponent && (
            <Text variant="bodySmall" style={styles.opponentText}>
              🤝 Looking for opponent
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
            onPress={() => navigation.navigate('FindOpponent', { booking })}
            style={styles.actionButton}
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

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={filterOptions}
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
          <Text variant="headlineSmall" style={styles.title}>
            My Bookings
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No bookings found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {filter === 'all' 
                ? "You haven't made any bookings yet" 
                : `No ${filter} bookings found`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Courts')}
        label="Book Court"
      />

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
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedBooking.date)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {selectedBooking.timeSlot} - {selectedBooking.endTime}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{selectedBooking.duration} hour(s)</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={styles.detailValue}>RM {selectedBooking.totalAmount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {getStatusText(selectedBooking.status, selectedBooking.date, selectedBooking.timeSlot)}
                </Text>
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
    height: 28,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
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