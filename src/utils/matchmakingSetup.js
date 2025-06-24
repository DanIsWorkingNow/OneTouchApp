// src/utils/matchmakingSetup.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

export const setupMatchmakingCollections = async () => {
  try {
    console.log('🔨 Setting up matchmaking database structure...');
    
    // Update existing bookings to include matchmaking fields
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
          matchedWithUserName: null,
          matchedAt: null
        });
        updatedBookings++;
      }
    }
    
    console.log(`✅ Updated ${updatedBookings} existing bookings with matchmaking fields`);
    
    return {
      success: true,
      message: `Matchmaking setup complete!\n\nUpdated ${updatedBookings} bookings with matchmaking fields.`
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
  if (!currentUser) {
    console.log('⚠️ No user provided for sample notifications');
    return;
  }
  
  try {
    console.log('📬 Creating sample notifications for demo...');
    
    // Clean up existing demo notifications first
    const existingDemoQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('isDemo', '==', true)
    );
    
    const existingDemoSnapshot = await getDocs(existingDemoQuery);
    
    // Delete existing demo notifications
    for (const demoDoc of existingDemoSnapshot.docs) {
      await deleteDoc(doc(db, 'notifications', demoDoc.id));
    }
    
    const sampleNotifications = [
      {
        userId: currentUser.uid,
        type: 'opponent_search',
        title: '🎾 Looking for Opponent!',
        message: 'Alex Chen is looking for a playing partner at Court A today at 2:00 PM',
        searchingUserId: 'demo-user-alex',
        searchingUserName: 'Alex Chen',
        courtName: 'Court A',
        date: new Date().toLocaleDateString('en-MY'),
        timeSlot: '2:00 PM - 3:00 PM',
        read: false,
        responded: false,
        isDemo: true,
        createdAt: new Date()
      },
      {
        userId: currentUser.uid,
        type: 'opponent_search', 
        title: '🎾 Looking for Opponent!',
        message: 'Maria Santos is looking for a playing partner at Court B tomorrow at 10:00 AM',
        searchingUserId: 'demo-user-maria',
        searchingUserName: 'Maria Santos',
        courtName: 'Court B',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-MY'),
        timeSlot: '10:00 AM - 11:00 AM',
        read: false,
        responded: false,
        isDemo: true,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      }
    ];
    
    // Add sample notifications
    for (const notification of sampleNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }
    
    console.log(`✅ Created ${sampleNotifications.length} sample notifications for demo`);
    
  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  }
};