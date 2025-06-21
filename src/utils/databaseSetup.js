// src/utils/databaseSetup.js
// Automated script to set up roles collection and update users
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';

// Define role permissions
const ROLE_DEFINITIONS = {
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

// Step 1.1: Create Roles Collection
export const createRolesCollection = async () => {
  try {
    console.log('🔄 Creating roles collection...');
    
    const batch = writeBatch(db);
    
    for (const [roleId, roleData] of Object.entries(ROLE_DEFINITIONS)) {
      const roleRef = doc(db, 'roles', roleId);
      batch.set(roleRef, roleData);
      console.log(`✅ Prepared role: ${roleId}`);
    }
    
    await batch.commit();
    console.log('🎉 Roles collection created successfully!');
    
    return { success: true, message: 'Roles collection created successfully!' };
  } catch (error) {
    console.error('❌ Error creating roles collection:', error);
    return { success: false, error: error.message };
  }
};

// Step 1.2: Update Existing Users Collection
export const updateExistingUsers = async () => {
  try {
    console.log('🔄 Updating existing users...');
    
    // Get all existing users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    let updateCount = 0;
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if user already has the new structure
      if (!userData.role || !userData.permissions || !userData.status) {
        console.log(`🔄 Updating user: ${userData.email}`);
        
        // Default role assignment (can be changed later)
        const defaultRole = 'user';
        const userRef = doc(db, 'users', userId);
        
        batch.update(userRef, {
          role: userData.role || defaultRole,
          permissions: userData.permissions || ROLE_DEFINITIONS[defaultRole].permissions,
          status: userData.status || 'active',
          isFirstLogin: userData.isFirstLogin !== undefined ? userData.isFirstLogin : false,
          metadata: {
            lastPasswordChange: userData.metadata?.lastPasswordChange || new Date(),
            ...userData.metadata
          }
        });
        
        updateCount++;
      } else {
        console.log(`⏭️ User ${userData.email} already has new structure, skipping...`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`🎉 Updated ${updateCount} users successfully!`);
    } else {
      console.log('ℹ️ No users needed updating.');
    }
    
    return { 
      success: true, 
      message: `Updated ${updateCount} users successfully!`,
      updatedCount: updateCount
    };
  } catch (error) {
    console.error('❌ Error updating existing users:', error);
    return { success: false, error: error.message };
  }
};

// Create a specific System Admin user
export const createSystemAdmin = async (email, username = 'System Administrator') => {
  try {
    console.log(`🔄 Creating system admin: ${email}`);
    
    // Find user by email (you'll need to implement this lookup)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let targetUser = null;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email === email) {
        targetUser = { id: doc.id, ...userData };
      }
    });
    
    if (!targetUser) {
      throw new Error(`User with email ${email} not found`);
    }
    
    // Update to system admin
    await updateDoc(doc(db, 'users', targetUser.id), {
      role: 'systemAdmin',
      permissions: ROLE_DEFINITIONS.systemAdmin.permissions,
      username: username,
      status: 'active'
    });
    
    console.log(`🎉 Created system admin: ${email}`);
    return { success: true, message: `Created system admin: ${email}` };
  } catch (error) {
    console.error('❌ Error creating system admin:', error);
    return { success: false, error: error.message };
  }
};

// Full setup - Run everything
export const runFullDatabaseSetup = async () => {
  try {
    console.log('🚀 Starting full database setup...');
    
    // Step 1: Create roles collection
    const rolesResult = await createRolesCollection();
    if (!rolesResult.success) {
      throw new Error(`Roles creation failed: ${rolesResult.error}`);
    }
    
    // Step 2: Update existing users
    const usersResult = await updateExistingUsers();
    if (!usersResult.success) {
      throw new Error(`Users update failed: ${usersResult.error}`);
    }
    
    console.log('🎉 Full database setup completed successfully!');
    return {
      success: true,
      message: 'Database setup completed successfully!',
      details: {
        rolesCreated: true,
        usersUpdated: usersResult.updatedCount
      }
    };
  } catch (error) {
    console.error('❌ Full database setup failed:', error);
    return { success: false, error: error.message };
  }
};

// Utility function to check setup status
export const checkSetupStatus = async () => {
  try {
    console.log('🔍 Checking setup status...');
    
    // Check roles collection
    const rolesSnapshot = await getDocs(collection(db, 'roles'));
    const rolesExist = rolesSnapshot.size > 0;
    
    // Check users structure
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let usersWithNewStructure = 0;
    let totalUsers = usersSnapshot.size;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role && userData.permissions && userData.status) {
        usersWithNewStructure++;
      }
    });
    
    const status = {
      rolesCollection: rolesExist,
      totalUsers,
      usersWithNewStructure,
      setupComplete: rolesExist && (usersWithNewStructure === totalUsers)
    };
    
    console.log('📊 Setup status:', status);
    return status;
  } catch (error) {
    console.error('❌ Error checking setup status:', error);
    return { error: error.message };
  }
};