// src/utils/hardcodedDatabaseSetup.js
import { collection, addDoc, setDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { createSamplePendingBookings } from './bookingUtils';

// 🗄️ HARDCODED DATABASE STRUCTURE

// 1. COURTS COLLECTION DATA
const hardcodedCourts = [
  {
    courtNumber: "Court 1",
    facilityName: "One Touch Futsal",
    location: "Temerloh, Pahang",
    pricePerHour: 80,
    status: "available",
    timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    amenities: ["Air Conditioning", "Parking", "Changing Room", "Water Dispenser"],
    createdAt: new Date()
  },
  {
    courtNumber: "Court 2",
    facilityName: "One Touch Futsal",
    location: "Temerloh, Pahang",
    pricePerHour: 80,
    status: "available",
    timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    amenities: ["Air Conditioning", "Parking", "Changing Room", "Water Dispenser"],
    createdAt: new Date()
  },
  {
    courtNumber: "Court 3",
    facilityName: "One Touch Futsal",
    location: "Temerloh, Pahang",
    pricePerHour: 75,
    status: "available",
    timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    amenities: ["Parking", "Changing Room", "Water Dispenser"],
    createdAt: new Date()
  }
];

// 2. SAMPLE USERS COLLECTION DATA
const hardcodedUsers = [
  {
    id: "user1_demo_12345",
    username: "John Doe",
    email: "john.doe@example.com",
    phoneNumber: "+60123456789",
    role: "customer",
    pushToken: "",
    createdAt: new Date()
  },
  {
    id: "user2_demo_67890",
    username: "Sarah Lee",
    email: "sarah.lee@example.com",
    phoneNumber: "+60198765432",
    role: "customer",
    pushToken: "",
    createdAt: new Date()
  },
  {
    id: "admin_demo_99999",
    username: "Admin User",
    email: "admin@onetouchfutsal.com",
    phoneNumber: "+60123000000",
    role: "admin",
    pushToken: "",
    createdAt: new Date()
  }
];

// 3. SAMPLE BOOKINGS COLLECTION DATA
const getHardcodedBookings = (courtIds) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      userId: "user1_demo_12345",
      userEmail: "john.doe@example.com",
      courtId: courtIds[0], // Court 1
      courtNumber: "Court 1",
      facilityName: "One Touch Futsal",
      location: "Temerloh, Pahang",
      date: tomorrow.toISOString().split('T')[0],
      timeSlot: "14:00",
      duration: 2,
      needOpponent: true,
      pricePerHour: 80,
      totalAmount: 160,
      status: "confirmed",
      paymentStatus: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: "user1_demo_12345",
      userEmail: "john.doe@example.com",
      courtId: courtIds[2], // Court 3
      courtNumber: "Court 3",
      facilityName: "One Touch Futsal",
      location: "Temerloh, Pahang",
      date: dayAfterTomorrow.toISOString().split('T')[0],
      timeSlot: "18:00",
      duration: 1,
      needOpponent: false,
      pricePerHour: 75,
      totalAmount: 75,
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: "user2_demo_67890",
      userEmail: "sarah.lee@example.com",
      courtId: courtIds[1], // Court 2
      courtNumber: "Court 2",
      facilityName: "One Touch Futsal",
      location: "Temerloh, Pahang",
      date: nextWeek.toISOString().split('T')[0],
      timeSlot: "10:00",
      duration: 3,
      needOpponent: true,
      pricePerHour: 80,
      totalAmount: 240,
      status: "confirmed",
      paymentStatus: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: "user2_demo_67890",
      userEmail: "sarah.lee@example.com",
      courtId: courtIds[3], // Court 4
      courtNumber: "Court 4",
      facilityName: "One Touch Futsal",
      location: "Temerloh, Pahang",
      date: today.toISOString().split('T')[0],
      timeSlot: "20:00",
      duration: 1,
      needOpponent: false,
      pricePerHour: 75,
      totalAmount: 75,
      status: "completed",
      paymentStatus: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: "user1_demo_12345",
      userEmail: "john.doe@example.com",
      courtId: courtIds[5], // Court 6
      courtNumber: "Court 6",
      facilityName: "One Touch Futsal",
      location: "Temerloh, Pahang",
      date: "2025-06-25",
      timeSlot: "16:00",
      duration: 2,
      needOpponent: true,
      pricePerHour: 70,
      totalAmount: 140,
      status: "cancelled",
      paymentStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
};

// 🚀 SETUP FUNCTIONS

// Clear existing data (optional - for clean setup)
export const clearAllCollections = async () => {
  try {
    console.log('🗑️ Clearing existing data...');
    
    const collections = ['courts', 'users', 'bookings'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${collectionName} collection (${snapshot.size} documents)`);
    }
    
    return { success: true, message: 'All collections cleared successfully' };
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    return { success: false, error: error.message };
  }
};

// Setup Courts Collection
export const setupCourtsCollection = async () => {
  try {
    console.log('🏟️ Setting up courts collection...');
    
    const courtIds = [];
    
    for (const court of hardcodedCourts) {
      const docRef = await addDoc(collection(db, 'courts'), court);
      courtIds.push(docRef.id);
      console.log(`✅ Added ${court.courtNumber} with ID: ${docRef.id}`);
    }
    
    console.log(`🎾 Courts collection setup complete! Added ${hardcodedCourts.length} courts.`);
    return { success: true, courtIds, message: `${hardcodedCourts.length} courts added successfully` };
  } catch (error) {
    console.error('❌ Error setting up courts:', error);
    return { success: false, error: error.message };
  }
};

// NEW FUNCTION: Setup sample pending bookings for testing approval feature
export const setupSamplePendingBookings = async () => {
  try {
    console.log('🔄 Setting up sample pending bookings for approval testing...');

    const result = await createSamplePendingBookings();
    
    if (result.success) {
      console.log('🎉 Sample pending bookings created successfully!');
      return {
        success: true,
        message: `✅ Created ${result.count} pending bookings for testing booking approval feature`,
        count: result.count
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to create sample bookings',
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ Error setting up sample pending bookings:', error);
    return {
      success: false,
      message: 'Failed to create sample pending bookings',
      error: error.message
    };
  }
};

// Setup Users Collection
export const setupUsersCollection = async () => {
  try {
    console.log('👥 Setting up users collection...');
    
    for (const user of hardcodedUsers) {
      await setDoc(doc(db, 'users', user.id), {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        pushToken: user.pushToken,
        createdAt: user.createdAt
      });
      console.log(`✅ Added user: ${user.username} (${user.role})`);
    }
    
    console.log(`👤 Users collection setup complete! Added ${hardcodedUsers.length} users.`);
    return { success: true, message: `${hardcodedUsers.length} users added successfully` };
  } catch (error) {
    console.error('❌ Error setting up users:', error);
    return { success: false, error: error.message };
  }
};

// ENHANCED: Complete database setup with pending bookings option
export const setupCompleteDatabase = async (clearExisting = false, includePendingBookings = true) => {
  try {
    console.log('🚀 Starting complete database setup...');
    
    if (clearExisting) {
      console.log('🗑️ Clearing existing data...');
      const clearResult = await clearAllCollections();
      if (!clearResult.success) {
        console.warn('⚠️ Failed to clear existing data, continuing anyway...');
      }
    }
    
    // 1. Setup Courts
    const courtsResult = await setupCourtsCollection();
    if (!courtsResult.success) {
      throw new Error(`Failed to setup courts: ${courtsResult.error}`);
    }
    
    // 2. Setup Users
    const usersResult = await setupUsersCollection();
    if (!usersResult.success) {
      throw new Error(`Failed to setup users: ${usersResult.error}`);
    }
    
    // 3. Setup Initial Bookings (confirmed/completed)
    const bookingsResult = await setupBookingsCollection(courtsResult.courtIds);
    if (!bookingsResult.success) {
      throw new Error(`Failed to setup bookings: ${bookingsResult.error}`);
    }

    // 4. Setup Sample Pending Bookings (for testing approval feature)
    let pendingBookingsMessage = '';
    if (includePendingBookings) {
      console.log('📋 Setting up sample pending bookings...');
      const pendingResult = await setupSamplePendingBookings();
      if (pendingResult.success) {
        pendingBookingsMessage = `\n📋 ${pendingResult.count} pending bookings for approval testing`;
      } else {
        console.warn('⚠️ Failed to create pending bookings:', pendingResult.error);
      }
    }
    
    console.log('🎉 Complete database setup finished successfully!');
    
    return {
      success: true,
      message: `🎯 Database setup complete!\n✅ ${hardcodedCourts.length} courts\n✅ ${hardcodedUsers.length} users\n✅ ${getHardcodedBookings(['dummy']).length} confirmed bookings${pendingBookingsMessage}`,
      data: {
        courts: hardcodedCourts.length,
        users: hardcodedUsers.length,
        confirmedBookings: getHardcodedBookings(['dummy']).length,
        pendingBookings: includePendingBookings ? 3 : 0
      }
    };
    
  } catch (error) {
    console.error('❌ Complete database setup failed:', error);
    return {
      success: false,
      message: 'Database setup failed',
      error: error.message
    };
  }
};

// 🔍 UTILITY FUNCTIONS

// Check if collections exist
export const checkCollectionsStatus = async () => {
  try {
    const collections = ['courts', 'users', 'bookings'];
    const status = {};
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      status[collectionName] = {
        exists: snapshot.size > 0,
        count: snapshot.size
      };
    }
    
    console.log('📊 Collections Status:', status);
    return { success: true, status };
  } catch (error) {
    console.error('❌ Error checking collections:', error);
    return { success: false, error: error.message };
  }
};

// Quick setup for current user's bookings (if authenticated)
export const setupCurrentUserBookings = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'User must be logged in' };
    }
    
    // Get existing courts
    const courtsSnapshot = await getDocs(collection(db, 'courts'));
    if (courtsSnapshot.empty) {
      return { success: false, message: 'No courts found. Setup courts first.' };
    }
    
    const courtIds = courtsSnapshot.docs.map(doc => doc.id);
    const userBookings = [
      {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        courtId: courtIds[0],
        courtNumber: "Court 1",
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        timeSlot: "15:00",
        duration: 2,
        needOpponent: true,
        pricePerHour: 80,
        totalAmount: 160,
        status: "confirmed",
        paymentStatus: "completed",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const booking of userBookings) {
      await addDoc(collection(db, 'bookings'), booking);
    }
    
    return { 
      success: true, 
      message: `Added ${userBookings.length} bookings for current user` 
    };
  } catch (error) {
    console.error('❌ Error setting up user bookings:', error);
    return { success: false, error: error.message };
  }
};