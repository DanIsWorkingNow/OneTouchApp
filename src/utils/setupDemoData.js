// src/utils/setupDemoData.js
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Demo court data for One Touch Futsal - Temerloh, Pahang
const demoCourts = [
  {
    courtNumber: "Court 1",
    pricePerHour: 80.00,
    status: "available",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  },
  {
    courtNumber: "Court 2",
    pricePerHour: 80.00,
    status: "available",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  },
  {
    courtNumber: "Court 3",
    pricePerHour: 75.00,
    status: "available",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  },
  {
    courtNumber: "Court 4",
    pricePerHour: 75.00,
    status: "available",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  },
  {
    courtNumber: "Court 5",
    pricePerHour: 70.00,
    status: "maintenance",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  },
  {
    courtNumber: "Court 6",
    pricePerHour: 70.00,
    status: "available",
    timeSlots: [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ]
  }
];

// Function to check if courts already exist
export const checkIfCourtsExist = async () => {
  try {
    const courtsRef = collection(db, 'courts');
    const snapshot = await getDocs(courtsRef);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking courts:', error);
    return false;
  }
};

// Function to add demo courts to Firestore
export const setupDemoCourts = async () => {
  try {
    console.log('Setting up One Touch Futsal courts...');
    
    // Check if courts already exist
    const courtsExist = await checkIfCourtsExist();
    if (courtsExist) {
      console.log('Courts already exist in database');
      return { success: true, message: 'Courts already exist' };
    }

    // Add each demo court to Firestore
    const promises = demoCourts.map(async (court) => {
      const docRef = await addDoc(collection(db, 'courts'), {
        ...court,
        facilityName: "One Touch Futsal",
        location: "Temerloh, Pahang",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`${court.courtNumber} added with ID:`, docRef.id);
      return docRef.id;
    });

    const courtIds = await Promise.all(promises);
    
    console.log('✅ One Touch Futsal courts setup completed!');
    console.log(`Added ${courtIds.length} courts to the database`);
    
    return { 
      success: true, 
      message: `Successfully added ${courtIds.length} courts for One Touch Futsal`,
      courtIds 
    };
    
  } catch (error) {
    console.error('❌ Error setting up courts:', error);
    return { 
      success: false, 
      message: 'Failed to setup courts',
      error: error.message 
    };
  }
};

// Function to reset courts (useful for testing)
export const resetDemoCourts = async () => {
  try {
    console.log('Resetting One Touch Futsal courts...');
    
    // Delete existing courts
    const courtsRef = collection(db, 'courts');
    const snapshot = await getDocs(courtsRef);
    
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${snapshot.docs.length} existing courts`);
    
    // Add fresh demo courts
    const result = await setupDemoCourts();
    
    return result;
    
  } catch (error) {
    console.error('❌ Error resetting courts:', error);
    return { 
      success: false, 
      message: 'Failed to reset courts',
      error: error.message 
    };
  }
};

// Call this function when app starts (optional)
export const initializeDemoData = async () => {
  try {
    const result = await setupDemoCourts();
    if (result.success) {
      console.log('🎉 One Touch Futsal demo data initialization completed');
    }
    return result;
  } catch (error) {
    console.error('Error initializing demo data:', error);
    return { success: false, error: error.message };
  }
};