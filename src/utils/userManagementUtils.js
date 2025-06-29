// src/utils/userManagementUtils.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { db, auth } from '../constants/firebaseConfig';

// Role definitions with permissions
export const ROLE_DEFINITIONS = {
  systemAdmin: {
    name: "System Administrator",
    description: "Full system access and user management",
    permissions: {
      canManageUsers: true,
      canManageCourts: true,
      canApproveBookings: true,
      canViewAllBookings: true,
      canAccessReports: true,
      canDeactivateAccounts: true,
      canViewPasswords: true,
      canCreateAdmins: true,
      canDeleteUsers: true,
      canViewSystemLogs: true
    },
    level: 1
  },
  courtAdmin: {
    name: "Court Administrator", 
    description: "Court and booking management",
    permissions: {
      canManageUsers: false,
      canManageCourts: true,
      canApproveBookings: true,
      canViewAllBookings: true,
      canAccessReports: true,
      canDeactivateAccounts: false,
      canViewPasswords: false,
      canCreateCourts: true,
      canUpdateCourtStatus: true,
      canViewBookingReports: true
    },
    level: 2
  },
  user: {
    name: "Regular User",
    description: "Standard user with booking capabilities", 
    permissions: {
      canManageUsers: false,
      canManageCourts: false,
      canApproveBookings: false,
      canViewAllBookings: false,
      canAccessReports: false,
      canDeactivateAccounts: false,
      canViewPasswords: false,
      canCreateBookings: true,
      canUpdateProfile: true,
      canViewOwnBookings: true
    },
    level: 3
  }
};

/**
 * Create a new user with role and permissions
 * @param {Object} userData - User data including email, username, role, etc.
 * @param {string} createdById - ID of the admin creating this user
 * @returns {Object} Result object with success status and message
 */
export const createNewUser = async (userData, createdById) => {
  try {
    console.log('🔄 Creating new user:', userData.email);

    // Validate required fields
    if (!userData.email || !userData.password || !userData.username || !userData.role) {
      throw new Error('Missing required fields: email, password, username, and role are required');
    }

    // Validate role
    if (!ROLE_DEFINITIONS[userData.role]) {
      throw new Error('Invalid role specified');
    }

    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const uid = userCredential.user.uid;

    // Create user document in Firestore
    const userDoc = {
      uid: uid,
      email: userData.email,
      username: userData.username,
      phoneNumber: userData.phoneNumber || '',
      role: userData.role,
      permissions: ROLE_DEFINITIONS[userData.role].permissions,
      status: 'active',
      isFirstLogin: true,
      createdAt: serverTimestamp(),
      createdBy: createdById,
      metadata: {
        createdByAdmin: true,
        lastPasswordChange: serverTimestamp(),
        ipAddress: null,
        deviceInfo: null
      }
    };

    await addDoc(collection(db, 'users'), userDoc);

    // Log the action for audit trail
    await addDoc(collection(db, 'auditLogs'), {
      action: 'USER_CREATED',
      targetUserId: uid,
      targetUserEmail: userData.email,
      targetUserRole: userData.role,
      performedBy: createdById,
      timestamp: serverTimestamp()
    });

    console.log('✅ User created successfully:', userData.email);
    return { 
      success: true, 
      message: `User ${userData.username} created successfully!`,
      userId: uid
    };

  } catch (error) {
    console.error('❌ Error creating user:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Update user role and permissions
 * @param {string} userId - Firestore document ID of the user
 * @param {string} newRole - New role to assign
 * @param {string} updatedById - ID of the admin making the change
 * @returns {Object} Result object with success status and message
 */
export const updateUserRole = async (userId, newRole, updatedById) => {
  try {
    console.log(`🔄 Updating user ${userId} to role: ${newRole}`);

    // Validate role
    if (!ROLE_DEFINITIONS[newRole]) {
      throw new Error('Invalid role specified');
    }

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const oldRole = userDoc.data().role;

    // Update user role and permissions
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      permissions: ROLE_DEFINITIONS[newRole].permissions,
      lastModifiedAt: serverTimestamp(),
      lastModifiedBy: updatedById
    });

    // Log the action for audit trail
    await addDoc(collection(db, 'auditLogs'), {
      action: 'ROLE_UPDATED',
      targetUserId: userId,
      oldRole: oldRole,
      newRole: newRole,
      performedBy: updatedById,
      timestamp: serverTimestamp()
    });

    console.log('✅ User role updated successfully');
    return { 
      success: true, 
      message: `User role updated to ${newRole}` 
    };

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Suspend or activate a user account
 * @param {string} userId - Firestore document ID of the user
 * @param {string} status - New status ('active', 'suspended', 'deactivated')
 * @param {string} updatedById - ID of the admin making the change
 * @param {string} reason - Reason for status change
 * @returns {Object} Result object with success status and message
 */
export const updateUserStatus = async (userId, status, updatedById, reason = '') => {
  try {
    console.log(`🔄 Updating user ${userId} status to: ${status}`);

    // Validate status
    const validStatuses = ['active', 'suspended', 'deactivated'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status specified');
    }

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const oldStatus = userDoc.data().status;

    // Update user status
    await updateDoc(doc(db, 'users', userId), {
      status: status,
      lastModifiedAt: serverTimestamp(),
      lastModifiedBy: updatedById,
      statusChangeReason: reason,
      statusChangedAt: serverTimestamp()
    });

    // Log the action for audit trail
    await addDoc(collection(db, 'auditLogs'), {
      action: 'STATUS_UPDATED',
      targetUserId: userId,
      oldStatus: oldStatus,
      newStatus: status,
      reason: reason,
      performedBy: updatedById,
      timestamp: serverTimestamp()
    });

    console.log('✅ User status updated successfully');
    return { 
      success: true, 
      message: `User status updated to ${status}` 
    };

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Delete a user account (dangerous operation)
 * @param {string} userId - Firestore document ID of the user
 * @param {string} deletedById - ID of the admin performing the deletion
 * @returns {Object} Result object with success status and message
 */
export const deleteUserAccount = async (userId, deletedById) => {
  try {
    console.log(`🔄 Deleting user: ${userId}`);

    // Get user document first
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Log the deletion for audit trail
    await addDoc(collection(db, 'auditLogs'), {
      action: 'USER_DELETED',
      targetUserId: userId,
      targetUserEmail: userData.email,
      targetUserRole: userData.role,
      performedBy: deletedById,
      timestamp: serverTimestamp(),
      details: {
        deletedUserData: userData
      }
    });

    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', userId));

    // Note: In a production app, you'd also want to delete the Firebase Auth user
    // This requires Firebase Admin SDK or Cloud Functions

    console.log('✅ User deleted successfully');
    return { 
      success: true, 
      message: 'User deleted successfully' 
    };

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} requestedById - ID of the admin requesting the reset
 * @returns {Object} Result object with success status and message
 */
export const sendPasswordReset = async (email, requestedById) => {
  try {
    console.log(`🔄 Sending password reset to: ${email}`);

    // Send password reset email
    await sendPasswordResetEmail(auth, email);

    // Log the action for audit trail
    await addDoc(collection(db, 'auditLogs'), {
      action: 'PASSWORD_RESET_SENT',
      targetUserEmail: email,
      performedBy: requestedById,
      timestamp: serverTimestamp()
    });

    console.log('✅ Password reset email sent successfully');
    return { 
      success: true, 
      message: 'Password reset email sent successfully' 
    };

  } catch (error) {
    console.error('❌ Error sending password reset:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get all users with optional filtering
 * @param {Object} filters - Filter options (role, status, etc.)
 * @returns {Array} Array of user objects
 */
export const getAllUsers = async (filters = {}) => {
  try {
    console.log('🔄 Fetching all users with filters:', filters);

    let q = collection(db, 'users');

    // Apply filters
    if (filters.role) {
      q = query(q, where('role', '==', filters.role));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Retrieved ${users.length} users`);
    return users;

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

/**
 * Batch update multiple users (for migrations or bulk operations)
 * @param {Array} userUpdates - Array of user update objects
 * @param {string} updatedById - ID of the admin performing updates
 * @returns {Object} Result object with success status and details
 */
export const batchUpdateUsers = async (userUpdates, updatedById) => {
  try {
    console.log(`🔄 Batch updating ${userUpdates.length} users`);

    const batch = writeBatch(db);
    const results = [];

    for (const update of userUpdates) {
      try {
        const userRef = doc(db, 'users', update.userId);
        
        // Prepare update data
        const updateData = {
          ...update.data,
          lastModifiedAt: serverTimestamp(),
          lastModifiedBy: updatedById
        };

        // If role is being updated, update permissions too
        if (update.data.role && ROLE_DEFINITIONS[update.data.role]) {
          updateData.permissions = ROLE_DEFINITIONS[update.data.role].permissions;
        }

        batch.update(userRef, updateData);
        results.push({ userId: update.userId, success: true });

      } catch (error) {
        results.push({ 
          userId: update.userId, 
          success: false, 
          error: error.message 
        });
      }
    }

    await batch.commit();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log the batch operation
    await addDoc(collection(db, 'auditLogs'), {
      action: 'BATCH_UPDATE_USERS',
      totalUsers: userUpdates.length,
      successful: successful,
      failed: failed,
      performedBy: updatedById,
      timestamp: serverTimestamp()
    });

    console.log(`✅ Batch update completed: ${successful} successful, ${failed} failed`);
    return {
      success: failed === 0,
      message: `Updated ${successful} users successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      results
    };

  } catch (error) {
    console.error('❌ Error in batch update:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Get user statistics for dashboard
 * @returns {Object} Statistics object
 */
export const getUserStatistics = async () => {
  try {
    console.log('🔄 Calculating user statistics');

    const users = await getAllUsers();
    
    const stats = {
      total: users.length,
      byRole: {
        systemAdmin: users.filter(u => u.role === 'systemAdmin').length,
        courtAdmin: users.filter(u => u.role === 'courtAdmin').length,
        user: users.filter(u => u.role === 'user').length
      },
      byStatus: {
        active: users.filter(u => u.status === 'active').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        deactivated: users.filter(u => u.status === 'deactivated').length
      },
      newUsersToday: users.filter(u => {
        if (!u.createdAt) return false;
        const today = new Date();
        const userDate = u.createdAt.toDate();
        return userDate.toDateString() === today.toDateString();
      }).length,
      firstTimeLogins: users.filter(u => u.isFirstLogin).length
    };

    console.log('✅ User statistics calculated:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Error calculating user statistics:', error);
    return {
      total: 0,
      byRole: { systemAdmin: 0, courtAdmin: 0, user: 0 },
      byStatus: { active: 0, suspended: 0, deactivated: 0 },
      newUsersToday: 0,
      firstTimeLogins: 0
    };
  }
};

/**
 * Search users by various criteria
 * @param {string} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in ['username', 'email', 'phoneNumber']
 * @returns {Array} Array of matching users
 */
export const searchUsers = async (searchTerm, searchFields = ['username', 'email']) => {
  try {
    console.log(`🔄 Searching users for: ${searchTerm}`);

    if (!searchTerm || searchTerm.trim() === '') {
      return await getAllUsers();
    }

    const allUsers = await getAllUsers();
    const searchTermLower = searchTerm.toLowerCase();

    const matchingUsers = allUsers.filter(user => {
      return searchFields.some(field => {
        const fieldValue = user[field];
        return fieldValue && fieldValue.toLowerCase().includes(searchTermLower);
      });
    });

    console.log(`✅ Found ${matchingUsers.length} matching users`);
    return matchingUsers;

  } catch (error) {
    console.error('❌ Error searching users:', error);
    return [];
  }
};

/**
 * Get audit logs for user management actions
 * @param {Object} filters - Filter options (userId, action, dateRange)
 * @returns {Array} Array of audit log entries
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    console.log('🔄 Fetching audit logs with filters:', filters);

    let q = collection(db, 'auditLogs');

    // Apply filters
    if (filters.targetUserId) {
      q = query(q, where('targetUserId', '==', filters.targetUserId));
    }
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }

    // Order by timestamp (newest first)
    q = query(q, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Retrieved ${logs.length} audit log entries`);
    return logs;

  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Validate user permissions
 * @param {string} userId - User ID to check
 * @param {string} permission - Permission to validate
 * @returns {boolean} Whether user has the permission
 */
export const validateUserPermission = async (userId, permission) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    return userData.permissions && userData.permissions[permission] === true;
  } catch (error) {
    console.error('❌ Error validating user permission:', error);
    return false;
  }
};

/**
 * Get user by ID
 * @param {string} userId - Firestore document ID
 * @returns {Object} User data or null
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return null;
  }
};

/**
 * Update user profile information
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {string} updatedById - ID of the user making the change
 * @returns {Object} Result object
 */
export const updateUserProfile = async (userId, profileData, updatedById) => {
  try {
    console.log(`🔄 Updating user profile: ${userId}`);

    // Get current user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Update user profile
    await updateDoc(doc(db, 'users', userId), {
      ...profileData,
      lastModifiedAt: serverTimestamp(),
      lastModifiedBy: updatedById
    });

    // Log the action
    await addDoc(collection(db, 'auditLogs'), {
      action: 'PROFILE_UPDATED',
      targetUserId: userId,
      updatedFields: Object.keys(profileData),
      performedBy: updatedById,
      timestamp: serverTimestamp()
    });

    console.log('✅ User profile updated successfully');
    return {
      success: true,
      message: 'Profile updated successfully'
    };

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get system admin activity summary
 * @param {string} adminId - System admin ID
 * @param {number} days - Number of days to look back
 * @returns {Object} Activity summary
 */
export const getAdminActivitySummary = async (adminId, days = 30) => {
  try {
    console.log(`🔄 Getting admin activity summary for ${adminId}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, 'auditLogs'),
      where('performedBy', '==', adminId),
      where('timestamp', '>=', cutoffDate),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => doc.data());

    const summary = {
      totalActions: logs.length,
      usersCreated: logs.filter(log => log.action === 'USER_CREATED').length,
      rolesUpdated: logs.filter(log => log.action === 'ROLE_UPDATED').length,
      statusUpdated: logs.filter(log => log.action === 'STATUS_UPDATED').length,
      usersDeleted: logs.filter(log => log.action === 'USER_DELETED').length,
      passwordResets: logs.filter(log => log.action === 'PASSWORD_RESET_SENT').length,
      recentActions: logs.slice(0, 10)
    };

    console.log('✅ Admin activity summary calculated');
    return summary;

  } catch (error) {
    console.error('❌ Error getting admin activity summary:', error);
    return {
      totalActions: 0,
      usersCreated: 0,
      rolesUpdated: 0,
      statusUpdated: 0,
      usersDeleted: 0,
      passwordResets: 0,
      recentActions: []
    };
  }
};

// Export utility functions
export default {
  createNewUser,
  updateUserRole,
  updateUserStatus,
  deleteUserAccount,
  sendPasswordReset,
  getAllUsers,
  batchUpdateUsers,
  getUserStatistics,
  searchUsers,
  getAuditLogs,
  validateUserPermission,
  getUserById,
  updateUserProfile,
  getAdminActivitySummary,
  ROLE_DEFINITIONS
};