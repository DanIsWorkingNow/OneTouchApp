// src/services/matchmakingService.js
// Complete matchmaking service for One Touch App

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

/**
 * Notify all users (except the searching user) about opponent search
 * This is called when someone books a court with "Find Opponent = Yes"
 */
export const notifyUsersAboutOpponentSearch = async (bookingData, searchingUser) => {
  try {
    console.log('🎾 Notifying users about opponent search...');
    console.log('Booking data:', bookingData);
    console.log('Searching user:', searchingUser.email);
    
    // Get all users except the searching user
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', '!=', searchingUser.uid)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('ℹ️ No other users found to notify');
      // For demo purposes, create a notification for the same user
      await createDemoNotification(bookingData, searchingUser);
      return;
    }
    
    // Create notifications for all users
    const notificationPromises = usersSnapshot.docs.map(userDoc => {
      const userData = userDoc.data();
      return addDoc(collection(db, 'notifications'), {
        userId: userData.uid,
        type: 'opponent_search',
        title: ' Looking for Opponent!',
        message: `${searchingUser.displayName || searchingUser.email} is looking for a playing partner at ${bookingData.courtName}`,
        
        // Match data
        searchingUserId: searchingUser.uid,
        searchingUserName: searchingUser.displayName || searchingUser.email,
        courtName: bookingData.courtName,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        
        // Additional booking info
        bookingId: bookingData.bookingId || null,
        
        // Status
        read: false,
        responded: false,
        createdAt: new Date()
      });
    });
    
    await Promise.all(notificationPromises);
    
    console.log(`✅ Opponent search notifications sent to ${usersSnapshot.docs.length} users`);
    
  } catch (error) {
    console.error('❌ Error sending opponent search notifications:', error);
    throw error; // Re-throw to handle in calling function
  }
};

/**
 * Create a demo notification for testing purposes (when no other users exist)
 */
const createDemoNotification = async (bookingData, searchingUser) => {
  try {
    // Create a notification for the same user (for demo/testing)
    await addDoc(collection(db, 'notifications'), {
      userId: searchingUser.uid,
      type: 'opponent_search',
      title: '🎾 Demo: Someone Looking for Opponent!',
      message: `Demo Player is looking for a playing partner at ${bookingData.courtName} (This is a demo notification since no other users exist)`,
      
      // Match data
      searchingUserId: 'demo-user-123',
      searchingUserName: 'Demo Player',
      courtName: bookingData.courtName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      
      // Status
      read: false,
      responded: false,
      isDemo: true,
      createdAt: new Date()
    });
    
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
      respondingUserName: respondingUser.displayName || respondingUser.email
    });
    
    // Create a confirmation notification for the original searching user
    await addDoc(collection(db, 'notifications'), {
      userId: searchingUserId,
      type: 'match_response',
      title: '🎉 Someone Wants to Play!',
      message: `${respondingUser.displayName || respondingUser.email} is interested in playing with you! Contact them to confirm the match details.`,
      
      // Response details
      respondingUserId: respondingUser.uid,
      respondingUserName: respondingUser.displayName || respondingUser.email,
      respondingUserEmail: respondingUser.email,
      originalNotificationId: notificationId,
      
      // Status
      read: false,
      responded: false,
      createdAt: new Date()
    });
    
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
    
    // Create a match record
    const matchData = {
      searchingUserId,
      respondingUserId,
      courtName: bookingData.courtName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      status: 'pending_confirmation',
      createdAt: new Date(),
      
      // Additional match details
      searchingUserName: bookingData.searchingUserName,
      respondingUserName: bookingData.respondingUserName,
    };
    
    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    
    // Update the original booking with match info (if bookingId is available)
    if (bookingData.bookingId) {
      await updateDoc(doc(db, 'bookings', bookingData.bookingId), {
        opponentFound: true,
        matchedWithUserId: respondingUserId,
        matchedWithUserName: bookingData.respondingUserName,
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
 * Delete old notifications (cleanup utility)
 */
export const cleanupOldNotifications = async (userId, daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldNotificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('createdAt', '<', cutoffDate)
    );
    
    const snapshot = await getDocs(oldNotificationsQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    
    console.log(`🧹 Cleaned up ${snapshot.docs.length} old notifications`);
    return { success: true, deletedCount: snapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get match statistics for a user
 */
export const getUserMatchStats = async (userId) => {
  try {
    // Get matches where user was searching for opponent
    const searchingQuery = query(
      collection(db, 'matches'),
      where('searchingUserId', '==', userId)
    );
    
    // Get matches where user responded to search
    const respondingQuery = query(
      collection(db, 'matches'),
      where('respondingUserId', '==', userId)
    );
    
    const [searchingSnapshot, respondingSnapshot] = await Promise.all([
      getDocs(searchingQuery),
      getDocs(respondingQuery)
    ]);
    
    const stats = {
      totalMatches: searchingSnapshot.docs.length + respondingSnapshot.docs.length,
      matchesInitiated: searchingSnapshot.docs.length,
      matchesResponded: respondingSnapshot.docs.length,
      recentMatches: []
    };
    
    // Combine and sort recent matches
    const allMatches = [
      ...searchingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'searcher' })),
      ...respondingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'responder' }))
    ];
    
    stats.recentMatches = allMatches
      .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
      .slice(0, 5);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting match stats:', error);
    return {
      totalMatches: 0,
      matchesInitiated: 0,
      matchesResponded: 0,
      recentMatches: []
    };
  }
};

/**
 * Check if user has any active opponent searches
 */
export const hasActiveOpponentSearch = async (userId) => {
  try {
    const activeSearchQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      where('searchingForOpponent', '==', true),
      where('opponentFound', '==', false)
    );
    
    const snapshot = await getDocs(activeSearchQuery);
    return snapshot.docs.length > 0;
    
  } catch (error) {
    console.error('❌ Error checking active searches:', error);
    return false;
  }
};

// Export all functions
export default {
  notifyUsersAboutOpponentSearch,
  respondToOpponentSearch,
  createMatch,
  getUserOpponentNotifications,
  cancelOpponentSearch,
  cleanupOldNotifications,
  getUserMatchStats,
  hasActiveOpponentSearch
};