// src/screens/courtAdmin/BookingApprovalScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { 
  Text, Card, Button, Chip, SegmentedButtons, 
  ActivityIndicator, Portal, Modal, TextInput,
  IconButton, Avatar, Divider
} from 'react-native-paper';
import { 
  collection, query, getDocs, doc, updateDoc, 
  where, orderBy, addDoc, getDoc
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingApprovalScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { userPermissions } = useAuth();

  // Filter options for booking status
  const filterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' }
  ];

  useEffect(() => {
    if (userPermissions?.canApproveBookings) {
      loadBookings();
    }
  }, [filterStatus, userPermissions]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      let q;

      if (filterStatus === 'all') {
        q = query(
          collection(db, 'bookings'),
          orderBy('createdAt', 'desc')
        );
      } else {
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
            userPhone: userData.phoneNumber || 'N/A'
          };
        })
      );
      
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

  const handleApproveBooking = async (booking) => {
    Alert.alert(
      'Approve Booking',
      `Are you sure you want to approve this booking for ${booking.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => processBookingApproval(booking, 'approved')
        }
      ]
    );
  };

  const handleRejectBooking = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const processBookingApproval = async (booking, newStatus, reason = '') => {
    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;
      
      const updateData = {
        status: newStatus,
        [`${newStatus}By`]: currentUser.uid,
        [`${newStatus}Date`]: new Date(),
        updatedAt: new Date()
      };

      if (newStatus === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      // Update booking status
      await updateDoc(doc(db, 'bookings', booking.id), updateData);

      // Send notification to user
      await sendNotificationToUser(booking, newStatus, reason);

      // Create activity log
      await createActivityLog(booking, newStatus, reason);

      Alert.alert(
        'Success',
        `Booking ${newStatus} successfully!`,
        [{ text: 'OK', onPress: () => {
          setShowRejectModal(false);
          loadBookings();
        }}]
      );

    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking status');
    } finally {
      setSubmitting(false);
    }
  };

  const sendNotificationToUser = async (booking, status, reason = '') => {
    try {
      const notificationData = {
        userId: booking.userId,
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved' 
          ? `Your booking for ${booking.courtNumber} on ${formatDate(booking.date)} has been approved!`
          : `Your booking for ${booking.courtNumber} on ${formatDate(booking.date)} has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'booking_update',
        data: {
          bookingId: booking.id,
          status: status
        },
        createdAt: new Date(),
        read: false
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Notification sent to user');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const createActivityLog = async (booking, action, reason = '') => {
    try {
      const logData = {
        type: 'booking_approval',
        action: action,
        bookingId: booking.id,
        adminId: auth.currentUser.uid,
        adminEmail: auth.currentUser.email,
        userId: booking.userId,
        courtNumber: booking.courtNumber,
        bookingDate: booking.date,
        reason: reason,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'activityLogs'), logData);
    } catch (error) {
      console.error('Error creating activity log:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'approved': return 'check-circle';
      case 'rejected': return 'close-circle';
      case 'completed': return 'check-all';
      case 'cancelled': return 'cancel';
      default: return 'help-circle';
    }
  };

  const renderBookingCard = (booking) => (
    <Card key={booking.id} style={styles.bookingCard}>
      <Card.Content>
        {/* Header with Status */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={40} 
              label={booking.userName.charAt(0).toUpperCase()} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text variant="titleMedium" style={styles.userName}>
                {booking.userName}
              </Text>
              <Text variant="bodySmall" style={styles.userEmail}>
                {booking.userEmail || 'N/A'}
              </Text>
            </View>
          </View>
          <Chip 
            icon={getStatusIcon(booking.status)}
            style={[styles.statusChip, { backgroundColor: getStatusColor(booking.status) }]}
            textStyle={styles.statusText}
          >
            {booking.status.toUpperCase()}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Court:</Text>
            <Text style={styles.detailValue}>{booking.courtNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {booking.timeSlot} ({booking.duration || 1}h)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>RM {booking.totalAmount}</Text>
          </View>
          {booking.needOpponent && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Needs Opponent:</Text>
              <Text style={styles.detailValue}>Yes</Text>
            </View>
          )}
        </View>

        {/* Approval/Rejection Info */}
        {booking.status === 'approved' && booking.approvedBy && (
          <View style={styles.approvalInfo}>
            <Text style={styles.approvalText}>
              ✅ Approved on {new Date(booking.approvedDate?.toDate()).toLocaleDateString()}
            </Text>
          </View>
        )}

        {booking.status === 'rejected' && (
          <View style={styles.rejectionInfo}>
            <Text style={styles.rejectionText}>
              ❌ Rejected on {new Date(booking.rejectedDate?.toDate()).toLocaleDateString()}
            </Text>
            {booking.rejectionReason && (
              <Text style={styles.rejectionReason}>
                Reason: {booking.rejectionReason}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveBooking(booking)}
              icon="check"
              disabled={submitting}
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectBooking(booking)}
              icon="close"
              disabled={submitting}
            >
              Reject
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Permission check
  if (!userPermissions?.canApproveBookings) {
    return (
      <View style={styles.noPermissionContainer}>
        <Text variant="titleLarge" style={styles.noPermissionText}>
          Access Denied
        </Text>
        <Text variant="bodyMedium" style={styles.noPermissionSubtext}>
          You don't have permission to approve bookings.
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
              No {filterStatus === 'all' ? '' : filterStatus} bookings found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {filterStatus === 'pending' 
                ? 'All bookings have been processed!'
                : 'Try changing the filter to see more bookings.'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Portal>
        <Modal 
          visible={showRejectModal} 
          onDismiss={() => setShowRejectModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Reject Booking
          </Text>
          
          {selectedBooking && (
            <>
              <Text variant="bodyMedium" style={styles.modalSubtitle}>
                Rejecting booking for {selectedBooking.userName}
              </Text>
              <Text variant="bodySmall" style={styles.modalDetails}>
                {selectedBooking.courtNumber} • {formatDate(selectedBooking.date)} • {selectedBooking.timeSlot}
              </Text>

              <TextInput
                label="Rejection Reason (Optional)"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
                style={styles.reasonInput}
                placeholder="e.g., Court maintenance scheduled, Double booking conflict..."
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowRejectModal(false)}
                  style={styles.modalButton}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => processBookingApproval(selectedBooking, 'rejected', rejectionReason)}
                  style={[styles.modalButton, styles.rejectModalButton]}
                  loading={submitting}
                  disabled={submitting}
                >
                  Reject Booking
                </Button>
              </View>
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
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  bookingCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
  },
  statusChip: {
    opacity: 0.9,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: 'bold',
  },
  approvalInfo: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  approvalText: {
    color: '#2e7d32',
    fontSize: 13,
  },
  rejectionInfo: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  rejectionText: {
    color: '#c62828',
    fontSize: 13,
    marginBottom: 4,
  },
  rejectionReason: {
    color: '#d32f2f',
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    borderColor: '#f44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPermissionText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#f44336',
  },
  noPermissionSubtext: {
    textAlign: 'center',
    color: '#666',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#f44336',
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDetails: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  reasonInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  rejectModalButton: {
    backgroundColor: '#f44336',
  },
});