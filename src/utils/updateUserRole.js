// src/utils/updateUserRole.js
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Complete role definitions matching your three-tier system
const ROLE_DEFINITIONS = {
  systemAdmin: {
    name: "System Administrator", 
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
      canViewSystemLogs: true,
      canCreateBookings: true,
      canUpdateProfile: true,
      canViewOwnBookings: true
    },
    level: 1
  },
  courtAdmin: {
    name: "Court Administrator",
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
      canViewBookingReports: true,
      canCreateBookings: true,
      canUpdateProfile: true,
      canViewOwnBookings: true
    },
    level: 2
  },
  user: {
    name: "Regular User",
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

// Update any user to any role
export const updateUserRole = async (userId, newRole) => {
  try {
    if (!ROLE_DEFINITIONS[newRole]) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    console.log(`🔄 Updating user ${userId} to ${newRole} role...`);
    
    // Get current user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const userData = userDoc.data();
    const roleData = ROLE_DEFINITIONS[newRole];
    
    // Update user document with new role and permissions
    await updateDoc(userRef, {
      role: newRole,
      permissions: roleData.permissions,
      updatedAt: new Date(),
      metadata: {
        ...userData.metadata,
        lastRoleChange: new Date(),
        previousRole: userData.role || 'user',
        roleChangedBy: 'system' // In production, track who made the change
      }
    });
    
    console.log(`✅ Successfully updated ${userData.email} to ${newRole}`);
    return { 
      success: true, 
      message: `User ${userData.email} successfully updated to ${roleData.name}` 
    };
    
  } catch (error) {
    console.error(`❌ Error updating user role:`, error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Specific function to upgrade to Court Admin
export const updateUserToCourtAdmin = async (userId) => {
  return await updateUserRole(userId, 'courtAdmin');
};

// Specific function to upgrade to System Admin  
export const updateUserToSystemAdmin = async (userId) => {
  return await updateUserRole(userId, 'systemAdmin');
};

// Downgrade user to regular user
export const downgradeToUser = async (userId) => {
  return await updateUserRole(userId, 'user');
};

// Get user's current role and permissions
export const getUserRoleInfo = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    return {
      success: true,
      role: userData.role || 'user',
      permissions: userData.permissions || {},
      email: userData.email,
      username: userData.username
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Batch update multiple users (for migration)
export const batchUpdateUserRoles = async (userUpdates) => {
  // userUpdates = [{ userId: 'abc', role: 'courtAdmin' }, ...]
  try {
    const results = [];
    
    for (const update of userUpdates) {
      const result = await updateUserRole(update.userId, update.role);
      results.push({ ...update, ...result });
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      success: failed === 0,
      message: `Updated ${successful} users successfully, ${failed} failed`,
      results
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};