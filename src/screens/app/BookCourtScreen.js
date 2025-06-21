// src/screens/app/BookCourtScreen.js - ANDROID FIX
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
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
  console.log('📱 Platform:', Platform.OS);
  
  // Error handling for missing params
  if (!route.params || !route.params.court) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Missing court data</Text>
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
  const [courtDetails, setCourtDetails] = useState(court);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load court details and check booked slots
  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots();
    }
  }, [selectedDate]);

  useEffect(() => {
    loadCourtDetails();
  }, []);

  const loadCourtDetails = async () => {
    try {
      console.log('📡 Loading court details for:', courtId);
      const courtDoc = await getDoc(doc(db, 'courts', courtId));
      if (courtDoc.exists()) {
        const details = { id: courtDoc.id, ...courtDoc.data() };
        setCourtDetails(details);
        console.log('✅ Court details loaded:', details);
      } else {
        console.log('⚠️ No court found, using default data');
        setCourtDetails(court);
      }
    } catch (error) {
      console.error('❌ Error loading court details:', error);
      setCourtDetails(court);
    }
  };

  const loadBookedSlots = async () => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('courtId', '==', courtId),
        where('date', '==', selectedDate)
      );
      const snapshot = await getDocs(bookingsQuery);
      const slots = snapshot.docs.map(doc => doc.data().timeSlot);
      setBookedSlots(slots);
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMarkedDates = () => {
    const marked = {};
    if (selectedDate) {
      marked[selectedDate] = { selected: true, selectedColor: Colors.primary };
    }
    return marked;
  };

  const calculateTotalPrice = () => {
    return courtDetails.pricePerHour * duration;
  };

  const isSlotAvailable = (slot) => {
    return !bookedSlots.includes(slot);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please select date and time slot');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        courtId: courtId,
        courtName: courtDetails.courtNumber,
        facilityName: courtDetails.facilityName,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        duration: duration,
        needOpponent: needOpponent,
        totalPrice: calculateTotalPrice(),
        status: 'confirmed',
        createdAt: new Date(),
        location: courtDetails.location
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      Alert.alert(
        'Booking Confirmed!',
        `Your court has been booked for ${selectedDate} at ${selectedTimeSlot}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', 'Please try again later');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    const slots = courtDetails.timeSlots || [];
    
    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Available Time Slots
          </Text>
          <View style={styles.timeSlotsContainer}>
            {slots.map((slot) => {
              const available = isSlotAvailable(slot);
              return (
                <Chip
                  key={slot}
                  mode={selectedTimeSlot === slot ? 'flat' : 'outlined'}
                  selected={selectedTimeSlot === slot}
                  onPress={() => available && setSelectedTimeSlot(slot)}
                  disabled={!available}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot && styles.selectedTimeSlot,
                    !available && styles.disabledTimeSlot
                  ]}
                  textStyle={[
                    styles.timeSlotText,
                    selectedTimeSlot === slot && styles.selectedTimeSlotText
                  ]}
                >
                  {slot}
                </Chip>
              );
            })}
          </View>
          {slots.length === 0 && (
            <Text style={styles.noSlotsText}>No time slots available</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Court Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.courtName}>
              {courtDetails.courtNumber || 'Court'}
            </Text>
            <Text variant="bodyMedium" style={styles.facilityName}>
              {courtDetails.facilityName || 'Unknown Facility'}
            </Text>
            <Text variant="bodyMedium" style={styles.location}>
              📍 {courtDetails.location || 'Location not specified'}
            </Text>
            <Text variant="titleMedium" style={styles.price}>
              💰 RM {courtDetails.pricePerHour || 0}/hour
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
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={getMarkedDates()}
              minDate={getTodayString()}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
              }}
            />
          </Card.Content>
        </Card>

        {/* Time Slots */}
        {renderTimeSlots()}

        {/* Duration Selection */}
        {selectedTimeSlot && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Duration (Hours)
              </Text>
              <RadioButton.Group 
                onValueChange={value => setDuration(parseInt(value))} 
                value={duration.toString()}
              >
                <View style={styles.radioRow}>
                  <RadioButton value="1" />
                  <Text style={styles.radioLabel}>1 hour</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="2" />
                  <Text style={styles.radioLabel}>2 hours</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="3" />
                  <Text style={styles.radioLabel}>3 hours</Text>
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>
        )}

        {/* Need Opponent Switch */}
        {selectedTimeSlot && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyLarge">Find Opponent</Text>
                  <Text variant="bodySmall" style={styles.switchDescription}>
                    Let others know you're looking for a game partner
                  </Text>
                </View>
                <Switch
                  value={needOpponent}
                  onValueChange={setNeedOpponent}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTimeSlot && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                Booking Summary
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
                <Text style={styles.summaryValue}>{duration} hour{duration > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Need Opponent:</Text>
                <Text style={styles.summaryValue}>{needOpponent ? 'Yes' : 'No'}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>RM {calculateTotalPrice()}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Book Button */}
        {selectedDate && selectedTimeSlot && (
          <View style={styles.bookingButtonContainer}>
            <Button
              mode="contained"
              onPress={() => setShowConfirmModal(true)}
              loading={loading}
              disabled={loading}
              style={styles.bookingButton}
                buttonColor={Colors.primary}
              contentStyle={styles.bookingButtonContent}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </View>
        )}
      </ScrollView>

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
          <Text style={styles.modalText}>
            Court: {courtDetails.courtNumber}{'\n'}
            Date: {selectedDate}{'\n'}
            Time: {selectedTimeSlot}{'\n'}
            Duration: {duration} hour{duration > 1 ? 's' : ''}
          </Text>
          <Text style={styles.modalTotal}>
            Total: RM {calculateTotalPrice()}
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
              onPress={handleBooking}
              loading={loading}
              style={styles.modalButton}
               buttonColor={Colors.primary}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#d32f2f',
  },
  infoCard: {
    margin: 16,
    elevation: 3,
  },
  courtName: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  facilityName: {
    color: '#666',
    marginBottom: 4,
  },
  location: {
    color: '#666',
    marginBottom: 8,
  },
  price: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    margin: 4,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
  },
  disabledTimeSlot: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 12,
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    color: '#666',
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    backgroundColor: '#303030',
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
  divider: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 8,
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
    marginHorizontal: 16,
    marginVertical: 16,
  },
  bookingButton: {
    paddingVertical: 4,
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