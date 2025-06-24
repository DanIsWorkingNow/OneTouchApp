// src/utils/matchmakingSetup.js
import { 
  collection, addDoc, getDocs, updateDoc, doc, query, where 
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

export const setupMatchmakingCollections = async () => {
  try {
    console.log('🔨 Setting up matchmaking database structure...');
    
    // Check if notifications collection exists, if not create it
    const notificationsRef = collection(db, 'notifications');
    
    // Create a sample notification to initialize the collection
    await addDoc(notificationsRef, {
      userId: 'sample',
      type: 'system',
      title: 'System Ready',
      message: 'Matchmaking feature initialized',
      read: false,
      responded: false,
      createdAt: new Date(),
      // This will be deleted after setup
      isSetupDoc: true
    });
    
    // Update existing bookings to include new fields (if any exist)
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsRef);
    
    let updatedBookings = 0;
    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      
      // Only update if new fields don't exist
      if (!booking.hasOwnProperty('searchingForOpponent')) {
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          searchingForOpponent: booking.needOpponent || false,
          opponentFound: false,
          matchedWithUserId: null,
          matchedWithUserName: null
        });
        updatedBookings++;
      }
    }
    
    console.log(`✅ Updated ${updatedBookings} existing bookings with matchmaking fields`);
    
    return {
      success: true,
      message: `Matchmaking setup complete! Updated ${updatedBookings} bookings.`
    };
    
  } catch (error) {
    console.error('❌ Error setting up matchmaking:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const createSampleNotifications = async (currentUser) => {
  if (!currentUser) return;
  
  try {
    console.log('📬 Creating sample notifications for demo...');
    
    const sampleNotifications = [
      {
        userId: currentUser.uid,
        type: 'opponent_search',
        title: '🎾 Looking for Opponent!',
        message: 'John Doe is looking for a playing partner at Court 1 today at 2:00 PM',
        searchingUserId: 'demo-user-1',
        searchingUserName: 'John Doe',
        courtName: 'Court 1',
        date: new Date().toLocaleDateString(),
        timeSlot: '2:00 PM - 3:00 PM',
        read: false,
        responded: false,
        createdAt: new Date()
      },
      {
        userId: currentUser.uid,
        type: 'opponent_search',
        title: '🎾 Looking for Opponent!',
        message: 'Sarah Smith is looking for a playing partner at Court 3 tomorrow at 10:00 AM',
        searchingUserId: 'demo-user-2',
        searchingUserName: 'Sarah Smith',
        courtName: 'Court 3',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
        timeSlot: '10:00 AM - 11:00 AM',
        read: false,
        responded: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ];
    
    // Clean up any previous setup notifications
    const cleanupQuery = query(
      collection(db, 'notifications'),
      where('isSetupDoc', '==', true)
    );
    const cleanupSnapshot = await getDocs(cleanupQuery);
    
    for (const cleanupDoc of cleanupSnapshot.docs) {
      await updateDoc(doc(db, 'notifications', cleanupDoc.id), {
        isSetupDoc: false // Mark as cleaned up instead of deleting
      });
    }
    
    // Add sample notifications
    for (const notification of sampleNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }
    
    console.log('✅ Sample notifications created successfully');
    
  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  }
};

export const testMatchmakingFlow = async (currentUser) => {
  if (!currentUser) return { success: false, error: 'No user logged in' };
  
  try {
    // Create a test booking with opponent search
    const testBooking = {
      userId: currentUser.uid,
      courtId: 'test-court-1',
      courtName: 'Test Court 1',
      date: new Date().toLocaleDateString(),
      timeSlot: '3:00 PM - 4:00 PM',
      needOpponent: true,
      searchingForOpponent: true,
      opponentFound: false,
      matchedWithUserId: null,
      matchedWithUserName: null,
      status: 'pending',
      totalAmount: 50.00,
      createdAt: new Date()
    };
    
    const bookingRef = await addDoc(collection(db, 'bookings'), testBooking);
    
    // Simulate notifying other users (in real implementation, this would get all users)
    const testNotification = {
      userId: currentUser.uid, // In real app, this would be other users
      type: 'opponent_search',
      title: '🎾 Looking for Opponent!',
      message: `${currentUser.displayName || currentUser.email} is looking for a playing partner`,
      searchingUserId: currentUser.uid,
      searchingUserName: currentUser.displayName || currentUser.email,
      courtName: testBooking.courtName,
      date: testBooking.date,
      timeSlot: testBooking.timeSlot,
      read: false,
      responded: false,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'notifications'), testNotification);
    
    return {
      success: true,
      bookingId: bookingRef.id,
      message: 'Test booking created with opponent search!'
    };
    
  } catch (error) {
    console.error('❌ Error testing matchmaking flow:', error);
    return {
      success: false,
      error: error.message
    };
  }
};