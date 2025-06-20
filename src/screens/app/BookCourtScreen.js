// src/screens/app/BookCourtScreen.js - COMPLETE FUNCTIONAL VERSION
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, RadioButton, Switch, 
  ActivityIndicator, Portal, Modal, Divider
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function BookCourtScreen({ route, navigation }) {
  console.log('🎾 BookCourtScreen - Route params:', route.params);
  
  // Error handling for missing params
  if (!route.params || !route.params.court) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Error: Missing court data</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back to Courts
        </Button>
      </View>
    );
  }

  const { court, courtId } = route.params;
  
  // State management
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState(1);
  const [needOpponent, setNeedOpponent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [courtDetails, setCourtDetails] = useState(court);

  // Default time slots (fallback if not loaded from database)
  const defaultTimeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Duration options
  const durationOptions = [
    { label: '1 Hour', value: 1, price: (courtDetails.pricePerHour || 80) * 1 },
    { label: '2 Hours', value: 2, price: (courtDetails.pricePerHour || 80) * 2 },
    { label: '3 Hours', value: 3, price: (courtDetails.pricePerHour || 80) * 3 }
  ];

  // Load court details and available slots when component mounts
  useEffect(() => {
    loadCourtDetails();
  }, []);

  // Load booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadCourtDetails = async () => {
    try {
      console.log('📡 Loading court details for:', courtId);
      const courtRef = doc(db, 'courts', courtId);
      const courtSnap = await getDoc(courtRef);
      
      if (courtSnap.exists()) {
        const courtData = { id: courtSnap.id, ...courtSnap.data() };
        setCourtDetails(courtData);
        setAvailableSlots(courtData.timeSlots || defaultTimeSlots);
        console.log('✅ Court details loaded:', courtData);
      } else {
        console.log('⚠️ Court not found in database, using route params');
        setAvailableSlots(defaultTimeSlots);
      }
    } catch (error) {
      console.error('❌ Error loading court details:', error);
      // Fallback to route params and default slots
      setAvailableSlots(defaultTimeSlots);
    }
  };

  const loadBookedSlots = async (date) => {
    try {
      setLoading(true);
      console.log('📅 Loading booked slots for date:', date);
      
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('courtId', '==', courtId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const snapshot = await getDocs(q);
      const booked = [];
      snapshot.forEach((doc) => {
        const booking = doc.data();
        booked.push(booking.timeSlot);
      });
      
      setBookedSlots(booked);
      console.log('📋 Booked slots for', date, ':', booked);
    } catch (error) {
      console.error('❌ Error loading booked slots:', error);
      setBookedSlots([]); // Fallback to no bookings
    } finally {
      setLoading(false);
    }
  };

  const isSlotAvailable = (timeSlot) => {
    return !bookedSlots.includes(timeSlot);
  };

  const calculateTotal = () => {
    const selectedDuration = durationOptions.find(d => d.value === duration);
    return selectedDuration ? selectedDuration.price : 0;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('⚠️ Missing Information', 'Please select both date and time slot');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('⚠️ Authentication Required', 'Please login to book a court');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      const bookingData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        courtId: courtId,
        courtNumber: courtDetails.courtNumber,
        facilityName: courtDetails.facilityName || 'One Touch Futsal',
        location: courtDetails.location || 'Temerloh, Pahang',
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        duration: duration,
        needOpponent: needOpponent,
        pricePerHour: courtDetails.pricePerHour || 80,
        totalAmount: calculateTotal(),
        status: 'confirmed',
        paymentStatus: 'completed', // For demo purposes
        createdAt: new Date(),
      };

      console.log('💾 Creating booking:', bookingData);

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      console.log('✅ Booking created with ID:', docRef.id);

      Alert.alert(
        '🎉 Booking Successful!',
        `Your booking for ${courtDetails.courtNumber} on ${selectedDate} at ${selectedTimeSlot} has been confirmed.\n\nTotal: RM ${calculateTotal()}`,
        [
          {
            text: 'View My Bookings',
            onPress: () => navigation.navigate('MainTabs', { screen: 'MyBookings' })
          },
          {
            text: 'Book Another Court',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error creating booking:', error);
      Alert.alert('❌ Booking Failed', 'Please try again later.\n\nError: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from today
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Court Information Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.courtTitle}>
            🏟️ {courtDetails.courtNumber}
          </Text>
          <Text variant="bodyMedium" style={styles.courtInfo}>
            📍 {courtDetails.location || 'Temerloh, Pahang'}
          </Text>
          <Text variant="bodyMedium" style={styles.courtInfo}>
            🏢 {courtDetails.facilityName || 'One Touch Futsal'}
          </Text>
          <Text variant="titleMedium" style={styles.priceText}>
            💰 RM {courtDetails.pricePerHour || 80}/hour
          </Text>
        </Card.Content>
      </Card>

      {/* Date Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📅 Select Date
          </Text>
          <Calendar
            onDayPress={(day) => {
              console.log('📅 Date selected:', day.dateString);
              setSelectedDate(day.dateString);
              setSelectedTimeSlot(''); // Reset time slot when date changes
            }}
            minDate={getTodayDate()}
            maxDate={getMaxDate()}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: Colors.primary }
            }}
            theme={{
              selectedDayBackgroundColor: Colors.primary,
              todayTextColor: Colors.primary,
              arrowColor: Colors.primary,
              monthTextColor: Colors.primary,
              indicatorColor: Colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
          />
          {selectedDate && (
            <Text style={styles.selectedDateText}>
              Selected: {formatDate(selectedDate)}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Duration Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ⏱️ Select Duration
          </Text>
          <RadioButton.Group
            onValueChange={value => setDuration(value)}
            value={duration}
          >
            {durationOptions.map((option) => (
              <View key={option.value} style={styles.radioItem}>
                <RadioButton value={option.value} color={Colors.primary} />
                <Text style={styles.radioLabel}>{option.label}</Text>
                <Text style={styles.radioPrice}>RM {option.price}</Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Time Slot Selection */}
      {selectedDate && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🕐 Available Time Slots
            </Text>
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(selectedDate)}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Checking availability...</Text>
              </View>
            ) : (
              <View style={styles.timeSlotsContainer}>
                {availableSlots.map((slot) => {
                  const available = isSlotAvailable(slot);
                  return (
                    <Chip
                      key={slot}
                      mode={selectedTimeSlot === slot ? 'flat' : 'outlined'}
                      selected={selectedTimeSlot === slot}
                      disabled={!available}
                      onPress={() => available && setSelectedTimeSlot(slot)}
                      style={[
                        styles.timeSlotChip,
                        selectedTimeSlot === slot && styles.selectedTimeSlot,
                        !available && styles.unavailableTimeSlot
                      ]}
                      textStyle={[
                        styles.timeSlotText,
                        selectedTimeSlot === slot && styles.selectedTimeSlotText,
                        !available && styles.unavailableTimeSlotText
                      ]}
                    >
                      {slot} {!available && '(Booked)'}
                    </Chip>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Opponent Preference */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text variant="titleMedium">🤝 Need Opponent?</Text>
              <Text variant="bodySmall" style={styles.switchDescription}>
                We'll help you find a player to join your game
              </Text>
            </View>
            <Switch
              value={needOpponent}
              onValueChange={setNeedOpponent}
              color={Colors.primary}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Booking Summary */}
      {selectedDate && selectedTimeSlot && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              📋 Booking Summary
            </Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Court:</Text>
              <Text style={styles.summaryValue}>{courtDetails.courtNumber}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTimeSlot}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{duration} hour(s)</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Opponent:</Text>
              <Text style={styles.summaryValue}>{needOpponent ? 'Needed' : 'Not needed'}</Text>
            </View>

            <Divider style={{ marginVertical: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>RM {calculateTotal()}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Booking Button */}
      <View style={styles.bookingButtonContainer}>
        <Button
          mode="contained"
          onPress={handleBooking}
          disabled={!selectedDate || !selectedTimeSlot || loading}
          loading={loading}
          style={styles.bookingButton}
          contentStyle={styles.bookingButtonContent}
          buttonColor={Colors.primary}
        >
          {loading ? 'Processing...' : `Book Court - RM ${calculateTotal()}`}
        </Button>
      </View>

      {/* Confirmation Modal */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            🎾 Confirm Booking
          </Text>
          <Text style={styles.modalText}>
            Are you sure you want to book {courtDetails.courtNumber} on {selectedDate} at {selectedTimeSlot} for {duration} hour(s)?
          </Text>
          <Text variant="titleMedium" style={styles.modalTotal}>
            Total: RM {calculateTotal()}
          </Text>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowConfirmModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmBooking}
              loading={loading}
              style={styles.modalButton}
              buttonColor={Colors.primary}
            >
              Confirm Booking
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at bottom
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  courtTitle: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  courtInfo: {
    marginBottom: 4,
    color: '#666',
  },
  priceText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedDateText: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: '500',
  },
  dateText: {
    marginBottom: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  radioPrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotChip: {
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
  },
  unavailableTimeSlot: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  unavailableTimeSlotText: {
    textDecorationLine: 'line-through',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    color: '#666',
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  summaryTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: 'white',
    fontSize: 15,
  },
  summaryValue: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  bookingButtonContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#f5f5f5',
  },
  bookingButton: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookingButtonContent: {
    paddingVertical: 12,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.primary,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  modalTotal: {
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});