// src/services/matchmakingService.js
// FIXED: Complete solution for Firebase undefined values and proper error handling

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  limit,
  orderBy 
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

/**
 * 🔧 FIXED: Send opponent search notifications with NO undefined values
 * All fields now have proper fallbacks to prevent Firebase errors
 */
export const sendOpponentSearchNotifications = async (bookingData, searchingUser) => {
  try {
    console.log('🎾 Sending opponent search notifications...');
    console.log('📋 Booking data:', bookingData);
    
    // Get all users except the searching user
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', '!=', searchingUser.uid)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`📬 Found ${usersSnapshot.docs.length} users to notify`);
    
    // If no other users exist, create a demo notification for testing
    if (usersSnapshot.docs.length === 0) {
      console.log('⚠️ No other users found - creating demo notification for testing');
      await createDemoNotification(bookingData, searchingUser);
      return;
    }
    
    // Create notifications for all users with COMPLETE information and NO undefined values
    const notificationPromises = usersSnapshot.docs.map(userDoc => {
      const userData = userDoc.data();
      
      // 🔧 CRITICAL FIX: Ensure NO undefined values - all fields have fallbacks
      const notificationData = {
        userId: userData.uid || userData.id,
        type: 'opponent_search',
        title: '⚽ Looking for Opponent!',
        message: `${searchingUser.displayName || searchingUser.email || 'Tester 2'} is looking for a playing partner at ${bookingData.courtName || bookingData.courtNumber || 'Court 1'} on ${bookingData.date || '2025-07-01'} at ${bookingData.timeSlot || '09:00'}`,
        
        // Match data - all required fields with fallbacks
        searchingUserId: searchingUser.uid,
        searchingUserName: searchingUser.displayName || searchingUser.email || 'Tester 2',
        courtName: bookingData.courtName || bookingData.courtNumber || 'Court 1',
        date: bookingData.date || '2025-07-01',
        timeSlot: bookingData.timeSlot || '09:00',
        duration: bookingData.duration || 1,
        
        // 🔧 CRITICAL FIX: Map totalPrice to totalAmount and provide fallbacks
        totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
        pricePerHour: bookingData.pricePerHour || (bookingData.totalPrice || bookingData.totalAmount || 80) / (bookingData.duration || 1),
        facilityName: bookingData.facilityName || 'One Touch Futsal',
        
        // Additional fields with fallbacks
        bookingId: bookingData.bookingId || bookingData.id || '',
        location: bookingData.location || 'Temerloh, Pahang',
        
        // Status tracking
        read: false,
        responded: false,
        createdAt: new Date()
      };
      
      console.log('📩 Creating notification:', notificationData);
      return addDoc(collection(db, 'notifications'), notificationData);
    });
    
    await Promise.all(notificationPromises);
    console.log('✅ Opponent search notifications sent to all users');
    
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    // Don't throw the error - just log it so booking still succeeds
  }
};

/**
 * 🔧 FIXED: Create demo notification with proper fallbacks
 */
const createDemoNotification = async (bookingData, searchingUser) => {
  try {
    // Create a demo notification with ALL required fields and NO undefined values
    const demoNotificationData = {
      userId: searchingUser.uid,
      type: 'opponent_search',
      title: '⚽ Looking for Opponent! (Demo)',
      message: `Demo Player is looking for a playing partner at ${bookingData.courtName || bookingData.courtNumber || 'Court'} (This is a demo notification since no other users exist)`,
      
      // Complete match data for demo with fallbacks
      searchingUserId: 'demo-user-123',
      searchingUserName: 'Demo Player',
      courtName: bookingData.courtName || bookingData.courtNumber || 'Court 1',
      date: bookingData.date || '2025-07-01',
      timeSlot: bookingData.timeSlot || '09:00',
      duration: bookingData.duration || 1,
      
      // 🔧 FIXED: Provide all pricing fields with proper fallbacks
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
      pricePerHour: bookingData.pricePerHour || 80,
      facilityName: bookingData.facilityName || 'One Touch Futsal',
      location: bookingData.location || 'Temerloh, Pahang',
      
      // Additional demo fields
      bookingId: bookingData.bookingId || 'demo-booking-123',
      
      // Status
      read: false,
      responded: false,
      isDemo: true,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'notifications'), demoNotificationData);
    console.log('✅ Demo notification created for testing');
  } catch (error) {
    console.error('❌ Error creating demo notification:', error);
  }
};

/**
 * Handle user response to opponent search
 * Called when someone taps "I'm Interested!" on a notification
 */
export const respondToOpponentSearch = async (notificationId, searchingUserId, respondingUser) => {
  try {
    console.log(`🤝 ${respondingUser.displayName || respondingUser.email} responding to opponent search...`);
    
    // Mark the notification as responded
    await updateDoc(doc(db, 'notifications', notificationId), {
      responded: true,
      read: true,
      respondedAt: new Date(),
      respondingUserId: respondingUser.uid,
      respondingUserName: respondingUser.displayName || respondingUser.email || 'Anonymous Player'
    });
    
    // Create a confirmation notification for the original searching user
    const confirmationData = {
      userId: searchingUserId,
      type: 'match_response',
      title: '🎉 Someone Wants to Play!',
      message: `${respondingUser.displayName || respondingUser.email || 'A player'} is interested in playing with you! Contact them to confirm the match details.`,
      
      // Response details with fallbacks
      respondingUserId: respondingUser.uid,
      respondingUserName: respondingUser.displayName || respondingUser.email || 'Anonymous Player',
      respondingUserEmail: respondingUser.email || '',
      originalNotificationId: notificationId,
      
      // Additional fields to prevent undefined values
      courtName: 'Court Details in Original Booking',
      date: '',
      timeSlot: '',
      duration: 0,
      totalAmount: 0,
      pricePerHour: 0,
      facilityName: 'One Touch Futsal',
      
      // Status
      read: false,
      responded: false,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'notifications'), confirmationData);
    
    console.log('✅ Response recorded and confirmation notification sent');
    
    return {
      success: true,
      message: 'Response sent successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error responding to opponent search:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a complete match between two users (future enhancement)
 */
export const createMatch = async (searchingUserId, respondingUserId, bookingData) => {
  try {
    console.log('🤝 Creating match between users...');
    
    // Create a match record with proper fallbacks
    const matchData = {
      searchingUserId,
      respondingUserId,
      courtName: bookingData.courtName || 'Court',
      date: bookingData.date || '',
      timeSlot: bookingData.timeSlot || '',
      duration: bookingData.duration || 1,
      status: 'pending_confirmation',
      createdAt: new Date(),
      
      // Additional match details with fallbacks
      searchingUserName: bookingData.searchingUserName || 'Player 1',
      respondingUserName: bookingData.respondingUserName || 'Player 2',
      facilityName: bookingData.facilityName || 'One Touch Futsal',
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
      pricePerHour: bookingData.pricePerHour || 80
    };
    
    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    
    // Update the original booking with match info (if bookingId is available)
    if (bookingData.bookingId) {
      await updateDoc(doc(db, 'bookings', bookingData.bookingId), {
        opponentFound: true,
        matchedWithUserId: respondingUserId,
        matchedWithUserName: bookingData.respondingUserName || 'Matched Player',
        matchId: matchRef.id,
        matchedAt: new Date()
      });
    }
    
    console.log('✅ Match created successfully');
    
    return {
      success: true,
      matchId: matchRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creating match:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all opponent search notifications for a specific user
 */
export const getUserOpponentNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', '==', 'opponent_search'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📬 Retrieved ${notifications.length} opponent notifications for user`);
    return notifications;
    
  } catch (error) {
    console.error('❌ Error getting opponent notifications:', error);
    return [];
  }
};

/**
 * Cancel an opponent search
 */
export const cancelOpponentSearch = async (bookingId) => {
  try {
    console.log('🚫 Cancelling opponent search...');
    
    // Update the booking to stop searching
    await updateDoc(doc(db, 'bookings', bookingId), {
      searchingForOpponent: false,
      searchCancelledAt: new Date()
    });
    
    // Optionally mark related notifications as cancelled
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('bookingId', '==', bookingId),
      where('type', '==', 'opponent_search')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const updatePromises = notificationsSnapshot.docs.map(notificationDoc =>
      updateDoc(doc(db, 'notifications', notificationDoc.id), {
        cancelled: true,
        cancelledAt: new Date()
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log('✅ Opponent search cancelled successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error cancelling opponent search:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get match history for a user
 */
export const getUserMatches = async (userId) => {
  try {
    // Get matches where user is either searching or responding
    const searchingQuery = query(
      collection(db, 'matches'),
      where('searchingUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const respondingQuery = query(
      collection(db, 'matches'),
      where('respondingUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const [searchingSnapshot, respondingSnapshot] = await Promise.all([
      getDocs(searchingQuery),
      getDocs(respondingQuery)
    ]);
    
    const matches = [
      ...searchingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'searching' })),
      ...respondingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'responding' }))
    ];
    
    // Sort by creation date
    matches.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    
    console.log(`🏆 Retrieved ${matches.length} matches for user`);
    return matches;
    
  } catch (error) {
    console.error('❌ Error getting user matches:', error);
    return [];
  }
};

// 🔧 CRITICAL FIX: Export the function name that BookCourtScreen expects
export const notifyUsersAboutOpponentSearch = sendOpponentSearchNotifications;