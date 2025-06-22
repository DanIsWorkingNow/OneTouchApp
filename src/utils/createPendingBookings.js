// src/utils/createPendingBookings.js
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Create sample pending bookings for testing Court Admin approval feature
export const createSamplePendingBookings = async () => {
  try {
    console.log('🔄 Creating sample pending bookings...');
    
    // Get existing courts to use real court IDs
    const courtsSnapshot = await getDocs(collection(db, 'courts'));
    if (courtsSnapshot.empty) {
      throw new Error('No courts found. Please set up courts first.');
    }
    
    const courts = courtsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create sample pending bookings with proper structure
    const pendingBookings = [
      {
        userId: "mzIUk5cf2nTnNmqg2iVE7yNZsGU2", // existing user from your DB
        userEmail: "gptproplus11@gmail.com",
        courtId: courts[0]?.id || "dummy",
        courtNumber: courts[0]?.courtNumber || "Court 1",
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        date: "2025-06-24", // Tomorrow
        timeSlot: "09:00",
        duration: 2,
        needOpponent: true,
        pricePerHour: 80,
        totalAmount: 160,
        status: "pending", // ← This is key!
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: "mzIUk5cf2nTnNmqg2iVE7yNZsGU2",
        userEmail: "gptproplus11@gmail.com", 
        courtId: courts[1]?.id || courts[0]?.id || "dummy",
        courtNumber: courts[1]?.courtNumber || "Court 2",
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        date: "2025-06-25",
        timeSlot: "14:00", 
        duration: 1,
        needOpponent: false,
        pricePerHour: 75,
        totalAmount: 75,
        status: "pending", // ← This is key!
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: "4stXhHCrotaVTSYGVAAHMQLGFCi2", // Another existing user
        userEmail: "nurhaziqadnan10@gmail.com",
        courtId: courts[2]?.id || courts[0]?.id || "dummy",
        courtNumber: courts[2]?.courtNumber || "Court 3", 
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        date: "2025-06-26",
        timeSlot: "18:00",
        duration: 2,
        needOpponent: true,
        pricePerHour: 85,
        totalAmount: 170,
        status: "pending", // ← This is key!
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add pending bookings to Firestore
    let successCount = 0;
    for (const booking of pendingBookings) {
      try {
        const docRef = await addDoc(collection(db, 'bookings'), booking);
        console.log(`✅ Created pending booking: ${booking.courtNumber} on ${booking.date}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create booking:`, error);
      }
    }
    
    return {
      success: true,
      message: `Successfully created ${successCount} pending bookings for testing`,
      count: successCount
    };
    
  } catch (error) {
    console.error('❌ Error creating pending bookings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Quick function to run in development
export const quickCreatePendingBookings = async () => {
  const result = await createSamplePendingBookings();
  console.log('📋 Result:', result);
  return result;
};

// Function to check current booking statuses
export const checkBookingStatuses = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'bookings'));
    const statusCounts = {};
    
    snapshot.docs.forEach(doc => {
      const status = doc.data().status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📊 Booking Status Counts:', statusCounts);
    return statusCounts;
  } catch (error) {
    console.error('❌ Error checking booking statuses:', error);
    return null;
  }
};