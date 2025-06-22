// src/utils/bookingUtils.js
import { 
  collection, addDoc, updateDoc, doc, getDocs, 
  query, where, orderBy, getDoc 
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Create sample pending bookings for testing
export const createSamplePendingBookings = async () => {
  try {
    console.log('🔄 Creating sample pending bookings...');

    // Get existing courts
    const courtsSnapshot = await getDocs(collection(db, 'courts'));
    if (courtsSnapshot.empty) {
      return { success: false, message: 'No courts found. Setup courts first.' };
    }

    // Get existing users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (usersSnapshot.empty) {
      return { success: false, message: 'No users found. Setup users first.' };
    }

    const courts = courtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter for regular users (not admins)
    const regularUsers = users.filter(user => user.role === 'user');

    if (regularUsers.length === 0) {
      return { success: false, message: 'No regular users found for creating bookings.' };
    }

    // Create sample pending bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleBookings = [
      {
        userId: regularUsers[0].id,
        userEmail: regularUsers[0].email,
        courtId: courts[0].id,
        courtNumber: courts[0].courtNumber,
        facilityName: courts[0].facilityName || "One Touch Futsal",
        location: courts[0].location || "Temerloh, Pahang",
        date: tomorrow.toISOString().split('T')[0],
        timeSlot: "14:00",
        duration: 2,
        needOpponent: true,
        pricePerHour: courts[0].pricePerHour,
        totalAmount: courts[0].pricePerHour * 2,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: regularUsers[0].id,
        userEmail: regularUsers[0].email,
        courtId: courts[1]?.id || courts[0].id,
        courtNumber: courts[1]?.courtNumber || courts[0].courtNumber,
        facilityName: courts[1]?.facilityName || "One Touch Futsal",
        location: courts[1]?.location || "Temerloh, Pahang",
        date: dayAfter.toISOString().split('T')[0],
        timeSlot: "18:00",
        duration: 1,
        needOpponent: false,
        pricePerHour: courts[1]?.pricePerHour || courts[0].pricePerHour,
        totalAmount: courts[1]?.pricePerHour || courts[0].pricePerHour,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: regularUsers[Math.min(1, regularUsers.length - 1)]?.id || regularUsers[0].id,
        userEmail: regularUsers[Math.min(1, regularUsers.length - 1)]?.email || regularUsers[0].email,
        courtId: courts[2]?.id || courts[0].id,
        courtNumber: courts[2]?.courtNumber || courts[0].courtNumber,
        facilityName: courts[2]?.facilityName || "One Touch Futsal",
        location: courts[2]?.location || "Temerloh, Pahang",
        date: nextWeek.toISOString().split('T')[0],
        timeSlot: "20:00",
        duration: 1,
        needOpponent: true,
        pricePerHour: courts[2]?.pricePerHour || courts[0].pricePerHour,
        totalAmount: courts[2]?.pricePerHour || courts[0].pricePerHour,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add bookings to Firestore
    let createdCount = 0;
    for (const booking of sampleBookings) {
      try {
        await addDoc(collection(db, 'bookings'), booking);
        createdCount++;
        console.log(`✅ Created pending booking: ${booking.courtNumber} on ${booking.date}`);
      } catch (error) {
        console.error('❌ Error creating booking:', error);
      }
    }

    return {
      success: true,
      message: `Created ${createdCount} sample pending bookings for testing`,
      count: createdCount
    };

  } catch (error) {
    console.error('❌ Error creating sample bookings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get bookings for approval (Court Admin function)
export const getBookingsForApproval = async (status = 'all') => {
  try {
    let q;

    if (status === 'all') {
      q = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'bookings'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const bookings = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const bookingData = docSnapshot.data();
        
        // Get user details for each booking
        let userData = {};
        if (bookingData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user data:', error);
          }
        }

        return {
          id: docSnapshot.id,
          ...bookingData,
          userName: userData.username || userData.email?.split('@')[0] || 'Unknown User',
          userPhone: userData.phoneNumber || 'N/A'
        };
      })
    );

    return {
      success: true,
      bookings: bookings
    };

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      error: error.message,
      bookings: []
    };
  }
};

// Approve a booking
export const approveBooking = async (bookingId, adminId) => {
  try {
    const updateData = {
      status: 'approved',
      approvedBy: adminId,
      approvedDate: new Date(),
      updatedAt: new Date()
    };

    await updateDoc(doc(db, 'bookings', bookingId), updateData);

    return {
      success: true,
      message: 'Booking approved successfully'
    };

  } catch (error) {
    console.error('Error approving booking:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Reject a booking
export const rejectBooking = async (bookingId, adminId, rejectionReason = '') => {
  try {
    const updateData = {
      status: 'rejected',
      rejectedBy: adminId,
      rejectedDate: new Date(),
      rejectionReason: rejectionReason,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, 'bookings', bookingId), updateData);

    return {
      success: true,
      message: 'Booking rejected successfully'
    };

  } catch (error) {
    console.error('Error rejecting booking:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send notification to user about booking status
export const sendBookingNotification = async (booking, status, reason = '') => {
  try {
    const notificationData = {
      userId: booking.userId,
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'approved' 
        ? `Your booking for ${booking.courtNumber} on ${formatBookingDate(booking.date)} has been approved!`
        : `Your booking for ${booking.courtNumber} on ${formatBookingDate(booking.date)} has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'booking_update',
      data: {
        bookingId: booking.id,
        status: status
      },
      createdAt: new Date(),
      read: false
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    
    return {
      success: true,
      message: 'Notification sent successfully'
    };

  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create activity log for booking actions
export const createBookingActivityLog = async (booking, action, adminId, adminEmail, reason = '') => {
  try {
    const logData = {
      type: 'booking_approval',
      action: action,
      bookingId: booking.id,
      adminId: adminId,
      adminEmail: adminEmail,
      userId: booking.userId,
      courtNumber: booking.courtNumber,
      bookingDate: booking.date,
      reason: reason,
      timestamp: new Date()
    };

    await addDoc(collection(db, 'activityLogs'), logData);
    
    return {
      success: true,
      message: 'Activity log created'
    };

  } catch (error) {
    console.error('Error creating activity log:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to format booking date
export const formatBookingDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get booking statistics for admin dashboard
export const getBookingStatistics = async () => {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    return {
      success: true,
      statistics: stats
    };

  } catch (error) {
    console.error('Error getting booking statistics:', error);
    return {
      success: false,
      error: error.message,
      statistics: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        cancelled: 0
      }
    };
  }
};