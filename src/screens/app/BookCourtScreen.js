// src/screens/app/BookCourtScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, RadioButton, Switch, 
  ActivityIndicator, Portal, Modal 
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function BookCourtScreen({ route, navigation }) {
    console.log('BookCourtScreen - Route params:', route.params);
  
  // Add error handling for missing params
  if (!route.params || !route.params.court) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Missing court data</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }
  const { court, courtId } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState(1);
  const [needOpponent, setNeedOpponent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Available time slots (you can make this dynamic based on court)
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const durationOptions = [
    { label: '1 Hour', value: 1 },
    { label: '2 Hours', value: 2 },
    { label: '3 Hours', value: 3 }
  ];

  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadBookedSlots = async (date) => {
    try {
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
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  };

  const isSlotAvailable = (timeSlot) => {
    return !bookedSlots.includes(timeSlot);
  };

  const calculateTotalPrice = () => {
    return court.pricePerHour * duration;
  };

  const getEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDateSelect = (day) => {
    const today = new Date().toISOString().split('T')[0];
    if (day.dateString < today) {
      Alert.alert('Invalid Date', 'Please select a future date');
      return;
    }
    setSelectedDate(day.dateString);
    setSelectedTimeSlot(''); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (timeSlot) => {
    // Check if the duration would conflict with other bookings
    const [hours] = timeSlot.split(':').map(Number);
    let conflictFound = false;
    
    for (let i = 0; i < duration; i++) {
      const checkHour = hours + i;
      const checkTimeSlot = `${checkHour.toString().padStart(2, '0')}:00`;
      if (bookedSlots.includes(checkTimeSlot)) {
        conflictFound = true;
        break;
      }
    }

    if (conflictFound) {
      Alert.alert(
        'Time Conflict', 
        `This ${duration}-hour booking would conflict with existing reservations. Please choose a different time or duration.`
      );
      return;
    }

    setSelectedTimeSlot(timeSlot);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Incomplete Selection', 'Please select both date and time slot');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to make a booking');
        return;
      }

      const bookingData = {
        userId: user.uid,
        courtId: courtId,
        courtNumber: court.courtNumber,
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        duration: duration,
        endTime: getEndTime(selectedTimeSlot, duration),
        needOpponent: needOpponent,
        totalAmount: calculateTotalPrice(),
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        userEmail: user.email,
        userName: user.displayName || user.email
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      setShowConfirmModal(false);
      Alert.alert(
        'Booking Successful!', 
        `Your court booking for ${selectedDate} at ${selectedTimeSlot} has been confirmed.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('MyBookings') 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Booking Failed', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: Colors.primary,
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Court Info Header */}
        <Card style={styles.courtInfoCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.courtName}>
              {court.courtNumber}
            </Text>
            <Text variant="bodyMedium" style={styles.location}>
              📍 One Touch Futsal, Temerloh Pahang
            </Text>
            <Text variant="titleMedium" style={styles.price}>
              RM {court.pricePerHour.toFixed(2)}/hour
            </Text>
          </Card.Content>
        </Card>

        {/* Date Selection */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Date
            </Text>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors.primary,
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: Colors.primary,
                monthTextColor: Colors.primary,
                indicatorColor: Colors.primary,
              }}
            />
          </Card.Content>
        </Card>

        {/* Duration Selection */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Duration
            </Text>
            <RadioButton.Group 
              onValueChange={value => setDuration(value)} 
              value={duration}
            >
              {durationOptions.map((option) => (
                <View key={option.value} style={styles.radioItem}>
                  <RadioButton value={option.value} />
                  <Text style={styles.radioLabel}>{option.label}</Text>
                  <Text style={styles.radioPrice}>
                    RM {(court.pricePerHour * option.value).toFixed(2)}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Time Slot Selection */}
        {selectedDate && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Available Time Slots - {selectedDate}
              </Text>
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map((timeSlot) => {
                  const available = isSlotAvailable(timeSlot);
                  const selected = selectedTimeSlot === timeSlot;
                  
                  return (
                    <Chip
                      key={timeSlot}
                      mode={selected ? 'flat' : 'outlined'}
                      selected={selected}
                      disabled={!available}
                      onPress={() => handleTimeSlotSelect(timeSlot)}
                      style={[
                        styles.timeSlotChip,
                        selected && styles.selectedTimeSlot,
                        !available && styles.unavailableTimeSlot
                      ]}
                      textStyle={[
                        styles.timeSlotText,
                        selected && styles.selectedTimeSlotText,
                        !available && styles.unavailableTimeSlotText
                      ]}
                    >
                      {timeSlot}
                    </Chip>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Opponent Option */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text variant="titleMedium">Need Opponent?</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  We'll help you find other players looking for a match
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
                Booking Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text>Court:</Text>
                <Text style={styles.summaryValue}>{court.courtNumber}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Date:</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Time:</Text>
                <Text style={styles.summaryValue}>
                  {selectedTimeSlot} - {getEndTime(selectedTimeSlot, duration)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Duration:</Text>
                <Text style={styles.summaryValue}>{duration} hour(s)</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Need Opponent:</Text>
                <Text style={styles.summaryValue}>{needOpponent ? 'Yes' : 'No'}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>RM {calculateTotalPrice().toFixed(2)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Book Now Button */}
      {selectedDate && selectedTimeSlot && (
        <View style={styles.bookingButtonContainer}>
          <Button
            mode="contained"
            onPress={handleBooking}
            style={styles.bookingButton}
            contentStyle={styles.bookingButtonContent}
            disabled={loading}
          >
            Book Court - RM {calculateTotalPrice().toFixed(2)}
          </Button>
        </View>
      )}

      {/* Confirmation Modal */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Confirm Booking
          </Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            Are you sure you want to book {court.courtNumber} on {selectedDate} 
            from {selectedTimeSlot} to {getEndTime(selectedTimeSlot, duration)}?
          </Text>
          <Text variant="titleMedium" style={styles.modalTotal}>
            Total: RM {calculateTotalPrice().toFixed(2)}
          </Text>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowConfirmModal(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmBooking}
              style={styles.modalButton}
              loading={loading}
              disabled={loading}
            >
              Confirm
            </Button>
          </View>
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
  courtInfoCard: {
    margin: 16,
    elevation: 3,
  },
  courtName: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  location: {
    color: Colors.onSurface,
    marginVertical: 4,
  },
  price: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioPrice: {
    color: Colors.primary,
    fontWeight: 'bold',
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
    color: Colors.onSurface,
    opacity: 0.7,
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    elevation: 3,
    backgroundColor: Colors.primary,
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
  summaryValue: {
    fontWeight: 'bold',
    color: 'white',
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
    backgroundColor: Colors.surface,
    elevation: 8,
  },
  bookingButton: {
    paddingVertical: 8,
  },
  bookingButtonContent: {
    paddingVertical: 12,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.primary,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 16,
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