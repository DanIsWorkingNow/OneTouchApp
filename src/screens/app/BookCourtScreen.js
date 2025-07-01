// src/screens/app/BookCourtScreen.js - WORKING VERSION WITH MATCHMAKING

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Platform, StyleSheet } from 'react-native';
import { Card, Text, Button, RadioButton, Chip, ActivityIndicator, Switch } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { TouchableOpacity } from 'react-native';

// 🎾 Import the working matchmaking service
import { notifyUsersAboutOpponentSearch } from '../../services/matchmakingService';

const BookCourtScreen = ({ route, navigation }) => {
  const { court, courtId } = route.params;
  
  // State variables
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState(1);
  const [needOpponent, setNeedOpponent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [courtDetails, setCourtDetails] = useState(court);

  // 🕐 OPERATIONAL HOURS: 08:00 till 02:00 next day (19 slots total)
  const operationalTimeSlots = [
    // Same day: 08:00 - 23:00 (16 slots)
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00',
    // Next day: 00:00 - 02:00 (3 slots)
    '00:00', '01:00', '02:00'
  ];

  // 💰 DYNAMIC PRICING FUNCTION - Add this after your state variables
const getDynamicPriceForTimeSlot = (timeSlot) => {
  try {
    if (!timeSlot) return 80;
    
    const [hours] = timeSlot.split(':').map(num => parseInt(num));
    
    // Normal Hours: 08:00 - 18:59 (RM 50)
    // Night Hours: 19:00 - 02:00 (RM 80)
    
    if (hours >= 8 && hours <= 18) {
      return 50; // Normal hours pricing
    } else if (hours >= 19 && hours <= 23) {
      return 80; // Night hours pricing (same day)
    } else if (hours >= 0 && hours <= 2) {
      return 80; // Night hours pricing (next day)
    }
    
    return 80; // fallback
  } catch (error) {
    console.error('Error calculating dynamic price:', error);
    return 80;
  }
};

  // Helper function for duration options
const calculateDynamicTotal = (startTimeSlot, durationValue) => {
  if (!startTimeSlot || !durationValue) return 0;
  
  try {
    const [startHours] = startTimeSlot.split(':').map(num => parseInt(num));
    const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
    const startIndex = operationalHours.indexOf(startHours);
    
    if (startIndex === -1) return 0;
    
    let totalPrice = 0;
    
    for (let i = 0; i < durationValue; i++) {
      const currentIndex = startIndex + i;
      if (currentIndex >= operationalHours.length) break;
      
      const currentHour = operationalHours[currentIndex];
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:00`;
      const hourlyPrice = getDynamicPriceForTimeSlot(timeSlot);
      
      totalPrice += hourlyPrice;
    }
    
    return totalPrice;
  } catch (error) {
    console.error('Error calculating dynamic total:', error);
    return durationValue * 80;
  }
};

 // 4. UPDATE YOUR operationalDurationOptions ARRAY:
const operationalDurationOptions = [
  { 
    label: '1 Hour', 
    value: 1, 
    get price() { return calculateTotal(); }
  },
  { 
    label: '2 Hours', 
    value: 2, 
    get price() { return selectedTimeSlot ? calculateDynamicTotal(selectedTimeSlot, 2) : 0; }
  },
  { 
    label: '3 Hours', 
    value: 3, 
    get price() { return selectedTimeSlot ? calculateDynamicTotal(selectedTimeSlot, 3) : 0; }
  },
  { 
    label: '6 Hours', 
    value: 6, 
    get price() { return selectedTimeSlot ? calculateDynamicTotal(selectedTimeSlot, 6) : 0; }
  },
  { 
    label: '12 Hours', 
    value: 12, 
    get price() { return selectedTimeSlot ? calculateDynamicTotal(selectedTimeSlot, 12) : 0; }
  },
  { 
    label: '18 Hours (Full Operation)', 
    value: 18, 
    get price() { return selectedTimeSlot ? calculateDynamicTotal(selectedTimeSlot, 18) : 0; },
    highlight: true 
  }
];

  // 🕐 END TIME CALCULATION: For operational hours sequence
  const calculateEndTime = (timeSlot, duration) => {
    try {
      if (!timeSlot || !duration) return 'N/A';
      
      const [hours, minutes] = timeSlot.split(':').map(num => parseInt(num));
      
      // Operational hours sequence: 8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2
      const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
      const startIndex = operationalHours.indexOf(hours);
      
      if (startIndex === -1) return 'Invalid time';
      
      const endIndex = (startIndex + duration);
      
      // Check if we exceed operational hours
      if (endIndex > operationalHours.length) {
        return 'Exceeds operational hours';
      }
      
      const finalIndex = endIndex === operationalHours.length ? 0 : endIndex % operationalHours.length;
      const endHour = endIndex === operationalHours.length ? 2 : operationalHours[finalIndex];
      
      // Determine if we cross to next day (when we reach 00:00 or beyond)
      const dayOffset = endIndex > 16 ? 1 : 0; // 16 is index of 23:00, so beyond that is next day
      
      const endTimeString = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      if (dayOffset > 0) {
        return `${endTimeString} (+1 day)`;
      }
      
      return endTimeString;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return 'N/A';
    }
  };

  // 🔍 AVAILABILITY CHECK: For operational hours sequence
  const isSlotAvailableForDuration = (startTime, duration, selectedDate, bookedSlots) => {
    try {
      const [startHours] = startTime.split(':').map(num => parseInt(num));
      
      // Operational hours sequence
      const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
      const startIndex = operationalHours.indexOf(startHours);
      
      if (startIndex === -1) return false; // Invalid start time
      
      // Check if duration exceeds operational hours
      if (startIndex + duration > operationalHours.length) {
        return false; // Cannot book beyond operational hours
      }
      
      let currentDate = new Date(selectedDate);
      
      // Check each hour slot for the entire duration
      for (let i = 0; i < duration; i++) {
        const currentIndex = startIndex + i;
        const currentHour = operationalHours[currentIndex];
        
        // Handle day transition when we go from 23:00 (index 15) to 00:00 (index 16)
        if (currentIndex >= 16 && i > 0) {
          // We're in the next day (00:00, 01:00, 02:00)
          if (i === 1 || operationalHours[startIndex + i - 1] === 23) {
            currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
        
        const timeSlot = `${currentHour.toString().padStart(2, '0')}:00`;
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if this specific time slot is booked
        const isBooked = bookedSlots.some(booking => 
          booking.date === dateString && 
          booking.timeSlot === timeSlot
        );
        
        if (isBooked) {
          return false; // Slot not available
        }
      }
      
      return true; // All slots available
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  };

  // Load court details
  useEffect(() => {
    loadCourtDetails();
    setAvailableSlots(operationalTimeSlots); // Use operational time slots only
  }, []);

  // Load booked slots when date or duration changes
  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate, duration]);

 // 🔧 ADDITIONAL FIX: Update your loadCourtDetails function to ensure court has required fields
const loadCourtDetails = async () => {
  try {
    const courtRef = doc(db, 'courts', courtId);
    const courtSnap = await getDoc(courtRef);
    
    if (courtSnap.exists()) {
      const courtData = { 
        id: courtSnap.id, 
        ...courtSnap.data(),
        // Ensure required fields exist with fallbacks
        courtNumber: courtSnap.data().courtNumber || courtSnap.data().name || `Court ${courtSnap.id}`,
        pricePerHour: courtSnap.data().pricePerHour || 80,
        facilityName: courtSnap.data().facilityName || 'One Touch Futsal',
        location: courtSnap.data().location || 'Temerloh, Pahang'
      };
      setCourtDetails(courtData);
      console.log('✅ Court details loaded with required fields:', courtData);
    } else {
      // Fallback court data if not found in database
      const fallbackCourtData = {
        id: courtId,
        courtNumber: court?.courtNumber || court?.name || `Court ${courtId}`,
        pricePerHour: court?.pricePerHour || 80,
        facilityName: court?.facilityName || 'One Touch Futsal',
        location: court?.location || 'Temerloh, Pahang'
      };
      setCourtDetails(fallbackCourtData);
      console.log('⚠️ Using fallback court data:', fallbackCourtData);
    }
  } catch (error) {
    console.error('Error loading court details:', error);
    // Set fallback data on error
    const fallbackCourtData = {
      id: courtId,
      courtNumber: `Court ${courtId}`,
      pricePerHour: 80,
      facilityName: 'One Touch Futsal',
      location: 'Temerloh, Pahang'
    };
    setCourtDetails(fallbackCourtData);
  }
};

  // 🔧 FIXED: Firebase query for multi-day checking
  const loadBookedSlots = async (date) => {
    try {
      setLoading(true);
      
      // Calculate date range (check current day and next day for cross-day bookings)
      const currentDate = date;
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateString = nextDate.toISOString().split('T')[0];
      
      const bookingsRef = collection(db, 'bookings');
      
      // Query for current date
      const q1 = query(
        bookingsRef,
        where('courtId', '==', courtId),
        where('date', '==', currentDate)
      );
      
      // Query for next date
      const q2 = query(
        bookingsRef,
        where('courtId', '==', courtId),
        where('date', '==', nextDateString)
      );
      
      // Execute both queries
      const [querySnapshot1, querySnapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const booked = [];
      
      // Process current date bookings
      querySnapshot1.forEach((doc) => {
        const booking = doc.data();
        if (booking.status !== 'cancelled') { // Filter out cancelled bookings
          booked.push({
            date: booking.date,
            timeSlot: booking.timeSlot,
            duration: booking.duration || 1,
            status: booking.status
          });
        }
      });
      
      // Process next date bookings
      querySnapshot2.forEach((doc) => {
        const booking = doc.data();
        if (booking.status !== 'cancelled') { // Filter out cancelled bookings
          booked.push({
            date: booking.date,
            timeSlot: booking.timeSlot,
            duration: booking.duration || 1,
            status: booking.status
          });
        }
      });
      
      setBookedSlots(booked);
    } catch (error) {
      console.error('Error loading booked slots:', error);
      // Set empty array on error so the UI still works
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 SLOT AVAILABILITY CHECK
  const isSlotAvailable = (slot) => {
    return isSlotAvailableForDuration(slot, duration, selectedDate, bookedSlots);
  };

  // 3. REPLACE YOUR calculateTotal FUNCTION WITH THIS:
const calculateTotal = () => {
  if (!selectedTimeSlot || !duration) return 0;
  
  try {
    const [startHours] = selectedTimeSlot.split(':').map(num => parseInt(num));
    const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
    const startIndex = operationalHours.indexOf(startHours);
    
    if (startIndex === -1) return 0;
    
    let totalPrice = 0;
    
    // Calculate price for each hour in the booking duration
    for (let i = 0; i < duration; i++) {
      const currentIndex = startIndex + i;
      if (currentIndex >= operationalHours.length) break;
      
      const currentHour = operationalHours[currentIndex];
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:00`;
      const hourlyPrice = getDynamicPriceForTimeSlot(timeSlot);
      
      totalPrice += hourlyPrice;
    }
    
    return totalPrice;
  } catch (error) {
    console.error('Error calculating dynamic total:', error);
    return duration * 80; // fallback
  }
};

// 5. COMPLETE PRICING BREAKDOWN COMPONENT (replace the incomplete one):
const PricingBreakdownDisplay = () => {
 if (!selectedTimeSlot || !duration) return null;
  
  const [startHours] = selectedTimeSlot.split(':').map(num => parseInt(num));
  const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
  const startIndex = operationalHours.indexOf(startHours);
  
  if (startIndex === -1) return null;
  
  let normalHours = 0;
  let nightHours = 0;
  
  for (let i = 0; i < duration; i++) {
    const currentIndex = startIndex + i;
    if (currentIndex >= operationalHours.length) break;
    
    const currentHour = operationalHours[currentIndex];
    
    if (currentHour >= 8 && currentHour <= 18) {
      normalHours++;
    } else {
      nightHours++;
    }
  }
  
  // ADD THIS MISSING RETURN STATEMENT:
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          💰 Pricing Breakdown
        </Text>
        {normalHours > 0 && (
          <Text variant="bodyMedium" style={{ color: '#2E7D32', marginBottom: 4 }}>
            🌅 Normal Hours (08:00-18:59): {normalHours}h × RM 50 = RM {normalHours * 50}
          </Text>
        )}
        {nightHours > 0 && (
          <Text variant="bodyMedium" style={{ color: '#E65100', marginBottom: 4 }}>
            🌙 Night Hours (19:00-02:00): {nightHours}h × RM 80 = RM {nightHours * 80}
          </Text>
        )}
        <Text variant="titleMedium" style={{ color: '#1976D2', fontWeight: 'bold', marginTop: 8 }}>
          Total: RM {calculateTotal()}
        </Text>
      </Card.Content>
    </Card>
  );
};
  // 🔧 CRITICAL FIX: Replace your existing createBooking function with this version:

const createBooking = async () => {
  try {
    setLoading(true);

    // Validation
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('❌ Incomplete', 'Please select date and time slot');
      return;
    }

    if (!isSlotAvailable(selectedTimeSlot)) {
      Alert.alert('❌ Not Available', 'Selected time slot is not available for this duration');
      return;
    }

    // Calculate affected time slots for operational hours
    const operationalHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
    const [startHours] = selectedTimeSlot.split(':').map(num => parseInt(num));
    const startIndex = operationalHours.indexOf(startHours);
    
    const affectedSlots = [];
    let currentDate = new Date(selectedDate);
    
    for (let i = 0; i < duration; i++) {
      const currentIndex = startIndex + i;
      const currentHour = operationalHours[currentIndex];
      
      // Handle day transition when we go from 23:00 to 00:00
      if (currentIndex >= 16 && i > 0) {
        currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      affectedSlots.push({
        date: currentDate.toISOString().split('T')[0],
        timeSlot: `${currentHour.toString().padStart(2, '0')}:00`
      });
    }

    // 🔧 FIXED: Create booking object with ALL required fields for notifications
    const bookingData = {
      // Core booking fields
      courtId: courtId,
      courtName: courtDetails.courtNumber || courtDetails.name || `Court ${courtId}`,
      courtNumber: courtDetails.courtNumber || courtDetails.name || `Court ${courtId}`, // Add this field
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      duration: duration,
      endTime: calculateEndTime(selectedTimeSlot, duration),
      
      // 🔧 CRITICAL: Include ALL pricing fields that notifications expect
      totalPrice: calculateTotal(), // Your existing field
      totalAmount: calculateTotal(), // What notifications expect
      pricePerHour: courtDetails.pricePerHour || 80, // Ensure this exists
      
      // 🔧 CRITICAL: Include facility information
      facilityName: courtDetails.facilityName || 'One Touch Futsal', // What notifications expect
      location: courtDetails.location || 'Temerloh, Pahang',
      
      // Matchmaking fields
      needOpponent: needOpponent,
      searchingForOpponent: needOpponent,
      opponentFound: false,
      matchedWithUserId: null,
      matchedWithUserName: null,
      
      // Status and metadata
      status: 'confirmed', // AUTO-CONFIRMED (no approval needed)
      paymentStatus: 'completed', // Add this field
      createdAt: new Date(),
      updatedAt: new Date(),
      affectedSlots: affectedSlots,
      bookingType: duration >= 18 ? 'full_operational' : duration >= 6 ? 'extended' : 'standard',
      operationalHours: true
    };

    // Save to Firebase
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log('📋 Booking created with ID:', docRef.id);

    // 🎾 MATCHMAKING: Send notifications if looking for opponent
    let matchmakingMessage = '';
    if (needOpponent) {
      try {
        console.log('🎾 Sending matchmaking notifications...');
        const currentUser = auth.currentUser;
        
        // 🔧 FIXED: Add booking ID and ensure complete data for notifications
        const bookingDataWithId = {
          ...bookingData,
          bookingId: docRef.id,
          id: docRef.id, // Alternative ID field
          // Ensure user info is available for notifications
          searchingUserName: currentUser.displayName || currentUser.email || 'User',
          searchingUserEmail: currentUser.email
        };
        
        await notifyUsersAboutOpponentSearch(bookingDataWithId, currentUser);
        matchmakingMessage = '\n\n⚽Great! Other players have been notified about your search for an opponent. Check your notifications for responses!';
        
      } catch (notificationError) {
        console.error('❌ Matchmaking notification error:', notificationError);
        // Don't fail the booking if notifications fail
        matchmakingMessage = '\n\n⚠️ Booking confirmed, but there was an issue sending opponent notifications. Please try again later.';
      }
    }

    // Success message with booking details
    const endTimeDisplay = calculateEndTime(selectedTimeSlot, duration);
    const isFullOperationalHours = duration >= 18;
    
    Alert.alert(
      '✅ Booking Confirmed!',
      `Your ${isFullOperationalHours ? 'full operational hours ' : ''}booking has been confirmed!${matchmakingMessage}\n\n` +
      `Court: ${courtDetails.courtNumber}\n` +
      `Date: ${formatDate(selectedDate)}\n` +
      `Time: ${selectedTimeSlot} - ${endTimeDisplay}\n` +
      `Duration: ${duration} hour${duration > 1 ? 's' : ''}\n` +
      `Total: RM ${calculateTotal()}\n\n` +
      `Booking ID: ${docRef.id.slice(-8)}`,
      [
        {
          text: 'View My Bookings',
          onPress: () => navigation.navigate('MainTabs', { screen: 'MyBookings' })
        },
        {
          text: 'Book Another Court',
          onPress: () => {
            // Reset form
            setSelectedDate('');
            setSelectedTimeSlot('');
            setDuration(1);
            setNeedOpponent(false);
          }
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
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

 // REPLACE YOUR ENTIRE RETURN STATEMENT WITH THIS CORRECTED VERSION:

return (
  <View style={styles.container}>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      
      {/* Court Info Header with Dynamic Pricing */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.courtTitle}>
            {courtDetails.courtNumber || 'Court'}
          </Text>
          
          {/* Updated pricing display */}
          <View style={{ marginVertical: 8 }}>
            <Text variant="bodyMedium" style={{ color: '#2E7D32', marginBottom: 2 }}>
              🌅 Normal Hours (08:00-18:59): RM 50/hour
            </Text>
            <Text variant="bodyMedium" style={{ color: '#E65100', marginBottom: 2 }}>
              🌙 Night Hours (19:00-02:00): RM 80/hour
            </Text>
          </View>
          
          <Text variant="bodySmall" style={styles.operationalHours}>
            🕐 Operational Hours: 08:00 - 02:00 (+1 day)
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
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#2196F3' }
            }}
            minDate={getTodayDate()}
            maxDate={getMaxDate()}
            theme={{
              selectedDayBackgroundColor: '#2196F3',
              todayTextColor: '#2196F3',
              arrowColor: '#2196F3',
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
          <Text variant="bodySmall" style={styles.durationNote}>
            Maximum: 18 hours (full operational period)
          </Text>
          <RadioButton.Group
            onValueChange={value => setDuration(value)}
            value={duration}
          >
            {operationalDurationOptions.map((option) => (
              <View key={option.value} style={[
                styles.radioItem,
                option.highlight && styles.highlightedOption
              ]}>
                <RadioButton value={option.value} color="#2196F3" />
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioLabel,
                    option.highlight && styles.highlightedText
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.radioPrice,
                    option.highlight && styles.highlightedPrice
                  ]}>
                    RM {option.price}
                  </Text>
                </View>
                {option.highlight && (
                  <Chip mode="flat" style={styles.clientRequestChip}>
                    Client Request
                  </Chip>
                )}
              </View>
            ))}
          </RadioButton.Group>
          
          {selectedTimeSlot && duration > 1 && (
            <View style={styles.timeDisplay}>
              <Text style={styles.timeDisplayText}>
                📍 {selectedTimeSlot} → {calculateEndTime(selectedTimeSlot, duration)}
              </Text>
            </View>
          )}
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
        {formatDate(selectedDate)} • {duration} hour{duration > 1 ? 's' : ''}
      </Text>
      <Text variant="bodySmall" style={styles.hoursInfo}>
        Regular Hours: 08:00-23:00 | Early Morning: 00:00-02:00 🌙
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Checking availability...</Text>
        </View>
      ) : (
        <View style={styles.timeSlotsContainer}>
          {operationalTimeSlots.map((slot) => {
            const isAvailable = isSlotAvailable(slot);
            const isSelected = selectedTimeSlot === slot;
            const hourlyPrice = getDynamicPriceForTimeSlot(slot);
            const isPeakHour = hourlyPrice === 80;
            
            return (
              <Chip
                key={slot}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => isAvailable && setSelectedTimeSlot(slot)}
                disabled={!isAvailable}
                style={[
                  styles.timeSlotChip,
                  isSelected && styles.selectedChip,
                  !isAvailable && styles.unavailableChip,
                  isPeakHour && !isSelected && styles.peakHourChip
                ]}
                textStyle={[
                  styles.timeSlotText,
                  isSelected && styles.selectedTimeSlotText,
                  !isAvailable && styles.unavailableText
                ]}
              >
                {slot}
              </Chip>
            );
          })}
        </View>
      )}
    </Card.Content>
  </Card>
)}

      {/* Opponent Search / Matchmaking */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ⚽ Find Playing Partner
          </Text>
          <Text variant="bodySmall" style={styles.matchmakingNote}>
            Would you like us to notify other players that you're looking for an opponent?
          </Text>
          
          <View style={styles.matchmakingContainer}>
            <View style={styles.matchmakingOption}>
              <View>
                <Text style={styles.matchmakingLabel}>Search for Opponent</Text>
                <Text style={styles.matchmakingDescription}>
                  We'll notify other players about your booking
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 8, color: needOpponent ? '#2196F3' : '#888', fontWeight: 'bold' }}>
                  {needOpponent ? 'Yes' : 'No'}
                </Text>
                <Switch
                  value={needOpponent}
                  onValueChange={setNeedOpponent}
                  color="#2196F3"
                />
              </View>
            </View>
            
            {needOpponent && (
              <View style={styles.matchmakingInfo}>
                <Text style={styles.matchmakingInfoText}>
                  ✅ Other players will be notified when you confirm this booking
                </Text>
                <Text style={styles.matchmakingBenefit}>
                  🎯 87% of players find it helpful to connect with opponents
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* ADD PRICING BREAKDOWN HERE - Only show when time slot and duration are selected */}
      {selectedTimeSlot && duration && <PricingBreakdownDisplay />}


      {/* Confirm Booking Button */}
      {selectedDate && selectedTimeSlot && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.summaryContainer}>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                📋 Booking Summary
              </Text>
              <Text style={styles.summaryText}>
                Court: {courtDetails.courtNumber}
              </Text>
              <Text style={styles.summaryText}>
                Date: {formatDate(selectedDate)}
              </Text>
              <Text style={styles.summaryText}>
                Time: {selectedTimeSlot} - {calculateEndTime(selectedTimeSlot, duration)}
              </Text>
              <Text style={styles.summaryText}>
                Duration: {duration} hour{duration > 1 ? 's' : ''}
              </Text>
              <Text style={[styles.summaryText, styles.totalPrice]}>
                Total: RM {calculateTotal()}
              </Text>
              
              {needOpponent && (
                <Text style={styles.matchmakingStatus}>
                  ⚽ Looking for playing partner - other players will be notified
                </Text>
              )}
              
              {duration >= 18 && (
                <Text style={styles.fullOperationNote}>
                  🕐 This booking covers our full operational hours (08:00 - 02:00)
                </Text>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={createBooking}
              loading={loading}
              disabled={loading}
              style={styles.confirmButton}
              contentStyle={styles.confirmButtonContent}
            >
              {loading ? 'Processing...' : 'Confirm Booking ✅'}
            </Button>
          </Card.Content>
        </Card>
      )}
      
    </ScrollView>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  courtTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  courtPrice: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  operationalHours: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  fullOperationChip: {
    backgroundColor: '#E3F2FD',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  durationNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  selectedDateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  highlightedOption: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    margin: 4,
  },
  radioContent: {
    flex: 1,
    marginLeft: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  radioPrice: {
    fontSize: 14,
    color: '#666',
  },
  highlightedText: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  highlightedPrice: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  clientRequestChip: {
    backgroundColor: '#FFF3E0',
  },
  timeDisplay: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#2196F3',
  },
  timeDisplayText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  // 🎾 MATCHMAKING STYLES
  matchmakingNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  matchmakingContainer: {
    marginTop: 8,
  },
  matchmakingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  matchmakingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  matchmakingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  matchmakingButton: {
    minWidth: 120,
  },
  matchmakingButtonActive: {
    backgroundColor: '#FF6B35',
  },
  matchmakingInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#FF6B35',
  },
  matchmakingInfoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  matchmakingBenefit: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  matchmakingStatus: {
    fontSize: 12,
    color: '#FF6B35',
    backgroundColor: '#FFF0E6',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  dateText: {
    marginBottom: 8,
    color: '#666',
  },
  hoursInfo: {
    marginBottom: 12,
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
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
    margin: 2,
  },
  selectedChip: {
    backgroundColor: '#2196F3',
  },
  disabledChip: {
    opacity: 0.5,
  },
  earlyMorningSlot: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  timeSlotText: {
    fontSize: 12,
  },
  disabledText: {
    color: '#999',
  },
  earlyMorningText: {
    color: '#1976D2',
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 8,
  },
  fullOperationNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 4,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  priceLabel: {
  fontSize: 10,
  color: '#666',
  marginTop: 2,
  textAlign: 'center',
},
sectionTitle: {
  marginBottom: 12,
  fontWeight: 'bold',
},
});

export default BookCourtScreen;