// src/utils/systemLoggingUtils.js
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Enhanced System Logging Utilities
 * Extends the existing audit logging with additional system events
 */

// Log action types
export const LOG_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  PASSWORD_RESET_SENT: 'PASSWORD_RESET_SENT',
  
  // User Management (existing)
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  
  // Booking System
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_UPDATED: 'BOOKING_UPDATED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_APPROVED: 'BOOKING_APPROVED',
  BOOKING_REJECTED: 'BOOKING_REJECTED',
  
  // Feedback System
  FEEDBACK_SUBMITTED: 'FEEDBACK_SUBMITTED',
  FEEDBACK_RESPONDED: 'FEEDBACK_RESPONDED',
  FEEDBACK_STATUS_CHANGED: 'FEEDBACK_STATUS_CHANGED',
  
  // System Events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Admin Actions
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  DATA_EXPORT: 'DATA_EXPORT',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
};

/**
 * Log user authentication events
 * @param {string} action - LOGIN or LOGOUT
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {Object} metadata - Additional metadata (IP, device, etc.)
 */
export const logAuthEvent = async (action, userId, userEmail, metadata = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action: action,
      userId: userId,
      userEmail: userEmail,
      timestamp: serverTimestamp(),
      metadata: {
        ipAddress: metadata.ipAddress || null,
        deviceInfo: metadata.deviceInfo || null,
        userAgent: metadata.userAgent || null,
        location: metadata.location || null,
        sessionId: metadata.sessionId || null
      },
      category: 'authentication'
    });
    console.log(`✅ Logged auth event: ${action} for ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to log auth event: ${action}`, error);
  }
};

/**
 * Log booking-related events
 * @param {string} action - Booking action type
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User who performed the action
 * @param {string} courtId - Court ID
 * @param {Object} details - Additional booking details
 */
export const logBookingEvent = async (action, bookingId, userId, courtId, details = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action: action,
      bookingId: bookingId,
      userId: userId,
      courtId: courtId,
      timestamp: serverTimestamp(),
      details: {
        bookingDate: details.bookingDate || null,
        timeSlot: details.timeSlot || null,
        price: details.price || null,
        status: details.status || null,
        reason: details.reason || null,
        ...details
      },
      category: 'booking'
    });
    console.log(`✅ Logged booking event: ${action} for booking ${bookingId}`);
  } catch (error) {
    console.error(`❌ Failed to log booking event: ${action}`, error);
  }
};

/**
 * Log feedback system events
 * @param {string} action - Feedback action type
 * @param {string} feedbackId - Feedback ID
 * @param {string} userId - User ID
 * @param {Object} details - Feedback details
 */
export const logFeedbackEvent = async (action, feedbackId, userId, details = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action: action,
      feedbackId: feedbackId,
      userId: userId,
      timestamp: serverTimestamp(),
      details: {
        category: details.category || null,
        severity: details.severity || null,
        courtId: details.courtId || null,
        status: details.status || null,
        adminId: details.adminId || null,
        ...details
      },
      category: 'feedback'
    });
    console.log(`✅ Logged feedback event: ${action} for feedback ${feedbackId}`);
  } catch (error) {
    console.error(`❌ Failed to log feedback event: ${action}`, error);
  }
};

/**
 * Log system errors
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 * @param {string} userId - User ID (if applicable)
 * @param {Object} context - Additional context about the error
 */
export const logSystemError = async (errorType, error, userId = null, context = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action: LOG_ACTIONS.SYSTEM_ERROR,
      errorType: errorType,
      userId: userId,
      timestamp: serverTimestamp(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code || null,
        name: error.name
      },
      context: {
        component: context.component || null,
        function: context.function || null,
        url: context.url || null,
        userAgent: context.userAgent || null,
        ...context
      },
      category: 'error',
      severity: context.severity || 'medium'
    });
    console.log(`✅ Logged system error: ${errorType}`);
  } catch (logError) {
    console.error(`❌ Failed to log system error: ${errorType}`, logError);
  }
};

/**
 * Log admin actions
 * @param {string} action - Admin action type
 * @param {string} adminId - Admin performing the action
 * @param {Object} details - Action details
 */
export const logAdminAction = async (action, adminId, details = {}) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action: action,
      performedBy: adminId,
      timestamp: serverTimestamp(),
      details: details,
      category: 'admin',
      severity: details.severity || 'medium'
    });
    console.log(`✅ Logged admin action: ${action} by ${adminId}`);
  } catch (error) {
    console.error(`❌ Failed to log admin action: ${action}`, error);
  }
};

/**
 * Get system logs with advanced filtering
 * @param {Object} filters - Filtering options
 * @returns {Array} Array of log entries
 */
export const getSystemLogs = async (filters = {}) => {
  try {
    console.log('🔄 Fetching system logs with filters:', filters);

    let q = collection(db, 'auditLogs');
    const constraints = [];

    // Apply filters
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    
    if (filters.severity) {
      constraints.push(where('severity', '==', filters.severity));
    }
    
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', filters.startDate));
    }
    
    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', filters.endDate));
    }

    // Add ordering and limit
    constraints.push(orderBy('timestamp', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Retrieved ${logs.length} system log entries`);
    return logs;

  } catch (error) {
    console.error('❌ Error fetching system logs:', error);
    return [];
  }
};

/**
 * Get error logs specifically
 * @param {number} limit - Number of errors to fetch
 * @returns {Array} Array of error log entries
 */
export const getErrorLogs = async (limit = 50) => {
  return await getSystemLogs({
    category: 'error',
    limit: limit
  });
};

/**
 * Get authentication logs
 * @param {number} limit - Number of auth logs to fetch
 * @returns {Array} Array of authentication log entries
 */
export const getAuthLogs = async (limit = 100) => {
  return await getSystemLogs({
    category: 'authentication',
    limit: limit
  });
};

/**
 * Get logs for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to fetch
 * @returns {Array} Array of user-specific log entries
 */
export const getUserLogs = async (userId, limit = 50) => {
  return await getSystemLogs({
    userId: userId,
    limit: limit
  });
};

/**
 * Clean up old logs (for maintenance)
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {number} Number of deleted logs
 */
export const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    console.log(`🔄 Cleaning up logs older than ${daysToKeep} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const q = query(
      collection(db, 'auditLogs'),
      where('timestamp', '<', cutoffDate),
      limit(1000) // Process in batches
    );

    const snapshot = await getDocs(q);
    let deletedCount = 0;

    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, 'auditLogs', docSnapshot.id));
      deletedCount++;
    });

    await Promise.all(deletePromises);

    console.log(`✅ Cleaned up ${deletedCount} old log entries`);
    return deletedCount;

  } catch (error) {
    console.error('❌ Error cleaning up old logs:', error);
    return 0;
  }
};

/**
 * Get log statistics
 * @param {number} days - Number of days to analyze
 * @returns {Object} Log statistics
 */
export const getLogStatistics = async (days = 7) => {
  try {
    console.log(`🔄 Calculating log statistics for last ${days} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await getSystemLogs({
      startDate: cutoffDate,
      limit: 10000
    });

    const stats = {
      totalLogs: logs.length,
      byCategory: {},
      byAction: {},
      bySeverity: {},
      errorCount: 0,
      dailyBreakdown: {}
    };

    logs.forEach(log => {
      // Count by category
      const category = log.category || 'unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by severity
      const severity = log.severity || 'unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Count errors
      if (category === 'error') {
        stats.errorCount++;
      }

      // Daily breakdown
      const date = log.timestamp?.toDate?.()?.toDateString() || 'Unknown';
      stats.dailyBreakdown[date] = (stats.dailyBreakdown[date] || 0) + 1;
    });

    console.log('✅ Log statistics calculated');
    return stats;

  } catch (error) {
    console.error('❌ Error calculating log statistics:', error);
    return {
      totalLogs: 0,
      byCategory: {},
      byAction: {},
      bySeverity: {},
      errorCount: 0,
      dailyBreakdown: {}
    };
  }
};

/**
 * Export logs to CSV format
 * @param {Array} logs - Array of log entries
 * @returns {string} CSV formatted string
 */
export const exportLogsToCSV = (logs) => {
  try {
    const headers = [
      'Timestamp',
      'Action',
      'Category',
      'User ID',
      'User Email',
      'Severity',
      'Details'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => {
        const timestamp = log.timestamp?.toDate?.()?.toISOString() || 'N/A';
        const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
        
        return [
          `"${timestamp}"`,
          `"${log.action || 'N/A'}"`,
          `"${log.category || 'N/A'}"`,
          `"${log.userId || 'N/A'}"`,
          `"${log.userEmail || 'N/A'}"`,
          `"${log.severity || 'N/A'}"`,
          `"${details}"`
        ].join(',');
      })
    ];

    return csvRows.join('\n');

  } catch (error) {
    console.error('❌ Error exporting logs to CSV:', error);
    return '';
  }
};

// Export all functions
export default {
  LOG_ACTIONS,
  logAuthEvent,
  logBookingEvent,
  logFeedbackEvent,
  logSystemError,
  logAdminAction,
  getSystemLogs,
  getErrorLogs,
  getAuthLogs,
  getUserLogs,
  cleanupOldLogs,
  getLogStatistics,
  exportLogsToCSV
};